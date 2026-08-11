(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- scroll parallax on hero layers ---- */
  const roots = document.querySelectorAll('[data-parallax-root]');
  if(!reduceMotion && roots.length){
    let ticking = false;
    function update(){
      roots.forEach(root => {
        if(root.offsetParent === null) return;
        const rect = root.getBoundingClientRect();
        if(rect.bottom < 0 || rect.top > window.innerHeight) return;
        const span = window.innerHeight + rect.height;
        const progress = 1 - Math.min(Math.max((rect.top + rect.height / 2) / span, 0), 1);
        root.querySelectorAll('[data-speed]').forEach(layer => {
          const speed = parseFloat(layer.dataset.speed) || 0;
          const shift = (progress - 0.5) * speed * 120;
          layer.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
        });
      });
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if(!ticking){ requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    document.addEventListener('DOMContentLoaded', update);
    update();
  }

  /* ---- reveal-on-scroll ---- */
  const revealItems = document.querySelectorAll('.reveal');
  if(revealItems.length){
    if(reduceMotion || !('IntersectionObserver' in window)){
      revealItems.forEach(el => el.classList.add('in-view'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
      revealItems.forEach(el => io.observe(el));
    }
  }
})();
