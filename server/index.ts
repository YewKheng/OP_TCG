import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface SearchResult {
	name?: string;
	cardNumber?: string;
	price?: string;
	image?: string;
	link?: string;
	// Keep old fields for backward compatibility
	title?: string;
	condition?: string;
	[key: string]: unknown;
}

// Function to scrape individual card page for detailed data
async function scrapeCardPage(cardLink: string): Promise<Partial<SearchResult>> {
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

		// Try to extract price
		const price =
			$('.price, [class*="price"], [class*="cost"], [class*="yen"]').first().text().trim() ||
			$("body")
				.text()
				.match(/[\d,]+円/)?.[0] ||
			$("body")
				.text()
				.match(/¥[\d,]+/)?.[0];

		if (price) {
			cardData.price = price;
		}

		// Try to extract card name
		const name =
			$(".name, .title, h1, h2, [class*='name'], [class*='title']").first().text().trim() ||
			$('meta[property="og:title"]').attr("content") ||
			$("title").text().trim();

		if (name) {
			cardData.name = name;
		}

		// Try to extract card number
		const cardNumber =
			$('.code, .number, [class*="code"], [class*="number"]').first().text().trim() ||
			$("body")
				.text()
				.match(/OP\d+-\d+/)?.[0] ||
			$("body")
				.text()
				.match(/\d+-\d+/)?.[0];

		if (cardNumber) {
			cardData.cardNumber = cardNumber;
		}

		// Log for debugging
		console.log(`Scraped card page ${cardLink}:`, {
			hasImage: !!cardData.image,
			hasPrice: !!cardData.price,
			hasName: !!cardData.name,
			hasCardNumber: !!cardData.cardNumber,
		});

		return cardData;
	} catch (error) {
		console.error(`Error scraping card page ${cardLink}:`, error);
		return {}; // Return empty object on error
	}
}

app.get("/api/search", async (req, res) => {
	try {
		const searchWord = req.query.search_word as string;

		if (!searchWord) {
			return res.status(400).json({ error: "search_word parameter is required" });
		}

		const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(searchWord)}`;

		// Fetch the HTML page
		const response = await axios.get(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			},
		});

		const html = response.data;

		// Log the full HTML to console for inspection
		console.log("=== FULL HTML FROM yuyu-tei.jp ===");
		console.log(html);
		console.log("=== END OF HTML ===");

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
					$el.text().match(/OP\d+-\d+/)?.[0] || // Pattern like OP09-118
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
					const cardNumber = $parent.text().match(/OP\d+-\d+/)?.[0] || $parent.text().match(/\d+-\d+/)?.[0];

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

		// Filter to only include items with cardNumber and link that includes "opc/card"
		const filteredResults = results.filter(
			(result) =>
				result.cardNumber && result.cardNumber.trim() !== "" && result.link && result.link.includes("opc/card")
		);

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
		console.log(`Filtered to ${filteredResults.length} results with cardNumber and link containing "opc/card"`);
		console.log(`After deduplication: ${uniqueResults.length} unique results`);

		// Scrape individual card pages for detailed data
		console.log("=== SCRAPING INDIVIDUAL CARD PAGES ===");
		const detailedResults = await Promise.all(
			uniqueResults.map(async (result) => {
				if (!result.link) return result;

				const cardData = await scrapeCardPage(result.link);

				// Merge scraped data with existing result (scraped data takes precedence)
				return {
					...result,
					...cardData,
					// Keep original link
					link: result.link,
					// Keep original cardNumber if scraped one is not found
					cardNumber: cardData.cardNumber || result.cardNumber,
				};
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

		res.json({
			searchWord,
			url,
			count: detailedResults.length,
			results: detailedResults,
			rawHtml: html, // Return full HTML for inspection
			htmlLength: html.length,
		});
	} catch (error) {
		console.error("Error fetching data:", error);
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		res.status(500).json({
			error: "Failed to fetch data",
			message: errorMessage,
		});
	}
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
