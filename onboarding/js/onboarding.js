/**
 * LUMI ONBOARDING — Wizard Logic
 * 10-step configuration wizard for LUMI LANDING clients.
 */

const LUMI = (() => {

  // ── State ─────────────────────────────────────────────────────────────────
  const TOTAL_STEPS = 10;
  const STORAGE_KEY = "lumi_onboarding_data";
  let currentStep = 1;
  let data = {};

  // File object references (can't be stored in localStorage)
  const fileRefs = {
    logo: null,
    photo: null,
    properties: [],
    ebook_pdf: null
  };

  // ── UUID Generator (no libs) ──────────────────────────────────────────────
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // ── LocalStorage helpers ──────────────────────────────────────────────────
  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showToast(i18n.t("toast.saved"));
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        data = JSON.parse(saved);
        // Restore step if saved
        if (data._currentStep) {
          currentStep = data._currentStep;
        }
        if (!data.client_id) {
          data.client_id = generateUUID();
        }
      } else {
        data = {
          client_id: generateUUID(),
          created_at: new Date().toISOString(),
          status: "pending_setup",
          meta: { lumiProduct: "LUMI LANDING", version: "1.0.0" }
        };
      }
    } catch (e) {
      data = {
        client_id: generateUUID(),
        created_at: new Date().toISOString(),
        status: "pending_setup",
        meta: { lumiProduct: "LUMI LANDING", version: "1.0.0" }
      };
    }
  }

  // ── Toast notification ────────────────────────────────────────────────────
  function showToast(message, type = "success") {
    const existing = document.querySelector(".lumi-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `lumi-toast lumi-toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("lumi-toast--visible"));
    setTimeout(() => {
      toast.classList.remove("lumi-toast--visible");
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ── Progress bar ──────────────────────────────────────────────────────────
  function updateProgress() {
    const pct = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
    const bar = document.querySelector(".progress-fill");
    const label = document.querySelector(".progress-label");
    if (bar) bar.style.width = pct + "%";
    if (label) {
      label.textContent = `${i18n.t("nav.step_label")} ${currentStep} ${i18n.t("nav.of")} ${TOTAL_STEPS}`;
    }

    // Update step indicators
    document.querySelectorAll(".step-dot").forEach((dot, idx) => {
      dot.classList.toggle("active", idx + 1 === currentStep);
      dot.classList.toggle("done", idx + 1 < currentStep);
    });
  }

  // ── Navigate to step ─────────────────────────────────────────────────────
  function goToStep(n, direction = "next") {
    if (n < 1 || n > TOTAL_STEPS) return;

    const current = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
    const target = document.querySelector(`.wizard-step[data-step="${n}"]`);
    if (!current || !target) return;

    // Animate out
    current.classList.add(direction === "next" ? "exit-left" : "exit-right");
    setTimeout(() => {
      current.classList.remove("active", "exit-left", "exit-right");
      currentStep = n;
      data._currentStep = currentStep;
      target.classList.add("active", direction === "next" ? "enter-right" : "enter-left");
      requestAnimationFrame(() => {
        target.classList.remove("enter-right", "enter-left");
      });
      updateProgress();
      updateNavButtons();
      populateStep(n);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 280);
  }

  // ── Update nav buttons ────────────────────────────────────────────────────
  function updateNavButtons() {
    const backBtn = document.getElementById("btn-back");
    const nextBtn = document.getElementById("btn-next");
    const finishBtn = document.getElementById("btn-finish");

    if (backBtn) backBtn.style.display = currentStep === 1 ? "none" : "flex";
    if (nextBtn) nextBtn.style.display = currentStep === TOTAL_STEPS ? "none" : "flex";
    if (finishBtn) finishBtn.style.display = currentStep === TOTAL_STEPS ? "flex" : "none";
  }

  // ── Populate step with saved data ─────────────────────────────────────────
  function populateStep(n) {
    if (n === 1) populateStep1();
    if (n === 2) populateStep2();
    if (n === 3) populateStep3();
    if (n === 4) populateStep4();
    if (n === 5) populateStep5();
    if (n === 6) populateStep6();
    if (n === 7) populateStep7();
    if (n === 8) populateStep8();
    if (n === 9) populateStep9();
    if (n === 10) populateStep10();
  }

  // ── Collect step data ─────────────────────────────────────────────────────
  function collectStep(n) {
    if (n === 1) return collectStep1();
    if (n === 2) return collectStep2();
    if (n === 3) return collectStep3();
    if (n === 4) return collectStep4();
    if (n === 5) return collectStep5();
    if (n === 6) return collectStep6();
    if (n === 7) return collectStep7();
    if (n === 8) return collectStep8();
    if (n === 9) return collectStep9();
    return true;
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.add("field-error");
    let errEl = field.parentElement.querySelector(".error-msg");
    if (!errEl) {
      errEl = document.createElement("span");
      errEl.className = "error-msg";
      field.parentElement.appendChild(errEl);
    }
    errEl.textContent = message;
  }

  function clearErrors(stepEl) {
    stepEl.querySelectorAll(".field-error").forEach(el => el.classList.remove("field-error"));
    stepEl.querySelectorAll(".error-msg").forEach(el => el.remove());
    stepEl.querySelectorAll(".step-error-banner").forEach(el => el.remove());
  }

  function showStepError(stepEl, message) {
    let banner = stepEl.querySelector(".step-error-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.className = "step-error-banner";
      const content = stepEl.querySelector(".step-content");
      if (content) content.prepend(banner);
    }
    banner.textContent = message;
  }

  // ── STEP 1: Business Information ──────────────────────────────────────────
  function collectStep1() {
    const stepEl = document.querySelector('.wizard-step[data-step="1"]');
    clearErrors(stepEl);
    const d = data.step1_business || {};

    const fields = [
      { id: "s1-full-name", key: "fullName", required: true },
      { id: "s1-business-name", key: "businessName", required: true },
      { id: "s1-title", key: "title", required: false },
      { id: "s1-brokerage", key: "brokerage", required: false },
      { id: "s1-license", key: "license", required: false },
      { id: "s1-email", key: "email", required: true, type: "email" },
      { id: "s1-phone", key: "phone", required: false },
      { id: "s1-whatsapp", key: "whatsapp", required: false }
    ];

    let valid = true;
    const result = {};

    fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el) return;
      const val = el.value.trim();
      if (f.required && !val) {
        showError(f.id, i18n.t("validation.required"));
        valid = false;
      } else if (f.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        showError(f.id, i18n.t("validation.email_invalid"));
        valid = false;
      } else {
        result[f.key] = val;
      }
    });

    if (valid) data.step1_business = result;
    return valid;
  }

  function populateStep1() {
    const d = data.step1_business || {};
    const map = {
      "s1-full-name": "fullName",
      "s1-business-name": "businessName",
      "s1-title": "title",
      "s1-brokerage": "brokerage",
      "s1-license": "license",
      "s1-email": "email",
      "s1-phone": "phone",
      "s1-whatsapp": "whatsapp"
    };
    Object.entries(map).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el && d[key]) el.value = d[key];
    });
  }

  // ── STEP 2: Template Selection ────────────────────────────────────────────
  function collectStep2() {
    const stepEl = document.querySelector('.wizard-step[data-step="2"]');
    clearErrors(stepEl);
    const selected = stepEl.querySelector(".template-card.selected");
    if (!selected) {
      showStepError(stepEl, i18n.t("validation.select_template"));
      return false;
    }
    data.step2_template = { selected: selected.dataset.template };
    return true;
  }

  function populateStep2() {
    const d = data.step2_template || {};
    if (d.selected) {
      document.querySelectorAll(".template-card").forEach(card => {
        const isSelected = card.dataset.template === d.selected;
        card.classList.toggle("selected", isSelected);
        const btn = card.querySelector(".template-btn");
        if (btn) btn.textContent = isSelected ? i18n.t("s2.selected_btn") : i18n.t("s2.select_btn");
      });
    }
  }

  // ── STEP 3: Brand Customization ───────────────────────────────────────────
  function collectStep3() {
    data.step3_brand = {
      primaryColor: document.getElementById("s3-primary-color")?.value || "#D4AF37",
      secondaryColor: document.getElementById("s3-secondary-color")?.value || "#050505",
      hasLogo: !!fileRefs.logo,
      hasPhoto: !!fileRefs.photo,
      propertyPhotosCount: fileRefs.properties.length
    };
    return true;
  }

  function populateStep3() {
    const d = data.step3_brand || {};
    const pc = document.getElementById("s3-primary-color");
    const sc = document.getElementById("s3-secondary-color");
    if (pc && d.primaryColor) pc.value = d.primaryColor;
    if (sc && d.secondaryColor) sc.value = d.secondaryColor;
    updateColorPreview("s3-primary-color", "primary-color-preview");
    updateColorPreview("s3-secondary-color", "secondary-color-preview");
  }

  function updateColorPreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (input && preview) preview.style.background = input.value;
  }

  // ── STEP 4: Languages ─────────────────────────────────────────────────────
  function collectStep4() {
    const stepEl = document.querySelector('.wizard-step[data-step="4"]');
    clearErrors(stepEl);
    const checked = [...stepEl.querySelectorAll(".lang-checkbox:checked")].map(el => el.value);
    if (checked.length === 0) {
      showStepError(stepEl, i18n.t("validation.min_lang"));
      return false;
    }
    data.step4_languages = checked;
    return true;
  }

  function populateStep4() {
    const langs = data.step4_languages || [];
    document.querySelectorAll(".lang-checkbox").forEach(cb => {
      cb.checked = langs.includes(cb.value);
    });
  }

  // ── STEP 5: Business Details ──────────────────────────────────────────────
  function collectStep5() {
    data.step5_details = {
      about: document.getElementById("s5-about")?.value.trim() || "",
      yearsExperience: document.getElementById("s5-years")?.value || "",
      citiesServed: getTagsData("cities"),
      statesServed: getTagsData("states"),
      languagesSpoken: getTagsData("languages"),
      specialties: getTagsData("specialties")
    };
    return true;
  }

  function populateStep5() {
    const d = data.step5_details || {};
    if (d.about) { const el = document.getElementById("s5-about"); if (el) el.value = d.about; }
    if (d.yearsExperience) { const el = document.getElementById("s5-years"); if (el) el.value = d.yearsExperience; }
    if (d.citiesServed) restoreTagsData("cities", d.citiesServed);
    if (d.statesServed) restoreTagsData("states", d.statesServed);
    if (d.languagesSpoken) restoreTagsData("languages", d.languagesSpoken);
    if (d.specialties) restoreTagsData("specialties", d.specialties);
  }

  // ── STEP 6: Services ──────────────────────────────────────────────────────
  function collectStep6() {
    const stepEl = document.querySelector('.wizard-step[data-step="6"]');
    clearErrors(stepEl);
    const checked = [...stepEl.querySelectorAll(".service-checkbox:checked")].map(el => el.value);
    if (checked.length === 0) {
      showStepError(stepEl, i18n.t("validation.min_service"));
      return false;
    }
    data.step6_services = checked;
    return true;
  }

  function populateStep6() {
    const services = data.step6_services || [];
    document.querySelectorAll(".service-checkbox").forEach(cb => {
      cb.checked = services.includes(cb.value);
      cb.closest(".service-card")?.classList.toggle("selected", services.includes(cb.value));
    });
  }

  // ── STEP 7: Lead Generation ───────────────────────────────────────────────
  function collectStep7() {
    data.step7_leadgen = {
      whatsapp: document.getElementById("toggle-whatsapp")?.checked || false,
      contactForm: document.getElementById("toggle-contactform")?.checked || false,
      newsletter: document.getElementById("toggle-newsletter")?.checked || false,
      ebook: document.getElementById("toggle-ebook")?.checked || false
    };
    return true;
  }

  function populateStep7() {
    const d = data.step7_leadgen || {};
    const map = {
      "toggle-whatsapp": "whatsapp",
      "toggle-contactform": "contactForm",
      "toggle-newsletter": "newsletter",
      "toggle-ebook": "ebook"
    };
    Object.entries(map).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el && d[key] !== undefined) el.checked = d[key];
    });
  }

  // ── STEP 8: Ebook ─────────────────────────────────────────────────────────
  function collectStep8() {
    const enableEbook = document.querySelector('input[name="ebook-choice"]:checked')?.value === "yes";
    data.step8_ebook = {
      enabled: enableEbook,
      guideTitle: document.getElementById("s8-guide-title")?.value.trim() || "",
      buttonText: document.getElementById("s8-button-text")?.value.trim() || "",
      captureFields: {
        name: document.getElementById("s8-capture-name")?.checked || false,
        email: document.getElementById("s8-capture-email")?.checked || false,
        phone: document.getElementById("s8-capture-phone")?.checked || false
      },
      hasPdf: !!fileRefs.ebook_pdf
    };
    return true;
  }

  function populateStep8() {
    const d = data.step8_ebook || {};
    if (d.enabled !== undefined) {
      const radio = document.querySelector(`input[name="ebook-choice"][value="${d.enabled ? "yes" : "no"}"]`);
      if (radio) { radio.checked = true; toggleEbookDetails(d.enabled); }
    }
    if (d.guideTitle) { const el = document.getElementById("s8-guide-title"); if (el) el.value = d.guideTitle; }
    if (d.buttonText) { const el = document.getElementById("s8-button-text"); if (el) el.value = d.buttonText; }
    if (d.captureFields) {
      const name = document.getElementById("s8-capture-name");
      const email = document.getElementById("s8-capture-email");
      const phone = document.getElementById("s8-capture-phone");
      if (name) name.checked = d.captureFields.name;
      if (email) email.checked = d.captureFields.email;
      if (phone) phone.checked = d.captureFields.phone;
    }
  }

  function toggleEbookDetails(show) {
    const details = document.getElementById("ebook-details");
    if (details) details.style.display = show ? "block" : "none";
  }

  // ── STEP 9: CRM Destination ───────────────────────────────────────────────
  function collectStep9() {
    const stepEl = document.querySelector('.wizard-step[data-step="9"]');
    clearErrors(stepEl);
    const selected = stepEl.querySelector(".crm-card.selected");
    if (!selected) {
      showStepError(stepEl, i18n.t("validation.select_crm"));
      return false;
    }
    const dest = selected.dataset.crm;
    const fieldInput = document.getElementById(`crm-field-${dest}`);
    data.step9_crm = {
      destination: dest,
      value: fieldInput?.value.trim() || ""
    };
    return true;
  }

  function populateStep9() {
    const d = data.step9_crm || {};
    if (d.destination) {
      selectCrmCard(d.destination);
      const fieldInput = document.getElementById(`crm-field-${d.destination}`);
      if (fieldInput && d.value) fieldInput.value = d.value;
    }
  }

  function selectCrmCard(dest) {
    document.querySelectorAll(".crm-card").forEach(card => {
      const isSelected = card.dataset.crm === dest;
      card.classList.toggle("selected", isSelected);
    });
    document.querySelectorAll(".crm-field-row").forEach(row => {
      row.style.display = row.dataset.crmField === dest ? "flex" : "none";
    });
    const lumiFlowBanner = document.getElementById("lumi-flow-banner");
    if (lumiFlowBanner) lumiFlowBanner.style.display = dest === "no-crm" ? "block" : "none";
  }

  // ── STEP 10: Final Review ─────────────────────────────────────────────────
  function populateStep10() {
    const container = document.getElementById("review-content");
    if (!container) return;

    const d1 = data.step1_business || {};
    const d2 = data.step2_template || {};
    const d3 = data.step3_brand || {};
    const d4 = data.step4_languages || [];
    const d5 = data.step5_details || {};
    const d6 = data.step6_services || [];
    const d9 = data.step9_crm || {};

    const serviceLabels = {
      buying: i18n.t("s6.buying"), selling: i18n.t("s6.selling"),
      investment: i18n.t("s6.investment"), relocation: i18n.t("s6.relocation"),
      luxury: i18n.t("s6.luxury"), firsttime: i18n.t("s6.firsttime"),
      commercial: i18n.t("s6.commercial")
    };
    const langLabels = { en: "English", pt: "Português", es: "Español" };
    const templateNames = {
      "template-01": "Classic Authority", "template-02": "Modern Clean",
      "template-03": "Luxury Estate", "template-04": "American Trust", "template-05": "Elite Gold"
    };
    const crmLabels = {
      "my-crm": i18n.t("s9.my_crm"), "email": i18n.t("s9.email_dest"),
      "sheets": "Google Sheets", "zapier": "Zapier", "make": "Make",
      "no-crm": i18n.t("s9.no_crm")
    };

    container.innerHTML = `
      <div class="review-grid">
        <div class="review-card">
          <div class="review-card__icon">👤</div>
          <div class="review-card__body">
            <div class="review-card__label" data-i18n="s10.client_name">${i18n.t("s10.client_name")}</div>
            <div class="review-card__value">${d1.fullName || "—"}</div>
            <div class="review-card__sub">${d1.businessName || ""}</div>
          </div>
        </div>
        <div class="review-card">
          <div class="review-card__icon">🎨</div>
          <div class="review-card__body">
            <div class="review-card__label" data-i18n="s10.template">${i18n.t("s10.template")}</div>
            <div class="review-card__value">${templateNames[d2.selected] || "—"}</div>
          </div>
        </div>
        <div class="review-card">
          <div class="review-card__icon">🎨</div>
          <div class="review-card__body">
            <div class="review-card__label" data-i18n="s10.colors">${i18n.t("s10.colors")}</div>
            <div class="review-colors">
              <span class="color-swatch" style="background:${d3.primaryColor || "#D4AF37"}"></span>
              <span class="color-label">${i18n.t("s10.primary")}: ${d3.primaryColor || "#D4AF37"}</span>
            </div>
            <div class="review-colors">
              <span class="color-swatch" style="background:${d3.secondaryColor || "#050505"}"></span>
              <span class="color-label">${i18n.t("s10.secondary")}: ${d3.secondaryColor || "#050505"}</span>
            </div>
          </div>
        </div>
        <div class="review-card">
          <div class="review-card__icon">🌐</div>
          <div class="review-card__body">
            <div class="review-card__label" data-i18n="s10.languages">${i18n.t("s10.languages")}</div>
            <div class="review-card__value">${d4.map(l => langLabels[l] || l).join(", ") || "—"}</div>
          </div>
        </div>
        <div class="review-card review-card--wide">
          <div class="review-card__icon">🏠</div>
          <div class="review-card__body">
            <div class="review-card__label" data-i18n="s10.services">${i18n.t("s10.services")}</div>
            <div class="review-tags">
              ${d6.length ? d6.map(s => `<span class="review-tag">${serviceLabels[s] || s}</span>`).join("") : "—"}
            </div>
          </div>
        </div>
        <div class="review-card">
          <div class="review-card__icon">🔗</div>
          <div class="review-card__body">
            <div class="review-card__label" data-i18n="s10.crm">${i18n.t("s10.crm")}</div>
            <div class="review-card__value">${crmLabels[d9.destination] || "—"}</div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Generate and download config.json ─────────────────────────────────────
  function generateConfig() {
    const config = {
      client_id: data.client_id,
      created_at: data.created_at || new Date().toISOString(),
      status: "pending_setup",
      step1_business: data.step1_business || {},
      step2_template: data.step2_template || {},
      step3_brand: data.step3_brand || {},
      step4_languages: data.step4_languages || [],
      step5_details: data.step5_details || {},
      step6_services: data.step6_services || [],
      step7_leadgen: data.step7_leadgen || {},
      step8_ebook: data.step8_ebook || {},
      step9_crm: data.step9_crm || {},
      meta: { lumiProduct: "LUMI LANDING", version: "1.0.0", generatedAt: new Date().toISOString() }
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumi-config-${config.client_id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return config;
  }

  // ── Tags input ────────────────────────────────────────────────────────────
  function initTagsInput(containerId, inputId) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    if (!container || !input) return;

    input.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const val = input.value.trim().replace(/,$/, "");
        if (val) addTag(container, input, val);
      }
      if (e.key === "Backspace" && !input.value) {
        const tags = container.querySelectorAll(".tag");
        if (tags.length) tags[tags.length - 1].remove();
      }
    });

    input.addEventListener("blur", () => {
      const val = input.value.trim().replace(/,$/, "");
      if (val) addTag(container, input, val);
    });
  }

  function addTag(container, input, value) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.innerHTML = `${value}<button type="button" class="tag-remove" aria-label="Remove">×</button>`;
    tag.querySelector(".tag-remove").addEventListener("click", () => tag.remove());
    container.insertBefore(tag, input);
    input.value = "";
    input.focus();
  }

  function getTagsData(fieldName) {
    const container = document.getElementById(`tags-${fieldName}`);
    if (!container) return [];
    return [...container.querySelectorAll(".tag")].map(t => t.textContent.replace("×", "").trim());
  }

  function restoreTagsData(fieldName, values) {
    if (!values || !values.length) return;
    const container = document.getElementById(`tags-${fieldName}`);
    const input = document.getElementById(`tag-input-${fieldName}`);
    if (!container || !input) return;
    // Clear existing tags
    container.querySelectorAll(".tag").forEach(t => t.remove());
    values.forEach(val => addTag(container, input, val));
  }

  // ── File upload helpers ───────────────────────────────────────────────────
  function initFileUpload(inputId, previewId, fileRefKey, multiple = false) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input) return;

    const zone = input.closest(".upload-zone");

    if (zone) {
      zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("drag-over"); });
      zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
      zone.addEventListener("drop", e => {
        e.preventDefault();
        zone.classList.remove("drag-over");
        const files = e.dataTransfer.files;
        if (files.length) handleFiles(files, previewId, fileRefKey, multiple);
      });
    }

    input.addEventListener("change", () => {
      handleFiles(input.files, previewId, fileRefKey, multiple);
    });
  }

  function handleFiles(files, previewId, fileRefKey, multiple) {
    const preview = document.getElementById(previewId);

    if (!multiple) {
      fileRefs[fileRefKey] = files[0];
      if (files[0] && files[0].type.startsWith("image/") && preview) {
        const reader = new FileReader();
        reader.onload = e => {
          preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
          preview.style.display = "block";
        };
        reader.readAsDataURL(files[0]);
      } else if (preview) {
        preview.innerHTML = `<span class="upload-file-name">${files[0]?.name || ""}</span>`;
        preview.style.display = "block";
      }
    } else {
      const arr = [...files].slice(0, 5);
      fileRefs[fileRefKey] = arr;
      if (preview) {
        preview.innerHTML = arr.map((f, i) => {
          if (f.type.startsWith("image/")) {
            return `<div class="prop-thumb-wrap" id="prop-thumb-${i}"><span class="prop-loading">Loading…</span></div>`;
          }
          return `<span class="upload-file-name">${f.name}</span>`;
        }).join("");
        preview.style.display = arr.length ? "flex" : "none";

        arr.forEach((f, i) => {
          if (!f.type.startsWith("image/")) return;
          const reader = new FileReader();
          reader.onload = e => {
            const wrap = document.getElementById(`prop-thumb-${i}`);
            if (wrap) wrap.innerHTML = `<img src="${e.target.result}" alt="Property ${i + 1}">`;
          };
          reader.readAsDataURL(f);
        });

        // Update count label
        const countEl = document.querySelector(".props-count");
        if (countEl) countEl.textContent = `${arr.length} ${i18n.t("s3.props_count")}`;
      }
    }
  }

  // ── Init all steps UI ─────────────────────────────────────────────────────
  function initStepsUI() {
    // Step 2: Template cards
    document.querySelectorAll(".template-card").forEach(card => {
      const btn = card.querySelector(".template-btn");
      card.addEventListener("click", () => {
        document.querySelectorAll(".template-card").forEach(c => {
          c.classList.remove("selected");
          const b = c.querySelector(".template-btn");
          if (b) b.textContent = i18n.t("s2.select_btn");
        });
        card.classList.add("selected");
        if (btn) btn.textContent = i18n.t("s2.selected_btn");
      });
    });

    // Step 3: Colors
    ["s3-primary-color", "s3-secondary-color"].forEach((id, i) => {
      const el = document.getElementById(id);
      const previewId = i === 0 ? "primary-color-preview" : "secondary-color-preview";
      if (el) {
        el.addEventListener("input", () => updateColorPreview(id, previewId));
        updateColorPreview(id, previewId);
      }
    });

    // Step 3: File uploads
    initFileUpload("s3-logo-input", "s3-logo-preview", "logo");
    initFileUpload("s3-photo-input", "s3-photo-preview", "photo");
    initFileUpload("s3-props-input", "s3-props-preview", "properties", true);

    // Step 5: Tags inputs
    ["cities", "states", "languages", "specialties"].forEach(field => {
      initTagsInput(`tags-${field}`, `tag-input-${field}`);
    });

    // Step 6: Service cards
    document.querySelectorAll(".service-card").forEach(card => {
      card.addEventListener("click", () => {
        const cb = card.querySelector(".service-checkbox");
        if (cb) {
          cb.checked = !cb.checked;
          card.classList.toggle("selected", cb.checked);
        }
      });
    });

    // Step 8: Ebook toggle
    document.querySelectorAll('input[name="ebook-choice"]').forEach(radio => {
      radio.addEventListener("change", () => toggleEbookDetails(radio.value === "yes"));
    });

    // Step 8: PDF upload
    initFileUpload("s8-pdf-input", "s8-pdf-preview", "ebook_pdf");

    // Step 9: CRM cards
    document.querySelectorAll(".crm-card").forEach(card => {
      card.addEventListener("click", () => selectCrmCard(card.dataset.crm));
    });
  }

  // ── Nav buttons ───────────────────────────────────────────────────────────
  function initNavButtons() {
    const backBtn = document.getElementById("btn-back");
    const nextBtn = document.getElementById("btn-next");
    const saveBtn = document.getElementById("btn-save");
    const finishBtn = document.getElementById("btn-finish");
    const downloadAgainBtn = document.getElementById("btn-download-again");

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        collectStep(currentStep); // save silently without validation
        data._currentStep = currentStep;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        goToStep(currentStep - 1, "back");
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (collectStep(currentStep)) {
          data._currentStep = currentStep + 1;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          goToStep(currentStep + 1, "next");
        }
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        collectStep(currentStep);
        saveData();
      });
    }

    if (finishBtn) {
      finishBtn.addEventListener("click", () => {
        generateConfig();
        showSuccessScreen();
      });
    }

    if (downloadAgainBtn) {
      downloadAgainBtn.addEventListener("click", () => generateConfig());
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  function showSuccessScreen() {
    const wizard = document.querySelector(".wizard-step[data-step='10']");
    const review = document.getElementById("step10-review");
    const success = document.getElementById("step10-success");
    if (review) review.style.display = "none";
    if (success) success.style.display = "block";

    // Clear saved data
    localStorage.removeItem(STORAGE_KEY);
  }

  // ── Language switcher ─────────────────────────────────────────────────────
  function initLangSwitcher() {
    document.querySelectorAll("[data-lang-btn]").forEach(btn => {
      btn.addEventListener("click", async () => {
        await i18n.load(btn.getAttribute("data-lang-btn"));
        // Re-populate current step after lang change
        populateStep(currentStep);
      });
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    loadData();
    await i18n.init("en");
    initStepsUI();
    initNavButtons();
    initLangSwitcher();

    // Show starting step
    const startStep = data._currentStep || 1;
    const firstStep = document.querySelector('.wizard-step[data-step="1"]');
    if (firstStep) firstStep.classList.add("active");

    if (startStep > 1) {
      // Jump to saved step without animation
      document.querySelectorAll(".wizard-step").forEach(s => s.classList.remove("active"));
      const target = document.querySelector(`.wizard-step[data-step="${startStep}"]`);
      if (target) {
        target.classList.add("active");
        currentStep = startStep;
      }
    }

    updateProgress();
    updateNavButtons();
    populateStep(currentStep);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => LUMI.init());
