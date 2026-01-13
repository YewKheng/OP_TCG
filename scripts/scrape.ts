#!/usr/bin/env node
/**
 * Standalone scraping script for yuyu-tei.jp
 * Run manually to update cached data
 *
 * Usage:
 *   npm run scrape <search_term>
 *   npm run scrape:all  (scrapes all common search terms)
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

interface ScrapedData {
	[searchWord: string]: {
		results: SearchResult[];
		lastScraped: string;
		count: number;
	};
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "scraped-data.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load existing data
function loadData(): ScrapedData {
	if (fs.existsSync(DATA_FILE)) {
		try {
			const content = fs.readFileSync(DATA_FILE, "utf-8");
			return JSON.parse(content);
		} catch (error) {
			console.error("Error loading data file:", error);
			return {};
		}
	}
	return {};
}

// Save data
function saveData(data: ScrapedData): void {
	fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Function to extract name from text
function extractNameFromText(text: string): string {
	const englishFirstPattern =
		/[A-Za-z]+(?:-[A-Za-z]+)?\s+[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF・！!]+(?:\([^)]*\))*/;
	let match = text.match(englishFirstPattern);
	if (match && match[0]) {
		return match[0];
	}

	const dashFirstPattern = /-\s+[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF・！!]+(?:\([^)]*\))*/;
	match = text.match(dashFirstPattern);
	if (match && match[0]) {
		return match[0];
	}

	const japaneseFirstPattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF・！!]+(?:\([^)]*\))*/;
	match = text.match(japaneseFirstPattern);
	if (match && match[0]) {
		return match[0];
	}

	return "";
}

// Fetch URL directly (no proxy needed for server-side scraping)
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
			"403 Forbidden: The website is blocking requests. GitHub Actions IP addresses may be blocked. Consider running locally or using a different hosting service."
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
			name = extractNameFromText(bodyText);
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

// Main scraping function
async function scrapeSearchTerm(searchWord: string): Promise<SearchResult[]> {
	console.log(`\n🚀 Scraping search term: "${searchWord}"`);
	const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(searchWord)}`;

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

		// Filter results
		const filteredResults = results.filter((result) => {
			const hasCardNumber = result.cardNumber && result.cardNumber.trim() !== "";
			const hasLink = result.link && result.link.trim() !== "";
			const hasValidLink = hasLink && (result.link!.includes("opc/card") || result.link!.includes("/promo"));
			return hasCardNumber && hasValidLink;
		});

		// Remove duplicates
		const seenLinks = new Set<string>();
		const uniqueResults = filteredResults.filter((result) => {
			if (!result.link) return false;
			if (seenLinks.has(result.link)) return false;
			seenLinks.add(result.link);
			return true;
		});

		console.log(`Found ${uniqueResults.length} unique cards`);

		// Scrape individual card pages
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

		console.log(`✅ Successfully scraped ${detailedResults.length} cards for "${searchWord}"`);
		return detailedResults;
	} catch (error) {
		console.error(`❌ Error scraping "${searchWord}":`, error);
		throw error;
	}
}

// Main execution
async function main() {
	const args = process.argv.slice(2);
	const searchWord = args[0];

	if (!searchWord) {
		console.error("Usage: npm run scrape <search_term>");
		console.error("Example: npm run scrape 09-118");
		process.exit(1);
	}

	try {
		const results = await scrapeSearchTerm(searchWord);
		const data = loadData();

		data[searchWord] = {
			results,
			lastScraped: new Date().toISOString(),
			count: results.length,
		};

		saveData(data);
		console.log(`\n✅ Data saved to ${DATA_FILE}`);
		console.log(`Total cards saved: ${results.length}`);
	} catch (error) {
		console.error("Scraping failed:", error);
		process.exit(1);
	}
}

main();
