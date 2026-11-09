// Enemies, their rules, and the gifts of the gods (run-only upgrades).
(function (RA) {
  // Rules are what make each enemy fight differently. Several can stack deeper down.
  RA.RULES = {
    fury:     { label: 'Swift',      text: 'Strikes far more often, but is frail.' },
    harpy:    { label: 'Greedy',     text: 'Vulgaris (common) answers feed it instead of hurting it.' },
    echo:     { label: 'Echoing',    text: 'Immune to any answer you gave in an earlier descent.' },
    sphinx:   { label: 'Riddling',   text: 'Each answer must come later in the alphabet than your last.' },
    gorgo:    { label: 'Petrifying', text: 'The question turns to stone after 4 seconds. Press ↑ to glance back (costs 2s).' },
    tantalus: { label: 'Reaching',   text: 'Each answer must be longer than your last. Resets whenever he strikes.' },
    toll:     { label: 'The Toll',   text: 'Only Rarus (rare) or rarer answers pay the ferryman.' },
    judge:    { label: 'Judgement',  text: 'Every answer must begin with a letter you have not yet used in this fight.' },
    heads:    { label: 'Three Heads', text: 'Three questions at once. Each head has its own life and its own bite.' },
  };

  RA.ENEMIES = {
    umbra:    { name: 'Umbra',    en: 'a shade of the dead', rules: [], min: 1, hp: 1.0, speed: 1.0,
                line: 'A shade drifts out of the dark. It wants only to be remembered.' },
    furia:    { name: 'Furia',    en: 'a Fury',              rules: ['fury'], min: 2, hp: 0.75, speed: 0.62,
                line: 'Tisiphone’s sister, torch raised. She will not wait for you to think.' },
    harpyia:  { name: 'Harpyia',  en: 'a Harpy',             rules: ['harpy'], min: 3, hp: 1.0, speed: 1.0,
                line: 'Celaeno’s kin. Feed her nothing common.' },
    echo:     { name: 'Echo',     en: 'the nymph who can only repeat', rules: ['echo'], min: 4, hp: 0.9, speed: 1.0,
                line: 'Echo. She can only say what has been said before. Say something new.' },
    sphinx:   { name: 'Sphinx',   en: 'the riddler',         rules: ['sphinx'], min: 6, hp: 0.9, speed: 1.1,
                line: 'The Sphinx wants order. A, then B, then C. Never back.' },
    gorgo:    { name: 'Gorgo',    en: 'a Gorgon',            rules: ['gorgo'], min: 7, hp: 1.0, speed: 1.0,
                line: 'Do not look at her for long. Read fast, then answer from memory.' },
    tantalus: { name: 'Tantalus', en: 'the one who reaches', rules: ['tantalus'], min: 8, hp: 0.95, speed: 1.0,
                line: 'Tantalus, forever reaching. Each word must stretch past the last.' },
    // Bosses (every fifth floor)
    cerberus: { name: 'Cerberus', en: 'the three-headed hound', rules: ['heads'], boss: true, hp: 1.0, speed: 1.15,
                line: 'Cerberus. I have no drugged honey-cake for him this time. Three heads, three questions.' },
    charon:   { name: 'Charon',   en: 'the ferryman',        rules: ['toll'], boss: true, hp: 1.0, speed: 1.0,
                line: 'The ferryman. He takes no common coin. Pay him in rare words.' },
    minos:    { name: 'Minos',    en: 'judge of the dead',   rules: ['judge'], boss: true, hp: 1.0, speed: 1.0,
                line: 'Minos shakes his urn and weighs every word. He will not hear the same first letter twice.' },
  };
  RA.BOSS_ORDER = ['cerberus', 'charon', 'minos'];

  // Gifts of the gods. Offered three at a time after each floor.
  // unique: can be taken only once. heal: immediate effect instead of a lasting gift.
  RA.BOONS = {
    mercurius: { god: 'Mercurius', title: 'Winged Sandals', text: 'Answers within 3s of your previous answer deal +50%.' },
    minerva:   { god: 'Minerva',   title: 'Owl’s Insight',  text: 'Rarus and rarer answers deal +40%.' },
    ianus:     { god: 'Ianus',     title: 'Two Faces',      text: 'An answer that starts with the last letter of your previous answer deals double.' },
    vulcanus:  { god: 'Vulcanus',  title: 'Short Hammer',   text: 'Answers of five letters or fewer deal +60%.' },
    saturnus:  { god: 'Saturnus',  title: 'Slow Time',      text: 'Enemies strike 20% less often.' },
    fortuna:   { god: 'Fortuna',   title: 'The Wheel',      text: 'Every hit deals between half and two-and-a-half times its damage.', unique: true },
    mars:      { god: 'Mars',      title: 'Battle Rhythm',  text: 'Every 4th valid answer in a row deals 2.5×.' },
    iuno:      { god: 'Iuno',      title: 'Queen’s Aegis',  text: 'Block the first strike of every floor.' },
    apollo:    { god: 'Apollo',    title: 'Augury',         text: 'Each new question comes with a free hint.', unique: true },
    diana:     { god: 'Diana',     title: 'First Arrow',    text: 'Your first answer to each question deals double.' },
    pluto:     { god: 'Pluto',     title: 'Wealth Below',   text: 'Vulgaris answers deal nothing; every other answer deals +60%.', unique: true },
    vesta:     { god: 'Vesta',     title: 'Hearth-fire',    text: 'Rarus and rarer answers restore 3 Anima.' },
    ceres:     { god: 'Ceres',     title: 'Harvest',        text: '+25 maximum Anima, and restore 25 now.' },
    bacchus:   { god: 'Bacchus',   title: 'Blind Wine',     text: 'All damage +35%, but you can no longer see what you type.', unique: true },
    neptunus:  { god: 'Neptunus',  title: 'Calm Waters',    text: 'Wrong answers no longer hurry the enemy.', unique: true },
    proserpina:{ god: 'Proserpina',title: 'Pomegranate',    text: 'Gain one Golden Bough: you return once from death.', unique: false },
    sibylla:   { god: 'Sibylla',   title: 'Three Leaves',   text: 'Gain three Sibyl’s leaves (hints).' },
    requies:   { god: 'Somnus',    title: 'Rest',           text: 'Restore 40 Anima.', heal: true },
  };
})(window.RA = window.RA || {});
