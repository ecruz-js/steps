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
import useRevealOnScroll from "@/hooks/useRevealOnScroll";

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
    </main>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
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
    </div>
  );
}

export default App;
