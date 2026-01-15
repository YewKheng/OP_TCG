import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Assets
import cincaiLogo from "../../assets/cincai.png";
import { Languages, X, ArrowDown10, ArrowUp10, BanknoteArrowDown, BanknoteArrowUp, Gem } from "lucide-react";

const Navbar = () => {
	const [searchWord, setSearchWord] = useState("");
	const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
	const [showTranslateDropdownMobile, setShowTranslateDropdownMobile] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const translateDropdownRef = useRef<HTMLDivElement>(null);
	const translateDropdownRefMobile = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();
	const location = useLocation();

	// Get sort value from URL params
	const searchParams = new URLSearchParams(location.search);
	const sortBy =
		(searchParams.get("sort") as "rarity" | "priceLow" | "priceHigh" | "cardNumberLow" | "cardNumberHigh") || "rarity";

	// Read search query from URL on mount/route change
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const query = params.get("q");
		if (query) {
			setTimeout(() => {
				setSearchWord(query);
			}, 0);
		}
	}, [location.search]);

	// Track scroll position to add background when scrolled
	useEffect(() => {
		const handleScroll = () => {
			const scrollY = window.scrollY;
			setIsScrolled(scrollY > 0);
		};

		window.addEventListener("scroll", handleScroll);
		// Check initial scroll position
		handleScroll();

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	// Close dropdown when clicking outside (desktop)
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

	// Close dropdown when clicking outside (mobile)
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (translateDropdownRefMobile.current && !translateDropdownRefMobile.current.contains(event.target as Node)) {
				setShowTranslateDropdownMobile(false);
			}
		};

		if (showTranslateDropdownMobile) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showTranslateDropdownMobile]);

	// Function to trigger Google Translate
	const triggerTranslate = (targetLang: string) => {
		setShowTranslateDropdown(false);
		setShowTranslateDropdownMobile(false);

		// Set the translation cookie
		const cookieValue = `/ja/${targetLang}`;
		const cookieString = `googtrans=${cookieValue}; path=/; max-age=31536000; SameSite=Lax`;
		document.cookie = cookieString;

		// Small delay to ensure cookie is set, then reload
		setTimeout(() => {
			console.log("Reloading page...");
			window.location.reload();
		}, 100);
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchWord.trim()) return;
		// Blur the input to close mobile keyboard
		searchInputRef.current?.blur();
		// Navigate to search page with query parameter
		navigate(`/search?q=${encodeURIComponent(searchWord.trim())}`);
	};

	const handleSortChange = (newSort: "rarity" | "priceLow" | "priceHigh" | "cardNumberLow" | "cardNumberHigh") => {
		const params = new URLSearchParams(location.search);
		if (newSort === "rarity") {
			params.delete("sort");
		} else {
			params.set("sort", newSort);
		}
		navigate(`${location.pathname}?${params.toString()}`);
		setShowSortModal(false);
	};

	return (
		<>
			<nav
				className={`sticky top-0 z-20 w-full px-4 py-2 mb-4 backdrop-blur-xs transition-colors duration-200 ${
					isScrolled ? "bg-black/10 drop-shadow-2xl" : ""
				}`}>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					{/* Logo/Brand */}
					<div className="flex items-center justify-between w-full sm:w-auto">
						<a href="/">
							<img src={cincaiLogo} alt="Cincai Logo" className="w-24 h-auto" />
						</a>
						{/* Mobile: Sort and Translate buttons */}
						<div className="flex items-center gap-2 sm:hidden">
							{/* Sort button - only show on search page */}
							{location.pathname === "/search" && (
								<button
									onClick={() => setShowSortModal(true)}
									className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-300">
									<span>Sort:</span>
									<span className="font-semibold">
										{sortBy === "rarity"
											? "Rarity"
											: sortBy === "priceHigh"
											? "Price ↓"
											: sortBy === "priceLow"
											? "Price ↑"
											: sortBy === "cardNumberHigh"
											? "Card ↓"
											: "Card ↑"}
									</span>
								</button>
							)}
							{/* Translate button */}
							<div className="relative cursor-pointer notranslate" ref={translateDropdownRefMobile}>
								<button
									onClick={() => setShowTranslateDropdownMobile(!showTranslateDropdownMobile)}
									className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-white rounded-md hover:bg-gray-300 notranslate">
									<Languages className="w-4 h-4" />
									<span className="notranslate">Translate</span>
								</button>
								{showTranslateDropdownMobile && (
									<div className="absolute right-0 z-50 w-48 mt-2 bg-white border border-gray-200 rounded-md shadow-lg notranslate">
										<button
											onClick={() => triggerTranslate("ja")}
											className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-300 notranslate">
											Japanese
										</button>
										<button
											onClick={() => triggerTranslate("en")}
											className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-300 notranslate">
											English
										</button>
									</div>
								)}
							</div>
							<div
								id="google_translate_element_mobile"
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

					{/* Search Form */}
					<form onSubmit={handleSearch} className="flex flex-1 gap-3 sm:max-w-md">
						<input
							ref={searchInputRef}
							type="text"
							value={searchWord}
							onChange={(e) => setSearchWord(e.target.value)}
							placeholder="Enter search term (e.g., 09-118)"
							className="flex-1 p-3 text-black bg-white border border-gray-300 rounded-md outline-none drop-shadow-lg"
						/>
						<button
							type="submit"
							className="px-6 font-semibold text-white transition-colors duration-200 bg-blue-600 rounded-md hover:bg-blue-800 whitespace-nowrap drop-shadow-lg cursor-pointer">
							Search
						</button>
					</form>

					{/* Desktop: Sort and Translate buttons */}
					<div className="items-center hidden gap-2 sm:flex">
						{/* Sort button - only show on search page */}
						{location.pathname === "/search" && (
							<button
								onClick={() => setShowSortModal(true)}
								className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-300">
								<span>Sort:</span>
								<span className="font-semibold">
									{sortBy === "rarity"
										? "Rarity"
										: sortBy === "priceHigh"
										? "Price (High to Low)"
										: sortBy === "priceLow"
										? "Price (Low to High)"
										: sortBy === "cardNumberHigh"
										? "Card Number (High to Low)"
										: "Card Number (Low to High)"}
								</span>
							</button>
						)}
						{/* Translate button */}
						<div className="relative cursor-pointer notranslate" ref={translateDropdownRef}>
							<button
								onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
								className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-300 notranslate cursor-pointer">
								<Languages className="w-4 h-4" />
								<span className="notranslate">Translate</span>
							</button>
							{showTranslateDropdown && (
								<div className="absolute right-0 z-50 w-48 mt-2 bg-white border border-gray-200 rounded-md shadow-lg notranslate">
									<button
										onClick={() => triggerTranslate("ja")}
										className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-300 notranslate">
										Japanese
									</button>
									<button
										onClick={() => triggerTranslate("en")}
										className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-300 notranslate">
										English
									</button>
								</div>
							)}
						</div>
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
							}}>
							{" "}
						</div>
					</div>
				</div>
			</nav>

			{/* Sort Modal - Slide up from bottom */}
			<AnimatePresence>
				{showSortModal && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
							onClick={() => setShowSortModal(false)}
						/>
						{/* Modal */}
						<motion.div
							initial={{ y: "100%" }}
							animate={{ y: 0 }}
							exit={{ y: "100%" }}
							transition={{ type: "spring", damping: 25, stiffness: 200 }}
							className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl rounded-t-3xl max-w-6xl mx-auto"
							onClick={(e: React.MouseEvent) => e.stopPropagation()}>
							{/* Handle bar */}
							<div className="flex justify-center pt-3 pb-2">
								<div className="w-12 h-1 bg-gray-300 rounded-full" />
							</div>
							{/* Header */}
							<div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200">
								<h3 className="text-xl font-bold text-gray-900">Sort by</h3>
								<button
									onClick={() => setShowSortModal(false)}
									className="p-2 text-gray-500 transition-colors rounded-full hover:bg-gray-100">
									<X className="w-5 h-5" />
								</button>
							</div>
							{/* Sort Options */}
							<div className="px-6 py-4 space-y-2">
								<button
									onClick={() => handleSortChange("rarity")}
									className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors cursor-pointer ${
										sortBy === "rarity"
											? "bg-indigo-100 text-indigo-700 font-semibold"
											: "bg-gray-50 text-gray-700 hover:bg-gray-200"
									}`}>
									<div className="flex items-center gap-3">
										<Gem className="w-5 h-5" />
										<span>Rarity</span>
									</div>
									{sortBy === "rarity" && <div className="w-2 h-2 bg-indigo-700 rounded-full" />}
								</button>
								<button
									onClick={() => handleSortChange("priceHigh")}
									className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors cursor-pointer ${
										sortBy === "priceHigh"
											? "bg-indigo-100 text-indigo-700 font-semibold"
											: "bg-gray-50 text-gray-700 hover:bg-gray-200"
									}`}>
									<div className="flex items-center gap-3">
										<BanknoteArrowDown className="w-5 h-5" />
										<span>Price (High to Low)</span>
									</div>
									{sortBy === "priceHigh" && <div className="w-2 h-2 bg-indigo-700 rounded-full" />}
								</button>
								<button
									onClick={() => handleSortChange("priceLow")}
									className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors cursor-pointer ${
										sortBy === "priceLow"
											? "bg-indigo-100 text-indigo-700 font-semibold"
											: "bg-gray-50 text-gray-700 hover:bg-gray-200"
									}`}>
									<div className="flex items-center gap-3">
										<BanknoteArrowUp className="w-5 h-5" />
										<span>Price (Low to High)</span>
									</div>
									{sortBy === "priceLow" && <div className="w-2 h-2 bg-indigo-700 rounded-full" />}
								</button>
								<button
									onClick={() => handleSortChange("cardNumberHigh")}
									className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors cursor-pointer ${
										sortBy === "cardNumberHigh"
											? "bg-indigo-100 text-indigo-700 font-semibold"
											: "bg-gray-50 text-gray-700 hover:bg-gray-200"
									}`}>
									<div className="flex items-center gap-3">
										<ArrowDown10 className="w-5 h-5" />
										<span>Card Number (High to Low)</span>
									</div>
									{sortBy === "cardNumberHigh" && <div className="w-2 h-2 bg-indigo-700 rounded-full" />}
								</button>
								<button
									onClick={() => handleSortChange("cardNumberLow")}
									className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors cursor-pointer ${
										sortBy === "cardNumberLow"
											? "bg-indigo-100 text-indigo-700 font-semibold"
											: "bg-gray-50 text-gray-700 hover:bg-gray-200"
									}`}>
									<div className="flex items-center gap-3">
										<ArrowUp10 className="w-5 h-5" />
										<span>Card Number (Low to High)</span>
									</div>
									{sortBy === "cardNumberLow" && <div className="w-2 h-2 bg-indigo-700 rounded-full" />}
								</button>
							</div>
							<div className="pb-6" />
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
};

export default Navbar;
