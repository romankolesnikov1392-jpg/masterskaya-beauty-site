/* ============================================================
   Мастерская по созданию красоты — интерактив
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Картинки: webp + размеры ----------
     Карта собрана скриптом из assets/img/manifest.json.
     w — доступные ширины webp, n — родные размеры (для width/height),
     f — ширина jpg-фоллбэка для старых браузеров. */
  var IMG = {"hero":{"w":[640,1024,1440],"n":[1440,1920],"f":1024},"work-02":{"w":[400,700,950],"n":[950,633],"f":700},"work-05":{"w":[400,700,950],"n":[950,633],"f":700},"work-06":{"w":[400,700,950],"n":[950,633],"f":700},"work-07":{"w":[400,700,950],"n":[950,633],"f":700},"work-09":{"w":[400,700,950],"n":[950,633],"f":700},"work-13":{"w":[400,700,950],"n":[950,633],"f":700},"work-15":{"w":[400,700,950],"n":[950,633],"f":700},"video-1":{"w":[400,700,950],"n":[950,633],"f":700},"g-work-01":{"w":[400,800,1440],"n":[1440,1920],"f":800},"g-work-02":{"w":[400,720],"n":[720,1280],"f":720},"g-work-03":{"w":[400,800,1080],"n":[1080,1349],"f":800},"g-work-04":{"w":[400,800,1440],"n":[1440,1920],"f":800},"g-work-05":{"w":[400,800,1080],"n":[1080,1350],"f":800},"g-work-06":{"w":[400,800,1440],"n":[1440,1920],"f":800},"g-work-07":{"w":[400,800,1280],"n":[1280,1280],"f":800},"g-work-08":{"w":[400,800,1440],"n":[1440,1920],"f":800},"g-work-09":{"w":[400,800,1440],"n":[1440,1920],"f":800},"g-work-10":{"w":[400,800,1440],"n":[1440,1920],"f":800},"g-work-11":{"w":[400,800,1242],"n":[1242,1522],"f":800},"g-work-12":{"w":[400,800,1440],"n":[1440,2560],"f":800},"g-work-13":{"w":[400,800,1440],"n":[1440,1920],"f":800},"g-work-14":{"w":[400,800,1440],"n":[1440,1088],"f":800},"g-work-15":{"w":[400,800,1440],"n":[1440,1920],"f":800},"g-work-16":{"w":[400,800,1440],"n":[1440,1920],"f":800},"g-video-02":{"w":[400,800,1440],"n":[1440,2559],"f":800},"logo":{"w":[128,256,320],"n":[320,320],"f":256}};

  function imgSrcset(slug) {
    return IMG[slug].w.map(function (w) { return 'assets/img/' + slug + '-' + w + '.webp ' + w + 'w'; }).join(', ');
  }
  function imgFallback(slug) { return 'assets/img/' + slug + '-' + IMG[slug].f + '.jpg'; }
  function imgBiggest(slug) {
    var ws = IMG[slug].w;
    return 'assets/img/' + slug + '-' + ws[ws.length - 1] + '.webp';
  }

  // Рисование rough.js — тяжёлая синхронная работа, а все рисунки лежат ниже
  // первого экрана. requestIdleCallback тут не годится: он сваливает всё в одну
  // длинную задачу. Рисуем ровно тогда, когда блок подходит к экрану.
  // rough.js весит 27 КБ и нужен только для рисунков ниже первого экрана —
  // подгружаем его при первой надобности, а не на старте.
  var roughReady = null;
  function loadRough() {
    if (roughReady) return roughReady;
    roughReady = new Promise(function (res) {
      if (window.rough) return res();
      var el = document.createElement('script');
      el.src = 'assets/vendor/rough.min.js?v=10';
      el.onload = res;
      el.onerror = function () { res(); };
      document.head.appendChild(el);
    });
    return roughReady;
  }

  function whenNear(sel, fn) {
    var el = document.querySelector(sel);
    if (!el) return;
    if (!('IntersectionObserver' in window)) return fn();
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      fn();
    }, { rootMargin: '400px' });
    io.observe(el);
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Видео на первом экране ----------
     2ГИС отдаёт только превью-картинки, mp4 закрыты (проверено: 404).
     Положите ролик студии в assets/ и впишите путь ниже — фото станет
     постером, а видео подхватится само. Пустая строка = остаётся фото. */
  var HERO_VIDEO = '';

  (function heroVideo() {
    if (!HERO_VIDEO || reduced) return;
    var media = document.querySelector('.hero__media');
    var poster = media && media.querySelector('img');
    if (!poster) return;

    var v = document.createElement('video');
    v.src = HERO_VIDEO;
    v.poster = poster.currentSrc || poster.src;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.autoplay = true;
    v.preload = 'auto';
    v.setAttribute('aria-hidden', 'true');

    // Картинку убираем только когда пошли реальные кадры, иначе на медленной
    // сети первый экран моргнёт пустотой.
    v.addEventListener('loadeddata', function () { poster.hidden = true; });
    v.addEventListener('error', function () { v.remove(); poster.hidden = false; });

    media.appendChild(v);
    var play = v.play();
    if (play && play.catch) play.catch(function () {});
  })();

  /* ---------- Галерея работ ----------

     Файлы кладутся в assets/gallery/ ровно с этими именами — править код
     не нужно. Формат: один .jpg на позицию, без суффиксов размера.
     Справа — номер фото в полном альбоме 2ГИС (65 шт):
     https://2gis.ru/omsk/gallery/firm/70000001047108090

       work-01.jpg → №29      work-07.jpg → №4      work-13.jpg → №16  (ПК)
       work-02.jpg → №3       work-08.jpg → №6      work-14.jpg → №57 (ПК)
       work-03.jpg → №26      work-09.jpg → №7      work-15.jpg → №43 (ПК)
       work-04.jpg → №5       work-10.jpg → №8      work-16.jpg → №9  (ПК)
       work-05.jpg → №23      work-11.jpg → №15     video-02.jpg → видео №2 (ПК)
       work-06.jpg → №32      work-12.jpg → №17

     На мобильном показываются первые 12, остальные 5 помечены desktopOnly. */

  // alt — что реально на фото: его читают скринридеры и поисковики.
  var GALLERY = [
    { f: 'work-01', alt: 'Мастер накручивает крупные локоны плойкой' },
    { f: 'work-02', alt: 'Гладкие длинные волосы после окрашивания в медно-рыжий' },
    { f: 'work-03', alt: 'Светлые объёмные локоны после окрашивания и укладки' },
    { f: 'work-04', alt: 'Длинные светлые волосы, уложенные локонами, в кресле мастера' },
    { f: 'work-05', alt: 'Пепельный блонд на длинных прямых волосах' },
    { f: 'work-06', alt: 'Гостья студии с блонд-каре после стрижки' },
    { f: 'work-07', alt: 'Вечерний макияж и гладкая укладка — работа визажиста' },
    { f: 'work-08', alt: 'Пепельные волны после окрашивания и укладки' },
    { f: 'work-09', alt: 'Многослойная стрижка на светлых волосах' },
    { f: 'work-10', alt: 'Холодный серебристо-лиловый оттенок на волнистых волосах' },
    { f: 'work-11', alt: 'Платиновый блонд после осветления' },
    { f: 'work-12', alt: 'Плавная растяжка цвета от тёмных корней к светлому блонду' },
    { f: 'work-13', alt: 'Ламинирование ресниц — результат крупным планом', desktopOnly: true },
    { f: 'work-14', alt: 'Длинные волосы до и после осветления', desktopOnly: true },
    { f: 'work-15', alt: 'Собранная вечерняя причёска с локонами у лица', desktopOnly: true },
    { f: 'work-16', alt: 'Объёмная коса с вплетённой лентой', desktopOnly: true },
    { f: 'video-02', alt: 'Кадр из видео о студии', desktopOnly: true, isVideo: true }
  ];

  var GAL_SIZES = '(max-width:860px) 76vw, 25vw';
  var GIS_GALLERY = 'https://2gis.ru/omsk/gallery/firm/70000001047108090';

  var gal = document.getElementById('gal');
  var lbItems = [];

  if (gal) {
    var frag = document.createDocumentFragment();

    GALLERY.forEach(function (p, i) {
      var cap = p.alt;

      var el;
      if (p.isVideo) {
        el = document.createElement('a');
        el.href = GIS_GALLERY;
        el.target = '_blank';
        el.rel = 'noopener';
      } else {
        el = document.createElement('button');
        el.type = 'button';
        el.dataset.i = String(i);
      }
      el.className = 'gitem' + (p.desktopOnly ? ' gitem--desktop' : '');
      el.setAttribute('aria-label', p.isVideo ? 'Смотреть видео студии на 2ГИС' : 'Открыть фото: ' + cap);

      var slug = 'g-' + p.f;
      var picture = document.createElement('picture');
      var source = document.createElement('source');
      source.type = 'image/webp';
      source.srcset = imgSrcset(slug);
      source.sizes = GAL_SIZES;
      picture.appendChild(source);

      var img = document.createElement('img');
      img.src = imgFallback(slug);
      img.alt = cap;
      img.width = IMG[slug].n[0];
      img.height = IMG[slug].n[1];
      // Галерея всегда ниже первого экрана — грузим только лениво,
      // иначе декодирование картинок отъедает главный поток на старте.
      img.loading = 'lazy';
      img.decoding = 'async';
      // Пока файла нет — плитка честно говорит об этом, а не висит пустой
      img.addEventListener('error', function () {
        el.classList.add('is-missing');
        el.setAttribute('data-missing', p.f + '.jpg');
      });
      picture.appendChild(img);
      el.appendChild(picture);

      if (p.isVideo) {
        el.insertAdjacentHTML('beforeend',
          '<span class="gitem__badge">Видео</span>' +
          '<span class="gitem__play"><span>' +
          '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
          '</span></span>');
      }

      frag.appendChild(el);
      lbItems.push({ src: imgBiggest(slug), fallback: imgFallback(slug), cap: cap, el: el });
    });

    gal.appendChild(frag);
  }

  /* ---------- «Полная галерея»: раскрыть все фото ---------- */

  var galAll = document.getElementById('gal-all');
  if (galAll && gal) {
    galAll.addEventListener('click', function () {
      var open = gal.classList.toggle('is-all');
      galAll.textContent = open ? 'Свернуть галерею' : 'Полная галерея';
      if (!open) gal.scrollLeft = 0;
    });
  }

  /* ---------- Появление при скролле ---------- */

  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(function (el) {
      var d = el.dataset.d;
      if (d) el.style.setProperty('--d', d);
      io.observe(el);
    });
    document.querySelectorAll('.gitem, .plate').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal, .gitem, .plate').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Рисунки мастерской, набросанные от руки ---------- */

  var FIGS = {
    chair: {
      p: ['M30 62 L34 22 Q35 15 43 15 L77 15 Q85 15 86 22 L90 62',
          'M24 62 L96 62 L92 79 L28 79 Z',
          'M24 62 L17 75', 'M96 62 L103 75',
          'M60 79 L60 100', 'M37 107 Q60 96 83 107']
    },
    scissors: {
      p: ['M36 84 L92 17', 'M84 84 L28 17'],
      c: [[30, 94, 26], [90, 94, 26], [60, 52, 7]]
    },
    cup: {
      p: ['M26 46 L32 92 Q33 102 43 102 L75 102 Q85 102 86 92 L92 46 Z',
          'M89 58 Q106 58 106 70 Q106 82 87 82',
          'M18 110 L102 110',
          'M48 34 Q54 26 48 17', 'M63 36 Q69 26 63 15', 'M78 34 Q84 26 78 17']
    },
    mirror: {
      p: ['M43 32 Q50 24 60 23', 'M58 83 L58 99', 'M36 106 Q58 97 80 106',
          'M97 20 L97 33', 'M90.5 26.5 L103.5 26.5',
          'M22 82 L22 91', 'M17.5 86.5 L26.5 86.5'],
      e: [[58, 48, 58, 70]]
    }
  };

  function svgEl(viewBox) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', viewBox);
    s.setAttribute('fill', 'none');
    return s;
  }

  whenNear('#why', function () { loadRough().then(function () {
    document.querySelectorAll('.plate[data-fig]').forEach(function (plate, n) {
      var fig = FIGS[plate.dataset.fig];
      var host = plate.querySelector('.plate__fig');
      if (!fig || !host) return;

      var s = svgEl('0 0 120 120');
      var rc = rough.svg(s);
      var opt = { stroke: 'currentColor', strokeWidth: 1.9, roughness: 1.9, bowing: 1.7, seed: 5 + n * 13 };

      (fig.p || []).forEach(function (d) { s.appendChild(rc.path(d, opt)); });
      (fig.c || []).forEach(function (c) { s.appendChild(rc.circle(c[0], c[1], c[2], opt)); });
      (fig.e || []).forEach(function (e) { s.appendChild(rc.ellipse(e[0], e[1], e[2], e[3], opt)); });

      host.appendChild(s);
    });

    // рукописная обводка ключевых слов в заголовке
    var mark = document.querySelector('.whead__h .mark');
    if (mark) {
      var ms = svgEl('0 0 200 60');
      ms.setAttribute('preserveAspectRatio', 'none');
      ms.appendChild(rough.svg(ms).ellipse(100, 30, 193, 51, {
        stroke: 'currentColor', strokeWidth: 1.7, roughness: 2.7, bowing: 1.5, seed: 88
      }));
      mark.appendChild(ms);
    }
    // Сначала читаем все длины, потом пишем. Чередование чтения и записи
    // заставляет браузер пересчитывать layout на каждой итерации.
    var paths = [];
    document.querySelectorAll('.plate__fig').forEach(function (host) {
      host.querySelectorAll('path').forEach(function (p, i) {
        var len = 600;
        try { len = Math.ceil(p.getTotalLength()) + 2; } catch (e) {}
        paths.push([p, len, i]);
      });
    });
    paths.forEach(function (x) {
      x[0].style.setProperty('--len', x[1]);
      x[0].style.setProperty('--i', x[2]);
    });
  }); });

  /* ---------- Маршрут: лоток с инструментами вместо иконок ---------- */

  FIGS.comb = {
    p: ['M14 40 L106 40 L106 57 L14 57 Z',
        'M22 57 L22 84', 'M32 57 L32 84', 'M42 57 L42 84', 'M52 57 L52 84',
        'M62 57 L62 84', 'M72 57 L72 84', 'M82 57 L82 84', 'M92 57 L92 84',
        'M100 57 L100 84']
  };

  function roughFig(name, seed) {
    var f = FIGS[name];
    var s = svgEl('0 0 120 120');
    var rc = rough.svg(s);
    var o = { stroke: 'currentColor', strokeWidth: 2, roughness: 1.9, bowing: 1.6, seed: seed };
    (f.p || []).forEach(function (d) { s.appendChild(rc.path(d, o)); });
    (f.c || []).forEach(function (c) { s.appendChild(rc.circle(c[0], c[1], c[2], o)); });
    (f.e || []).forEach(function (e) { s.appendChild(rc.ellipse(e[0], e[1], e[2], e[3], o)); });
    return s;
  }

  var tools = document.querySelector('.route__tools');
  var trayHost = document.querySelector('.route__tray');

  if (window.rough && tools) {
    tools.appendChild(roughFig('scissors', 61));
    tools.appendChild(roughFig('comb', 73));
  }

  // Лоток рисуется по замеренному размеру контейнера, а не растягивается из
  // фиксированного viewBox — иначе дрожание линии сплющивается по горизонтали.
  function drawTray() {
    if (!window.rough || !trayHost) return;
    var box = trayHost.parentElement;
    var w = Math.round(box.clientWidth);
    var h = Math.round(box.clientHeight);
    if (!w || !h) return;

    var s = svgEl('0 0 ' + w + ' ' + h);
    var rc = rough.svg(s);

    if (w > 860) {
      // Десктоп: рамка лотка с двумя перегородками
      var o = { stroke: 'currentColor', strokeWidth: 2, roughness: 2.3, bowing: 1.3, seed: 23 };
      s.appendChild(rc.rectangle(3, 3, w - 6, h - 6, o));
      var t = (w - 6) / 3;
      s.appendChild(rc.line(3 + t, 28, 3 + t, h - 28, o));
      s.appendChild(rc.line(3 + t * 2, 28, 3 + t * 2, h - 28, o));
    } else {
      // Мобильный: шаги идут столбиком по кирпичной стене, между ними черта «мелом».
      // Позиции берём из реальной геометрии шагов, иначе линии разъедутся.
      // bowing держим низким: мел кладётся неровно, но линия всё же прямая,
      // при больших значениях rough.js рисует двойную дугу — выходит «линза».
      var lis = box.querySelectorAll('.route__steps li');
      var bx = box.getBoundingClientRect();
      for (var i = 0; i < lis.length - 1; i++) {
        // свой seed на каждую черту, иначе обе дрожат одинаково
        var chalk = { stroke: 'rgba(255,255,255,.5)', strokeWidth: 2.2, roughness: 1.6, bowing: 0.4, seed: 47 + i * 19 };
        var y = Math.round(lis[i].getBoundingClientRect().bottom - bx.top + 15);
        s.appendChild(rc.line(26, y, w - 26, y + 2, chalk));
      }
    }
    trayHost.replaceChildren(s);
  }

  // Рамки карточек «почему к нам» — тоже по замеренному размеру
  function drawFrames() {
    if (!window.rough) return;
    document.querySelectorAll('.plate__frame').forEach(function (host, n) {
      var w = Math.round(host.clientWidth);
      var h = Math.round(host.clientHeight);
      if (!w || !h) return;
      var s = svgEl('0 0 ' + w + ' ' + h);
      var rc = rough.svg(s);
      s.appendChild(rc.rectangle(2, 2, w - 4, h - 4, {
        stroke: 'currentColor', strokeWidth: 1.6, roughness: 2.4, bowing: 1.1, seed: 101 + n * 17
      }));
      host.replaceChildren(s);
    });
  }

  function redrawSketches() { drawTray(); drawFrames(); }

  whenNear('#trust', function () { loadRough().then(drawTray); });
  whenNear('#why', function () { loadRough().then(drawFrames); });

  var sketchTimer;
  window.addEventListener('resize', function () {
    clearTimeout(sketchTimer);
    sketchTimer = setTimeout(redrawSketches, 180);
  });

  /* ---------- Счётчики ---------- */

  if (io && !reduced) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target;
        var to = parseInt(el.dataset.count, 10);
        var t0 = performance.now();
        (function step(now) {
          var k = Math.min((now - t0) / 1100, 1);
          var eased = 1 - Math.pow(1 - k, 3);
          el.textContent = String(Math.round(to * eased));
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Шапка ---------- */

  var nav = document.getElementById('nav');
  var hero = document.getElementById('top');

  function onScroll() {
    var trigger = hero ? hero.offsetHeight - 90 : 90;
    nav.classList.toggle('is-stuck', window.scrollY > trigger);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Мобильное меню ---------- */

  var burger = document.getElementById('burger');
  var mobmenu = document.getElementById('mobmenu');

  function closeMenu() {
    if (mobmenu.hidden) return;
    mobmenu.classList.remove('is-in');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    setTimeout(function () { mobmenu.hidden = true; }, 340);
  }

  function openMenu() {
    mobmenu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      mobmenu.classList.add('is-in');
      mobmenu.querySelectorAll('nav a').forEach(function (a, i) {
        a.style.transitionDelay = (60 + i * 45) + 'ms';
      });
    });
  }

  burger.addEventListener('click', function () {
    mobmenu.hidden ? openMenu() : closeMenu();
  });
  mobmenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  /* ---------- Прайс: пилюли + фото под активную категорию ---------- */

  var pills = document.querySelector('.pills');

  if (pills) {
    var tabs = Array.prototype.slice.call(pills.querySelectorAll('.pill'));
    var svcMedia = document.querySelector('.svc__media');
    var svcImg = document.getElementById('svc-img');

    function swapPhoto(tab) {
      if (!svcImg || !svcMedia) return;
      var slug = tab.dataset.photo;
      if (!IMG[slug]) return;
      var next = imgFallback(slug);
      if (svcImg.getAttribute('src') === next) return;
      var svcSrc = svcMedia.querySelector('source');

      // Подгружаем заранее и меняем только после загрузки, иначе на месте
      // фото мелькает пустой блок.
      var pre = new Image();
      pre.onload = function () {
        if (svcSrc) svcSrc.srcset = imgSrcset(slug);
        svcImg.src = next;
        svcImg.alt = tab.dataset.alt || '';
        svcMedia.classList.remove('is-swap');
      };
      pre.onerror = function () { svcMedia.classList.remove('is-swap'); };
      svcMedia.classList.add('is-swap');
      pre.src = next;
    }

    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) {
          panel.hidden = !on;
          panel.classList.toggle('is-on', on);
        }
      });
      swapPhoto(tab);
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(t);
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (!next) return;
        e.preventDefault();
        next.focus();
        select(next);
      });
    });
  }

  /* ---------- Отзывы: слайдер и «читать дальше» ---------- */

  var revTrack = document.getElementById('revTrack');

  if (revTrack) {
    var revPrev = document.getElementById('rev-prev');
    var revNext = document.getElementById('rev-next');

    function revStep(dir) {
      var card = revTrack.querySelector('.rev');
      if (!card) return;
      var gap = parseFloat(getComputedStyle(revTrack).columnGap) || 18;
      revTrack.scrollBy({
        left: dir * (card.getBoundingClientRect().width + gap),
        behavior: reduced ? 'auto' : 'smooth'
      });
    }

    function revArrows() {
      var max = revTrack.scrollWidth - revTrack.clientWidth - 2;
      revPrev.disabled = revTrack.scrollLeft <= 2;
      revNext.disabled = revTrack.scrollLeft >= max;
    }

    revPrev.addEventListener('click', function () { revStep(-1); });
    revNext.addEventListener('click', function () { revStep(1); });
    revTrack.addEventListener('scroll', revArrows, { passive: true });
    window.addEventListener('resize', revArrows);
    revArrows();

    revTrack.querySelectorAll('.rev').forEach(function (card) {
      var more = card.querySelector('.rev__more');
      if (!more) return;
      more.addEventListener('click', function () {
        var open = card.classList.toggle('is-open');
        more.textContent = open ? 'Свернуть' : 'Читать дальше';
        revArrows();
      });
    });

    // Кнопку показываем только там, где текст реально обрезан. Считать нужно
    // после загрузки шрифтов — до неё высота строки другая и короткие отзывы
    // ошибочно считаются обрезанными.
    function revClamp() {
      revTrack.querySelectorAll('.rev').forEach(function (card) {
        var text = card.querySelector('.rev__text');
        var more = card.querySelector('.rev__more');
        if (!text || !more || card.classList.contains('is-open')) return;
        more.hidden = text.scrollHeight <= text.clientHeight + 2;
      });
    }
    revClamp();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(revClamp);
    window.addEventListener('resize', revClamp);
  }

  /* ---------- Онлайн-запись: виджет YCLIENTS ---------- */

  // Виджет тянет свой скрипт и стили, поэтому рамку создаём только при первом
  // открытии — до нажатия кнопки страница о нём ничего не знает.
  var book = document.getElementById('book');
  var bookFrame = document.getElementById('book-frame');
  var bookFocus = null;
  var bookMade = false;

  function openBook() {
    bookFocus = document.activeElement;
    book.hidden = false;
    document.body.style.overflow = 'hidden';

    if (!bookMade) {
      bookMade = true;
      var fr = document.createElement('iframe');
      fr.title = 'Онлайн-запись в студию';
      fr.setAttribute('allow', 'clipboard-write');
      fr.addEventListener('load', function () { book.classList.add('is-ready'); });
      fr.src = document.querySelector('.book__out').href;
      bookFrame.appendChild(fr);
    }

    requestAnimationFrame(function () { book.classList.add('is-in'); });
    document.getElementById('book-x').focus();
  }

  function closeBook() {
    book.classList.remove('is-in');
    document.body.style.overflow = '';
    setTimeout(function () { book.hidden = true; }, 300);
    if (bookFocus) bookFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-book]');
    if (!t) return;
    e.preventDefault();
    if (!mobmenu.hidden) closeMenu();
    openBook();
  });

  document.getElementById('book-x').addEventListener('click', closeBook);
  book.addEventListener('click', function (e) { if (e.target === book) closeBook(); });

  /* ---------- Лайтбокс ---------- */

  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  var lbCap = document.getElementById('lb-cap');
  var idx = 0;
  var lastFocus = null;

  // На мобильном часть плиток скрыта (только для ПК) — стрелки их пропускают,
  // иначе в лайтбоксе всплывёт фото, которого в мобильной галерее нет.
  function visible(i) {
    var el = lbItems[i] && lbItems[i].el;
    return !!el && el.offsetParent !== null;
  }
  function seek(from, dir) {
    var n = lbItems.length;
    for (var k = 1; k <= n; k++) {
      var i = ((from + dir * k) % n + n) % n;
      if (visible(i)) return i;
    }
    return from;
  }

  function show(i) {
    idx = (i + lbItems.length) % lbItems.length;
    var it = lbItems[idx];
    lbImg.onerror = function () {
      lbImg.onerror = null;
      if (lbImg.src !== it.fallback) lbImg.src = it.fallback;
    };
    lbImg.src = it.src;
    lbImg.alt = it.cap;
    lbCap.textContent = it.cap + ' · ' + (idx + 1) + ' из ' + lbItems.length;
  }

  function openLb(i) {
    lastFocus = document.activeElement;
    lb.hidden = false;
    show(i);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { lb.classList.add('is-in'); });
    document.getElementById('lb-x').focus();
  }

  function closeLb() {
    lb.classList.remove('is-in');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; }, 300);
    if (lastFocus) lastFocus.focus();
  }

  if (gal) {
    gal.addEventListener('click', function (e) {
      var b = e.target.closest('.gitem');
      if (!b || b.tagName === 'A' || !b.dataset.i) return;
      openLb(parseInt(b.dataset.i, 10));
    });
  }

  document.getElementById('lb-x').addEventListener('click', closeLb);
  document.getElementById('lb-p').addEventListener('click', function () { show(seek(idx, -1)); });
  document.getElementById('lb-n').addEventListener('click', function () { show(seek(idx, 1)); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', function (e) {
    if (!book.hidden) {
      if (e.key === 'Escape') closeBook();
      return;
    }
    if (!lb.hidden) {
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(seek(idx, -1));
      if (e.key === 'ArrowRight') show(seek(idx, 1));
      return;
    }
    if (e.key === 'Escape' && !mobmenu.hidden) closeMenu();
  });

  // Свайп в лайтбоксе
  var tx = 0;
  lb.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 48) show(seek(idx, dx > 0 ? -1 : 1));
  }, { passive: true });


  /* ---------- Монограммы мастеров, нарисованные «от руки» ---------- */

  // Скелеты букв: 'p' — ломаная, 'c' — окружность (x, y, диаметр).
  // rough.js рисует их с дрожанием, поэтому линии получаются неидеальными.
  var STROKES = {
    'М': [['p', [[12, 90], [12, 20], [50, 64], [88, 20], [88, 90]]]],
    'А': [['p', [[12, 90], [50, 16], [88, 90]]], ['p', [[27, 63], [73, 63]]]],
    'Т': [['p', [[13, 21], [87, 21]]], ['p', [[50, 21], [50, 90]]]],
    'Ю': [['p', [[16, 18], [16, 92]]], ['p', [[16, 55], [43, 55]]], ['c', [67, 55, 48]]],
    'О': [['c', [50, 55, 76]]],
    'Н': [['p', [[18, 18], [18, 92]]], ['p', [[82, 18], [82, 92]]], ['p', [[18, 55], [82, 55]]]]
  };

  whenNear('#team', function () { loadRough().then(function () {
    document.querySelectorAll('.mcard[data-ini]').forEach(function (card, n) {
      var strokes = STROKES[card.dataset.ini];
      var host = card.querySelector('.mcard__mono');
      if (!strokes || !host) return;

      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 108');
      svg.setAttribute('fill', 'none');

      var rc = rough.svg(svg);
      var opt = { stroke: 'currentColor', strokeWidth: 2.3, roughness: 2.1, bowing: 2.4, seed: 11 + n * 7 };

      strokes.forEach(function (s) {
        svg.appendChild(s[0] === 'c'
          ? rc.circle(s[1][0], s[1][1], s[1][2], opt)
          : rc.linearPath(s[1], opt));
      });
      svg.appendChild(rc.linearPath([[10, 102], [90, 100]],
        { stroke: 'currentColor', strokeWidth: 1.5, roughness: 2.4, bowing: 3, seed: 31 + n * 5 }));

      host.appendChild(svg);
    });
  }); });

  /* ---------- Карта грузится, только когда доскроллили ----------
     Виджет Яндекса тянет ~700 КБ, поэтому не трогаем его до появления блока. */

  (function lazyMap() {
    var host = document.querySelector('[data-map]');
    if (!host) return;

    function load() {
      if (host.dataset.loaded) return;
      host.dataset.loaded = '1';
      var f = document.createElement('iframe');
      f.src = host.dataset.map;
      f.title = host.dataset.mapTitle || 'Карта';
      f.loading = 'lazy';
      f.allowFullscreen = true;
      f.addEventListener('load', function () { host.classList.add('is-ready'); });
      host.appendChild(f);
    }

    if (!('IntersectionObserver' in window)) return load();
    var mo = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { mo.disconnect(); load(); }
    }, { rootMargin: '300px' });
    mo.observe(host);
  })();

  /* ---------- Курсор ---------- */

  if (fine && !reduced) {
    var ring = document.querySelector('.cursor__ring');
    var dot = document.querySelector('.cursor__dot');
    var label = document.querySelector('.cursor__label');

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    var started = false;

    document.body.classList.add('cur-on');

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!started) { rx = mx; ry = my; started = true; }
      document.body.classList.remove('cur-hide');
    }, { passive: true });

    document.addEventListener('mouseleave', function () { document.body.classList.add('cur-hide'); });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      requestAnimationFrame(loop);
    })();

    var MEDIA = '.gitem';
    var LINK = 'a, button, input, select, label, .tab';

    document.addEventListener('mouseover', function (e) {
      var media = e.target.closest(MEDIA);
      if (media) {
        document.body.classList.add('cur-media');
        document.body.classList.remove('cur-link');
        label.textContent = media.classList.contains('gitem') ? 'Смотреть' : '';
        return;
      }
      document.body.classList.remove('cur-media');
      document.body.classList.toggle('cur-link', !!e.target.closest(LINK));
    });

    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget) {
        document.body.classList.remove('cur-media', 'cur-link');
      }
    });
  }
})();
