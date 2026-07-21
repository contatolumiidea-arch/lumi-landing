/**
 * LUMI LANDING — Realtor Configuration File
 * Edit this file to personalize the landing page for each client.
 */

const REALTOR_CONFIG = {

  // ─── Identity ─────────────────────────────────────────────────────────────
  name: "Sarah Johnson",
  title: "REALTOR® | Licensed Real Estate Agent",
  brokerage: "EXP Realty",
  license: "BK3456789",
  photo: "assets/images/agent-photo.jpg",
  logo: "assets/images/logo.png",

  // ─── Location ─────────────────────────────────────────────────────────────
  city: "Miami",
  state: "FL",
  country: "US",

  // ─── Contact ──────────────────────────────────────────────────────────────
  phone: "+1 (305) 555-0100",
  email: "sarah@lumilanding.com",
  whatsapp: "13055550100",    // numbers only, with country code, no +
  office: "1000 Brickell Ave, Suite 500, Miami, FL 33131",

  // ─── Social Media ─────────────────────────────────────────────────────────
  social: {
    instagram: "https://instagram.com/sarahjohnsonrealtor",
    facebook:  "https://facebook.com/sarahjohnsonrealtor",
    linkedin:  "https://linkedin.com/in/sarahjohnsonrealtor",
    youtube:   "",
    tiktok:    ""
  },

  // ─── Hero Stats ───────────────────────────────────────────────────────────
  stats: {
    deals:        "500+",
    years:        "10+",
    cities:       "15+",
    rating:       "4.9"
  },

  // ─── Areas Served ─────────────────────────────────────────────────────────
  areas: [
    { name: "Miami",        state: "FL", image: "assets/images/miami.jpg",    featured: true  },
    { name: "Orlando",      state: "FL", image: "assets/images/orlando.jpg",  featured: true  },
    { name: "Fort Lauderdale", state: "FL", image: "assets/images/fortlauderdale.jpg", featured: false },
    { name: "Tampa",        state: "FL", image: "assets/images/tampa.jpg",    featured: false },
    { name: "Boca Raton",   state: "FL", image: "assets/images/bocaraton.jpg",featured: false },
    { name: "Naples",       state: "FL", image: "assets/images/naples.jpg",   featured: false }
  ],

  // ─── Testimonials ─────────────────────────────────────────────────────────
  testimonials: [
    {
      name:   "Maria & Carlos Silva",
      city:   "Miami, FL",
      rating: 5,
      photo:  "assets/images/client1.jpg",
      text_pt: "Sarah nos ajudou a encontrar a casa perfeita em Miami. Processo incrível, muito profissional!",
      text_en: "Sarah helped us find the perfect home in Miami. Amazing process, very professional!",
      text_es: "Sarah nos ayudó a encontrar la casa perfecta en Miami. ¡Proceso increíble, muy profesional!"
    },
    {
      name:   "John & Emily Parker",
      city:   "Orlando, FL",
      rating: 5,
      photo:  "assets/images/client2.jpg",
      text_pt: "Vendemos nossa casa em menos de 2 semanas acima do preço pedido. Excepcional!",
      text_en: "We sold our home in under 2 weeks above asking price. Exceptional!",
      text_es: "Vendimos nuestra casa en menos de 2 semanas por encima del precio solicitado. ¡Excepcional!"
    },
    {
      name:   "Roberto García",
      city:   "Fort Lauderdale, FL",
      rating: 5,
      photo:  "assets/images/client3.jpg",
      text_pt: "Como investidor, precisava de alguém que entendesse o mercado. Sarah superou todas as expectativas.",
      text_en: "As an investor, I needed someone who understood the market. Sarah exceeded all expectations.",
      text_es: "Como inversor, necesitaba a alguien que entendiera el mercado. Sarah superó todas las expectativas."
    }
  ],

  // ─── Lead Magnet / Ebook ──────────────────────────────────────────────────
  leadMagnet: {
    enabled:    true,
    ebook_file: "assets/ebook-home-buyer-guide.pdf",
    cover:      "assets/images/ebook-cover.jpg"
  },

  // ─── Integrations ─────────────────────────────────────────────────────────
  integrations: {
    // Webhook URL for forms (Zapier / Make / n8n)
    webhook_url: "",

    // Google Sheets Script URL
    google_sheets_url: "",

    // Email service (EmailJS)
    emailjs: {
      enabled:    false,
      service_id: "",
      template_id: "",
      public_key: ""
    },

    // CRM (future LUMI FLOW)
    lumi_flow: {
      enabled:  false,
      api_url:  "",
      api_key:  ""
    }
  },

  // ─── Theme Overrides ──────────────────────────────────────────────────────
  // Leave empty to use LUMI LANDING default palette
  theme: {
    primary:    "#D4AF37",   // Gold
    dark:       "#050505",   // Black
    light:      "#FFFFFF",   // White
    muted:      "#A8A8A8"    // Gray
  },

  // ─── Default Language ─────────────────────────────────────────────────────
  defaultLang: "pt",        // "pt" | "en" | "es"

  // ─── Feature Flags ────────────────────────────────────────────────────────
  features: {
    newsletter:  true,
    referral:    true,
    leadMagnet:  true,
    whatsapp:    true,
    cookieBanner: true
  }

};

// Export for module environments
if (typeof module !== "undefined") module.exports = REALTOR_CONFIG;
