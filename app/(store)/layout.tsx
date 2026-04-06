import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartProvider from "../components/CartProvider";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </CartProvider>
  );
}
