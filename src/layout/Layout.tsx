import Navbar from "../components/navbar/Navbar";

const Layout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="min-h-screen max-w-6xl mx-auto px-4 pb-8">
			<Navbar />
			{children}
		</div>
	);
};

export default Layout;
