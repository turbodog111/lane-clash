// Schola (class mode) content: built only from the class handouts.
// Two kinds of question:
//   open  – "name a ___" with many right answers, tiered by rarity (same format as prompts.js)
//   drill – a stream of items with one right answer each; tier = difficulty.
//           In item text, [brackets] mark the word being asked about.
// Each unit lists the handout(s) it came from.
(function (RA) {
  // ── Helpers ──────────────────────────────────────────────────────
  // Accept a case-use name on its own, with "of", or with the case name in front.
  function useAliases(caseName, names) {
    const out = [];
    for (const n of names) {
      out.push(n, 'of ' + n, caseName + ' of ' + n, caseName + ' ' + n);
    }
    return out.join('/');
  }

  // ── Case uses (Case_Uses.pdf) ────────────────────────────────────
  // [case, use names (first = shown), helper word(s) or '', example with [target], translation, tier]
  const USES = [
    ['nominative', ['subject'], '', '[puerī] currunt.', 'The boys are running.', 1],
    ['nominative', ['predicate nominative', 'predicate', 'predicate nom'], '', 'Caesar erat [cōnsul].', 'Caesar was consul.', 2],
    ['genitive', ['possession', 'possessive'], 'of', 'mātrēs [puellārum] adsunt.', 'The girls’ mothers are here.', 1],
    ['genitive', ['partitive', 'whole', 'partitive genitive'], 'of', 'pars [urbis] est pulchra.', 'Part of the city is beautiful.', 2],
    ['genitive', ['material'], 'of', 'flūmina [lactis]', 'rivers of milk', 3],
    ['genitive', ['quality'], 'of', 'vir [summae virtūtis]…', 'a man of the highest virtue', 3],
    ['genitive', ['objective', 'objective genitive'], 'of', 'noster timor [bellī] est magnus.', 'Our fear of the war is great.', 3],
    ['genitive', ['with causa', 'with gratia', 'causa', 'gratia', 'with gratia or causa', 'sake'], 'of', '[honōris] causā…', 'for the sake of honor…', 3],
    ['genitive', ['memory', 'remembering', 'with words of remembering'], 'of', 'veterisque memor [bellī]', 'mindful of the ancient war', 4],
    ['dative', ['indirect object', 'indirect'], 'to', '[equitibus] equōs dat.', 'He gives horses to the horsemen.', 1],
    ['dative', ['special adjectives', 'with special adjectives', 'special adjective'], 'to', 'tribūnī [nōbīs] sunt amīcī.', 'The tribunes are friendly to us.', 3],
    ['dative', ['possession', 'possessive'], 'for', 'nōmen [mihi] est…', 'My name is… (the name for me is…)', 2],
    ['dative', ['impersonal verbs', 'with impersonal verbs', 'impersonal'], 'for', 'licetne [mihi] īre?', 'May I go? (Is it allowed for me to go?)', 3],
    ['dative', ['reference'], 'for', 'mūtābō [tibi] fōrmam', 'I will change your form (the form for you).', 3],
    ['dative', ['double dative', 'purpose and reference', 'purpose'], 'for', '[reī pūblicae clādī] sunt.', 'They are a ruin to the state.', 4],
    ['dative', ['agent', 'dative of agent'], 'by', '[vōbīs] prōvincia est dēfendenda.', 'The province must be defended by you.', 3],
    ['dative', ['special verbs', 'with special verbs', 'special verb'], '', '[mihi] parcit atque īgnōscit.', 'He spares and pardons me.', 2],
    ['accusative', ['direct object', 'object'], '', '[exercitum] videō.', 'I see an army.', 1],
    ['accusative', ['duration of time', 'duration', 'extent of time', 'duration/extent of time'], 'for', '[duās hōrās] mānsit.', 'He waited (for) two hours.', 2],
    ['accusative', ['extent of space', 'space', 'extent'], 'for', '[tria mīlia] passuum cucurrī.', 'I ran (for) three miles.', 3],
    ['accusative', ['prepositions', 'with prepositions', 'certain prepositions', 'preposition'], '', 'Iūnōnis ob [īram]…', 'because of Juno’s wrath…', 2],
    ['accusative', ['place to which', 'motion toward', 'place to'], 'to', '[Rōmam] eō.', 'I’m going to Rome.', 2],
    ['accusative', ['respect'], '', '[caput] nectentur.', 'Their heads will be bound (with respect to the head).', 4],
    ['accusative', ['subject of indirect statement', 'indirect statement'], 'that', 'intellegō [tē] sapere.', 'I perceive that you are wise.', 3],
    ['accusative', ['exclamation'], '', '[mē miserum]!', 'Poor me!', 4],
    ['ablative', ['means', 'instrument', 'means or instrument', 'means/instrument'], 'by/with', '[gladiō] vulnerātus est.', 'He was wounded by a sword.', 1],
    ['ablative', ['manner'], 'with', 'id [magnō cum gaudiō] accēpit.', 'He received it with great joy.', 2],
    ['ablative', ['accompaniment'], 'with', 'vēnī [cum meīs amīcīs].', 'I came with my friends.', 2],
    ['ablative', ['prepositions', 'with prepositions', 'certain prepositions', 'preposition'], '', 'erat sub [scālā] dracō.', 'Under the ladder there was a serpent.', 2],
    ['ablative', ['personal agent', 'agent'], 'by', 'hoc factum est [ā Caesare].', 'This was done by Caesar.', 2],
    ['ablative', ['place where'], 'in', 'et [terrīs] iactātus et [altō]', 'tossed on both land and sea', 2],
    ['ablative', ['place from which', 'place from'], 'from', '[Rōmā] navigāmus.', 'We are sailing from Rome.', 2],
    ['ablative', ['separation'], 'from', '[sollicitūdine] līberāta sum', 'I was freed from my anxiety.', 3],
    ['ablative', ['time when'], 'at/on', '[tertiā hōrā] discessērunt.', 'They left at the third hour.', 2],
    ['ablative', ['time within which', 'time within'], 'in/within', '[tribus diēbus] discēdēmus.', 'We will leave within three days.', 3],
    ['ablative', ['comparison'], 'than', 'Catō est [Cicerōne] ēloquentior.', 'Cato is more eloquent than Cicero.', 2],
    ['ablative', ['degree of difference', 'degree'], 'by', '[aliquot] ante [annīs]', 'before by some years', 4],
    ['ablative', ['description'], 'of/with', 'mulierem [eximiā pulchritūdine]', 'a woman of rare beauty', 3],
    ['ablative', ['specification', 'respect'], 'in/with', '[virtūte] praecēdunt.', 'They excel in courage.', 3],
    ['ablative', ['cause'], 'because of', '[neglegentiā] plectimur.', 'We are chastised because of our negligence.', 3],
    ['ablative', ['ablative absolute', 'absolute'], 'with/having been', 'Caesar, [acceptīs litterīs], nūntium mittit.', 'With the letters having been received, Caesar sends a messenger.', 2],
    ['ablative', ['special adjectives', 'with special adjectives', 'special adjective'], '', 'vir [maiōribus] suīs dīgnissimus', 'a man most worthy of his ancestors', 4],
    ['ablative', ['special verbs', 'with special verbs', 'special verb'], '', '[aurō] hērōs potitur.', 'The hero takes the gold.', 4],
    ['vocative', ['direct address', 'address'], '', 'venī, [Lūcī], ad villam.', 'Come to the villa, Lucius.', 1],
    ['locative', ['place where'], 'at', '[Rōmae].', 'At Rome.', 3],
  ];
  const cap = (s) => s[0].toUpperCase() + s.slice(1);

  // Open prompt: "Name a use of the ___ case"
  function usesOfCase(caseNames, id, q, lvl) {
    const t = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const [c, names, , , , tier] of USES) {
      if (!caseNames.includes(c)) continue;
      const label = caseNames.length > 1 ? `${names[0]} (${c})` : names[0];
      t[tier].push([label, ...useAliases(c, names).split('/')].join('/'));
    }
    const out = {};
    for (const k in t) if (t[k].length) out[k] = t[k].join(', ');
    return { id, lvl, lang: 'en', cat: 'Casus (case uses)', q, t: out };
  }

  // Drill: identify the use of the bracketed word.
  const useDrill = {
    id: 's-casus-agnosce', kind: 'drill', lvl: 2, cat: 'Casus (case uses)',
    q: 'Name the case use of the [bracketed] word',
    items: USES.map(([c, names, , ex, tr, tier]) => ({
      q: `${ex}  “${tr}”`, sub: `${cap(c)}: which use?`, a: useAliases(c, names), show: `${c} of ${names[0]}`, tier,
    })),
  };

  // Drill: which case does this job?
  const UNIQUE = USES.filter(([c, names]) => !['possession', 'prepositions', 'special verbs', 'special adjectives', 'place where'].includes(names[0]));
  const caseDrill = {
    id: 's-casus-quis', kind: 'drill', lvl: 1, cat: 'Casus (case uses)',
    q: 'Which case does this job?',
    items: [
      ...UNIQUE.map(([c, names, , ex, , tier]) => ({ q: `${cap(names[0])}, as in ${ex.replace(/[\[\]]/g, '')}`, a: c + (c === 'ablative' ? '/abl' : c === 'accusative' ? '/acc' : c === 'genitive' ? '/gen' : c === 'dative' ? '/dat' : c === 'nominative' ? '/nom' : c === 'vocative' ? '/voc' : '/loc'), show: c, tier: Math.max(1, tier - 1) })),
      { q: 'Possession with sum, esse (nōmen mihi est)', a: 'dative/dat', show: 'dative', tier: 3 },
      { q: 'Possession with OF or -’S', a: 'genitive/gen', show: 'genitive', tier: 1 },
      { q: 'Place where, for cities, towns, small islands, domus, humus, rūs', a: 'locative/loc', show: 'locative', tier: 3 },
      { q: 'Special verbs potior, ūtor, fruor, fungor, vēscor', a: 'ablative/abl', show: 'ablative', tier: 3 },
      { q: 'Special verbs like imperō, pāreō, placeō', a: 'dative/dat', show: 'dative', tier: 2 },
      { q: 'Special adjectives like amīcus, cārus, similis', a: 'dative/dat', show: 'dative', tier: 3 },
      { q: 'Special adjectives like dignus', a: 'ablative/abl', show: 'ablative', tier: 4 },
    ],
  };

  // Drill: the English helper word from the handout's middle column.
  const helperDrill = {
    id: 's-casus-verba', kind: 'drill', lvl: 2, cat: 'Casus (case uses)',
    q: 'Give the English helper word',
    items: USES.filter(([, , h]) => h).map(([c, names, h, , , tier]) => {
      const forms = h.split('/');
      return { q: `${cap(c)} of ${names[0]}`, a: [h, ...forms, forms.join(' or '), forms.join(' ')].join('/'), show: h.toUpperCase().replace('/', ' / '), tier };
    }),
  };

  // ── Declension endings (Declension_Endings_Chart.pdf) ────────────
  const CASES = ['nominative', 'genitive', 'dative', 'accusative', 'ablative', 'vocative'];
  // [declension label, gender, singular endings, plural endings, base tier]; '*' = varies (skipped)
  const DECL = [
    ['1st', 'feminine', ['a', 'ae', 'ae', 'am', 'ā', 'a'], ['ae', 'ārum', 'īs', 'ās', 'īs', 'ae'], 1],
    ['2nd', 'masculine', ['us/r', 'ī', 'ō', 'um', 'ō', 'e'], ['ī', 'ōrum', 'īs', 'ōs', 'īs', 'ī'], 1],
    ['2nd', 'neuter', ['um', 'ī', 'ō', 'um', 'ō', 'um'], ['a', 'ōrum', 'īs', 'a', 'īs', 'a'], 1],
    ['3rd', 'masculine/feminine', ['*', 'is', 'ī', 'em', 'e', '*'], ['ēs', 'um/ium', 'ibus', 'ēs', 'ibus', 'ēs'], 2],
    ['3rd', 'neuter', ['*', 'is', 'ī', '*', 'e/ī', '*'], ['a/ia', 'um/ium', 'ibus', 'a/ia', 'ibus', 'a/ia'], 2],
    ['4th', 'masculine', ['us', 'ūs', 'uī', 'um', 'ū', 'us'], ['ūs', 'uum', 'ibus', 'ūs', 'ibus', 'ūs'], 3],
    ['4th', 'neuter', ['ū', 'ūs', 'ū', 'ū', 'ū', 'ū'], ['ua', 'uum', 'ibus', 'ua', 'ibus', 'ua'], 3],
    ['5th', 'feminine', ['ēs', 'eī', 'eī', 'em', 'ē', 'ēs'], ['ēs', 'ērum', 'ēbus', 'ēs', 'ēbus', 'ēs'], 3],
  ];
  const endingItems = [];
  for (const [d, g, sg, pl, base] of DECL) {
    [[sg, 'singular'], [pl, 'plural']].forEach(([arr, num]) => arr.forEach((end, ci) => {
      if (end === '*') return;
      const forms = end.split('/');
      let tier = base + (ci === 2 || ci === 4 || ci === 5 ? 1 : 0) + (num === 'plural' && base >= 3 ? 1 : 0) + (d === '4th' && g === 'neuter' ? 1 : 0);
      if (d === '2nd' && g === 'masculine' && ci === 5 && num === 'singular') tier = 3;
      endingItems.push({
        q: `${d} declension (${g}) · ${CASES[ci]} ${num}`,
        a: forms.flatMap((f) => [f, '-' + f]).join('/'),
        show: forms.map((f) => '-' + f).join(' / '),
        tier: Math.min(5, tier),
        note: d === '2nd' && g === 'masculine' && ci === 5 && num === 'singular' ? '-us → -e; -ius → -ī; -r → -r' : '',
      });
    }));
  }
  const endingDrill = { id: 's-terminationes', kind: 'drill', lvl: 1, cat: 'Declinationes (declensions)', q: 'Give the ending', items: endingItems };

  const genderDrill = {
    id: 's-decl-genus', kind: 'drill', lvl: 1, cat: 'Declinationes (declensions)', q: 'Usual gender of this declension',
    items: [
      { q: '1st declension', a: 'feminine/f/fem', show: 'feminine (with exceptions)', tier: 1 },
      { q: '2nd declension ending in -us or -r', a: 'masculine/m/masc', show: 'masculine', tier: 1 },
      { q: '2nd declension ending in -um', a: 'neuter/n/neut', show: 'neuter', tier: 1 },
      { q: '4th declension ending in -us', a: 'masculine/m/masc', show: 'masculine (with exceptions)', tier: 2 },
      { q: '4th declension ending in -ū', a: 'neuter/n/neut', show: 'neuter', tier: 3 },
      { q: '5th declension', a: 'feminine/f/fem', show: 'feminine (with exceptions)', tier: 2 },
    ],
  };

  const declOpen = {
    id: 's-decl-gen-pl', lvl: 2, lang: 'la', exact: true, cat: 'Declinationes (declensions)', q: 'Name any genitive plural ending', note: 'any declension, with or without the hyphen',
    t: { 1: 'ārum/-ārum, ōrum/-ōrum', 2: 'um/-um', 3: 'ium/-ium', 4: 'ērum/-ērum', 5: 'uum/-uum' },
  };
  const dativePl = {
    id: 's-decl-dat-pl', lvl: 2, lang: 'la', exact: true, cat: 'Declinationes (declensions)', q: 'Name any dative or ablative plural ending', note: 'any declension',
    t: { 1: 'īs/-īs', 2: 'ibus/-ibus', 4: 'ēbus/-ēbus' },
  };

  // ── Adjectives (Adjectives_Handout.pdf) ──────────────────────────
  // [positive m., comparative m., comparative n., superlative m., adverb, comp. adverb, superl. adverb, declension]
  const ADJ = [
    ['saevus', 'saevior', 'saevius', 'saevissimus', 'saevē', 'saevius', 'saevissimē', '1st/2nd'],
    ['antīquus', 'antīquior', 'antīquius', 'antīquissimus', '', '', '', '1st/2nd'],
    ['fessus', 'fessior', 'fessius', 'fessissimus', 'fessē', '', '', '1st/2nd'],
    ['certus', 'certior', 'certius', 'certissimus', 'certē/certō', 'certius', 'certissimē', '1st/2nd'],
    ['clārus', 'clārior', 'clārius', 'clārissimus', 'clārē', 'clārius', 'clārissimē', '1st/2nd'],
    ['aeger', 'aegrior', 'aegrius', 'aegerrimus', 'aegrē', '', '', '1st/2nd'],
    ['trīstis', 'trīstior', 'trīstius', 'trīstissimus', '', '', '', '3rd'],
    ['ācer', 'ācrior', 'ācrius', 'ācerrimus', 'ācriter', 'ācrius', 'ācerrimē', '3rd'],
    ['potēns', 'potentior', 'potentius', 'potentissimus', 'potenter', '', '', '3rd'],
    ['brevis', 'brevior', 'brevius', 'brevissimus', 'breviter', 'brevius', 'brevissimē', '3rd'],
    ['fortis', 'fortior', 'fortius', 'fortissimus', 'fortiter', 'fortius', 'fortissimē', '3rd'],
    ['sapiēns', 'sapientior', 'sapientius', 'sapientissimus', 'sapienter', 'sapientius', 'sapientissimē', '3rd'],
  ];
  const degreeItems = [];
  for (const [pos, comp, compN, sup] of ADJ) {
    degreeItems.push({ q: `Comparative of ${pos} (masculine nominative singular)`, a: comp, tier: pos.endsWith('er') ? 3 : 2 });
    degreeItems.push({ q: `Comparative of ${pos} (neuter nominative singular)`, a: compN, tier: 3 });
    degreeItems.push({ q: `Superlative of ${pos} (masculine nominative singular)`, a: sup, tier: sup.endsWith('rrimus') ? 4 : 2 });
  }
  degreeItems.push(
    { q: 'Superlative of ācer, feminine (silva ___)', a: 'ācerrima', tier: 4 },
    { q: 'Superlative of ācer, neuter (mare ___)', a: 'ācerrimum', tier: 4 },
    { q: 'montēs saevī → montēs ___ (comparative)', a: 'saeviōrēs', tier: 3 },
    { q: 'montēs trīstēs → montēs ___ (comparative)', a: 'trīstiōrēs', tier: 3 },
    { q: 'montēs saevī → montēs ___ (superlative)', a: 'saevissimī', tier: 3 },
    { q: 'montēs trīstēs → montēs ___ (superlative)', a: 'trīstissimī', tier: 3 },
  );
  const degreeDrill = { id: 's-gradus-adi', kind: 'drill', lvl: 2, cat: 'Adiectīva (adjectives)', q: 'Form the degree', items: degreeItems };

  const adjFacts = {
    id: 's-adi-regulae', kind: 'drill', lvl: 1, cat: 'Adiectīva (adjectives)', q: 'Fill in the rule',
    items: [
      { q: 'An adjective must agree with its noun in case, number, and ___.', a: 'gender', tier: 1 },
      { q: 'Dracōnēs antīquī et fātālēs: all three words are nominative, plural, and ___.', a: 'masculine/m', tier: 2 },
      { q: '3rd-declension adjectives take the endings of which kind of 3rd-declension noun?', a: 'i-stem/i stem/istem/i-stems/istems', show: 'i-stem', tier: 3 },
      { q: 'All 3rd-declension adjectives end in ___ in the ablative singular.', a: 'ī/-ī/i', show: '-ī', tier: 3 },
      { q: 'Comparative suffix, masculine/feminine nominative singular', a: 'ior/-ior', show: '-ior', tier: 2 },
      { q: 'Comparative suffix, neuter nominative singular', a: 'ius/-ius', show: '-ius', tier: 3 },
      { q: 'Superlative suffix, masculine nominative singular', a: 'issimus/-issimus', show: '-issimus', tier: 2 },
      { q: 'Alternate superlative suffix for adjectives ending in -r', a: 'rrimus/-rrimus/errimus/-errimus', show: '-rrimus', tier: 4 },
      { q: 'Alternate superlative suffix for adjectives ending in -l', a: 'llimus/-llimus', show: '-llimus', tier: 5 },
      { q: 'In the comparative degree, every adjective becomes which declension?', a: '3rd/third/3', show: '3rd', tier: 2 },
      { q: 'In the superlative degree, every adjective becomes which declension?', a: '1st/2nd/1st and 2nd/first and second/first/second/12/1st2nd', show: '1st/2nd', tier: 2 },
      { q: 'Comparative adjectives are the only 3rd-declension adjectives that are NOT ___.', a: 'i-stems/i-stem/istem/istems/i stems', show: 'i-stems', tier: 4 },
      { q: 'quam + comparative means…', a: 'than', tier: 2 },
      { q: 'quam + superlative means “as ___ as possible.” Type the phrase.', a: 'as as possible/as possible/as ___ as possible', show: 'as ___ as possible', tier: 3 },
      { q: 'Nickname for adjectives with an -īus genitive and -ī dative', a: 'nasty nine/the nasty nine', show: 'the Nasty Nine', tier: 4 },
      { q: 'ācer, ācris, ācre has how many nominative singular endings?', a: 'three/3', tier: 2 },
      { q: 'trīstis, -e has how many nominative singular endings?', a: 'two/2', tier: 2 },
      { q: 'potēns has how many nominative singular endings?', a: 'one/1', tier: 2 },
      { q: 'Montēs trīstiōrēs ___ silvae sunt. (than)', a: 'quam', tier: 2 },
      { q: 'Saurōn montēs ___ trīstissimōs fēcit. (as gloomy as possible)', a: 'quam', tier: 3 },
    ],
  };

  // ── Adverbs (Adverbs_Handout_Full.pdf) ───────────────────────────
  const advItems = [];
  for (const [pos, , , , adv, compAdv, supAdv, decl] of ADJ) {
    if (adv) advItems.push({ q: `Adverb from ${pos}`, a: adv, show: adv.replace('/', ' or '), tier: decl === '3rd' ? 2 : 1 });
    if (compAdv) advItems.push({ q: `Comparative adverb: ${adv.split('/')[0]} → ___`, a: compAdv, tier: 3 });
    if (supAdv) advItems.push({ q: `Superlative adverb: ${adv.split('/')[0]} → ___`, a: supAdv, tier: supAdv.includes('rrim') ? 4 : 3 });
  }
  advItems.push(
    { q: 'Adverbs from 1st/2nd-declension adjectives usually add ___ to the stem.', a: 'ē/-ē/e', show: '-ē (sometimes -ō)', tier: 2 },
    { q: 'Adverbs from 3rd-declension adjectives usually add ___ to the stem.', a: 'iter/-iter/ter/-ter/iter or ter/-iter or -ter', show: '-iter or -ter', tier: 2 },
    { q: 'Comparative adverbs use the same ending as the neuter comparative adjective: ___', a: 'ius/-ius', show: '-ius', tier: 3 },
    { q: 'Superlative adverbs add ___ to the superlative suffix.', a: 'ē/-ē/e', show: '-ē', tier: 3 },
    { q: '…et lūcēns sōl ___ ēlūcēbit. (more brightly)', a: 'clārius', tier: 3 },
  );
  const advDrill = { id: 's-adverbia', kind: 'drill', lvl: 2, cat: 'Adverbia (adverbs)', q: 'Form the adverb', items: advItems };

  const adjOpen = {
    id: 's-adi-nomina', lvl: 1, lang: 'la', cat: 'Adiectīva (adjectives)', q: 'Name a Latin adjective from the Adjectives or Adverbs handouts', note: 'positive degree, masculine nominative singular',
    t: {
      1: 'fortis, magnus, brevis, certus',
      2: 'saevus, trīstis, ācer, potēns, antīquus, clārus, sapiēns, novus',
      3: 'fātālis, fessus, aeger, summus, dignus, pulcher',
      4: 'pretiōsus, eximius, memor, similis, cārus, amīcus, ēloquēns',
      5: 'vetus, noster, meus',
    },
  };
  const formsOpen = {
    id: 's-gradus-formae', lvl: 3, lang: 'la', exact: true, cat: 'Adiectīva (adjectives)', q: 'Name a comparative or superlative form that appears in the handouts',
    t: {
      1: 'fortius, fortissimē, certius, certissimē',
      2: 'saeviōrēs, trīstiōrēs, saevissimī, trīstissimī, clārius',
      3: 'ācerrimus, ācerrima, ācerrimum, trīstissimōs',
      4: 'ēloquentior, dīgnissimus',
      5: 'maiōribus',
    },
  };

  // ── Special verbs / adjectives / locative (Case_Uses.pdf) ────────
  const ablVerbs = {
    id: 's-verba-abl', lvl: 2, lang: 'la', cat: 'Casus (case uses)', q: 'Name a special verb that takes the ablative', note: 'first person or infinitive',
    t: { 1: 'ūtor/ūtī', 2: 'fruor/fruī, potior/potīrī', 3: 'fungor/fungī', 4: 'vēscor/vēscī' },
  };
  const datVerbs = {
    id: 's-verba-dat', lvl: 2, lang: 'la', cat: 'Casus (case uses)', q: 'Name a verb from the handout that takes the dative', note: 'special, impersonal, or compound verbs',
    t: {
      1: 'imperō/impero/imperāre, pāreō/pareo/pārēre, placeō/placeo/placēre',
      2: 'parcō/parco/parcere, licet',
      3: 'īgnōscō/ignosco/īgnōscere/ignoscere, prōsum/prosum/prōdesse/prodesse, decet',
      4: 'praeficiō/praeficio/praeficere, libet, cōnsentiō/consentio/cōnsentīre',
    },
  };
  const locOpen = {
    id: 's-locativus', lvl: 3, lang: 'en', cat: 'Casus (case uses)', q: 'Name something that takes the locative', note: 'kinds of place, or the special nouns',
    t: { 1: 'cities/city', 2: 'towns/town', 3: 'small islands/small island/islands', 4: 'domus, rūs/rus', 5: 'humus' },
  };
  const datAdj = {
    id: 's-adi-dat', lvl: 2, lang: 'la', cat: 'Casus (case uses)', q: 'Name an adjective that takes a special case (dative or ablative)', note: 'from the Case Uses handout',
    t: { 1: 'amīcus', 2: 'cārus, similis', 3: 'dignus' },
  };

  RA.SCHOLA_UNITS = [
    {
      id: 'casus', title: 'Case uses', la: 'Casus', src: ['Case_Uses.pdf'],
      prompts: [
        usesOfCase(['ablative'], 's-usus-abl', 'Name a use of the ablative case', 1),
        usesOfCase(['dative'], 's-usus-dat', 'Name a use of the dative case', 1),
        usesOfCase(['genitive'], 's-usus-gen', 'Name a use of the genitive case', 1),
        usesOfCase(['accusative'], 's-usus-acc', 'Name a use of the accusative case', 1),
        usesOfCase(['nominative', 'vocative', 'locative'], 's-usus-nvl', 'Name a use of the nominative, vocative, or locative', 2),
        useDrill, caseDrill, helperDrill, ablVerbs, datVerbs, locOpen, datAdj,
      ],
    },
    {
      id: 'declinationes', title: 'Declension endings', la: 'Declinationes', src: ['Declension_Endings_Chart.pdf', 'Declension_Endings_Chart_Blank.pdf'],
      prompts: [endingDrill, genderDrill, declOpen, dativePl],
    },
    {
      id: 'adiectiva', title: 'Adjectives', la: 'Adiectīva', src: ['Adjectives_Handout.pdf'],
      prompts: [adjFacts, degreeDrill, adjOpen, formsOpen],
    },
    {
      id: 'adverbia', title: 'Adverbs', la: 'Adverbia', src: ['Adverbs_Handout_Full.pdf'],
      prompts: [advDrill],
    },
  ];
})(window.RA = window.RA || {});
