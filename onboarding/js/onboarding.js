/**
 * LUMI ONBOARDING — Premium SaaS Wizard Logic
 * 9-step onboarding for LUMI LANDING clients.
 * The LUMI team creates the page — never "build your own."
 */

const OnboardingApp = {
  currentStep: 0,   // 0 = welcome screen
  totalSteps: 8,
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
    this._bindVideoPanel();
    this._bindSidebarSave();
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

    const layout = document.getElementById('wizard-layout');
    if (layout) {
      layout.classList.remove('hidden');
      requestAnimationFrame(() => layout.classList.add('visible'));
    }

    const indicator = document.getElementById('step-indicator');
    if (indicator) indicator.classList.remove('hidden');

    document.querySelector('.onb-footer')?.classList.remove('hidden');
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

    // Build summary on step 8
    if (n === 8) this.buildSummary();
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
    if (this.currentStep >= this.totalSteps) return;
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

    // Top progress bar
    const fill = document.querySelector('.progress-bar-fill');
    if (fill) fill.style.width = pct + '%';

    // Header step indicator
    const num = document.getElementById('step-num');
    const tot = document.getElementById('step-total');
    if (num) num.textContent = this.currentStep;
    if (tot) tot.textContent = this.totalSteps;

    // Sidebar progress bar + percentage
    const sidebarFill = document.getElementById('sidebar-fill');
    if (sidebarFill) sidebarFill.style.width = pct + '%';
    const sidebarPct = document.getElementById('sidebar-pct');
    if (sidebarPct) sidebarPct.textContent = pct + '%';

    // Sidebar step states
    document.querySelectorAll('.sidebar-step').forEach(item => {
      const n = parseInt(item.dataset.sidebarStep, 10);
      item.classList.remove('active', 'done');
      if (n === this.currentStep) item.classList.add('active');
      else if (n < this.currentStep) item.classList.add('done');
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
      this.data.primaryColor    = document.getElementById('s2-primary-color')?.value || '#D4AF37';
      this.data.secondaryColor  = document.getElementById('s2-secondary-color')?.value || '#050505';
      this.data.stylePreference = document.querySelector('.style-card.selected')?.dataset.style || '';
      this.data.videos = Array.from(
        document.querySelectorAll('#s2-videos-preview .preview-item[data-video-url]')
      ).map(el => ({ type: el.dataset.videoType || 'link', url: el.dataset.videoUrl }));
    }
    if (n === 3) {
      this.data.specialties   = Array.from(document.querySelectorAll('.spec-card input:checked')).map(cb => cb.value);
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
      this.data.leadWho            = Array.from(document.querySelectorAll('.lead-who-card input[type="checkbox"]:checked')).map(cb => cb.value);
      this.data.contactChannels    = Array.from(document.querySelectorAll('[name="s5-contact-channel"]:checked')).map(cb => cb.value);
      this.data.leadWhatsapp       = this._val('s5-whatsapp');
      this.data.leadEmail          = this._val('s5-email');
      this.data.businessHours      = this._val('s5-business-hours');
      this.data.captureForms       = Array.from(document.querySelectorAll('[name="s5-capture-form"]:checked')).map(cb => cb.value);
      this.data.leadWelcomeMessage = this._val('s5-welcome-message');
    }
    if (n === 6) {
      this.data.leadMagnetOption = document.querySelector('.option-card.selected')?.dataset.option || 'lumi';
      this.data.lumiGuideLanguages = Array.from(document.querySelectorAll('.lang-check-input:checked')).map(c => c.value);
    }
    if (n === 7) {
      this.data.testimonials = this._collectTestimonials();
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
      const cb = card.querySelector('input[type="checkbox"]');
      if (!cb) return;
      cb.addEventListener('change', () => {
        card.classList.toggle('checked', cb.checked);
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
      const cb = card.querySelector('input[type="checkbox"]');
      if (!cb) return;
      cb.addEventListener('change', () => {
        card.classList.toggle('checked', cb.checked);
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

  // ── Video Panel (Step 2) — external link only ───────────────────
  _bindVideoPanel() {
    const panel = document.getElementById('s2-video-panel');
    if (!panel) return;
    const MAX        = 3;
    const previewEl  = document.getElementById('s2-videos-preview');
    const getCount   = () => previewEl?.querySelectorAll('.preview-item').length || 0;

    const linkInput = document.getElementById('s2-video-link-input');
    const addBtn    = document.getElementById('s2-video-link-add');

    const tryAddLink = () => {
      const url = linkInput?.value?.trim();
      if (!url) return;
      if (getCount() >= MAX) {
        linkInput.setCustomValidity('Máximo de 3 vídeos atingido.');
        linkInput.reportValidity();
        setTimeout(() => linkInput.setCustomValidity(''), 2500);
        return;
      }
      const type = this._detectVideoLinkType(url);
      if (!type) {
        linkInput.setCustomValidity('Link inválido. Use YouTube (youtube.com / youtu.be) ou Google Drive (drive.google.com).');
        linkInput.reportValidity();
        setTimeout(() => linkInput.setCustomValidity(''), 3000);
        return;
      }
      linkInput.setCustomValidity('');
      this._addVideoLinkItem(url, type, previewEl);
      linkInput.value = '';
    };

    addBtn?.addEventListener('click', tryAddLink);
    linkInput?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); tryAddLink(); } });

    // Google Drive help toggle
    const helpBtn   = document.getElementById('s2-drive-help-btn');
    const helpSteps = document.getElementById('s2-drive-steps');
    helpBtn?.addEventListener('click', () => {
      const open = helpSteps.hidden;
      helpSteps.hidden = !open;
      helpBtn.setAttribute('aria-expanded', open);
      helpBtn.textContent = open
        ? 'Como liberar acesso no Google Drive ▴'
        : 'Como liberar acesso no Google Drive ▾';
    });
  },

  _detectVideoLinkType(url) {
    try {
      const host = new URL(url).hostname.replace('www.', '');
      if (host === 'youtube.com' || host === 'youtu.be') return 'youtube';
      if (host === 'drive.google.com')                   return 'drive';
    } catch {}
    return null;
  },

  _addVideoLinkItem(url, type, previewEl) {
    const item = document.createElement('div');
    item.className        = 'preview-item preview-item--file';
    item.dataset.videoUrl  = url;
    item.dataset.videoType = type;

    const header = document.createElement('div');
    header.className = 'preview-item__file-header';

    const icon = document.createElement('span');
    icon.className   = 'preview-item__file-icon';
    icon.textContent = type === 'youtube' ? '▶️' : '🔗';

    const meta = document.createElement('div');
    meta.className = 'preview-item__file-meta';

    const nameEl = document.createElement('div');
    nameEl.className   = 'preview-item__filename';
    nameEl.textContent = type === 'youtube' ? 'YouTube' : 'Google Drive';

    const urlEl = document.createElement('div');
    urlEl.className   = 'preview-item__filesize';
    urlEl.textContent = url.length > 52 ? url.slice(0, 49) + '…' : url;

    meta.appendChild(nameEl);
    meta.appendChild(urlEl);
    header.appendChild(icon);
    header.appendChild(meta);
    item.appendChild(header);

    const status = document.createElement('div');
    status.className   = 'preview-item__status preview-item__status--done';
    status.textContent = '✅ Adicionado';
    item.appendChild(status);

    const actions = document.createElement('div');
    actions.className = 'preview-item__file-actions';
    const remBtn = document.createElement('button');
    remBtn.type        = 'button';
    remBtn.className   = 'preview-file-btn preview-file-btn--danger';
    remBtn.textContent = 'Remover';
    remBtn.addEventListener('click', () => {
      item.remove();
      previewEl.classList.toggle('has-files', previewEl.querySelectorAll('.preview-item').length > 0);
    });
    actions.appendChild(remBtn);
    item.appendChild(actions);

    previewEl.classList.add('has-files');
    previewEl.appendChild(item);
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

  // input id → { key in this.data, folder in Storage, multiple }
  _UPLOAD_DATA_MAP: {
    's2-logo-input':    { key: 'logoUrl',              folder: 'logo',    multiple: false },
    's2-photo-input':   { key: 'professionalPhotoUrl', folder: 'brand',   multiple: false },
    's2-team-input':    { key: 'teamPhotoUrls',        folder: 'team',    multiple: true  },
    's2-props-input':   { key: 'brandGalleryUrls',     folder: 'gallery', multiple: true  },
    'lm-buyer-input':   { key: 'buyerEbookUrl',        folder: 'ebooks',  multiple: false },
    'lm-seller-input':  { key: 'sellerEbookUrl',       folder: 'ebooks',  multiple: false },
  },

  // Count of uploads in-flight — submitForm waits for zero
  _pendingUploads: 0,

  _handleFiles(input, files, previewEl) {
    if (!previewEl) return;
    const maxFiles = parseInt(input.dataset.max) || 1;
    const existing = previewEl.querySelectorAll('.preview-item').length;
    const toAdd    = Math.min(files.length, maxFiles - existing);
    const mapping  = this._UPLOAD_DATA_MAP[input.id];
    const isSingle = maxFiles === 1;

    // Watch hidden spinner for _uploadToStorage completion signals
    const watchSpinner = (sp, onDone, onError) => {
      const obs = new MutationObserver(() => {
        if (sp.className === 'preview-done')  { obs.disconnect(); onDone(); }
        if (sp.className === 'preview-error') { obs.disconnect(); onError(); }
      });
      obs.observe(sp, { attributes: true, childList: true, characterData: true, subtree: true });
    };

    // Fake progress bar animation — resolves via watchSpinner
    const animateProgress = (bar) => {
      let pct = 0;
      return setInterval(() => {
        if (pct < 85) {
          pct = Math.min(85, pct + Math.random() * 10 + 2);
          bar.style.width = pct.toFixed(0) + '%';
        }
      }, 350);
    };

    for (let i = 0; i < toAdd; i++) {
      const file = files[i];
      const item = document.createElement('div');
      let spinner;
      let useIconRemove = true;

      if (file.type.startsWith('image/')) {
        // ── Image card with loading overlay ─────────────────────
        item.className = 'preview-item uploading';

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        item.appendChild(img);

        const overlay = document.createElement('div');
        overlay.className = 'preview-item__img-overlay preview-item__img-overlay--loading';
        const ring = document.createElement('div');
        ring.className = 'preview-spinner-ring';
        overlay.appendChild(ring);
        item.appendChild(overlay);

        spinner = document.createElement('span');
        spinner.style.display = 'none';
        item.appendChild(spinner);

        watchSpinner(spinner,
          () => {
            overlay.className = 'preview-item__img-overlay preview-item__img-overlay--done';
            overlay.innerHTML = '<span class="preview-item__img-badge">✓</span>';
            item.classList.remove('uploading');
            setTimeout(() => { overlay.style.opacity = '0'; overlay.style.transition = 'opacity .4s'; }, 2000);
          },
          () => {
            overlay.className = 'preview-item__img-overlay preview-item__img-overlay--error';
            overlay.innerHTML = '<span class="preview-item__img-badge">✗</span>';
            item.classList.remove('uploading');
            item.classList.add('upload-failed');
          }
        );

      } else {
        // ── Rich file card (PDF, generic) ────────────────────────
        useIconRemove = false;
        item.className = 'preview-item preview-item--file uploading';

        const fHeader = document.createElement('div');
        fHeader.className = 'preview-item__file-header';

        const fIcon = document.createElement('span');
        fIcon.className = 'preview-item__file-icon';
        fIcon.textContent = '📄';

        const fMeta = document.createElement('div');
        fMeta.className = 'preview-item__file-meta';

        const fName = document.createElement('div');
        fName.className = 'preview-item__filename';
        fName.textContent = file.name;

        const fSize = document.createElement('div');
        fSize.className = 'preview-item__filesize';
        fSize.textContent = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

        fMeta.appendChild(fName);
        fMeta.appendChild(fSize);
        fHeader.appendChild(fIcon);
        fHeader.appendChild(fMeta);
        item.appendChild(fHeader);

        const fTrack = document.createElement('div');
        fTrack.className = 'preview-progress';
        const fBar = document.createElement('div');
        fBar.className = 'preview-progress__bar';
        fTrack.appendChild(fBar);
        item.appendChild(fTrack);

        const fStatus = document.createElement('div');
        fStatus.className = 'preview-item__status';
        fStatus.textContent = '⏳ Enviando...';
        item.appendChild(fStatus);

        const fActions = document.createElement('div');
        fActions.className = 'preview-item__file-actions';

        if (isSingle) {
          const trocarBtn = document.createElement('button');
          trocarBtn.type = 'button';
          trocarBtn.className = 'preview-file-btn preview-file-btn--secondary';
          trocarBtn.textContent = 'Trocar arquivo';
          trocarBtn.addEventListener('click', () => {
            item.remove();
            previewEl.classList.toggle('has-files', previewEl.querySelectorAll('.preview-item').length > 0);
            input.value = '';
            input.click();
          });
          fActions.appendChild(trocarBtn);
        }

        const remBtn = document.createElement('button');
        remBtn.type = 'button';
        remBtn.className = 'preview-file-btn preview-file-btn--danger';
        remBtn.textContent = 'Remover';
        remBtn.addEventListener('click', () => {
          item.remove();
          previewEl.classList.toggle('has-files', previewEl.querySelectorAll('.preview-item').length > 0);
        });
        fActions.appendChild(remBtn);
        item.appendChild(fActions);

        spinner = document.createElement('span');
        spinner.style.display = 'none';
        item.appendChild(spinner);

        const fTicker = animateProgress(fBar);

        watchSpinner(spinner,
          () => {
            clearInterval(fTicker);
            fBar.style.width = '100%';
            fBar.classList.add('preview-progress__bar--done');
            fStatus.textContent = '✅ Enviado';
            fStatus.classList.add('preview-item__status--done');
            item.classList.remove('uploading');
          },
          () => {
            clearInterval(fTicker);
            fBar.classList.add('preview-progress__bar--error');
            fStatus.textContent = '✗ Falha no upload';
            fStatus.classList.add('preview-item__status--error');
            item.classList.remove('uploading');
            item.classList.add('upload-failed');
          }
        );
      }

      if (useIconRemove) {
        const rem = document.createElement('span');
        rem.className = 'preview-remove';
        rem.textContent = '×';
        rem.addEventListener('click', () => {
          item.remove();
          previewEl.classList.toggle('has-files', previewEl.querySelectorAll('.preview-item').length > 0);
        });
        item.appendChild(rem);
      }

      previewEl.appendChild(item);
      previewEl.classList.add('has-files');

      if (mapping) {
        this._uploadToStorage(file, mapping, item, spinner);
      }
    }
  },

  async _uploadToStorage(file, mapping, item, spinner) {
    this._pendingUploads++;
    try {
      const res = await fetch('/api/onboarding/upload-token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid:        this.data.uuid,
          folder:      mapping.folder,
          filename:    file.name,
          contentType: file.type,
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Erro ao obter token de upload');

      const uploadRes = await fetch(json.signedUrl, {
        method:  'PUT',
        headers: { 'Content-Type': file.type },
        body:    file,
      });

      if (!uploadRes.ok) throw new Error('Erro ao enviar arquivo para o storage (status ' + uploadRes.status + ')');

      // Store URL in this.data
      if (mapping.multiple) {
        if (!Array.isArray(this.data[mapping.key])) this.data[mapping.key] = [];
        this.data[mapping.key].push(json.publicUrl);
      } else {
        this.data[mapping.key] = json.publicUrl;
      }

      // Update logo preview in summary step
      if (mapping.key === 'logoUrl') {
        const logoEl = document.getElementById('summary-logo');
        if (logoEl) { logoEl.src = json.publicUrl; logoEl.style.display = 'block'; }
      }

      spinner.textContent = '✓';
      spinner.className = 'preview-done';
      item.classList.remove('uploading');

    } catch (err) {
      console.error('[upload]', err.message);
      spinner.textContent = '✗';
      spinner.className = 'preview-error';
      item.classList.remove('uploading');
      item.classList.add('upload-failed');
    } finally {
      this._pendingUploads--;
    }
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
        <div class="form-group form-group--full">
          <label class="form-label">${t('s7.testimonial') || 'Depoimento'}</label>
          <textarea class="form-textarea" name="ttext-${idx}" rows="3" placeholder="${t('s7.testimonial_ph') || ''}"></textarea>
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">Mídia do cliente</label>
          <div class="tmt-tabs">
            <button type="button" class="tmt-tab tmt-tab--active" data-tmtab="photo">📷 Foto</button>
            <button type="button" class="tmt-tab" data-tmtab="video">🎬 Vídeo do depoimento</button>
          </div>
          <div class="tmt-pane" data-tmcontent="photo">
            <div class="upload-zone" data-photo-zone="${idx}" style="min-height:90px">
              <div class="upload-icon">📷</div>
              <div class="upload-cta">${t('s2.upload_cta') || 'Arraste ou clique'}</div>
              <div class="upload-hint">${t('s7.photo_hint') || 'JPG ou PNG'}</div>
              <input type="file" accept="image/*" name="tphoto-${idx}">
            </div>
          </div>
          <div class="tmt-pane hidden-block" data-tmcontent="video">
            <input type="url" class="form-input" name="tvideo-${idx}" placeholder="YouTube ou Google Drive compartilhado">
            <p style="font-size:11px;color:var(--muted);margin-top:6px">ℹ️ Google Drive precisa estar compartilhado com <strong>"Qualquer pessoa com o link"</strong>.</p>
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

    // Tab switching: foto / vídeo
    card.querySelectorAll('.tmt-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        card.querySelectorAll('.tmt-tab').forEach(tb => tb.classList.remove('tmt-tab--active'));
        tab.classList.add('tmt-tab--active');
        card.querySelectorAll('.tmt-pane').forEach(pane => {
          pane.classList.toggle('hidden-block', pane.dataset.tmcontent !== tab.dataset.tmtab);
        });
      });
    });

    // Photo upload via Storage
    const fileInput = card.querySelector(`[name="tphoto-${idx}"]`);
    const zone = card.querySelector(`[data-photo-zone="${idx}"]`);
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      zone.innerHTML = `<img src="${previewUrl}" alt="Foto" style="max-height:80px;border-radius:50%;object-fit:cover;"><span class="preview-spinner">⏳</span>`;
      zone.dataset.photoUrl = '';

      this._pendingUploads++;
      fetch('/api/onboarding/upload-token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid:        this.data.uuid,
          folder:      'testimonials',
          filename:    file.name,
          contentType: file.type,
        }),
      })
        .then(r => r.json())
        .then(json => {
          if (!json.signedUrl) throw new Error(json.error || 'Token inválido');
          return fetch(json.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
            .then(up => {
              if (!up.ok) throw new Error('Falha no upload');
              zone.dataset.photoUrl = json.publicUrl;
              const sp = zone.querySelector('.preview-spinner');
              if (sp) { sp.textContent = '✓'; sp.className = 'preview-done'; }
            });
        })
        .catch(err => {
          console.error('[upload testimonial photo]', err.message);
          const sp = zone.querySelector('.preview-spinner');
          if (sp) { sp.textContent = '✗'; sp.className = 'preview-error'; }
        })
        .finally(() => { this._pendingUploads--; });
    });

    list.appendChild(card);

    const addBtn = document.getElementById('add-testimonial-btn');
    if (addBtn) addBtn.disabled = this._testimonialCount >= 5;
  },

  _collectTestimonials() {
    const result = [];
    document.querySelectorAll('#testimonials-list .rep-card').forEach(card => {
      const idx      = card.dataset.testimonial;
      const zone     = card.querySelector(`[data-photo-zone="${idx}"]`);
      const videoUrl = card.querySelector(`[name="tvideo-${idx}"]`)?.value?.trim() || '';
      result.push({
        name:      card.querySelector(`[name="tname-${idx}"]`)?.value?.trim() || '',
        text:      card.querySelector(`[name="ttext-${idx}"]`)?.value?.trim() || '',
        photoUrl:  zone?.dataset.photoUrl || '',
        videoUrl,
        videoType: videoUrl ? (this._detectVideoLinkType(videoUrl) || '') : '',
      });
    });
    return result;
  },

  // ── Build Summary (Step 8) ───────────────────────────────────────
  buildSummary() {
    this._collectStep(this.currentStep - 1); // collect previous step data

    // Identity
    const nameEl = document.getElementById('summary-name');
    const styleEl = document.getElementById('summary-style');
    const logoEl = document.getElementById('summary-logo');
    if (nameEl) nameEl.textContent = [this.data.fullName, this.data.businessName].filter(Boolean).join(' — ') || '—';
    if (styleEl) styleEl.textContent = this.data.stylePreference || '—';
    const logoSrc = this.data.logoUrl || this.data.logoDataUrl;
    if (logoEl && logoSrc) {
      logoEl.src = logoSrc;
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

    // Contact channels
    const channelLabelMap = { phone: 'Telefone', whatsapp: 'WhatsApp', email: 'Email', sms: 'SMS' };
    const ccEl = document.getElementById('summary-contact-channels');
    if (ccEl) {
      const channels = (this.data.contactChannels || []).map(c => channelLabelMap[c] || c);
      const parts = [...channels];
      if (this.data.businessHours) parts.push('Atendimento: ' + this.data.businessHours);
      ccEl.textContent = parts.join(' · ') || '—';
    }

    // Capture forms
    const captureFormLabels = {
      buyer_form:     'Consulta Comprador',
      seller_form:    'Avaliação Vendedor',
      newsletter:     'Boletim',
      ebook_download: 'Download Ebook',
    };
    const cfEl = document.getElementById('summary-capture-forms');
    if (cfEl) {
      const labels = (this.data.captureForms || []).map(f => captureFormLabels[f] || f);
      cfEl.textContent = labels.join(' · ') || '—';
    }

    // Testimonials
    const tEl = document.getElementById('summary-testimonials');
    const count = (this.data.testimonials || []).filter(t => t.name || t.text).length;
    if (tEl) tEl.textContent = count + ' ' + (i18n.t('s9.testimonials_count') || 'adicionados');
  },

  // ── Submit ───────────────────────────────────────────────────────
  _bindSubmit() {
    document.getElementById('submit-btn')?.addEventListener('click', () => this.submitForm());
  },

  async submitForm() {
    // Collect all remaining data
    for (let i = 1; i <= this.totalSteps; i++) this._collectStep(i);
    this.data.submittedAt = new Date().toISOString();

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = i18n.t('s9.submitting') || 'Enviando…';
    }

    // Wait for any in-flight file uploads before submitting
    if (this._pendingUploads > 0) {
      if (submitBtn) submitBtn.textContent = 'Aguardando uploads…';
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (this._pendingUploads <= 0) { clearInterval(interval); resolve(); }
        }, 300);
      });
      if (submitBtn) submitBtn.textContent = i18n.t('s9.submitting') || 'Enviando…';
    }

    const payload = {
      client_id:      this.data.clientId || null,
      testimonials:   this.data.testimonials   || [],
      social_links:   {
        website:   this.data.website,
        instagram: this.data.instagram,
        facebook:  this.data.facebook,
        linkedin:  this.data.linkedin,
        google:    this.data.googleUrl,
      },
      onboarding_data: this.data,
    };

    // ── Remover chaves base64 legadas que possam ter vindo do localStorage
    const BASE64_LEGACY_KEYS = [
      'logoDataUrl', 'professionalPhoto', 'teamPhotos', 'brandGallery',
      'videoUrls', 'buyerEbook', 'sellerEbook',
    ];
    if (payload.onboarding_data && typeof payload.onboarding_data === 'object') {
      BASE64_LEGACY_KEYS.forEach(function(k) { delete payload.onboarding_data[k]; });
    }

    // [DIAG] — remove após investigação
    (function diagPayload(obj) {
      const str = JSON.stringify(obj);
      console.log('[DIAG] método: POST');
      console.log('[DIAG] payload total:', (str.length / 1024).toFixed(1), 'KB');
      console.log('[DIAG] chaves do payload:', Object.keys(obj));
      var base64Found = false;
      function scan(v, path) {
        if (typeof v === 'string' && v.startsWith('data:')) {
          base64Found = true;
          console.warn('[DIAG] AINDA tem base64 em:', path, '—', (v.length / 1024).toFixed(1), 'KB');
        } else if (Array.isArray(v)) {
          v.forEach(function(el, i) { scan(el, path + '[' + i + ']'); });
        } else if (v && typeof v === 'object') {
          Object.keys(v).forEach(function(k) { scan(v[k], path ? path + '.' + k : k); });
        }
      }
      scan(obj, '');
      if (!base64Found) console.log('[DIAG] Nenhum base64 encontrado no payload. OK.');
    })(payload);

    try {
      const res = await fetch('/api/onboarding/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const json = await res.json();

      // [DIAG] — remove após investigação
      console.log('[ONBOARDING] resposta da API:', res.status, JSON.stringify(json));

      if (!res.ok) {
        throw new Error(json.error || 'Erro desconhecido');
      }

      localStorage.removeItem('lumi_onboarding_progress');
      this._showSuccess();

    } catch (err) {
      // [DIAG] — remove após investigação
      console.error('[ONBOARDING] erro no envio:', err.message);

      const errorMsg = document.getElementById('submit-error');
      if (errorMsg) {
        errorMsg.textContent = 'Não foi possível enviar suas informações. Tente novamente ou entre em contato com a equipe LUMI.';
        errorMsg.style.display = 'block';
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = i18n.t('s9.submit_btn') || 'Enviar para a equipe LUMI';
      }
    }
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
        const layout = document.getElementById('wizard-layout');
        if (layout) { layout.classList.remove('hidden'); layout.classList.add('visible'); }
        document.getElementById('step-indicator')?.classList.remove('hidden');
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

  // ── Sidebar Save ─────────────────────────────────────────────────
  _bindSidebarSave() {
    document.getElementById('sidebar-save-btn')?.addEventListener('click', () => this.saveProgress());
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
