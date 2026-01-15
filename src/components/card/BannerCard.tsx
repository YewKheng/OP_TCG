import React from "react";

interface BannerCardProps {
	setKey: string;
	bannerImage?: string;
	setName: string;
	count: number;
	lastScraped: string;
	onClick: () => void;
}

const BannerCard: React.FC<BannerCardProps> = ({ setKey, bannerImage, setName, count, lastScraped, onClick }) => {
	return (
		<div
			onClick={onClick}
			className="p-4 transition-all rounded-lg shadow-md cursor-pointer bg-grey/75 hover:shadow-lg hover:scale-105">
			{bannerImage && (
				<img
					src={bannerImage}
					alt={`${setKey} Banner`}
					className="object-cover object-top w-full h-auto mb-1 rounded aspect-2/1"
				/>
			)}
			<h3 className="mb-1 text-lg font-bold text-black">{setName}</h3>
			<p className="mb-1 text-sm font-semibold text-black">{setKey.toUpperCase()}</p>
			<p className="text-sm font-medium text-black">Count: {count}</p>
			<p className="text-xs text-gray-900/75">
				Last update: {new Date(lastScraped).toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}{" "}
				{new Date(lastScraped).toLocaleTimeString("en-MY", {
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
					timeZone: "Asia/Kuala_Lumpur",
				})}
			</p>
		</div>
	);
};

export default BannerCard;
