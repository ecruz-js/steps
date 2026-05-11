import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Edit3, Trash2, Loader2, X, Upload, Link as LinkIcon, ImageOff, Star } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, useSettings } from "@/context/SettingsContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CATEGORIES = ["collares", "pulseras", "ganchos", "anillos", "otros"];

const EMPTY = {
  id: null,
  name: "",
  category: "collares",
  price: 0,
  short_description: "",
  description: "",
  benefits: [],
  colors: [],
  image: "",
  featured: false,
  active: true,
  stock: 50,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | EMPTY | product
  const { settings } = useSettings();

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/products`, { params: { include_inactive: true } });
      setProducts(res.data || []);
    } catch (e) {
      toast.error("No pudimos cargar productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await axios.delete(`${API}/admin/products/${p.id}`);
      toast.success("Producto eliminado");
      load();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      toast.error("No se pudo eliminar", {
        description: typeof detail === "string" ? detail : "",
      });
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="label-eyebrow">Catálogo</div>
          <h1 className="font-display text-3xl lg:text-4xl tracking-tight mt-2">Productos</h1>
          <p className="text-white/55 font-body mt-2 text-sm">
            Crea, edita o desactiva productos. Los desactivados no aparecen en el sitio público.
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          data-testid="admin-new-product"
          className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-white/90"
        >
          <Plus size={14} />
          Nuevo producto
        </button>
      </header>

      <div className="rounded-2xl border border-white/10 bg-[#111827]/40 overflow-hidden">
        {loading ? (
          <div className="py-14 text-center text-white/40 text-sm">Cargando...</div>
        ) : products.length === 0 ? (
          <div className="py-14 text-center text-white/40 text-sm">Aún no hay productos.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-white/50 uppercase text-[10px] tracking-[0.18em]">
              <tr>
                <th className="text-left px-5 py-3">Producto</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Categoría</th>
                <th className="text-right px-5 py-3">Precio</th>
                <th className="text-center px-5 py-3 hidden sm:table-cell">Stock</th>
                <th className="text-center px-5 py-3">Estado</th>
                <th className="text-right px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  data-testid={`admin-product-row-${p.id}`}
                  className="border-t border-white/5 hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff size={14} className="text-white/30" />
                        )}
                      </div>
                      <div>
                        <div className="font-display tracking-tight flex items-center gap-2">
                          {p.name}
                          {p.featured && <Star size={12} className="text-amber-300" fill="currentColor" />}
                        </div>
                        <div className="text-[11px] text-white/40 truncate max-w-[280px]">
                          {p.short_description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-white/65">{p.category}</td>
                  <td className="px-5 py-3 text-right font-display tracking-tight">
                    {formatPrice(p.price, settings.currency_symbol)}
                  </td>
                  <td className="px-5 py-3 text-center hidden sm:table-cell tabular-nums">
                    {p.stock ?? 0}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] border ${
                        p.active
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-white/5 text-white/40 border-white/10"
                      }`}
                    >
                      {p.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing({ ...p })}
                        data-testid={`admin-edit-${p.id}`}
                        aria-label={`Editar ${p.name}`}
                        className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        data-testid={`admin-delete-${p.id}`}
                        aria-label={`Eliminar ${p.name}`}
                        className="h-8 w-8 rounded-full hover:bg-red-500/15 flex items-center justify-center text-white/50 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <ProductFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

