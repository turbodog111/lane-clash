export function initUI() {
  const menu = document.getElementById('menu');
  const play = document.getElementById('play');
  const ency = document.getElementById('ency');
  const log  = document.getElementById('log');

  const show = el => {
    [menu, play, ency, log].forEach(s => s.classList.add('hidden'));
    el.classList.remove('hidden');
    window.scrollTo(0, 0);
  };

  return {
    showMenu: () => show(menu),
    showPlay: () => show(play),
    showEncy: () => show(ency),
    showLog:  () => show(log),
  };
}
