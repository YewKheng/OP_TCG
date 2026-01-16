import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";

// Components
import BannerCard from "../card/BannerCard";

// Assets
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

import st01_st04Banner from "../../assets/Set_Banner/ST01-ST04_Banner.webp";
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
import st15Banner from "../../assets/Set_Banner/ST15_Banner.webp";
import st16Banner from "../../assets/Set_Banner/ST16_Banner.webp";
import st17Banner from "../../assets/Set_Banner/ST17_Banner.webp";
import st18Banner from "../../assets/Set_Banner/ST18_Banner.webp";
import st19Banner from "../../assets/Set_Banner/ST19_Banner.webp";
import st20Banner from "../../assets/Set_Banner/ST20_Banner.webp";
import st21Banner from "../../assets/Set_Banner/ST21_Banner.webp";
import st22Banner from "../../assets/Set_Banner/ST22_Banner.webp";
import st23Banner from "../../assets/Set_Banner/ST23_Banner.webp";
import st24Banner from "../../assets/Set_Banner/ST24_Banner.webp";
import st25Banner from "../../assets/Set_Banner/ST25_Banner.webp";
import st26Banner from "../../assets/Set_Banner/ST26_Banner.webp";
import st27Banner from "../../assets/Set_Banner/ST27_Banner.webp";
import st28Banner from "../../assets/Set_Banner/ST28_Banner.webp";
import st29Banner from "../../assets/Set_Banner/ST29_Banner.webp";

import promo100Banner from "../../assets/Set_Banner/Promo100_Banner.webp";
import promo200Banner from "../../assets/Set_Banner/Promo200_Banner.webp";
import promost10Banner from "../../assets/Set_Banner/PromoST10_Banner.webp";
import promoBanner from "../../assets/Set_Banner/Promo_Banner.webp";

// Data
import scrapedData from "../../../data/scraped-data.json";

// Interface Types
import type { ScrapedData } from "../../interface/types";

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
	st15: st15Banner,
	st16: st16Banner,
	st17: st17Banner,
	st18: st18Banner,
	st19: st19Banner,
	st20: st20Banner,
	st21: st21Banner,
	st22: st22Banner,
	st23: st23Banner,
	st24: st24Banner,
	st25: st25Banner,
	st26: st26Banner,
	st27: st27Banner,
	st28: st28Banner,
	st29: st29Banner,
	"promo-100": promo100Banner,
	"promo-200": promo200Banner,
	"promo-st10": promost10Banner,
	"promo-op10": promoBanner,
	"promo-op20": promoBanner,
	"promo-eb10": promoBanner,
};

