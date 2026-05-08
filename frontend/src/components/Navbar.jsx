import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

const NAV = [
  { label: "Inicio", href: "#hero" },
  { label: "Nosotros", href: "#about" },
  { label: "Productos", href: "#products" },
  { label: "Asesoría", href: "#how" },
  { label: "App", href: "#app" },
  { label: "Contacto", href: "#contact" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { count, setOpen: setCartOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-navbar"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-xl bg-[#0A0A0A]/75 border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-[72px] flex items-center justify-between">
        <a
          href="#hero"
          data-testid="brand-logo-link"
          className="flex items-center gap-3 group"
        >
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#0A0A0A] font-bold font-display tracking-tight">
            S
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#0B1B3A] pulse-dot" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Safe<span className="text-white/60">Steps</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              data-testid={`nav-link-${n.label.toLowerCase()}`}
              className="px-3 py-2 text-sm font-body text-white/60 hover:text-white transition-colors"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            data-testid="navbar-cart-button"
            onClick={() => setCartOpen(true)}
            aria-label="Carrito"
            className="relative h-10 w-10 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center transition"
          >
            <ShoppingBag size={16} />
            {count > 0 && (
              <span
                data-testid="navbar-cart-count"
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-white text-[10px] font-bold text-black flex items-center justify-center"
              >
                {count}
              </span>
            )}
          </button>
          <a
            href="#app"
            data-testid="navbar-app-cta"
            className="btn-press inline-flex items-center justify-center rounded-full bg-white text-[#0A0A0A] px-5 py-2.5 text-sm font-semibold hover:bg-white/90 transition"
          >
            Descarga la App
          </a>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button
            data-testid="mobile-cart-button"
            onClick={() => setCartOpen(true)}
            aria-label="Carrito"
            className="relative h-10 w-10 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center"
          >
            <ShoppingBag size={16} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-white text-[10px] font-bold text-black flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80 hover:text-white"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          data-testid="mobile-menu"
          className="md:hidden border-t border-white/[0.06] bg-[#0A0A0A]/95 backdrop-blur-xl"
        >
          <nav className="px-6 py-4 flex flex-col gap-1">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                data-testid={`mobile-nav-link-${n.label.toLowerCase()}`}
                className="px-3 py-3 text-sm font-body text-white/70 hover:text-white border-b border-white/[0.04] last:border-0"
              >
                {n.label}
              </a>
            ))}
            <a
              href="#app"
              onClick={() => setOpen(false)}
              data-testid="mobile-app-cta"
              className="mt-3 inline-flex justify-center items-center rounded-full bg-white text-[#0A0A0A] px-5 py-3 text-sm font-semibold"
            >
              Descarga la App
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
