(function(){
  var root=document.documentElement;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* project filters */
  var fbtns=document.querySelectorAll('.filters button');
  var cards=document.querySelectorAll('#grid .card');
  fbtns.forEach(function(b){
    b.addEventListener('click',function(){
      var f=b.getAttribute('data-f');
      fbtns.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
      cards.forEach(function(c){c.hidden=!(f==='all'||c.getAttribute('data-cat')===f);});
    });
  });

  /* experience / education tabs */
  var tbtns=document.querySelectorAll('.tabs button');
  var panels=document.querySelectorAll('.panel');
  tbtns.forEach(function(b){
    b.addEventListener('click',function(){
      var k=b.getAttribute('data-tab');
      tbtns.forEach(function(x){x.setAttribute('aria-selected',x===b?'true':'false');});
      panels.forEach(function(p){p.hidden=p.getAttribute('data-panel')!==k;});
    });
  });

  /* certificates marquee: clone the group for a seamless loop */
  var track=document.getElementById('track');
  if(track&&!reduce){
    var g=track.querySelector('.group'),c=g.cloneNode(true);
    c.setAttribute('aria-hidden','true');
    c.querySelectorAll('a').forEach(function(a){a.tabIndex=-1;});
    track.appendChild(c);
  }

  /* copy email */
  var copyBtn=document.getElementById('copy'),addr=document.getElementById('addr');
  copyBtn.addEventListener('click',function(){
    var ok=function(){
      var label=copyBtn.textContent;copyBtn.textContent=copyBtn.getAttribute('data-done');
      setTimeout(function(){copyBtn.textContent=label;},1600);
    };
    var fallback=function(){var r=document.createRange();r.selectNodeContents(addr);var s=window.getSelection();s.removeAllRanges();s.addRange(r);};
    try{navigator.clipboard.writeText(addr.textContent.trim()).then(ok,fallback);}catch(e){fallback();}
  });

  /* Nelson-Siegel yield curve */
  var cv=document.getElementById('curve');
  if(!cv)return; /* section is commented out: skip the curve, keep the rest of the page working */
  var ctx=cv.getContext('2d');
  var TEN=[0.25,0.5,1,2,3,5,7,10,20,30];
  var LAB=['3M','6M','1Y','2Y','3Y','5Y','7Y','10Y','20Y','30Y'];
  var NAMES=JSON.parse(cv.getAttribute('data-shapes'));
  var SHAPES=[[4.8,-2.6,-1.0,2.0],[3.4,1.4,0.8,1.5],[4.0,-1.0,3.0,2.5]];
  var cur=SHAPES[0].slice(),idx=0,auto=!reduce,HOLD=5000,last=performance.now();
  var W=0,H=0,hover=null;
  var slopeEl=document.getElementById('slope'),unit=slopeEl?slopeEl.getAttribute('data-unit'):'bp';
  var sbtns=document.querySelectorAll('[data-shape]');
  function syncButtons(){
    sbtns.forEach(function(b){
      var v=b.getAttribute('data-shape');
      b.setAttribute('aria-pressed',(v==='auto'?auto:(!auto&&+v===idx))?'true':'false');
    });
  }
  sbtns.forEach(function(b){
    b.addEventListener('click',function(){
      var v=b.getAttribute('data-shape');
      if(v==='auto'){auto=true;last=performance.now();}
      else{auto=false;idx=+v;}
      if(reduce){cur=SHAPES[idx].slice();draw();}
      syncButtons();
    });
  });
  syncButtons();
  function ns(t,p){var x=t/p[3],a=(1-Math.exp(-x))/x;return p[0]+p[1]*a+p[2]*(a-Math.exp(-x));}
  function size(){
    var r=cv.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);
    W=r.width;H=r.height;cv.width=Math.round(W*d);cv.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0);
  }
  function draw(){
    if(!W)size();
    var cs=getComputedStyle(root),c=function(n){return cs.getPropertyValue(n).trim();};
    var fg=c('--title'),muted=c('--text'),line=c('--line'),acc=c('--accent'),hi=c('--accent-light'),fam='Montserrat,system-ui,sans-serif';
    var p=cur;
    var pl=40,pr=12,pt=34,pb=28,narrow=W<460;
    var X=function(t){return pl+Math.log(t/0.25)/Math.log(120)*(W-pl-pr);};
    var Y=function(v){return pt+(1-(v-1.5)/4.5)*(H-pt-pb);};
    ctx.clearRect(0,0,W,H);
    ctx.font='500 10.5px '+fam;ctx.textBaseline='middle';ctx.lineWidth=1;
    for(var v=2;v<=6;v++){
      ctx.strokeStyle=line;ctx.setLineDash([]);
      ctx.beginPath();ctx.moveTo(pl,Y(v));ctx.lineTo(W-pr,Y(v));ctx.stroke();
      ctx.fillStyle=muted;ctx.textAlign='right';ctx.fillText(v+'%',pl-8,Y(v));
    }
    ctx.textAlign='center';
    for(var i=0;i<TEN.length;i++){
      var x=X(TEN[i]);
      ctx.strokeStyle=line;ctx.setLineDash([2,4]);
      ctx.beginPath();ctx.moveTo(x,pt);ctx.lineTo(x,H-pb);ctx.stroke();ctx.setLineDash([]);
      if(!narrow||i%2===1){ctx.fillStyle=muted;ctx.fillText(LAB[i],x,H-pb+14);}
    }
    var pts=[],N=140;
    for(var j=0;j<=N;j++){var t=0.25*Math.pow(120,j/N);pts.push([X(t),Y(ns(t,p))]);}
    var grad=ctx.createLinearGradient(0,pt,0,H-pb);grad.addColorStop(0,'rgba(140,110,230,.35)');grad.addColorStop(1,'rgba(140,110,230,0)');
    ctx.beginPath();ctx.moveTo(pts[0][0],H-pb);
    pts.forEach(function(q){ctx.lineTo(q[0],q[1]);});
    ctx.lineTo(pts[N][0],H-pb);ctx.closePath();ctx.fillStyle=grad;ctx.fill();
    ctx.save();ctx.shadowColor=acc;ctx.shadowBlur=12;
    ctx.beginPath();pts.forEach(function(q,k){k?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});
    ctx.strokeStyle=acc;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.stroke();ctx.restore();
    for(var m=0;m<TEN.length;m++){
      ctx.beginPath();ctx.arc(X(TEN[m]),Y(ns(TEN[m],p)),3.5,0,6.2832);ctx.fillStyle=hi;ctx.fill();
    }
    ctx.textAlign='left';ctx.fillStyle=muted;ctx.font='500 11px '+fam;
    ctx.fillText('NS · '+NAMES[idx],pl,14);
    if(hover!==null){
      var best=0,bd=1e9;
      for(var h=0;h<TEN.length;h++){var d=Math.abs(X(TEN[h])-hover);if(d<bd){bd=d;best=h;}}
      var hx=X(TEN[best]),hy=Y(ns(TEN[best],p));
      ctx.strokeStyle=fg;ctx.globalAlpha=.45;ctx.setLineDash([]);
      ctx.beginPath();ctx.moveTo(hx,pt);ctx.lineTo(hx,H-pb);ctx.stroke();ctx.globalAlpha=1;
      ctx.beginPath();ctx.arc(hx,hy,6,0,6.2832);ctx.strokeStyle=fg;ctx.lineWidth=1.5;ctx.stroke();
      var txt=LAB[best]+'  '+ns(TEN[best],p).toFixed(2)+' %',right=hx>W-110;
      ctx.font='600 12px '+fam;ctx.textAlign=right?'right':'left';ctx.fillStyle=fg;
      ctx.fillText(txt,hx+(right?-10:10),Math.max(pt+12,hy-16));
    }
    if(slopeEl){
      var sl=Math.round((ns(10,p)-ns(2,p))*100),st=(sl>0?'+':'')+sl+' '+unit;
      if(slopeEl.textContent!==st)slopeEl.textContent=st;
    }
  }
  cv.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();hover=e.clientX-r.left;if(reduce)draw();});
  cv.addEventListener('pointerleave',function(){hover=null;if(reduce)draw();});
  window.addEventListener('resize',function(){size();draw();});
  (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(draw);
  size();draw();
  if(!reduce){
    (function tick(now){
      if(auto&&now-last>HOLD){idx=(idx+1)%SHAPES.length;last=now;syncButtons();}
      for(var i=0;i<4;i++){var d=SHAPES[idx][i]-cur[i];cur[i]=Math.abs(d)>0.001?cur[i]+d*0.06:SHAPES[idx][i];}
      draw();requestAnimationFrame(tick);
    })(performance.now());
  }
})();

