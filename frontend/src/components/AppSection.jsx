import { Apple, Smartphone, Bell, MapPin, Lock, Zap } from "lucide-react";
import { backendFileUrl } from "@/lib/backendFileUrl";

const FEATURES = [
  { icon: Bell, title: "Alertas instantáneas", desc: "Notifica a tus contactos en menos de 2s." },
  { icon: MapPin, title: "Ubicación en vivo", desc: "Comparte tu ruta solo con quien decidas." },
  { icon: Lock, title: "Cifrado de extremo", desc: "Tus datos siempre privados. Punto." },
  { icon: Zap, title: "Modo discreto", desc: "Activa SOS sin tocar el teléfono." },
];

export const AppSection = () => {
  return (
    <section
      id="app"
      data-testid="app-section"
      className="relative py-28 lg:py-36 bg-[#0A0A0A] overflow-hidden"
    >
      <div className="glow-orb h-[420px] w-[420px] -top-32 -right-20 bg-[#0B1B3A]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 grid lg:grid-cols-12 gap-12 items-center">
        {/* Visual */}
        <div className="lg:col-span-6 relative">
          <div className="reveal relative aspect-[4/5] max-w-md mx-auto">
            <div
              className="absolute inset-0 rounded-[2.5rem] border border-white/10"
              style={{
                background:
                  "linear-gradient(160deg, rgba(11,27,58,0.8) 0%, rgba(10,10,10,0.95) 100%)",
              }}
            />
            <div className="absolute inset-6 rounded-[2rem] overflow-hidden border border-white/10 bg-[#0A0A0A]">
              <img
                src={backendFileUrl("/api/files/brand-safe-steps-portada")}
                alt="Safe Steps app"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />

              {/* HUD overlay */}
              <div className="absolute top-5 left-5 right-5 flex justify-between items-center">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/70">
                  09:41
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                  <span className="text-[10px] text-white/70">Conectada</span>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-4">
                <div className="label-eyebrow !text-[0.6rem]">Estado actual</div>
                <div className="font-display text-lg mt-1">
                  Todo bajo control.
                </div>
                <div className="text-xs text-white/60 mt-1 font-body">
                  Última verificación · hace 12 segundos
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-6">
          <div className="reveal label-eyebrow mb-5">La aplicación</div>
          <h2 className="reveal font-display text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.02] tracking-tighter">
            Tu compañera digital.
            <br />
            <span className="text-white/60">Discreta. Inteligente.</span>
          </h2>
          <p className="reveal mt-7 text-white/60 font-body leading-relaxed max-w-md">
            La app Safe Steps conecta tus piezas con tu círculo de confianza,
            tu ubicación en tiempo real y respuestas automáticas ante señales de
            emergencia.
          </p>

          <div className="reveal mt-9 grid sm:grid-cols-2 gap-4 max-w-xl">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-[#111827]/60 p-4 hover:border-white/30 transition"
              >
                <Icon size={18} className="text-white" />
                <div className="font-display text-sm mt-3 tracking-tight">
                  {title}
                </div>
                <div className="text-xs text-white/55 mt-1 font-body">
                  {desc}
                </div>
              </div>
            ))}
          </div>

          <div className="reveal mt-9 flex flex-col sm:flex-row gap-3">
            <a
              href="#"
              data-testid="download-ios"
              onClick={(e) => e.preventDefault()}
              className="btn-press inline-flex items-center justify-center gap-3 rounded-full bg-white text-[#0A0A0A] px-6 py-4 text-sm font-semibold hover:bg-white/90"
            >
              <Apple size={18} />
              <div className="text-left leading-tight">
                <div className="text-[10px] uppercase tracking-[0.16em] opacity-70">
                  Descargar en
                </div>
                <div>App Store</div>
              </div>
            </a>
            <a
              href="#"
              data-testid="download-android"
              onClick={(e) => e.preventDefault()}
              className="btn-press inline-flex items-center justify-center gap-3 rounded-full bg-[#0B1B3A] text-white border border-white/15 px-6 py-4 text-sm font-semibold hover:border-white/40"
            >
              <Smartphone size={18} />
              <div className="text-left leading-tight">
                <div className="text-[10px] uppercase tracking-[0.16em] opacity-70">
                  Disponible en
                </div>
                <div>Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppSection;
