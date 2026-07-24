/**
 * LUMI LANDING — Main Application Script
 */

// ── Helpers ───────────────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ── Init after DOM ready ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const cfg = typeof REALTOR_CONFIG !== "undefined" ? REALTOR_CONFIG : {};

  // Inject config into page
  applyConfig(cfg);

  // Init i18n
  await i18n.init(cfg.defaultLang || "pt");

  // Wire dynamic content that depends on translations
  document.addEventListener("lumi:langChanged", (e) => {
    buildServices(e.detail.t, cfg);
    buildTestimonials(e.detail.t, cfg);
    buildAreas(e.detail.t, cfg);
    buildInterestOptions(e.detail.t);
    updateWhatsApp(e.detail.t, cfg);
  });

  // Lang switcher
  $$("[data-lang-btn]").forEach(btn => {
    btn.addEventListener("click", () => i18n.load(btn.getAttribute("data-lang-btn")));
  });

  // Mobile menu
  initMobileMenu();

  // Smooth scroll
  initSmoothScroll();

  // Sticky header
  initStickyHeader();

  // Form submissions
  initForms(cfg);

  // WhatsApp float
  initWhatsApp(cfg);

  // Cookie banner
  if (cfg.features?.cookieBanner !== false) initCookieBanner();

  // Animate on scroll
  initScrollAnimations();

  // Chat conversation animation
  initChatConversation();
});

// ── Apply static config to DOM ────────────────────────────────────────────────
function applyConfig(cfg) {
  if (!cfg) return;

  // Name & title
  $$("[data-cfg='name']").forEach(el => el.textContent = cfg.name || "");
  $$("[data-cfg='title']").forEach(el => el.textContent = cfg.title || "");
  $$("[data-cfg='brokerage']").forEach(el => el.textContent = cfg.brokerage || "");
  $$("[data-cfg='license']").forEach(el => el.textContent = cfg.license || "");
  $$("[data-cfg='phone']").forEach(el => el.textContent = cfg.phone || "");
  $$("[data-cfg='email']").forEach(el => el.textContent = cfg.email || "");
  $$("[data-cfg='office']").forEach(el => el.textContent = cfg.office || "");
  $$("[data-cfg='city-state']").forEach(el => el.textContent = `${cfg.city || ""}, ${cfg.state || ""}`);
  $$("[data-cfg='stats-deals']").forEach(el => el.textContent = cfg.stats?.deals || "");
  $$("[data-cfg='stats-years']").forEach(el => el.textContent = cfg.stats?.years || "");
  $$("[data-cfg='stats-cities']").forEach(el => el.textContent = cfg.stats?.cities || "");
  $$("[data-cfg='stats-rating']").forEach(el => el.textContent = cfg.stats?.rating || "");

  // Photos
  const agentPhoto = $("[data-cfg='agent-photo']");
  if (agentPhoto && cfg.photo) agentPhoto.src = cfg.photo;

  // Phone links
  $$("[data-cfg='phone-link']").forEach(el => el.href = `tel:${cfg.phone?.replace(/\D/g, "") || ""}`);
  $$("[data-cfg='email-link']").forEach(el => el.href = `mailto:${cfg.email || ""}`);

  // Social links
  if (cfg.social) {
    Object.entries(cfg.social).forEach(([network, url]) => {
      $$(`[data-social='${network}']`).forEach(el => {
        if (url) { el.href = url; el.style.display = ""; }
        else el.style.display = "none";
      });
    });
  }

  // Apply theme colors
  if (cfg.theme) {
    const root = document.documentElement;
    if (cfg.theme.primary) root.style.setProperty("--color-gold", cfg.theme.primary);
    if (cfg.theme.dark)    root.style.setProperty("--color-black", cfg.theme.dark);
  }
}

// ── Build Services Cards ──────────────────────────────────────────────────────
function buildServices(t, cfg) {
  const container = $("[data-services-grid]");
  if (!container) return;
  const items = t("services.items");
  if (!Array.isArray(items)) return;

  container.innerHTML = items.map(svc => `
    <div class="service-card fade-up">
      <div class="service-icon">${svc.icon}</div>
      <h3 class="service-title">${svc.title}</h3>
      <p class="service-desc">${svc.description}</p>
    </div>
  `).join("");
}

