import { useState, useEffect, useRef } from "react";
import { X, Languages } from "lucide-react";
import Card from "./components/card/Card";

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

function App() {
	const [searchWord, setSearchWord] = useState("");
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [exchangeRate, setExchangeRate] = useState<number>(0.031); // Default approximate rate
	const [modalImage, setModalImage] = useState<string | null>(null);
	const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
	const translateDropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (translateDropdownRef.current && !translateDropdownRef.current.contains(event.target as Node)) {
				setShowTranslateDropdown(false);
			}
		};

		if (showTranslateDropdown) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showTranslateDropdown]);

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

	// Function to trigger Google Translate
	const triggerTranslate = (targetLang: string) => {
		console.log("Triggering translation to:", targetLang);
		setShowTranslateDropdown(false);

		// Set the translation cookie
		const cookieValue = `/ja/${targetLang}`;
		const cookieString = `googtrans=${cookieValue}; path=/; max-age=31536000; SameSite=Lax`;
		document.cookie = cookieString;
		console.log("Cookie set:", cookieString);
		console.log("Current cookies:", document.cookie);

		// Save current state before reload
		if (searchWord) {
			localStorage.setItem("searchWord", searchWord);
			console.log("Saved search word:", searchWord);
		}
		if (results.length > 0) {
			localStorage.setItem("searchResults", JSON.stringify(results));
			console.log("Saved results count:", results.length);
		}

		// Small delay to ensure cookie is set, then reload
		setTimeout(() => {
			console.log("Reloading page...");
			window.location.reload();
		}, 100);
	};

	// Restore state from localStorage on mount (in case of page reload for translation)
	useEffect(() => {
		const savedSearchWord = localStorage.getItem("searchWord");
		const savedResults = localStorage.getItem("searchResults");

		if (savedSearchWord) {
			setSearchWord(savedSearchWord);
			localStorage.removeItem("searchWord");
		}

		if (savedResults) {
			try {
				const parsed = JSON.parse(savedResults);
				setResults(parsed);
				localStorage.removeItem("searchResults");
			} catch (error) {
				console.error("Failed to parse saved results:", error);
			}
		}
	}, []);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchWord.trim()) return;

		setLoading(true);
		setError(null);
		setResults([]);

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

	// Function to extract prefix from card name (e.g., "P-SEC", "P-SR", "SEC", etc.)
	const extractPrefix = (name: string | undefined): string => {
		if (!name) return "Other";

		// Trim leading/trailing whitespace first
		const trimmedName = name.trim();

		// Match English letters (and dashes) at the start, before Japanese characters or space
		// Examples: "P-SEC", "P-SR", "SEC", "SR", "C", "R", "P-R", etc.
		// Also handles names with leading spaces like "  P-SEC モンキー・D・ルフィ"
		const prefixMatch = trimmedName.match(/^([A-Za-z-]+)(?=\s|[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF])/);
		if (prefixMatch && prefixMatch[1]) {
			return prefixMatch[1];
		}

		// Handle names starting with dash (e.g., "- ドン!!カード" or "  - ドン!!カード")
		if (trimmedName.startsWith("-")) {
			return "-";
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

		// Get index in custom order (if not found, use Infinity to put at end)
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

	console.log(results);

	return (
		<div className="min-h-screen p-4 bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="max-w-6xl mx-auto">
				{/* Translate Button - Browser Style */}

				<div className="flex flex-col w-full gap-4 mb-8 sm:flex-row sm:items-center">
					<form onSubmit={handleSearch} className="flex flex-col w-full gap-3 sm:flex-row sm:items-center sm:flex-1">
						<h3 className="text-xl font-bold text-white dark:text-gray-100 sm:text-2xl sm:whitespace-nowrap">Search</h3>
						<input
							type="text"
							value={searchWord}
							onChange={(e) => setSearchWord(e.target.value)}
							placeholder="Enter search term (e.g., 09-118)"
							className="w-full p-3 border border-gray-300 rounded-md outline-none dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white sm:flex-1 sm:max-w-md"
							disabled={loading}
						/>
						<button
							type="submit"
							disabled={loading}
							className="w-full px-6 py-3 font-semibold text-white transition-colors duration-200 bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:whitespace-nowrap">
							{loading ? "Searching..." : "Search"}
						</button>
					</form>

					<div className="flex items-center justify-start w-full gap-2 sm:justify-end sm:w-fit notranslate">
						<div className="relative notranslate" ref={translateDropdownRef}>
							<button
								onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
								className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 notranslate">
								<Languages className="w-4 h-4" />
								<span className="notranslate">Translate</span>
							</button>
							{showTranslateDropdown && (
								<div className="absolute right-0 z-50 w-48 mt-2 bg-white border border-gray-200 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700 notranslate">
									<button
										onClick={() => triggerTranslate("ja")}
										className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 notranslate">
										Japanese
									</button>
									<button
										onClick={() => triggerTranslate("en")}
										className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 notranslate">
										English
									</button>
								</div>
							)}
						</div>
						{/* Google Translate Widget (positioned off-screen but functional) */}
						<div
							id="google_translate_element"
							style={{
								position: "fixed",
								top: "-1000px",
								left: "-1000px",
								width: "1px",
								height: "1px",
								opacity: 0,
								zIndex: -1,
							}}></div>
					</div>
				</div>

				{error && (
					<div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-400 rounded-md dark:bg-red-900 dark:border-red-700 dark:text-red-200">
						{error}
					</div>
				)}

				{loading && (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
								<div className="sticky z-10 px-4 py-3 text-white bg-indigo-600 rounded-lg shadow-md top-4 dark:bg-indigo-800">
									<h2 className="text-xl font-bold">{prefix}</h2>
									<p className="text-sm text-indigo-100 dark:text-indigo-200">
										{groupResults.length} {groupResults.length === 1 ? "card" : "cards"}
									</p>
								</div>
								{/* Group Cards */}
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
					<div className="mt-8 text-center text-gray-600 dark:text-gray-400">
						No results found. Try a different search term.
					</div>
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
			</div>
		</div>
	);
}

export default App;
