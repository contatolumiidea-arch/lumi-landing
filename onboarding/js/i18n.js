/**
 * LUMI ONBOARDING — i18n (Internationalization) Engine
 * Identical pattern to LUMI LANDING main project.
 * Handles language loading, switching, and text injection.
 */

const i18n = (() => {
  let currentLang = "en";
  let translations = {};

  // ── Load translation JSON ─────────────────────────────────────────────────
  async function load(lang) {
    try {
      const res = await fetch(`translations/${lang}.json`);
      if (!res.ok) throw new Error(`Translation not found: ${lang}`);
      translations = await res.json();
      currentLang = lang;
      localStorage.setItem("lumi_onboarding_lang", lang);
      applyTranslations();
      updateLangSwitcher();
      document.documentElement.lang = lang;
    } catch (err) {
      console.warn("i18n load error:", err);
    }
  }

  // ── Get nested key (supports dot notation) ────────────────────────────────
  function t(key) {
    const parts = key.split(".");
    let val = translations;
    for (const p of parts) {
      if (val == null) return key;
      val = val[p];
    }
    return val ?? key;
  }

  // ── Apply all [data-i18n] attributes in DOM ───────────────────────────────
  function applyTranslations() {
    // Text content
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const value = t(key);
      if (typeof value === "string") el.textContent = value;
    });

    // Placeholder attributes
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      const value = t(key);
      if (typeof value === "string") el.placeholder = value;
    });

    // HTML content (safe, internal only)
    document.querySelectorAll("[data-i18n-html]").forEach(el => {
      const key = el.getAttribute("data-i18n-html");
      const value = t(key);
      if (typeof value === "string") el.innerHTML = value;
    });

    // Aria-label
    document.querySelectorAll("[data-i18n-aria]").forEach(el => {
      const key = el.getAttribute("data-i18n-aria");
      const value = t(key);
      if (typeof value === "string") el.setAttribute("aria-label", value);
    });

    // Value attribute (for buttons, inputs with data-i18n-value)
    document.querySelectorAll("[data-i18n-value]").forEach(el => {
      const key = el.getAttribute("data-i18n-value");
      const value = t(key);
      if (typeof value === "string") el.value = value;
    });

    // Trigger custom event for dynamic content
    document.dispatchEvent(new CustomEvent("lumi:langChanged", {
      detail: { lang: currentLang, t }
    }));
  }

  // ── Update active state on lang switcher buttons ──────────────────────────
  function updateLangSwitcher() {
    document.querySelectorAll("[data-lang-btn]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-lang-btn") === currentLang);
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init(defaultLang = "en") {
    const saved = localStorage.getItem("lumi_onboarding_lang");
    const browserLang = navigator.language?.slice(0, 2);
    const supported = ["pt", "en", "es"];
    const lang = saved || (supported.includes(browserLang) ? browserLang : defaultLang);
    await load(lang);
  }

  return { init, load, t, getCurrentLang: () => currentLang };
})();
