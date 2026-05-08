import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "safesteps:cart:v1";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add = (product, opts = {}) => {
    const color = opts.color ?? product.colors?.[0] ?? null;
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.product_id === product.id && i.color === color
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          color,
          image: product.image,
        },
      ];
    });
    toast.success(`${product.name} agregado al carrito`);
    setOpen(true);
  };

  const updateQty = (product_id, color, delta) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.product_id === product_id && i.color === color
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const remove = (product_id, color) => {
    setItems((prev) =>
      prev.filter((i) => !(i.product_id === product_id && i.color === color))
    );
  };

  const clear = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items]
  );
  const count = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        open,
        setOpen,
        add,
        updateQty,
        remove,
        clear,
        subtotal,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
