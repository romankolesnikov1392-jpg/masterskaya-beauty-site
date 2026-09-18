const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = 'C:/Users/Admin/Desktop/показательный сайт';
const OUT = path.join(ROOT, 'assets/fonts');
fs.mkdirSync(OUT, { recursive: true });

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;800'
  + '&family=Onest:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@1,400;1,500&display=swap';

// Оставляем только те диапазоны, что реально нужны сайту на русском
const KEEP = ['cyrillic', 'latin'];

function get(url, bin = false, r = 0) {
  return new Promise((res, rej) => {
    const q = https.get(url, {
      headers: {
        // без Chrome-UA Google отдаёт ttf вместо woff2
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      }, timeout: 30000,
    }, (s) => {
      if ([301, 302, 307, 308].includes(s.statusCode) && s.headers.location && r < 4) {
        s.resume(); return res(get(s.headers.location, bin, r + 1));
      }
      if (s.statusCode !== 200) { s.resume(); return rej(new Error('HTTP ' + s.statusCode + ' ' + url)); }
      const c = [];
      s.on('data', (d) => c.push(d));
      s.on('end', () => res(bin ? Buffer.concat(c) : Buffer.concat(c).toString('utf8')));
    });
    q.on('timeout', () => q.destroy(new Error('timeout')));
    q.on('error', rej);
  });
}

(async () => {
  const css = await get(CSS_URL);
  const blocks = css.split('@font-face').slice(1);
  console.log('всего @font-face у Google:', blocks.length);

  const out = [];
  let total = 0, kept = 0;

  for (const raw of blocks) {
    const subset = (raw.match(/\/\*\s*([a-z-]+)\s*\*\//) || [])[1]
      || (css.slice(0, css.indexOf(raw)).match(/\/\*\s*([a-z-]+)\s*\*\/\s*$/) || [])[1];
    const fam = (raw.match(/font-family:\s*'([^']+)'/) || [])[1];
    const wght = (raw.match(/font-weight:\s*(\d+)/) || [])[1];
    const style = /font-style:\s*italic/.test(raw) ? 'italic' : 'normal';
    const url = (raw.match(/url\((https:\/\/[^)]+\.woff2)\)/) || [])[1];
    const range = (raw.match(/unicode-range:\s*([^;]+);/) || [])[1];
    if (!url || !fam) continue;

    if (!KEEP.includes(subset)) continue;

    const file = `${fam.replace(/\s+/g, '')}-${wght}${style === 'italic' ? 'i' : ''}-${subset}.woff2`;
    const buf = await get(url, true);
    fs.writeFileSync(path.join(OUT, file), buf);
    total += buf.length; kept++;

    out.push(`@font-face{font-family:'${fam}';font-style:${style};font-weight:${wght};`
      + `font-display:swap;src:url(assets/fonts/${file}) format('woff2');`
      + `unicode-range:${range.trim()}}`);
    console.log(`  ${file.padEnd(38)} ${String(Math.round(buf.length / 1024)).padStart(3)} КБ  (${subset})`);
  }

  fs.writeFileSync(path.join(ROOT, 'assets/fonts/fonts.css'), out.join('\n') + '\n', 'utf8');
  console.log(`\nсохранено ${kept} файлов, ${(total / 1024).toFixed(0)} КБ всего`);
  console.log('диапазоны отброшены:', blocks.length - kept, '(latin-ext, cyrillic-ext, vietnamese и т.п.)');
})();
