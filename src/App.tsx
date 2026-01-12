import { useState } from "react";

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
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
			<div className="max-w-6xl mx-auto">
				<div className="mb-8">
					<form onSubmit={handleSearch} className="flex gap-4 items-center justify-center mb-4">
						<h3 className="text-2xl font-bold text-white dark:text-gray-100">Search</h3>
						<input
							type="text"
							value={searchWord}
							onChange={(e) => setSearchWord(e.target.value)}
							placeholder="Enter search term (e.g., 09-118)"
							className="flex-1 max-w-md p-3 rounded-md border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
							disabled={loading}
						/>
						<button
							type="submit"
							disabled={loading}
							className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
							{loading ? "Searching..." : "Search"}
						</button>
					</form>
				</div>

				{error && (
					<div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md">
						{error}
					</div>
				)}

				{results.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{results.map((result, index) => (
							<div
								key={index}
								className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
								{result.image && (
									<img
										src={result.image.startsWith("http") ? result.image : `https://yuyu-tei.jp${result.image}`}
										alt={result.name || result.title || "Card image"}
										className="w-full h-48 object-cover rounded-md mb-3"
										onError={(e) => {
											(e.target as HTMLImageElement).style.display = "none";
										}}
									/>
								)}
								{result.cardNumber && (
									<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Card: {result.cardNumber}</p>
								)}
								{(result.name || result.title) && (
									<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
										{result.name || result.title}
									</h4>
								)}
								{result.price && (
									<p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{result.price}</p>
								)}
								{result.condition && (
									<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Condition: {result.condition}</p>
								)}
								{result.link && (
									<a
										href={result.link.startsWith("http") ? result.link : `https://yuyu-tei.jp${result.link}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
										View Details →
									</a>
								)}
							</div>
						))}
					</div>
				)}

				{!loading && results.length === 0 && searchWord && !error && (
					<div className="text-center text-gray-600 dark:text-gray-400 mt-8">
						No results found. Try a different search term.
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
