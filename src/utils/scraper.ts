// Browser-compatible scraping utilities
// Uses DOMParser instead of Cheerio

interface SearchResult {
	name?: string;
	cardNumber?: string;
	price?: string;
	image?: string;
	link?: string;
	color?: string;
	[key: string]: unknown;
}

// Function to extract name from text using multiple patterns
function extractNameFromText(text: string): string {
	// Pattern 1: English letters (and dashes) followed by Japanese characters
	const englishFirstPattern =
		/[A-Za-z]+(?:-[A-Za-z]+)?\s+[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF・！!]+(?:\([^)]*\))*/;
	let match = text.match(englishFirstPattern);
	if (match && match[0]) {
		return match[0];
	}

	// Pattern 2: Dash followed by Japanese characters
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

// Parse HTML using browser's DOMParser
function parseHTML(html: string): Document {
	const parser = new DOMParser();
	return parser.parseFromString(html, "text/html");
}

// Helper function to query selector (similar to jQuery/Cheerio)
function querySelector(doc: Document, selector: string): Element | null {
	return doc.querySelector(selector);
}

function querySelectorAll(doc: Document, selector: string): NodeListOf<Element> {
	return doc.querySelectorAll(selector);
}

// Function to scrape individual card page for detailed data
export async function scrapeCardPage(cardLink: string): Promise<Partial<SearchResult>> {
	console.log(`\n🔍 Starting to scrape card page: ${cardLink}`);
	try {
		const response = await fetch(cardLink, {
			method: "GET",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
				"Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
				Referer: "https://yuyu-tei.jp/",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const html = await response.text();
		const doc = parseHTML(html);

		const cardData: Partial<SearchResult> = {};

		// Try to extract card image
		const imageEl = querySelector(
			doc,
			'img[src*="card"], img[class*="card"], img[alt*="OP"], .card-image img, .product-image img'
		);
		const image =
			imageEl?.getAttribute("src") || imageEl?.getAttribute("data-src") || imageEl?.getAttribute("data-lazy-src");

		if (image) {
			cardData.image = image.startsWith("http") ? image : `https://yuyu-tei.jp${image}`;
		}

		// Extract price
		const bodyText = doc.body.textContent || "";
		const allPrices = bodyText.match(/[\d,]+\s*円/g) || [];
		const validPrices = allPrices.filter((p) => {
			const numStr = p.replace(/[^\d,]/g, "").replace(/,/g, "");
			const num = parseInt(numStr);
			return num >= 10;
		});

		let price = "";
		const priceElements = querySelectorAll(doc, '.price, [class*="price"], [class*="cost"], [class*="yen"]');
		for (const el of Array.from(priceElements)) {
			if (el.textContent?.includes("円")) {
				const priceMatch = el.textContent.match(/[\d,]+\s*円/)?.[0];
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
			cardData.price = price;
		}

		// Extract name
		let name = "";
		const powerDiv = querySelector(doc, "#power.power");
		if (powerDiv) {
			const h3Element = powerDiv.querySelector("h3");
			if (h3Element) {
				name = h3Element.textContent || "";
			}
		}

		if (!name) {
			const powerById = querySelector(doc, "#power");
			if (powerById) {
				const h3Element = powerById.querySelector("h3");
				if (h3Element) {
					name = h3Element.textContent || "";
				}
			}
		}

		if (!name) {
			const powerByClass = querySelector(doc, ".power");
			if (powerByClass) {
				const h3Element = powerByClass.querySelector("h3");
				if (h3Element) {
					name = h3Element.textContent || "";
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
		const cardNumberEl = querySelector(doc, '.code, .number, [class*="code"], [class*="number"]');
		let cardNumber = cardNumberEl?.textContent?.trim() || "";

		if (!cardNumber) {
			const cardNumberMatch =
				bodyText.match(/(?:OP|ST|PRB|EB|P)\d+-\d+/)?.[0] ||
				bodyText.match(/(?:OP|ST|PRB|EB|P)-\d+/)?.[0] ||
				bodyText.match(/\d+-\d+/)?.[0];
			if (cardNumberMatch) {
				cardNumber = cardNumberMatch;
			}
		}

		if (cardNumber) {
			cardData.cardNumber = cardNumber;
		}

		// Extract color
		const tableRows = querySelectorAll(doc, "tr, td, th");
		let color = "";
		for (const el of Array.from(tableRows)) {
			const text = el.textContent?.trim() || "";
			if (text.includes("色") && text.length < 100) {
				const colorMatch = text.match(/色[：:]\s*([^\s\n]+)/) || text.match(/色\s+([^\s\n]+)/);
				if (colorMatch && colorMatch[1]) {
					const extractedColor = colorMatch[1].trim();
					if (/^(赤|青|緑|黄|紫|黒|赤色|青色|緑色|黄色|紫色|黒色)$/.test(extractedColor)) {
						color = extractedColor;
						break;
					}
				}
			}
		}

		if (color) {
			cardData.color = color;
		}

		return cardData;
	} catch (error) {
		console.error(`Error scraping card page ${cardLink}:`, error);
		return {};
	}
}

// Main search function
export async function searchCards(searchWord: string): Promise<SearchResult[]> {
	const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(searchWord)}`;
	console.log(`Fetching search results from: ${url}`);

	const response = await fetch(url, {
		method: "GET",
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
			"Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
			Referer: "https://yuyu-tei.jp/",
		},
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const html = await response.text();
	const doc = parseHTML(html);

	const results: SearchResult[] = [];

	// Try various selectors
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
		const elements = querySelectorAll(doc, selector);
		for (const element of Array.from(elements)) {
			const imageEl = element.querySelector("img");
			const image =
				imageEl?.getAttribute("src") || imageEl?.getAttribute("data-src") || imageEl?.getAttribute("data-lazy-src");

			const nameEl =
				element.querySelector('.name, .title, h2, h3, h4, [class*="name"], [class*="title"]') ||
				element.querySelector("a");
			const name = nameEl?.textContent?.trim() || "";

			const cardNumberEl = element.querySelector('.code, .number, [class*="code"], [class*="number"]');
			const cardNumberText = cardNumberEl?.textContent?.trim() || "";
			const elementText = element.textContent || "";
			const cardNumber =
				cardNumberText ||
				elementText.match(/(?:OP|ST|PRB|EB|P)\d+-\d+/)?.[0] ||
				elementText.match(/(?:OP|ST|PRB|EB|P)-\d+/)?.[0] ||
				elementText.match(/\d+-\d+/)?.[0];

			const priceEl = element.querySelector('.price, [class*="price"], [class*="cost"], [class*="yen"]');
			const priceText = priceEl?.textContent?.trim() || "";
			const price = priceText || elementText.match(/[\d,]+円/)?.[0] || elementText.match(/¥[\d,]+/)?.[0];

			const linkEl = element.querySelector("a");
			const link = linkEl?.getAttribute("href") || "";

			if (image || name) {
				results.push({
					name: name || undefined,
					cardNumber: cardNumber || undefined,
					price: price || undefined,
					image: image ? (image.startsWith("http") ? image : `https://yuyu-tei.jp${image}`) : undefined,
					link: link ? (link.startsWith("http") ? link : `https://yuyu-tei.jp${link}`) : undefined,
					title: name || undefined,
				});
				foundCards = true;
			}
		}

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

	// Scrape individual card pages (with batching)
	const BATCH_SIZE = 5;
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
					};
				} catch (error) {
					console.error(`Error scraping ${result.link}:`, error);
					return result;
				}
			})
		);

		detailedResults.push(...batchResults);

		if (i + BATCH_SIZE < uniqueResults.length) {
			await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
		}
	}

	return detailedResults;
}
