import { useState } from "react";
import axios from "axios";
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSettings, formatPrice } from "@/context/SettingsContext";
import { backendFileUrl } from "@/lib/backendFileUrl";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CartDrawer = () => {
  const { items, open, setOpen, updateQty, remove, clear, subtotal, count } = useCart();
  const { settings } = useSettings();
  const [view, setView] = useState("cart"); // cart | checkout
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    address: "",
    city: "",
    notes: "",
  });

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const buildWhatsappMessage = (order) => {
    const lines = [];
    lines.push(`*Nuevo pedido SafeSteps* — ${order.order_number}`);
    lines.push("");
    lines.push(`👤 *Cliente:* ${order.customer_name}`);
    lines.push(`📞 *Teléfono:* ${order.customer_phone}`);
    if (order.customer_email) lines.push(`✉️ *Email:* ${order.customer_email}`);
    if (order.city) lines.push(`📍 *Ciudad:* ${order.city}`);
    if (order.address) lines.push(`🏠 *Dirección:* ${order.address}`);
    lines.push("");
    lines.push("*Productos:*");
    order.items.forEach((it) => {
      lines.push(
        `• ${it.quantity}× ${it.name}${it.color ? ` (color ${it.color})` : ""} — ${formatPrice(
          it.price * it.quantity,
          settings.currency_symbol
        )}`
      );
    });
    lines.push("");
    lines.push(`*Total:* ${formatPrice(order.total, settings.currency_symbol)}`);
    if (order.notes) {
      lines.push("");
      lines.push(`📝 *Notas:* ${order.notes}`);
    }
    return lines.join("\n");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!form.customer_name.trim() || form.customer_phone.trim().length < 6) {
      toast.error("Completa nombre y teléfono");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        ...form,
        customer_email: form.customer_email || undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          color: i.color,
          image: i.image,
        })),
      };
      const res = await axios.post(`${API}/orders`, payload);
      const order = res.data;
      const text = encodeURIComponent(buildWhatsappMessage(order));
      const number = (settings.whatsapp_number || "").replace(/[^\d]/g, "");
      const link = `https://wa.me/${number}?text=${text}`;
      window.open(link, "_blank", "noopener,noreferrer");
      toast.success(`Pedido ${order.order_number} creado`, {
        description: "Te llevamos a WhatsApp para confirmarlo.",
      });
      clear();
      setView("cart");
      setOpen(false);
      setForm({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        address: "",
        city: "",
        notes: "",
      });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error("No pudimos crear el pedido", {
        description: typeof detail === "string" ? detail : "Inténtalo de nuevo",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="cart-backdrop"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Drawer */}
      <aside
        data-testid="cart-drawer"
        className={`fixed top-0 right-0 z-[70] h-full w-full sm:w-[440px] bg-[#0A0A0A] border-l border-white/10 shadow-2xl transition-transform duration-500 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} />
            <div>
              <div className="font-display text-lg tracking-tight">
                {view === "cart" ? "Tu carrito" : "Datos de envío"}
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                {count} {count === 1 ? "pieza" : "piezas"}
              </div>
            </div>
          </div>
          <button
            data-testid="cart-close"
            onClick={() => setOpen(false)}
            className="h-9 w-9 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center"
            aria-label="Cerrar carrito"
          >
            <X size={16} />
          </button>
        </header>

        {view === "cart" ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" data-testid="cart-items">
              {items.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <ShoppingBag size={20} className="text-white/40" />
                  </div>
                  <div className="text-white/60 font-body">Tu carrito está vacío</div>
                  <button
                    data-testid="cart-empty-cta"
                    onClick={() => setOpen(false)}
                    className="mt-6 inline-flex rounded-full bg-white text-black px-5 py-2.5 text-sm font-semibold"
                  >
                    Explorar catálogo
                  </button>
                </div>
              ) : (
                items.map((it) => (
                  <div
                    key={`${it.product_id}-${it.color}`}
                    data-testid={`cart-item-${it.product_id}`}
                    className="flex gap-3 rounded-xl border border-white/10 bg-[#111827]/50 p-3"
                  >
                    <img
                      src={backendFileUrl(it.image)}
                      alt={it.name}
                      className="h-20 w-20 rounded-lg object-cover border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm tracking-tight">{it.name}</div>
                      {it.color && (
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="h-3 w-3 rounded-full border border-white/20"
                            style={{ backgroundColor: it.color }}
                          />
                          <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                            color
                          </span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-full border border-white/10">
                          <button
                            data-testid={`qty-dec-${it.product_id}`}
                            onClick={() => updateQty(it.product_id, it.color, -1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-white/10 rounded-l-full"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 text-sm tabular-nums">{it.quantity}</span>
                          <button
                            data-testid={`qty-inc-${it.product_id}`}
                            onClick={() => updateQty(it.product_id, it.color, +1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-white/10 rounded-r-full"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="text-sm font-display tracking-tight">
                          {formatPrice(it.price * it.quantity, settings.currency_symbol)}
                        </div>
                      </div>
                    </div>
                    <button
                      data-testid={`cart-remove-${it.product_id}`}
                      onClick={() => remove(it.product_id, it.color)}
                      className="h-8 w-8 self-start rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-white/10 px-6 py-5 space-y-4 bg-[#0A0A0A]">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm font-body">Subtotal</span>
                  <span className="font-display text-xl tracking-tight">
                    {formatPrice(subtotal, settings.currency_symbol)}
                  </span>
                </div>
                {settings.free_shipping_threshold > 0 && subtotal < settings.free_shipping_threshold && (
                  <div className="text-xs text-white/50 font-body">
                    Te faltan{" "}
                    {formatPrice(
                      settings.free_shipping_threshold - subtotal,
                      settings.currency_symbol
                    )}{" "}
                    para envío gratis.
                  </div>
                )}
                <button
                  data-testid="cart-checkout-cta"
                  onClick={() => setView("checkout")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-black py-4 text-sm font-semibold hover:bg-white/90"
                >
                  <MessageCircle size={16} />
                  Pedir por WhatsApp
                </button>
                <button
                  data-testid="cart-clear"
                  onClick={clear}
                  className="w-full text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white"
                >
                  Vaciar carrito
                </button>
              </footer>
            )}
          </>
        ) : (
          <form
            onSubmit={submit}
            data-testid="checkout-form"
            className="flex-1 overflow-y-auto px-6 py-5 space-y-3 flex flex-col"
          >
            <CkField
              label="Nombre completo *"
              testid="checkout-name"
              value={form.customer_name}
              onChange={onChange("customer_name")}
              required
            />
            <CkField
              label="Teléfono / WhatsApp *"
              testid="checkout-phone"
              value={form.customer_phone}
              onChange={onChange("customer_phone")}
              placeholder="+1 809 ..."
              required
            />
            <CkField
              label="Email (opcional)"
              testid="checkout-email"
              type="email"
              value={form.customer_email}
              onChange={onChange("customer_email")}
            />
            <div className="grid grid-cols-2 gap-3">
              <CkField
                label="Ciudad"
                testid="checkout-city"
                value={form.city}
                onChange={onChange("city")}
              />
              <CkField
                label="Dirección"
                testid="checkout-address"
                value={form.address}
                onChange={onChange("address")}
              />
            </div>
            <div>
              <label className="label-eyebrow !text-[0.62rem] block mb-1.5">Notas (opcional)</label>
              <textarea
                data-testid="checkout-notes"
                value={form.notes}
                onChange={onChange("notes")}
                rows={3}
                placeholder="Personalización, talla, instrucciones..."
                className="w-full rounded-xl bg-[#111827]/60 border border-white/10 px-4 py-3 text-sm placeholder-white/30 focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-[#111827]/40 p-4 mt-2">
              <div className="label-eyebrow !text-[0.6rem] mb-2">Resumen</div>
              <div className="space-y-1 text-sm font-body text-white/70">
                {items.map((i) => (
                  <div key={`${i.product_id}-${i.color}`} className="flex justify-between gap-2">
                    <span className="truncate">
                      {i.quantity}× {i.name}
                    </span>
                    <span className="tabular-nums whitespace-nowrap">
                      {formatPrice(i.price * i.quantity, settings.currency_symbol)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                <span className="text-white/60">Total</span>
                <span className="font-display text-lg tracking-tight">
                  {formatPrice(subtotal, settings.currency_symbol)}
                </span>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-4">
              <button
                type="submit"
                disabled={submitting}
                data-testid="checkout-submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-black py-4 text-sm font-semibold hover:bg-white/90 disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <MessageCircle size={16} />
                )}
                {submitting ? "Procesando..." : "Confirmar y abrir WhatsApp"}
              </button>
              <button
                type="button"
                onClick={() => setView("cart")}
                data-testid="checkout-back"
                className="text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white"
              >
                ← Volver al carrito
              </button>
            </div>
          </form>
        )}
      </aside>
    </>
  );
};

const CkField = ({ label, testid, type = "text", ...rest }) => (
  <div>
    <label className="label-eyebrow !text-[0.62rem] block mb-1.5">{label}</label>
    <input
      data-testid={testid}
      type={type}
      {...rest}
      className="w-full rounded-xl bg-[#111827]/60 border border-white/10 px-4 py-3 text-sm placeholder-white/30 focus:outline-none focus:border-white/40"
    />
  </div>
);

export default CartDrawer;
