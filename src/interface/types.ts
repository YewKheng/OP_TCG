export interface SearchResult {
	name?: string;
	cardNumber?: string;
	price?: string;
	image?: string;
	link?: string;
	rarity?: string;
	set?: string;
	scrapedAt?: string;
	[key: string]: unknown;
}

export interface ScrapedDataEntry {
	results: SearchResult[];
	lastScraped: string;
	count: number;
}

export interface ScrapedData {
	[searchWord: string]: ScrapedDataEntry;
}
