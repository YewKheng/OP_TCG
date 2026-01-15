import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as fs from "fs";
import * as path from "path";

// Data storage paths
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "scraped-data.json");

// Interface Types
import type { ScrapedData, SearchResult } from "../src/interface/types";

// Load cached data
function loadCachedData(): ScrapedData {
	if (fs.existsSync(DATA_FILE)) {
		try {
			const content = fs.readFileSync(DATA_FILE, "utf-8");
			return JSON.parse(content);
		} catch (error) {
			console.error("Error loading cached data:", error);
			return {};
		}
	}
	return {};
}

// All scraping functions removed - only cached data is served
// To scrape data, run: npm run scrape <search_term>

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

		// Only serve cached data - no scraping
		const cachedData = loadCachedData();

		// First, try exact match
		if (cachedData[searchWord]) {
			console.log(`✅ Returning cached data for "${searchWord}"`);
			const data = cachedData[searchWord];
			return res.json({
				searchWord,
				url: `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(searchWord)}`,
				count: data.count,
				results: data.results,
				cached: true,
				lastScraped: data.lastScraped,
			});
		}

		// If no exact match, search through all cached results for matching cards
		// This handles cases like searching "OP01-120" when data is cached under "op01"
		const allCachedResults: SearchResult[] = [];
		let latestScrapedTime = "";

		for (const value of Object.values(cachedData)) {
			if (value.results && Array.isArray(value.results)) {
				// Search for cards matching the search term
				const matchingCards = value.results.filter((card: SearchResult) => {
					const searchLower = searchWord.toLowerCase();
					const cardNumberLower = (card.cardNumber || "").toLowerCase();
					const nameLower = (card.name || "").toLowerCase();

					return (
						cardNumberLower.includes(searchLower) ||
						nameLower.includes(searchLower) ||
						cardNumberLower === searchLower ||
						nameLower === searchLower
					);
				});

				if (matchingCards.length > 0) {
					allCachedResults.push(...matchingCards);
					// Track the most recent scrape time
					if (value.lastScraped && (!latestScrapedTime || value.lastScraped > latestScrapedTime)) {
						latestScrapedTime = value.lastScraped;
					}
				}
			}
		}

		if (allCachedResults.length > 0) {
			console.log(`✅ Returning ${allCachedResults.length} matching cards from cache for "${searchWord}"`);
			return res.json({
				searchWord,
				url: `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(searchWord)}`,
				count: allCachedResults.length,
				results: allCachedResults,
				cached: true,
				lastScraped: latestScrapedTime,
			});
		}

		console.log(`⚠️ No cached data found for "${searchWord}"`);
		return res.status(404).json({
			error: "No cached data found",
			message: `No cached data available for "${searchWord}". Please run 'npm run scrape ${searchWord}' to populate the cache.`,
			searchWord,
		});
	} catch (error) {
		console.error("Error in handler:", error);
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		const errorStack = error instanceof Error ? error.stack : undefined;

		console.error("Full error details:", {
			message: errorMessage,
			stack: errorStack,
			error: String(error),
		});

		// Make sure we haven't already sent a response
		if (!res.headersSent) {
			return res.status(500).json({
				error: "Failed to fetch data",
				message: errorMessage,
				...(process.env.NODE_ENV === "development" && { stack: errorStack }),
			});
		}
	}
}
