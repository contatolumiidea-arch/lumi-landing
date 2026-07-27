/**
 * Validates all translation JSON files and checks key parity across languages.
 * Run: node scripts/validate-i18n.js
 */

const fs   = require('fs');
const path = require('path');

const DIRS = [
  path.join(__dirname, '..', 'translations'),
  path.join(__dirname, '..', 'onboarding', 'translations'),
];
const LANGS = ['pt', 'en', 'es'];

let errors = 0;

function flatKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null ? flatKeys(v, full) : [full];
  });
}

DIRS.forEach(dir => {
  if (!fs.existsSync(dir)) return;

  const parsed = {};

  // 1 — Parse each file; report syntax errors immediately
  LANGS.forEach(lang => {
    const file = path.join(dir, `${lang}.json`);
    if (!fs.existsSync(file)) {
      console.error(`MISSING  ${path.relative(process.cwd(), file)}`);
      errors++;
      return;
    }
    try {
      parsed[lang] = JSON.parse(fs.readFileSync(file, 'utf8'));
      console.log(`OK       ${path.relative(process.cwd(), file)}`);
    } catch (e) {
      console.error(`INVALID  ${path.relative(process.cwd(), file)} — ${e.message}`);
      errors++;
    }
  });

  // 2 — Check key parity: every key in EN must exist in PT and ES
  const base = parsed['en'];
  if (!base) return;

  const baseKeys = flatKeys(base);

  ['pt', 'es'].forEach(lang => {
    if (!parsed[lang]) return;
    const langKeys = new Set(flatKeys(parsed[lang]));
    baseKeys.forEach(k => {
      if (!langKeys.has(k)) {
        console.warn(`MISSING_KEY [${lang}] ${k}`);
      }
    });
  });
});

if (errors > 0) {
  console.error(`\n${errors} error(s) found. Fix before deploying.`);
  process.exit(1);
} else {
  console.log('\nAll translation files are valid.');
}
