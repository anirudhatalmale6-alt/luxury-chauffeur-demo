/* ==========================================================================
   NOIR CHAUFFEUR — shared demo logic
   Pure front-end demo: state lives in localStorage so the flow feels real
   without a backend. In production these calls hit the booking API.
   ========================================================================== */

/* ---------- mobile nav ---------- */
document.addEventListener('click', function (e) {
  var t = e.target.closest('.nav-toggle');
  if (t) {
    var nav = document.querySelector('.nav');
    if (nav) nav.classList.toggle('open');
  }
});

/* ---------- fleet catalogue (admin-editable in the real build) ---------- */
var FLEET = [
  { id: 'executive', name: 'Executive Saloon',  car: 'Mercedes-Benz E-Class',  seats: 3, bags: 2, base: 38, perKm: 2.10, perMin: 0.45, art: 'sedan',
    perks: ['Chauffeur in business attire', 'Bottled water & phone chargers', '60 min complimentary wait at airports'] },
  { id: 'first',     name: 'First Class',        car: 'Mercedes-Benz S-Class',  seats: 3, bags: 2, base: 62, perKm: 3.20, perMin: 0.70, art: 'sedan-long', badge: 'Most booked',
    perks: ['Rear-cabin climate & massage seats', 'Privacy glass, silent ride mode', 'Champagne on request'] },
  { id: 'suv',       name: 'Luxury SUV',         car: 'Range Rover Autobiography', seats: 5, bags: 4, base: 74, perKm: 3.60, perMin: 0.80, art: 'suv',
    perks: ['Ideal for families & ski luggage', 'All-terrain, all-weather', 'Child seats free of charge'] },
  { id: 'van',       name: 'Business Van',       car: 'Mercedes-Benz V-Class',  seats: 7, bags: 7, base: 68, perKm: 3.10, perMin: 0.75, art: 'van',
    perks: ['Conference seating for 7', 'On-board Wi-Fi & folding tables', 'Perfect for roadshows'] }
];

/* Rates edited in the admin panel are persisted and picked up by the quote engine */
try {
  var _saved = JSON.parse(localStorage.getItem('noir_pricing'));
  if (_saved && _saved.length === FLEET.length) {
    FLEET.forEach(function (t, i) {
      if (typeof _saved[i].base === 'number') t.base = _saved[i].base;
      if (typeof _saved[i].perKm === 'number') t.perKm = _saved[i].perKm;
      if (typeof _saved[i].perMin === 'number') t.perMin = _saved[i].perMin;
    });
  }
} catch (e) {}

/* ---------- car line-art (inline SVG, no image requests) ---------- */
function carArt(kind, w, h) {
  var body = {
    'sedan':
      '<path d="M60 128h280M96 128c0-13 10-24 23-24s23 11 23 24M258 128c0-13 10-24 23-24s23 11 23 24" />' +
      '<path d="M56 128c-10 0-18-8-18-18v-14c0-9 6-16 15-18l52-11 30-27c6-6 14-9 22-9h84c9 0 17 4 23 11l24 25 55 12c9 2 15 10 15 19v12c0 9-7 16-16 16" />' +
      '<path d="M139 62l-24 26h72V62h-48zM203 62v26h74l-24-23c-3-2-7-3-11-3h-39z" />',
    'sedan-long':
      '<path d="M50 128h300M92 128c0-13 10-24 23-24s23 11 23 24M266 128c0-13 10-24 23-24s23 11 23 24" />' +
      '<path d="M48 128c-10 0-17-8-17-18v-15c0-9 6-16 15-18l58-11 27-25c6-6 14-9 23-9h96c9 0 17 4 23 10l23 24 58 12c9 2 15 10 15 19v13c0 9-7 16-16 16" />' +
      '<path d="M132 62l-22 25h68V62h-46zM194 62v25h68l-21-22c-3-2-7-3-11-3h-36zM268 87h22" />',
    'suv':
      '<path d="M58 130h284M96 130c0-14 11-25 25-25s25 11 25 25M256 130c0-14 11-25 25-25s25 11 25 25" />' +
      '<path d="M54 130c-10 0-18-8-18-18V78c0-8 6-15 14-17l40-9 26-30c5-6 13-10 21-10h108c9 0 17 4 23 11l25 29 42 9c9 2 15 10 15 19v32c0 8-7 15-16 15" />' +
      '<path d="M136 52l-22 26h70V52h-48zM202 52v26h74l-22-24c-3-2-6-2-9-2h-43zM36 96h20M330 96h20" />',
    'van':
      '<path d="M56 132h288M98 132c0-14 11-25 25-25s25 11 25 25M258 132c0-14 11-25 25-25s25 11 25 25" />' +
      '<path d="M52 132c-9 0-16-7-16-16V60c0-9 7-16 16-16h190c8 0 16 4 21 10l44 50c3 4 5 8 5 13v9c0 8-7 16-16 16" />' +
      '<path d="M70 60h64v40H70zM152 60h60v40h-60zM230 60h16l34 40h-50z" />'
  }[kind] || '';
  return '<svg viewBox="0 0 400 170" width="' + (w || '100%') + '" height="' + (h || '100%') + '" fill="none" ' +
    'stroke="url(#g' + kind + ')" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" preserveAspectRatio="xMidYMid meet">' +
    '<defs><linearGradient id="g' + kind + '" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#e8c766"/><stop offset="100%" stop-color="#8a6f18"/></linearGradient></defs>' +
    body + '</svg>';
}

/* ---------- money ---------- */
var CUR = '£';
function money(n) { return CUR + n.toFixed(2); }

/* ---------- booking state ---------- */
var BK = {
  key: 'noir_booking',
  get: function () {
    try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; }
  },
  set: function (obj) {
    var cur = this.get();
    for (var k in obj) cur[k] = obj[k];
    localStorage.setItem(this.key, JSON.stringify(cur));
    return cur;
  },
  clear: function () { localStorage.removeItem(this.key); }
};

/* Distance/duration estimate. In production this is a Routes API call. */
function quote(tier, km, mins) {
  var f = FLEET.filter(function (t) { return t.id === tier; })[0] || FLEET[0];
  var ride = f.base + km * f.perKm + mins * f.perMin;
  var meet = 0, night = 0;
  return { fare: ride, meet: meet, night: night, total: ride };
}

/* Pretty date */
function fmtDate(d) {
  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return days[d.getDay()] + ', ' + d.getDate() + ' ' + mons[d.getMonth()] + ' ' + d.getFullYear();
}
function fmtTime(d) {
  var h = d.getHours(), m = d.getMinutes();
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

/* Reference generator (deterministic-ish, demo only) */
function makeRef() {
  var s = 'NC-';
  var chars = 'ACDEFHJKLMNPRTUVWXY3479';
  for (var i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/* Reveal-on-scroll */
document.addEventListener('DOMContentLoaded', function () {
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length || !('IntersectionObserver' in window)) return;
  els.forEach(function (el) { el.style.opacity = 0; el.style.transform = 'translateY(18px)'; el.style.transition = 'opacity .7s ease, transform .7s ease'; });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.style.opacity = 1; en.target.style.transform = 'none';
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
});
