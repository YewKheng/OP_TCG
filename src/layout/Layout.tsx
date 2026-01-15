import Navbar from "../components/navbar/Navbar";

const Layout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="max-w-6xl min-h-screen pb-8 mx-auto">
			<Navbar />
			<div className="px-4">{children}</div>
		</div>
	);
};

export default Layout;
