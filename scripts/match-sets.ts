#!/usr/bin/env node
/**
 * Match scraped data against the new URL format with vers[] parameter
 * Stores matched results in sets.json with "SET" suffix
 *
 * Usage:
 *   npm run match-sets
 */

import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import * as cheerio from "cheerio";

interface SearchResult {
	name?: string;
	cardNumber?: string;
	price?: string;
	image?: string;
	link?: string;
	color?: string;
	scrapedAt?: string;
	[key: string]: unknown;
}

interface ScrapedDataEntry {
	results: SearchResult[];
	lastScraped: string;
	count: number;
}

interface ScrapedData {
	[searchWord: string]: ScrapedDataEntry;
}

interface SetsData {
	[searchWord: string]: ScrapedDataEntry;
}

const DATA_DIR = path.join(process.cwd(), "data");
const SCRAPED_DATA_FILE = path.join(DATA_DIR, "scraped-data.json");
const SETS_DATA_FILE = path.join(DATA_DIR, "sets-data.json");

// Load scraped data
function loadScrapedData(): ScrapedData {
	if (fs.existsSync(SCRAPED_DATA_FILE)) {
		try {
			const content = fs.readFileSync(SCRAPED_DATA_FILE, "utf-8");
			return JSON.parse(content);
		} catch (error) {
			console.error("Error loading scraped data file:", error);
			return {};
		}
	}
	return {};
}

// Load sets data
function loadSetsData(): SetsData {
	if (fs.existsSync(SETS_DATA_FILE)) {
		try {
			const content = fs.readFileSync(SETS_DATA_FILE, "utf-8");
			return JSON.parse(content);
		} catch (error) {
			console.error("Error loading sets data file:", error);
			return {};
		}
	}
	return {};
}

// Save sets data
function saveSetsData(data: SetsData): void {
	fs.writeFileSync(SETS_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Fetch URL directly
async function fetchUrl(url: string): Promise<string> {
	console.log(`Fetching: ${url}`);

	// Add random delay to avoid rate limiting
	const delay = Math.random() * 1000 + 500; // 500-1500ms
	await new Promise((resolve) => setTimeout(resolve, delay));

	const response = await axios.get(url, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
			"Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
			"Accept-Encoding": "gzip, deflate, br",
			Referer: "https://yuyu-tei.jp/",
			"Cache-Control": "no-cache",
			Pragma: "no-cache",
			"Sec-Fetch-Dest": "document",
			"Sec-Fetch-Mode": "navigate",
			"Sec-Fetch-Site": "same-origin",
			"Sec-Fetch-User": "?1",
			"Upgrade-Insecure-Requests": "1",
		},
		timeout: 30000,
		validateStatus: (status) => status < 500,
		maxRedirects: 5,
	});

	if (response.status === 403) {
		throw new Error(
			"403 Forbidden: The website is blocking requests. Consider running locally or using a different hosting service."
		);
	}

	return response.data;
}

