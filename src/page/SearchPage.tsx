import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// Assets
import { X } from "lucide-react";

// Interface Types
import type { SearchResult } from "../interface/types";

// Components
import Card from "../components/card/Card";

// Function to get JPY to MYR exchange rate (cached for 12 hours)
async function getExchangeRate(): Promise<number> {
	const CACHE_KEY = "jpy_to_myr_rate";
	const CACHE_TIMESTAMP_KEY = "jpy_to_myr_rate_timestamp";
	const CACHE_DURATION = 12 * 60 * 60 * 1000;

	// Check if we have a cached rate that's still valid
	const cachedRate = localStorage.getItem(CACHE_KEY);
	const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

	if (cachedRate && cachedTimestamp) {
		const timestamp = parseInt(cachedTimestamp, 10);
		const now = Date.now();
		const age = now - timestamp;

		// If cache is less than 12 hours old, use it
		if (age < CACHE_DURATION) {
			return parseFloat(cachedRate);
		}
	}

	// Cache expired or doesn't exist, fetch new rate
	try {
		const response = await fetch("https://api.exchangerate-api.com/v4/latest/JPY");
		const data = await response.json();
		const rate = data.rates?.MYR || 0.031;

		// Cache the new rate
		localStorage.setItem(CACHE_KEY, rate.toString());
		localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

		return rate;
	} catch (error) {
		console.error("Exchange rate error:", error);
		// If API fails and we have old cache, use it even if expired
		if (cachedRate) {
			console.log("⚠️ API failed, using expired cache as fallback");
			return parseFloat(cachedRate);
		}
		return 0.031; // Fallback to approximate rate
	}
}

interface ApiResponse {
	searchWord?: string;
	url?: string;
	count?: number;
	results?: SearchResult[];
	error?: string;
	message?: string;
	rawHtml?: string;
	htmlLength?: number;
	cached?: boolean;
	lastScraped?: string;
}

