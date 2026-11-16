'use strict';
(() => {
  const root = document.querySelector('#postcards');
  if (!root) return;
  const links = [...root.querySelectorAll('[data-postcard]')];
  const cards = links.map(link => document.getElementById(link.dataset.postcard));
  const nav = root.querySelector('.postcard-choices');
  nav.setAttribute('role', 'tablist');
  links.forEach((link, index) => {
    link.id = 'postcard-tab-' + index;
    link.setAttribute('role', 'tab');
    link.setAttribute('aria-controls', cards[index].id);
    cards[index].setAttribute('role', 'tabpanel');
    cards[index].setAttribute('aria-labelledby', link.id);
    cards[index].tabIndex = 0;
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      show(index);
    });
    link.addEventListener('keydown', event => {
      if(event.key===' '){event.preventDefault();show(index);return;}
      const next = {ArrowLeft:(index+links.length-1)%links.length,ArrowRight:(index+1)%links.length,Home:0,End:links.length-1}[event.key];
      if(next===undefined)return;
      event.preventDefault();
      show(next);
      links[next].focus();
    });
  });
  function show(index) {
    links.forEach((link, i) => {
      link.setAttribute('aria-selected', String(i===index));
      link.tabIndex = i===index ? 0 : -1;
      cards[i].hidden = i!==index;
    });
  }
  function fromHash(){
    const index=cards.findIndex(card=>'#'+card.id===location.hash);
    if(index>=0)show(index);
  }
  show(0);
  fromHash();
  window.addEventListener('hashchange',fromHash);
})();
