import { ArrowDownToLine, ShoppingBag, ShieldCheck } from "lucide-react";

export const Hero = () => {
  return (
    <section
      id="hero"
      data-testid="hero-section"
      className="relative isolate min-h-[100svh] flex items-center overflow-hidden grain"
    >
      {/* Background image with dark overlay */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/api/files/home-hero-bg"
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/50 via-[#0A0A0A]/80 to-[#0A0A0A]" />
      </div>

      {/* Glow */}
      <div className="glow-orb h-[420px] w-[420px] -top-32 -left-20 bg-[#0B1B3A]" />
      <div className="glow-orb h-[360px] w-[360px] bottom-10 right-10 bg-[#374151]/60" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 w-full pt-32 pb-24 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <div className="reveal flex items-center gap-3 mb-7">
            <span className="inline-flex h-2 w-2 rounded-full bg-white pulse-dot" />
            <span className="label-eyebrow">Contigo en cada momento</span>
          </div>

          <h1
            data-testid="hero-title"
            className="reveal font-display font-medium text-5xl sm:text-6xl lg:text-[5.5rem] leading-[0.95] tracking-tighter"
          >
            Seguridad <span className="italic font-light text-white/70">silenciosa</span>,
            <br />
            <span className="text-white">tecnología que</span>
            <br />
            <span className="text-white/60">te acompaña.</span>
          </h1>

          <p className="reveal mt-8 text-base sm:text-lg text-white/60 max-w-xl leading-relaxed font-body">
            Safe Steps integra protección discreta en piezas que ya forman parte
            de ti. Joyería inteligente, alertas instantáneas y una app diseñada
            para acompañarte sin que se note.
          </p>

          <div className="reveal mt-10 flex flex-col sm:flex-row gap-3">
            <a
              href="#app"
              data-testid="hero-cta-app"
              className="btn-press inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#0A0A0A] px-7 py-4 text-sm font-semibold hover:bg-white/90 transition"
            >
              <ArrowDownToLine size={16} />
              Descarga la App
            </a>
            <a
              href="#products"
              data-testid="hero-cta-shop"
              className="btn-press inline-flex items-center justify-center gap-2 rounded-full bg-[#0B1B3A] text-white border border-white/10 px-7 py-4 text-sm font-semibold hover:border-white/30 transition"
            >
              <ShoppingBag size={16} />
              Compra ahora
            </a>
          </div>

          {/* Trust badges */}
          <div className="reveal mt-14 grid grid-cols-3 max-w-lg gap-6">
            {[
              { k: "+12k", l: "Usuarias activas" },
              { k: "24/7", l: "Monitoreo" },
              { k: "IP67", l: "Resistente al agua" },
            ].map((s) => (
              <div key={s.l} className="border-l border-white/10 pl-4">
                <div className="font-display text-2xl font-medium tracking-tight">
                  {s.k}
                </div>
                <div className="label-eyebrow !text-[0.62rem] !tracking-[0.18em] mt-1">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right visual card */}
        <div className="lg:col-span-5 hidden lg:block">
          <div className="reveal relative">
            <div
              className="aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 relative"
              style={{
                background:
                  "linear-gradient(180deg, #0B1B3A 0%, #0A0A0A 100%)",
              }}
            >
              <img
                src="/api/files/home-model-safe-steps"
                alt="Modelo Safe Steps"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />

              <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/50 backdrop-blur border border-white/10 px-3 py-1.5">
                  <ShieldCheck size={14} className="text-white" />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/80">
                    Activo
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur border border-white/10 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                  <span className="text-[11px] text-white/80">En vivo</span>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="label-eyebrow">Edición Aurora</div>
                <div className="font-display text-2xl mt-2">
                  Diseñado para no notarse.
                </div>
                <div className="text-sm text-white/60 mt-1 font-body">
                  Sentido al toque · Alerta silenciosa
                </div>
              </div>
            </div>

            {/* Side mini card */}
            <div className="absolute -left-8 bottom-12 hidden xl:flex flex-col rounded-2xl bg-[#111827]/80 backdrop-blur-xl border border-white/10 p-4 w-[210px]">
              <div className="label-eyebrow">SOS enviado</div>
              <div className="text-sm font-body text-white/80 mt-2 leading-snug">
                Tus contactos de confianza recibieron tu ubicación en 1.2 s.
              </div>
              <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[78%] bg-white shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2">
        <div className="h-10 w-px bg-gradient-to-b from-white/40 to-transparent" />
        <span className="label-eyebrow !text-[0.6rem]">scroll</span>
      </div>
    </section>
  );
};

export default Hero;
