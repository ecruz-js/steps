import { ShieldCheck, Sparkles, HeartHandshake, Cpu } from "lucide-react";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Seguridad",
    desc: "Protocolos cifrados, alertas en menos de 2 segundos y respaldo en la nube.",
  },
  {
    icon: Cpu,
    title: "Tecnología accesible",
    desc: "Hardware discreto, app intuitiva y conexión estable sin curva de aprendizaje.",
  },
  {
    icon: HeartHandshake,
    title: "Acompañamiento",
    desc: "Soporte humano 24/7 y comunidad activa de usuarias que se cuidan entre sí.",
  },
  {
    icon: Sparkles,
    title: "Diseño elegante",
    desc: "Piezas pensadas para combinar con tu estilo, no para esconderse de él.",
  },
];

export const About = () => {
  return (
    <section
      id="about"
      data-testid="about-section"
      className="relative py-28 lg:py-36 overflow-hidden"
    >
      <div className="glow-orb h-[300px] w-[300px] -top-20 right-0 bg-[#0B1B3A]/70" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="reveal label-eyebrow mb-5">Sobre nosotros</div>
            <h2 className="reveal font-display text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.02] tracking-tighter">
              Una historia que empieza
              <br />
              <span className="text-white/60">cuando algo no se siente bien.</span>
            </h2>
            <p className="reveal mt-7 text-white/60 leading-relaxed max-w-md font-body">
              Safe Steps nació de una conversación honesta entre amigas: ¿cómo
              sería sentirnos seguras sin tener que cargar un dispositivo
              evidente? Hoy fabricamos joyería inteligente que protege sin
              interrumpir, y construimos una app que entiende lo que necesitas
              antes de que tengas que pedirlo.
            </p>
            <div className="reveal mt-8 flex items-center gap-4">
              <a
                href="#contact"
                data-testid="about-contact-cta"
                className="btn-press inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-sm font-medium hover:bg-white hover:text-[#0A0A0A] transition"
              >
                Habla con el equipo
              </a>
              <span className="text-white/40 text-xs font-body">
                Atendemos en 24 horas
              </span>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4 lg:gap-5">
            {VALUES.map(({ icon: Icon, title, desc }, idx) => (
              <div
                key={title}
                data-testid={`value-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
                className={`reveal product-card rounded-2xl p-6 lg:p-7 ${
                  idx === 0 ? "row-span-2" : ""
                }`}
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="h-11 w-11 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center">
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="label-eyebrow !text-[0.6rem]">
                    0{idx + 1}
                  </span>
                </div>
                <h3 className="font-display text-xl lg:text-2xl tracking-tight">
                  {title}
                </h3>
                <p className="mt-3 text-sm text-white/55 leading-relaxed font-body">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission ribbon */}
        <div className="reveal mt-20 lg:mt-28 border-y border-white/10 py-10 grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-3 label-eyebrow">Nuestra misión</div>
          <p className="lg:col-span-9 font-display text-2xl sm:text-3xl tracking-tight leading-snug">
            Diseñar tecnología que se integre a tu vida con elegancia y te
            devuelva la libertad de moverte por el mundo{" "}
            <span className="text-white/50">sin miedo</span>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
