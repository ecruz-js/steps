import { useEffect, useState } from "react";
import axios from "axios";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatPrice, useSettings } from "@/context/SettingsContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [s, o] = await Promise.all([
          axios.get(`${API}/admin/stats`),
          axios.get(`${API}/admin/orders`),
        ]);
        setStats(s.data);
        setRecent((o.data || []).slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = stats
    ? [
        {
          label: "Pedidos totales",
          value: stats.total_orders,
          icon: ShoppingCart,
          accent: "text-white",
          testid: "stat-total-orders",
        },
        {
          label: "Pendientes",
          value: stats.pending_orders,
          icon: Clock,
          accent: "text-amber-300",
          testid: "stat-pending-orders",
        },
        {
          label: "Entregados",
          value: stats.completed_orders,
          icon: CheckCircle,
          accent: "text-emerald-300",
          testid: "stat-completed-orders",
        },
        {
          label: "Ingresos",
          value: formatPrice(stats.revenue, settings.currency_symbol),
          icon: TrendingUp,
          accent: "text-white",
          testid: "stat-revenue",
        },
        {
          label: "Productos activos",
          value: `${stats.active_products}/${stats.total_products}`,
          icon: Package,
          accent: "text-white",
          testid: "stat-products",
        },
        {
          label: "Mensajes contacto",
          value: stats.contact_messages,
          icon: MessageSquare,
          accent: "text-white",
          testid: "stat-messages",
        },
      ]
    : [];

  return (
    <div className="p-6 lg:p-10 max-w-7xl">
      <header className="mb-8 lg:mb-10">
        <div className="label-eyebrow">Panel principal</div>
        <h1 className="font-display text-3xl lg:text-4xl tracking-tight mt-2">
          Buenas, equipo Safe Steps.
        </h1>
        <p className="text-white/55 font-body mt-2">
          Resumen general de tu tienda. Datos en tiempo real desde tu base.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {(loading ? Array.from({ length: 6 }) : cards).map((c, i) =>
          c ? (
            <article
              key={c.label}
              data-testid={c.testid}
              className="rounded-2xl border border-white/10 bg-[#111827]/60 p-6 hover:border-white/30 transition"
            >
              <div className="flex items-start justify-between">
                <div className="label-eyebrow !text-[0.6rem]">{c.label}</div>
                <c.icon size={16} className={`${c.accent}`} />
              </div>
              <div className="mt-4 font-display text-3xl tracking-tight">{c.value}</div>
            </article>
          ) : (
            <div
              key={i}
              className="rounded-2xl border border-white/[0.05] bg-white/[0.02] h-[120px] shimmer"
            />
          )
        )}
      </section>

      <section data-testid="dashboard-recent-orders">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl tracking-tight">Últimos pedidos</h2>
          <a
            href="/admin/orders"
            className="text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white"
          >
            Ver todos →
          </a>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111827]/40 overflow-hidden">
          {recent.length === 0 ? (
            <div className="py-14 text-center text-white/40 font-body text-sm">
              {loading ? "Cargando..." : "Aún no hay pedidos."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-white/50 uppercase text-[10px] tracking-[0.18em]">
                <tr>
                  <th className="text-left px-5 py-3">Pedido</th>
                  <th className="text-left px-5 py-3">Cliente</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="text-right px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-display tracking-tight">{o.order_number}</td>
                    <td className="px-5 py-3">
                      <div className="text-white/85">{o.customer_name}</div>
                      <div className="text-xs text-white/40">{o.customer_phone}</div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-display tracking-tight">
                      {formatPrice(o.total, settings.currency_symbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

export const StatusBadge = ({ status }) => {
  const map = {
    pendiente: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    confirmado: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    enviado: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    entregado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    cancelado: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] border ${map[status] || ""}`}
    >
      {status}
    </span>
  );
};
