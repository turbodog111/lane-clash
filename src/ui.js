export function initUI() {
  const menu = document.getElementById('menu');
  const play = document.getElementById('play');
  const ency = document.getElementById('ency');

  const show = el => {
    [menu, play, ency].forEach(s => s.classList.add('hidden'));
    el.classList.remove('hidden');
    window.scrollTo(0, 0);
  };

  return {
    showMenu: () => show(menu),
    showPlay: () => show(play),
    showEncy: () => show(ency),
  };
}
