import { Download, Settings2, BellRing, Users } from "lucide-react";

const STEPS = [
  {
    icon: Download,
    title: "Descarga la app",
    desc: "Disponible para iOS y Android. Crea tu cuenta en menos de 60 segundos.",
  },
  {
    icon: Settings2,
    title: "Vincula tu pieza",
    desc: "Empareja por Bluetooth y elige el gesto que activará tu alerta.",
  },
  {
    icon: Users,
    title: "Define tu círculo",
    desc: "Hasta 5 contactos de confianza recibirán tu ubicación al instante.",
  },
  {
    icon: BellRing,
    title: "Vive tranquila",
    desc: "Tu joya cuida sin que lo notes. Tú decides cuándo enviar la alerta.",
  },
];

export const HowItWorks = () => {
  return (
    <section
      id="how"
      data-testid="how-section"
      className="relative py-28 lg:py-36 bg-[#111827] overflow-hidden"
    >
      <div className="grain absolute inset-0 pointer-events-none" />
      <div className="glow-orb h-[320px] w-[320px] -top-20 -left-10 bg-[#0B1B3A]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 mb-16">
          <div className="lg:col-span-7">
            <div className="reveal label-eyebrow mb-5">Cómo funciona</div>
            <h2 className="reveal font-display text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.02] tracking-tighter">
              Cuatro pasos para
              <br />
              <span className="text-white/60">sentirte respaldada.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 flex lg:items-end">
            <p className="reveal text-white/60 leading-relaxed font-body">
              Diseñamos un proceso simple, sin manuales y sin configuraciones
              técnicas. Si tienes dudas, agendamos una asesoría 1:1 sin costo
              para personalizar tu experiencia.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map(({ icon: Icon, title, desc }, idx) => (
            <div
              key={title}
              data-testid={`step-${idx + 1}`}
              className="reveal relative rounded-2xl border border-white/10 bg-[#0A0A0A]/60 backdrop-blur-xl p-6 lg:p-7 hover:border-white/30 transition"
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              <div className="absolute -top-3 left-6 px-2.5 py-1 rounded-full bg-white text-[#0A0A0A] text-[10px] font-bold tracking-widest">
                PASO {String(idx + 1).padStart(2, "0")}
              </div>
              <div className="h-12 w-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-6">
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="font-display text-lg lg:text-xl tracking-tight">
                {title}
              </h3>
              <p className="mt-2 text-sm text-white/55 leading-relaxed font-body">
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Advisory CTA */}
        <div className="reveal mt-16 rounded-3xl border border-white/10 bg-[#0A0A0A]/70 backdrop-blur-xl p-8 lg:p-12 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <div className="label-eyebrow mb-3">Asesoría personalizada</div>
            <h3 className="font-display text-2xl sm:text-3xl tracking-tight leading-snug">
              ¿Aún tienes dudas? Agenda una llamada con nuestro equipo y resolvemos
              tu setup en 15 minutos.
            </h3>
          </div>
          <div className="lg:col-span-4 flex lg:justify-end">
            <a
              href="#contact"
              data-testid="advisory-cta"
              className="btn-press inline-flex items-center justify-center rounded-full bg-white text-[#0A0A0A] px-7 py-4 text-sm font-semibold hover:bg-white/90 transition"
            >
              Agendar asesoría
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