function SearchPage() {
	const [searchParams] = useSearchParams();
	const searchWord = searchParams.get("q") || "";
	const sortBy =
		(searchParams.get("sort") as "rarity" | "priceLow" | "priceHigh" | "cardNumberLow" | "cardNumberHigh") || "rarity";
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [exchangeRate, setExchangeRate] = useState<number>(0.031); // Default approximate rate
	const [lastScraped, setLastScraped] = useState<string | null>(null);
	const [modalImage, setModalImage] = useState<string | null>(null);

	// Hide Google Translate banner visually (but keep in DOM for translation to work)
	useEffect(() => {
		const hideBanner = () => {
			// Hide banner elements with CSS instead of removing them
			const banners = document.querySelectorAll(".goog-te-banner-frame, .goog-te-banner, iframe[src*='te_bk.gif']");
			banners.forEach((banner) => {
				if (banner instanceof HTMLElement) {
					// Hide with CSS instead of removing
					banner.style.display = "none";
					banner.style.visibility = "hidden";
					banner.style.height = "0";
					banner.style.width = "0";
					banner.style.opacity = "0";
					banner.style.position = "absolute";
					banner.style.left = "-9999px";
					banner.style.pointerEvents = "rarity";
				}
			});

			// Remove background image from body
			if (
				document.body.style.backgroundImage &&
				document.body.style.backgroundImage.includes("translate.googleapis.com")
			) {
				document.body.style.backgroundImage = "rarity";
			}

			// Reset body position
			document.body.style.top = "0";
		};

		// Hide immediately
		hideBanner();

		// Set up interval to continuously hide
		const interval = setInterval(hideBanner, 100);

		// Use MutationObserver to catch banner when it's added
		const observer = new MutationObserver(() => {
			hideBanner();
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["style", "class"],
		});

		return () => {
			clearInterval(interval);
			observer.disconnect();
		};
	}, []);

	// Perform search when searchWord changes (from URL params)
	useEffect(() => {
		if (!searchWord.trim()) {
			setResults([]);
			setError(null);
			setLastScraped(null);
			return;
		}

		const performSearch = async () => {
			setLoading(true);
			setError(null);
			setResults([]);
			setLastScraped(null);

			try {
				// Fetch exchange rate
				const rate = await getExchangeRate();
				setExchangeRate(rate);

				// Fetch from cached data API
				const response = await fetch(`/api/search?search_word=${encodeURIComponent(searchWord)}`);
				const data: ApiResponse = await response.json();

				if (!response.ok) {
					throw new Error(data.error || data.message || "Failed to fetch data");
				}

				if (data.results && data.results.length > 0) {
					console.log(`✅ Using cached data`);
					setResults(data.results);
					setLastScraped(data.lastScraped || null);
				} else {
					throw new Error("No results found in cached data");
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "An error occurred while searching";
				setError(errorMessage);
				console.error("Search error:", err);
			} finally {
				setLoading(false);
			}
		};

		performSearch();
	}, [searchWord]);

	// Sort results before grouping
	const sortedResults = [...results].sort((a, b) => {
		if (sortBy === "priceLow" || sortBy === "priceHigh") {
			const getPriceValue = (price: string | undefined): number => {
				if (!price) return 0;
				const numericStr = price.replace(/[^\d,]/g, "").replace(/,/g, "");
				return parseInt(numericStr, 10) || 0;
			};
			const priceA = getPriceValue(a.price);
			const priceB = getPriceValue(b.price);
			if (sortBy === "priceLow") {
				return priceA - priceB; // Ascending order (lowest to highest)
			} else {
				return priceB - priceA; // Descending order (highest to lowest)
			}
		} else if (sortBy === "cardNumberLow" || sortBy === "cardNumberHigh") {
			// Extract numeric parts from card number (e.g., "OP09-118" -> [9, 118])
			const getCardNumberParts = (cardNumber: string | undefined): number[] => {
				if (!cardNumber || cardNumber === "-" || cardNumber === "DON") return [9999, 9999];
				const match = cardNumber.match(/(\d+)-?(\d+)?/);
				if (match) {
					const part1 = parseInt(match[1], 10) || 0;
					const part2 = match[2] ? parseInt(match[2], 10) : 0;
					return [part1, part2];
				}
				return [9999, 9999];
			};
			const partsA = getCardNumberParts(a.cardNumber);
			const partsB = getCardNumberParts(b.cardNumber);
			// Compare first part, then second part
			let comparison = 0;
			if (partsA[0] !== partsB[0]) {
				comparison = partsA[0] - partsB[0];
			} else {
				comparison = partsA[1] - partsB[1];
			}
			// Reverse for high to low
			return sortBy === "cardNumberLow" ? comparison : -comparison;
		}
		return 0; // No sorting
	});

	// Group results by rarity
	const groupedResults = sortedResults.reduce((acc, result) => {
		const rarity = result.rarity || "Other";
		if (!acc[rarity]) {
			acc[rarity] = [];
		}
		acc[rarity].push(result);
		return acc;
	}, {} as Record<string, SearchResult[]>);

	// Custom order for rarities
	const rarityOrder = ["P-SEC", "SEC", "P-SP", "SP", "P-SR", "SR", "P-L", "L", "R", "P-UC", "UC", "P-C", "C", "DON"];

	// Sort groups by custom rarity order (with "Other" at the end)
	const sortedGroups = Object.entries(groupedResults).sort(([a], [b]) => {
		// Handle "Other" - put it at the end
		if (a === "Other") return 1;
		if (b === "Other") return -1;

		const indexA = rarityOrder.indexOf(a);
		const indexB = rarityOrder.indexOf(b);

		// If both are in the custom order, sort by their position
		if (indexA !== -1 && indexB !== -1) {
			return indexA - indexB;
		}

		// If only one is in the custom order, prioritize it
		if (indexA !== -1) return -1;
		if (indexB !== -1) return 1;

		// If neither is in the custom order, sort alphabetically
		return a.localeCompare(b);
	});

	return (
		<>
			{/* Search Results Header */}
			{searchWord && (
				<div className="mb-6">
					{lastScraped && (
						<span className="text-sm text-gray-900/75 notranslate">
							Updated: {new Date(lastScraped).toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}{" "}
							{new Date(lastScraped).toLocaleTimeString("en-MY", {
								hour: "2-digit",
								minute: "2-digit",
								hour12: false,
								timeZone: "Asia/Kuala_Lumpur",
							})}
						</span>
					)}
				</div>
			)}

			{error && <div className="p-4 mb-4 text-white bg-red-700 rounded-md">{error}</div>}

			{loading && (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{Array.from({ length: 6 }).map((_, index) => (
						<Card key={index} isLoading={true} exchangeRate={exchangeRate} onImageClick={() => {}} />
					))}
				</div>
			)}

			{!loading && results.length > 0 && (
				<div className="space-y-8">
					{sortBy === "rarity" ? (
						sortedGroups.map(([rarity, groupResults]) => (
							<div key={rarity} className="space-y-4">
								{/* Group Header */}
								<div className="px-4 py-3 text-black rounded-lg shadow-md bg-grey top-4">
									<h2 className="text-xl font-bold">{rarity.replace(/-/g, "–")}</h2>
									<p className="text-sm font-medium text-black">
										{groupResults.length} {groupResults.length === 1 ? "card" : "cards"}
									</p>
								</div>
								{/* Group Cards */}
								<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
									{groupResults.map((result, index) => (
										<Card
											key={`${rarity}-${index}`}
											result={result}
											exchangeRate={exchangeRate}
											onImageClick={(imageUrl) => setModalImage(imageUrl)}
										/>
									))}
								</div>
							</div>
						))
					) : (
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
							{sortedResults.map((result, index) => (
								<Card
									key={index}
									result={result}
									exchangeRate={exchangeRate}
									onImageClick={(imageUrl) => setModalImage(imageUrl)}
								/>
							))}
						</div>
					)}
				</div>
			)}

			{!loading && results.length === 0 && searchWord && !error && (
				<div className="mt-8 text-center text-gray-600">No results found. Try a different search term.</div>
			)}

			{/* Image Modal */}
			{modalImage && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm"
					onClick={() => setModalImage(null)}>
					<div className="relative max-w-4xl max-h-[90vh] p-4">
						{/* Close button */}
						<button
							onClick={() => setModalImage(null)}
							className="absolute z-10 p-2 text-white transition-all rounded-full cursor-pointer top-2 right-2 bg-black/75 hover:bg-black">
							<X className="w-6 h-6" />
						</button>
						{/* Full size image */}
						<img
							src={modalImage}
							alt="Card image full size"
							className="object-contain rounded-lg shadow-2xl"
							onClick={(e) => e.stopPropagation()}
						/>
					</div>
				</div>
			)}
		</>
	);
}

export default SearchPage;
