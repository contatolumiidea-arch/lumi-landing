/**
 * LUMI ONBOARDING — Premium SaaS Wizard Logic
 * 9-step onboarding for LUMI LANDING clients.
 * The LUMI team creates the page — never "build your own."
 */

const OnboardingApp = {
  currentStep: 0,   // 0 = welcome screen
  totalSteps: 9,
  data: {},
  uploadedFiles: {},

  // ── Init ─────────────────────────────────────────────────────────
  init() {
    this.data = {
      uuid: this._generateUUID(),
      startedAt: new Date().toISOString(),
    };

    this._bindWelcome();
    this._bindNav();
    this._bindLangSwitcher();
    this._bindFields();
    this._bindUploads();
    this._bindStyleCards();
    this._bindSpecialties();
    this._bindTags();
    this._bindLinks();
    this._bindGoogleToggle();
    this._bindLeadWho();
    this._bindLeadMagnet();
    this._bindTestimonials();
    this._bindProperties();
    this._bindColorPickers();
    this._bindSubmit();

    this.loadProgress();

    // Listen for lang change to re-render dynamic content
    document.addEventListener('lumi:langChanged', () => {
      this._updateDynamicLabels();
    });
  },

  // ── UUID ─────────────────────────────────────────────────────────
  _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },

  // ── Welcome Screen ───────────────────────────────────────────────
  _bindWelcome() {
    const btn = document.getElementById('welcome-cta');
    if (btn) btn.addEventListener('click', () => this.startOnboarding());
  },

  startOnboarding() {
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.classList.add('hidden');
    document.querySelector('.onb-footer').classList.remove('hidden');
    this.currentStep = 1;
    this.showStep(1);
    this._updateProgress();
  },

  // ── Show Step ────────────────────────────────────────────────────
  showStep(n, direction = 'forward') {
    const steps = document.querySelectorAll('.wizard-step');

    // Hide all, then activate target
    steps.forEach(s => {
      s.classList.remove('active', 'exit-left', 'enter-right');
    });

    const target = document.querySelector(`.wizard-step[data-step="${n}"]`);
    if (!target) return;

    if (direction === 'forward') {
      target.classList.add('enter-right');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          target.classList.remove('enter-right');
          target.classList.add('active');
        });
      });
    } else {
      target.classList.add('active');
    }

    target.scrollTop = 0;
    this.currentStep = n;
    this._updateProgress();
    this._updateButtons();

    // Build summary on step 9
    if (n === 9) this.buildSummary();
  },

  // ── Navigation ──────────────────────────────────────────────────
  _bindNav() {
    document.getElementById('btn-next')?.addEventListener('click', () => this.goNext());
    document.getElementById('btn-back')?.addEventListener('click', () => this.goBack());
    document.getElementById('btn-save')?.addEventListener('click', () => this.saveProgress());
  },

  goNext() {
    if (!this.validateStep(this.currentStep)) return;
    this._collectStep(this.currentStep);
    if (this.currentStep >= this.totalSteps) {
      this.submitForm();
      return;
    }
    const next = this.currentStep + 1;
    const current = document.querySelector(`.wizard-step[data-step="${this.currentStep}"]`);
    if (current) {
      current.classList.add('exit-left');
      current.classList.remove('active');
    }
    setTimeout(() => {
      if (current) current.classList.remove('exit-left');
      this.showStep(next, 'forward');
    }, 50);
    this.saveProgress();
  },

  goBack() {
    if (this.currentStep <= 1) return;
    const prev = this.currentStep - 1;
    const current = document.querySelector(`.wizard-step[data-step="${this.currentStep}"]`);
    if (current) {
      current.classList.remove('active');
    }
    this.showStep(prev, 'backward');
  },

  // ── Progress ─────────────────────────────────────────────────────
  _updateProgress() {
    const pct = this.currentStep > 0
      ? Math.round((this.currentStep / this.totalSteps) * 100)
      : 0;
    const fill = document.querySelector('.progress-bar-fill');
    if (fill) fill.style.width = pct + '%';

    const num = document.getElementById('step-num');
    const tot = document.getElementById('step-total');
    if (num) num.textContent = this.currentStep;
    if (tot) tot.textContent = this.totalSteps;

    // Update step dots
    document.querySelectorAll('.step-dot').forEach(dot => {
      const n = parseInt(dot.dataset.dot, 10);
      dot.classList.remove('active', 'done');
      if (n === this.currentStep) dot.classList.add('active');
      else if (n < this.currentStep) dot.classList.add('done');
    });
  },

  _updateButtons() {
    const backBtn = document.getElementById('btn-back');
    const nextBtn = document.getElementById('btn-next');
    if (backBtn) backBtn.disabled = this.currentStep <= 1;
    if (nextBtn) {
      if (this.currentStep === this.totalSteps) {
        nextBtn.textContent = i18n.t('s9.submit_btn') || 'Enviar para a equipe LUMI';
      } else {
        nextBtn.textContent = i18n.t('btn.next') || 'Próximo';
      }
    }
  },

  _updateDynamicLabels() {
    this._updateButtons();
  },

  // ── Validation ───────────────────────────────────────────────────
  validateStep(n) {
    let valid = true;

    // Clear previous errors
    document.querySelectorAll(`.wizard-step[data-step="${n}"] .field-error`)
      .forEach(e => e.classList.remove('visible'));
    document.querySelectorAll(`.wizard-step[data-step="${n}"] .form-input, .wizard-step[data-step="${n}"] .form-select, .wizard-step[data-step="${n}"] .form-textarea`)
      .forEach(el => el.classList.remove('error'));

    if (n === 1) {
      valid = this._requireField('s1-full-name') && valid;
      valid = this._requireField('s1-email', 'email') && valid;
    }

    return valid;
  },

  _requireField(id, type) {
    const el = document.getElementById(id);
    if (!el) return true;
    const val = el.value.trim();
    if (!val) {
      el.classList.add('error');
      const err = el.parentElement.querySelector('.field-error');
      if (err) err.classList.add('visible');
      return false;
    }
    if (type === 'email') {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!ok) {
        el.classList.add('error');
        const err = el.parentElement.querySelector('.field-error');
        if (err) {
          err.textContent = i18n.t('validation.email_invalid');
          err.classList.add('visible');
        }
        return false;
      }
    }
    return true;
  },

  // ── Collect Step Data ────────────────────────────────────────────
  _collectStep(n) {
    if (n === 1) {
      this.data.fullName      = this._val('s1-full-name');
      this.data.businessName  = this._val('s1-business-name');
      this.data.phone         = this._val('s1-phone');
      this.data.whatsapp      = this._val('s1-whatsapp');
      this.data.email         = this._val('s1-email');
      this.data.city          = this._val('s1-city');
      this.data.country       = this._val('s1-country');
      this.data.language      = this._val('s1-language');
    }
    if (n === 2) {
      this.data.primaryColor   = document.getElementById('s2-primary-color')?.value || '#D4AF37';
      this.data.secondaryColor = document.getElementById('s2-secondary-color')?.value || '#050505';
      this.data.stylePreference = document.querySelector('.style-card.selected')?.dataset.style || '';
    }
    if (n === 3) {
      this.data.specialties   = Array.from(document.querySelectorAll('.spec-card.checked')).map(c => c.dataset.spec);
      this.data.regions       = this._getTags('s3-regions-tags');
      this.data.propertyTypes = this._getTags('s3-types-tags');
      this.data.years         = this._val('s3-years');
      this.data.bio           = this._val('s3-bio');
    }
    if (n === 4) {
      this.data.website   = this._val('s4-website');
      this.data.instagram = this._val('s4-instagram');
      this.data.facebook  = this._val('s4-facebook');
      this.data.linkedin  = this._val('s4-linkedin');
      this.data.hasGoogle = document.getElementById('s4-google-toggle')?.checked || false;
      this.data.googleUrl = this._val('s4-google-url');
    }
    if (n === 5) {
      this.data.leadWho         = Array.from(document.querySelectorAll('.lead-who-card.checked')).map(c => c.dataset.who);
      this.data.leadWhatsapp    = this._val('s5-whatsapp');
      this.data.leadEmail       = this._val('s5-email');
    }
    if (n === 6) {
      this.data.leadMagnetOption = document.querySelector('.option-card.selected')?.dataset.option || 'lumi';
      this.data.lumiGuideLanguages = Array.from(document.querySelectorAll('.lang-check-input:checked')).map(c => c.value);
    }
    if (n === 7) {
      this.data.testimonials = this._collectTestimonials();
    }
    if (n === 8) {
      this.data.properties = this._collectProperties();
    }
  },

  _val(id) {
    return document.getElementById(id)?.value?.trim() || '';
  },

  _getTags(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} .tag-item`)).map(t => t.dataset.value || t.childNodes[0].textContent.trim());
  },

  // ── Field Auto-save ──────────────────────────────────────────────
  _bindFields() {
    document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
      el.addEventListener('input', () => {
        // Auto-prefill step 5 from step 1
        if (el.id === 's1-whatsapp') {
          const t = document.getElementById('s5-whatsapp');
          if (t && !t.value) t.value = el.value;
        }
        if (el.id === 's1-email') {
          const t = document.getElementById('s5-email');
          if (t && !t.value) t.value = el.value;
        }
      });
    });

    // Bio counter
    const bio = document.getElementById('s3-bio');
    const counter = document.getElementById('s3-bio-counter');
    if (bio && counter) {
      const max = 500;
      bio.addEventListener('input', () => {
        const remaining = max - bio.value.length;
        counter.textContent = remaining + ' ' + (i18n.t('s3.bio_counter') || 'characters remaining');
        counter.className = 'bio-counter' + (remaining <= 50 ? ' near-limit' : '') + (remaining <= 0 ? ' at-limit' : '');
        if (bio.value.length > max) bio.value = bio.value.substring(0, max);
      });
    }
  },

  // ── Style Cards ──────────────────────────────────────────────────
  _bindStyleCards() {
    document.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  },

  // ── Specialty Cards ──────────────────────────────────────────────
  _bindSpecialties() {
    document.querySelectorAll('.spec-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('checked');
        const cb = card.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = card.classList.contains('checked');
      });
    });
  },

  // ── Tags Input ───────────────────────────────────────────────────
  _bindTags() {
    document.querySelectorAll('.tags-wrapper').forEach(wrapper => {
      const input = wrapper.querySelector('.tag-input');
      if (!input) return;
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const val = input.value.trim().replace(/,$/, '');
          if (val) {
            this._addTag(wrapper, val);
            input.value = '';
          }
        }
        if (e.key === 'Backspace' && !input.value) {
          const tags = wrapper.querySelectorAll('.tag-item');
          if (tags.length) tags[tags.length - 1].remove();
        }
      });
      wrapper.addEventListener('click', () => input.focus());
    });
  },

  _addTag(wrapper, val) {
    const existing = Array.from(wrapper.querySelectorAll('.tag-item')).map(t => t.dataset.value);
    if (existing.includes(val)) return;
    const tag = document.createElement('span');
    tag.className = 'tag-item';
    tag.dataset.value = val;
    tag.innerHTML = `${this._escHtml(val)}<span class="tag-remove" title="Remove">×</span>`;
    tag.querySelector('.tag-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      tag.remove();
    });
    const input = wrapper.querySelector('.tag-input');
    wrapper.insertBefore(tag, input);
  },

  _escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  // ── Link Fields (Step 4) ─────────────────────────────────────────
  _bindLinks() {
    // Nothing extra needed — inputs handle themselves
  },

  // ── Google Toggle (Step 4) ───────────────────────────────────────
  _bindGoogleToggle() {
    const toggle = document.getElementById('s4-google-toggle');
    const reveal = document.getElementById('s4-google-reveal');
    if (toggle && reveal) {
      toggle.addEventListener('change', () => {
        reveal.classList.toggle('visible', toggle.checked);
      });
    }
  },

  // ── Lead Who (Step 5) ────────────────────────────────────────────
  _bindLeadWho() {
    document.querySelectorAll('.lead-who-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('checked');
      });
    });
  },

  // ── Lead Magnet Option Cards (Step 6) ────────────────────────────
  _bindLeadMagnet() {
    document.querySelectorAll('.option-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        // Show/hide content
        const opt = card.dataset.option;
        document.getElementById('lm-own-content')?.classList.toggle('hidden-block', opt !== 'own');
        document.getElementById('lm-lumi-content')?.classList.toggle('hidden-block', opt !== 'lumi');
      });
    });
  },

  // ── Uploads ──────────────────────────────────────────────────────
  _bindUploads() {
    document.querySelectorAll('.upload-zone').forEach(zone => {
      const input = zone.querySelector('input[type="file"]');
      if (!input) return;
      const previewId = zone.dataset.preview;
      const preview = previewId ? document.getElementById(previewId) : null;

      ['dragenter','dragover'].forEach(evt => {
        zone.addEventListener(evt, (e) => {
          e.preventDefault();
          zone.classList.add('drag-active');
        });
      });
      ['dragleave','drop'].forEach(evt => {
        zone.addEventListener(evt, (e) => {
          e.preventDefault();
          zone.classList.remove('drag-active');
          if (evt === 'drop' && e.dataTransfer?.files) {
            this._handleFiles(input, e.dataTransfer.files, preview);
          }
        });
      });
      input.addEventListener('change', () => {
        if (input.files?.length) this._handleFiles(input, input.files, preview);
      });
    });
  },

  _handleFiles(input, files, previewEl) {
    if (!previewEl) return;
    const maxFiles = parseInt(input.dataset.max) || 1;
    const existing = previewEl.querySelectorAll('.preview-item').length;
    const toAdd = Math.min(files.length, maxFiles - existing);

    for (let i = 0; i < toAdd; i++) {
      const file = files[i];
      const item = document.createElement('div');
      item.className = 'preview-item';

      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.alt = file.name;
        const reader = new FileReader();
        reader.onload = e => { img.src = e.target.result; };
        reader.readAsDataURL(file);
        item.appendChild(img);

        // Store for logo preview in summary
        if (input.id === 's2-logo-input') {
          const summaryLogoReader = new FileReader();
          summaryLogoReader.onload = e => {
            this.data.logoDataUrl = e.target.result;
          };
          summaryLogoReader.readAsDataURL(file);
        }
      } else {
        const name = document.createElement('div');
        name.className = 'preview-item__name';
        name.textContent = file.name;
        item.appendChild(name);
      }

      const rem = document.createElement('span');
      rem.className = 'preview-remove';
      rem.textContent = '×';
      rem.addEventListener('click', () => item.remove());
      item.appendChild(rem);

      previewEl.appendChild(item);
    }

    previewEl.classList.toggle('has-files', previewEl.querySelectorAll('.preview-item').length > 0);
  },

  // ── Color Pickers ────────────────────────────────────────────────
  _bindColorPickers() {
    const pairs = [
      { rowId: 's2-primary-row', nativeId: 's2-primary-color', hexId: 's2-primary-hex', swatchId: 's2-primary-swatch' },
      { rowId: 's2-secondary-row', nativeId: 's2-secondary-color', hexId: 's2-secondary-hex', swatchId: 's2-secondary-swatch' },
    ];
    pairs.forEach(({ rowId, nativeId, hexId, swatchId }) => {
      const row    = document.getElementById(rowId);
      const native = document.getElementById(nativeId);
      const hexEl  = document.getElementById(hexId);
      const swatch = document.getElementById(swatchId);
      if (!row || !native || !hexEl || !swatch) return;

      const sync = (hex) => {
        swatch.style.background = hex;
        hexEl.value = hex.toUpperCase();
        native.value = hex;
      };

      row.addEventListener('click', () => native.click());
      native.addEventListener('input', () => sync(native.value));
      hexEl.addEventListener('change', () => {
        const hex = hexEl.value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) sync(hex);
      });
    });
  },

  // ── Testimonials (Step 7) ────────────────────────────────────────
  _testimonialCount: 0,

  _bindTestimonials() {
    const addBtn = document.getElementById('add-testimonial-btn');
    if (!addBtn) return;
    // Add first card on init
    this._addTestimonialCard();
    addBtn.addEventListener('click', () => {
      if (this._testimonialCount >= 5) return;
      this._addTestimonialCard();
    });
  },

  _addTestimonialCard() {
    const list = document.getElementById('testimonials-list');
    if (!list) return;
    this._testimonialCount++;
    const idx = this._testimonialCount;
    const t = i18n.t.bind(i18n);

    const card = document.createElement('div');
    card.className = 'rep-card';
    card.dataset.testimonial = idx;
    card.innerHTML = `
      <div class="rep-card__header">
        <span class="rep-card__num">${t('s7.client_name') || 'Cliente'} ${idx}</span>
        <button class="rep-card__remove" type="button">${t('btn.remove') || 'Remover'}</button>
      </div>
      <div class="rep-card__grid">
        <div class="form-group">
          <label class="form-label">${t('s7.client_name') || 'Nome do cliente'}</label>
          <input class="form-input" type="text" name="tname-${idx}" placeholder="${t('s7.client_name_ph') || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('s7.video_label') || 'Link de vídeo (opcional)'}</label>
          <input class="form-input" type="url" name="tvideo-${idx}" placeholder="${t('s7.video_ph') || 'YouTube ou Vimeo'}">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">${t('s7.testimonial') || 'Depoimento'}</label>
          <textarea class="form-textarea" name="ttext-${idx}" rows="3" placeholder="${t('s7.testimonial_ph') || ''}"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">${t('s7.photo_label') || 'Foto do cliente (opcional)'}</label>
          <div class="upload-zone" style="min-height:90px">
            <div class="upload-icon">📷</div>
            <div class="upload-cta">${t('s2.upload_cta') || 'Arraste ou clique'}</div>
            <div class="upload-hint">${t('s7.photo_hint') || 'JPG ou PNG'}</div>
            <input type="file" accept="image/*" name="tphoto-${idx}">
          </div>
        </div>
      </div>
    `;

    card.querySelector('.rep-card__remove').addEventListener('click', () => {
      card.remove();
      this._testimonialCount--;
      const addBtn = document.getElementById('add-testimonial-btn');
      if (addBtn) addBtn.disabled = this._testimonialCount >= 5;
    });

    list.appendChild(card);

    const addBtn = document.getElementById('add-testimonial-btn');
    if (addBtn) addBtn.disabled = this._testimonialCount >= 5;
  },

  _collectTestimonials() {
    const result = [];
    document.querySelectorAll('#testimonials-list .rep-card').forEach(card => {
      const idx = card.dataset.testimonial;
      result.push({
        name:  card.querySelector(`[name="tname-${idx}"]`)?.value?.trim() || '',
        text:  card.querySelector(`[name="ttext-${idx}"]`)?.value?.trim() || '',
        video: card.querySelector(`[name="tvideo-${idx}"]`)?.value?.trim() || '',
      });
    });
    return result;
  },

  // ── Properties (Step 8) ──────────────────────────────────────────
  _propertyCount: 0,

  _bindProperties() {
    const addBtn = document.getElementById('add-property-btn');
    if (!addBtn) return;
    // Start with one card
    this._addPropertyCard();
    addBtn.addEventListener('click', () => {
      if (this._propertyCount >= 6) return;
      this._addPropertyCard();
    });
  },

  _addPropertyCard() {
    const list = document.getElementById('properties-list');
    if (!list) return;
    this._propertyCount++;
    const idx = this._propertyCount;
    const t = i18n.t.bind(i18n);

    const card = document.createElement('div');
    card.className = 'rep-card';
    card.dataset.property = idx;
    card.innerHTML = `
      <div class="rep-card__header">
        <span class="rep-card__num">${t('s8.highlight_label') || 'Imóvel'} ${idx}</span>
        <button class="rep-card__remove" type="button">${t('btn.remove') || 'Remover'}</button>
      </div>
      <div class="rep-card__grid">
        <div class="form-group">
          <label class="form-label">${t('s8.highlight_label') || 'Destaque'}</label>
          <input class="form-input" type="text" name="phighlight-${idx}" placeholder="${t('s8.highlight_ph') || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('s8.link_label') || 'Link do anúncio'}</label>
          <input class="form-input" type="url" name="plink-${idx}" placeholder="${t('s8.link_ph') || 'https://...'}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('s8.video_label') || 'Vídeo (URL)'}</label>
          <input class="form-input" type="url" name="pvideo-${idx}" placeholder="${t('s8.video_ph') || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('s8.photos_label') || 'Fotos do imóvel'}</label>
          <div class="upload-zone" style="min-height:90px">
            <div class="upload-icon">🏠</div>
            <div class="upload-cta">${t('s2.upload_cta') || 'Arraste ou clique'}</div>
            <div class="upload-hint">${t('s8.photos_hint') || 'Máx. 5 fotos'}</div>
            <input type="file" accept="image/*" multiple data-max="5" name="pphotos-${idx}">
          </div>
        </div>
      </div>
    `;

    card.querySelector('.rep-card__remove').addEventListener('click', () => {
      card.remove();
      this._propertyCount--;
      const addBtn = document.getElementById('add-property-btn');
      if (addBtn) addBtn.disabled = this._propertyCount >= 6;
    });

    list.appendChild(card);

    const addBtn = document.getElementById('add-property-btn');
    if (addBtn) addBtn.disabled = this._propertyCount >= 6;
  },

  _collectProperties() {
    const result = [];
    document.querySelectorAll('#properties-list .rep-card').forEach(card => {
      const idx = card.dataset.property;
      result.push({
        highlight: card.querySelector(`[name="phighlight-${idx}"]`)?.value?.trim() || '',
        link:      card.querySelector(`[name="plink-${idx}"]`)?.value?.trim() || '',
        video:     card.querySelector(`[name="pvideo-${idx}"]`)?.value?.trim() || '',
      });
    });
    return result;
  },

  // ── Build Summary (Step 9) ───────────────────────────────────────
  buildSummary() {
    this._collectStep(this.currentStep - 1); // collect previous step data

    // Identity
    const nameEl = document.getElementById('summary-name');
    const styleEl = document.getElementById('summary-style');
    const logoEl = document.getElementById('summary-logo');
    if (nameEl) nameEl.textContent = [this.data.fullName, this.data.businessName].filter(Boolean).join(' — ') || '—';
    if (styleEl) styleEl.textContent = this.data.stylePreference || '—';
    if (logoEl && this.data.logoDataUrl) {
      logoEl.src = this.data.logoDataUrl;
      logoEl.style.display = 'block';
    }

    // Colors
    const c1 = document.getElementById('summary-color1');
    const c2 = document.getElementById('summary-color2');
    const cv1 = document.getElementById('summary-color1-val');
    const cv2 = document.getElementById('summary-color2-val');
    if (c1) c1.style.background = this.data.primaryColor || '#D4AF37';
    if (c2) c2.style.background = this.data.secondaryColor || '#050505';
    if (cv1) cv1.textContent = (this.data.primaryColor || '#D4AF37').toUpperCase();
    if (cv2) cv2.textContent = (this.data.secondaryColor || '#050505').toUpperCase();

    // Contact
    const contactEl = document.getElementById('summary-contact');
    if (contactEl) {
      const parts = [];
      if (this.data.phone)    parts.push('📞 ' + this.data.phone);
      if (this.data.whatsapp) parts.push('💬 ' + this.data.whatsapp);
      if (this.data.email)    parts.push('✉️ ' + this.data.email);
      contactEl.textContent = parts.join(' · ') || '—';
    }

    // Specialties
    const specEl = document.getElementById('summary-specialties');
    if (specEl) {
      specEl.innerHTML = '';
      (this.data.specialties || []).forEach(s => {
        const pill = document.createElement('span');
        pill.className = 'tag-pill';
        pill.textContent = s;
        specEl.appendChild(pill);
      });
      if (!(this.data.specialties || []).length) specEl.textContent = '—';
    }

    // Links
    const linksEl = document.getElementById('summary-links');
    if (linksEl) {
      const links = [];
      if (this.data.instagram) links.push('📸 Instagram');
      if (this.data.facebook)  links.push('👤 Facebook');
      if (this.data.linkedin)  links.push('💼 LinkedIn');
      if (this.data.website)   links.push('🌐 Website');
      linksEl.textContent = links.join(' · ') || '—';
    }

    // Lead Magnet
    const lmEl = document.getElementById('summary-leadmagnet');
    if (lmEl) lmEl.textContent = this.data.leadMagnetOption === 'own' ? 'Materiais próprios' : 'Modelos LUMI';

    // Testimonials
    const tEl = document.getElementById('summary-testimonials');
    const count = (this.data.testimonials || []).filter(t => t.name || t.text).length;
    if (tEl) tEl.textContent = count + ' ' + (i18n.t('s9.testimonials_count') || 'adicionados');
  },

  // ── Submit ───────────────────────────────────────────────────────
  _bindSubmit() {
    document.getElementById('submit-btn')?.addEventListener('click', () => this.submitForm());
  },

  submitForm() {
    // Collect all remaining data
    for (let i = 1; i <= this.totalSteps; i++) this._collectStep(i);
    this.data.submittedAt = new Date().toISOString();

    // Log for future webhook integration
    console.log('[LUMI ONBOARDING] Submission data:', JSON.stringify(this.data, null, 2));

    // Future hooks (stub):
    // this.sendToCRM(this.data);
    // this.triggerWebhook(this.data);
    // this.notifyStripe(this.data);

    // Clear localStorage
    localStorage.removeItem('lumi_onboarding_progress');

    // Show success
    this._showSuccess();
  },

  _showSuccess() {
    const screen = document.getElementById('success-screen');
    if (!screen) return;
    screen.classList.add('visible');
    document.querySelector('.onb-footer')?.classList.add('hidden');
    this._spawnParticles(screen);
  },

  _spawnParticles(container) {
    const colors = ['#D4AF37', '#F5D77A', '#9A6B18', '#ffffff'];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${-10 - Math.random() * 30}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${4 + Math.random() * 6}px;
        height: ${4 + Math.random() * 6}px;
        animation-delay: ${Math.random() * 1.5}s;
        animation-duration: ${1.5 + Math.random() * 2}s;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      `;
      container.querySelector('.particles')?.appendChild(p);
    }
  },

  // ── Save / Load Progress ─────────────────────────────────────────
  saveProgress() {
    const state = {
      step: this.currentStep,
      data: this.data,
      fields: this._snapshotFields(),
    };
    try {
      localStorage.setItem('lumi_onboarding_progress', JSON.stringify(state));
      this._showToast(i18n.t('save.saved') || 'Progresso salvo!');
    } catch (e) {
      console.warn('Save error:', e);
    }
  },

  loadProgress() {
    try {
      const raw = localStorage.getItem('lumi_onboarding_progress');
      if (!raw) return;
      const state = JSON.parse(raw);
      if (!state) return;
      this.data = state.data || {};
      if (!this.data.uuid) this.data.uuid = this._generateUUID();
      // Restore fields
      if (state.fields) this._restoreFields(state.fields);
      // Restore step
      if (state.step > 0) {
        document.getElementById('welcome-screen')?.classList.add('hidden');
        document.querySelector('.onb-footer')?.classList.remove('hidden');
        this.currentStep = state.step;
        this.showStep(state.step);
        this._updateProgress();
      }
    } catch (e) {
      console.warn('Load error:', e);
    }
  },

  _snapshotFields() {
    const snapshot = {};
    document.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
      if (el.type === 'file' || el.type === 'color') return;
      if (el.type === 'checkbox') {
        snapshot[el.id] = el.checked;
      } else {
        snapshot[el.id] = el.value;
      }
    });
    return snapshot;
  },

  _restoreFields(fields) {
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (!el || el.type === 'file' || el.type === 'color') return;
      if (el.type === 'checkbox') {
        el.checked = val;
      } else {
        el.value = val;
      }
    });
  },

  _showToast(msg) {
    const toast = document.getElementById('save-toast');
    if (!toast) return;
    toast.textContent = '✓ ' + msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  },

  // ── Language Switcher ────────────────────────────────────────────
  _bindLangSwitcher() {
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        i18n.load(btn.getAttribute('data-lang-btn'));
      });
    });
  },

  // ── Future hooks (stubs) ─────────────────────────────────────────
  // sendToCRM(data) { }
  // triggerWebhook(data) { }
  // notifyStripe(data) { }
};

// ── Bootstrap ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await i18n.init('pt');
  OnboardingApp.init();
});
