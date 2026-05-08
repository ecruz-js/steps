# Safe Steps — Sitio Web

## Problema original
Brief de Safe Steps: centro web integral para conocer/comprar productos (joyería inteligente con tecnología de seguridad), recibir asesoría sobre la app móvil, descargar la app y contactar soporte. Estilo minimalista, moderno, dark, en español.

## User personas
- Usuaria final que busca seguridad discreta sin sacrificar estilo.
- Cliente potencial evaluando comprar joyería inteligente.
- Usuaria existente que necesita asesoría/soporte.

## Core requirements (estáticos)
- Diseño dark/oscuro completo con paleta: #0A0A0A, #111827, #0B1B3A, #1C1C1E, #374151, #FFFFFF
- Tipografías: General Sans (display) + Geist (body) vía Fontshare
- Tagline: "Contigo en cada momento"
- Single-page con secciones ancladas + smooth scroll
- Navegación intuitiva, microinteracciones, floating contact button
- Responsive, animaciones de entrada (reveal-on-scroll)

## Implementado (Feb 2026)
- **Backend FastAPI + MongoDB**:
  - GET /api/products (con filtro ?category=)
  - GET /api/products/{id}
  - POST /api/contact (validación EmailStr → 422 en email inválido)
  - GET /api/contact
  - POST /api/advisory
  - Seed idempotente de 6 productos al startup
- **Frontend React (single-page)**:
  - Navbar sticky con blur + menú móvil
  - Hero con tagline, dual CTA, tarjeta visual lateral, badges de confianza
  - About con bento grid de 4 valores + ribbon de misión
  - Products con filtros por categoría, hover overlay, swatches de color, toast al "comprar"
  - HowItWorks: 4 pasos numerados + CTA asesoría
  - AppSection con mockup, 4 features, badges iOS/Android
  - Contact con formulario funcional + info (email, teléfono, IG)
  - Footer 3 columnas
  - FloatingContact button (visible al scroll > 280px)
  - data-testid en todos los elementos interactivos
- **Testing**: backend 13/13 pytest pass, frontend Playwright e2e pass.

## Backlog priorizado
- **P1**: Reemplazar productos placeholder con catálogo real cuando el cliente lo entregue
- **P1**: Integrar pasarela de pago real (Stripe/MercadoPago) cuando se decida lanzar tienda
- **P2**: Sistema de reservas para "Agendar asesoría" (slots + calendario)
- **P2**: Panel admin para revisar mensajes y solicitudes de asesoría
- **P2**: i18n (EN) si la marca expande mercados
- **P3**: SEO técnico (metatags dinámicos, OG images, sitemap), analytics
- **P3**: Blog / centro de ayuda con artículos
- **P3**: Email transaccional (Resend/SendGrid) para confirmar mensajes y suscripción newsletter

## Próximos pasos sugeridos
1. Recibir productos reales del cliente y reemplazar seed.
2. Definir si se activa Stripe en demo o producción.
3. Construir panel admin ligero protegido por auth para gestionar mensajes/asesoría.
