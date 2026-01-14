/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				grey: "#d9d9d9",
				blue: "#5da9e9",
				teal: "#6ed3b2",
				yellow: "#ffd84d",
				red: "#ff8a7a",
				black: "#333333",
				grey: "#d9d9d9",
			},
			animation: {
				"spin-slow": "spin 20s linear infinite",
			},
		},
	},
	plugins: [],
};
