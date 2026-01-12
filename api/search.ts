import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import * as cheerio from "cheerio";

interface SearchResult {
	name?: string;
	cardNumber?: string;
	price?: string;
	image?: string;
	link?: string;
	color?: string;
	// Keep old fields for backward compatibility
	title?: string;
	condition?: string;
	[key: string]: unknown;
}

// Function to extract name from text using multiple patterns
function extractNameFromText(text: string): string {
	// Pattern 1: English letters (and dashes) followed by Japanese characters
	// Examples: "P-SEC ゴール・D・ロジャー(パラレル)(スーパーパラレル)", "SEC モンキー・D・ルフィ"
	const englishFirstPattern = /[A-Za-z]+(?:-[A-Za-z]+)?\s+[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF・！!]+(?:\([^)]*\))*/;
	let match = text.match(englishFirstPattern);
	if (match && match[0]) {
		return match[0];
	}

	// Pattern 2: Dash followed by Japanese characters
	// Example: "- ドン!!カード(ONE PIECE DAY'24)"
	const dashFirstPattern = /-\s+[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF・！!]+(?:\([^)]*\))*/;
	match = text.match(dashFirstPattern);
	if (match && match[0]) {
		return match[0];
	}

	// Pattern 3: Japanese characters first (fallback)
	const japaneseFirstPattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF・！!]+(?:\([^)]*\))*/;
	match = text.match(japaneseFirstPattern);
	if (match && match[0]) {
		return match[0];
	}

	return "";
}

