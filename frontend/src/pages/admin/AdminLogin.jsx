import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function AdminLogin() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await login(email, password);
      toast.success("Sesión iniciada");
      navigate("/admin", { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error("No pudimos iniciar sesión", {
        description: typeof detail === "string" ? detail : "Verifica tus credenciales",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      data-testid="admin-login-page"
      className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white p-6 relative overflow-hidden"
    >
      <div
        className="glow-orb h-[420px] w-[420px] -top-40 -left-20 bg-[#0B1B3A]"
        style={{ position: "absolute" }}
      />
      <div
        className="glow-orb h-[320px] w-[320px] bottom-0 right-0 bg-[#374151]/60"
        style={{ position: "absolute" }}
      />

      <form
        onSubmit={submit}
        data-testid="admin-login-form"
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#111827]/80 backdrop-blur-xl p-8 lg:p-10"
      >
        <div className="flex items-center gap-3 mb-7">
          <span className="h-10 w-10 rounded-md bg-white text-black font-bold font-display flex items-center justify-center">
            S
          </span>
          <div>
            <div className="font-display text-lg tracking-tight">Safe Steps Admin</div>
            <div className="label-eyebrow !text-[0.6rem]">Panel de control</div>
          </div>
        </div>

        <h1 className="font-display text-3xl tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-white/55 mt-2 font-body">
          Acceso restringido al equipo Safe Steps.
        </p>

        <div className="mt-7 space-y-3">
          <Field
            label="Email"
            type="email"
            testid="admin-email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Field
            label="Contraseña"
            type="password"
            testid="admin-password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          data-testid="admin-login-submit"
          className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-black py-4 text-sm font-semibold hover:bg-white/90 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ShieldCheck size={16} />
          )}
          {submitting ? "Verificando..." : "Entrar al panel"}
        </button>

        <a
          href="/"
          className="mt-5 block text-center text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white"
        >
          ← Volver al sitio
        </a>
      </form>
    </main>
  );
}

const Field = ({ label, testid, ...rest }) => (
  <div>
    <label className="label-eyebrow !text-[0.62rem] block mb-1.5">{label}</label>
    <input
      data-testid={testid}
      {...rest}
      className="w-full rounded-xl bg-[#0A0A0A] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
    />
  </div>
);

export const FullScreenLoader = () => (
  <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
    <Loader2 size={24} className="text-white animate-spin" />
  </div>
);
