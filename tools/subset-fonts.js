const fs = require('fs');
const path = require('path');
const subsetFont = require('subset-font');

const ROOT = 'C:/Users/Admin/Desktop/показательный сайт';
const DIR = path.join(ROOT, 'assets/fonts');

// Латиница на сайте нужна только под цифры, пунктуацию и редкие слова
// (WhatsApp, Telegram, Max, Wi-Fi, QR, air touch, Label, Yuliya Panchenko).
const LATIN =
  '0123456789' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'abcdefghijklmnopqrstuvwxyz' +
  ' .,:;!?—–-«»""\'()[]/+&@#№%₽·…*';

// Кириллицу не трогаем: у Unbounded она 2 КБ, у Onest 10 КБ — там резать нечего,
// а случайный пропущенный глиф сломал бы текст.
(async () => {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('-latin.woff2'));
  let was = 0, now = 0;

  for (const f of files) {
    const abs = path.join(DIR, f);
    const buf = fs.readFileSync(abs);
    try {
      const out = await subsetFont(buf, LATIN, { targetFormat: 'woff2' });
      fs.writeFileSync(abs, out);
      was += buf.length; now += out.length;
      console.log(`  ${f.padEnd(38)} ${String(Math.round(buf.length / 1024)).padStart(3)} → ${String(Math.round(out.length / 1024)).padStart(3)} КБ`);
    } catch (e) {
      console.log(`  ${f}: ПРОПУСК (${e.message})`);
    }
  }
  console.log(`\nлатиница: ${(was / 1024).toFixed(0)} КБ → ${(now / 1024).toFixed(0)} КБ`);

  const all = fs.readdirSync(DIR).filter((f) => f.endsWith('.woff2'))
    .reduce((s, f) => s + fs.statSync(path.join(DIR, f)).size, 0);
  console.log(`все шрифты вместе: ${(all / 1024).toFixed(0)} КБ`);
})();
