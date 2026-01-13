import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
// import LandingPage from "./page/LandingPage.tsx";
import SearchPage from "./page/SearchPage.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				{/* <Route path="/" element={<LandingPage />} /> */}
				<Route path="/" element={<SearchPage />} />
			</Routes>
		</BrowserRouter>
	</StrictMode>
);