// Scrape individual card page
async function scrapeCardPage(cardLink: string): Promise<Partial<SearchResult>> {
	try {
		const html = await fetchUrl(cardLink);
		const $ = cheerio.load(html);

		const cardData: Partial<SearchResult> = {};

		// Extract image
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

		// Extract price
		const bodyText = $("body").text();
		const allPrices = bodyText.match(/[\d,]+\s*円/g) || [];
		const validPrices = allPrices.filter((p) => {
			const numStr = p.replace(/[^\d,]/g, "").replace(/,/g, "");
			const num = parseInt(numStr);
			return num >= 10;
		});

		let price = "";
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
					price = priceMatch.replace(/\s+/g, "");
				}
			}
		}

		if (!price) {
			const elementsWithYen = $("*").filter((i, el) => {
				const text = $(el).text();
				return text.includes("円") && /[\d,]+\s*円/.test(text);
			});

			for (let i = 0; i < elementsWithYen.length && !price; i++) {
				const text = $(elementsWithYen[i]).text();
				const priceMatch = text.match(/[\d,]+\s*円/)?.[0];
				if (priceMatch) {
					const numStr = priceMatch.replace(/[^\d,]/g, "").replace(/,/g, "");
					const num = parseInt(numStr);
					if (num >= 10) {
						price = priceMatch.replace(/\s+/g, "");
						break;
					}
				}
			}
		}

		if (!price && validPrices.length > 0) {
			price = validPrices[0].replace(/\s+/g, "");
		}

		if (price) {
			const priceMatch = price.match(/[\d,]+\s*円/)?.[0];
			if (priceMatch) {
				cardData.price = priceMatch.replace(/\s+/g, "");
			}
		}

		// Extract name
		let name = "";
		const powerDiv = $("#power.power");
		if (powerDiv.length > 0) {
			const h3Element = powerDiv.find("h3").first();
			if (h3Element.length > 0) {
				name = h3Element.text();
			}
		}

		if (!name) {
			const powerById = $("#power");
			if (powerById.length > 0) {
				const h3Element = powerById.find("h3").first();
				if (h3Element.length > 0) {
					name = h3Element.text();
				}
			}
		}

		if (!name) {
			const powerByClass = $(".power");
			if (powerByClass.length > 0) {
				const h3Element = powerByClass.find("h3").first();
				if (h3Element.length > 0) {
					name = h3Element.text();
				}
			}
		}

		if (!name) {
			const nameMatch = bodyText.match(/[A-Za-z]+(?:-[A-Za-z]+)?\s+[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF・！!]+/);
			if (nameMatch) {
				name = nameMatch[0];
			}
		}

		if (name) {
			cardData.name = name;
		}

		// Extract card number
		const cardNumber =
			$('.code, .number, [class*="code"], [class*="number"]').first().text().trim() ||
			$("body")
				.text()
				.match(/(?:OP|ST|PRB|EB|P)\d+-\d+/)?.[0] ||
			$("body")
				.text()
				.match(/(?:OP|ST|PRB|EB|P)-\d+/)?.[0] ||
			$("body")
				.text()
				.match(/\d+-\d+/)?.[0];

		if (cardNumber) {
			cardData.cardNumber = cardNumber;
		}

		// Extract color
		const extractTableValue = (label: string, validationRegex?: RegExp): string => {
			let value = "";
			const labelElements = $("tr, td, th").filter((i, el) => {
				const text = $(el).text().trim();
				return text.includes(label) && text.length < 100;
			});

			labelElements.each((i, el) => {
				if (value) return;
				const text = $(el).text().trim();
				const valueMatch =
					text.match(new RegExp(`${label}[：:]\\s*([^\\s\\n]+)`)) || text.match(new RegExp(`${label}\\s+([^\\s\\n]+)`));
				if (valueMatch && valueMatch[1]) {
					const extractedValue = valueMatch[1].trim();
					if (!validationRegex || validationRegex.test(extractedValue)) {
						value = extractedValue;
					}
				} else {
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

			return value;
		};

		const color = extractTableValue("色", /^(赤|青|緑|黄|紫|黒|赤色|青色|緑色|黄色|紫色|黒色)$/);
		if (color) {
			cardData.color = color;
		}

		return cardData;
	} catch (error) {
		console.error(`Error scraping card page ${cardLink}:`, error);
		return {};
	}
}

// Scrape search results using new URL format
async function scrapeWithVersParam(searchWord: string): Promise<SearchResult[]> {
	console.log(`\n🚀 Scraping with vers[] parameter: "${searchWord}"`);
	const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=&vers[]=${encodeURIComponent(
		searchWord
	)}&rare=&type=&kizu=0`;

	try {
		const html = await fetchUrl(url);
		const $ = cheerio.load(html);

		const results: SearchResult[] = [];

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

				// Only process items that have a parent with class "card-product"
				if ($el.closest(".card-product").length === 0) {
					return; // Skip this element if not inside a card-product parent
				}

				// Filter out items inside carousel containers (newestCardList, recommendedItemList)
				if ($el.closest("#newestCardList, #recommendedItemList").length > 0) {
					return; // Skip this element
				}

				const image =
					$el.find("img").first().attr("src") ||
					$el.find("img").first().attr("data-src") ||
					$el.find("img").first().attr("data-lazy-src");

				const name =
					$el.find('.name, .title, h2, h3, h4, [class*="name"], [class*="title"]').first().text().trim() ||
					$el.find("a").first().text().trim();

				const cardNumber =
					$el.find('.code, .number, [class*="code"], [class*="number"]').first().text().trim() ||
					$el.text().match(/(?:OP|ST|PRB|EB|P)\d+-\d+/)?.[0] ||
					$el.text().match(/(?:OP|ST|PRB|EB|P)-\d+/)?.[0] ||
					$el.text().match(/\d+-\d+/)?.[0];

				const price =
					$el.find('.price, [class*="price"], [class*="cost"], [class*="yen"]').first().text().trim() ||
					$el.text().match(/[\d,]+円/)?.[0] ||
					$el.text().match(/¥[\d,]+/)?.[0];

				const link = $el.find("a").first().attr("href");

				if (image || name) {
					results.push({
						name: name || undefined,
						cardNumber: cardNumber || undefined,
						price: price || undefined,
						image: image ? (image.startsWith("http") ? image : `https://yuyu-tei.jp${image}`) : undefined,
						link: link ? (link.startsWith("http") ? link : `https://yuyu-tei.jp${link}`) : undefined,
					});
					foundCards = true;
				}
			});

			if (foundCards) break;
		}

		// Filter results - allow cards with valid links
		const filteredResults = results.filter((result) => {
			const hasLink = result.link && result.link.trim() !== "";
			const hasValidLink = hasLink && (result.link!.includes("opc/card") || result.link!.includes("/promo"));
			return hasValidLink;
		});

		// Remove duplicates
		const seenLinks = new Set<string>();
		const uniqueResults = filteredResults.filter((result) => {
			if (!result.link) return false;
			if (seenLinks.has(result.link)) return false;
			seenLinks.add(result.link);
			return true;
		});

		console.log(`Found ${uniqueResults.length} unique cards from vers[] search`);

		// Scrape individual card pages for detailed info
		const BATCH_SIZE = 10;
		const DELAY_BETWEEN_BATCHES = 1000;
		const DELAY_BETWEEN_REQUESTS = 200;

		const detailedResults: SearchResult[] = [];

		for (let i = 0; i < uniqueResults.length; i += BATCH_SIZE) {
			const batch = uniqueResults.slice(i, i + BATCH_SIZE);
			console.log(
				`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(uniqueResults.length / BATCH_SIZE)}`
			);

			const batchResults = await Promise.all(
				batch.map(async (result, index) => {
					if (!result.link) return result;

					if (index > 0) {
						await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
					}

					try {
						const cardData = await scrapeCardPage(result.link);
						return {
							...result,
							...cardData,
							link: result.link,
							cardNumber: cardData.cardNumber || result.cardNumber,
							price: cardData.price || result.price,
							scrapedAt: new Date().toISOString(),
						};
					} catch (error) {
						console.error(`Error scraping ${result.link}:`, error);
						return { ...result, scrapedAt: new Date().toISOString() };
					}
				})
			);

			detailedResults.push(...batchResults);

			if (i + BATCH_SIZE < uniqueResults.length) {
				await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
			}
		}

		// Filter out cards without card numbers
		const finalResults = detailedResults.filter((result) => {
			return result.cardNumber && result.cardNumber.trim() !== "";
		});

		console.log(`✅ Successfully scraped ${finalResults.length} cards for "${searchWord}"`);
		return finalResults;
	} catch (error) {
		console.error(`❌ Error scraping "${searchWord}":`, error);
		throw error;
	}
}

