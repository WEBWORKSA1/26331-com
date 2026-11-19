/* Number utilities shared by the tools and the Number Explorer */
(function(){
  'use strict';
  var ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  var TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  var SCALES = ['','thousand','million','billion','trillion','quadrillion'];
  function under1000(n){
    var s = [];
    if (n >= 100) { s.push(ONES[Math.floor(n/100)] + ' hundred'); n %= 100; }
    if (n >= 20) { s.push(TENS[Math.floor(n/10)] + (n % 10 ? '-' + ONES[n % 10] : '')); }
    else if (n > 0 || !s.length) s.push(ONES[n]);
    return s.join(' ');
  }
  function toWords(n){
    n = Math.floor(Math.abs(n));
    if (n === 0) return 'zero';
    var parts = [], i = 0;
    while (n > 0 && i < SCALES.length) {
      var chunk = n % 1000;
      if (chunk) parts.unshift(under1000(chunk) + (SCALES[i] ? ' ' + SCALES[i] : ''));
      n = Math.floor(n / 1000); i++;
    }
    return parts.join(' ');
  }
  function chequeWords(x, cur){
    var d = Math.floor(x), c = Math.round((x - d) * 100);
    var w = toWords(d);
    return w.charAt(0).toUpperCase() + w.slice(1) + ' ' + (cur || 'dollars') + ' and ' + String(c).padStart(2,'0') + '/100';
  }
  function factorize(n){
    var f = [], d = 2;
    if (n < 2) return f;
    while (d * d <= n) { while (n % d === 0) { f.push(d); n /= d; } d += d === 2 ? 1 : 2; }
    if (n > 1) f.push(n);
    return f;
  }
  function factorString(f){
    var m = {};
    f.forEach(function(p){ m[p] = (m[p] || 0) + 1; });
    return Object.keys(m).map(function(p){ return m[p] > 1 ? p + '^' + m[p] : p; }).join(' × ');
  }
  function divisorCount(f){
    var m = {}; f.forEach(function(p){ m[p] = (m[p] || 0) + 1; });
    return Object.keys(m).reduce(function(a,p){ return a * (m[p] + 1); }, 1);
  }
  function divisorSum(n){
    var s = 0;
    for (var i = 1; i * i <= n; i++) if (n % i === 0) { s += i; if (i * i !== n) s += n / i; }
    return s;
  }
  function roman(n){
    if (n < 1 || n > 3999) return '—';
    var map = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']], r = '';
    map.forEach(function(p){ while (n >= p[0]) { r += p[1]; n -= p[0]; } });
    return r;
  }
  function keypad(s){
    var k = {2:'ABC',3:'DEF',4:'GHI',5:'JKL',6:'MNO',7:'PQRS',8:'TUV',9:'WXYZ',0:'—',1:'—'};
    return String(s).split('').map(function(ch){ return k[ch] || ch; }).join(' · ');
  }
  function digitalRoot(n){ return n === 0 ? 0 : 1 + ((n - 1) % 9); }
  function fmt(x, dec){
    if (!isFinite(x)) return '—';
    return Number(x).toLocaleString(undefined, { minimumFractionDigits: dec || 0, maximumFractionDigits: dec === undefined ? 2 : dec });
  }
  function money(x){ return isFinite(x) ? (x < 0 ? '-' : '') + '$' + fmt(Math.abs(x), 2) : '—'; }

  function explore(n){
    var s = String(n), f = factorize(n);
    var isPrime = n > 1 && f.length === 1;
    var sumDiv = divisorSum(n) - n;
    return [
      ['In words', toWords(n)],
      ['Prime factors', n < 2 ? '—' : (isPrime ? 'Prime number' : factorString(f))],
      ['Number of divisors', n < 1 ? '—' : divisorCount(f)],
      ['Classification', n < 2 ? '—' : (sumDiv === n ? 'Perfect' : sumDiv > n ? 'Abundant' : 'Deficient') + (n % 2 ? ', odd' : ', even')],
      ['Digit sum / digital root', s.split('').reduce(function(a,c){ return a + (+c); }, 0) + ' / ' + digitalRoot(n)],
      ['Palindrome?', s === s.split('').reverse().join('') ? 'Yes' : 'No'],
      ['Binary', n.toString(2)],
      ['Octal', n.toString(8)],
      ['Hexadecimal', n.toString(16).toUpperCase()],
      ['Base 36', n.toString(36).toUpperCase()],
      ['Roman numeral', roman(n)],
      ['Square', fmt(n * n)],
      ['Square root', fmt(Math.sqrt(n), 4)],
      ['Phone keypad letters', keypad(s)],
      ['Reversed', s.split('').reverse().join('')],
      ['As a cheque amount', chequeWords(n)]
    ];
  }
  window.N26 = { toWords: toWords, chequeWords: chequeWords, factorize: factorize, factorString: factorString, roman: roman, keypad: keypad, fmt: fmt, money: money, explore: explore };

  // Number Explorer widget
  var form = document.getElementById('explorer');
  if (form) {
    var out = document.getElementById('explorer-out');
    var run = function(v){
      var n = parseInt(String(v).replace(/[^0-9]/g,''), 10);
      if (!isFinite(n) || n < 0 || n > 9007199254740991) { out.innerHTML = '<p>Enter a whole number between 0 and 9,007,199,254,740,991.</p>'; return; }
      if (n > 1e12) { out.innerHTML = '<p>For speed, factorization is limited to numbers up to 1,000,000,000,000.</p>'; return; }
      out.innerHTML = explore(n).map(function(r){ return '<div class="fact"><small>' + r[0] + '</small><b>' + r[1] + '</b></div>'; }).join('');
      try { history.replaceState(null, '', '#' + n); } catch(e){}
    };
    form.addEventListener('submit', function(e){ e.preventDefault(); run(form.n.value); });
    var start = (location.hash || '').replace('#','') || form.n.value;
    form.n.value = start; run(start);
  }
})();
