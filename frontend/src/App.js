import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Products from "@/components/Products";
import HowItWorks from "@/components/HowItWorks";
import AppSection from "@/components/AppSection";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";
import CartDrawer from "@/components/CartDrawer";
import useRevealOnScroll from "@/hooks/useRevealOnScroll";

import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminSettings from "@/pages/admin/AdminSettings";

const Landing = () => {
  useRevealOnScroll();
  return (
    <main data-testid="landing-page" className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <Hero />
      <About />
      <Products />
      <HowItWorks />
      <AppSection />
      <Contact />
      <Footer />
      <FloatingContact />
      <CartDrawer />
    </main>
  );
};

function App() {
  return (
    <div className="App">
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <Toaster
              theme="dark"
              position="top-right"
              toastOptions={{
                style: {
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </div>
  );
}

export default App;
