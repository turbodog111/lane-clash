export function initUI(){
  const menu = document.getElementById('menu');
  const play = document.getElementById('play');
  const ency = document.getElementById('ency');
  const log  = document.getElementById('log');

  function only(s){
    for (const el of [menu, play, ency, log]) el.classList.add('hidden');
    s.classList.remove('hidden');
  }
  return {
    showMenu(){ only(menu); },
    showPlay(){ only(play); },
    showEncy(){ only(ency); },
    showLog(){ only(log); },
  };
}
