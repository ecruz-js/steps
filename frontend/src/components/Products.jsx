import { useEffect, useState } from "react";
import axios from "axios";
import { ShoppingBag, ArrowUpRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useSettings, formatPrice } from "@/context/SettingsContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "collares", label: "Collares" },
  { id: "pulseras", label: "Pulseras" },
  { id: "ganchos", label: "Ganchos" },
];

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("todos");
  const [loading, setLoading] = useState(true);
  const { add } = useCart();
  const { settings } = useSettings();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/products`, {
          params: filter !== "todos" ? { category: filter } : {},
        });
        setProducts(res.data || []);
      } catch (e) {
        console.error(e);
        toast.error("No pudimos cargar los productos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  const handleBuy = (p) => {
    add(p);
  };

  return (
    <section
      id="products"
      data-testid="products-section"
      className="relative py-28 lg:py-36 bg-[#0A0A0A] overflow-hidden"
    >
      <div className="glow-orb h-[280px] w-[280px] top-10 left-1/3 bg-[#0B1B3A]/60" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div>
            <div className="reveal label-eyebrow mb-5">Catálogo</div>
            <h2 className="reveal font-display text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.02] tracking-tighter max-w-2xl">
              Piezas que protegen
              <br />
              <span className="text-white/60">sin pedir permiso.</span>
            </h2>
          </div>
          <p className="reveal text-white/55 max-w-md font-body">
            Una colección compacta donde cada detalle —desde el peso hasta la
            terminación mate— está pensado para integrarse a tu día sin perder
            nunca el contacto contigo.
          </p>
        </div>

        {/* Filters */}
        <div
          className="reveal flex flex-wrap gap-2 mb-10"
          data-testid="product-filters"
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                data-testid={`filter-${f.id}`}
                onClick={() => setFilter(f.id)}
                className={`chip btn-press px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.16em] border ${
                  active
                    ? "bg-white text-[#0A0A0A] border-white"
                    : "bg-transparent text-white/60 border-white/15 hover:text-white hover:border-white/40"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            data-testid="products-loading"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-2xl bg-white/[0.03] border border-white/[0.05] shimmer"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div
            data-testid="products-empty"
            className="py-20 text-center text-white/50 font-body"
          >
            No hay productos en esta categoría aún.
          </div>
        ) : (
          <div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            data-testid="products-grid"
          >
            {products.map((p, idx) => (
              <article
                key={p.id}
                data-testid={`product-card-${p.id}`}
                className="product-card product-card-enter rounded-2xl"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/60 backdrop-blur border border-white/10 px-3 py-1.5">
                    <span className="label-eyebrow !text-[0.6rem]">
                      {p.category}
                    </span>
                  </div>
                  {p.featured && (
                    <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-white text-[#0A0A0A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                      Destacado
                    </div>
                  )}

                  <div className="overlay">
                    <h3 className="font-display text-xl tracking-tight">
                      {p.name}
                    </h3>
                    <p className="text-sm text-white/70 mt-1 font-body">
                      {p.short_description}
                    </p>
                    <ul className="mt-3 space-y-1">
                      {p.benefits.slice(0, 3).map((b) => (
                        <li
                          key={b}
                          className="flex items-center gap-2 text-xs text-white/70 font-body"
                        >
                          <Check size={12} className="text-white" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-lg tracking-tight">
                        {p.name}
                      </div>
                      <div className="label-eyebrow !text-[0.62rem] mt-1">
                        {p.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl tracking-tight">
                        {formatPrice(p.price, settings.currency_symbol)}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">
                        {settings.currency}
                      </div>
                    </div>
                  </div>

                  {/* Color swatches */}
                  <div className="flex items-center gap-2">
                    {p.colors.map((c) => (
                      <span
                        key={c}
                        title={c}
                        className="h-5 w-5 rounded-full border border-white/20"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      data-testid={`buy-button-${p.id}`}
                      onClick={() => handleBuy(p)}
                      className="btn-press flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#0A0A0A] py-2.5 text-sm font-semibold hover:bg-white/90 transition"
                    >
                      <ShoppingBag size={14} />
                      Añadir
                    </button>
                    <a
                      href="#contact"
                      data-testid={`details-link-${p.id}`}
                      aria-label={`Detalles de ${p.name}`}
                      className="btn-press h-10 w-10 inline-flex items-center justify-center rounded-full border border-white/15 text-white hover:bg-white/10"
                    >
                      <ArrowUpRight size={16} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;