// Normalize link for comparison (remove trailing slashes, normalize case)
function normalizeLink(link: string): string {
	if (!link) return "";
	let normalized = link.trim();
	// Remove trailing slash
	normalized = normalized.replace(/\/$/, "");
	// Convert to lowercase for case-insensitive comparison
	normalized = normalized.toLowerCase();
	return normalized;
}

// Match results by link only
function matchResults(existingResults: SearchResult[], newResults: SearchResult[]): SearchResult[] {
	const matched: SearchResult[] = [];
	const existingByLink = new Map<string, SearchResult>();

	// Index existing results by normalized link
	for (const result of existingResults) {
		if (result.link) {
			const normalizedLink = normalizeLink(result.link);
			existingByLink.set(normalizedLink, result);
		}
	}

	// Match new results against existing by link only
	for (const newResult of newResults) {
		if (newResult.link) {
			const normalizedLink = normalizeLink(newResult.link);
			if (existingByLink.has(normalizedLink)) {
				// Only include if the matched item has a cardNumber
				if (newResult.cardNumber && newResult.cardNumber.trim() !== "") {
					matched.push(newResult);
				}
			}
		}
	}

	return matched;
}

// Process a single search term
async function processSearchTerm(searchWord: string, scrapedData: ScrapedData, setsData: SetsData): Promise<boolean> {
	const setKey = `${searchWord}SET`;

	try {
		console.log(`\n🔍 Processing: ${searchWord}`);

		// Get ALL existing results from entire scraped-data.json (not just the searchWord entry)
		const allExistingResults: SearchResult[] = [];
		for (const key in scrapedData) {
			if (scrapedData[key]?.results) {
				allExistingResults.push(...scrapedData[key].results);
			}
		}
		console.log(`  Total existing results in scraped-data.json: ${allExistingResults.length}`);

		// Scrape with new URL format
		const newResults = await scrapeWithVersParam(searchWord);
		console.log(`  New results from vers[]: ${newResults.length}`);

		// Debug: Show sample links for debugging
		if (allExistingResults.length > 0 && newResults.length > 0) {
			console.log(`  Sample existing link: ${allExistingResults[0].link}`);
			console.log(`  Sample new link: ${newResults[0].link}`);
		}

		// Match results against entire scraped-data.json
		const matchedResults = matchResults(allExistingResults, newResults);
		console.log(`  Matched results: ${matchedResults.length}`);

		// Debug: Show why matches might be failing
		if (matchedResults.length === 0 && newResults.length > 0) {
			console.log(`  🔍 Debug: Checking why no matches...`);
			const sampleNew = newResults[0];
			if (sampleNew.link) {
				const normalized = normalizeLink(sampleNew.link);
				console.log(`    New link normalized: ${normalized}`);

				// Check if any existing result has matching link
				const existingSample = allExistingResults.find((r) => {
					if (!r.link) return false;
					const existingNormalized = normalizeLink(r.link);
					return normalized === existingNormalized;
				});
				if (existingSample) {
					console.log(`    ✅ Found potential match: ${existingSample.link}`);
				} else {
					console.log(`    ❌ No matching link found in existing results`);
				}
			}
		}

		// Store in sets.json
		if (matchedResults.length > 0) {
			setsData[setKey] = {
				results: matchedResults,
				lastScraped: new Date().toISOString(),
				count: matchedResults.length,
			};
			saveSetsData(setsData);
			console.log(`  ✅ Saved ${matchedResults.length} matched results as ${setKey}`);
			return true;
		} else {
			console.log(`  ⚠️  No matches found for ${searchWord}`);
			return false;
		}
	} catch (error) {
		console.error(`\n  ❌ Failed to process ${searchWord}`);
		console.error("Error:", error);
		return false;
	}
}

