// Prompt bank.
// Each prompt lists accepted answers grouped by rarity tier (1 = common … 5 = obscure, 6 = one in a million).
// Within a tier: answers are comma-separated; "/" separates accepted spellings (the first is shown).
// Matching ignores case, accents/macrons, spaces and punctuation, and treats j=i and v=u.
// lvl: 1 = early floors, 2 = middle, 3 = deep.   lang: 'la' answers in Latin, 'en' answers in English.
// gen: 'v1' / 'v2' auto-accepts the infinitive (amo → amare, moneo → monere; deponents too).
// pl: true accepts each noun's nominative plural too (canes for canis), from js/data/plurals.js.
// adj: true accepts feminine, neuter and plural forms of answers given in the masculine (alba, album for albus).
// Female forms of animals are listed as spellings of the male answer (lupa counts as lupus).
(function (RA) {
  RA.PROMPT_SRC = [
    // ───────────────────────── Level 1 ─────────────────────────
    {
      id: 'animalia', lvl: 1, lang: 'la', pl: true, cat: 'Animalia', q: 'Name an animal, in Latin',
      t: {
        1: 'canis, feles/felis/cattus, equus/equa/equae, lupus/lupa/lupae, leo, avis, piscis, ursus/ursa/ursae, vacca, porcus/porca/porcae, ovis, taurus, aquila, columba/columbus/columbi, corvus, cervus/cerva/cervae, vulpes, elephantus/elephas, apis, gallus, agnus/agna/agnae, serpens, asinus/asina/asinae, capra, mus, bos, tigris, camelus, delphinus/delphin, rana, crocodilus, mulus/mula/mulae, cancer, scorpio/scorpius',
        2: 'sus, gallina, anser, anas, lepus, simia/simius/simii, formica, aranea/araneus, testudo, pavo, cygnus, passer, musca, leaena, hippopotamus, rhinoceros, panthera, lynx, vipera, draco, balaena, aper, noctua, castor, vultur, locusta, cicada, hyaena/hyena, salamandra, aries, vermis',
        3: 'anguis, vitulus/vitula/vitulae, pullus, lacerta, bubo, catulus/catula/catulae, cuniculus, hirundo, papilio, vespa, psittacus, caper, pardus, olor, iuvencus/iuvenca/iuvencae, hircus, haedus/haeda/haedae, glis, onager, polypus, cochlea, accipiter, luscinia, ostrea/ostreum, turdus',
        4: 'vespertilio, merula, grus, ardea, mustela, talpa, erinaceus/ericius, ciconia, cornix, milvus, alauda, coluber, anguilla, sepia, perdix, phoca/phoce, pica, dama',
        5: 'fringilla, graculus, muraena/murena, mullus, culex, pulex, sorex, thynnus, caprea, falco',
        6: 'struthiocamelus, camelopardalis/camelopardus, ichneumon, upupa, sciurus, coturnix',
      },
    },
    {
      id: 'corpus', lvl: 1, lang: 'la', pl: true, cat: 'Corpus', q: 'Name a part of the body, in Latin',
      t: {
        1: 'caput, manus, pes, oculus, cor, os, auris, nasus, dens, lingua, bracchium/brachium, crus, digitus, collum, venter, umerus/humerus, capillus, frons, genu, pectus, tergum, dorsum',
        2: 'sanguis, cutis, facies, barba, labrum, palma, cervix, crinis, unguis, iecur, femur, cubitum, talus, calx, mentum, gena, supercilium, pulmo, stomachus, cerebrum, ren/renes',
        3: 'maxilla, cartilago, viscera, nervus, musculus, costa, latus, coxa, sura, pollex, vultus, mamma, umbilicus, vena, iugulum, palatum',
        4: 'guttur, fauces, lacertus, poples, tibia, axilla, lien, vesica, intestinum, medulla, pupula, palpebra',
        5: 'tempora, articulus, nates, clunes, occiput, inguen',
        6: 'sinciput, praecordia, ilia',
      },
    },
    {
      id: 'dei', lvl: 1, lang: 'la', cat: 'Di Immortales', q: 'Name a Roman god or goddess', note: 'Latin or English names',
      t: {
        1: 'Iuppiter/Iupiter/Jupiter/Jove, Iuno/Juno, Venus, Mars, Neptunus/Neptune, Minerva, Apollo, Mercurius/Mercury, Diana, Cupido/Cupid, Vulcanus/Vulcan, Vesta, Ceres, Bacchus, Pluto, Saturnus/Saturn, Ianus/Janus, Proserpina/Proserpine, Aurora, Sol, Luna, Fortuna, Faunus, Flora, Pomona',
        2: 'Liber, Dis/Dis Pater, Terminus, Victoria, Bellona, Quirinus, Somnus, Mors, Nox, Ops, Tellus/Terra Mater, Orcus, Lares, Penates, Genius, Silvanus, Fides, Concordia, Pax, Spes, Salus, Iuventas/Juventas',
        3: 'Aesculapius, Vertumnus, Portunus, Pales, Consus, Fauna, Bona Dea, Carmenta, Egeria, Pietas, Virtus, Honos, Febris, Libertas, Feronia, Robigus, Picus, Volturnus',
        4: 'Tiberinus, Laverna, Lucina, Cardea, Larunda, Libitina, Angerona, Furrina, Vacuna, Cloacina, Rumina, Cunina',
        5: 'Abeona, Adeona, Pilumnus, Picumnus, Fornax, Mena, Mefitis',
        6: 'Sterquilinus, Forculus, Limentinus, Nundina',
      },
    },
    {
      id: 'locutiones', lvl: 1, lang: 'en', cat: 'Locutiones', q: 'Name a Latin phrase still used in English',
      t: {
        1: 'et cetera/etcetera/etc, exempli gratia/eg, id est/ie, vice versa, carpe diem, per se, ad hoc, status quo, alma mater, et al/et alii/et alia, ante meridiem/am, post meridiem/pm, bona fide, quid pro quo, de facto, ad nauseam, mea culpa, persona non grata, terra firma, magnum opus, non sequitur, in vitro, per capita, pro bono, ad infinitum, memento mori, post mortem, curriculum vitae/cv, veni vidi vici, e pluribus unum, summa cum laude, cum laude, in situ, modus operandi, per annum, per diem, prima facie, ad libitum/ad lib',
        2: 'alter ego, anno domini, rigor mortis, et tu brute, tempus fugit, in memoriam, ad astra, alea iacta est/alea jacta est, tabula rasa, sine qua non, caveat emptor, habeas corpus, ad hominem, deus ex machina, ex post facto, in absentia, in loco parentis, magna cum laude, mutatis mutandis, ceteris paribus, quod erat demonstrandum/qed, nota bene/nb, post scriptum/ps, requiescat in pace/rip, in toto, ipso facto, sui generis, terra incognita, ex libris, pro forma, pro rata, semper fidelis, semper paratus, ante bellum/antebellum, cogito ergo sum, in vino veritas',
        3: 'de iure/de jure, in medias res, vox populi, pax romana, sub rosa, casus belli, cui bono, mens rea, corpus delicti, ex nihilo, festina lente, in extremis, lapsus linguae, primus inter pares, amor fati, ars longa vita brevis, compos mentis, de novo, ex cathedra, obiter dictum, sic transit gloria mundi, sub iudice/sub judice, terminus ante quem, terminus post quem, ultima ratio, panem et circenses, nil desperandum',
        4: 'facilis descensus averno, rara avis, damnatio memoriae, ad fontes, odi et amo, quis custodiet ipsos custodes, reductio ad absurdum, si vis pacem para bellum, fiat lux, labor omnia vincit, omnia vincit amor, dulce et decorum est, sic semper tyrannis, ad maiorem dei gloriam/ad majorem dei gloriam/amdg, agnus dei, ecce homo, gloria in excelsis deo, dominus vobiscum, pax vobiscum',
        5: 'de profundis, ora et labora, timeo danaos et dona ferentes, hic sunt dracones, horror vacui, ubi sunt, sunt lacrimae rerum/lacrimae rerum, fiat iustitia ruat caelum/fiat justitia ruat caelum, hoc opus hic labor est, tu ne cede malis, audentes fortuna iuvat/fortes fortuna iuvat',
        6: 'ignotum per ignotius, nemo iudex in causa sua, argumentum ad baculum, arbiter elegantiarum, natura non facit saltus',
      },
    },
    {
      id: 'numeri', lvl: 1, lang: 'la', adj: true, cat: 'Numeri', q: 'Name a Latin cardinal number (unus, duo…)',
      t: {
        1: 'novem, unus, duo, tres, decem, centum, mille, quattuor, quinque, sex, septem',
        2: 'octo, viginti, undecim, duodecim, tredecim, quattuordecim, quindecim, sedecim, septendecim',
        3: 'duodeviginti, undeviginti, triginta, quadraginta, quinquaginta, sexaginta, septuaginta, octoginta',
        4: 'nonaginta, ducenti, trecenti, quingenti, quadringenti',
        5: 'septingenti, octingenti, nongenti',
        6: 'sescenti',
      },
    },
    {
      id: 'mensis', lvl: 1, lang: 'la', cat: 'Fasti', q: 'Name a month or a named day of the Roman calendar', note: 'Latin',
      t: {
        1: 'Ianuarius/Januarius, Martius, Maius, Augustus, December',
        2: 'Februarius, Aprilis, Iunius/Junius, Iulius/Julius, September, October, November',
        3: 'Kalendae/Calendae/Kalends, Nonae/Nones, Idus/Ides',
        4: 'Quintilis, Sextilis',
        5: 'Intercalaris/Mensis Intercalaris',
        6: 'Mercedonius',
      },
    },
    {
      id: 'decl1', lvl: 1, lang: 'la', pl: true, cat: 'Grammatica', q: 'Name a 1st-declension noun (puella, aqua…)',
      t: {
        1: 'puella, aqua, terra, via, rosa, vita, porta, femina, insula, silva, agricola, nauta, poeta, incola, villa, casa, fama, gloria, lingua, luna, stella, patria, familia, epistula, fabula, filia, hora, ira, ianua/janua, mensa, pecunia, pugna, sagitta, schola',
        2: 'pirata, athleta, unda, victoria, cena, culpa, cura, fortuna, fuga, harena/arena, hasta, littera, memoria, natura, ora, poena, regina, sententia, turba, umbra, causa, copia, dea, domina, ancilla, columna, corona, aquila, praeda, provincia, querela',
        3: 'sapientia, scientia, tabula, toga, tunica, vigilia, iniuria, insidiae, divitiae, tenebrae, catena, cauda, cera, charta, coma, flamma, forma, gemma, gratia, herba, lacrima, lucerna, machina, mora',
        4: 'nebula, palma, penna, planta, procella, rota, ruina, sella, spina, statua, taberna, ursa, uva, vacca, aurora, scriba, lanista',
        5: 'auriga, collega, advena, conviva, parricida, indigena, perfuga, nuptiae, accola, transfuga',
        6: 'scurra, verna, lixa, Hadria, cometa',
      },
    },
    {
      id: 'portare', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from portare (to carry)',
      t: {
        1: 'portable, transport, import, export, report, support, deport, porter, transportation',
        2: 'important, comport, purport, portfolio, reporter, supporter, deportation, importation, exportation',
        3: 'rapport, portmanteau, deportment, insupportable, unsupportable, portage, importance',
        4: 'portly, comportment, reportage, sport',
        5: 'disport, portamento, portative',
        6: 'colporteur',
      },
    },
    {
      id: 'videre', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from videre (to see)',
      t: {
        1: 'video, vision, visible, evident, provide, visit, invisible, television, visual, revise, supervise, advise, visa, envision',
        2: 'evidence, improvise, provision, visionary, visor, vista, revision, supervisor, visitor, envy, survey, view, review',
        3: 'provisional, improvisation, interview, preview, purview, clairvoyant, voyeur, providence, prudent, visage',
        4: 'vis-a-vis/visavis, audiovisual, invidious, visibility, advice, prudence, provident',
        5: 'improvident, visualize/visualise, belvedere, purveyor',
        6: 'veduta, purvey',
      },
    },
    {
      id: 'scribere', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from scribere (to write)',
      t: {
        1: 'script, describe, scribe, scripture, prescription, subscribe, manuscript, inscribe, prescribe, transcribe, postscript',
        2: 'transcript, description, inscription, subscription, conscript, scribble, nondescript, circumscribe, proscribe, ascribe',
        3: 'conscription, subscript, superscript, scribal, scriptorium, transcription, indescribable, prescriptive',
        4: 'descriptive, rescript, scrivener, ascription, proscription, circumscription',
        5: 'typescript, scrip, escritoire',
        6: 'shrive, shrift',
      },
    },
    {
      id: 'aqua', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from aqua (water)',
      t: {
        1: 'aquarium, aquatic, aqueduct, aquamarine, Aquarius',
        2: 'aqueous, aquifer, aquaplane, aquaculture, aqualung',
        3: 'aquavit, aquarelle, aquanaut',
        4: 'aquatint, subaqueous, terraqueous',
        5: 'sewer',
        6: 'ewer',
      },
    },
    {
      id: 'audire', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from audire (to hear)',
      t: {
        1: 'audio, audience, audible, auditorium, audition, auditor',
        2: 'inaudible, audit, audiovisual, auditory, audiobook',
        3: 'obey, obedient, obedience, audiology',
        4: 'disobey, disobedient, audiophile',
        5: 'inaudibly, subaudition',
        6: 'oyez',
      },
    },

    // ───────────────────────── Level 2 ─────────────────────────
    {
      id: 'verba1', lvl: 2, lang: 'la', gen: 'v1', cat: 'Grammatica', q: 'Name a 1st-conjugation verb (amo, amare…)', note: '1st person or infinitive',
      t: {
        1: 'amo, porto, voco, laudo, ambulo, laboro, specto, clamo, navigo, pugno, habito, paro, do, sto, oro, nato, erro, servo, iuvo, exspecto, festino, intro, neco, nuntio, oppugno, rogo, supero, vulnero, aedifico, cogito, curo, culpo, dono, expugno, impero, iudico, libero, muto, narro, nomino, postulo, probo, puto, saluto',
        2: 'tempto, vigilo, volo, aestimo, appello, celo, ceno, comparo, creo, declaro, desidero, dubito, existimo, fugo, gusto, honoro, ignoro, indico, lacrimo, lavo, loco, mando, migro, monstro, nego, occupo, orno, privo, propero, pulso, recuso, simulo, spero, sudo, tolero, turbo, vasto, verbero, vexo, iacto, iuro',
        3: 'recordor, interpretor, delecto, devoro, aro, armo, basio, cremo, decoro, dedico, delibero, fatigo, flagro, hiemo, illustro, impetro, inflammo, lustro, macto, obsecro, palpito, plico, repudio, revoco, sacrifico, sedo, sicco, sollicito, spolio, sublevo, suspiro',
        4: 'titubo, triumpho, vacillo, velo, vibro, vindico, violo, vito, hortor, conor, miror, moror, precor, arbitror, cunctor, imitor, laetor, minor, opinor, vagor, venor, comitor',
        5: 'ululo, susurro, rumino, crepito, fumigo, scintillo, nuto, gratulor, aemulor, fabulor, dignor, machinor, epulor',
        6: 'cachinno, pullulo, sternuto, vapulo, sciscitor, aucupor',
      },
    },
    {
      id: 'verba2', lvl: 2, lang: 'la', gen: 'v2', cat: 'Grammatica', q: 'Name a 2nd-conjugation verb (moneo, monere…)', note: '1st person or infinitive',
      t: {
        1: 'habeo, video, moneo, teneo, timeo, debeo, maneo, sedeo, rideo, doceo, iubeo, moveo, respondeo, terreo, valeo, taceo, placeo, noceo, pareo, iaceo, deleo, mereo, prohibeo, persuadeo, praebeo, sileo, studeo, careo, gaudeo, audeo',
        2: 'soleo, fleo, impleo, misceo, augeo, lateo, floreo, egeo, appareo, contineo, obtineo, retineo, sustineo, commoveo, removeo, censeo, mordeo, suadeo, torqueo, ardeo, caveo, faveo, foveo, langueo, lugeo, maereo, mulceo',
        3: 'niteo, oleo, pendeo, polleo, rubeo, splendeo, stupeo, tueor, vereor, fateor, polliceor, misereor, abstineo, exerceo, coerceo, arceo, horreo, luceo, paveo, tondeo, urgeo, pateo',
        4: 'doleo, frigeo, caleo, torreo, strideo, tumeo, vigeo, palleo, fulgeo, rigeo, madeo, cieo, ferveo, immineo, emineo',
        5: 'promineo, torpeo, tepeo, albeo, aveo, liceo, neo, flaveo',
        6: 'conniveo, renideo, squaleo, hebeo',
      },
    },
    {
      id: 'praepabl', lvl: 2, lang: 'la', cat: 'Grammatica', q: 'Name a preposition that takes the ablative',
      t: {
        1: 'in, cum, de, ex/e',
        2: 'ab/a/abs, sine, pro, sub',
        3: 'prae, coram, super, tenus',
        4: 'palam, clam',
        5: 'procul',
        6: 'absque',
      },
    },
    {
      id: 'praepacc', lvl: 2, lang: 'la', cat: 'Grammatica', q: 'Name a preposition that takes the accusative',
      t: {
        1: 'ad, per, in, post, ante, trans, inter, contra, circum, propter',
        2: 'prope, sub, ob, apud, extra, intra, ultra, praeter, supra',
        3: 'infra, iuxta/juxta, adversus/adversum, secundum, citra, erga, penes',
        4: 'circa, super, subter, pone, cis',
        5: 'versus, usque, clam',
        6: 'circiter',
      },
    },
    {
      id: 'familia', lvl: 2, lang: 'la', pl: true, cat: 'Familia', q: 'Name a family member, in Latin',
      t: {
        1: 'pater, mater, frater, soror, filius, filia, avus, avia, uxor, maritus, coniunx/coniux/conjunx, infans, parentes',
        2: 'liberi, nepos, vir, patruus, avunculus, amita, matertera, neptis, socer, socrus, gener, nurus',
        3: 'consobrinus, consobrina, proavus, proavia, germanus, germana, mulier, noverca, vitricus',
        4: 'privignus, privigna, abavus, atavus, patruelis, sobrinus',
        5: 'pronepos, ianitrix/janitrix, abnepos, tritavus',
        6: 'glos, levir',
      },
    },
    {
      id: 'colores', lvl: 2, lang: 'la', adj: true, cat: 'Colores', q: 'Name a colour, in Latin',
      t: {
        1: 'ruber, albus, niger, viridis, caeruleus, flavus, purpureus, candidus, ater, roseus, aureus, fuscus, argenteus',
        2: 'croceus, luteus, fulvus, puniceus, caesius, cinereus, rufus, ravus, glaucus, lividus, pullus',
        3: 'sanguineus, coccineus, aeneus, rutilus, luridus, cyaneus, ferrugineus, lacteus, niveus',
        4: 'igneus, ostrinus, gilvus, badius, spadix, ianthinus',
        5: 'prasinus, venetus, russatus, amethystinus',
        6: 'galbinus, helvus',
      },
    },
    {
      id: 'imperatores', lvl: 2, lang: 'la', cat: 'Imperatores', q: 'Name a Roman emperor', note: 'Latin or English names',
      t: {
        1: 'Augustus/Octavian/Octavianus/Octavius, Nero, Caligula/Gaius, Claudius, Tiberius, Marcus Aurelius/Aurelius, Hadrian/Hadrianus, Constantine/Constantinus, Trajan/Traianus/Trajanus, Vespasian/Vespasianus, Titus, Domitian/Domitianus, Commodus, Diocletian/Diocletianus, Nerva, Antoninus Pius/Antoninus, Septimius Severus/Severus, Caracalla, Galba, Otho, Vitellius, Julian/Iulianus/Julianus, Geta, Elagabalus/Heliogabalus',
        2: 'Severus Alexander/Alexander Severus/Alexander, Lucius Verus/Verus, Macrinus, Maximinus Thrax/Maximinus, Gordian/Gordianus, Philip the Arab/Philippus Arabs/Philippus/Philip, Decius, Valerian/Valerianus, Gallienus, Aurelian/Aurelianus, Probus, Theodosius, Valentinian/Valentinianus, Constantius, Galerius, Maximian/Maximianus, Licinius, Gratian/Gratianus, Honorius, Arcadius, Romulus Augustulus/Augustulus, Jovian/Iovianus/Jovianus, Valens',
        3: 'Pertinax, Didius Julianus/Didius Iulianus/Didius, Justinian/Iustinianus/Justinianus, Carus, Carinus, Numerian/Numerianus, Tacitus, Florianus/Florian, Quintillus, Claudius Gothicus/Claudius II, Trebonianus Gallus/Gallus, Pupienus, Balbinus, Diadumenian/Diadumenianus, Constans, Maxentius, Majorian/Maiorianus/Majorianus',
        4: 'Julius Nepos/Iulius Nepos/Nepos, Marcian/Marcianus, Postumus, Aemilianus/Aemilian, Hostilian/Hostilianus, Volusianus/Volusian, Herennius Etruscus, Olybrius, Anthemius, Avitus, Petronius Maximus, Maximinus Daia/Maximinus Daza',
        5: 'Magnentius, Tetricus, Victorinus, Carausius, Allectus, Leo, Zeno',
        6: 'Glycerius, Libius Severus, Vetranio',
      },
    },
    {
      id: 'domus', lvl: 2, lang: 'la', pl: true, cat: 'Domus', q: 'Name a room or part of a Roman house',
      t: {
        1: 'atrium, impluvium, triclinium, culina, cubiculum, hortus, ianua/janua, peristylium/peristylum, tablinum, compluvium, vestibulum, fenestra, lararium',
        2: 'taberna, latrina, fauces, ala/alae, cella, balneum, exedra, oecus, piscina, bibliotheca, cenaculum, solarium, xystus',
        3: 'hypocaustum/hypocaust, focus, tectum, paries, tegula, limen, pavimentum, posticum, apodyterium',
        4: 'caldarium, tepidarium, frigidarium, cryptoporticus, viridarium, porticus, pergula',
        5: 'nymphaeum, cellarium, conclave, crypta',
        6: 'diaeta, emblema',
      },
    },
    {
      id: 'ordinales', lvl: 2, lang: 'la', adj: true, cat: 'Numeri', q: 'Name a Latin ordinal number (primus, secundus…)',
      t: {
        1: 'primus, secundus, tertius, decimus, quartus, quintus, sextus, septimus, octavus, nonus',
        2: 'centesimus, millesimus, undecimus, duodecimus, vicesimus/vigesimus, tricesimus/trigesimus, quadragesimus, quinquagesimus, tertius decimus',
        3: 'quartus decimus, duodevicesimus, undevicesimus, sexagesimus, septuagesimus, octogesimus',
        4: 'nonagesimus, ducentesimus, trecentesimus, quadringentesimus, quingentesimus',
        5: 'septingentesimus, octingentesimus, nongentesimus',
        6: 'sescentesimus',
      },
    },
    {
      id: 'decl2', lvl: 2, lang: 'la', pl: true, cat: 'Grammatica', q: 'Name a 2nd-declension noun (servus, bellum…)',
      t: {
        1: 'servus, amicus, bellum, dominus, puer, ager, liber, vir, oppidum, verbum, donum, equus, populus, filius, deus, annus, animus, oculus, lupus, campus, cibus, gladius, ludus, murus, numerus, nuntius, socius, ventus, magister, caelum, consilium, forum, imperium, periculum',
        2: 'praemium, proelium, regnum, signum, templum, tectum, vinum, auxilium, aurum, argentum, ferrum, saxum, scutum, studium, officium, gaudium, odium, otium, negotium, exemplum, arma, castra, lucus, fluvius, hortus, lectus, locus, mundus, nidus, ramus, rivus',
        3: 'vestigium, vitium, somnus, sonus, tumulus, umerus, digitus, morbus, nasus, nodus, pontus, stilus, titulus, triumphus, tribunus, legatus, medicus, vicus, fatum, bracchium, convivium, aedificium, beneficium, collum',
        4: 'dorsum, exilium, fanum, frumentum, horreum, ingenium, initium, iugum, lignum, monstrum, ovum, pomum, sepulcrum, silentium, spatium, stagnum, supplicium',
        5: 'theatrum, vallum, humus, fagus, laurus, pirus, malus, vulgus, alvus, cupressus',
        6: 'vannus, colus, carbasus, pelagus, virus',
      },
    },
    {
      id: 'decl3', lvl: 2, lang: 'la', pl: true, cat: 'Grammatica', q: 'Name a 3rd-declension noun (rex, corpus…)',
      t: {
        1: 'rex, lex, pax, lux, vox, mater, pater, frater, homo, nomen, corpus, tempus, mare, urbs, mons, miles, nox, dux, flumen, animal, civis, pons, ars, mors, gens, caput, carmen, opus, iter, labor, amor, sol, sanguis, leo, canis, finis, ignis, navis, hostis, mulier, uxor, soror',
        2: 'virgo, imperator, consul, senator, orator, legio, regio, natio, ratio, oratio, pars, dens, pes, mens, virtus, libertas, civitas, aetas, veritas, ordo, clamor, color, honor, timor, dolor, error, terror, pectus, litus, vulnus, genus, scelus, onus, frons, lapis, hiems, salus, servitus',
        3: 'voluntas, potestas, multitudo, magnitudo, fortitudo, origo, sermo, foedus, frigus, latus, nemus, sidus, os, ius, rus, mus, tellus, aes, aequor, arbor, cor, cinis, crux, laus, fraus, nix, grex, nux, vis, sal',
        4: 'mel, imago, testudo, cupido, carcer, cruor, flos, mos, ros, mercator, iudex, comes, eques, pedes, princeps, sacerdos, custos, nepos, vas, fur, cardo',
        5: 'turbo, harundo, vellus, pecus, iecur, robur, ebur, marmor, sulphur, tuber, ver, fel',
        6: 'iubar, praes, far, hirudo, compes, vibex',
      },
    },
    {
      id: 'mittere', lvl: 2, lang: 'en', cat: 'Derivata', q: 'Name an English word from mittere (to send)',
      t: {
        1: 'mission, transmit, submit, admit, permit, missile, commit, omit, emit, dismiss, remit, missionary, intermittent',
        2: 'emission, submission, admission, permission, commission, omission, transmission, committee, remission, emissary, missive',
        3: 'promise, compromise, premise, surmise, demise, message, remiss, dismissive, permissive',
        4: 'admissible, transmitter, emitter, intermission, manumit, mess',
        5: 'mass, missal, commissar, inadmissible',
        6: 'intromit, pretermit',
      },
    },
    {
      id: 'ducere', lvl: 2, lang: 'en', cat: 'Derivata', q: 'Name an English word from ducere (to lead)',
      t: {
        1: 'conduct, produce, reduce, introduce, educate, product, induce, deduce, seduce, abduct, aqueduct, duct, conductor',
        2: 'production, reduction, introduction, education, viaduct, induction, deduction, producer, duke, conducive, ductile',
        3: 'abduction, seduction, conduit, educe, traduce, reproduce, reproduction, productive, duchess',
        4: 'duchy, introductory, deductive, inductive, subduction, ducal',
        5: 'ducat, doge, adduce, transducer',
        6: 'redoubt, superinduce',
      },
    },
    {
      id: 'manus', lvl: 2, lang: 'en', cat: 'Derivata', q: 'Name an English word from manus (hand)',
      t: {
        1: 'manual, manicure, manufacture, manuscript, manipulate, manage, maneuver/manoeuvre, emancipate',
        2: 'mandate, manacle, manner, manure, manumission, amanuensis, manifest, maintain',
        3: 'manager, management, manipulation, emancipation, manufacturer',
        4: 'maintenance, legerdemain, mortmain',
        5: 'command, demand, commend, recommend',
        6: 'manciple',
      },
    },
    {
      id: 'pater', lvl: 2, lang: 'en', cat: 'Derivata', q: 'Name an English word from pater (father)',
      t: {
        1: 'paternal, paternity, patriot, patron, patrimony, patrician',
        2: 'expatriate, repatriate, compatriot, patronize/patronise, patronage',
        3: 'patriotic, paternalism, paternoster, patriotism',
        4: 'padre, pattern, expatriation',
        5: 'repatriation, patter',
        6: 'perpetrate',
      },
    },
    {
      id: 'cibus', lvl: 2, lang: 'la', pl: true, cat: 'Cibus', q: 'Name a food or drink, in Latin',
      t: {
        1: 'panis, vinum, aqua, lac, mel, caseus, ovum, caro, piscis, pomum, malum, uva, oliva, oleum, sal, frumentum, faba, cepa',
        2: 'puls, garum, allium, ficus, pirum, cerasum, nux, porrum, lens, cicer, rapum, lactuca, cucumis, raphanus, brassica, piper',
        3: 'acetum, libum, farina, hordeum, triticum, far, mustum, placenta, mulsum, posca, butyrum, oryza',
        4: 'perna, lardum, botulus, defrutum, moretum, crustulum, glires, malva, asparagus',
        5: 'offa, liquamen, muria, pepo, tisana',
        6: 'sapa, isicium',
      },
    },

    // ───────────────────────── Level 3 ─────────────────────────
    {
      id: 'militia', lvl: 3, lang: 'la', pl: true, cat: 'Militia', q: 'Name a Roman military term', note: 'Latin',
      t: {
        1: 'legio, miles, gladius, castra, centurio, scutum, pilum, cohors, legatus, galea, lorica, aquila, signum, tribunus, imperator, testudo, ballista, eques, auxilia, vexillum, praetorium, vallum, fossa',
        2: 'contubernium, manipulus, optio, signifer, aquilifer, cornicen, tubicen, onager, aries, pugio, caliga/caligae, cingulum, balteus, sarcina, agmen, acies, centuria, decurio, praefectus, primus pilus, veteranus',
        3: 'triarii, hastati, principes, velites, turma, castellum, praetoriani, catapulta, vexillarius, imaginifer, tesserarius, scorpio, carroballista, spatha, hasta, cassis',
        4: 'umbo, sudes, tribulus, decimatio, sacramentum, stipendium, donativum, speculatores, beneficiarius, evocatus, focale, plumbata/plumbatae',
        5: 'frumentarius/frumentarii, immunis/immunes, cornicularius, lixae, calones, contus',
        6: 'lilia, cippi, campidoctor',
      },
    },
    {
      id: 'auctores', lvl: 3, lang: 'la', cat: 'Auctores', q: 'Name a Roman author', note: 'Latin or English names',
      t: {
        1: 'Cicero, Vergil/Virgil/Vergilius, Ovid/Ovidius, Caesar, Horace/Horatius, Livy/Livius, Catullus, Seneca, Tacitus, Pliny/Plinius, Lucretius, Sallust/Sallustius, Plautus, Terence/Terentius, Martial/Martialis, Juvenal/Iuvenalis/Juvenalis, Suetonius, Propertius, Tibullus, Quintilian/Quintilianus, Ennius, Nepos/Cornelius Nepos, Persius',
        2: 'Lucan/Lucanus, Statius, Petronius, Apuleius, Augustine/Augustinus, Boethius, Ammianus Marcellinus/Ammianus, Varro, Cato, Sulpicia, Valerius Maximus, Vitruvius, Columella, Frontinus, Aulus Gellius/Gellius, Jerome/Hieronymus, Silius Italicus, Valerius Flaccus, Manilius, Phaedrus, Velleius Paterculus/Velleius',
        3: 'Quintus Curtius/Curtius, Florus, Eutropius, Claudian/Claudianus, Ausonius, Symmachus, Fronto, Lucilius, Naevius, Livius Andronicus, Pacuvius, Accius, Celsus, Vegetius, Macrobius, Prudentius, Ambrose/Ambrosius',
        4: 'Tertullian/Tertullianus, Lactantius, Sidonius Apollinaris/Sidonius, Cassiodorus, Isidore/Isidorus, Minucius Felix, Rutilius Namatianus, Censorinus, Nemesianus, Calpurnius Siculus, Avianus',
        5: 'Martianus Capella, Priscian/Priscianus, Servius, Laberius, Afranius, Hyginus, Solinus',
        6: 'Commodian/Commodianus, Dracontius, Corippus',
      },
    },
    {
      id: 'aeneis', lvl: 3, lang: 'la', cat: 'Aeneis', q: "Name a character from Vergil's Aeneid", note: 'Latin or English names',
      t: {
        1: 'Aeneas, Dido, Turnus, Iuno/Juno, Venus, Iuppiter/Jupiter, Ascanius/Iulus, Anchises, Lavinia, Latinus, Creusa, Achates, Pallas, Evander/Euander, Camilla, Mezentius, Nisus, Euryalus, Sibylla/Sibyl, Anna, Laocoon, Priamus/Priam, Hector, Mercurius/Mercury, Aeolus, Neptunus/Neptune, Sinon, Cerberus, Charon, Palinurus, Polyphemus, Andromache, Achaemenides',
        2: 'Helenus, Iarbas, Amata, Allecto, Iuturna/Juturna, Lausus, Drances, Acestes, Entellus, Dares, Misenus, Deiphobus, Marcellus, Pyrrhus/Neoptolemus, Hecuba, Cacus, Hercules, Vulcanus/Vulcan, Messapus, Ilioneus, Mnestheus, Serestus, Iris, Fama/Rumour, Sychaeus, Pygmalion, Romulus, Augustus, Cloanthus, Gyas',
        3: 'Sergestus, Iapyx, Tolumnius, Orpheus, Minos, Rhadamanthus, Tisiphone, Ixion, Theseus, Musaeus, Silvius, Numa, Brutus, Coroebus, Panthus, Polites, Arruns, Tarchon, Barce, Saces, Salmoneus, Tityos, Phlegyas',
        4: 'Camillus, Rhipeus, Dymas, Androgeos, Halaesus, Ufens, Umbro, Aventinus, Caeculus, Catillus, Coras, Virbius, Opis, Acca, Asilas, Aletes, Nautes',
        5: 'Beroe, Pandarus, Bitias, Butes, Eurytion, Lycus, Helymus, Patron, Salius',
        6: 'Hypanis, Metabus, Cymodocea, Diores, Thymoetes',
      },
    },
    {
      id: 'sidera', lvl: 3, lang: 'la', cat: 'Sidera', q: 'Name a constellation by its Latin name',
      t: {
        1: 'Ursa Maior/Ursa Major, Ursa Minor, Orion, Leo, Taurus, Gemini, Scorpius/Scorpio, Cancer, Virgo, Libra, Sagittarius, Capricornus/Capricorn, Aquarius, Pisces, Aries, Cygnus, Draco, Cassiopeia, Andromeda, Perseus, Pegasus, Hercules, Lyra, Aquila, Canis Maior/Canis Major',
        2: 'Corona Borealis, Canis Minor, Lepus, Columba, Delphinus, Sagitta, Bootes, Cepheus, Hydra, Corvus, Crater, Centaurus, Lupus, Auriga, Crux, Ophiuchus, Serpens, Eridanus, Corona Australis, Piscis Austrinus, Triangulum, Vulpecula',
        3: 'Monoceros, Camelopardalis, Pyxis, Carina, Puppis, Vela, Musca, Fornax, Sculptor, Telescopium, Ara, Coma Berenices, Canes Venatici, Lacerta, Lynx, Leo Minor, Scutum, Hydrus',
        4: 'Tucana, Pavo, Grus, Phoenix, Dorado, Mensa, Caelum, Pictor, Horologium, Norma, Circinus, Octans',
        5: 'Apus, Volans, Indus, Chamaeleon, Triangulum Australe, Sextans, Equuleus',
        6: 'Antlia, Reticulum, Microscopium',
      },
    },
    {
      id: 'virtutes', lvl: 3, lang: 'la', pl: true, cat: 'Mores', q: 'Name a Roman virtue or value, in Latin',
      t: {
        1: 'virtus, pietas, fides, gravitas, dignitas, clementia, constantia, prudentia, iustitia/justitia, fortitudo, temperantia, honestas, humanitas, auctoritas, disciplina, veritas, libertas, concordia, honos/honor',
        2: 'frugalitas, industria, severitas, aequitas, comitas, firmitas, simplicitas, salubritas, modestia, pudicitia, magnanimitas, liberalitas, benevolentia, fidelitas, patientia, sapientia, spes, caritas',
        3: 'castitas, sanctitas, misericordia, gratia, amicitia, officium, mos maiorum, decus, gloria, integritas, innocentia, continentia, sobrietas',
        4: 'verecundia, diligentia, providentia, felicitas, securitas, tranquillitas, munificentia, magnificentia, indulgentia, hilaritas',
        5: 'laetitia, pudor, probitas, religio, aequanimitas',
        6: 'urbanitas, mansuetudo, longanimitas',
      },
    },
    {
      id: 'loca', lvl: 3, lang: 'la', cat: 'Orbis Romanus', q: 'Name a city of the Roman world by its Latin name',
      t: {
        1: 'Roma, Pompeii, Carthago, Athenae, Troia, Ostia, Neapolis, Herculaneum, Capua, Brundisium, Londinium, Alexandria, Byzantium, Constantinopolis, Syracusae, Corinthus, Sparta, Hierosolyma, Mediolanum, Ravenna, Antiochia, Tarentum, Lutetia, Lugdunum, Massilia, Narbo, Burdigala, Hispalis, Gades, Tarraco',
        2: 'Eboracum, Aquae Sulis, Deva, Emerita Augusta, Toletum, Caesarea, Leptis Magna, Vindobona, Aquincum, Thessalonica, Ephesus, Pergamum, Smyrna, Tyrus, Sidon, Damascus, Palmyra, Cyrene, Utica, Tibur, Veii, Alba Longa, Cumae, Puteoli, Baiae, Aquileia, Verona',
        3: 'Camulodunum, Lindum, Verulamium, Colonia Agrippina, Patavium, Bononia, Florentia, Pisae, Ariminum, Beneventum, Corduba, Saguntum, Alesia, Augusta Treverorum, Sirmium, Hippo Regius, Tusculum, Praeneste, Lavinium, Ardea, Misenum, Stabiae',
        4: 'Placentia, Arretium, Clusium, Perusia, Ancona, Rhegium, Messana, Panormus, Lilybaeum, Carthago Nova, Numantia, Gergovia, Avaricum, Mogontiacum, Isca',
        5: 'Petra, Bostra, Castra Regina, Augusta Vindelicorum, Noviomagus, Vindolanda, Corinium, Durovernum',
        6: 'Durocortorum, Luguvalium, Segedunum, Thamugadi',
      },
    },
    {
      id: 'feriae', lvl: 3, lang: 'la', cat: 'Fasti', q: 'Name a Roman festival', note: 'Latin',
      t: {
        1: 'Saturnalia, Lupercalia, Floralia, Vestalia, Parilia/Palilia, Liberalia, Matronalia, Lemuria, Cerealia, Parentalia, Ludi Romani',
        2: 'Vinalia, Consualia, Terminalia, Quirinalia, Robigalia, Volcanalia/Vulcanalia, Neptunalia, Opalia, Compitalia, Ambarvalia',
        3: 'Feralia, Megalesia/Megalensia, Ludi Plebeii, Ludi Apollinares, Ludi Saeculares, Fordicidia, Agonalia, Equirria',
        4: 'Poplifugia, Larentalia, Carmentalia, Fontinalia, Armilustrium, Fornacalia',
        5: 'Septimontium, Furrinalia, Portunalia',
        6: 'Tubilustrium, Meditrinalia',
      },
    },
    {
      id: 'lux', lvl: 3, lang: 'en', cat: 'Derivata', q: 'Name an English word from lux / lumen (light)',
      t: {
        1: 'lucid, illuminate, luminous, translucent, elucidate, illumination',
        2: 'luminary, lux, lucent, luminosity, bioluminescent/bioluminescence',
        3: 'Lucifer, illumine, pellucid, luculent',
        4: 'lumen, relucent',
        5: 'noctilucent, limn',
        6: 'lucubration',
      },
    },
  ];
})(window.RA = window.RA || {});
