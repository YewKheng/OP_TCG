import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

// Layout
import Layout from "./layout/Layout.tsx";

// Pages
import LandingPage from "./page/LandingPage.tsx";
import SearchPage from "./page/SearchPage.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Layout>
				<Routes>
					<Route path="/" element={<LandingPage />} />
					<Route path="/search" element={<SearchPage />} />
				</Routes>
			</Layout>
		</BrowserRouter>
	</StrictMode>
);
