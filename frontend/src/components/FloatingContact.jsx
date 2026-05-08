import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

export const FloatingContact = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 280);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href="#contact"
      data-testid="floating-contact-button"
      aria-label="Contáctanos"
      className={`breathe fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-white text-[#0A0A0A] px-5 py-4 text-sm font-semibold shadow-2xl shadow-black/40 transition-all duration-500 hover:bg-white/90 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <MessageCircle size={16} />
      <span className="hidden sm:inline">Contáctanos</span>
    </a>
  );
};

export default FloatingContact;
