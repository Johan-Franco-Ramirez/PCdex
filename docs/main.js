(function(){
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const N = 60;
  function resize(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
  resize(); window.addEventListener('resize', resize);
  class P {
    constructor(){
      this.x = Math.random()*W; this.y = Math.random()*H;
      this.vx = (Math.random()-.5)*.3; this.vy = (Math.random()-.5)*.3;
      this.r = Math.random()*1.5+.5;
      this.alpha = Math.random()*.4+.1;
    }
    update(){
      this.x += this.vx; this.y += this.vy;
      if(this.x<0||this.x>W) this.vx*=-1;
      if(this.y<0||this.y>H) this.vy*=-1;
    }
    draw(){
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(37,99,235,${this.alpha})`; ctx.fill();
    }
  }
  for(let i=0;i<N;i++) particles.push(new P());
  function drawLines(){
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<120){
          ctx.beginPath();
          ctx.moveTo(particles[i].x,particles[i].y);
          ctx.lineTo(particles[j].x,particles[j].y);
          ctx.strokeStyle=`rgba(37,99,235,${.12*(1-d/120)})`;
          ctx.lineWidth=.5; ctx.stroke();
        }
      }
    }
  }
  function loop(){
    ctx.clearRect(0,0,W,H);
    particles.forEach(p=>{ p.update(); p.draw(); });
    drawLines(); requestAnimationFrame(loop);
  }
  loop();
})();
 
/* ── Scroll reveal ── */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); } });
},{ threshold: .1 });
revealEls.forEach(el=>io.observe(el));
 
/* ── Nav scroll shadow ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll',()=>{
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});
 
/* ── Counter animation for stats ── */
function animateCounter(el, target, suffix=''){
  const dur = 1200; const start = performance.now();
  const isDecimal = String(target).includes('.');
  function step(now){
    const t = Math.min((now-start)/dur,1);
    const ease = 1-Math.pow(1-t,3);
    const val = Math.round(ease*target);
    el.textContent = val + suffix;
    if(t<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const statsObs = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const nums = e.target.querySelectorAll('.stat-num');
      nums.forEach(n=>{
        const raw = n.textContent.trim();
        if(raw.endsWith('%')) animateCounter(n, parseInt(raw), '%');
        else if(raw.endsWith('+')) animateCounter(n, parseInt(raw), '+');
        else animateCounter(n, parseInt(raw), '');
      });
      statsObs.unobserve(e.target);
    }
  });
},{ threshold:.5 });
const heroStats = document.querySelector('.hero-stats');
if(heroStats) statsObs.observe(heroStats);