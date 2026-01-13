import scrapedData from "../../data/scraped-data.json";

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

interface ScrapedDataEntry {
	results: SearchResult[];
	lastScraped: string;
	count: number;
}

interface ScrapedData {
	[searchWord: string]: ScrapedDataEntry;
}

const LandingPage = () => {
	const data = scrapedData as ScrapedData;
	console.log(data.OP01);
	const searchTerms = Object.keys(data);

	return (
		<div>
			<h1>Landing Page</h1>
			<p>Total search terms: {searchTerms.length}</p>
			{/* Add your landing page content here */}
		</div>
	);
};

export default LandingPage;
