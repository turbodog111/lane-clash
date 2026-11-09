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
        2: 'sanguis, cutis, facies, barba, labrum, palma, cervix, femur, cubitum, talus, pulmo, stomachus, cerebrum, vultus, nervus, musculus, costa, vena, viscera, tibia, intestinum, membrum, pellis',
        3: 'maxilla, cartilago, pollex, mamma, umbilicus, iugulum, palatum, iecur, calx, mentum, gena, ren/renes, supercilium, unguis, latus, crinis, medulla, guttur, articulus',
        4: 'fauces, lacertus, vesica, pupula, axilla, coxa, sura, tempora, occiput, artus',
        5: 'nates, clunes, inguen, palpebra, poples, lien',
        6: 'sinciput, praecordia, ilia',
      },
    },
    {
      id: 'dei', lvl: 1, lang: 'la', cat: 'Di Immortales', q: 'Name a Roman god or goddess', note: 'Latin or English names',
      t: {
        1: 'Iuppiter/Iupiter/Jupiter/Jove, Iuno/Juno, Venus, Mars, Neptunus/Neptune, Minerva, Apollo, Mercurius/Mercury, Diana, Cupido/Cupid/Amor, Vulcanus/Vulcan, Vesta, Ceres, Bacchus, Pluto, Saturnus/Saturn, Ianus/Janus, Proserpina/Proserpine, Aurora, Sol/Sol Invictus, Luna, Fortuna, Faunus, Flora, Pomona',
        2: 'Liber, Dis/Dis Pater, Terminus, Victoria, Bellona, Quirinus, Somnus, Mors, Nox, Ops, Tellus/Terra Mater, Orcus, Lares, Penates, Genius, Silvanus, Fides, Concordia, Pax, Spes, Salus, Iuventas/Juventas, Hercules',
        3: 'Aesculapius, Vertumnus, Portunus, Pales, Consus, Fauna, Bona Dea, Carmenta, Egeria, Pietas, Virtus, Honos, Febris, Libertas, Feronia, Robigus, Picus, Volturnus, Castor, Pollux, Magna Mater/Cybele/Mater Magna',
        4: 'Tiberinus, Laverna, Lucina, Cardea, Larunda, Libitina, Angerona, Furrina, Vacuna, Cloacina, Rumina, Cunina, Mithras',
        5: 'Abeona, Adeona, Pilumnus, Picumnus, Fornax, Mena, Mefitis',
        6: 'Sterquilinus, Forculus, Limentinus, Nundina',
      },
    },
    {
      id: 'locutiones', lvl: 1, lang: 'en', cat: 'Locutiones', q: 'Name a Latin phrase still used in English',
      t: {
        1: 'et cetera/etcetera/etc, exempli gratia/eg, id est/ie, vice versa, carpe diem, per se, ad hoc, status quo, alma mater, et al/et alii/et alia, ante meridiem/am, post meridiem/pm, bona fide, quid pro quo, de facto, ad nauseam, mea culpa, persona non grata, terra firma, magnum opus, non sequitur, in vitro, per capita, pro bono, ad infinitum, memento mori, post mortem, curriculum vitae/cv, veni vidi vici, e pluribus unum, summa cum laude, cum laude, in situ, modus operandi, per annum, per diem, prima facie, ad libitum/ad lib, a priori',
        2: 'alter ego, anno domini, rigor mortis, et tu brute, tempus fugit, in memoriam, ad astra, alea iacta est/alea jacta est, tabula rasa, sine qua non, caveat emptor, habeas corpus, ad hominem, deus ex machina, ex post facto, in absentia, in loco parentis, magna cum laude, mutatis mutandis, ceteris paribus, quod erat demonstrandum/qed, nota bene/nb, post scriptum/ps, requiescat in pace/rip, in toto, ipso facto, sui generis, terra incognita, ex libris, pro forma, pro rata, semper fidelis, ante bellum/antebellum, cogito ergo sum, in vino veritas, a posteriori, ex officio, inter alia, pro tempore/pro tem',
        3: 'de iure/de jure, in medias res, vox populi, pax romana, sub rosa, casus belli, cui bono, mens rea, corpus delicti, ex nihilo, festina lente, in extremis, lapsus linguae, primus inter pares, ars longa vita brevis, compos mentis/non compos mentis, ex cathedra, sic transit gloria mundi, sub iudice/sub judice, panem et circenses, nil desperandum, semper paratus, fiat lux, agnus dei, gloria in excelsis deo, omnia vincit amor, audentes fortuna iuvat/fortes fortuna iuvat/fortes fortuna adiuvat, in flagrante delicto/in flagrante, sine die, ex gratia',
        4: 'facilis descensus averno, rara avis, ad fontes, odi et amo, quis custodiet ipsos custodes, reductio ad absurdum, si vis pacem para bellum, labor omnia vincit, dulce et decorum est, sic semper tyrannis, ad maiorem dei gloriam/ad majorem dei gloriam/amdg, ecce homo, dominus vobiscum, pax vobiscum, de profundis, deo volente, vade mecum, in camera, obiter dictum, terminus ante quem, terminus post quem, ultima ratio, amor fati, de novo',
        5: 'ora et labora, timeo danaos et dona ferentes, hic sunt dracones, horror vacui, ubi sunt, sunt lacrimae rerum/lacrimae rerum, fiat iustitia ruat caelum/fiat justitia ruat caelum, hoc opus hic labor est, tu ne cede malis, ad valorem, ad interim, damnatio memoriae',
        6: 'ignotum per ignotius, nemo iudex in causa sua, argumentum ad baculum, arbiter elegantiarum, natura non facit saltus',
      },
    },
    {
      id: 'numeri', lvl: 1, lang: 'la', adj: true, cat: 'Numeri', q: 'Name a Latin cardinal number (unus, duo…)',
      t: {
        1: 'novem, unus, duo, tres, decem, centum, mille/milia, quattuor, quinque, sex, septem, octo',
        2: 'viginti, undecim, duodecim, tredecim, quattuordecim, quindecim, sedecim, septendecim',
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
        3: 'Kalendae/Calendae/Kalends, Nonae/Nones, Idus/Ides/Idus Martiae',
        4: 'Quintilis, Sextilis',
        5: 'Intercalaris/Mensis Intercalaris',
        6: 'Mercedonius',
      },
    },
    {
      id: 'decl1', lvl: 1, lang: 'la', pl: true, cat: 'Grammatica', q: 'Name a 1st-declension noun (puella, aqua…)',
      t: {
        1: 'puella, aqua, terra, via, rosa, vita, porta, femina, insula, silva, agricola, nauta, poeta, incola, villa, casa, fama, gloria, lingua, luna, stella, patria, familia, epistula, fabula, filia, hora, ira, ianua/janua, mensa, pecunia, pugna, sagitta, schola',
        2: 'pirata, athleta, unda, victoria, cena, culpa, cura, fortuna, fuga, hasta, littera, memoria, natura, poena, regina, sententia, turba, umbra, causa, dea, domina, corona, aquila, provincia, aurora, statua, machina, forma, ruina, taberna, fenestra, culina, anima, musa',
        3: 'sapientia, scientia, tabula, toga, tunica, iniuria, insidiae, divitiae, tenebrae, flamma, gemma, gratia, herba, lacrima, vacca, ursa, uva, planta, rota, palma, spina, nuptiae, ara, galea, fossa, querela, praeda, ancilla, columna, harena/arena, ora, copia',
        4: 'procella, auriga, cometa, vigilia, catena, cera, charta, coma, lucerna, mora, nebula, penna, sella, scriba, collega, tuba, fera, ripa, cauda',
        5: 'perfuga, accola, transfuga, lanista, conviva, advena, indigena, parricida',
        6: 'scurra, verna, lixa, Hadria',
      },
    },
    {
      id: 'portare', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from portare (to carry)',
      t: {
        1: 'portable, transport, import, export, report, support, deport, porter, transportation',
        2: 'important, comport, purport, portfolio, reporter, supporter, deportation, importation, exportation, importance, supportive, transporter, exporter, importer',
        3: 'rapport, portmanteau, deportment, insupportable, unsupportable, portage, portability',
        4: 'portly, comportment, reportage, sport',
        5: 'disport, portamento, portative',
        6: 'colporteur',
      },
    },
    {
      id: 'videre', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from videre (to see)',
      t: {
        1: 'video, vision, visible, evident, provide, visit, invisible, television, visual, revise, supervise, advise, visa, envision',
        2: 'evidence, improvise, provision, visionary, visor, vista, revision, supervisor, visitor, visualize/visualise, visibility, audiovisual, provisional, improvisation, envisage, revisit, supervision',
        3: 'interview, preview, purview, clairvoyant, voyeur, providence, visage, envy, survey, view, review, vis-a-vis/visavis, advice, visitation',
        4: 'invidious, provident, prudent, prudence, improvident, deja vu, vide',
        5: 'belvedere, purveyor, purvey',
        6: 'veduta',
      },
    },
    {
      id: 'scribere', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from scribere (to write)',
      t: {
        1: 'script, describe, scribe, scripture, prescription, subscribe, manuscript, inscribe, prescribe, transcribe, postscript',
        2: 'transcript, description, inscription, subscription, conscript, scribble, circumscribe, proscribe, ascribe, descriptive, subscriber',
        3: 'conscription, subscript, superscript, scribal, transcription, indescribable, prescriptive, nondescript, typescript',
        4: 'rescript, scrivener, ascription, scriptorium, circumscription, proscription',
        5: 'scrip, escritoire',
        6: 'shrive, shrift',
      },
    },
    {
      id: 'aqua', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from aqua (water)',
      t: {
        1: 'aquarium, aquatic, aqueduct, aquamarine, Aquarius',
        2: 'aqueous, aquifer, aquaplane, aquaculture, aqualung',
        3: 'aquavit, aquarelle, aquanaut, aqua vitae',
        4: 'aquatint, subaqueous, terraqueous, aquarist',
        5: 'sewer',
        6: 'ewer',
      },
    },
    {
      id: 'audire', lvl: 1, lang: 'en', cat: 'Derivata', q: 'Name an English word from audire (to hear)',
      t: {
        1: 'audio, audience, audible, auditorium, audition, auditor',
        2: 'inaudible, audit, audiovisual, auditory, audiobook, inaudibly, audibly',
        3: 'obey, obedient, obedience, audiology, audiophile, disobedience',
        4: 'disobey, disobedient, obeisance',
        5: 'subaudition',
        6: 'oyez',
      },
    },

    // ───────────────────────── Level 2 ─────────────────────────
    {
      id: 'verba1', lvl: 2, lang: 'la', gen: 'v1', cat: 'Grammatica', q: 'Name a 1st-conjugation verb (amo, amare…)', note: '1st person or infinitive',
      t: {
        1: 'amo, porto, voco, laudo, ambulo, laboro, specto, clamo, navigo, pugno, habito, paro, do, sto, oro, nato, erro, servo, iuvo, exspecto, festino, intro, neco, nuntio, oppugno, rogo, supero, vulnero, aedifico, cogito, curo, culpo, dono, expugno, impero, iudico, libero, muto, narro, nomino, postulo, probo, puto, saluto, considero, conservo, demonstro, exploro, invito',
        2: 'tempto, vigilo, volo, aestimo, appello, celo, ceno, comparo, creo, declaro, desidero, dubito, existimo, fugo, gusto, honoro, ignoro, indico, lacrimo, lavo, loco, mando, migro, monstro, nego, occupo, orno, privo, propero, pulso, recuso, simulo, spero, sudo, tolero, turbo, vasto, verbero, vexo, iacto, iuro, imitor, delecto, veto, educo, convoco, recito',
        3: 'recordor, interpretor, devoro, aro, armo, basio, cremo, decoro, dedico, delibero, fatigo, flagro, hiemo, illustro, impetro, inflammo, repudio, revoco, sacrifico, sollicito, spolio, sublevo, suspiro, hortor, conor, miror, vito, commendo, opto, pecco, seco, domo, ploro, certo, evoco',
        4: 'titubo, triumpho, vacillo, velo, vibro, vindico, violo, moror, precor, arbitror, cunctor, laetor, minor, opinor, vagor, venor, comitor, mico, stillo, obsecro, palpito, plico, sicco, sedo, macto, lustro',
        5: 'ululo, susurro, rumino, crepito, fumigo, scintillo, nuto, gratulor, aemulor, fabulor, dignor, machinor, epulor',
        6: 'cachinno, pullulo, sternuto, vapulo, sciscitor, aucupor',
      },
    },
    {
      id: 'verba2', lvl: 2, lang: 'la', gen: 'v2', cat: 'Grammatica', q: 'Name a 2nd-conjugation verb (moneo, monere…)', note: '1st person or infinitive',
      t: {
        1: 'habeo, video, moneo, teneo, timeo, debeo, maneo, sedeo, rideo, doceo, iubeo, moveo, respondeo, terreo, valeo, taceo, placeo, noceo, pareo, iaceo, deleo, mereo, prohibeo, persuadeo, praebeo, sileo, studeo, careo, gaudeo, audeo',
        2: 'soleo, fleo, impleo, misceo, augeo, lateo, floreo, egeo, appareo, contineo, obtineo, retineo, sustineo, commoveo, removeo, censeo, mordeo, suadeo, torqueo, ardeo, caveo, faveo, foveo, langueo, lugeo, maereo, mulceo, doleo, exerceo, vereor, fateor',
        3: 'oleo, pendeo, rubeo, splendeo, tueor, polliceor, misereor, abstineo, coerceo, arceo, horreo, luceo, urgeo, pateo, caleo, frigeo, adhibeo, exhibeo, pertineo, detineo, abhorreo, invideo, provideo, spondeo',
        4: 'torreo, strideo, tumeo, vigeo, palleo, fulgeo, rigeo, madeo, cieo, ferveo, immineo, emineo, polleo, cohibeo, sorbeo, reor, medeor, niteo, stupeo, tondeo, paveo',
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
        3: 'infra, iuxta/juxta, adversus/adversum, secundum, citra, erga, circa',
        4: 'super, subter, pone, cis, penes',
        5: 'versus, usque, clam',
        6: 'circiter',
      },
    },
    {
      id: 'familia', lvl: 2, lang: 'la', pl: true, cat: 'Familia', q: 'Name a family member, in Latin',
      t: {
        1: 'pater, mater, frater, soror, filius, filia, avus, avia, uxor, maritus, coniunx/coniux/conjunx, infans, parentes',
        2: 'liberi, nepos, vir, patruus, avunculus, amita, matertera, neptis, socer, socrus, gener, nurus, mulier, pater familias/paterfamilias',
        3: 'consobrinus, consobrina, proavus, proavia, germanus, germana, noverca, vitricus, mater familias/materfamilias, sponsus/sponsa/sponsae, vidua, matrona, geminus/gemina/geminae, natus/nata/natae',
        4: 'privignus, privigna, abavus, atavus, patruelis, sobrinus, cognatus/cognata/cognatae, affinis, proles',
        5: 'pronepos, ianitrix/janitrix, abnepos, tritavus',
        6: 'glos, levir',
      },
    },
    {
      id: 'colores', lvl: 2, lang: 'la', adj: true, cat: 'Colores', q: 'Name a colour, in Latin',
      t: {
        1: 'ruber, albus, niger, viridis, caeruleus, flavus, purpureus, candidus, ater, roseus, aureus, fuscus',
        2: 'croceus, luteus, fulvus, rufus, glaucus, lividus, argenteus, niveus, sanguineus, cyaneus',
        3: 'coccineus, aeneus, rutilus, luridus, ferrugineus, lacteus, pullus, cinereus, puniceus, igneus, violaceus, canus, rubicundus',
        4: 'ostrinus, badius, ianthinus, ravus, caesius, venetus, amethystinus, albidus',
        5: 'prasinus, russatus, gilvus, spadix, cereus',
        6: 'galbinus, helvus',
      },
    },
    {
      id: 'imperatores', lvl: 2, lang: 'la', cat: 'Imperatores', q: 'Name a Roman emperor', note: 'Latin or English names',
      t: {
        1: 'Augustus/Octavian/Octavianus/Octavius, Nero, Caligula/Gaius, Claudius, Tiberius, Marcus Aurelius/Aurelius/Marcus, Hadrian/Hadrianus, Constantine/Constantinus, Trajan/Traianus/Trajanus, Vespasian/Vespasianus, Titus, Domitian/Domitianus, Commodus, Diocletian/Diocletianus, Nerva, Antoninus Pius/Antoninus, Septimius Severus/Severus, Caracalla',
        2: 'Severus Alexander/Alexander Severus/Alexander, Lucius Verus/Verus, Macrinus, Maximinus Thrax/Maximinus, Gordian/Gordianus, Philip the Arab/Philippus Arabs/Philippus/Philip, Decius, Valerian/Valerianus, Gallienus, Aurelian/Aurelianus, Probus, Theodosius, Valentinian/Valentinianus, Constantius, Honorius, Romulus Augustulus/Augustulus, Jovian/Iovianus/Jovianus, Valens, Geta, Elagabalus/Heliogabalus, Julian/Iulianus/Julianus, Galba, Otho, Vitellius',
        3: 'Pertinax, Didius Julianus/Didius Iulianus/Didius, Justinian/Iustinianus/Justinianus, Carus, Carinus, Numerian/Numerianus, Tacitus, Claudius Gothicus/Claudius II, Trebonianus Gallus/Gallus, Constans, Maxentius, Majorian/Maiorianus/Majorianus, Licinius, Maximian/Maximianus, Galerius, Gratian/Gratianus, Arcadius',
        4: 'Julius Nepos/Iulius Nepos/Nepos, Marcian/Marcianus, Postumus, Aemilianus/Aemilian, Avitus, Petronius Maximus, Maximinus Daia/Maximinus Daza, Quintillus, Florianus/Florian, Diadumenian/Diadumenianus, Pupienus, Balbinus, Tetricus, Carausius',
        5: 'Magnentius, Victorinus, Allectus, Leo, Zeno, Herennius Etruscus, Hostilian/Hostilianus, Volusianus/Volusian, Olybrius, Anthemius',
        6: 'Glycerius, Libius Severus, Vetranio',
      },
    },
    {
      id: 'domus', lvl: 2, lang: 'la', pl: true, cat: 'Domus', q: 'Name a room or part of a Roman house',
      t: {
        1: 'atrium, impluvium, triclinium, culina, cubiculum, hortus, ianua/janua, peristylium/peristylum, tablinum, compluvium, vestibulum, fenestra, lararium',
        2: 'taberna, latrina, fauces, ala/alae, cella, balneum, piscina, bibliotheca, solarium, focus, hypocaustum/hypocaust, porticus, ostium',
        3: 'tectum, paries, tegula, limen, pavimentum, caldarium, tepidarium, frigidarium, pergula, cellarium, murus, scala/scalae, fores, columna, cisterna',
        4: 'viridarium, nymphaeum, conclave, crypta, puteus, pistrinum, apodyterium, cenaculum, exedra',
        5: 'oecus, xystus, posticum, cenatio, cryptoporticus',
        6: 'diaeta, emblema',
      },
    },
    {
      id: 'ordinales', lvl: 2, lang: 'la', adj: true, cat: 'Numeri', q: 'Name a Latin ordinal number (primus, secundus…)',
      t: {
        1: 'primus, secundus, tertius, decimus, quartus, quintus, sextus, septimus, octavus, nonus',
        2: 'centesimus, millesimus, undecimus, duodecimus, vicesimus/vigesimus, tricesimus/trigesimus, quadragesimus, quinquagesimus, tertius decimus',
        3: 'quartus decimus, duodevicesimus, undevicesimus, sexagesimus, septuagesimus, octogesimus',
        4: 'nonagesimus, ducentesimus, trecentesimus, quadringentesimus, quingentesimus, alter',
        5: 'septingentesimus, octingentesimus, nongentesimus',
        6: 'sescentesimus',
      },
    },
    {
      id: 'decl2', lvl: 2, lang: 'la', pl: true, cat: 'Grammatica', q: 'Name a 2nd-declension noun (servus, bellum…)',
      t: {
        1: 'servus, amicus, bellum, dominus, puer, ager, liber, vir, oppidum, verbum, donum, equus, populus, filius, deus, annus, animus, oculus, lupus, campus, cibus, gladius, ludus, murus, numerus, nuntius, socius, ventus, magister, caelum, consilium, forum, imperium, periculum',
        2: 'praemium, proelium, regnum, signum, templum, tectum, vinum, auxilium, aurum, argentum, ferrum, saxum, scutum, studium, officium, gaudium, odium, otium, negotium, exemplum, arma, castra, lucus, fluvius, hortus, lectus, locus, mundus, nidus, ramus, rivus, theatrum, liberi',
        3: 'vestigium, vitium, somnus, sonus, tumulus, umerus, digitus, morbus, nasus, triumphus, tribunus, legatus, medicus, vicus, fatum, bracchium, convivium, aedificium, beneficium, collum, silentium, spatium, monstrum, initium, ovum, vallum, tergum, faber, minister, aper',
        4: 'dorsum, exilium, fanum, frumentum, horreum, ingenium, iugum, lignum, pomum, sepulcrum, stagnum, supplicium, virus, gener, socer, carrus, clipeus, baculum, pontus, stilus, titulus, nodus',
        5: 'humus, fagus, laurus, pirus, malus, vulgus, alvus, cupressus',
        6: 'vannus, colus, carbasus, pelagus',
      },
    },
    {
      id: 'decl3', lvl: 2, lang: 'la', pl: true, cat: 'Grammatica', q: 'Name a 3rd-declension noun (rex, corpus…)',
      t: {
        1: 'rex, lex, pax, lux, vox, mater, pater, frater, homo, nomen, corpus, tempus, mare, urbs, mons, miles, nox, dux, flumen, animal, civis, pons, ars, mors, gens, caput, carmen, opus, iter, labor, amor, sol, sanguis, leo, canis, finis, ignis, navis, hostis, mulier, uxor, soror',
        2: 'virgo, imperator, consul, senator, orator, legio, regio, natio, ratio, oratio, pars, dens, pes, mens, virtus, libertas, civitas, aetas, veritas, ordo, clamor, color, honor, timor, dolor, error, terror, pectus, litus, vulnus, genus, scelus, onus, frons, lapis, hiems, salus, servitus, aestas, senex, iuvenis, parens, infans, avis, nubes',
        3: 'voluntas, potestas, multitudo, magnitudo, fortitudo, origo, sermo, foedus, frigus, latus, nemus, sidus, os, ius, rus, mus, arbor, cor, crux, laus, nix, grex, vis, flos, mos, mercator, iudex, princeps, comes, imago, piscis, ovis, turris, tempestas, auctor',
        4: 'testudo, cupido, carcer, eques, pedes, sacerdos, custos, nepos, marmor, tuber, ver, tellus, aes, aequor, cinis, fraus, sal, mel, nux, sulphur, moenia, caedes, clades',
        5: 'turbo, harundo, vellus, pecus, iecur, robur, ebur, fel, cardo, cruor, ros, vas, fur',
        6: 'iubar, praes, far, hirudo, compes, vibex',
      },
    },
    {
      id: 'mittere', lvl: 2, lang: 'en', cat: 'Derivata', q: 'Name an English word from mittere (to send)',
      t: {
        1: 'mission, transmit, submit, admit, permit, missile, commit, omit, emit, dismiss, remit, missionary',
        2: 'emission, submission, admission, permission, commission, omission, transmission, committee, dismissive, permissive, transmitter, emitter, intermission, commitment',
        3: 'promise, compromise, premise, message, remittance, remission, emissary, intermittent, submissive, admissible, inadmissible',
        4: 'manumit, commissar, remiss, surmise, demise, missive',
        5: 'mass, missal, mess',
        6: 'intromit, pretermit',
      },
    },
    {
      id: 'ducere', lvl: 2, lang: 'en', cat: 'Derivata', q: 'Name an English word from ducere (to lead)',
      t: {
        1: 'conduct, produce, reduce, introduce, educate, product, induce, deduce, seduce, abduct, aqueduct, duct, conductor',
        2: 'production, reduction, introduction, education, viaduct, induction, deduction, producer, duke, conducive, introductory, deductive, inductive, productivity, educational, conductive, induct',
        3: 'abduction, seduction, conduit, reproduce, reproduction, productive, duchess, duchy, ductile, subduction, transducer',
        4: 'ducal, educe, traduce, adduce',
        5: 'ducat, doge, superinduce',
        6: 'redoubt',
      },
    },
    {
      id: 'manus', lvl: 2, lang: 'en', cat: 'Derivata', q: 'Name an English word from manus (hand)',
      t: {
        1: 'manual, manicure, manufacture, manuscript, manipulate, manage, maneuver/manoeuvre, emancipate',
        2: 'mandate, manacle, manifest, manager, management, manipulation, emancipation, manufacturer, manipulative',
        3: 'manner, maintain, maintenance, manure, command, demand, recommend',
        4: 'manumission, amanuensis, commend, manumit',
        5: 'mortmain, legerdemain',
        6: 'manciple',
      },
    },
    {
      id: 'pater', lvl: 2, lang: 'en', cat: 'Derivata', q: 'Name an English word from pater (father)',
      t: {
        1: 'paternal, paternity, patriot, patron, patriotic, patriotism',
        2: 'expatriate, repatriate, compatriot, patronize/patronise, patronage, patrician, patrimony',
        3: 'paternalism, paternoster, padre, expatriation, repatriation, paterfamilias',
        4: 'pattern, compadre',
        5: 'patter',
        6: 'perpetrate',
      },
    },
    {
      id: 'cibus', lvl: 2, lang: 'la', pl: true, cat: 'Cibus', q: 'Name a food or drink, in Latin',
      t: {
        1: 'panis, vinum, aqua, lac, mel, caseus, ovum, caro, piscis, pomum, malum, uva, oliva/olea, oleum, sal, frumentum',
        2: 'puls, garum, allium, ficus, pirum, cerasum, nux, piper, faba, cepa, porrum, lactuca, cucumis, farina, asparagus',
        3: 'acetum, libum, hordeum, triticum, far, mustum, placenta, mulsum, cicer, lens, rapum, brassica, lardum, glires',
        4: 'perna, botulus, moretum, crustulum, malva, raphanus, oryza, butyrum, posca, pepo, cerevisia, cucurbita, prunum, citrum',
        5: 'offa, liquamen, muria, tisana, defrutum, persicum',
        6: 'sapa, isicium',
      },
    },

    // ───────────────────────── Level 3 ─────────────────────────
    {
      id: 'militia', lvl: 3, lang: 'la', pl: true, cat: 'Militia', q: 'Name a Roman military term', note: 'Latin',
      t: {
        1: 'legio, miles, gladius, castra, centurio, scutum, pilum, cohors, legatus, galea, lorica, aquila, signum, tribunus, imperator, testudo, eques, auxilia, vexillum, vallum, fossa, exercitus, bellum, arma',
        2: 'contubernium, manipulus, optio, signifer, aquilifer, cornicen, tubicen, onager, aries, pugio, caliga/caligae, cingulum, balteus, sarcina, agmen, acies, centuria, decurio, praefectus, veteranus, ballista, praetorium, catapulta, hasta, dux, proelium, hostis, sagitta, triumphus',
        3: 'triarii, hastati, principes, velites, turma, castellum, praetoriani, vexillarius, imaginifer, tesserarius, scorpio, carroballista, spatha, cassis, primus pilus, decimatio, stipendium, sagittarius, impedimenta, classis',
        4: 'umbo, sudes, tribulus, sacramentum, donativum, speculatores, beneficiarius, evocatus, focale, plumbata/plumbatae, funda, funditor, phalerae, cuneus',
        5: 'frumentarius/frumentarii, immunis/immunes, cornicularius, lixae, calones, contus',
        6: 'lilia, cippi, campidoctor',
      },
    },
    {
      id: 'auctores', lvl: 3, lang: 'la', cat: 'Auctores', q: 'Name a Roman author', note: 'Latin or English names',
      t: {
        1: 'Cicero/Tully/Tullius, Vergil/Virgil/Vergilius/Maro, Ovid/Ovidius/Naso, Caesar/Julius Caesar, Horace/Horatius, Livy/Livius, Catullus, Seneca/Seneca the Younger, Tacitus, Pliny/Plinius/Pliny the Elder/Pliny the Younger, Lucretius, Sallust/Sallustius, Plautus, Terence/Terentius, Martial/Martialis, Juvenal/Iuvenalis/Juvenalis, Suetonius, Propertius, Tibullus, Nepos/Cornelius Nepos',
        2: 'Lucan/Lucanus, Statius, Petronius, Apuleius, Augustine/Augustinus, Boethius, Ammianus Marcellinus/Ammianus, Varro, Cato, Sulpicia, Valerius Maximus, Vitruvius, Columella, Frontinus, Aulus Gellius/Gellius, Jerome/Hieronymus, Silius Italicus, Valerius Flaccus, Manilius, Phaedrus, Velleius Paterculus/Velleius, Quintilian/Quintilianus, Ennius, Persius',
        3: 'Quintus Curtius/Curtius, Florus, Eutropius, Claudian/Claudianus, Ausonius, Symmachus, Fronto, Lucilius, Naevius, Livius Andronicus, Pacuvius, Accius, Celsus, Vegetius, Macrobius, Prudentius, Ambrose/Ambrosius, Apicius',
        4: 'Tertullian/Tertullianus, Lactantius, Sidonius Apollinaris/Sidonius, Cassiodorus, Isidore/Isidorus, Minucius Felix, Rutilius Namatianus, Censorinus, Nemesianus, Calpurnius Siculus, Avianus',
        5: 'Martianus Capella, Priscian/Priscianus, Servius, Laberius, Afranius, Hyginus, Solinus, Hirtius, Donatus',
        6: 'Commodian/Commodianus, Dracontius, Corippus',
      },
    },
    {
      id: 'aeneis', lvl: 3, lang: 'la', cat: 'Aeneis', q: "Name a character from Vergil's Aeneid", note: 'Latin or English names',
      t: {
        1: 'Aeneas, Dido, Turnus, Iuno/Juno, Venus, Iuppiter/Jupiter, Ascanius/Iulus, Anchises, Lavinia, Latinus, Creusa, Achates, Pallas, Evander/Euander, Camilla, Mezentius, Nisus, Euryalus, Sibylla/Sibyl, Laocoon, Priamus/Priam, Hector, Mercurius/Mercury, Neptunus/Neptune, Cerberus, Charon, Palinurus, Achilles, Ulixes/Ulysses/Odysseus, Helena/Helen, Paris, Apollo, Minerva/Athena, Cupido/Cupid/Amor, Cyclops/Cyclopes, Hercules, Romulus, Augustus, Vulcanus/Vulcan, Cassandra, Andromache',
        2: 'Helenus, Iarbas, Amata, Allecto, Iuturna/Juturna, Lausus, Drances, Acestes, Entellus, Dares, Misenus, Deiphobus, Marcellus, Pyrrhus/Neoptolemus, Hecuba, Cacus, Messapus, Ilioneus, Mnestheus, Serestus, Iris, Fama/Rumour, Sychaeus, Pygmalion, Polyphemus, Sinon, Aeolus, Anna, Orpheus, Theseus, Minos',
        3: 'Sergestus, Iapyx, Tolumnius, Rhadamanthus, Tisiphone, Ixion, Musaeus, Silvius, Numa, Brutus, Arruns, Tarchon, Achaemenides, Cloanthus, Gyas, Menelaus, Agamemnon, Penthesilea, Diomedes, Aiax/Ajax, Proserpina, Dis/Pluto, Saturnus/Saturn, Diana, Mars, Celaeno, Scylla, Charybdis, Tiberinus',
        4: 'Camillus, Rhipeus, Dymas, Androgeos, Halaesus, Ufens, Umbro, Aventinus, Coras, Opis, Acca, Asilas, Aletes, Nautes, Calchas, Cybele, Faunus, Picus, Dardanus, Teucer, Coroebus, Panthus, Polites, Barce, Saces, Salmoneus, Tityos, Phlegyas',
        5: 'Beroe, Pandarus, Bitias, Butes, Eurytion, Lycus, Helymus, Patron, Salius, Glaucus, Caeculus, Catillus, Virbius',
        6: 'Hypanis, Metabus, Cymodocea, Diores, Thymoetes',
      },
    },
    {
      id: 'sidera', lvl: 3, lang: 'la', cat: 'Sidera', q: 'Name a constellation by its Latin name',
      t: {
        1: 'Ursa Maior/Ursa Major/Septentriones, Ursa Minor, Orion, Leo, Taurus, Gemini, Scorpius/Scorpio, Cancer, Virgo, Libra, Sagittarius, Capricornus/Capricorn, Aquarius, Pisces, Aries, Cygnus, Draco, Cassiopeia, Andromeda, Perseus, Pegasus, Hercules, Lyra, Aquila, Canis Maior/Canis Major',
        2: 'Corona Borealis, Canis Minor, Lepus, Columba, Delphinus, Sagitta, Bootes, Cepheus, Hydra, Corvus, Crater, Centaurus, Lupus, Auriga, Crux, Ophiuchus, Serpens, Eridanus, Corona Australis, Piscis Austrinus, Triangulum, Vulpecula',
        3: 'Monoceros, Camelopardalis, Pyxis, Carina, Puppis, Vela, Musca, Fornax, Sculptor, Telescopium, Ara, Coma Berenices, Canes Venatici, Lacerta, Lynx, Leo Minor, Scutum, Hydrus, Phoenix',
        4: 'Tucana, Pavo, Grus, Dorado, Mensa, Caelum, Pictor, Horologium, Norma, Circinus, Octans, Microscopium',
        5: 'Apus, Volans, Indus, Chamaeleon, Triangulum Australe, Sextans',
        6: 'Antlia, Reticulum, Equuleus',
      },
    },
    {
      id: 'virtutes', lvl: 3, lang: 'la', pl: true, cat: 'Mores', q: 'Name a Roman virtue or value, in Latin',
      t: {
        1: 'virtus, pietas, fides, gravitas, dignitas, clementia, constantia, prudentia, iustitia/justitia, fortitudo, temperantia, honestas, humanitas, auctoritas, disciplina, veritas, libertas, concordia, honos/honor',
        2: 'frugalitas, industria, severitas, aequitas, modestia, pudicitia, magnanimitas, liberalitas, benevolentia, fidelitas, patientia, sapientia, spes, caritas, gloria, amicitia, gratia, officium, mos maiorum',
        3: 'castitas, sanctitas, misericordia, decus, integritas, innocentia, continentia, sobrietas, firmitas, comitas, simplicitas, felicitas, securitas, laetitia, religio, labor',
        4: 'verecundia, diligentia, providentia, tranquillitas, magnificentia, indulgentia, hilaritas, pudor, probitas, aequanimitas, urbanitas, parsimonia',
        5: 'magnitudo animi, obsequium, munificentia, salubritas, abstinentia, benignitas',
        6: 'mansuetudo, longanimitas',
      },
    },
    {
      id: 'loca', lvl: 3, lang: 'la', cat: 'Orbis Romanus', q: 'Name a city of the Roman world by its Latin name',
      t: {
        1: 'Roma, Pompeii, Carthago, Athenae, Troia, Ostia, Neapolis, Herculaneum, Capua, Londinium, Alexandria, Byzantium, Constantinopolis, Syracusae, Corinthus, Sparta, Ravenna, Massilia, Florentia, Pisae, Verona, Mediolanum, Antiochia, Damascus, Ephesus, Hierosolyma, Brundisium',
        2: 'Eboracum, Aquae Sulis, Deva, Caesarea, Thessalonica, Pergamum, Smyrna, Tyrus, Sidon, Palmyra, Tibur, Veii, Alba Longa, Cumae, Puteoli, Baiae, Aquileia, Lutetia, Tarentum, Petra, Mantua, Delphi, Olympia, Memphis, Thebae, Rhodus, Tarsus, Nicaea, Messana, Patavium',
        3: 'Camulodunum, Lindum, Verulamium, Colonia Agrippina/Colonia, Bononia, Ariminum, Beneventum, Corduba, Saguntum, Alesia, Augusta Treverorum/Treveri, Lugdunum, Narbo, Burdigala, Hispalis, Gades, Tarraco, Emerita Augusta, Toletum, Leptis Magna, Vindobona, Aquincum, Cyrene, Utica, Ancona',
        4: 'Placentia, Arretium, Clusium, Perusia, Rhegium, Panormus, Carthago Nova, Numantia, Gergovia, Avaricum, Vindolanda, Antium, Arelate, Nemausus, Ancyra, Sardis, Sulmo, Arpinum, Venusia, Hippo Regius, Sirmium, Tusculum, Praeneste, Lavinium, Ardea, Misenum, Stabiae',
        5: 'Bostra, Castra Regina, Augusta Vindelicorum, Noviomagus, Corinium, Durovernum, Calleva, Lilybaeum, Mogontiacum, Isca, Glevum, Nicomedia',
        6: 'Durocortorum, Luguvalium, Segedunum, Thamugadi',
      },
    },
    {
      id: 'feriae', lvl: 3, lang: 'la', cat: 'Fasti', q: 'Name a Roman festival', note: 'Latin',
      t: {
        1: 'Saturnalia, Lupercalia, Floralia/Ludi Florales, Ludi Romani',
        2: 'Consualia, Terminalia, Vestalia, Parilia/Palilia, Liberalia, Matronalia, Cerealia/Ludi Cereales, Parentalia, Lemuria, Vinalia',
        3: 'Feralia, Megalesia/Megalensia/Ludi Megalenses, Ludi Plebeii, Ludi Apollinares, Ludi Saeculares, Quirinalia, Robigalia, Volcanalia/Vulcanalia, Neptunalia, Opalia, Compitalia, Ambarvalia, Quinquatrus/Quinquatria',
        4: 'Poplifugia, Larentalia, Carmentalia, Fontinalia, Armilustrium, Fornacalia, Fordicidia, Agonalia, Equirria, Regifugium, Anna Perenna',
        5: 'Septimontium, Furrinalia, Portunalia, Sementivae/Feriae Sementivae, Nonae Caprotinae, Paganalia, Volturnalia',
        6: 'Tubilustrium, Meditrinalia',
      },
    },
    {
      id: 'lux', lvl: 3, lang: 'en', cat: 'Derivata', q: 'Name an English word from lux / lumen (light)',
      t: {
        1: 'lucid, illuminate, luminous, translucent, elucidate, illumination',
        2: 'luminary, lux, lucent, luminosity, bioluminescent/bioluminescence, lucidity, luminescent, elucidation',
        3: 'Lucifer, illumine, pellucid, luculent, luminance, translucence, illuminati',
        4: 'lumen, relucent',
        5: 'noctilucent, limn',
        6: 'lucubration',
      },
    },
  ];
})(window.RA = window.RA || {});
