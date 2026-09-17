/* ============================================================
   Мастерская по созданию красоты — интерактив
   ============================================================ */

(function () {
  'use strict';

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

  /* ---------- Галерея ---------- */

  // Фото скачаны с карточки 2ГИС и лежат локально в assets/gallery — не зависим
  // от чужого CDN. Каждое в двух размерах: -950 в сетку, -1920 в лайтбокс.
  function g(slug, tier) { return 'assets/gallery/' + slug + '-' + tier + '.jpg'; }

  var PHOTOS = [
    { s: 'work-17', a: 'До и после: осветление и тонирование' },
    { s: 'work-02', a: 'Медное окрашивание' },
    { s: 'work-06', a: 'Серебристое тонирование' },
    { s: 'work-12', a: 'Платиновый блонд' },
    { s: 'work-15', a: 'Air touch, тёплый блонд' },
    { s: 'interior-1', a: 'Интерьер студии' },
    { s: 'work-04', a: 'Пепельный блонд, укладка волнами' },
    { s: 'work-09', a: 'Каре с тёмным оттенком' },
    { s: 'work-13', a: 'Ламинирование ресниц' },
    { s: 'work-01', a: 'Холодный блонд, сложное окрашивание' },
    { s: 'work-07', a: 'Причёска с плетением' },
    { s: 'work-05', a: 'Стрижка на длинные волосы' },
    { s: 'work-16', a: 'Холодный блонд на длинные волосы' },
    { s: 'work-18', a: 'Макияж' },
    { s: 'work-03', a: 'Тонирование, длинные волосы' },
    { s: 'work-11', a: 'Блонд на длинные волосы' },
    { s: 'work-19', a: 'Макияж и укладка' },
    { s: 'work-14', a: 'Пепельный блонд' },
    { s: 'work-20', a: 'Пепельный блонд, длинные волосы' },
    { s: 'interior-2', a: 'Уходовая косметика в студии' },
    { s: 'work-08', a: 'Короткая стрижка' },
    { s: 'work-10', a: 'Длинные волосы после окрашивания' },
    { s: 'work-21', a: 'Русый с пепельным тонированием' },
    { s: 'outside-2', a: 'Вход в студию' }
  ];

  // Превью ролика из раздела «Видео» карточки. Сам mp4 2ГИС наружу не отдаёт —
  // положите файл рядом и впишите путь в video: плитка заиграет при наведении.
  var VIDEO = {
    poster: g('video-1', '950'),
    a: 'Уход за волосами — видео студии',
    video: '',
    link: 'https://2gis.ru/omsk/gallery/firm/70000001047108090'
  };

  var SIZES = '(max-width:420px) 100vw, (max-width:760px) 60vw, (max-width:1100px) 40vw, 30vw';

  var gal = document.getElementById('gal');
  var lbItems = [];

  if (gal) {
    var frag = document.createDocumentFragment();

    PHOTOS.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'gitem' + (p.span ? ' gitem--' + p.span : '');
      b.dataset.i = String(i);
      b.setAttribute('aria-label', 'Открыть фото: ' + p.a);

      var img = document.createElement('img');
      img.src = g(p.s, '950');
      img.srcset = g(p.s, '950') + ' 950w, ' + g(p.s, '1920') + ' 1920w';
      img.sizes = SIZES;
      img.width = 950;
      img.height = 633;
      img.alt = p.a;
      img.loading = i < 6 ? 'eager' : 'lazy';
      img.decoding = 'async';

      b.appendChild(img);
      frag.appendChild(b);
      lbItems.push({ src: g(p.s, '1920'), fallback: g(p.s, '950'), cap: p.a });
    });

    // Плитка с видео
    var v = document.createElement(VIDEO.video ? 'button' : 'a');
    v.className = 'gitem';
    if (VIDEO.video) {
      v.type = 'button';
    } else {
      v.href = VIDEO.link;
      v.target = '_blank';
      v.rel = 'noopener';
    }
    v.setAttribute('aria-label', VIDEO.a);
    v.innerHTML =
      '<span class="gitem__badge">Видео</span>' +
      '<span class="gitem__play"><span>' +
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
      '</span></span>';

    if (VIDEO.video) {
      var vid = document.createElement('video');
      vid.src = VIDEO.video;
      vid.poster = VIDEO.poster;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.preload = 'metadata';
      v.insertBefore(vid, v.firstChild);
      if (fine && !reduced) {
        v.addEventListener('mouseenter', function () { vid.play().catch(function () {}); });
        v.addEventListener('mouseleave', function () { vid.pause(); vid.currentTime = 0; });
      }
    } else {
      var vimg = document.createElement('img');
      vimg.src = VIDEO.poster;
      vimg.alt = VIDEO.a;
      vimg.width = 950;
      vimg.height = 633;
      vimg.loading = 'lazy';
      v.insertBefore(vimg, v.firstChild);
    }
    frag.appendChild(v);

    gal.appendChild(frag);
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

  if (window.rough) {
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
  }

  document.querySelectorAll('.plate__fig').forEach(function (host) {
    host.querySelectorAll('path').forEach(function (p, i) {
      var len = 600;
      try { len = Math.ceil(p.getTotalLength()) + 2; } catch (e) {}
      p.style.setProperty('--len', len);
      p.style.setProperty('--i', i);
    });
  });

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
    var o = { stroke: 'currentColor', strokeWidth: 2, roughness: 2.3, bowing: 1.3, seed: 23 };

    s.appendChild(rc.rectangle(3, 3, w - 6, h - 6, o));

    if (w > 860) {
      var t = (w - 6) / 3;
      s.appendChild(rc.line(3 + t, 28, 3 + t, h - 28, o));
      s.appendChild(rc.line(3 + t * 2, 28, 3 + t * 2, h - 28, o));
    } else {
      var q = (h - 6) / 3;
      s.appendChild(rc.line(28, 3 + q, w - 28, 3 + q, o));
      s.appendChild(rc.line(28, 3 + q * 2, w - 28, 3 + q * 2, o));
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

  redrawSketches();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawSketches);

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
    var svcCap = document.getElementById('svc-cap');

    function swapPhoto(tab) {
      if (!svcImg || !svcMedia) return;
      var next = 'assets/gallery/' + tab.dataset.photo + '-950.jpg';
      if (svcImg.getAttribute('src') === next) return;

      // Подгружаем заранее и меняем только после загрузки, иначе на месте
      // фото мелькает пустой блок.
      var pre = new Image();
      pre.onload = function () {
        svcImg.src = next;
        if (svcCap) svcCap.textContent = tab.dataset.cap;
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

  /* ---------- Лайтбокс ---------- */

  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  var lbCap = document.getElementById('lb-cap');
  var idx = 0;
  var lastFocus = null;

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
  document.getElementById('lb-p').addEventListener('click', function () { show(idx - 1); });
  document.getElementById('lb-n').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', function (e) {
    if (!lb.hidden) {
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
      return;
    }
    if (e.key === 'Escape' && !mobmenu.hidden) closeMenu();
  });

  // Свайп в лайтбоксе
  var tx = 0;
  lb.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 48) show(dx > 0 ? idx - 1 : idx + 1);
  }, { passive: true });

  /* ---------- Заявка уходит в WhatsApp ---------- */

  var form = document.getElementById('form');
  var MAX_CHAT = 'https://max.ru/u/f9LHodD0cOLDGrkwRgeBNztqMJz0TiQ5OtfnuzsTziWRLTBsLZ93xNICnQE';

  // Синхронное копирование: window.open должен остаться внутри жеста,
  // иначе всплывашку заблокирует браузер.
  function copyText(t) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(t).catch(function () {});
        return true;
      }
    } catch (e) {}
    try {
      var ta = document.createElement('textarea');
      ta.value = t;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var err = document.getElementById('form-err');
      var name = document.getElementById('f-name');
      var phone = document.getElementById('f-phone');
      var bad = null;

      [name, phone].forEach(function (f) { f.parentElement.classList.remove('is-bad'); });

      if (!name.value.trim()) bad = { f: name, m: 'Напишите, как к вам обращаться.' };
      else if (phone.value.replace(/\D/g, '').length < 10) bad = { f: phone, m: 'Проверьте номер телефона — кажется, не хватает цифр.' };

      if (bad) {
        bad.f.parentElement.classList.add('is-bad');
        err.classList.remove('is-ok');
        err.textContent = bad.m;
        err.hidden = false;
        bad.f.focus();
        return;
      }
      err.hidden = true;

      var master = document.getElementById('f-master').value;
      var when = document.getElementById('f-when').value.trim();

      var lines = [
        'Здравствуйте! Хочу записаться в «Мастерскую».',
        '',
        'Имя: ' + name.value.trim(),
        'Телефон: ' + phone.value.trim(),
        'Услуга: ' + document.getElementById('f-service').value
      ];
      if (master && master !== 'Любой свободный') lines.push('Мастер: ' + master);
      if (when) lines.push('Удобное время: ' + when);

      // Max — это ссылка на профиль, предзаполнить текст через query-параметр
      // нельзя (?text=/?message= сервер игнорирует). Поэтому кладём заявку
      // в буфер обмена и открываем чат — останется вставить.
      var copied = copyText(lines.join('\n'));
      window.open(MAX_CHAT, '_blank', 'noopener');

      err.hidden = false;
      err.classList.toggle('is-ok', copied);
      err.textContent = copied
        ? 'Заявка скопирована. Вставьте её в чат Max — Ctrl+V, и отправьте.'
        : 'Чат Max открыт. Скопируйте заявку из полей выше и отправьте сообщением.';
    });
  }

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

  if (window.rough) {
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
  }

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
