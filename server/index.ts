import express from "express";
import cors from "cors";
import * as fs from "fs";
import * as path from "path";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Data storage paths
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "scraped-data.json");

interface ScrapedData {
	[searchWord: string]: {
		results: SearchResult[];
		lastScraped: string;
		count: number;
	};
}

interface SearchResult {
	name?: string;
	cardNumber?: string;
	price?: string;
	image?: string;
	link?: string;
	color?: string;
	[key: string]: unknown;
}

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

// API endpoint to get cached data
app.get("/api/cached/:searchWord", (req, res) => {
	try {
		const searchWord = req.params.searchWord;
		const cachedData = loadCachedData();

		if (cachedData[searchWord]) {
			const data = cachedData[searchWord];
			return res.json({
				searchWord,
				count: data.count,
				results: data.results,
				lastScraped: data.lastScraped,
				cached: true,
			});
		}

		return res.status(404).json({
			error: "No cached data found",
			searchWord,
		});
	} catch (error) {
		console.error("Error fetching cached data:", error);
		return res.status(500).json({
			error: "Failed to fetch cached data",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

// API endpoint to list all cached search terms
app.get("/api/cached", (req, res) => {
	try {
		const cachedData = loadCachedData();
		const searchTerms = Object.keys(cachedData).map((term) => ({
			searchWord: term,
			count: cachedData[term].count,
			lastScraped: cachedData[term].lastScraped,
		}));

		return res.json({
			searchTerms,
			total: searchTerms.length,
		});
	} catch (error) {
		console.error("Error listing cached data:", error);
		return res.status(500).json({
			error: "Failed to list cached data",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

// Search endpoint - only serves cached data
app.get("/api/search", (req, res) => {
	try {
		const searchWord = req.query.search_word as string;

		if (!searchWord) {
			return res.status(400).json({ error: "search_word parameter is required" });
		}

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
		const allCachedResults: SearchResult[] = [];
		let latestScrapedTime = "";

		for (const value of Object.values(cachedData)) {
			if (value.results && Array.isArray(value.results)) {
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
		return res.status(500).json({
			error: "Failed to fetch data",
			message: errorMessage,
		});
	}
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