/* interactions: split text, reveal on scroll, typed word, photo depth, card spotlight, progress */
(function(){
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* letters that react to the pointer */
  function split(el){
    el.setAttribute('aria-label',el.textContent.replace(/\s+/g,' ').trim());
    var n=0;
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(ch){
        if(ch.nodeType===3){
          var frag=document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function(part){
            if(!part)return;
            if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(' '));return;}
            var w=document.createElement('span');w.className='w';w.setAttribute('aria-hidden','true');
            part.split('').forEach(function(chr){
              var s=document.createElement('span');s.className='ch';s.textContent=chr;s.style.setProperty('--i',n++);w.appendChild(s);
            });
            frag.appendChild(w);
          });
          node.replaceChild(frag,ch);
        }else if(ch.nodeType===1&&ch.tagName!=='BR'){walk(ch);}
      });
    })(el);
  }
  document.querySelectorAll('.split').forEach(split);

  /* reveal on scroll: only elements below the first screen start hidden */
  if('IntersectionObserver' in window&&!reduce){
    var vh=window.innerHeight;
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
    },{rootMargin:'0px 0px -6% 0px',threshold:.04});
    document.querySelectorAll('.eyebrow,.sec-title,.about>*,.filters,.card,.tabs,.panel:not([hidden]),.marquee,.box,.contact,.curve-card').forEach(function(el){
      if(el.getBoundingClientRect().top<vh*0.92)return;
      var idx=Array.prototype.indexOf.call(el.parentNode.children,el);
      el.classList.add('reveal');el.style.transitionDelay=(idx%4)*70+'ms';
      el.addEventListener('transitionend',function done(ev){
        if(ev.propertyName!=='opacity')return;
        el.classList.remove('reveal','in');el.style.transitionDelay='';el.removeEventListener('transitionend',done);
      });
      io.observe(el);
    });
  }

  /* typed word under the greeting */
  var role=document.querySelector('.r-small'),typed=role&&role.querySelector('.typed');
  if(typed&&!reduce){
    var words=[];try{words=JSON.parse(role.getAttribute('data-words')||'[]');}catch(e){}
    if(words.length>1){
      typed.classList.add('live');
      var wi=0,ci=words[0].length,dir=-1;
      (function tick(){
        var d;
        if(dir<0){
          ci--;typed.textContent=words[wi].slice(0,ci);
          if(ci<=0){dir=1;wi=(wi+1)%words.length;d=260;}else d=35;
        }else{
          ci++;typed.textContent=words[wi].slice(0,ci);
          if(ci>=words[wi].length){dir=-1;d=2400;}else d=65;
        }
        setTimeout(tick,d);
      })();
      setTimeout(function(){},0);
    }
  }

  /* photo depth: pointer and scroll */
  var photo=document.querySelector('.h-photo'),hero=document.querySelector('.hero'),ticking=false,mx=0,my=0;
  var bar=document.getElementById('progress');
  var topbar=document.querySelector('.top');
  var tl=document.querySelector('.timeline'),tlItems=tl?tl.querySelectorAll('.tl-item'):[];
  function updateTimeline(){
    if(!tl||tl.offsetParent===null)return;
    var r=tl.getBoundingClientRect(),line=window.innerHeight*0.6;
    tl.style.setProperty('--p',Math.max(0,Math.min(1,(line-r.top)/r.height)));
    tlItems.forEach(function(it){
      var d=it.querySelector('.tl-dot').getBoundingClientRect();
      it.classList.toggle('on',d.top+d.height/2<line);
    });
  }
  function frame(){
    ticking=false;
    var sy=window.pageYOffset||0,max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    if(bar)bar.style.transform='scaleX('+Math.min(1,sy/max)+')';
    if(topbar)topbar.classList.toggle('scrolled',sy>8);
    updateTimeline();
    if(photo&&!reduce){
      photo.style.setProperty('--sy',Math.min(sy,600)*0.06+'px');
      photo.style.setProperty('--px',(-mx*14)+'px');photo.style.setProperty('--py',(-my*8)+'px');
      photo.style.setProperty('--gx',(mx*26)+'px');photo.style.setProperty('--gy',(my*16)+'px');
    }
  }
  function ask(){if(!ticking){ticking=true;requestAnimationFrame(frame);}}
  window.addEventListener('scroll',ask,{passive:true});
  window.addEventListener('resize',ask);
  if(hero&&!reduce){
    hero.addEventListener('pointermove',function(e){
      var r=hero.getBoundingClientRect();
      mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5;ask();
    });
    hero.addEventListener('pointerleave',function(){mx=0;my=0;ask();});
  }
  document.querySelectorAll('.tabs button').forEach(function(b){b.addEventListener('click',function(){setTimeout(frame,0);});});
  frame();

  /* spotlight that follows the pointer on project cards */
  var grid=document.getElementById('grid');
  if(grid){
    grid.addEventListener('pointermove',function(e){
      var c=e.target.closest&&e.target.closest('.card');if(!c)return;
      var r=c.getBoundingClientRect();
      c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');
    });
  }

  /* active link in the navigation */
  var links={};
  document.querySelectorAll('.nav a').forEach(function(a){links[a.getAttribute('href').slice(1)]=a;});
  if('IntersectionObserver' in window){
    var so=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting)return;
        Object.keys(links).forEach(function(k){links[k].classList.toggle('active',k===e.target.id);});
      });
    },{rootMargin:'-40% 0px -55% 0px'});
    ['profil','taux','projets','parcours','competences','contact'].forEach(function(id){
      var s=document.getElementById(id);if(s)so.observe(s);
    });
  }
})();
