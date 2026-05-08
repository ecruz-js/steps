import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Save, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminSettings() {
  const { settings, refresh } = useSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axios.put(`${API}/admin/settings`, {
        whatsapp_number: form.whatsapp_number,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        instagram: form.instagram,
        free_shipping_threshold: Number(form.free_shipping_threshold) || 0,
      });
      await refresh();
      toast.success("Ajustes guardados");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error("No se pudo guardar", {
        description: typeof detail === "string" ? detail : "",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      <header className="mb-8">
        <div className="label-eyebrow">Configuración</div>
        <h1 className="font-display text-3xl lg:text-4xl tracking-tight mt-2">Ajustes generales</h1>
        <p className="text-white/55 font-body mt-2 text-sm">
          Estos datos se reflejan en el sitio público (footer, contacto, botón flotante de WhatsApp).
        </p>
      </header>

      <form
        onSubmit={submit}
        data-testid="settings-form"
        className="space-y-5 rounded-3xl border border-white/10 bg-[#111827]/40 p-6 lg:p-8"
      >
        <Field
          label="Número de WhatsApp para pedidos *"
          testid="settings-whatsapp"
          value={form.whatsapp_number || ""}
          onChange={(v) => set("whatsapp_number", v)}
          placeholder="+1 809 555 1234"
          help="Formato internacional con +. Aquí llegarán los pedidos del carrito."
        />
        <Field
          label="Email de contacto"
          testid="settings-email"
          type="email"
          value={form.contact_email || ""}
          onChange={(v) => set("contact_email", v)}
        />
        <Field
          label="Teléfono de contacto"
          testid="settings-phone"
          value={form.contact_phone || ""}
          onChange={(v) => set("contact_phone", v)}
          placeholder="+1 809 555 1234"
        />
        <Field
          label="Instagram"
          testid="settings-instagram"
          value={form.instagram || ""}
          onChange={(v) => set("instagram", v)}
          placeholder="@safesteps.app"
        />
        <Field
          label="Umbral de envío gratis (RD$)"
          testid="settings-free-shipping"
          type="number"
          value={form.free_shipping_threshold ?? 0}
          onChange={(v) => set("free_shipping_threshold", v)}
          help="A partir de este monto el cliente verá 'envío gratis'. 0 para deshabilitar."
        />

        <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-4">
          <div className="label-eyebrow !text-[0.6rem] mb-2">Vista previa del enlace WhatsApp</div>
          <div className="flex items-center gap-2 text-sm font-mono break-all">
            <MessageCircle size={14} className="text-[#25D366]" />
            wa.me/{(form.whatsapp_number || "").replace(/[^\d]/g, "")}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={saving}
            data-testid="settings-save"
            className="inline-flex items-center gap-2 rounded-full bg-white text-black px-7 py-3 text-sm font-semibold hover:bg-white/90 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar ajustes
          </button>
        </div>
      </form>
    </div>
  );
}

const Field = ({ label, testid, type = "text", value, onChange, placeholder, help }) => (
  <div>
    <label className="label-eyebrow !text-[0.62rem] block mb-1.5">{label}</label>
    <input
      data-testid={testid}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl bg-[#0A0A0A] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
    />
    {help && <div className="text-xs text-white/40 mt-1.5 font-body">{help}</div>}
  </div>
);
