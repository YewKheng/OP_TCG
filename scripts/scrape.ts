#!/usr/bin/env node
/**
 * Usage:
 *   npm run scrape <search_term>
 *   npm run scrape:all  (scrapes all common search terms)
 */

import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import * as cheerio from "cheerio";

// Interface Types
import type { ScrapedData, SearchResult } from "../src/interface/types";

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

// Map search terms to custom set values
function getSetValue(searchWord: string): string {
	// Customize this mapping to set your desired values
	const setMapping: Record<string, string> = {
		op01: "Romance Dawn",
		op02: "Paramount War",
		op03: "Pillars of Strength",
		op04: "Kingdoms of Intrigue",
		op05: "Awakening of the New Era",
		op06: "Wings of the Captain",
		op07: "500 Years in the Future",
		op08: "Two Legends",
		op09: "Emperors in the New World",
		op10: "Royal Blood",
		op11: "A Fist of Divine Speed",
		op12: "Legacy of the Master",
		op13: "Carrying on his Will",
		op14: "The Azure Sea's Seven",

		prb01: "One Piece Card The Best",
		prb02: "One Piece Card The Best Vol.2",

		st01: "Straw Hat Pirates",
		st02: "Worse Generation",
		st03: "Seven Warlords of the Sea",
		st04: "Animal Kingdom Pirates",
		st05: "One Piece Film Edition",
		st06: "Marines",
		st07: "Big Mom Pirates",
		st08: "Side Monkey D. Luffy",
		st09: "Side Yamato",
		st10: "The Three Captains",
		st11: "Side Uta",
		st12: "Zoro & Sanji",
		st13: "The Three Brothers",
		st14: "3D2Y",
		st15: "RED Edward Newgate",
		st16: "GREEN Uta",
		st17: "BLUE Donquixote Doflamingo",
		st18: "PURPLE Monkey D. Luffy",
		st19: "BLACK Smoker",
		st20: "YELLOW Charlotte Katakuri",
		st21: "Gear 5",
		st22: "Ace & Newgate",
		st23: "RED Shanks",
		st24: "GREEN Jewelry Bonney",
		st25: "BLUE Buggy",
		st26: "PURPLE BLACK Monkey.D. Luffy",
		st27: "BLACK Marshall D. Teach",
		st28: "GREEN YELLOW Yamato",
		st29: "Egghead",

		eb01: "Memorial Collection",
		eb02: "Anime 25th Collection",
		eb03: "Heroines Edition",
		eb04: "Egghead Crisis",

		"promo-100": "Promo 100",
		"promo-200": "Promo 200",
		"promo-op10": "Promo OP10",
		"promo-op20": "Promo OP20",
		"promo-st10": "Promo ST10",
		"promo-eb10": "Promo EB10",
	};

	// Return custom mapped value if exists, otherwise return searchWord as default
	return setMapping[searchWord.toLowerCase()] || searchWord;
}

