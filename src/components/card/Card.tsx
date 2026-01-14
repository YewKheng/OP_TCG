import React from "react";

interface SearchResult {
	name?: string;
	cardNumber?: string;
	price?: string;
	image?: string;
	link?: string;
	color?: string;
	[key: string]: unknown;
}

interface CardProps {
	result?: SearchResult;
	exchangeRate: number;
	onImageClick: (imageUrl: string) => void;
	isLoading?: boolean;
}

// Color translation mapping
const colorTranslation: Record<string, string> = {
	赤: "Red",
	青: "Blue",
	緑: "Green",
	黄: "Yellow",
	紫: "Purple",
	黒: "Black",
	赤色: "Red",
	青色: "Blue",
	緑色: "Green",
	黄色: "Yellow",
	紫色: "Purple",
	黒色: "Black",
};

// Function to translate color
const translateColor = (color: string | undefined): string => {
	if (!color) return "";
	return colorTranslation[color] || color;
};

// Function to convert JPY price to MYR
const convertToMYR = (priceString: string | undefined, exchangeRate: number): string => {
	if (!priceString) return "";

	// Extract numeric value from price string (e.g., "680円" or "2,480円")
	const numericValue = priceString.replace(/[^\d,]/g, "").replace(/,/g, "");
	const jpyAmount = parseFloat(numericValue);

	if (isNaN(jpyAmount)) return priceString;

	// Convert to MYR
	const myrAmount = jpyAmount * exchangeRate;

	// Format MYR with 2 decimal places
	return `RM ${myrAmount.toFixed(2)}`;
};

const Card: React.FC<CardProps> = ({ result, exchangeRate, onImageClick, isLoading = false }) => {
	// Skeleton loading state
	if (isLoading || !result) {
		return (
			<div className="flex flex-col items-center justify-start p-4 transition-shadow rounded-lg shadow-lg bg-gray-700 animate-pulse">
				{/* Skeleton Image */}
				<div className="w-[75%] h-46 mb-3 rounded-md bg-gray-500" />

				{/* Skeleton Card Number */}
				<div className="w-24 h-4 mb-1 rounded bg-gray-500" />

				{/* Skeleton Name */}
				<div className="flex flex-col items-center justify-center text-center mb-2">
					<div className="w-48 h-6 mb-1 rounded bg-gray-500" />
					<div className="w-40 h-4 rounded bg-gray-500" />
				</div>

				{/* Skeleton Color */}
				<div className="mb-2 w-20 h-4 rounded bg-gray-500" />

				{/* Skeleton Price */}
				<div className="mb-2 flex flex-col items-center justify-center">
					<div className="w-24 h-6 mb-1 rounded bg-gray-500" />
					<div className="w-20 h-4 rounded bg-gray-500" />
				</div>

				{/* Skeleton Link */}
				<div className="w-28 h-4 rounded bg-gray-500" />
			</div>
		);
	}

	const imageUrl = result.image?.startsWith("http")
		? result.image
		: result.image
		? `https://yuyu-tei.jp${result.image}`
		: undefined;

	const linkUrl = result.link?.startsWith("http")
		? result.link
		: result.link
		? `https://yuyu-tei.jp${result.link}`
		: undefined;

	return (
		<div className="flex flex-col items-center justify-start p-4 transition-shadow bg-indigo-600/75 rounded-lg shadow-lg hover:shadow-xl">
			{result.image && imageUrl && (
				<img
					src={imageUrl}
					alt={result.name || "Card image"}
					className="mb-3 rounded-md cursor-pointer hover:opacity-90 transition-opacity w-[75%] h-auto"
					onClick={() => onImageClick(imageUrl)}
					onError={(e) => {
						(e.target as HTMLImageElement).style.display = "none";
					}}
					loading="lazy"
				/>
			)}
			{result.cardNumber && (
				<p className="text-sm text-white border border-white rounded-md px-2 py-px">{result.cardNumber}</p>
			)}
			{result.name && (
				<div className="flex flex-col items-center justify-center text-center pt-2">
					<h4 className="mb-1 text-lg font-semibold text-white">{result.name}</h4>
				</div>
			)}
			<div className="mb-2 space-y-1 text-sm text-white">
				{result.color && (
					<p className="text-indigo-100">
						<span>Color:</span> {translateColor(result.color)}
					</p>
				)}
			</div>
			{result.price && (
				<div className="mb-2 flex flex-col items-center justify-center">
					<p className="text-xl font-bold text-white">{convertToMYR(result.price, exchangeRate)}</p>
					<p className="text-sm text-indigo-100">{result.price}</p>
				</div>
			)}
			{result.link && linkUrl && (
				<a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:underline">
					View Details →
				</a>
			)}
		</div>
	);
};

export default Card;
