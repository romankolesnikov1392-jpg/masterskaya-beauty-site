const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/Admin/Desktop/показательный сайт';
const OUT = path.join(ROOT, 'assets/img');
fs.mkdirSync(OUT, { recursive: true });

const Q_WEBP = 78;   // ТЗ: 75–80
const Q_JPEG = 76;

// Что реально запрашивает страница. Ключ — итоговый slug в assets/img.
const JOBS = [
  // первый экран: полноширинный, нужен крупный размер
  { src: 'assets/photos/hero.jpg', slug: 'hero', widths: [640, 1024, 1600] },

  // карточки мастеров и фото вкладок прайса
  ...['work-02', 'work-05', 'work-06', 'work-07', 'work-09', 'work-13', 'work-15', 'video-1']
    .map((n) => ({ src: `assets/photos/${n}-950.jpg`, slug: n, widths: [400, 700, 1100] })),

  // галерея: плитка + открытие в лайтбоксе
  ...Array.from({ length: 16 }, (_, i) => {
    const n = 'work-' + String(i + 1).padStart(2, '0');
    return { src: `assets/gallery/${n}.jpg`, slug: 'g-' + n, widths: [400, 800, 1600] };
  }),
  { src: 'assets/gallery/video-02.jpg', slug: 'g-video-02', widths: [400, 800, 1600] },

  // логотип
  { src: 'assets/brand/logo.jpg', slug: 'logo', widths: [128, 256] },
];

(async () => {
  let inBytes = 0, outBytes = 0, made = 0;
  const manifest = {};

  for (const j of JOBS) {
    const abs = path.join(ROOT, j.src);
    if (!fs.existsSync(abs)) { console.log(`  ПРОПУСК (нет файла): ${j.src}`); continue; }

    const srcBuf = fs.readFileSync(abs);
    inBytes += srcBuf.length;
    const meta = await sharp(srcBuf).metadata();

    const cap = Math.min(meta.width, 1600);
    const widths = [...new Set([...j.widths, cap])].filter((w) => w <= meta.width).sort((a,b)=>a-b);
    if (!widths.length) widths.push(meta.width);

    const entry = { w: meta.width, h: meta.height, webp: [], jpg: null };

    for (const w of widths) {
      const pipe = sharp(srcBuf).resize({ width: w, withoutEnlargement: true });
      const webp = await pipe.clone().webp({ quality: Q_WEBP, effort: 5 }).toBuffer();
      const file = `${j.slug}-${w}.webp`;
      fs.writeFileSync(path.join(OUT, file), webp);
      outBytes += webp.length; made++;
      entry.webp.push({ w, file, kb: Math.round(webp.length / 1024) });
    }

    // один JPEG-фоллбэк на средний размер — для старых браузеров
    const fbW = widths[Math.min(1, widths.length - 1)];
    const jpg = await sharp(srcBuf).resize({ width: fbW, withoutEnlargement: true })
      .jpeg({ quality: Q_JPEG, mozjpeg: true }).toBuffer();
    const fbFile = `${j.slug}-${fbW}.jpg`;
    fs.writeFileSync(path.join(OUT, fbFile), jpg);
    outBytes += jpg.length; made++;
    entry.jpg = { w: fbW, file: fbFile, kb: Math.round(jpg.length / 1024) };

    manifest[j.slug] = entry;
    const was = Math.round(srcBuf.length / 1024);
    const now = entry.webp[entry.webp.length - 1].kb;
    console.log(`  ${j.slug.padEnd(12)} ${meta.width}×${meta.height}  было ${String(was).padStart(4)} КБ → webp ${String(now).padStart(4)} КБ  (${entry.webp.map((x) => x.w).join('/')})`);
  }

  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1), 'utf8');
  console.log(`\nфайлов создано: ${made}`);
  console.log(`исходники: ${(inBytes / 1048576).toFixed(1)} МБ  →  результат: ${(outBytes / 1048576).toFixed(1)} МБ`);
})();
