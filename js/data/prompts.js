// Prompt bank.
// Each prompt lists accepted answers grouped by rarity tier (1 = common … 5 = one in a million).
// Within a tier: answers are comma-separated; "/" separates accepted spellings (the first is shown).
// Matching ignores case, accents/macrons, spaces and punctuation, and treats j=i and v=u.
// lvl: 1 = early floors, 2 = middle, 3 = deep.   lang: 'la' answers in Latin, 'en' answers in English.
// gen: 'v1' / 'v2' auto-accepts the infinitive (amo → amare, moneo → monere; deponents too).
(function (RA) {
  RA.PROMPT_SRC = [
    // ───────────────────────── Level 1 ─────────────────────────
    {
      id: 'animalia', lvl: 1, lang: 'la', cat: 'Animalia', q: 'Name an animal, in Latin',
      t: {
        1: 'canis, equus, feles/felis, lupus, leo, avis, piscis, ursus',
        2: 'vacca, porcus, sus, ovis, capra, mus, serpens, anguis, aquila, taurus, asinus, columba, corvus, cervus, vulpes, elephantus/elephas, apis, gallus, bos, agnus',
        3: 'simia, formica, aranea, delphinus/delphin, balaena, anser, gallina, anas, lepus, cuniculus, tigris, camelus, testudo, rana, lacerta, aper, pavo, cygnus, olor, passer, musca, noctua, bubo, mulus, aries, vitulus, catulus, vermis, cancer, scorpio/scorpius',
        4: 'hirundo, luscinia, vespertilio, cochlea, locusta, papilio, lynx, panthera, hyaena, crocodilus, psittacus, turdus, merula, accipiter, vultur, grus, ardea, mustela, talpa, castor, glis, erinaceus, hircus, haedus, iuvencus, cicada, ciconia, cornix, pica, milvus, alauda',
        5: 'struthiocamelus, sciurus, graculus, phoca, ichneumon, onager, coturnix, perdix, upupa, salamandra, polypus, sepia, muraena, mullus, ostrea, fringilla, hippopotamus, rhinoceros, camelopardalis',
      },
    },
    {
      id: 'corpus', lvl: 1, lang: 'la', cat: 'Corpus', q: 'Name a part of the body, in Latin',
      t: {
        1: 'caput, manus, pes, oculus, cor, os, auris, nasus, dens',
        2: 'lingua, bracchium/brachium, crus, digitus, collum, venter, umerus/humerus, capillus, frons, genu, pectus, tergum, dorsum, sanguis, cutis, facies, barba, labrum, palma',
        3: 'cervix, crinis, unguis, iecur, femur, cubitum, talus, calx, mentum, gena, supercilium, pulmo, stomachus, cerebrum, ren/renes, viscera, nervus, musculus, costa, latus, coxa, sura, pollex, vultus, mamma, umbilicus, vena',
        4: 'iugulum, palatum, guttur, fauces, lacertus, poples, tibia, axilla, lien, vesica, intestinum, medulla, pupula, palpebra, tempora, articulus, nates, clunes, maxilla, cartilago',
        5: 'occiput, sinciput, praecordia, ilia, inguen',
      },
    },
    {
      id: 'dei', lvl: 1, lang: 'la', cat: 'Di Immortales', q: 'Name a Roman god or goddess', note: 'Latin or English names',
      t: {
        1: 'Iuppiter/Iupiter/Jupiter/Jove, Iuno/Juno, Venus, Mars, Neptunus/Neptune, Minerva, Apollo, Mercurius/Mercury, Diana, Cupido/Cupid',
        2: 'Vulcanus/Vulcan, Vesta, Ceres, Bacchus, Pluto, Saturnus/Saturn, Ianus/Janus, Proserpina/Proserpine, Aurora, Sol, Luna, Fortuna',
        3: 'Faunus, Flora, Pomona, Liber, Dis/Dis Pater, Terminus, Victoria, Bellona, Quirinus, Somnus, Mors, Nox, Ops, Tellus/Terra Mater, Orcus, Lares, Penates, Genius, Silvanus, Fides, Concordia, Pax, Spes, Salus, Iuventas/Juventas, Aesculapius',
        4: 'Vertumnus, Portunus, Pales, Consus, Fauna, Bona Dea, Carmenta, Egeria, Pietas, Virtus, Honos, Febris, Libertas, Feronia, Robigus, Picus, Volturnus, Tiberinus, Laverna, Lucina, Cardea, Larunda, Libitina, Angerona, Furrina, Vacuna',
        5: 'Cloacina, Sterquilinus, Rumina, Cunina, Abeona, Adeona, Forculus, Limentinus, Pilumnus, Picumnus, Fornax, Mena, Nundina, Mefitis',
      },
    },
    {
      id: 'locutiones', lvl: 1, lang: 'en', cat: 'Locutiones', q: 'Name a Latin phrase still used in English',
      t: {
        1: 'et cetera/etcetera/etc, exempli gratia/eg, id est/ie, vice versa, carpe diem, per se, ad hoc, status quo, alma mater, et al/et alii/et alia, ante meridiem/am, post meridiem/pm',
        2: 'bona fide, quid pro quo, de facto, ad nauseam, mea culpa, persona non grata, terra firma, magnum opus, non sequitur, in vitro, per capita, pro bono, ad infinitum, memento mori, post mortem, curriculum vitae/cv, veni vidi vici, e pluribus unum, summa cum laude, cum laude, in situ, modus operandi, per annum, per diem, prima facie, ad libitum/ad lib, alter ego, anno domini, rigor mortis, et tu brute, tempus fugit, in memoriam, ad astra, alea iacta est/alea jacta est',
        3: 'tabula rasa, sine qua non, caveat emptor, habeas corpus, ad hominem, deus ex machina, ex post facto, in absentia, in loco parentis, magna cum laude, mutatis mutandis, ceteris paribus, quod erat demonstrandum/qed, nota bene/nb, post scriptum/ps, requiescat in pace/rip, in toto, ipso facto, sui generis, terra incognita, ex libris, pro forma, pro rata, semper fidelis, semper paratus, ante bellum/antebellum, cogito ergo sum, in vino veritas, de iure/de jure, in medias res, vox populi, pax romana, sub rosa, casus belli, cui bono, mens rea, corpus delicti, ex nihilo, festina lente, in extremis, lapsus linguae, primus inter pares',
        4: 'amor fati, ars longa vita brevis, compos mentis, de novo, ex cathedra, obiter dictum, sic transit gloria mundi, sub iudice/sub judice, terminus ante quem, terminus post quem, ultima ratio, panem et circenses, nil desperandum, damnatio memoriae, ad fontes, odi et amo, quis custodiet ipsos custodes, reductio ad absurdum, si vis pacem para bellum, fiat lux, labor omnia vincit, omnia vincit amor, dulce et decorum est, sic semper tyrannis, ad maiorem dei gloriam/ad majorem dei gloriam/amdg, agnus dei, ecce homo, gloria in excelsis deo, dominus vobiscum, pax vobiscum, de profundis, ora et labora',
        5: 'timeo danaos et dona ferentes, facilis descensus averno, rara avis, hic sunt dracones, horror vacui, ignotum per ignotius, nemo iudex in causa sua, argumentum ad baculum, ubi sunt, sunt lacrimae rerum/lacrimae rerum, fiat iustitia ruat caelum/fiat justitia ruat caelum, arbiter elegantiarum, hoc opus hic labor est, tu ne cede malis, audentes fortuna iuvat/fortes fortuna iuvat, natura non facit saltus',
      },
    },
    {
      id: 'numeri', lvl: 1, lang: 'la', cat: 'Numeri', q: 'Name a Latin cardinal number (unus, duo…)',
      t: {
        1: 'unus, duo, tres, decem, centum, mille',
        2: 'quattuor, quinque, sex, septem, octo, novem, viginti',
        3: 'undecim, duodecim, tredecim, quattuordecim, quindecim, sedecim, septendecim, duodeviginti, undeviginti, triginta, quadraginta, quinquaginta',
        4: 'sexaginta, septuaginta, octoginta, nonaginta, ducenti, trecenti, quingenti',
        5: 'quadringenti, sescenti, septingenti, octingenti, nongenti',
      },
    },
    {
      id: 'mensis', lvl: 1, lang: 'la', cat: 'Fasti', q: 'Name a month or a named day of the Roman calendar', note: 'Latin',
      t: {
        1: 'Ianuarius/Januarius, Martius, Maius, Augustus, December',
        2: 'Februarius, Aprilis, Iunius/Junius, Iulius/Julius, September, October, November',
        3: 'Kalendae/Calendae/Kalends, Nonae/Nones, Idus/Ides',
        4: 'Quintilis, Sextilis',
        5: 'Mercedonius, Intercalaris/Mensis Intercalaris',
      },
    },
    {
      id: 'decl1', lvl: 1, lang: 'la', cat: 'Grammatica', q: 'Name a 1st-declension noun (puella, aqua…)',
      t: {
        1: 'puella, aqua, terra, via, rosa, vita, porta, femina, insula, silva',
        2: 'agricola, nauta, poeta, incola, villa, casa, fama, gloria, lingua, luna, stella, patria, familia, epistula, fabula, filia, hora, ira, ianua/janua, mensa, pecunia, pugna, sagitta, schola, unda, victoria, cena, culpa, cura, fortuna, fuga, harena/arena, hasta, littera, memoria, natura, ora, poena, regina, sententia, turba, umbra, causa, copia, dea, domina, ancilla, columna, corona',
        3: 'aquila, praeda, provincia, querela, sapientia, scientia, tabula, toga, tunica, vigilia, iniuria, insidiae, divitiae, tenebrae, catena, cauda, cera, charta, coma, flamma, forma, gemma, gratia, herba, lacrima, lucerna, machina, mora, nebula, palma, penna, planta, procella, rota, ruina, sella, spina, statua, taberna, ursa, uva, vacca, aurora',
        4: 'scriba, lanista, auriga, collega, advena, conviva, parricida, pirata, athleta, indigena, perfuga, nuptiae',
        5: 'scurra, verna, lixa, accola, transfuga, Hadria, cometa',
      },
    },
    {
      id: 'portare', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from portare (to carry)',
      t: {
        1: 'portable, transport, import, export, report, support',
        2: 'deport, porter, transportation, important, comport, purport, portfolio, reporter, supporter, deportation, importation, exportation',
        3: 'rapport, portmanteau, deportment, insupportable, unsupportable, portage, importance',
        4: 'portly, comportment, reportage, sport',
        5: 'disport, colporteur, portamento, portative',
      },
    },
    {
      id: 'videre', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from videre (to see)',
      t: {
        1: 'video, vision, visible, evident, provide, visit, invisible, television, visual',
        2: 'revise, supervise, advise, visa, envision, evidence, improvise, provision, visionary, visor, vista, revision, supervisor, visitor',
        3: 'envy, survey, view, review, interview, preview, purview, clairvoyant, voyeur, providence, prudent, visage, vis-a-vis/visavis, audiovisual, invidious, visibility, advice',
        4: 'prudence, provident, improvident, visualize/visualise, provisional, improvisation',
        5: 'belvedere, veduta, purveyor, purvey',
      },
    },
    {
      id: 'scribere', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from scribere (to write)',
      t: {
        1: 'script, describe, scribe, scripture, prescription, subscribe, manuscript',
        2: 'inscribe, prescribe, transcribe, postscript, transcript, description, inscription, subscription, conscript, scribble, nondescript',
        3: 'circumscribe, proscribe, ascribe, conscription, subscript, superscript, scribal, scriptorium, transcription, indescribable, prescriptive, descriptive',
        4: 'rescript, scrivener, ascription, proscription, circumscription, typescript, scrip',
        5: 'escritoire, shrive, shrift',
      },
    },
    {
      id: 'aqua', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from aqua (water)',
      t: {
        1: 'aquarium, aquatic, aqueduct',
        2: 'aquamarine, Aquarius, aqueous, aquifer',
        3: 'aquaplane, aquaculture, aqualung, aquavit',
        4: 'aquarelle, aquanaut, aquatint, subaqueous, terraqueous',
        5: 'ewer, sewer',
      },
    },
    {
      id: 'audire', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from audire (to hear)',
      t: {
        1: 'audio, audience, audible, auditorium, audition',
        2: 'auditor, inaudible, audit, audiovisual, auditory, audiobook',
        3: 'obey, obedient, obedience, audiology',
        4: 'disobey, disobedient, audiophile, inaudibly',
        5: 'oyez, subaudition',
      },
    },

    // ───────────────────────── Level 2 ─────────────────────────
    {
      id: 'verba1', lvl: 2, lang: 'la', gen: 'v1', cat: 'Grammatica', q: 'Name a 1st-conjugation verb (amo, amare…)', note: '1st person or infinitive',
      t: {
        1: 'amo, porto, voco, laudo, ambulo, laboro, specto, clamo, navigo, pugno',
        2: 'habito, paro, do, sto, oro, nato, erro, servo, iuvo, exspecto, festino, intro, neco, nuntio, oppugno, rogo, supero, vulnero, aedifico, cogito, curo, culpo, dono, expugno, impero, iudico, libero, muto, narro, nomino, postulo, probo, puto, saluto, tempto, vigilo, volo',
        3: 'aestimo, appello, celo, ceno, comparo, creo, declaro, desidero, dubito, existimo, fugo, gusto, honoro, ignoro, indico, lacrimo, lavo, loco, mando, migro, monstro, nego, occupo, orno, privo, propero, pulso, recuso, simulo, spero, sudo, tolero, turbo, vasto, verbero, vexo, iacto, iuro, delecto, devoro',
        4: 'aro, armo, basio, cremo, decoro, dedico, delibero, fatigo, flagro, hiemo, illustro, impetro, inflammo, lustro, macto, obsecro, palpito, plico, repudio, revoco, sacrifico, sedo, sicco, sollicito, spolio, sublevo, suspiro, titubo, triumpho, vacillo, velo, vibro, vindico, violo, vito, hortor, conor, miror, moror, precor, arbitror, cunctor, imitor, laetor, minor, opinor, vagor, venor, comitor',
        5: 'ululo, susurro, cachinno, rumino, pullulo, crepito, fumigo, scintillo, sternuto, vapulo, nuto, gratulor, sciscitor, aucupor, recordor, aemulor, fabulor, dignor, interpretor, machinor, epulor',
      },
    },
    {
      id: 'verba2', lvl: 2, lang: 'la', gen: 'v2', cat: 'Grammatica', q: 'Name a 2nd-conjugation verb (moneo, monere…)', note: '1st person or infinitive',
      t: {
        1: 'habeo, video, moneo, teneo, timeo, debeo, maneo, sedeo, rideo',
        2: 'doceo, iubeo, moveo, respondeo, terreo, valeo, taceo, placeo, noceo, pareo, iaceo, deleo, mereo, prohibeo, persuadeo, praebeo, sileo, studeo, careo, gaudeo, audeo, soleo, fleo, impleo, misceo, augeo, lateo, floreo, egeo, appareo, contineo, obtineo, retineo, sustineo, commoveo, removeo',
        3: 'censeo, mordeo, suadeo, torqueo, ardeo, caveo, faveo, foveo, langueo, lugeo, maereo, mulceo, niteo, oleo, pendeo, polleo, rubeo, splendeo, stupeo, tueor, vereor, fateor, polliceor, misereor, abstineo, exerceo, coerceo, arceo, horreo, luceo, paveo, tondeo, urgeo, pateo, doleo, frigeo, caleo',
        4: 'torreo, strideo, tumeo, vigeo, palleo, fulgeo, rigeo, madeo, cieo, ferveo, immineo, emineo, promineo, torpeo, tepeo, albeo, aveo, liceo',
        5: 'neo, conniveo, renideo, squaleo, hebeo, flaveo',
      },
    },
    {
      id: 'praepabl', lvl: 2, lang: 'la', cat: 'Grammatica', q: 'Name a preposition that takes the ablative',
      t: {
        1: 'cum, de, ex/e, ab/a/abs, in, sine, pro',
        2: 'sub, prae, coram',
        3: 'super, tenus',
        4: 'palam, clam',
        5: 'absque, procul',
      },
    },
    {
      id: 'praepacc', lvl: 2, lang: 'la', cat: 'Grammatica', q: 'Name a preposition that takes the accusative',
      t: {
        1: 'ad, per, in, post, ante, trans, inter, contra',
        2: 'circum, propter, prope, sub, ob, apud, extra, intra, ultra, praeter, supra, infra, iuxta/juxta',
        3: 'adversus/adversum, secundum, citra, erga, penes, circa, super, subter',
        4: 'pone, cis, versus, usque',
        5: 'clam, circiter',
      },
    },
    {
      id: 'familia', lvl: 2, lang: 'la', cat: 'Familia', q: 'Name a family member, in Latin',
      t: {
        1: 'pater, mater, frater, soror, filius, filia',
        2: 'avus, avia, uxor, maritus, coniunx/coniux/conjunx, infans, parentes, liberi, nepos, vir',
        3: 'patruus, avunculus, amita, matertera, neptis, socer, socrus, gener, nurus, consobrinus, consobrina, proavus, proavia, germanus, germana, mulier',
        4: 'noverca, vitricus, privignus, privigna, abavus, atavus, patruelis, sobrinus, pronepos',
        5: 'glos, ianitrix/janitrix, abnepos, tritavus, levir',
      },
    },
    {
      id: 'colores', lvl: 2, lang: 'la', cat: 'Colores', q: 'Name a colour, in Latin',
      t: {
        1: 'ruber, albus, niger, viridis',
        2: 'caeruleus, flavus, purpureus, candidus, ater, roseus, aureus, fuscus',
        3: 'argenteus, croceus, luteus, fulvus, puniceus, caesius, cinereus, rufus, ravus, glaucus, lividus, pullus, sanguineus, coccineus, aeneus',
        4: 'rutilus, luridus, cyaneus, ferrugineus, lacteus, niveus, igneus, ostrinus, gilvus',
        5: 'galbinus, helvus, badius, spadix, ianthinus, prasinus, venetus, russatus, amethystinus',
      },
    },
    {
      id: 'imperatores', lvl: 2, lang: 'la', cat: 'Imperatores', q: 'Name a Roman emperor', note: 'Latin or English names',
      t: {
        1: 'Augustus/Octavian/Octavianus/Octavius, Nero, Caligula/Gaius, Claudius, Tiberius, Marcus Aurelius/Aurelius, Hadrian/Hadrianus, Constantine/Constantinus, Trajan/Traianus/Trajanus',
        2: 'Vespasian/Vespasianus, Titus, Domitian/Domitianus, Commodus, Diocletian/Diocletianus, Nerva, Antoninus Pius/Antoninus, Septimius Severus/Severus, Caracalla, Galba, Otho, Vitellius, Julian/Iulianus/Julianus',
        3: 'Pertinax, Didius Julianus/Didius Iulianus/Didius, Geta, Elagabalus/Heliogabalus, Severus Alexander/Alexander Severus/Alexander, Lucius Verus/Verus, Macrinus, Maximinus Thrax/Maximinus, Gordian/Gordianus, Philip the Arab/Philippus Arabs/Philippus/Philip, Decius, Valerian/Valerianus, Gallienus, Aurelian/Aurelianus, Probus, Theodosius, Valentinian/Valentinianus, Constantius, Galerius, Maximian/Maximianus, Licinius, Gratian/Gratianus, Honorius, Arcadius, Romulus Augustulus/Augustulus, Jovian/Iovianus/Jovianus, Valens, Justinian/Iustinianus/Justinianus',
        4: 'Carus, Carinus, Numerian/Numerianus, Tacitus, Florianus/Florian, Quintillus, Claudius Gothicus/Claudius II, Trebonianus Gallus/Gallus, Pupienus, Balbinus, Diadumenian/Diadumenianus, Constans, Maxentius, Majorian/Maiorianus/Majorianus, Julius Nepos/Iulius Nepos/Nepos, Marcian/Marcianus, Postumus',
        5: 'Aemilianus/Aemilian, Hostilian/Hostilianus, Volusianus/Volusian, Herennius Etruscus, Glycerius, Olybrius, Anthemius, Avitus, Petronius Maximus, Libius Severus, Maximinus Daia/Maximinus Daza, Magnentius, Tetricus, Victorinus, Carausius, Allectus, Vetranio, Leo, Zeno',
      },
    },
    {
      id: 'domus', lvl: 2, lang: 'la', cat: 'Domus', q: 'Name a room or part of a Roman house',
      t: {
        1: 'atrium, impluvium, triclinium, culina, cubiculum, hortus, ianua/janua',
        2: 'peristylium/peristylum, tablinum, compluvium, vestibulum, fenestra, lararium, taberna, latrina, fauces, ala/alae, cella',
        3: 'balneum, exedra, oecus, piscina, bibliotheca, cenaculum, solarium, xystus, hypocaustum/hypocaust, focus, tectum, paries, tegula, limen, pavimentum, posticum',
        4: 'apodyterium, caldarium, tepidarium, frigidarium, cryptoporticus, viridarium, porticus, pergula, nymphaeum, cellarium',
        5: 'diaeta, conclave, crypta, emblema',
      },
    },
    {
      id: 'ordinales', lvl: 2, lang: 'la', cat: 'Numeri', q: 'Name a Latin ordinal number (primus, secundus…)',
      t: {
        1: 'primus, secundus, tertius, decimus',
        2: 'quartus, quintus, sextus, septimus, octavus, nonus, centesimus, millesimus',
        3: 'undecimus, duodecimus, vicesimus/vigesimus, tricesimus/trigesimus, quadragesimus, quinquagesimus',
        4: 'tertius decimus, quartus decimus, duodevicesimus, undevicesimus, sexagesimus, septuagesimus, octogesimus, nonagesimus',
        5: 'ducentesimus, trecentesimus, quadringentesimus, quingentesimus, sescentesimus, septingentesimus, octingentesimus, nongentesimus',
      },
    },
    {
      id: 'decl2', lvl: 2, lang: 'la', cat: 'Grammatica', q: 'Name a 2nd-declension noun (servus, bellum…)',
      t: {
        1: 'servus, amicus, bellum, dominus, puer, ager, liber, vir, oppidum, verbum, donum',
        2: 'equus, populus, filius, deus, annus, animus, oculus, lupus, campus, cibus, gladius, ludus, murus, numerus, nuntius, socius, ventus, magister, caelum, consilium, forum, imperium, periculum, praemium, proelium, regnum, signum, templum, tectum, vinum, auxilium, aurum, argentum, ferrum, saxum, scutum, studium, officium, gaudium, odium, otium, negotium, exemplum, arma, castra',
        3: 'lucus, fluvius, hortus, lectus, locus, mundus, nidus, ramus, rivus, somnus, sonus, tumulus, umerus, digitus, morbus, nasus, nodus, pontus, stilus, titulus, triumphus, tribunus, legatus, medicus, vicus, fatum, bracchium, convivium, aedificium, beneficium, collum, dorsum, exilium, fanum, frumentum, horreum, ingenium, initium, iugum, lignum, monstrum, ovum, pomum, sepulcrum, silentium, spatium, stagnum, supplicium, theatrum, vallum, vestigium, vitium, humus',
        4: 'fagus, laurus, pirus, malus, vulgus, alvus',
        5: 'cupressus, vannus, colus, carbasus, pelagus, virus',
      },
    },
    {
      id: 'decl3', lvl: 2, lang: 'la', cat: 'Grammatica', q: 'Name a 3rd-declension noun (rex, corpus…)',
      t: {
        1: 'rex, lex, pax, lux, vox, mater, pater, frater, homo, nomen, corpus, tempus, mare, urbs, mons, miles, nox, dux',
        2: 'flumen, animal, civis, pons, ars, mors, gens, caput, carmen, opus, iter, labor, amor, sol, sanguis, leo, canis, finis, ignis, navis, hostis, mulier, uxor, soror, virgo, imperator, consul, senator, orator, legio, regio, natio, ratio, oratio, pars, dens, pes, mens, virtus, libertas, civitas, aetas, veritas, ordo, clamor, color, honor, timor, dolor, error, terror, pectus, litus, vulnus, genus, scelus, onus',
        3: 'frons, lapis, hiems, salus, servitus, voluntas, potestas, multitudo, magnitudo, fortitudo, origo, sermo, foedus, frigus, latus, nemus, sidus, os, ius, rus, mus, tellus, aes, aequor, arbor, cor, cinis, crux, laus, fraus, nix, grex, nux, vis, sal, mel, imago, testudo, cupido, carcer, cruor, flos, mos, ros, mercator, iudex, comes, eques, pedes, princeps, sacerdos, custos, nepos',
        4: 'vas, fur, cardo, turbo, harundo, vellus, pecus, iecur, robur, ebur, marmor, sulphur, tuber, ver, iubar',
        5: 'praes, fel, far, hirudo, compes, vibex',
      },
    },
    {
      id: 'mittere', lvl: 2, lang: 'en', cat: 'Derivata', q: 'Name an English word from mittere (to send)',
      t: {
        1: 'mission, transmit, submit, admit, permit, missile, commit, omit, emit',
        2: 'dismiss, remit, missionary, intermittent, emission, submission, admission, permission, commission, omission, transmission, committee, remission, emissary',
        3: 'missive, promise, compromise, premise, surmise, demise, message, remiss, dismissive, permissive, admissible, transmitter, emitter, intermission',
        4: 'manumit, mess, mass, missal, commissar, inadmissible',
        5: 'intromit, pretermit, demimonde',
      },
    },
    {
      id: 'ducere', lvl: 2, lang: 'en', cat: 'Derivata', q: 'Name an English word from ducere (to lead)',
      t: {
        1: 'conduct, produce, reduce, introduce, educate, product',
        2: 'induce, deduce, seduce, abduct, aqueduct, duct, conductor, production, reduction, introduction, education, viaduct, induction, deduction, producer',
        3: 'duke, conducive, ductile, abduction, seduction, conduit, educe, traduce, reproduce, reproduction, productive, duchess, duchy, introductory, deductive, inductive',
        4: 'subduction, ducal, ducat, doge, adduce, transducer',
        5: 'redoubt, superinduce',
      },
    },
    {
      id: 'manus', lvl: 2, lang: 'en', cat: 'Derivata', q: 'Name an English word from manus (hand)',
      t: {
        1: 'manual, manicure, manufacture, manuscript',
        2: 'manipulate, manage, maneuver/manoeuvre, emancipate, mandate, manacle',
        3: 'manner, manure, manumission, amanuensis, manifest, maintain, manager, management, manipulation, emancipation, manufacturer',
        4: 'maintenance, legerdemain, mortmain, manciple',
        5: 'command, demand, commend, recommend',
      },
    },
    {
      id: 'pater', lvl: 2, lang: 'en', cat: 'Derivata', q: 'Name an English word from pater (father)',
      t: {
        1: 'paternal, paternity, patriot, patron',
        2: 'patrimony, patrician, expatriate, repatriate, compatriot, patronize/patronise, patronage, patriotic',
        3: 'paternalism, paternoster, patriotism, padre',
        4: 'pattern, expatriation, repatriation',
        5: 'patter, perpetrate',
      },
    },
    {
      id: 'cibus', lvl: 2, lang: 'la', cat: 'Cibus', q: 'Name a food or drink, in Latin',
      t: {
        1: 'panis, vinum, aqua, lac, mel, caseus',
        2: 'ovum, caro, piscis, pomum, malum, uva, oliva, oleum, sal, frumentum, puls, garum',
        3: 'faba, cepa, allium, ficus, pirum, cerasum, nux, porrum, lens, cicer, rapum, lactuca, cucumis, raphanus, brassica, piper, acetum, libum, farina, hordeum, triticum, far, mustum, placenta, mulsum, posca',
        4: 'butyrum, oryza, perna, lardum, botulus, defrutum, moretum, crustulum, glires, malva, asparagus, offa',
        5: 'sapa, liquamen, muria, isicium, pepo, tisana',
      },
    },

    // ───────────────────────── Level 3 ─────────────────────────
    {
      id: 'militia', lvl: 3, lang: 'la', cat: 'Militia', q: 'Name a Roman military term', note: 'Latin',
      t: {
        1: 'legio, miles, gladius, castra, centurio, scutum, pilum',
        2: 'cohors, legatus, galea, lorica, aquila, signum, tribunus, imperator, testudo, ballista, eques, auxilia, vexillum, praetorium, vallum, fossa, contubernium',
        3: 'manipulus, optio, signifer, aquilifer, cornicen, tubicen, onager, aries, pugio, caliga/caligae, cingulum, balteus, sarcina, agmen, acies, centuria, decurio, praefectus, primus pilus, veteranus, triarii, hastati, principes, velites, turma, castellum, praetoriani, catapulta',
        4: 'vexillarius, imaginifer, tesserarius, scorpio, carroballista, spatha, hasta, cassis, umbo, sudes, tribulus, decimatio, sacramentum, stipendium, donativum, speculatores, beneficiarius, evocatus',
        5: 'lilia, cippi, focale, plumbata/plumbatae, frumentarius/frumentarii, immunis/immunes, cornicularius, campidoctor, lixae, calones, contus',
      },
    },
    {
      id: 'auctores', lvl: 3, lang: 'la', cat: 'Auctores', q: 'Name a Roman author', note: 'Latin or English names',
      t: {
        1: 'Cicero, Vergil/Virgil/Vergilius, Ovid/Ovidius, Caesar, Horace/Horatius',
        2: 'Livy/Livius, Catullus, Seneca, Tacitus, Pliny/Plinius, Lucretius, Sallust/Sallustius, Plautus, Terence/Terentius, Martial/Martialis, Juvenal/Iuvenalis/Juvenalis, Suetonius',
        3: 'Propertius, Tibullus, Lucan/Lucanus, Statius, Petronius, Apuleius, Quintilian/Quintilianus, Ennius, Nepos/Cornelius Nepos, Persius, Augustine/Augustinus, Boethius, Ammianus Marcellinus/Ammianus, Varro, Cato, Sulpicia, Valerius Maximus, Vitruvius, Columella, Frontinus, Aulus Gellius/Gellius, Jerome/Hieronymus',
        4: 'Silius Italicus, Valerius Flaccus, Manilius, Phaedrus, Velleius Paterculus/Velleius, Quintus Curtius/Curtius, Florus, Eutropius, Claudian/Claudianus, Ausonius, Symmachus, Fronto, Lucilius, Naevius, Livius Andronicus, Pacuvius, Accius, Celsus, Vegetius, Macrobius, Prudentius, Ambrose/Ambrosius, Tertullian/Tertullianus, Lactantius, Sidonius Apollinaris/Sidonius, Cassiodorus, Isidore/Isidorus, Minucius Felix',
        5: 'Rutilius Namatianus, Censorinus, Commodian/Commodianus, Nemesianus, Calpurnius Siculus, Avianus, Dracontius, Corippus, Martianus Capella, Priscian/Priscianus, Servius, Laberius, Afranius, Hyginus, Solinus',
      },
    },
    {
      id: 'aeneis', lvl: 3, lang: 'la', cat: 'Aeneis', q: "Name a character from Vergil's Aeneid", note: 'Latin or English names',
      t: {
        1: 'Aeneas, Dido, Turnus, Iuno/Juno, Venus, Iuppiter/Jupiter, Ascanius/Iulus',
        2: 'Anchises, Lavinia, Latinus, Creusa, Achates, Pallas, Evander/Euander, Camilla, Mezentius, Nisus, Euryalus, Sibylla/Sibyl, Anna, Laocoon, Priamus/Priam, Hector, Mercurius/Mercury, Aeolus, Neptunus/Neptune, Sinon, Cerberus, Charon, Palinurus, Polyphemus',
        3: 'Andromache, Helenus, Achaemenides, Iarbas, Amata, Allecto, Iuturna/Juturna, Lausus, Drances, Acestes, Entellus, Dares, Misenus, Deiphobus, Marcellus, Pyrrhus/Neoptolemus, Hecuba, Cacus, Hercules, Vulcanus/Vulcan, Messapus, Ilioneus, Mnestheus, Serestus, Iris, Fama/Rumour, Sychaeus, Pygmalion, Romulus, Augustus',
        4: 'Cloanthus, Gyas, Sergestus, Iapyx, Tolumnius, Orpheus, Minos, Rhadamanthus, Tisiphone, Ixion, Theseus, Musaeus, Silvius, Numa, Brutus, Coroebus, Panthus, Polites, Arruns, Tarchon, Barce',
        5: 'Saces, Salmoneus, Tityos, Phlegyas, Camillus, Rhipeus, Dymas, Hypanis, Androgeos, Halaesus, Ufens, Umbro, Aventinus, Caeculus, Catillus, Coras, Virbius, Metabus, Opis, Acca, Asilas, Aletes, Nautes, Beroe, Pandarus, Bitias, Cymodocea, Butes, Eurytion, Lycus, Helymus, Patron, Salius, Diores, Thymoetes',
      },
    },
    {
      id: 'sidera', lvl: 3, lang: 'la', cat: 'Sidera', q: 'Name a constellation by its Latin name',
      t: {
        1: 'Ursa Maior/Ursa Major, Ursa Minor, Orion, Leo, Taurus, Gemini, Scorpius/Scorpio',
        2: 'Cancer, Virgo, Libra, Sagittarius, Capricornus/Capricorn, Aquarius, Pisces, Aries, Cygnus, Draco, Cassiopeia, Andromeda, Perseus, Pegasus, Hercules, Lyra, Aquila',
        3: 'Corona Borealis, Canis Maior/Canis Major, Canis Minor, Lepus, Columba, Delphinus, Sagitta, Bootes, Cepheus, Hydra, Corvus, Crater, Centaurus, Lupus, Auriga, Crux, Ophiuchus, Serpens, Eridanus, Corona Australis, Piscis Austrinus, Triangulum, Vulpecula',
        4: 'Monoceros, Camelopardalis, Pyxis, Carina, Puppis, Vela, Musca, Fornax, Sculptor, Telescopium, Ara, Coma Berenices, Canes Venatici, Lacerta, Lynx, Leo Minor, Scutum, Hydrus, Tucana, Pavo, Grus, Phoenix, Dorado',
        5: 'Mensa, Antlia, Caelum, Pictor, Reticulum, Horologium, Norma, Circinus, Octans, Apus, Volans, Microscopium, Indus, Chamaeleon, Triangulum Australe, Sextans, Equuleus',
      },
    },
    {
      id: 'virtutes', lvl: 3, lang: 'la', cat: 'Mores', q: 'Name a Roman virtue or value, in Latin',
      t: {
        1: 'virtus, pietas, fides, gravitas',
        2: 'dignitas, clementia, constantia, prudentia, iustitia/justitia, fortitudo, temperantia, honestas, humanitas, auctoritas, disciplina, veritas, libertas, concordia, honos/honor',
        3: 'frugalitas, industria, severitas, aequitas, comitas, firmitas, simplicitas, salubritas, modestia, pudicitia, magnanimitas, liberalitas, benevolentia, fidelitas, patientia, sapientia, spes, caritas, misericordia, gratia, amicitia, officium, mos maiorum, decus, gloria',
        4: 'integritas, innocentia, continentia, sobrietas, verecundia, diligentia, providentia, felicitas, securitas, tranquillitas, munificentia, magnificentia, indulgentia, hilaritas, laetitia, pudor, probitas',
        5: 'urbanitas, mansuetudo, castitas, sanctitas, religio, aequanimitas, longanimitas',
      },
    },
    {
      id: 'loca', lvl: 3, lang: 'la', cat: 'Orbis Romanus', q: 'Name a city of the Roman world by its Latin name',
      t: {
        1: 'Roma, Pompeii, Carthago, Athenae, Troia',
        2: 'Ostia, Neapolis, Herculaneum, Capua, Brundisium, Londinium, Alexandria, Byzantium, Constantinopolis, Syracusae, Corinthus, Sparta, Hierosolyma, Mediolanum, Ravenna, Antiochia, Tarentum, Lutetia',
        3: 'Eboracum, Aquae Sulis, Camulodunum, Deva, Lindum, Verulamium, Colonia Agrippina, Lugdunum, Massilia, Narbo, Burdigala, Hispalis, Gades, Tarraco, Emerita Augusta, Toletum, Caesarea, Leptis Magna, Vindobona, Aquincum, Thessalonica, Ephesus, Pergamum, Smyrna, Tyrus, Sidon, Damascus, Palmyra, Cyrene, Utica, Tibur, Veii, Alba Longa, Cumae, Puteoli, Baiae, Aquileia, Verona, Patavium, Bononia, Florentia, Pisae, Ariminum, Beneventum, Corduba, Saguntum, Alesia',
        4: 'Augusta Treverorum, Sirmium, Hippo Regius, Tusculum, Praeneste, Lavinium, Ardea, Misenum, Stabiae, Placentia, Arretium, Clusium, Perusia, Ancona, Rhegium, Messana, Panormus, Lilybaeum, Carthago Nova, Numantia, Gergovia, Avaricum, Mogontiacum, Isca, Petra, Bostra',
        5: 'Durocortorum, Castra Regina, Augusta Vindelicorum, Noviomagus, Luguvalium, Vindolanda, Segedunum, Corinium, Durovernum, Thamugadi',
      },
    },
    {
      id: 'feriae', lvl: 3, lang: 'la', cat: 'Fasti', q: 'Name a Roman festival', note: 'Latin',
      t: {
        1: 'Saturnalia',
        2: 'Lupercalia, Floralia',
        3: 'Vestalia, Parilia/Palilia, Liberalia, Matronalia, Lemuria, Cerealia, Parentalia, Ludi Romani',
        4: 'Vinalia, Consualia, Terminalia, Quirinalia, Robigalia, Volcanalia/Vulcanalia, Neptunalia, Opalia, Compitalia, Ambarvalia, Feralia, Megalesia/Megalensia, Ludi Plebeii, Ludi Apollinares, Ludi Saeculares',
        5: 'Fordicidia, Agonalia, Equirria, Tubilustrium, Poplifugia, Larentalia, Carmentalia, Fontinalia, Armilustrium, Fornacalia, Septimontium, Meditrinalia, Furrinalia, Portunalia',
      },
    },
    {
      id: 'lux', lvl: 3, lang: 'en', cat: 'Derivata', q: 'Name an English word from lux / lumen (light)',
      t: {
        1: 'lucid, illuminate, luminous',
        2: 'translucent, elucidate, illumination, luminary, lux',
        3: 'lucent, luminosity, bioluminescent/bioluminescence, Lucifer, illumine',
        4: 'pellucid, luculent, lumen',
        5: 'lucubration, relucent, noctilucent, limn',
      },
    },
  ];
})(window.RA = window.RA || {});