// ── Build Testimonials ────────────────────────────────────────────────────────
function buildTestimonials(t, cfg) {
  const container = $("[data-testimonials-grid]");
  if (!container || !cfg.testimonials) return;
  const lang = i18n.getCurrentLang();

  container.innerHTML = cfg.testimonials.map(item => {
    const text = item[`text_${lang}`] || item.text_en || "";
    const stars = "★".repeat(item.rating || 5);
    return `
      <div class="testimonial-card fade-up">
        <div class="testimonial-stars">${stars}</div>
        <p class="testimonial-text">"${text}"</p>
        <div class="testimonial-author">
          <div class="testimonial-info">
            <strong>${item.name}</strong>
            <span>${item.city}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// ── Build Areas ───────────────────────────────────────────────────────────────
function buildAreas(t, cfg) {
  const container = $("[data-areas-grid]");
  if (!container || !cfg.areas) return;

  container.innerHTML = cfg.areas.map(area => `
    <div class="area-card fade-up">
      <div class="area-image" style="background-image:url('${area.image}')">
        <div class="area-overlay">
          <h3 class="area-name">${area.name}</h3>
          <span class="area-state">${area.state}</span>
        </div>
      </div>
    </div>
  `).join("");
}

// ── Build Interest Select Options ─────────────────────────────────────────────
function buildInterestOptions(t) {
  const selects = $$("[data-interest-select]");
  selects.forEach(sel => {
    const options = t("contact.form.interest_options");
    if (!Array.isArray(options)) return;
    const placeholder = sel.querySelector("option[value='']");
    sel.innerHTML = "";
    if (placeholder) sel.appendChild(placeholder);
    options.forEach(opt => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      sel.appendChild(o);
    });
  });
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────
function initWhatsApp(cfg) {
  const btn = $("[data-whatsapp-btn]");
  if (!btn || !cfg.whatsapp) { if (btn) btn.style.display = "none"; return; }
  updateWhatsApp(i18n.t.bind(i18n), cfg);
}

function updateWhatsApp(t, cfg) {
  const btn = $("[data-whatsapp-btn]");
  if (!btn || !cfg.whatsapp) return;
  const msg = encodeURIComponent(t("whatsapp.message"));
  btn.href = `https://wa.me/${cfg.whatsapp}?text=${msg}`;
  btn.setAttribute("aria-label", t("whatsapp.tooltip"));
  const tooltip = $(".wa-tooltip");
  if (tooltip) tooltip.textContent = t("whatsapp.tooltip");
}

// ── Forms ──────────────────────────────────────────────────────────────────────
function initForms(cfg) {
  $$("[data-form]").forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formType = form.getAttribute("data-form");
      const data = Object.fromEntries(new FormData(form));
      data._form_type = formType;
      data._lang = i18n.getCurrentLang();
      data._timestamp = new Date().toISOString();

      const submitBtn = form.querySelector("[type='submit']");
      const originalText = submitBtn?.textContent;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "..."; }

      try {
        await sendFormData(data, cfg);
        form.reset();
        if (formType === "leadmagnet") {
          window.location.href = "/guia-exemplo";
        } else {
          showFormFeedback(form, "success");
        }
      } catch (err) {
        showFormFeedback(form, "error");
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
      }
    });
  });
}

async function sendFormData(data, cfg) {
  const webhookUrl = cfg?.integrations?.webhook_url;

  // Webhook (Zapier / Make / n8n)
  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return;
  }

  // Google Sheets
  const sheetsUrl = cfg?.integrations?.google_sheets_url;
  if (sheetsUrl) {
    await fetch(sheetsUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return;
  }

  // Fallback: log to console (dev mode)
  console.log("[LUMI LANDING] Form submission:", data);
}

function showFormFeedback(form, type) {
  const feedbackEl = form.querySelector("[data-form-feedback]");
  if (!feedbackEl) return;
  feedbackEl.className = `form-feedback form-feedback--${type}`;
  feedbackEl.style.display = "block";
  setTimeout(() => { feedbackEl.style.display = "none"; }, 4000);
}

