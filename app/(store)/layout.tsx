import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartProvider from "../components/CartProvider";
import CategorySidebar from "../components/CategorySidebar";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Navbar />
      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        <CategorySidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <Footer />
    </CartProvider>
  );
}
