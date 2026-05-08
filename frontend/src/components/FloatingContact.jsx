import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export const FloatingContact = () => {
  const [visible, setVisible] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 280);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const number = (settings.whatsapp_number || "").replace(/[^\d]/g, "");
  const link = number
    ? `https://wa.me/${number}?text=${encodeURIComponent("Hola Safe Steps, me gustaría más información")}`
    : "#contact";

  return (
    <a
      href={link}
      target={number ? "_blank" : undefined}
      rel={number ? "noopener noreferrer" : undefined}
      data-testid="floating-contact-button"
      aria-label="Contáctanos por WhatsApp"
      className={`breathe fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white px-5 py-4 text-sm font-semibold shadow-2xl shadow-black/40 transition-all duration-500 hover:bg-[#1FAD52] ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <MessageCircle size={16} />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
};

export default FloatingContact;
