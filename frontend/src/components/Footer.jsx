export const Footer = () => {
  return (
    <footer
      data-testid="site-footer"
      className="relative bg-[#0A0A0A] border-t border-white/[0.06] py-16"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#0A0A0A] font-bold font-display tracking-tight">
                S
              </span>
              <span className="font-display text-base font-semibold tracking-tight">
                Safe<span className="text-white/60">Steps</span>
              </span>
            </div>
            <p className="mt-5 text-white/55 max-w-sm font-body leading-relaxed text-sm">
              Joyería inteligente que te acompaña sin que se note. Diseñada con
              cariño para quienes valoran la libertad de moverse seguras.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
              Atendiendo · 24/7
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <FooterCol
              title="Producto"
              links={[
                { l: "Catálogo", h: "#products" },
                { l: "Cómo funciona", h: "#how" },
                { l: "App móvil", h: "#app" },
              ]}
            />
            <FooterCol
              title="Empresa"
              links={[
                { l: "Sobre nosotros", h: "#about" },
                { l: "Contacto", h: "#contact" },
                { l: "Asesoría", h: "#how" },
              ]}
            />
            <FooterCol
              title="Soporte"
              links={[
                { l: "Centro de ayuda", h: "#contact" },
                { l: "Privacidad", h: "#" },
                { l: "Términos", h: "#" },
              ]}
            />
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-white/40 font-body">
            © {new Date().getFullYear()} Safe Steps. Contigo en cada momento.
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Hecho con cuidado.
          </span>
        </div>
      </div>
    </footer>
  );
};

const FooterCol = ({ title, links }) => (
  <div>
    <div className="label-eyebrow !text-[0.62rem] mb-4">{title}</div>
    <ul className="space-y-2.5">
      {links.map((l) => (
        <li key={l.l}>
          <a
            href={l.h}
            data-testid={`footer-link-${l.l.toLowerCase().replace(/\s+/g, "-")}`}
            className="text-sm text-white/70 hover:text-white transition font-body"
          >
            {l.l}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export default Footer;
