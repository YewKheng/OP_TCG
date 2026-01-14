import op01Banner from "../../assets/Set_Banner/OP01_Banner.webp";
import op02Banner from "../../assets/Set_Banner/OP02_Banner.webp";
import op03Banner from "../../assets/Set_Banner/OP03_Banner.webp";
import op04Banner from "../../assets/Set_Banner/OP04_Banner.webp";
import op05Banner from "../../assets/Set_Banner/OP05_Banner.webp";
import op06Banner from "../../assets/Set_Banner/OP06_Banner.webp";
import op07Banner from "../../assets/Set_Banner/OP07_Banner.webp";
import op08Banner from "../../assets/Set_Banner/OP08_Banner.webp";
import op09Banner from "../../assets/Set_Banner/OP09_Banner.webp";
import op10Banner from "../../assets/Set_Banner/OP10_Banner.webp";
import op11Banner from "../../assets/Set_Banner/OP11_Banner.webp";
import op12Banner from "../../assets/Set_Banner/OP12_Banner.webp";
import op13Banner from "../../assets/Set_Banner/OP13_Banner.webp";
import op14Banner from "../../assets/Set_Banner/OP14_Banner.webp";

import eb01Banner from "../../assets/Set_Banner/EB01_Banner.webp";
import eb02Banner from "../../assets/Set_Banner/EB02_Banner.webp";
import eb03Banner from "../../assets/Set_Banner/EB03_Banner.webp";
import eb04Banner from "../../assets/Set_Banner/EB04_Banner.webp";

import prb01Banner from "../../assets/Set_Banner/PRB01_Banner.webp";
import prb02Banner from "../../assets/Set_Banner/PRB02_Banner.webp";

import st01_st04Banner from "../../assets/Set_Banner/ST01-ST04_Banner-1.webp";
import st05Banner from "../../assets/Set_Banner/ST05_Banner.webp";
import st06Banner from "../../assets/Set_Banner/ST06_Banner.webp";
import st07Banner from "../../assets/Set_Banner/ST07_Banner.webp";
import st08Banner from "../../assets/Set_Banner/ST08_Banner.webp";
import st09Banner from "../../assets/Set_Banner/ST09_Banner.webp";
import st10Banner from "../../assets/Set_Banner/ST10_Banner.webp";
import st11Banner from "../../assets/Set_Banner/ST11_Banner.webp";
import st12Banner from "../../assets/Set_Banner/ST12_Banner.webp";
import st13Banner from "../../assets/Set_Banner/ST13_Banner.webp";
import st14Banner from "../../assets/Set_Banner/ST14_Banner.webp";
import st15_st20Banner from "../../assets/Set_Banner/ST15-ST20_Banner.webp";
import st21Banner from "../../assets/Set_Banner/ST21_Banner.webp";
import st22Banner from "../../assets/Set_Banner/ST22_Banner.webp";
import st23Banner from "../../assets/Set_Banner/ST23_Banner.webp";
import st24Banner from "../../assets/Set_Banner/ST24_Banner.webp";
import st25Banner from "../../assets/Set_Banner/ST25_Banner.webp";
import st26Banner from "../../assets/Set_Banner/ST26_Banner.webp";
import st27Banner from "../../assets/Set_Banner/ST27_Banner.webp";
import st28Banner from "../../assets/Set_Banner/ST28_Banner.webp";
import st29Banner from "../../assets/Set_Banner/ST29_Banner.webp";

import React from "react";
import { useNavigate } from "react-router-dom";
import scrapedData from "../../../data/scraped-data.json";

interface SearchResult {
	name?: string;
	cardNumber?: string;
	price?: string;
	image?: string;
	link?: string;
	color?: string;
	set?: string;
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

interface BannerProps {
	isLoading?: boolean;
}

// Mapping of set keys to banner images
const bannerMap: Record<string, string> = {
	op01: op01Banner,
	op02: op02Banner,
	op03: op03Banner,
	op04: op04Banner,
	op05: op05Banner,
	op06: op06Banner,
	op07: op07Banner,
	op08: op08Banner,
	op09: op09Banner,
	op10: op10Banner,
	op11: op11Banner,
	op12: op12Banner,
	op13: op13Banner,
	op14: op14Banner,
	eb01: eb01Banner,
	eb02: eb02Banner,
	eb03: eb03Banner,
	eb04: eb04Banner,
	prb01: prb01Banner,
	prb02: prb02Banner,
	st01: st01_st04Banner,
	st02: st01_st04Banner,
	st03: st01_st04Banner,
	st04: st01_st04Banner,
	st05: st05Banner,
	st06: st06Banner,
	st07: st07Banner,
	st08: st08Banner,
	st09: st09Banner,
	st10: st10Banner,
	st11: st11Banner,
	st12: st12Banner,
	st13: st13Banner,
	st14: st14Banner,
	st15: st15_st20Banner,
	st16: st15_st20Banner,
	st17: st15_st20Banner,
	st18: st15_st20Banner,
	st19: st15_st20Banner,
	st20: st15_st20Banner,
	st21: st21Banner,
	st22: st22Banner,
	st23: st23Banner,
	st24: st24Banner,
	st25: st25Banner,
	st26: st26Banner,
	st27: st27Banner,
	st28: st28Banner,
	st29: st29Banner,
};

const Banner: React.FC<BannerProps> = ({ isLoading = false }) => {
	const navigate = useNavigate();
	const data = scrapedData as ScrapedData;
	const sets = Object.keys(data);

	const handleSetClick = (setKey: string) => {
		navigate(`/search?q=${encodeURIComponent(setKey)}`);
	};

	// Skeleton loader
	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{Array.from({ length: 20 }).map((_, index) => (
						<div key={index} className="p-4 bg-gray-700 rounded-lg shadow-md animate-pulse">
							{/* Skeleton Banner Image */}
							<div className="aspect-2/1 object-cover mb-1 rounded w-full h-auto bg-gray-500" />
							{/* Skeleton Set Name */}
							<div className="w-32 h-6 mb-1 rounded bg-gray-500" />
							{/* Skeleton Set Key */}
							<div className="w-16 h-4 mb-1 rounded bg-gray-500" />
							{/* Skeleton Count */}
							<div className="w-20 h-4 mb-1 rounded bg-gray-500" />
							{/* Skeleton Last Scraped */}
							<div className="w-24 h-3 rounded bg-gray-500" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Map through all sets */}
			<div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{sets.map((setKey) => {
					const setData = data[setKey];
					const bannerImage = bannerMap[setKey.toLowerCase()];
					const setName = setData.results[0]?.set || setKey.toUpperCase();

					return (
						<div
							key={setKey}
							onClick={() => handleSetClick(setKey)}
							className="p-4 bg-grey/75 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg hover:scale-105">
							{bannerImage && (
								<img
									src={bannerImage}
									alt={`${setKey} Banner`}
									className="aspect-2/1 object-cover mb-1 rounded w-full h-auto object-top"
								/>
							)}
							<h3 className="text-lg font-bold text-black mb-1">{setName}</h3>
							<p className="text-sm font-semibold text-black mb-1">{setKey.toUpperCase()}</p>
							<p className="text-sm text-black font-medium">Count: {setData.count}</p>
							<p className="text-xs text-gray-900/75">
								Last scraped: {new Date(setData.lastScraped).toLocaleDateString()}{" "}
								{new Date(setData.lastScraped).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
							</p>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default Banner;
