import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import Card from "../components/card/Card";

interface SearchResult {
	name?: string;
	cardNumber?: string;
	price?: string;
	image?: string;
	link?: string;
	color?: string;
	[key: string]: unknown;
}

// Function to get JPY to MYR exchange rate
async function getExchangeRate(): Promise<number> {
	try {
		// Using exchangerate-api.com free endpoint (no API key required)
		const response = await fetch("https://api.exchangerate-api.com/v4/latest/JPY");
		const data = await response.json();
		return data.rates?.MYR || 0.031; // Fallback to approximate rate if API fails
	} catch (error) {
		console.error("Exchange rate error:", error);
		return 0.031; // Approximate JPY to MYR rate (1 JPY ≈ 0.031 MYR)
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
					banner.style.pointerEvents = "none";
				}
			});

			// Remove background image from body
			if (
				document.body.style.backgroundImage &&
				document.body.style.backgroundImage.includes("translate.googleapis.com")
			) {
				document.body.style.backgroundImage = "none";
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

				// Fetch from cached data API (only cached data is available)
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

	// Function to extract prefix from card name (e.g., "P-SEC", "P-SR", "SEC", etc.)
	const extractPrefix = (name: string | undefined): string => {
		if (!name) return "Other";

		// Trim leading/trailing whitespace first
		const trimmedName = name.trim();

		// First, normalize "P R", "P L", "P SR", "P SEC", etc. to "P-R", "P-L", "P-SR", "P-SEC" for consistent display
		// This handles cases where card names have spaces instead of dashes
		const normalizedName = trimmedName.replace(/^P\s+([A-Z][A-Za-z]*)/, "P-$1");

		// Match English letters and dashes at the start, before Japanese characters or space
		// The pattern explicitly allows dashes within the prefix (e.g., "P-R", "P-SEC", "P-SR")
		// Examples: "P-SEC", "P-SR", "SEC", "SR", "C", "R", "P-R", "P-L", etc.
		// First try to match patterns with dashes (P-R, P-L, P-SEC, P-SR, etc.)

		let prefixMatch = normalizedName.match(
			/^([A-Za-z]+(?:-[A-Za-z]+)+)(?=\s|[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF])/
		);
		if (prefixMatch && prefixMatch[1]) {
			return prefixMatch[1];
		}
		// If no dash pattern, match simple letter prefix (SR, SEC, C, R, etc.)
		prefixMatch = normalizedName.match(/^([A-Za-z]+)(?=\s|[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF])/);
		if (prefixMatch && prefixMatch[1]) {
			return prefixMatch[1];
		}

		// Handle names starting with dash (e.g., "- ドン!!カード" or "  - ドン!!カード")
		if (normalizedName.startsWith("-")) {
			return "DON";
		}

		return "Other";
	};

	// Group results by prefix
	const groupedResults = results.reduce((acc, result) => {
		const prefix = extractPrefix(result.name);
		if (!acc[prefix]) {
			acc[prefix] = [];
		}
		acc[prefix].push(result);
		return acc;
	}, {} as Record<string, SearchResult[]>);

	// Custom order for prefixes
	const prefixOrder = ["P-SEC", "SEC", "SP", "P-L", "L", "P-SR", "SR", "P-R", "R", "P-UC", "UC", "C"];

	// Sort groups by custom prefix order (with "Other" and "-" at the end)
	const sortedGroups = Object.entries(groupedResults).sort(([a], [b]) => {
		// Handle "Other" and "-" - put them at the end
		if (a === "Other") return 1;
		if (b === "Other") return -1;
		if (a === "-") return 1;
		if (b === "-") return -1;

		const indexA = prefixOrder.indexOf(a);
		const indexB = prefixOrder.indexOf(b);

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
					<h2 className="text-2xl font-bold text-gray-900/75 mb-1">Search Results for: {searchWord}</h2>
					{lastScraped && (
						<span className="text-sm text-gray-900/75 notranslate">
							Updated: {new Date(lastScraped).toLocaleDateString()}{" "}
							{new Date(lastScraped).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
					{sortedGroups.map(([prefix, groupResults]) => (
						<div key={prefix} className="space-y-4">
							{/* Group Header */}
							<div className="sticky z-10 px-4 py-3 text-black bg-grey rounded-lg shadow-md top-4">
								<h2 className="text-xl font-bold">{prefix.replace(/-/g, "–")}</h2>
								<p className="text-sm text-black font-medium">
									{groupResults.length} {groupResults.length === 1 ? "card" : "cards"}
								</p>
							</div>
							{/* Group Cards */}
							<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
								{groupResults.map((result, index) => (
									<Card
										key={`${prefix}-${index}`}
										result={result}
										exchangeRate={exchangeRate}
										onImageClick={(imageUrl) => setModalImage(imageUrl)}
									/>
								))}
							</div>
						</div>
					))}
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
							className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
							onClick={(e) => e.stopPropagation()}
						/>
					</div>
				</div>
			)}
		</>
	);
}

export default SearchPage;
