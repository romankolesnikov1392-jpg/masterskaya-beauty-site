const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/Admin/Desktop/показательный сайт';
const r = (f) => path.join(ROOT, f);
const kb = (n) => (n / 1024).toFixed(1) + ' КБ';

// Критический CSS — всё до секции «Маршрут»: токены, сброс, курсор,
// кнопки, навигация, плавающие кнопки, рваные края и первый экран.
const CRITICAL_UNTIL = 553;

(async () => {
  const css = fs.readFileSync(r('styles.css'), 'utf8');
  const critSrc = css.split('\n').slice(0, CRITICAL_UNTIL).join('\n');

  const full = await esbuild.transform(css, { loader: 'css', minify: true });
  const crit = await esbuild.transform(critSrc, { loader: 'css', minify: true });
  fs.writeFileSync(r('styles.min.css'), full.code, 'utf8');
  fs.writeFileSync(r('assets/critical.css'), crit.code, 'utf8');

  const js = fs.readFileSync(r('script.js'), 'utf8');
  const jsMin = await esbuild.transform(js, { loader: 'js', minify: true, target: 'es2017' });
  fs.writeFileSync(r('script.min.js'), jsMin.code, 'utf8');

  const rough = fs.readFileSync(r('assets/vendor/rough.js'), 'utf8');
  const roughMin = await esbuild.transform(rough, { loader: 'js', minify: true, target: 'es2017' });
  fs.writeFileSync(r('assets/vendor/rough.min.js'), roughMin.code, 'utf8');

  console.log('  styles.css      ' + kb(css.length) + ' → styles.min.css ' + kb(full.code.length));
  console.log('  критический CSS ' + kb(crit.code.length) + ' (инлайном в head)');
  console.log('  script.js       ' + kb(js.length) + ' → script.min.js  ' + kb(jsMin.code.length));
  console.log('  rough.js        ' + kb(rough.length) + ' → rough.min.js  ' + kb(roughMin.code.length));
})();
