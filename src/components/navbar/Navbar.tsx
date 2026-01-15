import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Assets
import cincaiLogo from "../../assets/cincai.png";
import { Languages } from "lucide-react";

const Navbar = () => {
	const [searchWord, setSearchWord] = useState("");
	const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
	const [showTranslateDropdownMobile, setShowTranslateDropdownMobile] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const translateDropdownRef = useRef<HTMLDivElement>(null);
	const translateDropdownRefMobile = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const location = useLocation();

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
		// Navigate to search page with query parameter
		navigate(`/search?q=${encodeURIComponent(searchWord.trim())}`);
	};

	return (
		<nav
			className={`sticky top-0 z-20 w-full px-4 py-2 mb-8 backdrop-blur-xs transition-colors duration-200 ${
				isScrolled ? "bg-black/10 drop-shadow-2xl" : ""
			}`}>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				{/* Logo/Brand */}
				<div className="flex items-center justify-between w-full sm:w-auto">
					<a href="/">
						<img src={cincaiLogo} alt="Cincai Logo" className="w-24 h-auto" />
					</a>
					{/* Mobile: Translate button */}
					<div className="relative cursor-pointer sm:hidden notranslate" ref={translateDropdownRefMobile}>
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
						type="text"
						value={searchWord}
						onChange={(e) => setSearchWord(e.target.value)}
						placeholder="Enter search term (e.g., 09-118)"
						className="flex-1 p-3 text-black bg-white border border-gray-300 rounded-md outline-none drop-shadow-lg"
					/>
					<button
						type="submit"
						className="px-6 font-semibold text-white transition-colors duration-200 bg-indigo-600 rounded-md hover:bg-indigo-700 whitespace-nowrap drop-shadow-lg">
						Search
					</button>
				</form>

				{/* Desktop: Translate button */}
				<div className="hidden cursor-pointer sm:block">
					<div className="relative notranslate" ref={translateDropdownRef}>
						<button
							onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
							className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-300 notranslate">
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
						}}></div>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
