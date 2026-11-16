'use strict';
(() => {
  const list = document.querySelector('#memory-checklist');
  if (!list) return;
  const boxes = [...list.querySelectorAll('input[type=checkbox]')];
  const count = document.querySelector('#memory-count');
  const progress = document.querySelector('#memory-progress');
  const note = document.querySelector('#memory-local');
  const key = 'sa-memory-card-v1';
  let remembered = [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) remembered = saved;
  } catch {}
  boxes.forEach(box => { box.checked = remembered.includes(box.value); });
  function display() {
    const total = boxes.filter(box => box.checked).length;
    progress.value = total;
    count.textContent = total + ' / ' + boxes.length + ' remembered';
  }
  list.addEventListener('change', () => {
    display();
    try {
      localStorage.setItem(key, JSON.stringify(boxes.filter(box => box.checked).map(box => box.value)));
    } catch {
      note.textContent = 'Saved for this visit only.';
    }
  });
  display();
  list.disabled = false;
})();
