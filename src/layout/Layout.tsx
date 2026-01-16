import Navbar from "../components/navbar/Navbar";
import Footer from "../components/footer/Footer";

const Layout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="max-w-6xl min-h-screen mx-auto">
			<Navbar />
			<div className="px-4 pb-4">{children}</div>
			<Footer />
		</div>
	);
};

export default Layout;
