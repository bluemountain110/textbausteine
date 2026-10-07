// Datei: status-grundlage.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die Grundausstattung des Status-Werks: der vereinheitlichte
//        Gesamtstatus (alle Untersuchungen mit Normalbefund, Kategorie,
//        häufig/selten und Tardoc-Etikett) und die sieben
//        Start-Teilmengen. Diese Datei ist NUR die Erstbefüllung und
//        der „Zurücksetzen“-Stand — gearbeitet wird immer mit der
//        Fassung in den Einstellungen (statusMaster/statusTeilmengen),
//        die auf alle Geräte synct. Diktion durchgehend
//        „Untersuchung: Befund.“ (Näds Entscheid vom 26.9.).
//        Tardoc-Etiketten: a = "neuro" | "hirn", g = Gruppen-Nummer,
//        m = Liste der Merkmal-Namen (je Gruppe wird die MENGE der
//        Namen gezählt), muskeln = Anzahl Einzelmuskeln (Gruppen 4/5).

"use strict";
window.TB = window.TB || {};

TB.statusGrundlage = (function () {
  // Kurzschreiber, damit die Liste lesbar bleibt.
  function u(id, kat, name, normal, haeufig, tardoc, merkmale, hinweis) {
    var e = { id: id, kategorie: kat, name: name, normal: normal,
              haeufig: !!haeufig, tardoc: tardoc || [] };
    if (merkmale) e.merkmale = merkmale;   // Einzelmerkmale (27.9.)
    if (hinweis) e.hinweis = hinweis;      // Erklärzeile der Maske (E11)
    return e;
  }
  function n(g, m, muskeln) {
    var e = { a: "neuro", g: g };
    if (m) e.m = m; if (muskeln) e.muskeln = muskeln; return e;
  }
  function h(g, m) { var e = { a: "hirn", g: g }; if (m) e.m = m; return e; }

  // Einzelmerkmale der Kraftprüfungen (Nachbesserung 27.9., Näd):
  // an-/abwählbar; der Text nennt nur die Gewählten, die Untergruppen
  // (gruppe) sind reine Zwischentitel in der Auswahl.
  // 17.5 (Naed): Muskeleigenreflexe einzeln an-/abwaehlbar wie die
  // Einzelkraftpruefung; wert ersetzt das Kraft-Suffix.
  var MERKREFLEXE = [
      { id: "bsr", name: "BSR", wert: "+/+", gruppe: "Arme" },
      { id: "tsr", name: "TSR", wert: "+/+", gruppe: "Arme" },
      { id: "rpr", name: "RPR", wert: "+/+", gruppe: "Arme" },
      { id: "psr", name: "PSR", wert: "+/+", gruppe: "Beine" },
      { id: "asr", name: "ASR", wert: "+/+", gruppe: "Beine" },
      { id: "addukt", name: "Adduktorenreflex", wert: "+/+", gruppe: "Beine" }
  ];
  var MERKARME = [
      { id: "pect", name: "Mm. pectorales", gruppe: "Schultergürtel" },
      { id: "innenrot", name: "Arminnenrotation", gruppe: "Schultergürtel" },
      { id: "aussenrot", name: "Armaussenrotation", gruppe: "Schultergürtel" },
      { id: "addukt", name: "Armadduktion", gruppe: "Schultergürtel" },
      { id: "abd0", name: "Armabduktion aus Nullstellung", gruppe: "Schultergürtel" },
      { id: "abd90", name: "Armabduktion aus 90-Grad-Stellung", gruppe: "Schultergürtel" },
      { id: "streck", name: "Armstreckung", gruppe: "Ellbogen" },
      { id: "beug", name: "Armbeugung", gruppe: "Ellbogen" },
      { id: "hgstreck", name: "Handgelenksstreckung", gruppe: "Hand und Finger" },
      { id: "hgbeug", name: "Handgelenkbeugung", gruppe: "Hand und Finger" },
      { id: "fistreck", name: "Fingerstreckung", gruppe: "Hand und Finger" },
      { id: "fibeug23", name: "Fingerbeugung im Endglied (Dig. II/III)", gruppe: "Hand und Finger" },
      { id: "fibeug45", name: "Fingerbeugung im Endglied (Dig. IV/V)", gruppe: "Hand und Finger" },
      { id: "zeigeabsp", name: "Zeigefingerabspreizung", gruppe: "Hand und Finger" },
      { id: "kleinabsp", name: "Kleinfingerabspreizung", gruppe: "Hand und Finger" },
      { id: "daumadd", name: "Daumenadduktion", gruppe: "Hand und Finger" },
      { id: "daumabd", name: "Daumenabduktion", gruppe: "Hand und Finger" },
      { id: "daumopp", name: "Daumenopposition", gruppe: "Hand und Finger" },
      { id: "kleinopp", name: "Kleinfingeropposition", gruppe: "Hand und Finger" }
    ];
  var MERKBEINE = [
      { id: "hueftbeug", name: "Hüftbeugung", gruppe: "Hüfte" },
      { id: "hueftstreck", name: "Hüftstreckung", gruppe: "Hüfte" },
      { id: "osabd", name: "Oberschenkelabduktion", gruppe: "Hüfte" },
      { id: "osadd", name: "Oberschenkeladduktion", gruppe: "Hüfte" },
      { id: "kniestreck", name: "Kniestreckung", gruppe: "Knie" },
      { id: "kniebeug", name: "Kniebeugung", gruppe: "Knie" },
      { id: "fussheb", name: "Fusshebung", gruppe: "Fuss" },
      { id: "fusssenk", name: "Fusssenkung", gruppe: "Fuss" },
      { id: "gzheb", name: "Grosszehenhebung", gruppe: "Fuss" },
      { id: "zehheb", name: "Hebung Zehen II–V", gruppe: "Fuss" },
      { id: "zehflex", name: "Zehenflexion", gruppe: "Fuss" },
      { id: "eversion", name: "Eversion", gruppe: "Fuss" },
      { id: "inversion", name: "Inversion", gruppe: "Fuss" }
    ];

  var KATEGORIEN = [
    { id: "allgemein", name: "Allgemein" },
    { id: "gang", name: "Stand und Gang" },
    { id: "kopf", name: "Kopf und Hirnnerven" },
    { id: "vestibulaer", name: "Lagerungsproben und Vestibulär" },
    { id: "wirbelsaeule", name: "Wirbelsäule" },
    { id: "sensibilitaet", name: "Sensibilität" },
    { id: "motorik", name: "Motorik" },
    { id: "reflexe", name: "Reflexe" },
    { id: "koordination", name: "Koordination und Bewegungsstörungen" },
    { id: "neuropsych", name: "Neuropsychologisch" },
    { id: "autonom", name: "Autonomes Nervensystem" },
    { id: "koma", name: "Koma" },
    { id: "scores", name: "Scores" }
  ];

  // Stand 30.09.2026 (Sammelrunde 15.16): aus Näds Status-Export
  // übernommen (seine Texte, häufig/selten, Reihenfolge, Halsbeweglichkeit),
  // dazu seine Aufteilungen und die geprüften Tardoc-Etiketten.
  var UNTERSUCHUNGEN = [
    // ---- Allgemein ---------------------------------------------------
    u("az", "allgemein", "Allgemeinzustand", "gut.", true, [n(1, ["Allgemeinzustand"]), h(1, ["Allgemeinzustand"])]),
    u("vigilanz", "allgemein", "Vigilanz", "wach, keine Schwankungen während Konsultation und Untersuchung.", true, [n(1, ["Vigilanz"]), h(1, ["Vigilanz"])]),
    u("kooperation", "allgemein", "Verhalten und Kooperation", "adäquat, kooperativ, freundlich zugewandt.", true, [n(1, ["Kooperationsfähigkeit"]), h(1, ["Kooperationsfähigkeit"])]),
    u("antrieb", "allgemein", "Antrieb", "unauffällig.", true, []),
    u("haendigkeit", "allgemein", "Händigkeit", "rechts.", true, [n(1, ["Händigkeit"]), h(1, ["Händigkeit"])]),
    u("groessegewicht", "allgemein", "Grösse und Gewicht", "xx cm, xx kg (BMI xx).", false, [n(1, ["Grösse","Gewicht"]), h(1, ["Grösse","Gewicht"])]),
    u("blutdruckpuls", "allgemein", "Blutdruck und Puls", "xx/xx mmHg, Puls xx/min, regelmässig.", false, [n(1, ["Blutdruck","Puls"]), h(1, ["Blutdruck","Puls"])]),
    u("karotiden", "allgemein", "Karotiden-Auskultation", "kein Strömungsgeräusch bds.", false, [n(1, ["Gefässauskultation"]), h(1, ["Gefässauskultation"])]),
    // ---- Stand und Gang ----------------------------------------------
    u("gangbild", "gang", "Stand und Gang", "sicher, unauffälliges Gangbild.", true, [n(3, ["Gangprüfung"])]),
    u("armschwung", "gang", "Mitschwingen der Arme", "nicht vermindert.", true, [n(2, ["Bewegungsmuster"])]),
    u("strichgang", "gang", "Strichgang", "sicher.", true, [n(9, ["Strichgang"])]),
    u("zehenfersengang", "gang", "Zehen- und Fersengang", "seitengleich normal.", true, [n(3, ["Fersengang","Spitzengang"])]),
    u("tandemstand", "gang", "Tandemstand", "unauffällig.", true, [n(9, ["Romberg"])]),
    u("romberg", "gang", "Romberg", "sicher gestanden.", true, [n(9, ["Romberg"])]),
    u("tandemromberg", "gang", "Erschwerter Romberg (Tandem)", "sicher gestanden.", true, [n(9, ["Romberg"])]),
    u("wendeschritte", "gang", "Wendeschritte", "Anzahl nicht erhöht.", true, [n(3, ["Bewegungsmuster"])]),
    u("anlauf", "gang", "Anlaufschwierigkeiten", "keine.", true, [n(3, ["Bewegungsmuster"])]),
    u("einbein", "gang", "Einbeinstand und Einbeinhüpfen", "bds. sicher möglich.", false, [n(9, ["Einbeinstand/-hüpfen"])]),
    u("aufstehenhocke", "gang", "Aufstehen aus der Hocke", "ohne Armhilfe möglich (Gowers negativ).", false, [n(3, ["Aufstehen vom Boden"])]),
    u("einbeinhuepfen", "gang", "Einbeinhüpfen", "bds. möglich.", false, [n(3, ["Hüpfen"])]),
    u("trendelenburg", "gang", "Trendelenburg-Zeichen", "negativ.", false, [n(3, ["Trendelenburg"])]),
    u("kamptokormie", "gang", "Körperhaltung im Gehen", "aufrecht, keine Kamptokormie.", true, [n(6, ["Bewegungsmuster"])]),
    u("retropulsion", "gang", "Retropulsions-Test", "sicher gestanden mit wenigen Auffangschritten.", true, [n(9, ["Posturale Reflexe"])]),
    u("unterberger", "gang", "Unterberger-Tretversuch", "kein Abweichen.", false, [n(9, ["Unterberger"])]),
    u("zweiminuten", "gang", "Two-Minute-Walk-Test (2MWT)", "xx Meter.", false, []),
    u("t25fw", "gang", "Timed-25-Foot-Walk (T25FW, 7.6 m)", "xx Sekunden.", false, []),
    u("blindgang", "gang", "Blindgang", "sicher, kein Abweichen.", false, [n(9, ["Strichgang"])]),
    u("freezing", "gang", "Freezing-Provokation", "kein Freezing bei Engstelle, Wendung oder Dual-Task.", false, [n(3, ["Gangprüfung"])]),
    u("gehstrecke", "gang", "Gehstrecke und Gehhilfen", "unbegrenzt, ohne Gehhilfe.", false, []),
    // ---- Kopf und Hirnnerven -----------------------------------------
    u("meningismus", "kopf", "Meningismus", "keiner.", true, [h(3, ["Meningismus"])]),
    u("halsbeweglichkeit", "kopf", "Halsbeweglichkeit", "frei.", true, [h(3, ["Beweglichkeit"])]),
    u("temporalis", "kopf", "Aa. temporales", "nicht druckdolent.", false, [n(1, ["Gefässpulsatilität"]), h(1, ["Gefässpulsatilität"])]),
    u("trigeminusdruck", "kopf", "Trigeminus-Austrittspunkte", "nicht druckdolent.", true, [h(4, ["Druckschmerz Nervenaustritts-/Gefässpunkte"])]),
    u("riechen", "kopf", "Riechtestung (Sniffin’ Sticks)", "Normosmie.", false, [h(4, ["Geruchsprüfung"])]),
    u("visus", "kopf", "Visus (5 m, re/li)", "1.0/1.0.", false, [h(6, ["Visus"])]),
    u("rotentsaettigung", "kopf", "Rot-Entsättigung", "keine.", false, [h(6, ["Farbsehen"])]),
    u("pupillen", "kopf", "Pupillen", "isokor, prompte direkte und indirekte Reaktion auf Licht und Konvergenz.", true, [h(5, ["Pupillomotorik"])]),
    u("rapd", "kopf", "Swinging-Flashlight-Test", "kein relatives afferentes Pupillendefizit (RAPD).", true, [h(5, ["Swinging-Flashlight"])]),
    u("gesichtsfeld", "kopf", "Gesichtsfeld", "fingerperimetrisch intakt, keine Quadrantenanopsie.", true, [h(6, ["Fingerperimetrie"])]),
    u("ptose", "kopf", "Ptose", "keine bds.", true, [h(3, ["Paresegradierung motorischer Hirnnerven"])]),
    u("folgebewegungen", "kopf", "Augenfolgebewegungen", "flüssig.", true, [h(5, ["Folgebewegungen"])]),
    u("sakkaden", "kopf", "Sakkaden", "metrisch, nicht verlangsamt.", true, [h(6, ["Sakkaden"])]),
    u("blickparesen", "kopf", "Blickparesen", "keine horizontale, keine vertikale.", true, [h(5, ["Motilität"])]),
    u("konvergenz", "kopf", "Konvergenz", "intakt.", true, [h(5, ["Motilität"])]),
    u("diplopie", "kopf", "Doppelbilder", "keine in allen neun Blickrichtungen.", true, [h(5, ["Cover-Test"])]),
    u("nystagmen", "kopf", "Pathologische Nystagmen", "keine.", true, [h(7, ["Nystagmus"])]),
    u("okn", "kopf", "Optokinetischer Nystagmus", "intakt.", false, [h(6, ["Optokinetischer Nystagmus"])]),
    u("vorsuppression", "kopf", "VOR-Suppression", "intakt.", false, [h(6, ["VOR-Suppression"])]),
    u("fundoskopie", "kopf", "Fundoskopie", "Papillen bds. scharf begrenzt, keine Stauungspapille.", false, [h(6, ["Fundoskopie"])]),
    u("lhermitte", "kopf", "Lhermitte-Zeichen", "negativ.", false, []),
    u("gesichtssensibilitaet", "kopf", "Gesichtssensibilität", "normal, seitengleich in allen drei Trigeminusästen.", true, [h(4, ["Berührung"])]),
    u("cornealreflex", "kopf", "Cornealreflex", "bds. auslösbar.", false, [h(4, ["Cornealreflex"])]),
    u("masseter", "kopf", "M. masseter", "bds. kräftig.", true, [h(3, ["Rohkraft"])]),
    u("mimik", "kopf", "Mimische Muskulatur", "seitengleich innerviert; Stirnrunzeln und Augenschluss bds. kräftig.", true, [h(3, ["Paresegradierung motorischer Hirnnerven"])]),
    u("hypomimie", "kopf", "Hypomimie", "keine.", true, [h(3, ["Bewegungsmuster"])]),
    u("geschmack", "kopf", "Geschmack (vordere zwei Drittel)", "normal.", false, [h(4, ["Geschmacksprüfung"])]),
    u("hoeren", "kopf", "Hörprüfung (Fingerreiben)", "bds. gehört.", true, [h(7, ["Hörprüfung"])]),
    u("weber", "kopf", "Weber", "mittig.", false, [h(7, ["Weber"])]),
    u("rinne", "kopf", "Rinne", "bds. physiologisch.", false, [h(7, ["Rinne"])]),
    u("gaumensegel", "kopf", "Gaumensegel", "hebt sich seitengleich.", true, [h(3, ["Gaumensegel"])]),
    u("wuergreflex", "kopf", "Würgereflex", "auslösbar.", false, [h(3, ["Würgereflex"])]),
    u("stimme", "kopf", "Stimme und Sprechen", "Stimme klar, keine Heiserkeit, keine Dysarthrie, keine Hypophonie, keine skandierende Sprache.", true, [h(2, ["Phonation","Artikulation"])]),
    u("schlucken", "kopf", "Schlucken", "anamnestisch und im Wasserschlucktest unauffällig.", false, [h(3, ["Schlucken"])]),
    u("kopfdrehung", "kopf", "Kopfdrehung (M. sternocleidomastoideus)", "bds. M5.", true, [h(3, ["Paresegradierung motorischer Hirnnerven"])]),
    u("schulterheben", "kopf", "Schulterheben (M. trapezius)", "bds. M5.", true, [h(3, ["Paresegradierung motorischer Hirnnerven"])]),
    u("zunge", "kopf", "Zunge", "Motorik und Trophik unauffällig, keine Faszikulationen.", true, [h(3, ["Zunge"])]),
    u("masseterreflex", "kopf", "Masseterreflex", "mittellebhaft, nicht gesteigert.", false, [h(3, ["Masseterreflex"])]),
    u("bell", "kopf", "Bell-Phänomen", "physiologisch bds.", false, [h(3, ["Bell-Phänomen"])]),
    u("simpson", "kopf", "Simpson-Test", "keine Zunahme der Ptose nach 60 s Aufwärtsblick.", false, [h(3, ["Simpson-Test"])]),
    u("otoskopie", "kopf", "Otoskopie", "Gehörgang und Trommelfell bds. reizlos.", false, [h(7, ["Otoskopie"])]),
    u("stereosehen", "kopf", "Stereosehen", "intakt.", false, [h(6, ["Stereosehen"])]),
    // ---- Lagerungsproben und Vestibulär ------------------------------
    u("spontannystagmus", "vestibulaer", "Spontannystagmus", "keiner, mit und ohne Frenzelbrille.", true, [h(7, ["Nystagmus"]), h(8, ["Nystagmus"])]),
    u("kopfschuettelnystagmus", "vestibulaer", "Kopfschüttelnystagmus", "keiner.", false, [h(8, ["Kopfschütteltest"])]),
    u("valsalva", "vestibulaer", "Nystagmus unter Valsalva und Hyperventilation", "keiner.", false, [h(8, ["Provokationsnystagmus"])]),
    u("kopfimpulstest", "vestibulaer", "Halmagyi-Kopfimpulstest", "bds. unauffällig.", true, [h(7, ["Kopfimpulstest"])]),
    u("skew", "vestibulaer", "Alternierender Abdecktest", "keine Skew-Deviation.", true, [h(5, ["Cover-Test"])]),
    u("dixhallpike", "vestibulaer", "Dix-Hallpike (posteriorer Bogengang)", "bds. ohne objektivierbaren Nystagmus, ohne Schwindelangabe.", true, [h(8, ["Lagerungsproben"])]),
    u("rollmanoever", "vestibulaer", "Supine-Roll-Manöver (horizontaler Bogengang)", "bds. ohne objektivierbaren Nystagmus, ohne Schwindelangabe.", true, [h(8, ["Lagerungsproben"])]),
    u("fistelzeichen", "vestibulaer", "Fistelzeichen (Tragusdruck)", "kein Nystagmus, kein Schwindel bds.", false, []),
    u("svv", "vestibulaer", "Subjektive visuelle Vertikale (Eimertest)", "keine Verkippung.", false, []),
    // ---- Wirbelsäule -------------------------------------------------
    u("klopfdolenz", "wirbelsaeule", "Wirbelsäule", "keine Klopfdolenz, kein paravertebraler Hartspann.", true, []),
    u("lasegue", "wirbelsaeule", "Lasègue (re/li)", "-/-.", true, []),
    u("lasegueumgekehrt", "wirbelsaeule", "Umgekehrter Lasègue (re/li)", "-/-.", false, []),
    u("kernig", "wirbelsaeule", "Kernig-Zeichen", "negativ.", false, []),
    u("brudzinski", "wirbelsaeule", "Brudzinski-Zeichen", "negativ.", false, []),
    u("schoberfba", "wirbelsaeule", "Schober und Finger-Boden-Abstand", "Schober xx cm, FBA xx cm.", false, []),
    u("spurling", "wirbelsaeule", "Spurling-Test", "-/-.", false, []),
    u("mennell", "wirbelsaeule", "Mennell-Zeichen (ISG)", "-/-.", false, []),
    u("tineluntere", "wirbelsaeule", "Tinel untere Extremität (re/li)", "Fibulaköpfchen -/-, Tarsaltunnel -/-.", false, []),
    // ---- Sensibilität ------------------------------------------------
    u("beruehrung", "sensibilitaet", "Berührungsempfinden", "an Armen, Händen und Beinen symmetrisch normal.", true, [n(7, ["Berührung"]), n(8, ["Berührung"])]),
    u("struempfe", "sensibilitaet", "Strumpfförmige Sensibilitätsstörung", "keine.", true, [n(8, ["Berührung"])]),
    u("dermatom", "sensibilitaet", "Sensibles Defizit nach Dermatom oder peripherem Nerv", "keines.", true, [n(7, ["Berührung"]), n(8, ["Berührung"])]),
    u("pallaesthesie", "sensibilitaet", "Pallästhesie (re/li, max. 8/8)", "radial 8/8, patellär 8/8, malleolär 8/8, Grosszehengrundgelenk 8/8.", true, [n(7, ["Vibration"]), n(8, ["Vibration"])]),
    u("spitzstumpf", "sensibilitaet", "Spitz-stumpf-Diskrimination", "bds. intakt.", true, [n(7, ["Schmerz"]), n(8, ["Schmerz"])]),
    u("lagesinn", "sensibilitaet", "Lagesinn", "an Fingern und Zehen bds. intakt.", true, [n(7, ["Lagesinn"]), n(8, ["Lagesinn"])]),
    u("thermaesthesie", "sensibilitaet", "Thermästhesie", "bds. intakt.", true, [n(7, ["Temperatur"]), n(8, ["Temperatur"])]),
    u("graphaesthesie", "sensibilitaet", "Graphästhesie", "Zahlenerkennen auf der Handfläche bds. intakt.", false, []),
    u("stereognosie", "sensibilitaet", "Stereognosie", "Gegenstandserkennen bds. intakt.", false, []),
    u("zweipunkt", "sensibilitaet", "Zwei-Punkte-Diskrimination", "an den Fingerbeeren bds. altersentsprechend intakt.", false, []),
    u("rumpfsensibilitaet", "sensibilitaet", "Rumpfsensibilität", "Berührungsempfinden am Rumpf bds. intakt, kein sensibles Niveau.", false, [n(6, ["Berührung Rumpf"])]),
    u("reithose", "sensibilitaet", "Sakrale Sensibilität", "perianal und im Reithosenareal intakt.", false, [n(6, ["Berührung Rumpf"])]),
    u("tinel", "sensibilitaet", "Tinel-Zeichen (re/li)", "Karpaltunnel -/-, Sulcus n. ulnaris -/-.", true, []),
    u("phalen", "sensibilitaet", "Phalen-Test", "-/-.", true, []),
    u("froment", "sensibilitaet", "Froment-Zeichen", "-/-.", true, []),
    u("extinktion", "sensibilitaet", "Extinktion bei bilateraler Stimulation", "keine taktile, keine visuelle.", false, [n(7, ["Taktiler Neglekt"])]),
    u("allodynie", "sensibilitaet", "Allodynie und Hyperästhesie", "keine.", false, []),
    // ---- Motorik -----------------------------------------------------
    u("trophiktonus", "motorik", "Trophik und Tonus", "normal; keine Spastik (kein Taschenmesser-Phänomen), kein Rigor, keine Hypotonie.", true, [n(2, ["Trophik","Tonus"]), n(3, ["Trophik","Tonus"])]),
    u("atrophien", "motorik", "Atrophien", "keine, insbesondere nicht an Thenar oder Hypothenar.", true, [n(2, ["Trophik"]), n(3, ["Trophik"])]),
    u("scapula", "motorik", "Scapula alata", "-/-.", false, [n(2, ["Trophik"])]),
    u("faszikulationen", "motorik", "Faszikulationen", "keine.", true, [n(2, ["Trophik"]), n(3, ["Trophik"])]),
    u("armhalteversuch", "motorik", "Armhalteversuch", "kein Absinken, keine Pronation.", true, [n(2, ["Rohkraft"])]),
    u("beinhalteversuch", "motorik", "Beinhalteversuch", "kein Absinken.", true, [n(3, ["Rohkraft"])]),
    u("hoover", "motorik", "Hoover-Zeichen (re/li)", "negativ (kräftiger Fersendruck der Gegenseite bei Hüftbeugung).", false, [n(3, ["Rohkraft"])]),
    u("fingerspiel", "motorik", "Fingerspiel", "bds. normal.", true, [n(2, ["Bewegungsmuster"])]),
    u("kraftarme", "motorik", "Einzelkraftprüfung Arme (re/li)", "Mm. pectorales M5/M5, Arminnenrotation M5/M5, Armaussenrotation M5/M5, Armadduktion M5/M5, Armabduktion aus Nullstellung M5/M5, Armabduktion aus 90-Grad-Stellung M5/M5, Armstreckung M5/M5, Armbeugung M5/M5, Handgelenksstreckung M5/M5, Handgelenkbeugung M5/M5, Fingerstreckung M5/M5, Fingerbeugung im Endglied (Dig. II/III) M5/M5, Fingerbeugung im Endglied (Dig. IV/V) M5/M5, Zeigefingerabspreizung M5/M5, Kleinfingerabspreizung M5/M5, Daumenadduktion M5/M5, Daumenabduktion M5/M5, Daumenopposition M5/M5, Kleinfingeropposition M5/M5.", true, [n(4, null, 19)], MERKARME),
    u("kraftbeine", "motorik", "Einzelkraftprüfung Beine (re/li)", "Hüftbeugung M5/M5, Hüftstreckung M5/M5, Oberschenkelabduktion M5/M5, Oberschenkeladduktion M5/M5, Kniestreckung M5/M5, Kniebeugung M5/M5, Fusshebung M5/M5, Fusssenkung M5/M5, Grosszehenhebung M5/M5, Hebung Zehen II–V M5/M5, Zehenflexion M5/M5, Eversion M5/M5, Inversion M5/M5.", true, [n(5, null, 13)], MERKBEINE),
    u("nackenmuskulatur", "motorik", "Nackenbeuger und -strecker", "bds. M5.", false, [h(3, ["Paresegradierung motorischer Hirnnerven"])]),
    u("rumpfmuskulatur", "motorik", "Rumpfmuskulatur", "Aufrichten aus Rückenlage möglich, Bauchhautpresse seitengleich.", false, [n(6, ["Rohkraft Rumpf"])]),
    u("atemmuskulatur", "motorik", "Atemmuskulatur", "keine paradoxe Atmung, kräftiger Hustenstoss.", false, []),
    u("myotonie", "motorik", "Myotone Zeichen", "keine verlängerte Anspannung nach Faustschluss, keine Perkussionsmyotonie.", false, [n(2, ["Bewegungsmuster"])]),
    u("belastungstest", "motorik", "Repetitiver Belastungstest", "20× Faustschluss ohne Dekrement, Armvorhalte ohne Ermüdung.", false, [n(4, ["Muskelausdauerbelastung"])]),
    // ---- Reflexe -----------------------------------------------------
    u("mer", "reflexe", "Muskeleigenreflexe (re/li)", "BSR +/+, TSR +/+, RPR +/+, PSR +/+, ASR +/+, Adduktorenreflex +/+.", true, [n(2, ["Reflexprüfung"]), n(3, ["Reflexprüfung"])], MERKREFLEXE),
    u("troemner", "reflexe", "Trömner", "-/-.", true, [n(2, ["Reflexprüfung"])]),
    u("babinski", "reflexe", "Babinski-Zeichen", "-/-.", true, [n(3, ["Reflexprüfung"])]),
    u("pyramidenzeichen", "reflexe", "Weitere Pyramidenbahnzeichen", "Chaddock, Oppenheim und Gordon bds. negativ; Rossolimo -/-.", false, [n(12, ["Gordon","Oppenheim"])]),
    u("kloni", "reflexe", "Kloni", "kein Fussklonus, kein Patellarklonus.", true, [n(3, ["Reflexprüfung"])]),
    u("bauchhautreflexe", "reflexe", "Bauchhautreflexe", "in allen drei Etagen bds. auslösbar.", false, [n(6, ["Reflexprüfung Rumpf"])]),
    u("analreflex", "reflexe", "Analreflex und Sphinktertonus", "auslösbar bzw. normal.", false, [n(6, ["Reflexprüfung Rumpf"])]),
    u("palmomental", "reflexe", "Palmomental-Reflex", "negativ.", false, [n(12, ["Palmomental"])]),
    u("schnauzreflex", "reflexe", "Schnauz-Reflex", "negativ.", false, [h(9, ["Schnauzreflex"])]),
    u("glabella", "reflexe", "Glabella-Reflex", "habituiert.", false, [h(9, ["Glabellareflex"])]),
    u("greifsaugreflex", "reflexe", "Greif- und Saugreflex", "keiner.", false, [n(12, ["Greifreflex"]), h(9, ["Saugreflex"])]),
    u("cremaster", "reflexe", "Cremasterreflex", "bds. auslösbar.", false, []),
    // ---- Koordination und Bewegungsstörungen -------------------------
    u("fnv", "koordination", "Finger-Nase-Versuch", "bds. zielsicher und metrisch, kein Intentionstremor.", true, [n(9, ["FNV","Metrie"])]),
    u("ffv", "koordination", "Finger-Finger-Versuch", "bds. zielsicher und metrisch, kein Intentionstremor.", false, [n(9, ["FNV"])]),
    u("fnfv", "koordination", "Finger-Nase-Finger-Versuch", "bds. zielsicher und metrisch, kein Intentionstremor.", false, [n(9, ["FNV"])]),
    u("khv", "koordination", "Knie-Hacke-Versuch", "bds. zielsicher und metrisch.", true, [n(9, ["KHV"])]),
    u("diadochokinese", "koordination", "Diadochokinese", "beidhändig flüssig, nicht verlangsamt.", true, [n(9, ["Diadochokinese"])]),
    u("rebound", "koordination", "Rebound-Phänomen", "keines.", false, [n(9, ["Rebound"])]),
    u("rumpfataxie", "koordination", "Rumpf- und Sitzataxie", "keine.", false, [n(9, ["Rumpfataxie"])]),
    u("rigor", "koordination", "Rigor", "keiner, auch nicht unter Bahnung (kein Zahnradphänomen).", true, [n(2, ["Tonus"]), n(3, ["Tonus"])]),
    u("tremor", "koordination", "Tremor", "kein Ruhe-, Halte- oder Aktionstremor.", true, [n(10, ["Unwillkürliche Bewegungen"])]),
    u("entrainment", "koordination", "Tremor-Entrainment und Ablenkbarkeit", "keine Ablenkbarkeit, kein Entrainment, keine Pausen.", false, [n(10, ["Unwillkürliche Bewegungen"])]),
    u("fingertapping", "koordination", "Finger-Tapping", "kein Dekrement, keine Verlangsamung.", true, [n(9, ["Finger-Tapping"])]),
    u("fusstapping", "koordination", "Fuss-Tapping", "kein Dekrement.", true, [n(9, ["Fuss-Tapping"])]),
    u("hyperkinesien", "koordination", "Unwillkürliche Bewegungen", "keine Chorea, Dystonie, Athetose, kein Ballismus, keine Myoklonien, keine Tics.", true, [n(10, ["Unwillkürliche Bewegungen"])]),
    u("schriftprobe", "koordination", "Schriftprobe und Spirale", "unauffällig, keine Mikrographie.", false, [n(10, ["Schriftprobe"])]),
    u("barany", "koordination", "Bárány-Zeigeversuch", "kein Abweichen bds.", false, [n(9, ["Bárány-Zeigeversuch"])]),
    // ---- Neuropsychologisch ------------------------------------------
    u("orientierung", "neuropsych", "Orientierung", "örtlich, zeitlich, situativ und zur Person voll orientiert.", true, []),
    u("sprache", "neuropsych", "Sprache", "flüssig; Sprachverständnis im Gespräch normal.", true, [h(2, ["Sprachproduktion","Sprachverständnis"])]),
    u("nachsprechen", "neuropsych", "Nachsprechen und Benennen", "intakt.", true, [h(2, ["Nachsprechen"])]),
    u("aufforderungen", "neuropsych", "Mehrschrittige Aufforderungen", "werden befolgt.", false, [h(2, ["Sprachverständnis"])]),
    u("lesenschreiben", "neuropsych", "Lesen und Schreiben", "orientierend unauffällig.", false, [h(2, ["Lesen/Schreiben"])]),
    u("neglect", "neuropsych", "Neglect", "kein visueller, kein taktiler.", true, [n(7, ["Taktiler Neglekt"])]),
    u("apraxie", "neuropsych", "Apraxie", "keine ideomotorische, ideatorische oder bukkofaziale Apraxie; Pantomime und Objektgebrauch intakt.", false, []),
    u("gerstmann", "neuropsych", "Gerstmann-Zeichen", "keine Akalkulie, keine Rechts-links-Störung, keine Fingeragnosie, keine Agraphie.", false, []),
    u("agnosie", "neuropsych", "Visuelle Agnosie und Anosognosie", "keine.", false, []),
    u("kurzgedaechtnis", "neuropsych", "Kurzgedächtnis orientierend", "3/3 Begriffe nach Ablenkung.", false, []),
    u("applaus", "neuropsych", "Applaus-Zeichen", "negativ.", true, [n(10, ["Alternierende Sequenzen"])]),
    u("stopandgo", "neuropsych", "Stop-and-go-Test (1× und 2× Klatschen)", "unauffällig.", true, [n(10, ["Alternierende Sequenzen"])]),
    u("luria", "neuropsych", "Luria-Handsequenz", "unauffällig, keine Perseverationen.", true, [n(10, ["Luria-Sequenz"])]),
    u("frontalzeichen", "neuropsych", "Weitere Frontalzeichen", "Go-No-Go intakt, keine Echopraxie, kein Utilisationsverhalten, keine motorische Impersistenz.", false, [n(10, ["Alternierende Sequenzen"])]),
    u("kognition", "neuropsych", "Formale Kognitionstestung (MoCA/MMST)", "siehe separater Befund.", false, []),
    u("aufmerksamkeit", "neuropsych", "Aufmerksamkeit orientierend", "Monate rückwärts flüssig, Serial-7 korrekt.", true, []),
    u("wortfluessigkeit", "neuropsych", "Wortflüssigkeit orientierend", "Tiere und S-Wörter altersentsprechend flüssig.", false, []),
    u("abstraktion", "neuropsych", "Abstraktionsvermögen", "Sprichwörter und Gemeinsamkeiten adäquat erklärt.", false, []),
    u("uhrentest", "neuropsych", "Uhrentest orientierend", "unauffällig (Ziffernblatt, Zeiger, Uhrzeit korrekt).", false, []),
    u("altgedaechtnis", "neuropsych", "Altgedächtnis orientierend", "biografische Daten korrekt und konsistent.", false, []),
    u("affekt", "neuropsych", "Affekt und Stimmung", "euthym, affektiv gut schwingungsfähig, kein Hinweis auf Depression.", true, []),
    u("prosopagnosie", "neuropsych", "Prosopagnosie", "keine, Gesichtererkennen intakt.", false, []),
    // ---- Autonomes Nervensystem --------------------------------------
    u("schellong", "autonom", "Orthostase (Schellong)", "kein relevanter orthostatischer Blutdruckabfall, keine orthostatische Symptomatik.", false, [n(15, ["Orthostase-Belastungstest"])]),
    u("schweiss", "autonom", "Schweisssekretion und Hauttrophik", "seitengleich, keine trophischen Störungen.", false, []),
    u("horner", "autonom", "Horner-Trias", "keine Ptose, keine Miosis, keine Anhidrose.", false, [h(5, ["Pupillomotorik"])]),
    u("blasemastdarm", "autonom", "Blasen-, Mastdarm- und Sexualfunktion", "anamnestisch unauffällig.", false, []),
    u("sialorrhoe", "autonom", "Sialorrhoe", "keine.", false, [h(4, ["Speichelfluss"])]),
    u("stehtest", "autonom", "Aktiver Stehtest 10 Min (POTS)", "kein anhaltender Pulsanstieg ≥ 30/min, keine orthostatische Symptomatik.", false, [n(15, ["Aktiver Stehtest"])]),
    // ---- Koma --------------------------------------------------------
    u("bewusstseinslage", "koma", "Quantitative Bewusstseinslage", "wach; GCS 15 (Augenöffnen 4, verbale Antwort 5, motorische Antwort 6).", false, [n(1, ["Vigilanz"]), h(1, ["Vigilanz"])]),
    u("fourscore", "koma", "FOUR-Score", "16 (E4, M4, B4, R4).", false, []),
    u("pupillenquantitativ", "koma", "Pupillen quantitativ", "rechts xx mm, links xx mm, rund; Lichtreaktion direkt und indirekt prompt.", false, [h(5, ["Pupillomotorik"])]),
    u("hirnstammreflexe", "koma", "Hirnstammreflexe", "Cornealreflex bds. auslösbar; okulozephaler Reflex intakt; vestibulo-okulärer Reflex (kalorische Prüfung) bds. auslösbar; Würge- und Hustenreflex auslösbar; Ciliospinalreflex auslösbar; Masseterreflex nicht gesteigert.", false, [h(4, ["Cornealreflex"])]),
    u("augenstellung", "koma", "Spontane Augenstellung und -bewegungen", "Bulbi konjugiert in Mittelstellung, keine Blickdeviation, kein Roving, kein Ocular Bobbing oder Dipping; Lidschluss auf Drohreiz bds. vorhanden.", false, [h(5, ["Motilität"])]),
    u("schmerzreaktion", "koma", "Reaktion auf Schmerzreiz", "gezielte Abwehr an allen vier Extremitäten (supraorbital und an den Extremitäten geprüft); keine Beugesynergien, keine Strecksynergien, keine Seitendifferenz.", false, [n(2, ["Rohkraft"]), n(3, ["Rohkraft"])]),
    u("atemmuster", "koma", "Atemmuster", "regelmässig; kein Cheyne-Stokes-, kein Biot-, kein ataktisches Atmen.", false, []),
    u("spontanmotorik", "koma", "Spontanmotorik", "seitengleich, keine Herdzeichen; Muskeltonus im Seitenvergleich normal.", false, [n(2, ["Tonus"]), n(3, ["Tonus"])]),
    // ---- Scores ------------------------------------------------------
    u("nihss", "scores", "NIHSS", "0/42 Punkte.", true, []),
    u("besinger", "scores", "Besinger-Score", "0 Punkte; im Einzelnen: Armvorhalteversuch 90° kein Absinken > 240 s (0), Beinvorhalteversuch 45° kein Absinken > 100 s (0), Kopfheben 45° aus Rückenlage kein Absinken > 120 s (0), Vitalkapazität > 3.5 l bzw. > 2.5 l (0), Gesichtsmuskulatur normal (0), Kauen normal (0), Schlucken normal (0), keine Doppelbilder bei Seitwärtsblick > 60 s (0), keine Ptose bei Aufwärtsblick > 60 s (0).", false, []),
    u("mrs", "scores", "Modified Rankin Scale (mRS)", "0.", false, [], null,
      "0 keine Symptome · 1 Symptome ohne relevante Beeinträchtigung · 2 leicht, eigene Angelegenheiten ohne Hilfe · 3 mässig, gehfähig mit etwas Hilfe · 4 mässig schwer, Gehen und Pflege mit Hilfe · 5 bettlägerig, dauernde Pflege · 6 Tod"),
    u("edss", "scores", "EDSS", "x.x.", false, [], null,
      "FS = funktionelle Systeme nach Kurtzke (Pyramidenbahn, Kleinhirn, Hirnstamm, Sensibilität, Blase/Mastdarm, Sehfunktion, zerebrale Funktionen) · 0 normale neurologische Untersuchung · 1.0 keine Behinderung, minimale Zeichen in 1 FS · 1.5 keine Behinderung, minimale Zeichen in mehr als 1 FS · 2.0 minimale Behinderung in 1 FS · 2.5 minimale Behinderung in 2 FS · 3.0 mässige Behinderung in 1 FS oder leichte in 3–4 FS, voll gehfähig · 3.5 voll gehfähig, mässige Behinderung in 1 FS und leichte in 1–2 FS · 4.0 mind. 500 m ohne Hilfe und Pause, ca. 12 h/Tag aktiv trotz relativ schwerer Behinderung — sobald die Gehstrecke eingeschränkt ist, gilt mindestens 4.0 · 4.5 mind. 300 m ohne Hilfe, ganztägige Tätigkeit mit Einschränkungen möglich · 5.0 mind. 200 m ohne Hilfe, Behinderung beeinträchtigt das volle Tagespensum · 5.5 mind. 100 m ohne Hilfe · 6.0 einseitige oder intermittierende Gehhilfe für ca. 100 m · 6.5 ständige beidseitige Gehhilfe für ca. 20 m · 7.0 keine 5 m auch mit Hilfe, rollstuhlgebunden, fährt und transferiert selbständig · 7.5 nur wenige Schritte, braucht Hilfe beim Transfer, ev. E-Rollstuhl · 8.0 weitgehend bett- oder stuhlgebunden, Arme wirksam einsetzbar, Selbstversorgung grossteils möglich · 8.5 weitgehend bettgebunden, Arme teilweise einsetzbar · 9.0 hilfloser Bettpatient, kann kommunizieren und essen · 9.5 kann weder kommunizieren noch essen und schlucken · 10 Tod infolge MS"),
    u("updrs", "scores", "MDS-UPDRS III", "xx Punkte.", false, []),
    u("mrcsumme", "scores", "MRC-Summenscore", "60/60.", false, []),
    u("hoehnyahr", "scores", "Hoehn & Yahr", "Stadium x.", false, [], null,
      "0 keine Zeichen · 1 einseitig · 1.5 einseitig + axial · 2 beidseits ohne Gleichgewichtsstörung · 2.5 Retropulsionstest kompensiert · 3 posturale Instabilität, selbständig · 4 schwer, Gehen/Stehen ohne Hilfe möglich · 5 rollstuhl- oder bettpflichtig"),
    u("ashworth", "scores", "Ashworth-Skala (modifiziert)", "0 an allen geprüften Muskelgruppen.", false, []),
    u("alsfrs", "scores", "ALSFRS-R", "xx/48 Punkte.", false, []),
    // ---- Kopf und Hirnnerven -----------------------------------------
    u("chvostek", "kopf", "Chvostek-Zeichen", "negativ.", false, [])
  ];

  // Start-Status (3.10.): Näds sieben gewachsene Status (CTS mit
  // seinen Standardtexten aus dem Export vom 3.10.) plus 23 von
  // Claude vorgeschlagene — je mit einem info-Spickzettel (typische
  // Befunde), den die Maske beim Laden zeigt. Näd passt sie in der
  // App an und speichert unter gleichem Namen; die Nachzieh-Migration
  // (status.js) bringt NEUE Namen in bestehende Welten, ohne
  // Bestehendes anzufassen, und räumt die drei Probe-Status weg.
  // Die 29 Start-Status (Etappe 11): wörtlich aus Näds Export vom
  // 3.10.2026, 14:39 (Status-Export-Mac-efd5-...-14-39-54.json) — seine
  // Texte, Zusätze, Muskel-Sterne und Spickzettel. Dazu je Status das
  // kuerzel (;;status...), mit dem das Status-Fenster am Arbeitsplatz
  // öffnet, und im Stroke-Status neu der mRS (Näd, 3.10.).
  var TEILMENGEN =
  [
    {
      "id": "cts",
      "name": "CTS",
      "kuerzel": "statcts",
      "punkte": [
        "az",
        "haendigkeit",
        "beruehrung",
        "tinel",
        "phalen",
        "atrophien",
        "kraftarme",
        "mer",
        "troemner"
      ],
      "merkmalAb": {
        "mer": ["psr", "asr", "addukt"],
        "kraftarme": [
          "pect",
          "innenrot",
          "aussenrot",
          "addukt",
          "abd0",
          "abd90"
        ]
      },
      "zusatz": [
        "pallaesthesie",
        "spitzstumpf",
        "froment",
        "faszikulationen"
      ],
      "normalAb": {
        "beruehrung": "an Armen und Händen symmetrisch normal.",
        "pallaesthesie": "radial 8/8"
      },
      "info": "Typisch: Thenaratrophie und APB-Schwäche (Daumenabduktion/-opposition), Tinel über dem Karpaltunnel, Phalen positiv; Sensibilitätsstörung Dig. I–III mit Spaltung des Ringfingers. DD C6/C7-Radikulopathie und Ulnarisneuropathie."
    },
    {
      "id": "pnp",
      "name": "Polyneuropathie",
      "kuerzel": "statpnp",
      "punkte": [
        "gangbild",
        "strichgang",
        "zehenfersengang",
        "romberg",
        "tandemromberg",
        "retropulsion",
        "ptose",
        "gesichtssensibilitaet",
        "mimik",
        "zunge",
        "beruehrung",
        "struempfe",
        "pallaesthesie",
        "spitzstumpf",
        "lagesinn",
        "thermaesthesie",
        "trophiktonus",
        "atrophien",
        "faszikulationen",
        "kraftbeine",
        "mer",
        "babinski"
      ],
      "info": "Typisch: strumpfförmige Sensibilitätsstörung, distale Pallhypästhesie (Malleolus!), früh abgeschwächte ASR, Romberg-Unsicherheit, später Fussheberschwäche und Atrophien.",
      "zusatz": [
        "schellong"
      ],
      "merkmalAb": {
        "kraftbeine": [
          "osabd",
          "osadd",
          "zehheb",
          "zehflex",
          "eversion",
          "inversion"
        ]
      }
    },
    {
      "id": "stroke",
      "name": "Stroke",
      "kuerzel": "statstroke",
      "punkte": [
        "az",
        "vigilanz",
        "antrieb",
        "haendigkeit",
        "gangbild",
        "zehenfersengang",
        "tandemromberg",
        "pupillen",
        "gesichtsfeld",
        "ptose",
        "folgebewegungen",
        "blickparesen",
        "diplopie",
        "nystagmen",
        "gesichtssensibilitaet",
        "mimik",
        "gaumensegel",
        "stimme",
        "schulterheben",
        "zunge",
        "beruehrung",
        "faszikulationen",
        "armhalteversuch",
        "beinhalteversuch",
        "babinski",
        "fnv",
        "khv",
        "orientierung",
        "sprache",
        "neglect",
        "nihss",
        "mrs"
      ],
      "info": "Entlang NIHSS: Vigilanz, Sprache/Dysarthrie, Gesichtsfeld, Blickwendung, faziale Parese, Halteversuche, Ataxie, Sensibilität, Neglect. Seitenbetonung konsequent dokumentieren.",
      "zusatz": [
        "retropulsion",
        "masseter",
        "hoeren",
        "kopfdrehung",
        "spontannystagmus",
        "skew",
        "extinktion",
        "fingerspiel",
        "kraftarme",
        "kraftbeine",
        "mer",
        "ffv",
        "nachsprechen",
        "aufforderungen"
      ],
      "merkmalAb": {
        "mer": ["tsr", "addukt"],},
      "normalAb": {
      }
    },
    {
      "id": "myasthenie",
      "name": "Myasthenie",
      "kuerzel": "statmyasthenie",
      "punkte": [
        "antrieb",
        "haendigkeit",
        "zehenfersengang",
        "tandemromberg",
        "ptose",
        "folgebewegungen",
        "blickparesen",
        "diplopie",
        "nystagmen",
        "gesichtssensibilitaet",
        "mimik",
        "gaumensegel",
        "stimme",
        "schlucken",
        "kopfdrehung",
        "schulterheben",
        "zunge",
        "faszikulationen",
        "armhalteversuch",
        "beinhalteversuch",
        "kraftarme",
        "kraftbeine",
        "nackenmuskulatur",
        "besinger"
      ],
      "info": "Leitbefund Ermüdbarkeit: fluktuierende Ptose und Doppelbilder (Simpson), proximale Ermüdung an Halteversuchen und Nackenmuskulatur, nasale Stimme beim Sprechen. Besinger-Score für den Verlauf.",
      "zusatz": [
        "simpson",
        "atemmuskulatur"
      ],
      "merkmalAb": {
        "kraftarme": [
          "pect",
          "innenrot",
          "aussenrot",
          "addukt",
          "zeigeabsp",
          "kleinabsp",
          "daumadd",
          "daumabd",
          "daumopp",
          "kleinopp",
          "hgbeug"
        ],
        "kraftbeine": [
          "osabd",
          "osadd",
          "zehheb",
          "zehflex",
          "eversion",
          "inversion"
        ]
      }
    },
    {
      "id": "parkinson",
      "name": "Parkinson",
      "kuerzel": "statparkinson",
      "punkte": [
        "gangbild",
        "armschwung",
        "wendeschritte",
        "anlauf",
        "kamptokormie",
        "retropulsion",
        "hypomimie",
        "stimme",
        "trophiktonus",
        "mer",
        "diadochokinese",
        "rigor",
        "tremor",
        "fingertapping",
        "fusstapping",
        "schriftprobe"
      ],
      "merkmalAb": {},
      "zusatz": [
        "haendigkeit",
        "riechen",
        "hoehnyahr"
      ],
      "info": "Typisch: Bradykinesie mit Dekrement (Tapping!), Rigor (mit Froment-Aktivierung), Ruhetremor, reduzierter Armschwung, Hypomimie, kleinschrittiges Gangbild, Retropulsion, Mikrographie."
    },
    {
      "id": "schwindel",
      "name": "Schwindel",
      "kuerzel": "statschwindel",
      "punkte": [
        "gangbild",
        "strichgang",
        "romberg",
        "tandemromberg",
        "unterberger",
        "spontannystagmus",
        "kopfschuettelnystagmus",
        "kopfimpulstest",
        "skew",
        "dixhallpike",
        "rollmanoever",
        "nystagmen",
        "folgebewegungen",
        "sakkaden",
        "vorsuppression",
        "okn",
        "hoeren",
        "weber",
        "rinne",
        "fnv",
        "ffv",
        "diadochokinese"
      ],
      "info": "Akut: HINTS — Kopfimpulstest, Nystagmus-Charakteristik, Skew; zentrale Zeichen (Blickrichtungsnystagmus, Sakkaden, VOR-Suppression). Lagerung (Dix-Hallpike, Roll) für BPLS; Unterberger und Strichgang.",
      "zusatz": [
        "fistelzeichen",
        "valsalva",
        "svv"
      ]
    },
    {
      "id": "memory",
      "name": "Demenz/Memory",
      "kuerzel": "statmemory",
      "punkte": [
        "az",
        "vigilanz",
        "kooperation",
        "antrieb",
        "haendigkeit",
        "orientierung",
        "sprache",
        "nachsprechen",
        "aufforderungen",
        "neglect",
        "applaus",
        "stopandgo",
        "luria",
        "palmomental",
        "schnauzreflex",
        "hypomimie",
        "gangbild",
        "armschwung",
        "tremor",
        "rigor",
        "fingertapping",
        "fusstapping",
        "mer",
        "babinski",
        "kognition"
      ],
      "info": "Formale Kognition (MoCA/MMST) plus Frontalzeichen (Applaus, Stop-and-go, Luria, Palmomental), Parkinson-Screening (Tapping, Rigor, Armschwung) und Gangbild — auch an NPH denken.",
      "zusatz": [
        "kurzgedaechtnis",
        "uhrentest",
        "wortfluessigkeit"
      ]
    },
    {
      "id": "ms",
      "name": "MS",
      "kuerzel": "statms",
      "punkte": [
        "visus",
        "rotentsaettigung",
        "rapd",
        "pupillen",
        "folgebewegungen",
        "blickparesen",
        "nystagmen",
        "lhermitte",
        "gesichtssensibilitaet",
        "mimik",
        "trophiktonus",
        "kraftarme",
        "kraftbeine",
        "beruehrung",
        "pallaesthesie",
        "lagesinn",
        "bauchhautreflexe",
        "mer",
        "babinski",
        "fnv",
        "ffv",
        "khv",
        "diadochokinese",
        "gangbild",
        "strichgang",
        "romberg",
        "edss"
      ],
      "zusatz": [
        "diplopie",
        "sakkaden",
        "fundoskopie",
        "t25fw",
        "kognition",
        "blasemastdarm"
      ],
      "merkmalAb": {
        "kraftarme": [
          "pect",
          "innenrot",
          "aussenrot",
          "addukt",
          "abd0",
          "hgbeug",
          "fibeug45",
          "zeigeabsp",
          "daumadd",
          "daumopp",
          "kleinopp"
        ],
        "kraftbeine": [
          "hueftstreck",
          "osabd",
          "osadd",
          "zehheb",
          "zehflex",
          "eversion",
          "inversion"
        ]
      },
      "info": "Typisch: Optikusneuritis (Visus, Rot-Entsättigung, RAPD), INO/Blickparesen, Lhermitte, abgeschwächte Bauchhautreflexe, Pyramidenzeichen, Hinterstrangstörung (Pallästhesie, Lagesinn), spastisch-ataktisches Gangbild. EDSS festhalten; T25FW für den Verlauf."
    },
    {
      "id": "kopfschmerz",
      "name": "Kopfschmerz",
      "kuerzel": "statkopf",
      "punkte": [
        "az",
        "blutdruckpuls",
        "meningismus",
        "temporalis",
        "trigeminusdruck",
        "halsbeweglichkeit",
        "visus",
        "gesichtsfeld",
        "pupillen",
        "fundoskopie",
        "folgebewegungen",
        "gesichtssensibilitaet",
        "mimik",
        "armhalteversuch",
        "beinhalteversuch",
        "mer",
        "babinski",
        "gangbild"
      ],
      "zusatz": [
        "karotiden",
        "horner",
        "klopfdolenz",
        "diplopie",
        "hoeren"
      ],
      "info": "Red Flags gezielt suchen: Stauungspapille, Meningismus, neue fokale Zeichen, Horner (Dissektion), druckdolente/verdickte A. temporalis (RZA ab 50). Trigeminus-Austrittspunkte und HWS-Beweglichkeit bei zervikogenem/Spannungstyp."
    },
    {
      "id": "radc5",
      "name": "Radikulopathie C5",
      "kuerzel": "statc5",
      "punkte": [
        "klopfdolenz",
        "halsbeweglichkeit",
        "spurling",
        "dermatom",
        "beruehrung",
        "atrophien",
        "kraftarme",
        "armhalteversuch",
        "mer",
        "troemner",
        "babinski"
      ],
      "zusatz": [
        "lhermitte",
        "tinel",
        "pallaesthesie"
      ],
      "merkmalAb": {
        "kraftarme": [
          "pect",
          "innenrot",
          "addukt",
          "streck",
          "hgstreck",
          "hgbeug",
          "fistreck",
          "fibeug23",
          "fibeug45",
          "zeigeabsp",
          "kleinabsp",
          "daumadd",
          "daumabd",
          "daumopp",
          "kleinopp"
        ]
      },
      "info": "Kennmuskeln: Armabduktion (Deltoideus/Supraspinatus), Aussenrotation (Infraspinatus), Armbeugung (Bizeps C5/6). BSR abgeschwächt. Dermatom: Schulter und lateraler Oberarm. Spurling oft positiv."
    },
    {
      "id": "radc6",
      "name": "Radikulopathie C6",
      "kuerzel": "statc6",
      "punkte": [
        "klopfdolenz",
        "halsbeweglichkeit",
        "spurling",
        "dermatom",
        "beruehrung",
        "atrophien",
        "kraftarme",
        "armhalteversuch",
        "mer",
        "troemner",
        "babinski"
      ],
      "zusatz": [
        "lhermitte",
        "tinel",
        "pallaesthesie"
      ],
      "merkmalAb": {
        "kraftarme": [
          "pect",
          "innenrot",
          "aussenrot",
          "addukt",
          "abd0",
          "abd90",
          "streck",
          "hgbeug",
          "fistreck",
          "fibeug23",
          "fibeug45",
          "zeigeabsp",
          "kleinabsp",
          "daumadd",
          "daumabd",
          "daumopp",
          "kleinopp"
        ]
      },
      "info": "Kennmuskeln: Armbeugung (Bizeps/Brachioradialis) und Handgelenksstreckung. BSR und RPR abgeschwächt. Dermatom: Daumen und Zeigefinger, radialer Unterarm."
    },
    {
      "id": "radc7",
      "name": "Radikulopathie C7",
      "kuerzel": "statc7",
      "punkte": [
        "klopfdolenz",
        "halsbeweglichkeit",
        "spurling",
        "dermatom",
        "beruehrung",
        "atrophien",
        "kraftarme",
        "armhalteversuch",
        "mer",
        "troemner",
        "babinski"
      ],
      "zusatz": [
        "lhermitte",
        "tinel",
        "pallaesthesie"
      ],
      "merkmalAb": {
        "kraftarme": [
          "innenrot",
          "aussenrot",
          "addukt",
          "abd0",
          "abd90",
          "beug",
          "hgstreck",
          "fibeug23",
          "fibeug45",
          "zeigeabsp",
          "kleinabsp",
          "daumadd",
          "daumabd",
          "daumopp",
          "kleinopp"
        ]
      },
      "info": "Kennmuskeln: Armstreckung (Trizeps), Handgelenkbeugung, Fingerstreckung, Pectoralis. TSR abgeschwächt. Dermatom: Mittelfinger (Dig. III)."
    },
    {
      "id": "radc8",
      "name": "Radikulopathie C8",
      "kuerzel": "statc8",
      "punkte": [
        "klopfdolenz",
        "halsbeweglichkeit",
        "spurling",
        "dermatom",
        "beruehrung",
        "atrophien",
        "kraftarme",
        "armhalteversuch",
        "mer",
        "troemner",
        "babinski"
      ],
      "zusatz": [
        "lhermitte",
        "tinel",
        "pallaesthesie"
      ],
      "merkmalAb": {
        "kraftarme": [
          "pect",
          "innenrot",
          "aussenrot",
          "addukt",
          "abd0",
          "abd90",
          "streck",
          "beug",
          "hgstreck",
          "hgbeug",
          "fistreck",
          "zeigeabsp",
          "kleinabsp",
          "daumadd",
          "kleinopp"
        ]
      },
      "info": "Kennmuskeln: lange Fingerbeuger (Endglieder) und Daumenballen (Abduktion/Opposition, C8/Th1). Trömner-Seitendifferenz möglich. Dermatom: Dig. IV/V und ulnarer Unterarm. DD Ulnarisneuropathie: dort Thenar (APB) ausgespart."
    },
    {
      "id": "radth1",
      "name": "Radikulopathie Th1",
      "kuerzel": "statth1",
      "punkte": [
        "klopfdolenz",
        "halsbeweglichkeit",
        "spurling",
        "dermatom",
        "beruehrung",
        "atrophien",
        "kraftarme",
        "armhalteversuch",
        "mer",
        "troemner",
        "babinski"
      ],
      "zusatz": [
        "lhermitte",
        "tinel",
        "pallaesthesie",
        "horner",
        "ptose"
      ],
      "merkmalAb": {
        "kraftarme": [
          "pect",
          "innenrot",
          "aussenrot",
          "addukt",
          "abd0",
          "abd90",
          "streck",
          "beug",
          "hgstreck",
          "hgbeug",
          "fistreck",
          "fibeug23",
          "fibeug45",
          "daumabd",
          "daumopp"
        ]
      },
      "info": "Kennmuskeln: kleine Handmuskeln (Interossei, Hypothenar, Daumenadduktion). Dermatom: medialer Unterarm bis Ellbogen. An Horner denken (untere Plexus-/Pancoast-Läsion!)."
    },
    {
      "id": "radl3",
      "name": "Radikulopathie L3",
      "kuerzel": "statl3",
      "punkte": [
        "klopfdolenz",
        "lasegue",
        "lasegueumgekehrt",
        "dermatom",
        "beruehrung",
        "atrophien",
        "kraftbeine",
        "mer",
        "babinski",
        "gangbild",
        "zehenfersengang"
      ],
      "zusatz": [
        "tineluntere",
        "reithose",
        "mennell",
        "pallaesthesie"
      ],
      "merkmalAb": {
        "kraftbeine": [
          "hueftstreck",
          "osabd",
          "kniebeug",
          "fussheb",
          "fusssenk",
          "gzheb",
          "zehheb",
          "zehflex",
          "eversion",
          "inversion"
        ]
      },
      "info": "Kennmuskeln: Hüftbeugung, Adduktion, Kniestreckung (Quadrizeps). PSR abgeschwächt. Umgekehrter Lasègue positiv. Dermatom: Oberschenkelvorderseite bis Knie."
    },
    {
      "id": "radl4",
      "name": "Radikulopathie L4",
      "kuerzel": "statl4",
      "punkte": [
        "klopfdolenz",
        "lasegue",
        "lasegueumgekehrt",
        "dermatom",
        "beruehrung",
        "atrophien",
        "kraftbeine",
        "mer",
        "babinski",
        "gangbild",
        "zehenfersengang"
      ],
      "zusatz": [
        "tineluntere",
        "reithose",
        "mennell",
        "pallaesthesie"
      ],
      "merkmalAb": {
        "kraftbeine": [
          "hueftbeug",
          "hueftstreck",
          "osabd",
          "osadd",
          "kniebeug",
          "fusssenk",
          "gzheb",
          "zehheb",
          "zehflex",
          "eversion"
        ]
      },
      "info": "Kennmuskeln: Kniestreckung (Quadrizeps), Fusshebung und Inversion (Tibialis anterior). PSR abgeschwächt. Dermatom: medialer Unterschenkel bis Innenknöchel."
    },
    {
      "id": "radl5",
      "name": "Radikulopathie L5",
      "kuerzel": "statl5",
      "punkte": [
        "klopfdolenz",
        "lasegue",
        "lasegueumgekehrt",
        "dermatom",
        "beruehrung",
        "atrophien",
        "kraftbeine",
        "mer",
        "babinski",
        "gangbild",
        "zehenfersengang",
        "trendelenburg"
      ],
      "zusatz": [
        "tineluntere",
        "reithose",
        "mennell",
        "pallaesthesie"
      ],
      "merkmalAb": {
        "kraftbeine": [
          "hueftbeug",
          "hueftstreck",
          "osadd",
          "kniestreck",
          "kniebeug",
          "fusssenk",
          "zehflex"
        ]
      },
      "info": "Kennmuskeln: Fuss- und Grosszehenhebung, Zehenheber, Hüftabduktion (Glutaeus medius — Trendelenburg!). Fersengang erschwert. MER typischerweise unauffällig (ASR erhalten). Dermatom: lateraler Unterschenkel, Fussrücken, Grosszehe. DD Peroneusparese: dort Inversion und Trendelenburg intakt."
    },
    {
      "id": "rads1",
      "name": "Radikulopathie S1",
      "kuerzel": "stats1",
      "punkte": [
        "klopfdolenz",
        "lasegue",
        "lasegueumgekehrt",
        "dermatom",
        "beruehrung",
        "atrophien",
        "kraftbeine",
        "mer",
        "babinski",
        "gangbild",
        "zehenfersengang"
      ],
      "zusatz": [
        "tineluntere",
        "reithose",
        "mennell",
        "pallaesthesie"
      ],
      "merkmalAb": {
        "kraftbeine": [
          "hueftbeug",
          "osabd",
          "osadd",
          "kniestreck",
          "fussheb",
          "gzheb",
          "zehheb",
          "inversion"
        ]
      },
      "info": "Kennmuskeln: Fusssenkung (Zehengang erschwert!), Kniebeugung (ischiokrural), Hüftstreckung (Glutaeus maximus). ASR abgeschwächt. Dermatom: Fussaussenrand, Fusssohle, dorsale Wade."
    },
    {
      "id": "enzephalitis",
      "name": "Enzephalitis",
      "kuerzel": "statenz",
      "punkte": [
        "az",
        "vigilanz",
        "orientierung",
        "kooperation",
        "sprache",
        "nachsprechen",
        "aufforderungen",
        "kurzgedaechtnis",
        "meningismus",
        "kernig",
        "brudzinski",
        "pupillen",
        "folgebewegungen",
        "mimik",
        "armhalteversuch",
        "beinhalteversuch",
        "beruehrung",
        "mer",
        "babinski",
        "hyperkinesien",
        "gangbild"
      ],
      "zusatz": [
        "fundoskopie",
        "neglect",
        "frontalzeichen",
        "kognition",
        "bewusstseinslage"
      ],
      "info": "Typisch: Vigilanz- und Verhaltensänderung, neues Gedächtnisdefizit (limbisch), Meningismus, epileptische Phänomene, Myoklonien oder orofaziale Dyskinesien (NMDA-R), fokale Zeichen (HSV temporal: Aphasie!). Stauungspapille suchen."
    },
    {
      "id": "sht",
      "name": "Schädel-Hirn-Trauma",
      "kuerzel": "statsht",
      "punkte": [
        "bewusstseinslage",
        "orientierung",
        "kurzgedaechtnis",
        "pupillen",
        "folgebewegungen",
        "otoskopie",
        "mimik",
        "armhalteversuch",
        "beinhalteversuch",
        "beruehrung",
        "mer",
        "babinski",
        "gangbild",
        "romberg",
        "klopfdolenz",
        "halsbeweglichkeit"
      ],
      "zusatz": [
        "riechen",
        "spontannystagmus",
        "kopfimpulstest",
        "hoeren",
        "gesichtsfeld"
      ],
      "info": "Bewusstseinslage (GCS-äquivalent) und Pupillen-Seitendifferenz zuerst; Amnesiedauer dokumentieren. Otoskopie (Hämatotympanon, Liquorrhoe), Brillen-/Battle-Hämatom inspizieren. Die HWS gehört IMMER mitbeurteilt; Riechverlust bei frontobasaler Verletzung."
    },
    {
      "id": "ulnaris",
      "name": "Ulnarisneuropathie",
      "kuerzel": "statulnaris",
      "punkte": [
        "atrophien",
        "kraftarme",
        "froment",
        "tinel",
        "beruehrung",
        "dermatom",
        "spitzstumpf",
        "mer",
        "troemner"
      ],
      "zusatz": [
        "pallaesthesie",
        "zweipunkt"
      ],
      "merkmalAb": {
        "kraftarme": [
          "pect",
          "innenrot",
          "aussenrot",
          "addukt",
          "abd0",
          "abd90",
          "streck",
          "beug",
          "hgstreck",
          "hgbeug",
          "fistreck",
          "fibeug23",
          "daumabd",
          "daumopp"
        ]
      },
      "info": "Typisch: Froment positiv, Schwäche von Interossei/Hypothenar/Daumenadduktion, Atrophie der Spatia interossea, Tinel am Sulcus; sensible Spaltung des Ringfingers. DD C8/Th1: dort zusätzlich Thenar (APB) und medialer Unterarm betroffen."
    },
    {
      "id": "peroneus",
      "name": "Peroneusparese",
      "kuerzel": "statperoneus",
      "punkte": [
        "gangbild",
        "zehenfersengang",
        "atrophien",
        "kraftbeine",
        "tineluntere",
        "beruehrung",
        "dermatom",
        "mer",
        "babinski"
      ],
      "zusatz": [
        "trendelenburg",
        "lasegue",
        "lasegueumgekehrt"
      ],
      "merkmalAb": {
        "kraftbeine": [
          "hueftbeug",
          "hueftstreck",
          "osabd",
          "osadd",
          "kniestreck",
          "kniebeug",
          "fusssenk",
          "zehflex"
        ]
      },
      "info": "Typisch: Steppergang, Fersengang erschwert, Fussheber- und Eversionsschwäche; Tinel am Fibulaköpfchen. DD L5-Radikulopathie: bei Peroneusläsion sind Inversion (Tibialis posterior) und Hüftabduktion/Trendelenburg INTAKT, ASR erhalten."
    },
    {
      "id": "fazialis",
      "name": "Fazialisparese",
      "kuerzel": "statfazialis",
      "punkte": [
        "mimik",
        "bell",
        "geschmack",
        "gesichtssensibilitaet",
        "cornealreflex",
        "hoeren",
        "otoskopie",
        "folgebewegungen",
        "armhalteversuch",
        "sprache",
        "nachsprechen",
        "aufforderungen"
      ],
      "zusatz": [
        "masseter",
        "stimme",
        "schlucken"
      ],
      "info": "Peripher: Stirn mitbetroffen, Bell-Phänomen, Geschmacksstörung, Hyperakusis; Otoskopie wegen Zoster oticus (Ramsay Hunt). Zentral: Stirn ausgespart, oft begleitende Arm- oder Sprachstörung — dann wie Stroke abklären."
    },
    {
      "id": "anfall",
      "name": "Anfall/postiktal",
      "kuerzel": "statanfall",
      "punkte": [
        "vigilanz",
        "orientierung",
        "kurzgedaechtnis",
        "sprache",
        "nachsprechen",
        "aufforderungen",
        "zunge",
        "mimik",
        "pupillen",
        "armhalteversuch",
        "beinhalteversuch",
        "mer",
        "babinski",
        "gangbild",
        "klopfdolenz"
      ],
      "zusatz": [
        "meningismus",
        "fundoskopie",
        "kognition"
      ],
      "info": "Lateraler Zungenbiss spricht für einen epileptischen Anfall. Todd-Parese und postiktaler Babinski sind möglich und rückläufig — Verlauf dokumentieren, ebenso die Reorientierungsdauer. Wirbelsäulen-Klopfdolenz (Frakturen) und Schultern (Luxation) prüfen."
    },
    {
      "id": "tremorabkl",
      "name": "Tremor-Abklärung",
      "kuerzel": "stattremor",
      "punkte": [
        "haendigkeit",
        "tremor",
        "rigor",
        "armhalteversuch",
        "fnv",
        "ffv",
        "schriftprobe",
        "fingertapping",
        "diadochokinese",
        "gangbild",
        "armschwung",
        "hypomimie",
        "stimme"
      ],
      "zusatz": [
        "fusstapping",
        "retropulsion",
        "updrs",
        "entrainment"
      ],
      "info": "Ruhe- gegen Halte- und Intentionstremor abgrenzen; Schriftprobe (Mikrographie beim Parkinson, grosszügig-tremorös beim essenziellen Tremor). Begleitende Parkinson-Zeichen gezielt: Rigor, Armschwung, Hypomimie, Tapping-Dekrement. Bei Verdacht auf funktionellen Tremor: Entrainment und Ablenkbarkeit."
    },
    {
      "id": "myelopathie",
      "name": "Myelopathie/spinal",
      "kuerzel": "statmyelo",
      "punkte": [
        "gangbild",
        "strichgang",
        "trophiktonus",
        "kraftbeine",
        "beruehrung",
        "rumpfsensibilitaet",
        "pallaesthesie",
        "lagesinn",
        "mer",
        "babinski",
        "pyramidenzeichen",
        "kloni",
        "bauchhautreflexe",
        "troemner",
        "lhermitte"
      ],
      "zusatz": [
        "kraftarme",
        "reithose",
        "analreflex",
        "blasemastdarm",
        "spurling"
      ],
      "merkmalAb": {
        "kraftbeine": [
          "hueftstreck",
          "osabd",
          "osadd",
          "zehheb",
          "zehflex",
          "eversion",
          "inversion"
        ]
      },
      "info": "Sensibles Niveau am RUMPF suchen; Hinterstrang (Pallästhesie, Lagesinn). Spastik, gesteigerte MER, Kloni, Babinski; fehlende Bauchhautreflexe als Höhenhinweis. Zervikal: Trömner, Lhermitte. Sakrale Sensibilität und Sphinkter bei Konus-/Kauda-Verdacht."
    },
    {
      "id": "als",
      "name": "Motoneuron/ALS",
      "kuerzel": "statals",
      "punkte": [
        "zunge",
        "stimme",
        "schlucken",
        "faszikulationen",
        "atrophien",
        "kraftarme",
        "kraftbeine",
        "mer",
        "babinski",
        "troemner",
        "masseterreflex",
        "gangbild",
        "atemmuskulatur",
        "affekt",
        "alsfrs"
      ],
      "zusatz": [
        "fingerspiel",
        "mrcsumme",
        "schnauzreflex",
        "rumpfmuskulatur"
      ],
      "merkmalAb": {
        "kraftarme": [
          "pect",
          "innenrot",
          "aussenrot",
          "addukt",
          "abd0",
          "hgbeug",
          "fibeug45",
          "zeigeabsp",
          "daumadd",
          "kleinopp"
        ],
        "kraftbeine": [
          "hueftstreck",
          "osabd",
          "osadd",
          "zehheb",
          "zehflex",
          "eversion",
          "inversion"
        ]
      },
      "info": "Leitbefund: Nebeneinander von erstem (gesteigerte MER, Babinski, lebhafter Masseterreflex) und zweitem Motoneuron (Atrophien, Faszikulationen — Zunge ansehen!), gesteigerte Reflexe im atrophen Muskel. Keine Sensibilitätsstörung. Bulbär: Stimme, Schlucken, Zunge; Affekt (pseudobulbär). ALSFRS-R für den Verlauf."
    },
    {
      "id": "nph",
      "name": "NPH",
      "kuerzel": "statnph",
      "punkte": [
        "gangbild",
        "anlauf",
        "wendeschritte",
        "retropulsion",
        "zweiminuten",
        "orientierung",
        "kurzgedaechtnis",
        "kognition",
        "mer",
        "babinski",
        "blasemastdarm"
      ],
      "zusatz": [
        "freezing",
        "t25fw",
        "uhrentest",
        "luria",
        "armschwung"
      ],
      "info": "Hakim-Trias: breitbasig-magnetische Gangstörung, kognitive Verlangsamung, Dranginkontinenz. Den 2-Minuten-Gehtest (und T25FW) VOR und NACH dem Liquor-Ablassversuch festhalten — die Gangbesserung entscheidet."
    },
    {
      "id": "funktionell",
      "name": "Funktionelle Störung",
      "kuerzel": "statfunk",
      "punkte": [
        "gangbild",
        "einbein",
        "romberg",
        "hoover",
        "armhalteversuch",
        "kraftbeine",
        "beruehrung",
        "dermatom",
        "tremor",
        "entrainment",
        "mer",
        "babinski"
      ],
      "zusatz": [
        "strichgang",
        "blindgang",
        "zehenfersengang"
      ],
      "merkmalAb": {
        "kraftbeine": [
          "hueftstreck",
          "osabd",
          "osadd",
          "kniebeug",
          "fusssenk",
          "gzheb",
          "zehheb",
          "zehflex",
          "eversion",
          "inversion"
        ]
      },
      "info": "POSITIVE Zeichen dokumentieren, nicht nur Normales: Hoover, Give-way-Schwäche, Entrainment/Ablenkbarkeit des Tremors, Ablenkungs-Romberg, nicht-anatomische Sensibilitätsgrenzen, inkonsistentes Gangbild. Wertfrei beschreiben."
    }
  ];

  var KATALOG_STAND = "2026-10-06";
  var TEILMENGEN_STAND = "2026-10-03c";

  function master() {
    return { fassung: 1, stand: KATALOG_STAND,
             kategorien: JSON.parse(JSON.stringify(KATEGORIEN)),
             untersuchungen: JSON.parse(JSON.stringify(UNTERSUCHUNGEN)) };
  }
  function teilmengen() { return JSON.parse(JSON.stringify(TEILMENGEN)); }

  return { master: master, teilmengen: teilmengen, KATALOG_STAND: KATALOG_STAND,
           TEILMENGEN_STAND: TEILMENGEN_STAND,
           UMSCHLUESSEL: {"weberrinne":["weber","rinne"],"gaumensegel":["gaumensegel","wuergreflex"],"lasegue":["lasegue","lasegueumgekehrt"],"kernig":["kernig","brudzinski"],"proximal":["aufstehenhocke","einbeinhuepfen","trendelenburg"],"merarme":["mer"],"merbeine":["mer"],"fnv":["fnv","ffv"],"sprache":["sprache","nachsprechen","aufforderungen"]} };
})();