// Main execution
async function main() {
	const args = process.argv.slice(2);
	const specificTerm = args[0]; // Optional: specific search term to process

	console.log("🚀 Starting set matching process...\n");

	const scrapedData = loadScrapedData();
	const setsData = loadSetsData();

	// If specific term provided, process only that
	if (specificTerm) {
		const searchWord = specificTerm.toUpperCase();
		if (!scrapedData[searchWord]) {
			console.error(`❌ Search term "${searchWord}" not found in scraped-data.json`);
			console.log(`Available terms: ${Object.keys(scrapedData).slice(0, 10).join(", ")}...`);
			process.exit(1);
		}

		const success = await processSearchTerm(searchWord, scrapedData, setsData);
		process.exit(success ? 0 : 1);
	}

	// Otherwise, process all terms
	const searchTerms = Object.keys(scrapedData);
	console.log(`Found ${searchTerms.length} search terms in scraped-data.json\n`);

	let successCount = 0;
	let failCount = 0;

	for (let i = 0; i < searchTerms.length; i++) {
		const searchWord = searchTerms[i];
		const setKey = `${searchWord}SET`;
		const progress = `[${i + 1}/${searchTerms.length}]`;

		// Skip if already processed
		if (setsData[setKey]) {
			console.log(`${progress} ⏭️  Skipping ${searchWord} (already in sets.json)`);
			continue;
		}

		const success = await processSearchTerm(searchWord, scrapedData, setsData);
		if (success) {
			successCount++;
		} else {
			failCount++;
		}

		// Delay between searches
		if (i < searchTerms.length - 1) {
			const delay = 3000 + Math.random() * 2000; // 3-5 seconds
			console.log(`⏳ Waiting ${Math.round(delay / 1000)}s before next search...`);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	console.log("\n" + "=".repeat(50));
	console.log("✅ Set matching completed!");
	console.log(`Successfully processed: ${successCount} terms`);
	if (failCount > 0) {
		console.log(`Failed: ${failCount} terms`);
	}
	console.log("=".repeat(50));
}

main();