const ProductFormModal = ({ initial, onClose, onSaved }) => {
  const isNew = !initial.id;
  const [form, setForm] = useState({
    ...initial,
    benefits: initial.benefits || [],
    colors: initial.colors || [],
  });
  const [saving, setSaving] = useState(false);
  const [imgMode, setImgMode] = useState("path"); // path | upload
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Máximo 5 MB");
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API}/admin/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set("image", res.data.url);
      toast.success("Imagen subida");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error("Error al subir", {
        description: typeof detail === "string" ? detail : "",
      });
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.image || !form.category) {
      toast.error("Completa nombre, categoría e imagen");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
      };
      if (isNew) {
        delete payload.id;
        await axios.post(`${API}/admin/products`, payload);
        toast.success("Producto creado");
      } else {
        const { id, ...rest } = payload;
        await axios.put(`${API}/admin/products/${id}`, rest);
        toast.success("Producto actualizado");
      }
      onSaved();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error("No se pudo guardar", {
        description: typeof detail === "string" ? detail : "Revisa los campos",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="product-form-modal"
    >
      <form
        onSubmit={submit}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0A0A0A] p-6 lg:p-8"
      >
        <header className="flex items-center justify-between mb-6">
          <div>
            <div className="label-eyebrow">{isNew ? "Crear" : "Editar"}</div>
            <h2 className="font-display text-2xl tracking-tight mt-1">
              {isNew ? "Nuevo producto" : form.name || "Producto"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </header>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nombre *" testid="product-name" value={form.name} onChange={(v) => set("name", v)} />
          <SelectField
            label="Categoría *"
            testid="product-category"
            value={form.category}
            onChange={(v) => set("category", v)}
            options={CATEGORIES}
          />
          <Field
            label={`Precio (${" "}${initial.id ? "" : ""}RD$)`}
            testid="product-price"
            type="number"
            value={form.price}
            onChange={(v) => set("price", v)}
          />
          <Field
            label="Stock"
            testid="product-stock"
            type="number"
            value={form.stock}
            onChange={(v) => set("stock", v)}
          />
        </div>

        <div className="mt-4">
          <Field
            label="Descripción corta"
            testid="product-short-desc"
            value={form.short_description}
            onChange={(v) => set("short_description", v)}
          />
        </div>

        <div className="mt-4">
          <label className="label-eyebrow !text-[0.62rem] block mb-1.5">Descripción larga</label>
          <textarea
            data-testid="product-desc"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-[#111827]/60 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-white/40"
          />
        </div>

        {/* Image */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#111827]/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="label-eyebrow !text-[0.62rem]">Imagen del producto</div>
            <div className="inline-flex rounded-full bg-white/5 p-1 text-[11px] uppercase tracking-[0.14em]">
              <button
                type="button"
                onClick={() => setImgMode("path")}
                className={`px-3 py-1 rounded-full ${
                  imgMode === "path" ? "bg-white text-black" : "text-white/55"
                }`}
                data-testid="product-img-mode-url"
              >
                <LinkIcon size={11} className="inline mr-1" />
                Ruta
              </button>
              <button
                type="button"
                onClick={() => setImgMode("upload")}
                className={`px-3 py-1 rounded-full ${
                  imgMode === "upload" ? "bg-white text-black" : "text-white/55"
                }`}
                data-testid="product-img-mode-upload"
              >
                <Upload size={11} className="inline mr-1" />
                Subir
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-[140px_1fr] gap-4 items-start">
            <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#0A0A0A] flex items-center justify-center">
              {form.image ? (
                <img src={form.image} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <ImageOff size={20} className="text-white/30" />
              )}
            </div>
            <div className="space-y-3">
              {imgMode === "path" ? (
                <input
                  data-testid="product-image-url"
                  value={form.image}
                  onChange={(e) => set("image", e.target.value)}
                  placeholder="/api/files/prod-pulsera-champion"
                  className="w-full rounded-xl bg-[#0A0A0A] border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-white/40"
                />
              ) : (
                <label className="flex items-center justify-center gap-2 px-4 py-6 rounded-xl border border-dashed border-white/15 bg-[#0A0A0A] cursor-pointer hover:border-white/30">
                  {uploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  <span className="text-sm text-white/60">
                    {uploading ? "Subiendo..." : "Selecciona archivo (jpg, png, webp · máx 5MB)"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleUpload}
                    className="hidden"
                    data-testid="product-image-file"
                  />
                </label>
              )}
              <p className="text-xs text-white/40 font-body">
                Usa una ruta local o sube un archivo. Las imágenes remotas no se aceptan.
              </p>
            </div>
          </div>
        </div>

        <ListField
          label="Beneficios (uno por línea)"
          testid="product-benefits"
          value={form.benefits.join("\n")}
          onChange={(v) =>
            set(
              "benefits",
              v.split("\n").map((s) => s.trim()).filter(Boolean)
            )
          }
        />

        <ColorsField
          label="Colores disponibles (códigos hex)"
          value={form.colors}
          onChange={(v) => set("colors", v)}
        />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <ToggleField
            label="Destacado"
            testid="product-featured"
            value={form.featured}
            onChange={(v) => set("featured", v)}
          />
          <ToggleField
            label="Activo (visible en sitio)"
            testid="product-active"
            value={form.active}
            onChange={(v) => set("active", v)}
          />
        </div>

        <div className="mt-7 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-full border border-white/15 text-sm font-medium hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            data-testid="product-save"
            className="px-7 py-3 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isNew ? "Crear producto" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
};

const Field = ({ label, testid, type = "text", value, onChange }) => (
  <div>
    <label className="label-eyebrow !text-[0.62rem] block mb-1.5">{label}</label>
    <input
      data-testid={testid}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-[#111827]/60 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-white/40"
    />
  </div>
);

const SelectField = ({ label, testid, value, onChange, options }) => (
  <div>
    <label className="label-eyebrow !text-[0.62rem] block mb-1.5">{label}</label>
    <select
      data-testid={testid}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-[#111827]/60 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-white/40"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-[#0A0A0A]">
          {o}
        </option>
      ))}
    </select>
  </div>
);

const ListField = ({ label, testid, value, onChange }) => (
  <div className="mt-4">
    <label className="label-eyebrow !text-[0.62rem] block mb-1.5">{label}</label>
    <textarea
      data-testid={testid}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      className="w-full rounded-xl bg-[#111827]/60 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-white/40"
    />
  </div>
);

const ColorsField = ({ label, value, onChange }) => {
  const [draft, setDraft] = useState("#0A0A0A");
  const add = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(draft)) {
      toast.error("Color inválido (formato #RRGGBB)");
      return;
    }
    onChange([...(value || []), draft]);
  };
  return (
    <div className="mt-4">
      <label className="label-eyebrow !text-[0.62rem] block mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {(value || []).map((c, i) => (
          <span
            key={`${c}-${i}`}
            className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 pr-2"
          >
            <span
              className="h-7 w-7 rounded-full border border-white/20"
              style={{ backgroundColor: c }}
            />
            <span className="text-xs font-mono text-white/70">{c}</span>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="text-white/40 hover:text-red-300 px-1"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="color"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-10 w-12 rounded bg-transparent border border-white/10 cursor-pointer"
        />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 rounded-xl bg-[#111827]/60 border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-white/40"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 rounded-xl border border-white/15 text-sm font-medium hover:bg-white/5"
        >
          Agregar
        </button>
      </div>
    </div>
  );
};

const ToggleField = ({ label, testid, value, onChange }) => (
  <button
    type="button"
    data-testid={testid}
    onClick={() => onChange(!value)}
    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
      value ? "border-white/40 bg-white/[0.06]" : "border-white/10 bg-[#111827]/40"
    }`}
  >
    <span className="text-white/85">{label}</span>
    <span
      className={`relative h-5 w-9 rounded-full transition ${
        value ? "bg-white" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#0A0A0A] transition ${
          value ? "left-[18px]" : "left-0.5"
        }`}
      />
    </span>
  </button>
);
