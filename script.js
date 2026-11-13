(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fa = (n, d = 0) => n.toLocaleString('fa-IR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  // شمارش نرم یک عدد از from تا to
  function animateNumber(el, from, to, dur = 1400, decimals = 0) {
    if (reduceMotion) dur = 0;
    const t0 = performance.now();
    const step = (t) => {
      const p = dur ? clamp((t - t0) / dur) : 1;
      el.textContent = fa(lerp(from, to, 1 - (1 - p) ** 3), decimals);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- تم روشن / تیره ---------- */
  // تغییر فوری است؛ نرمی رنگ‌ها را transition خود CSS انجام می‌دهد
  $('#theme-toggle').addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('taraz-theme', next); } catch (e) { /* حالت خصوصی مرورگر */ }
  });

  /* ---------- منوی موبایل ---------- */
  const header = $('.header');
  const navToggle = $('.nav-toggle');
  const setMenu = (open) => {
    header.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
    navToggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
  };
  navToggle.addEventListener('click', () => setMenu(!header.classList.contains('open')));
  $$('.nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

  /* ---------- ضخامت سه‌بعدی: چند لایه پشت سر هم ---------- */
  function addDepth(el, count, step, cls) {
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= count; i++) {
      const layer = document.createElement('i');
      layer.className = cls;
      layer.style.transform = `translateZ(${(-i * step).toFixed(2)}px)`;
      frag.append(layer);
    }
    el.prepend(frag);
  }
  const phone = $('#phone');
  addDepth(phone, 14, 1, 'p-layer');
  $$('.coin-spin').forEach((coin) => {
    const step = Math.max(0.6, coin.offsetWidth * 0.012);
    addDepth(coin, 8, step, 'coin-layer');
    $('.coin-face:not(.back)', coin).style.transform = 'translateZ(.5px)';
    $('.coin-face.back', coin).style.transform = `translateZ(${(-8 * step - 0.5).toFixed(2)}px) rotateY(180deg)`;
  });

  /* ==========================================================================
     اپ داخل گوشی
     ========================================================================== */
  const screen = $('#screen');
  const views = $$('.view', screen);
  const tabs = $$('.tabbar button', screen);
  const VIEW_ORDER = ['home', 'budget', 'goals', 'report'];
  let currentView = 'home';

  function setView(name) {
    if (name === currentView) return;
    currentView = name;
    screen.dataset.view = name;
    views.forEach((v) => {
      const on = v.dataset.view === name;
      v.classList.toggle('is-active', on);
      v.inert = !on;
    });
    tabs.forEach((t) => {
      const on = t.dataset.view === name;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
    });
  }
  views.forEach((v) => { v.inert = !v.classList.contains('is-active'); });

  // نمودار دایره‌ای: انتخاب دسته
  const donutCard = $('#donut-card');
  const segs = $$('.seg', donutCard);
  const legendBtns = $$('.legend button', donutCard);
  const dnVal = $('#dn-val');
  const dnLbl = $('#dn-lbl');
  let activeCat = null;
  function setCat(cat) {
    activeCat = cat === activeCat ? null : cat;
    donutCard.classList.toggle('has-active', !!activeCat);
    segs.forEach((s) => s.classList.toggle('is-active', s.dataset.cat === activeCat));
    legendBtns.forEach((b) => {
      const on = b.dataset.cat === activeCat;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on);
      if (on) { dnVal.textContent = b.dataset.pct; dnLbl.textContent = b.firstChild.textContent; }
    });
    if (!activeCat) { dnVal.textContent = '۵'; dnLbl.textContent = 'دسته'; }
  }
  legendBtns.forEach((b) => b.addEventListener('click', () => setCat(b.dataset.cat)));
  segs.forEach((s) => s.addEventListener('click', () => setCat(s.dataset.cat)));

  // دکمه‌ی +: ثبت یک خرج نمونه
  const SAMPLES = [
    { title: 'نان‌وایی', amount: 45000, icon: 'i-bag', color: '#2DD4A0' },
    { title: 'شارژ موبایل', amount: 50000, icon: 'i-bolt', color: '#F6EE55' },
    { title: 'داروخانه', amount: 320000, icon: 'i-bag', color: '#B7A6FF' },
    { title: 'بنزین', amount: 150000, icon: 'i-car', color: '#5BC8F5' },
    { title: 'سینما', amount: 180000, icon: 'i-cup', color: '#FF8FA3' },
  ];
  const txList = $('#tx-list');
  const balNum = $('#bal-num');
  const toast = $('#toast');
  let total = 12480000;
  let sampleIdx = 0;
  let toastTimer = 0;
  $('#add-tx').addEventListener('click', () => {
    setView('home');
    const s = SAMPLES[sampleIdx++ % SAMPLES.length];
    const li = document.createElement('li');
    li.className = 'is-new';
    li.innerHTML = `<span class="ic" style="--c:${s.color}"><svg class="i"><use href="#${s.icon}"/></svg></span><div>${s.title}<small>همین حالا</small></div><bdi dir="ltr">−${fa(s.amount)}</bdi>`;
    txList.prepend(li);
    txList.lastElementChild.remove();
    animateNumber(balNum, total, (total += s.amount), 700);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
  });

  /* ==========================================================================
     موتور اسکرول: گوشی از حالت خوابیده در هیرو بلند می‌شود، یک دور می‌چرخد
     و کنار مرحله‌های معرفی می‌نشیند. هر مرحله صفحه‌ی اپ را عوض می‌کند.
     ========================================================================== */
  const story = $('#story');
  const stage = $('.stage');
  const stageInner = $('.stage-inner');
  const copy = $('.hero-copy');
  const stepEls = $$('.step');
  const dots = $$('.stage-dots button');
  const shadow = $('.phone-shadow');
  const floats = $$('.float-card');
  const coins = $$('.coin-spin');
  const bg = $('.bg');
  const banks = $('.banks');
  const KEYS = ['x', 'y', 'rx', 'ry', 'rz', 's'];
  const pointer = { x: 0, y: 0 };
  let stops = [];
  let cur = null;
  let storyEnd = 0;
  let activeStep = -2;
  let raf = 0;

  const toTransform = (f) =>
    `translate3d(${f.x.toFixed(1)}px,${f.y.toFixed(1)}px,0) rotateX(${f.rx.toFixed(2)}deg) rotateY(${f.ry.toFixed(2)}deg) rotateZ(${f.rz.toFixed(2)}deg) scale(${f.s.toFixed(3)})`;

  function measure() {
    const vh = stage.offsetHeight;
    const vw = innerWidth;
    const mobile = vw < 900;
    const top = story.getBoundingClientRect().top + scrollY;

    const hero = {
      at: top, x: 0, y: vh * 0.4,
      rx: reduceMotion ? 0 : 52, ry: 0, rz: reduceMotion ? 0 : -24,
      s: mobile ? 0.8 : 1.05,
    };
    // گوشی هیچ‌وقت روی متن هیرو نمی‌افتد: بالاترین نقطه‌ی تصویر سه‌بعدی‌اش را
    // اندازه می‌گیریم و آن را با فاصله‌ی ثابت زیر آخرین خط متن می‌نشانیم.
    // (پرسپکتیو با جابه‌جایی کمی عوض می‌شود، برای همین چند بار تکرار می‌کنیم)
    const phoneTop = copy.getBoundingClientRect().bottom + scrollY - top + (mobile ? 20 : 30);
    const stageTop = stage.getBoundingClientRect().top;
    const shown = phone.style.transform;
    for (let i = 0; i < 3; i++) {
      phone.style.transform = toTransform(hero);
      hero.y += phoneTop - (phone.getBoundingClientRect().top - stageTop);
    }
    phone.style.transform = shown;
    const dock = mobile
      ? { x: 0, y: -vh * 0.12, s: Math.min(0.66, (vh * 0.52) / 620) }
      : { x: -Math.min(vw * 0.23, 320), y: 18, s: Math.min(1, (vh - 150) / 620) };
    const tilt = mobile ? [8, -8, 8, -8] : [16, -12, 14, -10];

    stops = [hero, ...stepEls.map((el, i) => {
      const r = el.getBoundingClientRect();
      return {
        at: r.top + scrollY + r.height / 2 - vh / 2,
        ...dock,
        rx: 0,
        ry: (reduceMotion ? 0 : -360) + tilt[i % tilt.length],
        rz: reduceMotion ? 0 : (i % 2 ? -1.5 : 1.5),
      };
    })];
    storyEnd = top + story.offsetHeight;
    stageInner.style.setProperty('--ptop', `${phoneTop.toFixed(0)}px`); // کارت‌های شناور از همین خط آویزان‌اند

    // نیمه‌ی پایین آخرین مرحله زیر گوشی خالی است؛ نوار بانک‌ها را تا زیر سایه‌ی گوشی بالا می‌کشیم.
    // (زیر سایه = وسط صفحه + جابه‌جایی گوشی + نصف قد گوشی و سایه‌اش؛ روی موبایل کارت پایین صفحه است و لازم نیست)
    const below = vh / 2 - dock.y - (phone.offsetHeight / 2 + 51) * dock.s;
    banks.style.marginTop = mobile ? '' : `${-Math.max(0, Math.round(below - 24))}px`;
  }

  function sample(y) {
    if (y <= stops[0].at) return stops[0];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (y <= b.at) {
        // تکه‌ی اول کمی زودتر تمام می‌شود تا گوشی قبل از رسیدن متن سر جایش باشد
        const t = ease(clamp((y - a.at) / (b.at - a.at) / (i === 0 ? 0.88 : 1)));
        const out = {};
        for (const k of KEYS) out[k] = lerp(a[k], b[k], t);
        return out;
      }
    }
    return stops[stops.length - 1];
  }

  function setActiveStep(idx) {
    if (idx === activeStep) return;
    activeStep = idx;
    stage.classList.toggle('is-docked', idx >= 0);
    stepEls.forEach((el, i) => el.classList.toggle('is-current', i === idx));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    setView(idx >= 0 ? VIEW_ORDER[idx] : 'home');
  }

  function tick() {
    raf = 0;
    const y = scrollY;
    const target = sample(y);
    const k = reduceMotion ? 1 : 0.13;
    let moving = false;

    for (const key of KEYS) {
      let goal = target[key];
      if (key === 'ry') goal += pointer.x * 7;
      if (key === 'rx') goal -= pointer.y * 5;
      const d = goal - cur[key];
      if (Math.abs(d) > 0.02) { cur[key] += d * k; moving = true; } else cur[key] = goal;
    }

    phone.style.transform = toTransform(cur);
    screen.style.setProperty('--g', `${(Math.sin((cur.ry * Math.PI) / 180) * 55).toFixed(1)}%`);

    // سایه فقط وقتی گوشی ایستاده است دیده می‌شود
    const standing = clamp(1 - cur.rx / 26);
    shadow.style.opacity = (standing * 0.9).toFixed(2);
    shadow.style.transform = `translate3d(${cur.x.toFixed(1)}px,${(cur.y + 338 * cur.s).toFixed(1)}px,0) scale(${cur.s.toFixed(3)})`;

    // کارت‌های شناور با شروع اسکرول محو می‌شوند
    const heroP = clamp((y - stops[0].at) / (stops[1].at - stops[0].at));
    const fade = clamp(1 - heroP * 3.2);
    floats.forEach((f) => {
      const depth = +f.dataset.depth;
      f.style.opacity = fade.toFixed(2);
      f.style.visibility = fade ? 'visible' : 'hidden';
      f.style.transform = `translate3d(${(pointer.x * depth).toFixed(1)}px,${(pointer.y * depth * 0.6 - heroP * 220).toFixed(1)}px,0)`;
    });

    // مرحله‌ی فعال = نزدیک‌ترین مرحله به وسط صفحه
    let idx = -1;
    if (heroP > 0.55) {
      let best = Infinity;
      for (let i = 1; i < stops.length; i++) {
        const dist = Math.abs(y - stops[i].at);
        if (dist < best) { best = dist; idx = i - 1; }
      }
    }
    setActiveStep(idx);

    bg.style.setProperty('--sy', y.toFixed(0));
    coins.forEach((c) => c.style.setProperty('--turn', `${(y * 0.5).toFixed(0)}deg`));

    if (moving) request();
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(tick); };

  function init() {
    measure();
    if (!cur) cur = { ...sample(scrollY) };
    request();
  }
  init();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); request(); });
  addEventListener('load', () => { measure(); request(); });
  addEventListener('resize', () => { measure(); request(); });
  addEventListener('scroll', request, { passive: true });

  if (finePointer && !reduceMotion) {
    addEventListener('pointermove', (e) => {
      pointer.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.y = (e.clientY / innerHeight) * 2 - 1;
      if (scrollY < storyEnd) request();
    }, { passive: true });
  }

  const scrollToStep = (i) => scrollTo({ top: stops[i + 1].at, behavior: reduceMotion ? 'auto' : 'smooth' });
  dots.forEach((d, i) => d.addEventListener('click', () => scrollToStep(i)));
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    setView(t.dataset.view);
    if (activeStep >= 0) scrollToStep(i); // در بخش معرفی، متن هم با تب عوض می‌شود
  }));

  /* ---------- نور دنبال‌کننده‌ی نشانگر روی کارت‌های شیشه‌ای ---------- */
  if (finePointer) {
    document.addEventListener('pointermove', (e) => {
      const el = e.target.closest && e.target.closest('.spot');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* ---------- ظاهر شدن بخش‌ها + شمارنده‌ی آمار ---------- */
  const io = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      target.classList.add('in');
      if (target.dataset.count) animateNumber(target, 0, +target.dataset.count, 1600, +(target.dataset.decimals || 0));
      io.unobserve(target);
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('[data-count]').forEach((el) => { el.textContent = fa(0, +(el.dataset.decimals || 0)); });
  $$('.reveal, [data-count]').forEach((el) => io.observe(el));

  /* ---------- ماشین‌حساب پس‌انداز ---------- */
  const spend = $('#spend');
  const pct = $('#pct');
  const fill = (input) => input.style.setProperty('--p', `${((input.value - input.min) / (input.max - input.min)) * 100}%`);
  function calc() {
    const monthly = Math.round((spend.value * pct.value) / 100);
    $('#spend-val').textContent = `${fa(+spend.value)} تومان`;
    $('#pct-val').textContent = `${fa(+pct.value)}٪`;
    $('#save-m').textContent = fa(monthly);
    $('#save-y').textContent = fa(monthly * 12);
    fill(spend);
    fill(pct);
  }
  spend.addEventListener('input', calc);
  pct.addEventListener('input', calc);
  calc();

  /* ---------- قیمت ماهانه / سالانه ---------- */
  const billingBtns = $$('.billing button');
  billingBtns.forEach((btn) => btn.addEventListener('click', () => {
    const yearly = btn.dataset.period === 'y';
    billingBtns.forEach((b) => b.setAttribute('aria-pressed', b === btn));
    $$('[data-m]').forEach((el) => {
      const from = +(yearly ? el.dataset.m : el.dataset.y);
      const to = +(yearly ? el.dataset.y : el.dataset.m);
      if (el.textContent !== fa(to)) animateNumber(el, from, to, 500);
    });
    $$('.per').forEach((el) => { el.textContent = yearly ? '/ سال' : '/ ماه'; });
  }));
})();