// ── Mobile Menu ───────────────────────────────────────────────────────────────
function initMobileMenu() {
  const toggle = $("[data-menu-toggle]");
  const nav = $("[data-nav-menu]");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
    toggle.classList.toggle("is-active", open);
  });

  // Close on link click
  $$("[data-nav-menu] a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", false);
      toggle.classList.remove("is-active");
    });
  });
}

// ── Smooth Scroll ─────────────────────────────────────────────────────────────
function initSmoothScroll() {
  $$("a[href^='#']").forEach(link => {
    link.addEventListener("click", (e) => {
      const target = $(link.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
}

// ── Sticky Header ─────────────────────────────────────────────────────────────
function initStickyHeader() {
  const header = $("[data-header]");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 50);
  window.addEventListener("scroll", onScroll, { passive: true });
}

// ── Scroll Animations ─────────────────────────────────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  $$(".fade-up, .fade-in").forEach(el => observer.observe(el));
}

// ── Cookie Banner ─────────────────────────────────────────────────────────────
function initCookieBanner() {
  if (localStorage.getItem("lumi_cookies")) return;
  const banner = $("[data-cookie-banner]");
  if (!banner) return;
  banner.style.display = "flex";

  $("[data-cookie-accept]")?.addEventListener("click", () => {
    localStorage.setItem("lumi_cookies", "accepted");
    banner.style.display = "none";
  });

  $("[data-cookie-decline]")?.addEventListener("click", () => {
    localStorage.setItem("lumi_cookies", "declined");
    banner.style.display = "none";
  });
}

// ── Chat Conversation Animation ───────────────────────────────────────────────
function initChatConversation() {
  const container = document.getElementById("chat-conversation");
  if (!container) return;

  const messages = [
    { side: "left",  lang: "🇺🇸 English",    text: "I'm looking for a home in Miami. Can you help?",      delay: 0    },
    { side: "right", lang: "🇧🇷 Português",  text: "Claro! Vamos encontrar o lar perfeito para você.",     delay: 1800 },
    { side: "left",  lang: "🇪🇸 Español",    text: "¿Tiene propiedades en Brickell o Wynwood?",            delay: 3800 },
    { side: "right", lang: "🇺🇸 English",    text: "Yes! I have listings in both. Let's schedule a tour.", delay: 5600 },
  ];

  const CYCLE_DURATION = 9000; // ms before restart
  const TYPING_DURATION = 900; // ms the typing indicator shows

  let timers = [];
  let started = false;

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function addBubble(msg) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble chat-bubble--${msg.side} chat-bubble--animated`;
    bubble.innerHTML = `<div class="chat-lang-tag">${msg.lang}</div>${msg.text}`;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping(side) {
    const el = document.createElement("div");
    el.className = "chat-typing";
    el.dataset.typing = "1";
    el.innerHTML = "<span></span><span></span><span></span>";
    if (side === "right") {
      el.style.alignSelf = "flex-end";
      el.style.borderBottomRightRadius = "4px";
      el.style.borderBottomLeftRadius = "16px";
      el.style.background = "var(--color-gold)";
    }
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

  function removeTyping() {
    container.querySelectorAll("[data-typing]").forEach(el => el.remove());
  }

  function runCycle() {
    container.innerHTML = "";

    messages.forEach((msg, i) => {
      // For right-side (agent replies): show typing indicator first
      if (msg.side === "right") {
        timers.push(setTimeout(() => {
          showTyping("right");
        }, msg.delay));
        timers.push(setTimeout(() => {
          removeTyping();
          addBubble(msg);
        }, msg.delay + TYPING_DURATION));
      } else {
        timers.push(setTimeout(() => addBubble(msg), msg.delay));
      }
    });

    // Restart cycle
    timers.push(setTimeout(() => {
      runCycle();
    }, CYCLE_DURATION));
  }

  // Start only when section enters viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !started) {
        started = true;
        runCycle();
      }
      if (!entry.isIntersecting && started) {
        // Pause & reset when out of view so it restarts fresh on re-entry
        clearTimers();
        started = false;
        container.innerHTML = "";
      }
    });
  }, { threshold: 0.3 });

  observer.observe(container.closest(".multilingual") || container);
}
