import { useState } from "react";

interface SearchResult {
	name?: string;
	cardNumber?: string;
	price?: string;
	image?: string;
	link?: string;
	// Keep old fields for backward compatibility
	title?: string;
	[key: string]: unknown;
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
}

function App() {
	const [searchWord, setSearchWord] = useState("");
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [error, setError] = useState<string | null>(null);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchWord.trim()) return;

		setLoading(true);
		setError(null);
		setResults([]);

		try {
			const response = await fetch(`/api/search?search_word=${encodeURIComponent(searchWord)}`);
			const data: ApiResponse = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to fetch data");
			}

			setResults(data.results || []);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "An error occurred while searching";
			setError(errorMessage);
			console.error("Search error:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="max-w-6xl mx-auto">
				<div className="mb-8">
					<form onSubmit={handleSearch} className="flex items-center justify-center gap-4 mb-4">
						<h3 className="text-2xl font-bold text-white dark:text-gray-100">Search</h3>
						<input
							type="text"
							value={searchWord}
							onChange={(e) => setSearchWord(e.target.value)}
							placeholder="Enter search term (e.g., 09-118)"
							className="flex-1 max-w-md p-3 border border-gray-300 rounded-md outline-none dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
							disabled={loading}
						/>
						<button
							type="submit"
							disabled={loading}
							className="px-6 py-3 font-semibold text-white transition-colors duration-200 bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
							{loading ? "Searching..." : "Search"}
						</button>
					</form>
				</div>

				{error && (
					<div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-400 rounded-md dark:bg-red-900 dark:border-red-700 dark:text-red-200">
						{error}
					</div>
				)}

				{results.length > 0 && (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{results.map((result, index) => (
							<div
								key={index}
								className="p-4 transition-shadow bg-white rounded-lg shadow-lg dark:bg-gray-800 hover:shadow-xl">
								{result.image && (
									<img
										src={result.image.startsWith("http") ? result.image : `https://yuyu-tei.jp${result.image}`}
										alt={result.name || result.title || "Card image"}
										className="object-cover w-1/2 mb-3 rounded-md h-1/2"
										onError={(e) => {
											(e.target as HTMLImageElement).style.display = "none";
										}}
									/>
								)}
								{result.cardNumber && (
									<p className="mb-1 text-sm text-gray-500 dark:text-gray-400">Card: {result.cardNumber}</p>
								)}
								{(result.name || result.title) && (
									<h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
										{result.name || result.title}
									</h4>
								)}
								{result.price && (
									<p className="mb-2 text-xl font-bold text-indigo-600 dark:text-indigo-400">{result.price}</p>
								)}
								{result.link && (
									<a
										href={result.link.startsWith("http") ? result.link : `https://yuyu-tei.jp${result.link}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
										View Details →
									</a>
								)}
							</div>
						))}
					</div>
				)}

				{!loading && results.length === 0 && searchWord && !error && (
					<div className="mt-8 text-center text-gray-600 dark:text-gray-400">
						No results found. Try a different search term.
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
