/* 26331.com core script — nav, consent, forms, popups, explorer helpers */
(function(){
  'use strict';
  // ---- Site config (edit here) ----
  var CONFIG = {
    // Optional payment links for donations. Leave empty to use the pledge form only.
    donateLinks: { paypal: '', stripe: '', buymeacoffee: '' },
    // Endpoint key is assembled at runtime so the inbox address never appears in page text.
    _k: ['d2Vid29ya3NhMQ', 'Z21haWwuY29t']
  };
  window.SITE_CONFIG = CONFIG;

  function inbox(){
    var p = CONFIG._k.map(function(s){ return atob(s + '==='.slice((s.length + 3) % 4)); });
    return p[0] + String.fromCharCode(64) + p[1];
  }
  function endpoint(){ return 'https://formsubmit.co/ajax/' + inbox(); }

  // ---- Mobile nav ----
  var burger = document.querySelector('.burger'), menu = document.querySelector('.menu');
  if (burger && menu) burger.addEventListener('click', function(){
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });

  // ---- Footer year ----
  document.querySelectorAll('[data-year]').forEach(function(el){ el.textContent = new Date().getFullYear(); });

  // ---- Cookie / consent notice ----
  var store = {
    get: function(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
    set: function(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
  };
  var cookie = document.getElementById('cookie');
  if (cookie && !store.get('n26331_consent')) {
    cookie.classList.add('show');
    cookie.querySelectorAll('[data-consent]').forEach(function(b){
      b.addEventListener('click', function(){
        store.set('n26331_consent', b.getAttribute('data-consent'));
        cookie.classList.remove('show');
      });
    });
  }

  // ---- Reveal on scroll ----
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .08 });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  }
  // Fallback: never leave content hidden (crawlers, full-page renders, slow observers)
  setTimeout(function(){ document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); }); }, 1200);

  // ---- Forms (all submissions go to the site inbox via FormSubmit) ----
  function show(msgEl, ok, text){
    if (!msgEl) return;
    msgEl.className = 'form-msg ' + (ok ? 'ok' : 'err');
    msgEl.textContent = text;
  }
  document.querySelectorAll('form[data-form]').forEach(function(form){
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var msg = form.querySelector('.form-msg');
      if (form.querySelector('.hp input') && form.querySelector('.hp input').value) return; // bot
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = {};
      new FormData(form).forEach(function(v,k){ if (k !== '_hp') data[k] = data[k] ? data[k] + ', ' + v : v; });
      data._subject = '[26331.com] ' + (form.getAttribute('data-form') || 'Form') + ' submission';
      data._template = 'table';
      data._captcha = 'false';
      data.page = location.pathname;
      var btn = form.querySelector('[type=submit]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending…'; }
      fetch(endpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return { ok: r.ok, j: j }; }); })
        .then(function(res){
          if (res.ok) {
            show(msg, true, form.getAttribute('data-success') || 'Thanks! Your message is in. We reply within 1–2 business days.');
            form.reset();
            if (typeof form.onDone === 'function') form.onDone();
          } else show(msg, false, 'Something went wrong. Please try again in a minute.');
        })
        .catch(function(){ show(msg, false, 'Network error. Please check your connection and try again.'); })
        .finally(function(){ if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; } });
    });
  });

  // ---- Multi-step lead form ----
  document.querySelectorAll('[data-multistep]').forEach(function(form){
    var steps = form.querySelectorAll('.step'), bars = form.querySelectorAll('.steps span'), i = 0;
    function go(n){
      steps.forEach(function(s,k){ s.classList.toggle('active', k === n); });
      bars.forEach(function(b,k){ b.classList.toggle('on', k <= n); });
      i = n;
    }
    form.querySelectorAll('[data-next]').forEach(function(b){
      b.addEventListener('click', function(){
        var fields = steps[i].querySelectorAll('input,select,textarea'), ok = true;
        fields.forEach(function(f){ if (ok && !f.checkValidity()) { f.reportValidity(); ok = false; } });
        if (ok) go(Math.min(i + 1, steps.length - 1));
      });
    });
    form.querySelectorAll('[data-prev]').forEach(function(b){ b.addEventListener('click', function(){ go(Math.max(i - 1, 0)); }); });
    form.onDone = function(){ go(0); };
    go(0);
  });

  // ---- Lead magnet popup (once per visitor, after 35s or exit intent) ----
  var modal = document.getElementById('leadModal');
  if (modal && !store.get('n26331_popup')) {
    var fired = false;
    var open = function(){ if (fired) return; fired = true; modal.classList.add('show'); store.set('n26331_popup', '1'); };
    setTimeout(open, 35000);
    document.addEventListener('mouseout', function(e){ if (!e.relatedTarget && e.clientY < 5) open(); });
  }
  if (modal) {
    modal.addEventListener('click', function(e){ if (e.target === modal || e.target.classList.contains('x')) modal.classList.remove('show'); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') modal.classList.remove('show'); });
  }

  // ---- Sticky CTA after scrolling ----
  var sticky = document.querySelector('.sticky-cta');
  if (sticky) window.addEventListener('scroll', function(){ sticky.classList.toggle('show', window.scrollY > 900); }, { passive: true });

  // ---- Donation buttons: use configured links if present, otherwise scroll to pledge form ----
  document.querySelectorAll('[data-donate]').forEach(function(b){
    b.addEventListener('click', function(e){
      var amt = b.getAttribute('data-donate');
      var link = CONFIG.donateLinks.stripe || CONFIG.donateLinks.paypal || CONFIG.donateLinks.buymeacoffee;
      if (link) { e.preventDefault(); window.open(link, '_blank', 'noopener'); return; }
      var f = document.getElementById('pledge');
      if (f) {
        e.preventDefault();
        var a = f.querySelector('[name=amount]'); if (a && amt) a.value = amt;
        f.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // ---- Daily data (refreshed by GitHub Actions) ----
  var daily = document.querySelectorAll('[data-daily]');
  if (daily.length) {
    var base = document.querySelector('meta[name=site-root]');
    var root = base ? base.content : '';
    fetch(root + 'data/daily.json', { cache: 'no-cache' }).then(function(r){ return r.json(); }).then(function(d){
      daily.forEach(function(el){
        var k = el.getAttribute('data-daily'), v = k.split('.').reduce(function(o,p){ return o && o[p]; }, d);
        if (v !== undefined && v !== null) el.textContent = v;
      });
    }).catch(function(){});
  }
})();