const Banner: React.FC<BannerProps> = ({ isLoading = false }) => {
	const navigate = useNavigate();
	const data = scrapedData as ScrapedData;
	const sets = Object.keys(data);

	// Refs for each section
	const opSeriesRef = useRef<HTMLDivElement>(null);
	const ebSeriesRef = useRef<HTMLDivElement>(null);
	const prbSetsRef = useRef<HTMLDivElement>(null);
	const stSeriesRef = useRef<HTMLDivElement>(null);
	const promoSeriesRef = useRef<HTMLDivElement>(null);
	const tabsRef = useRef<HTMLDivElement>(null);

	const opSets = sets.filter((setKey) => setKey.startsWith("op"));
	opSets.sort((a, b) => b.localeCompare(a));
	const ebSets = sets.filter((setKey) => setKey.startsWith("eb"));
	ebSets.sort((a, b) => b.localeCompare(a));
	const prbSets = sets.filter((setKey) => setKey.startsWith("prb"));
	prbSets.sort((a, b) => b.localeCompare(a));
	const stSets = sets.filter((setKey) => setKey.startsWith("st"));
	stSets.sort((a, b) => b.localeCompare(a));
	const promoSets = sets.filter((setKey) => setKey.startsWith("promo"));
	promoSets.sort((a, b) => a.localeCompare(b));

	const handleSetClick = (setKey: string) => {
		navigate(`/search?q=${encodeURIComponent(setKey)}`);
	};

	const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
		if (ref.current) {
			const isSmallScreen = window.innerWidth < 640; // sm breakpoint

			// Calculate offset dynamically based on actual sticky elements
			let offset = 160; // default for other sections

			if (ref === opSeriesRef) {
				// Get tabs element height
				const tabsHeight = tabsRef.current ? tabsRef.current.getBoundingClientRect().height : 0;

				const tabsStickyTop = isSmallScreen ? 500 : 300;

				offset = tabsStickyTop + tabsHeight + 20;
			}

			if (ref !== opSeriesRef && isSmallScreen) {
				const tabsHeight = tabsRef.current ? tabsRef.current.getBoundingClientRect().height : 0;

				const tabsStickyTop = isSmallScreen ? 140 : 160;

				offset = tabsStickyTop + tabsHeight + 20;
			}

			const elementPosition = ref.current.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.scrollY - offset;

			window.scrollTo({
				top: offsetPosition,
				behavior: "smooth",
			});
		}
	};

	const tabs = [
		{ name: "OP SERIES", ref: opSeriesRef },
		{ name: "EB SERIES", ref: ebSeriesRef },
		{ name: "PRB SERIES", ref: prbSetsRef },
		{ name: "ST SERIES", ref: stSeriesRef },
		{ name: "PROMO SERIES", ref: promoSeriesRef },
	];

	// Skeleton loader
	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
					{Array.from({ length: 20 }).map((_, index) => (
						<div key={index} className="p-4 bg-gray-700 rounded-lg shadow-md animate-pulse">
							{/* Skeleton Banner Image */}
							<div className="object-cover w-full h-auto mb-1 bg-gray-500 rounded aspect-2/1" />
							{/* Skeleton Set Name */}
							<div className="w-32 h-6 mb-1 bg-gray-500 rounded" />
							{/* Skeleton Set Key */}
							<div className="w-16 h-4 mb-1 bg-gray-500 rounded" />
							{/* Skeleton Count */}
							<div className="w-20 h-4 mb-1 bg-gray-500 rounded" />
							{/* Skeleton Last Scraped */}
							<div className="w-24 h-3 bg-gray-500 rounded" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-10 mt-5">
			{/* Tabs Navigation */}
			<div
				ref={tabsRef}
				className="sticky top-36 sm:top-20 z-10 flex flex-wrap gap-2 p-4 bg-grey/75 backdrop-blur-sm rounded-lg shadow-md">
				{tabs.map((tab) => (
					<button
						key={tab.name}
						onClick={() => scrollToSection(tab.ref)}
						className="px-4 py-2 font-semibold text-white transition-colors duration-200 bg-blue-700/75 rounded-md hover:bg-blue-800 cursor-pointer">
						{tab.name}
					</button>
				))}
			</div>

			{/* OP Sets Section */}
			<div ref={opSeriesRef} id="op-sets">
				<h2 className="mb-2 ml-2 text-2xl font-bold text-gray-800 uppercase">OP SERIES</h2>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
					{opSets.map((setKey) => {
						const setData = data[setKey];
						const bannerImage = bannerMap[setKey.toLowerCase()];
						const setName = setData.results[0]?.set || setKey.toUpperCase();

						return (
							<BannerCard
								key={setKey}
								setKey={setKey}
								bannerImage={bannerImage}
								setName={setName}
								count={setData.count}
								lastScraped={setData.lastScraped}
								onClick={() => handleSetClick(setKey)}
							/>
						);
					})}
				</div>
			</div>

			{/* EB Sets Section */}
			<div ref={ebSeriesRef} id="eb-sets">
				<h2 className="mb-2 ml-2 text-2xl font-bold text-gray-800 uppercase">EB SERIES</h2>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
					{ebSets.map((setKey) => {
						const setData = data[setKey];
						const bannerImage = bannerMap[setKey.toLowerCase()];
						const setName = setData.results[0]?.set || setKey.toUpperCase();

						return (
							<BannerCard
								key={setKey}
								setKey={setKey}
								bannerImage={bannerImage}
								setName={setName}
								count={setData.count}
								lastScraped={setData.lastScraped}
								onClick={() => handleSetClick(setKey)}
							/>
						);
					})}
				</div>
			</div>

			{/* PRB Sets Section */}
			<div ref={prbSetsRef} id="prb-sets">
				<h2 className="mb-2 ml-2 text-2xl font-bold text-gray-800 uppercase">PRB SERIES</h2>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
					{prbSets.map((setKey) => {
						const setData = data[setKey];
						const bannerImage = bannerMap[setKey.toLowerCase()];
						const setName = setData.results[0]?.set || setKey.toUpperCase();

						return (
							<BannerCard
								key={setKey}
								setKey={setKey}
								bannerImage={bannerImage}
								setName={setName}
								count={setData.count}
								lastScraped={setData.lastScraped}
								onClick={() => handleSetClick(setKey)}
							/>
						);
					})}
				</div>
			</div>

			{/* ST Sets Section */}
			<div ref={stSeriesRef} id="st-sets">
				<h2 className="mb-2 ml-2 text-2xl font-bold text-gray-800 uppercase">ST SERIES</h2>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
					{stSets.map((setKey) => {
						const setData = data[setKey];
						const bannerImage = bannerMap[setKey.toLowerCase()];
						const setName = setData.results[0]?.set || setKey.toUpperCase();

						return (
							<BannerCard
								key={setKey}
								setKey={setKey}
								bannerImage={bannerImage}
								setName={setName}
								count={setData.count}
								lastScraped={setData.lastScraped}
								onClick={() => handleSetClick(setKey)}
							/>
						);
					})}
				</div>
			</div>

			{/* Promo Sets Section */}
			<div ref={promoSeriesRef} id="promo-sets">
				<h2 className="mb-2 ml-2 text-2xl font-bold text-gray-800 uppercase">PROMO SERIES</h2>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
					{promoSets.map((setKey) => {
						const setData = data[setKey];
						const bannerImage = bannerMap[setKey.toLowerCase()];
						const setName = setData.results[0]?.set || setKey.toUpperCase();

						return (
							<BannerCard
								key={setKey}
								setKey={setKey}
								bannerImage={bannerImage}
								setName={setName}
								count={setData.count}
								lastScraped={setData.lastScraped}
								onClick={() => handleSetClick(setKey)}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default Banner;
