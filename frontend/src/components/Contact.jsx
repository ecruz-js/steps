import { useState } from "react";
import axios from "axios";
import { Mail, Phone, Instagram, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Completa nombre, email y mensaje");
      return;
    }
    try {
      setSubmitting(true);
      await axios.post(`${API}/contact`, form);
      toast.success("Mensaje enviado", {
        description: "Te respondemos en menos de 24h.",
      });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error("No pudimos enviar el mensaje", {
        description: typeof detail === "string" ? detail : "Inténtalo de nuevo",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      data-testid="contact-section"
      className="relative py-28 lg:py-36 overflow-hidden"
    >
      <div className="glow-orb h-[320px] w-[320px] bottom-0 left-1/4 bg-[#0B1B3A]/70" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 grid lg:grid-cols-12 gap-10">
        {/* Info */}
        <div className="lg:col-span-5">
          <div className="reveal label-eyebrow mb-5">Contacto</div>
          <h2 className="reveal font-display text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.02] tracking-tighter">
            Hablemos.
            <br />
            <span className="text-white/60">Sin protocolos.</span>
          </h2>
          <p className="reveal mt-7 text-white/60 font-body leading-relaxed max-w-md">
            Escríbenos para soporte, asesoría personalizada o alianzas. Atendemos
            cada mensaje en menos de 24 horas hábiles.
          </p>

          <div className="reveal mt-10 space-y-4">
            {[
              {
                icon: Mail,
                label: "Correo",
                value: "hola@safesteps.app",
                href: "mailto:hola@safesteps.app",
                testid: "contact-email",
              },
              {
                icon: Phone,
                label: "Teléfono",
                value: "+52 55 1234 5678",
                href: "tel:+525512345678",
                testid: "contact-phone",
              },
              {
                icon: Instagram,
                label: "Instagram",
                value: "@safesteps.app",
                href: "https://instagram.com/safesteps.app",
                testid: "contact-instagram",
              },
            ].map(({ icon: Icon, label, value, href, testid }) => (
              <a
                key={label}
                href={href}
                data-testid={testid}
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111827]/60 p-4 hover:border-white/30 transition"
              >
                <span className="h-10 w-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  <Icon size={16} className="text-white" />
                </span>
                <div>
                  <div className="label-eyebrow !text-[0.6rem]">{label}</div>
                  <div className="font-body text-sm text-white/85 mt-0.5">
                    {value}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={submit}
          data-testid="contact-form"
          className="reveal lg:col-span-7 rounded-3xl border border-white/10 bg-[#0A0A0A]/70 backdrop-blur-xl p-6 lg:p-10"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Nombre"
              testid="contact-name-input"
              value={form.name}
              onChange={onChange("name")}
              placeholder="Tu nombre"
              required
            />
            <Field
              label="Email"
              testid="contact-email-input"
              type="email"
              value={form.email}
              onChange={onChange("email")}
              placeholder="tu@email.com"
              required
            />
            <Field
              label="Teléfono (opcional)"
              testid="contact-phone-input"
              value={form.phone}
              onChange={onChange("phone")}
              placeholder="+52 55 ..."
            />
            <Field
              label="Asunto"
              testid="contact-subject-input"
              value={form.subject}
              onChange={onChange("subject")}
              placeholder="¿De qué quieres hablar?"
            />
          </div>

          <div className="mt-4">
            <label className="label-eyebrow !text-[0.62rem] block mb-2">
              Mensaje
            </label>
            <textarea
              data-testid="contact-message-input"
              value={form.message}
              onChange={onChange("message")}
              required
              rows={5}
              placeholder="Cuéntanos en qué podemos ayudarte..."
              className="w-full rounded-xl bg-[#111827]/60 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition"
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-white/40 font-body">
              Al enviar aceptas nuestra política de privacidad. No compartimos
              tus datos.
            </p>
            <button
              type="submit"
              disabled={submitting}
              data-testid="contact-submit-button"
              className="btn-press inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#0A0A0A] px-7 py-4 text-sm font-semibold hover:bg-white/90 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {submitting ? "Enviando..." : "Enviar mensaje"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

const Field = ({ label, testid, type = "text", ...rest }) => (
  <div>
    <label className="label-eyebrow !text-[0.62rem] block mb-2">{label}</label>
    <input
      data-testid={testid}
      type={type}
      {...rest}
      className="w-full rounded-xl bg-[#111827]/60 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition"
    />
  </div>
);

export default Contact;