// Main scraping function
async function scrapeSearchTerm(searchWord: string): Promise<SearchResult[]> {
	console.log(`\n🚀 Scraping search term: "${searchWord}"`);
	const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=&vers[]=${encodeURIComponent(
		searchWord
	)}&rare=&type=&kizu=0`;

	const setValue = getSetValue(searchWord);

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
					return;
				}

				// Filter out items inside carousel containers (newestCardList, recommendedItemList)
				if ($el.closest("#newestCardList, #recommendedItemList").length > 0) {
					return;
				}

				// First check parent div with class position-relative product-img
				const productImgDiv = $el
					.find('.position-relative.product-img, [class*="position-relative"][class*="product-img"]')
					.first();
				const imgElement = productImgDiv.length > 0 ? productImgDiv.find("img").first() : null;
				const image = imgElement
					? imgElement.attr("src") || imgElement.attr("data-src") || imgElement.attr("data-lazy-src")
					: undefined;

				// Extract rarity from image alt attribute
				let rarity: string | undefined;
				if (imgElement) {
					const altText = imgElement.attr("alt") || "";
					// Check if alt text starts with "- -" (DON cards)
					if (altText.trim().startsWith("- -")) {
						rarity = "DON";
					} else {
						// First try to match P- prefixed rarities (P-SEC, P-SR, P-L, P-UC, P-C)
						let rarityMatch = altText.match(/P-(SEC|SR|SP|L|UC|C)\b/);
						if (rarityMatch && rarityMatch[0]) {
							rarity = rarityMatch[0];
						} else {
							// Then try standalone rarities (SEC, SR, L, UC, C, R)
							// Use word boundaries to avoid matching card number prefixes like "OP", "ST", etc.
							rarityMatch = altText.match(/\b(SEC|SR|SP|L|UC|C|R)\b/);
							if (rarityMatch && rarityMatch[1]) {
								rarity = rarityMatch[1];
							}
						}
					}
				}

				let name =
					$el.find("h4.text-primary.fw-bold").first().text().trim() ||
					$el.find('h4[class*="text-primary"][class*="fw-bold"]').first().text().trim();

				// Remove "ドン!!カード" from name if it contains it
				if (name && name.includes("ドン!!カード")) {
					name = name.replace(/ドン!!カード/g, "").trim();
				}

				// If name includes both (パラレル) and (スーパーパラレル), keep only (スーパーパラレル)
				if (name && name.includes("(パラレル)") && name.includes("(スーパーパラレル)")) {
					name = name.replace(/\(パラレル\)/g, "").trim();
				}

				let cardNumber =
					$el.find("span.d-block.border.border-dark.p-1.w-100.text-center.my-2").first().text().trim() ||
					$el
						.find(
							'span[class*="d-block"][class*="border"][class*="border-dark"][class*="p-1"][class*="w-100"][class*="text-center"][class*="my-2"]'
						)
						.first()
						.text()
						.trim();

				// If card number is "-", keep it as DON
				if (cardNumber && cardNumber.trim() === "-") {
					cardNumber = "DON";
				}

				const price =
					$el.find("strong.d-block.text-end").first().text().trim() ||
					$el.find('strong[class*="d-block"][class*="text-end"]').first().text().trim();

				const link = $el.find("a").first().attr("href");

				if (image || name) {
					let processedImage = image;
					if (processedImage) {
						if (!processedImage.startsWith("http")) {
							processedImage = `https://yuyu-tei.jp${processedImage}`;
						}
						// Replace 100_140 with front in the image URL
						processedImage = processedImage.replace(/100_140/g, "front");
					}

					results.push({
						name: name || undefined,
						cardNumber: cardNumber || "-",
						price: price || undefined,
						image: processedImage || undefined,
						link: link ? (link.startsWith("http") ? link : `https://yuyu-tei.jp${link}`) : undefined,
						rarity: rarity,
						set: setValue,
					});
					foundCards = true;
				}
			});

			if (foundCards) break;
		}

		// Filter results
		const filteredResults = results.filter((result) => {
			const hasLink = result.link && result.link.trim() !== "";
			const hasValidLink = hasLink && (result.link!.includes("opc/card") || result.link!.includes("/promo"));
			// Allow cards with valid links, even if card number isn't found yet
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

		console.log(`Found ${uniqueResults.length} unique cards`);

		// Use list page data directly (no individual page scraping for speed)
		const finalResults = uniqueResults.map((result) => ({
			...result,
			scrapedAt: new Date().toISOString(),
			set: setValue,
		}));

		const cardsWithoutCardNumber = finalResults.filter((r) => !r.cardNumber || r.cardNumber.trim() === "").length;

		console.log(
			`✅ Successfully scraped ${finalResults.length} cards for "${searchWord}" (${
				cardsWithoutCardNumber > 0 ? `${cardsWithoutCardNumber} without card numbers included` : ""
			})`
		);
		return finalResults;
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
