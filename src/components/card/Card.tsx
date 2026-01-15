import React from "react";

// Interface Types
import type { SearchResult } from "../../interface/types";

interface CardProps {
	result?: SearchResult;
	exchangeRate: number;
	onImageClick: (imageUrl: string) => void;
	isLoading?: boolean;
}

// Function to convert JPY price to MYR
const convertToMYR = (priceString: string | undefined, exchangeRate: number): string => {
	if (!priceString) return "";

	// Extract numeric value from price string
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
			<div className="flex flex-col items-center justify-start p-4 transition-shadow bg-gray-700 rounded-lg shadow-lg animate-pulse">
				{/* Skeleton Image */}
				<div className="w-[75%] h-46 mb-3 rounded-md bg-gray-500" />

				{/* Skeleton Card Number */}
				<div className="w-24 h-4 mb-1 bg-gray-500 rounded" />

				{/* Skeleton Name */}
				<div className="flex flex-col items-center justify-center mb-2 text-center">
					<div className="w-48 h-6 mb-1 bg-gray-500 rounded" />
					<div className="w-40 h-4 bg-gray-500 rounded" />
				</div>

				{/* Skeleton Price */}
				<div className="flex flex-col items-center justify-center mb-2">
					<div className="w-24 h-6 mb-1 bg-gray-500 rounded" />
					<div className="w-20 h-4 bg-gray-500 rounded" />
				</div>

				{/* Skeleton Link */}
				<div className="h-4 bg-gray-500 rounded w-28" />
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
		<div className="flex flex-col items-center justify-start p-4 transition-shadow rounded-lg shadow-lg bg-grey/75 hover:shadow-xl hover:scale-105">
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
				<p className="px-2 py-px text-sm font-semibold text-black border-2 border-black rounded-md">
					{result.cardNumber}
				</p>
			)}
			{result.name && (
				<div className="flex flex-col items-center justify-center pt-2 text-center">
					<h4 className="mb-1 text-lg font-bold text-black">{result.name}</h4>
				</div>
			)}
			{result.price && (
				<div className="flex flex-col items-center justify-center mb-2">
					<p className="text-xl font-bold text-black">{convertToMYR(result.price, exchangeRate)}</p>
					<p className="text-sm font-semibold text-black">{result.price}</p>
				</div>
			)}
			{result.link && linkUrl && (
				<a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-black/75 hover:underline">
					View Details →
				</a>
			)}
		</div>
	);
};

export default Card;
