/* 26 calculators: 9 money, 9 business, 4 AI, 4 number tools */
(function(){
  'use strict';
  var N = window.N26, $ = N.money, F = N.fmt;
  function pmt(rate, n, pv){ return rate === 0 ? pv / n : pv * rate / (1 - Math.pow(1 + rate, -n)); }
  var RATES = null;

  var TOOLS = [
  // ---------- MONEY ----------
  { id:'loan', cat:'money', icon:'🏦', name:'Loan & EMI Calculator', desc:'Monthly payment, total interest and total cost of any loan.',
    f:[['amount','Loan amount ($)',25000],['rate','Annual interest rate (%)',8.5],['years','Term (years)',5]],
    run:function(v){ var r=v.rate/1200,n=v.years*12,p=pmt(r,n,v.amount);
      return [['Monthly payment',$(p)],['Total interest',$(p*n-v.amount)],['Total paid',$(p*n)]]; } },
  { id:'mortgage', cat:'money', icon:'🏠', name:'Mortgage Calculator', desc:'Payment with down payment, property tax and insurance.',
    f:[['price','Home price ($)',450000],['down','Down payment (%)',20],['rate','Interest rate (%)',6.25],['years','Amortization (years)',25],['tax','Property tax + insurance / year ($)',5400]],
    run:function(v){ var loan=v.price*(1-v.down/100),r=v.rate/1200,n=v.years*12,p=pmt(r,n,loan),t=v.tax/12;
      return [['Loan amount',$(loan)],['Principal & interest / mo',$(p)],['Total monthly (with tax/ins.)',$(p+t)],['Total interest over term',$(p*n-loan)]]; } },
  { id:'compound', cat:'money', icon:'📈', name:'Compound Interest Calculator', desc:'Grow a starting balance with monthly contributions.',
    f:[['start','Starting balance ($)',5000],['monthly','Monthly contribution ($)',300],['rate','Annual return (%)',7],['years','Years',20]],
    run:function(v){ var r=v.rate/1200,n=v.years*12,fv=v.start*Math.pow(1+r,n)+(r?v.monthly*(Math.pow(1+r,n)-1)/r:v.monthly*n),c=v.start+v.monthly*n;
      return [['Future value',$(fv)],['Total contributed',$(c)],['Growth earned',$(fv-c)]]; } },
  { id:'savings-goal', cat:'money', icon:'🎯', name:'Savings Goal Planner', desc:'How much to save each month to hit a target.',
    f:[['goal','Target amount ($)',50000],['have','Already saved ($)',5000],['rate','Annual return (%)',4],['months','Months to goal',36]],
    run:function(v){ var r=v.rate/1200,n=v.months,need=v.goal-v.have*Math.pow(1+r,n),m=r?need*r/(Math.pow(1+r,n)-1):need/n;
      return [['Save per month',$(Math.max(m,0))],['Save per week',$(Math.max(m,0)*12/52)],['Interest helps you by',$(Math.max(v.goal-v.have-Math.max(m,0)*n,0))]]; } },
  { id:'inflation', cat:'money', icon:'🎈', name:'Inflation Calculator', desc:'What money today is worth after years of inflation.',
    f:[['amount','Amount today ($)',1000],['rate','Average inflation (%)',3],['years','Years',10]],
    run:function(v){ var g=Math.pow(1+v.rate/100,v.years);
      return [['Cost of the same basket later',$(v.amount*g)],['Buying power of today\'s amount',$(v.amount/g)],['Purchasing power lost',F((1-1/g)*100,1)+'%']]; } },
  { id:'currency', cat:'money', icon:'💱', name:'Currency Converter (daily rates)', desc:'Converts with reference rates refreshed daily by our data job.',
    f:[['amount','Amount',100],['from','From (code)','USD','text'],['to','To (code)','EUR','text']],
    run:function(v){ if(!RATES||!RATES.rates) return [['Status','Rates are loading — try again in a second']];
      var a=RATES.rates[String(v.from).toUpperCase()],b=RATES.rates[String(v.to).toUpperCase()];
      if(!a||!b) return [['Status','Unknown currency code']];
      return [['Result',F(v.amount/a*b,4)+' '+String(v.to).toUpperCase()],['Rate','1 '+String(v.from).toUpperCase()+' = '+F(b/a,6)],['Rates date',RATES.updated||'—']]; } },
  { id:'card-payoff', cat:'money', icon:'💳', name:'Credit Card Payoff', desc:'Months to clear a balance and the interest you pay.',
    f:[['bal','Balance ($)',6000],['apr','APR (%)',22.99],['pay','Monthly payment ($)',250]],
    run:function(v){ var r=v.apr/1200,b=v.bal,m=0,int=0;
      if(v.pay<=b*r) return [['Warning','Payment does not cover monthly interest — balance will grow']];
      while(b>0&&m<1200){var i=b*r;int+=i;b=b+i-v.pay;m++;}
      return [['Months to pay off',m+' ('+F(m/12,1)+' yrs)'],['Total interest',$(int)],['Total paid',$(v.bal+int)]]; } },
  { id:'fire', cat:'money', icon:'🔥', name:'Retirement / FIRE Number', desc:'Your target nest egg and years to reach it.',
    f:[['spend','Annual spending in retirement ($)',48000],['wr','Safe withdrawal rate (%)',4],['saved','Invested now ($)',60000],['save','Saving per year ($)',24000],['ret','Real return (%)',5]],
    run:function(v){ var target=v.spend/(v.wr/100),r=v.ret/100,b=v.saved,y=0; while(b<target&&y<100){b=b*(1+r)+v.save;y++;}
      return [['FIRE number',$(target)],['Years to reach it',y>=100?'100+':y],['Progress today',F(v.saved/target*100,1)+'%']]; } },
  { id:'tip', cat:'money', icon:'🧾', name:'Tip & Bill Splitter', desc:'Split any bill fairly with tip and tax.',
    f:[['bill','Bill before tip ($)',120],['tip','Tip (%)',18],['people','People',4]],
    run:function(v){ var t=v.bill*v.tip/100,tot=v.bill+t;
      return [['Tip',$(t)],['Total',$(tot)],['Each person pays',$(tot/Math.max(v.people,1))]]; } },

  // ---------- BUSINESS ----------
  { id:'margin', cat:'business', icon:'💹', name:'Profit Margin Calculator', desc:'Gross profit, margin and markup from cost and price.',
    f:[['cost','Cost ($)',40],['price','Selling price ($)',100]],
    run:function(v){ var p=v.price-v.cost;
      return [['Gross profit',$(p)],['Margin',F(p/v.price*100,2)+'%'],['Markup',F(p/v.cost*100,2)+'%']]; } },
  { id:'breakeven', cat:'business', icon:'⚖️', name:'Break-even Calculator', desc:'Units and revenue needed to cover fixed costs.',
    f:[['fixed','Fixed costs / month ($)',12000],['price','Price per unit ($)',79],['var','Variable cost per unit ($)',31]],
    run:function(v){ var cm=v.price-v.var,u=Math.ceil(v.fixed/cm);
      return cm<=0?[['Warning','Price must exceed variable cost']]:[['Break-even units',F(u,0)],['Break-even revenue',$(u*v.price)],['Contribution margin',F(cm/v.price*100,1)+'%']]; } },
  { id:'markup', cat:'business', icon:'🏷️', name:'Price from Target Margin', desc:'Set a price that guarantees the margin you want.',
    f:[['cost','Unit cost ($)',25],['margin','Target margin (%)',60]],
    run:function(v){ var p=v.cost/(1-v.margin/100);
      return v.margin>=100?[['Warning','Margin must be under 100%']]:[['Price to charge',$(p)],['Profit per unit',$(p-v.cost)],['Equivalent markup',F((p-v.cost)/v.cost*100,1)+'%']]; } },
  { id:'roi', cat:'business', icon:'🚀', name:'ROI Calculator', desc:'Return on investment, total and annualized.',
    f:[['invest','Amount invested ($)',10000],['ret','Amount returned ($)',16500],['years','Years held',3]],
    run:function(v){ var roi=(v.ret-v.invest)/v.invest,ann=Math.pow(v.ret/v.invest,1/Math.max(v.years,.01))-1;
      return [['Net gain',$(v.ret-v.invest)],['Total ROI',F(roi*100,2)+'%'],['Annualized ROI',F(ann*100,2)+'%']]; } },
  { id:'ltv-cac', cat:'business', icon:'🧲', name:'LTV : CAC Calculator', desc:'Customer lifetime value vs acquisition cost.',
    f:[['arpu','Avg revenue per customer / mo ($)',49],['gm','Gross margin (%)',80],['churn','Monthly churn (%)',4],['cac','Cost to acquire a customer ($)',300]],
    run:function(v){ var ltv=v.arpu*(v.gm/100)/(v.churn/100),ratio=ltv/v.cac;
      return [['Customer lifetime value',$(ltv)],['LTV : CAC',F(ratio,2)+' : 1'],['Months to recover CAC',F(v.cac/(v.arpu*v.gm/100),1)],['Verdict',ratio>=3?'Healthy (3:1 or better)':'Below the 3:1 benchmark']]; } },
  { id:'runway', cat:'business', icon:'⏳', name:'Startup Runway', desc:'Months of cash left at your current burn.',
    f:[['cash','Cash in bank ($)',180000],['rev','Monthly revenue ($)',9000],['cost','Monthly costs ($)',27000],['growth','Monthly revenue growth (%)',5]],
    run:function(v){ var c=v.cash,r=v.rev,m=0; while(c>0&&m<240){c-= (v.cost-r); r*=1+v.growth/100; m++; if(r>=v.cost) return [['Runway','Default alive — revenue passes costs in month '+m],['Net burn today',$(v.cost-v.rev)]];}
      return [['Runway (months)',m>=240?'240+':m],['Net burn today',$(v.cost-v.rev)],['Cash-out date',new Date(Date.now()+m*30.44*864e5).toLocaleDateString(undefined,{month:'short',year:'numeric'})]]; } },
  { id:'freelance', cat:'business', icon:'🧑‍💻', name:'Freelance Hourly Rate', desc:'The rate that hits your income target after costs and time off.',
    f:[['income','Target take-home / year ($)',90000],['costs','Business costs / year ($)',8000],['tax','Tax rate (%)',28],['weeks','Working weeks / year',46],['hours','Billable hours / week',25]],
    run:function(v){ var gross=(v.income/(1-v.tax/100))+v.costs,h=v.weeks*v.hours;
      return [['Minimum hourly rate',$(gross/h)],['Day rate (8h)',$(gross/h*8)],['Gross revenue needed',$(gross)]]; } },
  { id:'salestax', cat:'business', icon:'🧮', name:'Sales Tax / VAT', desc:'Add or remove tax from any price.',
    f:[['amount','Amount ($)',100],['rate','Tax rate (%)',14.975],['mode','Mode','add','select:add|Add tax,remove|Remove tax (price includes tax)']],
    run:function(v){ var r=v.rate/100;
      if(v.mode==='remove'){var net=v.amount/(1+r);return [['Net price',$(net)],['Tax included',$(v.amount-net)]];}
      return [['Tax',$(v.amount*r)],['Total with tax',$(v.amount*(1+r))]]; } },
  { id:'discount', cat:'business', icon:'🔖', name:'Discount Impact', desc:'How many extra sales a discount needs to keep profit flat.',
    f:[['margin','Current gross margin (%)',40],['disc','Discount (%)',15]],
    run:function(v){ var m=v.margin/100,d=v.disc/100; if(d>=m) return [['Warning','Discount wipes out the whole margin']];
      var inc=m/(m-d)-1; return [['Extra unit sales needed',F(inc*100,1)+'%'],['New margin',F((m-d)/(1-d)*100,1)+'%']]; } },

  // ---------- AI ----------
  { id:'ai-cost', cat:'ai', icon:'🤖', name:'AI API Cost Estimator', desc:'Monthly cost of an AI feature from tokens and your provider\'s price.',
    f:[['req','Requests per day',2000],['tin','Input tokens per request',1200],['tout','Output tokens per request',400],['pin','Price per 1M input tokens ($)',3],['pout','Price per 1M output tokens ($)',15]],
    run:function(v){ var d=v.req*(v.tin*v.pin+v.tout*v.pout)/1e6;
      return [['Cost per request','$'+F(d/Math.max(v.req,1),5)],['Cost per day',$(d)],['Cost per month (30d)',$(d*30)]]; } },
  { id:'ai-roi', cat:'ai', icon:'⏱️', name:'AI Time-Savings ROI', desc:'What automating a task with AI is worth per year.',
    f:[['people','People doing the task',5],['hours','Hours each spends / week',6],['saved','Share AI can save (%)',40],['wage','Loaded hourly cost ($)',45],['tool','AI tools cost / month ($)',300]],
    run:function(v){ var h=v.people*v.hours*(v.saved/100)*48,val=h*v.wage,c=v.tool*12;
      return [['Hours saved / year',F(h,0)],['Value of time saved',$(val)],['Net annual benefit',$(val-c)],['ROI',F((val-c)/Math.max(c,1)*100,0)+'%']]; } },
  { id:'tokens', cat:'ai', icon:'🔤', name:'Word ↔ Token Estimator', desc:'Rough token count for English text (≈0.75 words per token).',
    f:[['words','Words',1500],['pages','Or pages (500 words each)',0]],
    run:function(v){ var w=v.words+v.pages*500,t=w/0.75;
      return [['Total words',F(w,0)],['Estimated tokens',F(t,0)],['Characters (approx.)',F(w*5.7,0)]]; } },
  { id:'ai-vs-hire', cat:'ai', icon:'🤝', name:'AI Agent vs New Hire', desc:'Compare a hire\'s full cost against an AI-assisted workflow.',
    f:[['salary','Annual salary ($)',60000],['burden','Benefits & overhead (%)',25],['ai','AI tools + setup / year ($)',9000],['oversight','Human oversight hours / week',8],['wage','Oversight hourly cost ($)',40]],
    run:function(v){ var hire=v.salary*(1+v.burden/100),ai=v.ai+v.oversight*48*v.wage;
      return [['Full cost of hire',$(hire)],['AI workflow cost',$(ai)],['Difference',$(hire-ai)],['Note','AI suits repeatable tasks; judgement-heavy roles still need people']]; } },

  // ---------- NUMBERS ----------
  { id:'words', cat:'numbers', icon:'✍️', name:'Number to Words (Cheque Writer)', desc:'Spell out any amount for cheques, invoices and contracts.',
    f:[['amount','Amount',26331.5],['cur','Currency word','dollars','text']],
    run:function(v){ return [['Words',N.toWords(v.amount)],['Cheque line',N.chequeWords(v.amount,v.cur)]]; } },
  { id:'primes', cat:'numbers', icon:'🔢', name:'Prime Factorization', desc:'Break any whole number into its prime factors.',
    f:[['n','Whole number',26331]],
    run:function(v){ var n=Math.floor(v.n),f=N.factorize(n); if(n<2||n>1e12) return [['Note','Enter 2 to 1,000,000,000,000']];
      return [['Prime factors',f.length===1?'Prime':N.factorString(f)],['Is prime?',f.length===1?'Yes':'No']]; } },
  { id:'base', cat:'numbers', icon:'🧬', name:'Base Converter', desc:'Decimal to binary, octal, hex and base 36.',
    f:[['n','Decimal number',26331]],
    run:function(v){ var n=Math.floor(v.n); return [['Binary',n.toString(2)],['Octal',n.toString(8)],['Hex',n.toString(16).toUpperCase()],['Base 36',n.toString(36).toUpperCase()],['Roman',N.roman(n)]]; } },
  { id:'percent', cat:'numbers', icon:'％', name:'Percentage Calculator', desc:'X% of Y, percent change and what percent X is of Y.',
    f:[['x','Value X',15],['y','Value Y',260]],
    run:function(v){ return [['X% of Y',F(v.x/100*v.y)],['X is what % of Y',F(v.x/v.y*100)+'%'],['Change from X to Y',F((v.y-v.x)/v.x*100,2)+'%']]; } }
  ];
  window.N26_TOOLS = TOOLS;

  var root = document.getElementById('tools');
  if (!root) return;
  var only = root.getAttribute('data-only');
  var list = only ? TOOLS.filter(function(t){ return only.split(',').indexOf(t.cat) > -1 || only.split(',').indexOf(t.id) > -1; }) : TOOLS;

  function field(t, f){
    var id = t.id + '-' + f[0], type = f[3] || 'number';
    if (type.indexOf('select:') === 0) {
      var opts = type.slice(7).split(',').map(function(o){ var p=o.split('|'); return '<option value="'+p[0]+'">'+p[1]+'</option>'; }).join('');
      return '<label for="'+id+'">'+f[1]+'<select id="'+id+'" name="'+f[0]+'">'+opts+'</select></label>';
    }
    return '<label for="'+id+'">'+f[1]+'<input id="'+id+'" name="'+f[0]+'" type="'+(type==='text'?'text':'number')+'" step="any" value="'+f[2]+'" required></label>';
  }
  root.innerHTML = list.map(function(t){
    return '<article class="card tool reveal in" id="'+t.id+'" data-cat="'+t.cat+'" data-name="'+(t.name+' '+t.desc).toLowerCase()+'">'
      + '<div class="icon" aria-hidden="true">'+t.icon+'</div><span class="tag">'+t.cat+'</span><h3>'+t.name+'</h3><p>'+t.desc+'</p>'
      + '<form>'+t.f.map(function(f){ return field(t,f); }).join('')+'<button class="btn small" type="submit">Calculate</button></form>'
      + '<div class="result" aria-live="polite"></div>'
      + '<p class="tool-cta">Want an expert to sanity-check these numbers? <a href="'+(root.getAttribute('data-root')||'')+'grow.html">Get a free review →</a></p></article>';
  }).join('');

  root.querySelectorAll('.tool').forEach(function(card){
    var t = TOOLS.filter(function(x){ return x.id === card.id; })[0], form = card.querySelector('form'), out = card.querySelector('.result');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var v = {};
      t.f.forEach(function(f){ var el = form.elements[f[0]]; v[f[0]] = (f[3]==='text'||String(f[3]).indexOf('select:')===0) ? el.value : parseFloat(el.value) || 0; });
      var rows;
      try { rows = t.run(v); } catch(err) { rows = [['Error','Check your inputs']]; }
      out.innerHTML = rows.map(function(r){ return '<div><span>'+r[0]+'</span><b>'+r[1]+'</b></div>'; }).join('');
      out.classList.add('show');
    });
  });

  // filters + search
  var chips = document.querySelectorAll('[data-filter]'), search = document.getElementById('tool-search');
  function apply(){
    var cat = (document.querySelector('[data-filter].on') || {}).dataset ? document.querySelector('[data-filter].on').dataset.filter : 'all';
    var q = search ? search.value.trim().toLowerCase() : '';
    root.querySelectorAll('.tool').forEach(function(c){
      c.style.display = ((cat === 'all' || c.dataset.cat === cat) && (!q || c.dataset.name.indexOf(q) > -1)) ? '' : 'none';
    });
  }
  chips.forEach(function(ch){ ch.addEventListener('click', function(){ chips.forEach(function(c){ c.classList.remove('on'); }); ch.classList.add('on'); apply(); }); });
  if (search) search.addEventListener('input', apply);

  var meta = document.querySelector('meta[name=site-root]');
  fetch((meta ? meta.content : '') + 'data/daily.json', { cache: 'no-cache' }).then(function(r){ return r.json(); }).then(function(d){ RATES = d.fx; }).catch(function(){});
})();
