(() => {
  'use strict';
  const articles = [...document.querySelectorAll('.client-work')];
  const hero = document.querySelector('.service-hero');
  if (hero && articles.length > 1) {
    const nav = document.createElement('nav');
    nav.className = 'collection-nav';
    nav.setAttribute('aria-label', 'Proyectos de esta colección');
    articles.forEach((article, index) => {
      if (!article.id) article.id = `coleccion-${index + 1}`;
      const heading = article.querySelector('.client-copy h2');
      if (!heading) return;
      const link = document.createElement('a');
      link.href = '#' + article.id;
      link.textContent = heading.textContent.trim();
      nav.appendChild(link);
    });
    hero.after(nav);
  }
  const back = document.createElement('a');
  back.className = 'collection-return';
  back.href = '../index.html#servicios';
  back.textContent = '← Volver a los proyectos seleccionados';
  document.querySelector('main')?.appendChild(back);
  // Complete keyboard navigation for the existing gallery dialog.
  const modal = document.querySelector('.service-lightbox');
  let lastTrigger = null;
  document.addEventListener('click', event => {
    const trigger = event.target.closest('.work-card img, .work-card video');
    if (trigger) lastTrigger = trigger;
  }, true);
  document.addEventListener('keydown', event => {
    if (event.target.matches('.work-card img, .work-card video')) lastTrigger = event.target;
    if (event.key !== 'Tab' || !modal?.classList.contains('is-open')) return;
    const focusable = [...modal.querySelectorAll('button, a[href], video[controls], [tabindex="0"]')].filter(el => el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (!first) return;
    if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {event.preventDefault(); last.focus();}
    else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {event.preventDefault(); first.focus();}
  });
  if (modal) {
    let wasOpen = modal.classList.contains('is-open');
    new MutationObserver(() => {
      const open = modal.classList.contains('is-open');
      if (wasOpen && !open && lastTrigger?.isConnected) lastTrigger.focus({preventScroll:true});
      wasOpen = open;
    }).observe(modal, {attributes:true, attributeFilter:['class']});
  }
})();
