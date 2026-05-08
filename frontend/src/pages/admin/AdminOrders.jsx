import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, X, Trash2, MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, useSettings } from "@/context/SettingsContext";
import { StatusBadge } from "@/pages/admin/AdminDashboard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STATUSES = ["pendiente", "confirmado", "enviado", "entregado", "cancelado"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");
  const [selected, setSelected] = useState(null);
  const { settings } = useSettings();

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/orders`);
      setOrders(res.data || []);
    } catch (e) {
      toast.error("No pudimos cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await axios.patch(`${API}/admin/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? res.data : o)));
      if (selected?.id === id) setSelected(res.data);
      toast.success(`Pedido marcado como ${status}`);
    } catch (e) {
      toast.error("No se pudo actualizar");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar este pedido permanentemente?")) return;
    try {
      await axios.delete(`${API}/admin/orders/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Pedido eliminado");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const filtered = filter === "todos" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="p-6 lg:p-10 max-w-7xl">
      <header className="mb-8">
        <div className="label-eyebrow">Pedidos</div>
        <h1 className="font-display text-3xl lg:text-4xl tracking-tight mt-2">
          Bandeja de pedidos
        </h1>
        <p className="text-white/55 font-body mt-2 text-sm">
          Revisa cada pedido recibido. Puedes cambiar el estado o abrir el chat de WhatsApp del cliente.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-5" data-testid="orders-filters">
        {["todos", ...STATUSES].map((s) => {
          const count = s === "todos" ? orders.length : orders.filter((o) => o.status === s).length;
          const active = filter === s;
          return (
            <button
              key={s}
              data-testid={`order-filter-${s}`}
              onClick={() => setFilter(s)}
              className={`chip btn-press px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.16em] border ${
                active
                  ? "bg-white text-[#0A0A0A] border-white"
                  : "bg-transparent text-white/60 border-white/15 hover:text-white hover:border-white/40"
              }`}
            >
              {s} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#111827]/40 overflow-hidden">
        {loading ? (
          <div className="py-14 text-center text-white/40 text-sm">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-white/40 text-sm">No hay pedidos en este filtro.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-white/50 uppercase text-[10px] tracking-[0.18em]">
              <tr>
                <th className="text-left px-5 py-3">Pedido</th>
                <th className="text-left px-5 py-3">Cliente</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Items</th>
                <th className="text-right px-5 py-3">Total</th>
                <th className="text-center px-5 py-3">Estado</th>
                <th className="text-right px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  data-testid={`admin-order-row-${o.id}`}
                  onClick={() => setSelected(o)}
                  className="border-t border-white/5 hover:bg-white/[0.03] cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <div className="font-display tracking-tight">{o.order_number}</div>
                    <div className="text-[11px] text-white/40">
                      {new Date(o.created_at).toLocaleString("es-DO")}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-white/85">{o.customer_name}</div>
                    <div className="text-xs text-white/40">{o.customer_phone}</div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-white/65">
                    {o.items.reduce((s, i) => s + i.quantity, 0)} pieza(s)
                  </td>
                  <td className="px-5 py-3 text-right font-display tracking-tight">
                    {formatPrice(o.total, settings.currency_symbol)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(o);
                      }}
                      className="text-xs uppercase tracking-[0.18em] text-white/40 hover:text-white"
                    >
                      Detalles →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <OrderDetail
          order={selected}
          settings={settings}
          onClose={() => setSelected(null)}
          onStatusChange={(s) => updateStatus(selected.id, s)}
          onDelete={() => remove(selected.id)}
        />
      )}
    </div>
  );
}

const OrderDetail = ({ order, settings, onClose, onStatusChange, onDelete }) => {
  const phone = (order.customer_phone || "").replace(/[^\d]/g, "");
  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-end"
      onClick={onClose}
      data-testid="order-detail-modal"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full sm:w-[480px] bg-[#0A0A0A] border-l border-white/10 overflow-y-auto"
      >
        <header className="px-6 py-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0A0A0A] z-10">
          <div>
            <div className="label-eyebrow">{order.order_number}</div>
            <h3 className="font-display text-lg tracking-tight mt-1">{order.customer_name}</h3>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center">
            <X size={16} />
          </button>
        </header>

        <div className="px-6 py-5 space-y-5">
          <section>
            <div className="label-eyebrow !text-[0.62rem] mb-2">Estado</div>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  data-testid={`status-set-${s}`}
                  className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.16em] border transition ${
                    order.status === s
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-white/60 border-white/15 hover:border-white/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="label-eyebrow !text-[0.62rem] mb-2">Cliente</div>
            <div className="space-y-2 text-sm font-body">
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 text-white/80 hover:text-white"
              >
                <Phone size={14} className="text-white/50" />
                {order.customer_phone}
              </a>
              {order.customer_email && (
                <a
                  href={`mailto:${order.customer_email}`}
                  className="flex items-center gap-2 text-white/80 hover:text-white"
                >
                  <Mail size={14} className="text-white/50" />
                  {order.customer_email}
                </a>
              )}
              {(order.address || order.city) && (
                <div className="flex items-start gap-2 text-white/70">
                  <MapPin size={14} className="text-white/50 mt-0.5" />
                  <span>
                    {order.address}
                    {order.address && order.city ? ", " : ""}
                    {order.city}
                  </span>
                </div>
              )}
              {phone && (
                <a
                  href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hola ${order.customer_name}, sobre tu pedido ${order.order_number}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white px-4 py-2 text-xs font-semibold hover:bg-[#1FAD52]"
                >
                  <MessageCircle size={14} />
                  Escribir por WhatsApp
                </a>
              )}
            </div>
          </section>

          <section>
            <div className="label-eyebrow !text-[0.62rem] mb-2">Productos</div>
            <div className="rounded-xl border border-white/10 divide-y divide-white/5">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  {it.image && (
                    <img
                      src={it.image}
                      alt={it.name}
                      className="h-12 w-12 rounded-lg object-cover border border-white/10"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-sm">{it.name}</div>
                    <div className="text-xs text-white/45">
                      {it.quantity}× ·{" "}
                      {formatPrice(it.price, settings.currency_symbol)}{" "}
                      {it.color && (
                        <span className="inline-flex items-center gap-1.5 ml-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full border border-white/20"
                            style={{ backgroundColor: it.color }}
                          />
                          {it.color}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-display tabular-nums">
                    {formatPrice(it.price * it.quantity, settings.currency_symbol)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 px-1">
              <span className="text-white/55 text-sm">Total</span>
              <span className="font-display text-xl tracking-tight">
                {formatPrice(order.total, settings.currency_symbol)}
              </span>
            </div>
          </section>

          {order.notes && (
            <section>
              <div className="label-eyebrow !text-[0.62rem] mb-2">Notas</div>
              <p className="text-sm text-white/70 font-body whitespace-pre-line">{order.notes}</p>
            </section>
          )}

          <button
            onClick={onDelete}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 text-xs uppercase tracking-[0.18em]"
          >
            <Trash2 size={14} />
            Eliminar pedido
          </button>
        </div>
      </div>
    </div>
  );
};