// Function to scrape individual card page for detailed data
async function scrapeCardPage(cardLink: string): Promise<Partial<SearchResult>> {
	console.log(`\n🔍 Starting to scrape card page: ${cardLink}`);
	try {
		const response = await axios.get(cardLink, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			},
		});

		const html = response.data;
		const $ = cheerio.load(html);

		const cardData: Partial<SearchResult> = {};

		// Try to extract card image (look for main card image)
		const image =
			$('img[src*="card"], img[class*="card"], img[alt*="OP"], .card-image img, .product-image img')
				.first()
				.attr("src") ||
			$('img[src*="card"], img[class*="card"], img[alt*="OP"], .card-image img, .product-image img')
				.first()
				.attr("data-src") ||
			$('img[src*="card"], img[class*="card"], img[alt*="OP"], .card-image img, .product-image img')
				.first()
				.attr("data-lazy-src");

		if (image) {
			cardData.image = image.startsWith("http") ? image : `https://yuyu-tei.jp${image}`;
		}

		// Try to extract price - look for elements containing 円 (yen symbol)
		console.log(`\n=== EXTRACTING PRICE for ${cardLink} ===`);

		// Get all text from the page first
		const bodyText = $("body").text();
		console.log("Body text length:", bodyText.length);

		// Find all instances of prices with 円 (handle spaces: "2,480 円" or "2,480円")
		const allPrices = bodyText.match(/[\d,]+\s*円/g) || [];
		console.log("All prices found with 円:", allPrices);

		// Filter to find valid product prices (>= 10 yen)
		const validPrices = allPrices.filter((p) => {
			const numStr = p.replace(/[^\d,]/g, "").replace(/,/g, "");
			const num = parseInt(numStr);
			return num >= 10;
		});
		console.log("Valid prices (>= 10 yen):", validPrices);

		let price = "";

		// First try specific price selectors
		const priceElements = $('.price, [class*="price"], [class*="cost"], [class*="yen"]').filter((i, el) =>
			$(el).text().includes("円")
		);

		if (priceElements.length > 0) {
			const priceText = priceElements.first().text().trim();
			const priceMatch = priceText.match(/[\d,]+\s*円/)?.[0];
			if (priceMatch) {
				const numStr = priceMatch.replace(/[^\d,]/g, "").replace(/,/g, "");
				const num = parseInt(numStr);
				if (num >= 10) {
					price = priceMatch.replace(/\s+/g, ""); // Remove spaces: "2,480 円" -> "2,480円"
					console.log(`Found price in price selector: ${price}`);
				}
			}
		}

		// If not found, search all elements that contain 円
		if (!price) {
			const elementsWithYen = $("*").filter((i, el) => {
				const text = $(el).text();
				return text.includes("円") && /[\d,]+\s*円/.test(text);
			});

			console.log(`Found ${elementsWithYen.length} elements containing 円`);

			// Find the first valid price (>= 10 yen)
			for (let i = 0; i < elementsWithYen.length && !price; i++) {
				const text = $(elementsWithYen[i]).text();
				const priceMatch = text.match(/[\d,]+\s*円/)?.[0];
				if (priceMatch) {
					const numStr = priceMatch.replace(/[^\d,]/g, "").replace(/,/g, "");
					const num = parseInt(numStr);
					if (num >= 10) {
						price = priceMatch.replace(/\s+/g, ""); // Remove spaces
						console.log(`Found price in element ${i}: ${price}`);
						break;
					}
				}
			}
		}

		// If still not found, use the first valid price from body text
		if (!price && validPrices.length > 0) {
			price = validPrices[0].replace(/\s+/g, ""); // Remove spaces
			console.log(`Using first valid price from body text: ${price}`);
		}

		// Clean up the price - extract just the number and 円 (no spaces)
		if (price) {
			const priceMatch = price.match(/[\d,]+\s*円/)?.[0];
			if (priceMatch) {
				cardData.price = priceMatch.replace(/\s+/g, ""); // Remove spaces: "2,480 円" -> "2,480円"
				console.log(`✓ Final price set: ${cardData.price}`);
			}
		} else {
			console.log(`✗ No price found`);
			console.log("Body text sample (first 3000 chars):", bodyText.substring(0, 3000));
		}

		console.log(`=== END PRICE EXTRACTION ===\n`);

		// Try to extract card name from specific element structure
		// The name is in an h3 element inside a div with id="power" and class="power mt-4"
		console.log(`\n=== EXTRACTING NAME from #power h3 element ===`);

		let name = "";

		// First, try to find the exact element structure: div#power > h3
		const powerDiv = $("#power.power");
		if (powerDiv.length > 0) {
			const h3Element = powerDiv.find("h3").first();
			if (h3Element.length > 0) {
				name = h3Element.text();
				console.log(`Found name in #power h3: ${name}`);
			}
		}

		// Fallback: try other variations of the selector
		if (!name) {
			// Try just id="power"
			const powerById = $("#power");
			if (powerById.length > 0) {
				const h3Element = powerById.find("h3").first();
				if (h3Element.length > 0) {
					name = h3Element.text();
					console.log(`Found name in #power (by ID only): ${name}`);
				}
			}
		}

		// Fallback: try class="power"
		if (!name) {
			const powerByClass = $(".power");
			if (powerByClass.length > 0) {
				const h3Element = powerByClass.find("h3").first();
				if (h3Element.length > 0) {
					name = h3Element.text();
					console.log(`Found name in .power h3: ${name}`);
				}
			}
		}

		// Fallback: pattern matching if specific element not found
		if (!name) {
			console.log(`Specific element not found, falling back to pattern matching...`);
			const fullBodyText = $("body").text();
			name = extractNameFromText(fullBodyText);
			if (name) {
				console.log(`Found name via pattern matching: ${name}`);
			}
		}

		// Set the name without any trimming or splitting
		if (name) {
			cardData.name = name;
			console.log(`✓ Name extracted: ${cardData.name}`);
		} else {
			console.log(`✗ No name found`);
		}

		console.log(`=== END NAME EXTRACTION ===\n`);

		// Try to extract card number
		const cardNumber =
			$('.code, .number, [class*="code"], [class*="number"]').first().text().trim() ||
			$("body")
				.text()
				.match(/(?:OP|ST|PRB|EB|P)\d+-\d+/)?.[0] || // Pattern like OP09-118, ST01-001, P01-001
			$("body")
				.text()
				.match(/(?:OP|ST|PRB|EB|P)-\d+/)?.[0] || // Pattern like P-101, OP-101
			$("body")
				.text()
				.match(/\d+-\d+/)?.[0]; // Pattern like 09-118

		if (cardNumber) {
			cardData.cardNumber = cardNumber;
		}

		// Helper function to extract table values
		const extractTableValue = (label: string, validationRegex?: RegExp): string => {
			let value = "";

			// Look for table rows (tr) or table cells (td) that contain the label
			const labelElements = $("tr, td, th").filter((i, el) => {
				const text = $(el).text().trim();
				return text.includes(label) && text.length < 100;
			});

			// Try to extract value from these elements
			labelElements.each((i, el) => {
				if (value) return; // Already found
				const text = $(el).text().trim();
				// Look for pattern like "label: value" or "label value"
				const valueMatch =
					text.match(new RegExp(`${label}[：:]\\s*([^\\s\\n]+)`)) || text.match(new RegExp(`${label}\\s+([^\\s\\n]+)`));
				if (valueMatch && valueMatch[1]) {
					const extractedValue = valueMatch[1].trim();
					if (!validationRegex || validationRegex.test(extractedValue)) {
						value = extractedValue;
					}
				} else {
					// Try to find the next cell/sibling that might contain the value
					const $el = $(el);
					const $nextCell = $el.next("td, th");
					if ($nextCell.length > 0) {
						const nextText = $nextCell.text().trim();
						if (nextText && (!validationRegex || validationRegex.test(nextText))) {
							value = nextText;
						}
					}
				}
			});

			// Alternative: Look for table structure where first column is label and second is the value
			if (!value) {
				$("table tr, table td").each((i, el) => {
					if (value) return;
					const $el = $(el);
					const text = $el.text().trim();
					if (text === label || text.includes(`${label}：`) || text.includes(`${label}:`)) {
						// Get the next cell or the text after label
						const $next = $el.next("td, th");
						if ($next.length > 0) {
							const extractedValue = $next.text().trim();
							if (extractedValue && (!validationRegex || validationRegex.test(extractedValue))) {
								value = extractedValue;
							}
						}
					}
				});
			}

			// Fallback: Search entire body text for pattern
			if (!value) {
				const bodyText = $("body").text();
				const valueMatch =
					bodyText.match(new RegExp(`${label}[：:]\\s*([^\\s\\n]+)`)) ||
					bodyText.match(new RegExp(`${label}\\s+([^\\s\\n]+)`));
				if (valueMatch && valueMatch[1]) {
					const potentialValue = valueMatch[1].trim();
					if (!validationRegex || validationRegex.test(potentialValue)) {
						value = potentialValue;
					}
				}
			}

			return value;
		};

		// Extract all table values
		console.log(`\n=== EXTRACTING TABLE VALUES ===`);

		// Extract color (色)
		const color = extractTableValue("色", /^(赤|青|緑|黄|紫|黒|赤色|青色|緑色|黄色|紫色|黒色)$/);
		if (color) {
			cardData.color = color;
			console.log(`✓ Color extracted: ${cardData.color}`);
		} else {
			console.log(`✗ No color found`);
		}

		console.log(`=== END TABLE EXTRACTION ===\n`);

		// Log for debugging
		console.log(`Scraped card page ${cardLink}:`, {
			hasImage: !!cardData.image,
			hasPrice: !!cardData.price,
			hasName: !!cardData.name,
			hasCardNumber: !!cardData.cardNumber,
			hasColor: !!cardData.color,
		});

		return cardData;
	} catch (error) {
		console.error(`Error scraping card page ${cardLink}:`, error);
		return {}; // Return empty object on error
	}
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		// Enable CORS
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
		res.setHeader("Access-Control-Allow-Headers", "Content-Type");

		if (req.method === "OPTIONS") {
			res.status(200).end();
			return;
		}

		// Only allow GET requests
		if (req.method !== "GET") {
			return res.status(405).json({ error: "Method not allowed" });
		}

		console.log("\n🚀 === SEARCH REQUEST RECEIVED ===");
		console.log("Query params:", req.query);
		const searchWord = req.query.search_word as string;
		console.log(`Search word: ${searchWord}`);

		if (!searchWord) {
			return res.status(400).json({ error: "search_word parameter is required" });
		}

		const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(searchWord)}`;
		console.log(`Fetching search results from: ${url}`);

		// Fetch the HTML page
		const response = await axios.get(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			},
		});

		const html = response.data;

		// Log HTML length for debugging (not the full HTML to avoid log size issues)
		console.log(`HTML received, length: ${html.length}`);

		const $ = cheerio.load(html);

		// Parse the HTML to extract data
		// Based on yuyu-tei.jp structure, cards are likely in list items or card containers
		const results: SearchResult[] = [];

		// Try various selectors that might match yuyu-tei.jp's card structure
		// Common patterns: .card, .item, li with card data, etc.
		const cardSelectors = [
			'li[class*="card"]',
			'div[class*="card"]',
			".item-card",
			".product-item",
			"li.item",
			"div.item",
			'[class*="list-item"]',
			"[data-product-id]",
			"article",
			"section > div",
		];

		let foundCards = false;

		for (const selector of cardSelectors) {
			$(selector).each((index, element) => {
				const $el = $(element);

				// Try to find image
				const image =
					$el.find("img").first().attr("src") ||
					$el.find("img").first().attr("data-src") ||
					$el.find("img").first().attr("data-lazy-src");

				// Try to find name/title
				const name =
					$el.find('.name, .title, h2, h3, h4, [class*="name"], [class*="title"]').first().text().trim() ||
					$el.find("a").first().text().trim();

				// Try to find card number/code
				const cardNumber =
					$el.find('.code, .number, [class*="code"], [class*="number"]').first().text().trim() ||
					$el.text().match(/(?:OP|ST|PRB|EB|P)\d+-\d+/)?.[0] || // Pattern like OP09-118, ST01-001, P01-001
					$el.text().match(/(?:OP|ST|PRB|EB|P)-\d+/)?.[0] || // Pattern like P-101, OP-101
					$el.text().match(/\d+-\d+/)?.[0]; // Pattern like 09-118

				// Try to find price
				const price =
					$el.find('.price, [class*="price"], [class*="cost"], [class*="yen"]').first().text().trim() ||
					$el.text().match(/[\d,]+円/)?.[0] || // Pattern like "2,480円"
					$el.text().match(/¥[\d,]+/)?.[0]; // Pattern like "¥2,480"

				// Try to find link
				const link = $el.find("a").first().attr("href");

				// Only add if we found at least an image or name
				if (image || name) {
					const result: SearchResult = {
						name: name || undefined,
						cardNumber: cardNumber || undefined,
						price: price || undefined,
						image: image ? (image.startsWith("http") ? image : `https://yuyu-tei.jp${image}`) : undefined,
						link: link ? (link.startsWith("http") ? link : `https://yuyu-tei.jp${link}`) : undefined,
						// Keep old fields for backward compatibility
						title: name || undefined,
					};

					results.push(result);
					foundCards = true;
				}
			});

			if (foundCards) break;
		}

		// If no cards found with specific selectors, try a more generic approach
		if (!foundCards) {
			console.log("No cards found with specific selectors, trying generic approach...");

			// Look for all images that might be card images
			$('img[src*="card"], img[src*="product"], img[alt*="OP"], img').each((index, element) => {
				const $img = $(element);
				const $parent = $img.closest("li, div, article, section");

				if ($parent.length > 0) {
					const image = $img.attr("src") || $img.attr("data-src") || $img.attr("data-lazy-src");
					const name = $img.attr("alt") || $parent.find("a").first().text().trim();
					const link = $parent.find("a").first().attr("href");
					const price = $parent.text().match(/[\d,]+円/)?.[0];
					const cardNumber =
						$parent.text().match(/(?:OP|ST|PRB|EB|P)\d+-\d+/)?.[0] || // Pattern like OP09-118, P01-001
						$parent.text().match(/(?:OP|ST|PRB|EB|P)-\d+/)?.[0] || // Pattern like P-101, OP-101
						$parent.text().match(/\d+-\d+/)?.[0]; // Pattern like 09-118

					if (image || name) {
						results.push({
							name: name || undefined,
							cardNumber: cardNumber || undefined,
							price: price || undefined,
							image: image ? (image.startsWith("http") ? image : `https://yuyu-tei.jp${image}`) : undefined,
							link: link ? (link.startsWith("http") ? link : `https://yuyu-tei.jp${link}`) : undefined,
							title: name || undefined,
						});
					}
				}
			});
		}

		// Filter to only include items with cardNumber and link that includes "opc/card" or "/promo"
		console.log("\n=== FILTERING RESULTS ===");
		console.log(`Total results before filtering: ${results.length}`);

		const filteredResults = results.filter((result) => {
			const hasCardNumber = result.cardNumber && result.cardNumber.trim() !== "";
			const hasLink = result.link && result.link.trim() !== "";
			const hasValidLink = hasLink && (result.link!.includes("opc/card") || result.link!.includes("/promo"));

			if (!hasCardNumber) {
				console.log(`❌ Filtered out (no cardNumber): "${result.name || "unnamed"}" - link: ${result.link || "none"}`);
				return false;
			}

			if (!hasValidLink) {
				console.log(
					`❌ Filtered out (invalid link): "${result.name || "unnamed"}" - cardNumber: ${result.cardNumber} - link: ${
						result.link || "none"
					}`
				);
				return false;
			}

			console.log(`✓ Kept: "${result.name || "unnamed"}" - cardNumber: ${result.cardNumber} - link: ${result.link}`);
			return true;
		});

		// Remove duplicates based on link (keep first occurrence)
		const seenLinks = new Set<string>();
		const uniqueResults = filteredResults.filter((result) => {
			if (!result.link) return false;
			if (seenLinks.has(result.link)) {
				return false; // Duplicate, skip
			}
			seenLinks.add(result.link);
			return true; // First occurrence, keep
		});

		// Log parsed results for debugging
		console.log("=== PARSED RESULTS ===");
		console.log(`Found ${results.length} total results`);
		console.log(
			`Filtered to ${filteredResults.length} results with cardNumber and link containing "opc/card" or "/promo"`
		);
		console.log(`After deduplication: ${uniqueResults.length} unique results`);

		// Scrape individual card pages for detailed data
		console.log("=== SCRAPING INDIVIDUAL CARD PAGES ===");
		const detailedResults = await Promise.all(
			uniqueResults.map(async (result) => {
				if (!result.link) return result;

				const cardData = await scrapeCardPage(result.link);

				// Merge scraped data with existing result (scraped data takes precedence)
				const merged = {
					...result,
					...cardData,
					// Keep original link
					link: result.link,
					// Keep original cardNumber if scraped one is not found
					cardNumber: cardData.cardNumber || result.cardNumber,
					// Explicitly ensure price is set from scraped data
					price: cardData.price || result.price,
				};

				console.log(`Merged result for ${result.link}:`, {
					originalPrice: result.price,
					scrapedPrice: cardData.price,
					finalPrice: merged.price,
				});

				return merged;
			})
		);

		console.log(`Scraped ${detailedResults.length} card pages`);
		if (detailedResults.length > 0) {
			console.log("First detailed result:", JSON.stringify(detailedResults[0], null, 2));
			console.log(
				"Sample of detailed results:",
				detailedResults.slice(0, 3).map((r) => ({
					name: r.name,
					cardNumber: r.cardNumber,
					price: r.price,
					hasImage: !!r.image,
					hasLink: !!r.link,
					link: r.link,
				}))
			);
		}
		console.log("=== END SCRAPING ===");

		// Return response (without rawHtml to avoid size issues)
		return res.json({
			searchWord,
			url,
			count: detailedResults.length,
			results: detailedResults,
		});
	} catch (error) {
		console.error("Error in handler:", error);
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		const errorStack = error instanceof Error ? error.stack : undefined;
		
		console.error("Full error details:", {
			message: errorMessage,
			stack: errorStack,
			error: String(error)
		});
		
		// Make sure we haven't already sent a response
		if (!res.headersSent) {
			return res.status(500).json({
				error: "Failed to fetch data",
				message: errorMessage,
				...(process.env.NODE_ENV === "development" && { stack: errorStack })
			});
		}
	}
}
