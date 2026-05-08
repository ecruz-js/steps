import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SettingsContext = createContext(null);

const DEFAULTS = {
  whatsapp_number: "+18095551234",
  contact_email: "hola@safesteps.app",
  contact_phone: "+18095551234",
  instagram: "@safesteps.app",
  currency: "DOP",
  currency_symbol: "RD$",
  free_shipping_threshold: 3000,
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    let alive = true;
    axios
      .get(`${API}/settings`)
      .then((r) => {
        if (alive) setSettings({ ...DEFAULTS, ...r.data });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const refresh = async () => {
    const r = await axios.get(`${API}/settings`);
    setSettings({ ...DEFAULTS, ...r.data });
  };

  return (
    <SettingsContext.Provider value={{ settings, refresh, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
};

export const formatPrice = (amount, symbol = "RD$") => {
  if (amount == null) return "";
  return `${symbol} ${Number(amount).toLocaleString("es-DO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};
