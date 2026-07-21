# LUMI LANDING

> Smart landing pages designed to capture and convert leads for Real Estate Agents in the United States.

**A product by [LUMI IDEA](https://lumiidea.com)**

---

## What is LUMI LANDING?

LUMI LANDING is a professional landing page template system built specifically for Realtors and Real Estate Agents. It is not just a website — it is a lead capture machine.

Each landing page is:
- Multilingual (English, Portuguese, Spanish)
- Fully customizable per client
- Ready for CRM integrations (Zapier, Make, Google Sheets, LUMI FLOW)
- Scalable to hundreds of clients

---

## Features

- Professional Realtor landing page
- Lead capture forms
- Ebook / Free Guide download with lead magnet
- Newsletter subscription
- Smart contact form with interest selector
- WhatsApp floating button (message per language)
- Referral form
- Testimonials section
- Areas served with city cards
- Services showcase
- Multilingual UI (PT | EN | ES)
- Cookie consent banner

---

## Project Structure

```
├── index.html                  # Main landing page template
├── css/
│   └── styles.css              # Full design system
├── js/
│   ├── i18n.js                 # Translation engine
│   └── main.js                 # App logic
├── config/
│   └── realtor.js              # Per-client configuration
├── translations/
│   ├── pt.json                 # Portuguese
│   ├── en.json                 # English
│   └── es.json                 # Spanish
├── assets/
│   └── images/                 # Agent photos, areas, ebook cover
└── onboarding/                 # LUMI ONBOARDING SYSTEM
    ├── index.html              # 10-step setup wizard
    ├── css/
    ├── js/
    ├── translations/
    └── clients/                # Per-client config output
```

---

## Quick Start

```bash
# Serve locally (required for i18n fetch to work)
npx serve .

# Open in browser
# Landing Page:  http://localhost:3000
# Onboarding:    http://localhost:3000/onboarding
```

---

## Customization

Edit `config/realtor.js` to configure a client:

```js
const REALTOR_CONFIG = {
  name:      "Sarah Johnson",
  brokerage: "EXP Realty",
  license:   "BK3456789",
  phone:     "+1 (305) 555-0100",
  whatsapp:  "13055550100",
  defaultLang: "pt",   // "pt" | "en" | "es"
  // ...
};
```

---

## Multilingual System

All text uses `data-i18n` attributes — no hardcoded strings in HTML.

```html
<h1 data-i18n="hero.headline">Fallback text</h1>
<input data-i18n-placeholder="contact.form.name" placeholder="Name">
```

Translations live in `translations/{pt,en,es}.json`.

---

## Form Integrations

Configure in `config/realtor.js` under `integrations`:

| Destination | Config key |
|---|---|
| Zapier / Make / n8n | `webhook_url` |
| Google Sheets | `google_sheets_url` |
| EmailJS | `emailjs` block |
| LUMI FLOW CRM (future) | `lumi_flow` block |

---

## LUMI ONBOARDING SYSTEM

After a client pays via Stripe, they are directed to `/onboarding` — a 10-step wizard that collects all information needed to generate their landing page automatically.

**Steps:**
1. Business Information
2. Template Selection
3. Brand Customization
4. Languages
5. Business Details
6. Services
7. Lead Generation
8. Ebook / Lead Magnet
9. CRM Destination
10. Final Review → generates `client-config.json`

---

## Design System

| Token | Value |
|---|---|
| Black | `#050505` |
| Gold | `#D4AF37` |
| White | `#FFFFFF` |
| Gray | `#A8A8A8` |
| Font Sans | Inter |
| Font Serif | Playfair Display |

---

## Roadmap

- [ ] Backend API for client config storage
- [ ] Stripe payment integration
- [ ] Auto-generation pipeline (config → live page)
- [ ] LUMI FLOW CRM integration
- [ ] Admin dashboard
- [ ] Client portal

---

## License

Proprietary — LUMI IDEA. All rights reserved.
