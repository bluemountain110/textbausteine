// Datei: eeg-grundlage.js
// Projekt: Textbausteine — Teil: App (Browser) UND Chrome-Erweiterung
//          (byteweise Kopie — Prüfsuite: cmp)
// Zweck: Die Grundausstattung des EEG-Werks: Kategorien und Punkte
//        samt der beiden Start-Vorlagen „Normal" (;;eeg) und „IPS"
//        (;;eegips) — UND die Regeln des Schnell-Befunds: Bänder,
//        Lokalisations-Ketten (fronto-/temporo-/…), Seiten,
//        Ausbreitungen, Entladungsformen sowie die Automatik, die aus
//        dem Befund die Beurteilung baut (Allgemeinveränderungs-
//        Grenzen bei 8 und 6 Hz, Herd-Schweregrade je Band, fGRDA).
//        Kategorien mit schnell=true stehen offen in der Maske, die
//        übrigen eingeklappt. Diese Datei ist NUR Erstbefüllung und
//        Regelwerk — gearbeitet wird mit der Fassung in den
//        Einstellungen (eegMaster/eegVorlagen), die auf alle Geräte
//        synct. GRUNDSATZ: Vorlagen speichern nie Feld-Werte oder
//        überschriebene Texte — nichts mit Patientenbezug verlässt je
//        die Sitzung.

"use strict";
window.TB = window.TB || {};

TB.eegGrundlage = (function () {
  var SEITE = "links|rechts|bds.|bds. linksbetont|bds. rechtsbetont|bds. ohne eindeutige Seitenbetonung";
  var ORT = "frontotemporal|frontal|frontopolar|frontozentral|temporal|temporal anterior|temporal posterior|temporoparietal|temporookzipital|zentral|zentroparietal|parietal|parietookzipital|okzipital|hemisphärisch|bifrontal|bitemporal|bifrontotemporal|generalisiert|multifokal";
  function aw(label, liste) { return "{{Auswahl:" + label + ":" + liste + "}}"; }
  function p(id, kat, haeufig, text) {
    return { id: id, kategorie: kat, haeufig: !!haeufig, text: text };
  }

  // ---- Regeln des Schnell-Befunds (gelten in App UND Erweiterung) ----
  // Allgemeinveränderung aus der Grundrhythmus-Frequenz: 8,0 Hz ist
  // noch normal, 6,0 noch leicht (Näd, 2.10.).
  var REGELN = {
    avNormalAb: 8,
    avLeichtAb: 6,
    avSaetze: { normal: "Normaler Grundrhythmus.",
                leicht: "Leichte Allgemeinveränderung.",
                mittel: "Mittelschwere Allgemeinveränderung." },
    fgrdaBeurteilung: "Intermittierende fGRDA.",
    // Herd-Zeilen: Band bestimmt den Schweregrad der Beurteilung.
    herdHaeufigkeiten: ["Vereinzelt", "Wiederholt", "Intermittierend",
                        "Kontinuierlich"],
    baender: [
      { id: "theta",       wort: "Theta-Band",       herd: "Leichter",      gen: "Leichte" },
      { id: "theta-delta", wort: "Theta-Delta-Band", herd: "Mässiggradiger", gen: "Mässiggradige" },
      { id: "delta-theta", wort: "Delta-Theta-Band", herd: "Mittelschwerer", gen: "Mittelschwere" },
      { id: "delta",       wort: "Delta-Band",       herd: "Schwerer",      gen: "Schwere" },
      { id: "subdelta",    wort: "Subdelta-Band",    herd: "Schwerer",      gen: "Schwere",
        zusatz: " (mit Subdelta-Wellen)" }
    ],
    // Lokalisations-Kette: bis 4 Glieder, Bindeform + letztes Glied
    // voll ("frontal"+"temporal" → "fronto-temporal"); dazu die
    // Sonderfälle generalisiert und hemisphärisch.
    regionen: [
      { id: "frontal",   binde: "fronto" },
      { id: "temporal",  binde: "temporo" },
      { id: "parietal",  binde: "parieto" },
      { id: "okzipital", binde: "okzipito" },
      { id: "zentral",   binde: "zentro" }
    ],
    spezialLok: ["generalisiert", "hemisphärisch"],
    seiten: ["", "links", "rechts", "bds.", "bds. linksbetont",
             "bds. rechtsbetont"],
    ausbreitungen: ["", "bis zur Mittellinie", "bis zur Gegenseite",
                    "bis frontal", "bis temporal", "bis parietal",
                    "bis okzipital", "bis zentral"],
    // Entladungs-Zeilen (Reihenfolge: Näd, 2.10.). „Spike-Wave" ist
    // die Kurzform des Spike-Wave-Komplexes — im Befund steht die
    // volle Form.
    entHaeufigkeiten: ["Vereinzelte", "Wiederholte", "Intermittierende",
                       "Kontinuierliche"],
    entFormen: ["Spike-Wave-Komplexe", "Spikes", "Sharp-Waves",
                "Sharp-Wave-Komplexe", "Polyspikes",
                "Polyspike-Wave-Komplexe", "Sharp-Slow-Wave-Komplexe"],
    // Dreiknopf-Zeilen (Näd 2.10. Nachmittag): links = vorangewählt.
    ableitungKnoepfe: [
      { name: "Standard",
        werte: { "Montage": "10/20 + 6 true temporal Elektroden-Ableitung",
                 "Bedingungen": "unter Standardbedingungen im EEG Stuhl" },
        artefakt50: false },
      { name: "Notfall",
        werte: { "Montage": "10/20-Ableitung",
                 "Bedingungen": "auf der Notfallliege" },
        artefakt50: false },
      { name: "IPS",
        werte: { "Montage": "10/20-Ableitung",
                 "Bedingungen": "im Bett auf der Intensivstation" },
        artefakt50: true }
    ],
    vigilanzKnoepfe: [
      { name: "wach, im Verlauf schläfrig",
        wert: "wach, im Verlauf schläfrig mit Alpha-dropout und hypnagogen Thetawellen" },
      { name: "wach", wert: "wach" },
      { name: "durchgehend schläfrig", wert: "durchgehend schläfrig" }
    ],
    artefaktKaestchen: ["art_augen", "art_muskel", "art_bewegung"],
    herdeVorbereitet: 2,
    entladungenVorbereitet: 1,
    // Voranwahl der vorbereiteten Herd-Zeile: das Häufigste (Näd
    // 2.10. Abend) — intermittierend, Theta-Delta, temporal, KEINE
    // Seite vorausgewählt.
    herdVorwahl: { haeufigkeit: "Intermittierend", band: "theta-delta",
                   lok: ["temporal", "", "", ""], ausbreitung: "",
                   seite: "" },
    entVorwahl: { haeufigkeit: "Vereinzelte", lok: ["temporal", "", "", ""],
                  ausbreitung: "", seite: "" },
    // Steile Transienten als eigene Zeilen-Art (wie die Herde, mit
    // Kette und Seite), fester Schluss-Teil.
    transHaeufigkeiten: ["Vereinzelt", "Wiederholt"],
    transSchluss: ", die Kriterien für epilepsietypische Potenziale jedoch nicht vollständig erfüllt",
    transWort: "eingelagerte steilere Transienten",
    // Eingeschränkte Beurteilbarkeit (aus dem Artefakt-Punkt) steht
    // GANZ VORN in der Beurteilung.
    grenzSatz: "%s eingeschränkte Beurteilbarkeit aufgrund von Artefakten.",
    // Hyperventilation/Photostimulation: Häkchen weg = automatisch
    // "nicht durchgeführt." (überschreibbar).
    nichtDurchgefuehrt: "nicht durchgeführt.",
    // Schlafelemente, geordnet nach Stadium; ein Kreuz ergibt in der
    // Beurteilung "Erreichen von Schlafstadium x." (das tiefste).
    schlafStadien: ["N1", "N2", "N3", "REM"],
    schlafElemente: [
      { id: "vig_n1_vertex", stadium: "N1" },
      { id: "vig_n1_theta", stadium: "N1" },
      { id: "vig_n1_posts", stadium: "N1" },
      { id: "vig_n2_spindeln", stadium: "N2" },
      { id: "vig_n2_k", stadium: "N2" },
      { id: "vig_n3_delta", stadium: "N3" },
      { id: "vig_rem_saege", stadium: "REM" },
      { id: "vig_rem_augen", stadium: "REM" }
    ],
    schlafSatz: "Erreichen von Schlafstadium %s.",
    keineHerde: "Keine Verlangsamungsherde.",
    keineEtp: "Keine epilepsietypischen Potentiale.",
    // Die "keine."-Punkte sind eine Auswahl; jede Variante hat ihren
    // eigenen automatischen Beurteilungs-Satz.
    keineVariantenHerde: {
      "keine.": "Keine Verlangsamungsherde.",
      "aufgrund ausgeprägter Artefakte nicht beurteilbar.":
        "Verlangsamungsherde nicht beurteilbar.",
      "bei ausgeprägten Artefakten soweit beurteilbar keine.":
        "Soweit beurteilbar keine Verlangsamungsherde."
    },
    keineVariantenEtp: {
      "keine.": "Keine epilepsietypischen Potentiale.",
      "aufgrund ausgeprägter Artefakte nicht beurteilbar.":
        "Epilepsietypische Potentiale nicht beurteilbar.",
      "bei ausgeprägten Artefakten soweit beurteilbar keine.":
        "Soweit beurteilbar keine epilepsietypischen Potentiale."
    },
    // KISIM-Feld Indikation/Fragestellung: drei Kästchen (Näd 2.10.).
    indikationKnoepfe: [
      { id: "ind_standard", name: "Standard" },
      { id: "ind_demenz", name: "Demenzabklärung" },
      { id: "ind_status", name: "Status" }
    ],
    // Relevante Anamnese: Antikonvulsiva — erst die fünf häufigsten,
    // dann alphabetisch (Näd 2.10.).
    antikonvulsiva: ["Lamotrigin", "Levetiracetam", "Brivaracetam",
      "Lacosamid", "Valproat", "Carbamazepin", "Cenobamat", "Clobazam",
      "Clonazepam", "Eslicarbazepin", "Ethosuximid", "Gabapentin",
      "Lorazepam", "Oxcarbazepin", "Perampanel", "Phenobarbital",
      "Phenytoin", "Pregabalin", "Primidon", "Rufinamid", "Sultiam",
      "Topiramat", "Vigabatrin", "Zonisamid"],
    medisVorbereitet: 1,
    // KISIM-Sprungfolge für das Skript (Start im Feld Indikation/
    // Fragestellung): 2x Strg+Tab -> Relevante Anamnese, 4x -> das
    // ZWEITE Befund-Kästchen, 2x -> Beurteilung.
    kisimSpruenge: { nachAnamnese: 2, nachBefund: 4, nachBeurteilung: 2 },
    etpWort: "Epilepsietypische Potentiale",
    etpGeneralisiert: "Generalisierte epilepsietypische Potentiale",
    verlangsamungGen: "generalisierte Verlangsamung",
    herdWort: "Verlangsamungsherd"
  };

  // schnell=true: offen in der Maske; der Rest eingeklappt und nur
  // auf Aufklappen sichtbar (Näd, 2.10.: die meisten EEGs sind simpel).
  var KATEGORIEN = [
    { id: "indikation", name: "Indikation/Fragestellung", bereich: "indikation", titel: false, absatz: false, schnell: true },
    { id: "anamnese", name: "Relevante Anamnese", bereich: "anamnese", titel: false, absatz: false, schnell: true, zeilen: "medis" },
    { id: "ableitung", name: "Ableitung", bereich: "befund", titel: false, absatz: true, schnell: true },
    { id: "artefakte", name: "Artefakte", bereich: "befund", titel: false, absatz: true, schnell: true },
    { id: "grundaktivitaet", name: "Grundaktivität", bereich: "befund", titel: true, absatz: true, schnell: true },
    { id: "vigilanz", name: "Vigilanz", bereich: "befund", titel: true, absatz: false, schnell: true },
    { id: "verlangsamung", name: "Verlangsamungsherde", bereich: "befund", titel: true, absatz: false, schnell: true, zeilen: "herde" },
    { id: "entladungen", name: "Entladungen", bereich: "befund", titel: true, absatz: false, schnell: true, zeilen: "entladungen" },
    { id: "hyperventilation", name: "Hyperventilation", bereich: "befund", titel: true, absatz: true, schnell: true },
    { id: "photostimulation", name: "Photostimulation", bereich: "befund", titel: true, absatz: false, schnell: true },
    { id: "ekg", name: "EKG", bereich: "befund", titel: true, absatz: true, schnell: true },
    { id: "voreeg", name: "Vor-EEG", bereich: "befund", titel: false, absatz: true, schnell: false },
    { id: "anfallsmuster", name: "Anfallsmuster", bereich: "befund", titel: true, absatz: true, schnell: false },
    { id: "muster", name: "Periodische und rhythmische Muster", bereich: "befund", titel: true, absatz: false, schnell: false },
    { id: "reaktivitaet", name: "Reaktivität", bereich: "befund", titel: true, absatz: false, schnell: false },
    { id: "kontinuitaet", name: "Kontinuität", bereich: "befund", titel: true, absatz: false, schnell: false },
    { id: "se", name: "Status epilepticus", bereich: "befund", titel: true, absatz: false, schnell: false },
    { id: "normvarianten", name: "Normvarianten", bereich: "befund", titel: true, absatz: false, schnell: false },
    { id: "knochenluecke", name: "Knochenlücke", bereich: "befund", titel: true, absatz: false, schnell: false },
    { id: "ereignisse", name: "Klinische Ereignisse", bereich: "befund", titel: true, absatz: true, schnell: false },
    { id: "beurteilung", name: "Beurteilung", bereich: "beurteilung", titel: false, absatz: false, schnell: true }
  ];

  var PUNKTE = [
    // ---- Indikation/Fragestellung (KISIM-Feld 1) ----------------------
    p("ind_standard", "indikation", true,
      "Verlangsamungsherde, epilepsietypische Potentiale?"),
    p("ind_demenz", "indikation", true, "Demenzabklärung."),
    p("ind_status", "indikation", true,
      "(Non-konvulsiver) Status epilepticus?"),
    // ---- Relevante Anamnese (KISIM-Feld 2) ----------------------------
    p("ana_med", "anamnese", true,
      "Aktuelle antikonvulsive Medikation:"),
    // ---- Ableitung (der Technik-Satz) ---------------------------------
    p("abl_satz", "ableitung", true,
      aw("Qualität", "Technisch gelungene|Technisch erschwerte") + " " +
      aw("Montage", "10/20 + 6 true temporal Elektroden-Ableitung|10/20-Ableitung") + " " +
      aw("Bedingungen", "unter Standardbedingungen im EEG Stuhl|im Bett auf der Intensivstation|auf der Notfallliege|im Bett auf Station") +
      ", Pat. " + aw("Patient", "kooperativ|wenig kooperativ|unruhig|somnolent|soporös|komatös") + "."),
    p("abl_sed", "ableitung", false,
      "Pat. analgosediert mit {{Feld:Sedation=Propofol}}, " +
      aw("Beatmung", "intubiert und beatmet|tracheotomiert und beatmet|spontan atmend") + "."),
    p("abl_dauer", "ableitung", false,
      aw("Art", "Verlängerte Ableitung über|Nachtschlaf-EEG-Ableitung während|Langzeit-EEG-Ableitung über") +
      " {{Feld:Dauer=60}} " + aw("Einheit", "Minuten|Stunden") + "."),
    p("abl_video", "ableitung", false, "Mit begleitendem Videomonitoring."),
    p("abl_schlafentzug", "ableitung", false, "Zustand nach Schlafentzug."),
    // ---- Artefakte ----------------------------------------------------
    p("art_augen", "artefakte", true,
      "Lid- und Bulbusartefakte bds. frontal."),
    p("art_muskel", "artefakte", true, "Muskelartefakte."),
    p("art_bewegung", "artefakte", true, "Bewegungsartefakte."),
    p("art_50hz", "artefakte", false, "50-Hz-Artefakte."),
    p("art_pflege", "artefakte", false,
      "Beatmungs-, Pflege- und Lagerungsartefakte."),
    p("art_elektrode", "artefakte", false,
      "Elektrodenartefakt über {{Feld:Elektrode}}."),
    p("art_puls", "artefakte", false,
      "Puls-/EKG-Artefakte {{Feld:Schwerpunkt=temporal links}}."),
    p("art_schwitz", "artefakte", false,
      "Schwitzartefakte mit langsamen Grundlinienschwankungen."),
    p("art_geraet", "artefakte", false,
      "Geräteartefakte ({{Feld:Quelle=Dialyse}})."),
    p("art_grenze", "artefakte", false,
      "Die Beurteilbarkeit ist dadurch " + aw("Grad", "leicht|mässig|deutlich") + " eingeschränkt."),
    // ---- Grundaktivität -----------------------------------------------
    p("ga_grundrhythmus", "grundaktivitaet", true,
      aw("Ausprägung", "gut|mässig|schlecht") + " ausgeprägter " +
      aw("Modulation", "modulierter|wenig modulierter|unmodulierter") +
      " okzipitaler Grundrhythmus um {{Feld:Frequenz=9}} Hz."),
    p("ga_nb", "grundaktivitaet", false, "nicht beurteilbar."),
    p("ga_blockade", "grundaktivitaet", true,
      aw("Blockade", "Positive visuelle Blockade|Fehlende visuelle Blockade|Visuelle Blockade nicht beurteilbar (Augen nicht geöffnet)") + "."),
    p("ga_fgrda", "grundaktivitaet", true,
      "Intermittierende frontal betonte rhythmische Delta-Aktivität."),
    p("ga_seitendifferenz", "grundaktivitaet", false,
      "Seitendifferenz der Grundaktivität: {{Feld:Beschreibung=Amplitudenminderung links temporal}}."),
    p("ga_beta", "grundaktivitaet", false,
      aw("Grad", "Leicht|Deutlich") + " vermehrte Beta-Aktivität " +
      aw("Schwerpunkt", "frontal|über den hinteren Hirnarealen|diffus") + ", a. e. " +
      aw("Ursache", "bei fehlender Entspannung|medikamentös (Benzodiazepine)|medikamentös (Propofol)") + "."),
    p("ga_diffus", "grundaktivitaet", false,
      "diffus verlangsamt auf {{Feld:Frequenz=6}}/s, " +
      aw("Verlauf", "kontinuierlich|diskontinuierlich") + "."),
    p("ga_amplitude", "grundaktivitaet", false,
      "Amplitudenniveau " + aw("Niveau", "normal|reduziert (low voltage, unter 20 µV)|supprimiert (unter 10 µV)") + "."),
    p("ga_anterior", "grundaktivitaet", false,
      "Anteriorisierung des Grundrhythmus."),
    p("ga_zerfall", "grundaktivitaet", false,
      "Im Laufe der Ableitung zeitweise Zerfall der Grundaktivität."),
    // ---- Vigilanz -----------------------------------------------------
    p("vig_haupt", "vigilanz", true,
      aw("Zustand", "wach, im Verlauf schläfrig mit Alpha-dropout und hypnagogen Thetawellen|wach|durchgehend schläfrig|fluktuierende Vigilanz") + "."),
    p("vig_ips", "vigilanz", false,
      "Durchgehend " + aw("Zustand", "somnolent|soporös|komatös") + ", keine Schlaf-Wach-Differenzierung abgrenzbar."),
    p("vig_n1_vertex", "vigilanz", false, "Vertexwellen."),
    p("vig_n1_theta", "vigilanz", false, "Hypnagoge Thetawellen."),
    p("vig_n1_posts", "vigilanz", false,
      "POSTS (positive okzipitale scharfe Transienten des Schlafs)."),
    p("vig_n2_spindeln", "vigilanz", false, "Schlafspindeln."),
    p("vig_n2_k", "vigilanz", false, "K-Komplexe."),
    p("vig_n3_delta", "vigilanz", false, "Hochgespannte Delta-Aktivität."),
    p("vig_rem_saege", "vigilanz", false, "Sägezahnwellen."),
    p("vig_rem_augen", "vigilanz", false, "Rasche Augenbewegungen."),
    p("vig_arousal", "vigilanz", false,
      "Arousals " + aw("Auslöser", "spontan|auf Reiz") + "."),
    // ---- Verlangsamungsherde (Hauptweg: die Herd-Zeilen der Maske) ----
    p("vl_keine", "verlangsamung", true,
      "{{Auswahl:Befund:keine.|aufgrund ausgeprägter Artefakte nicht beurteilbar.|bei ausgeprägten Artefakten soweit beurteilbar keine.}}"),
    p("vl_irda", "verlangsamung", false,
      aw("Art", "FIRDA (frontal intermittierende rhythmische Delta-Aktivität)|OIRDA (okzipital intermittierende rhythmische Delta-Aktivität)|TIRDA (temporal intermittierende rhythmische Delta-Aktivität)") +
      aw("Seite", "| links| rechts| bds.") + "."),
    // ---- Entladungen (Hauptweg: die Entladungs-Zeilen der Maske) ------
    p("ent_keine", "entladungen", true,
      "{{Auswahl:Befund:keine.|aufgrund ausgeprägter Artefakte nicht beurteilbar.|bei ausgeprägten Artefakten soweit beurteilbar keine.}}"),
    p("ent_aktivierung", "entladungen", false,
      "Aktivierung durch " + aw("Auslöser", "Hyperventilation|Photostimulation|Schläfrigkeit und Schlaf") + "."),
    p("ent_zaehlung", "entladungen", false,
      "Während {{Feld:Minuten=14}} Minuten insgesamt {{Feld:Anzahl=8}} derartige Episoden, maximale Dauer {{Feld:Sekunden=2,5}} Sekunden."),
    p("ent_amplitude", "entladungen", false,
      "Amplitudenmaximum über {{Feld:Elektrode=F4}}."),
    // ---- Hyperventilation ---------------------------------------------
    p("hv_haupt", "hyperventilation", true,
      aw("Ergebnis", "keine neuen Aspekte|Zunahme der Verlangsamung|Provokation epilepsietypischer Potenziale|physiologische diffuse Verlangsamung, rasch rückläufig|abgebrochen|nicht durchgeführt") + "."),
    // ---- Photostimulation ---------------------------------------------
    p("ps_haupt", "photostimulation", true,
      aw("Ergebnis", "keine neuen Aspekte|partielles photic driving|deutliches photic driving|abgebrochen|nicht durchgeführt") + "."),
    p("ps_ppr", "photostimulation", false,
      "Photoparoxysmale Reaktion, " + aw("Ausdehnung", "okzipital begrenzt|generalisiert") + ", " +
      aw("Verlauf", "selbstlimitierend|die Stimulation überdauernd") + ", bei {{Feld:Frequenz=15}} Hz."),
    p("ps_pmr", "photostimulation", false, "Photomyogene Reaktion."),
    // ---- EKG ----------------------------------------------------------
    p("ekg_haupt", "ekg", true,
      aw("Befund", "normokarder Sinusrhythmus|normofrequenter Sinusrhythmus|Sinusbradykardie|Sinustachykardie|absolute Arrhythmie, a. e. bei Vorhofflimmern|vereinzelte Extrasystolen") + "."),
    p("ekg_pause", "ekg", false,
      "Pause von {{Feld:Sekunden=3}} s um {{Feld:Uhrzeit}} Uhr — Rückmeldung an die Behandler erfolgt."),
    // ---- Vor-EEG (eingeklappt) ----------------------------------------
    p("ve_vor", "voreeg", false,
      "Vor-EEG vom {{Feld:Datum}}: {{Feld:Kurzbefund}}"),
    // ---- Anfallsmuster ------------------------------------------------
    p("am_episode", "anfallsmuster", true,
      "Episode mit rhythmischer " + aw("Band", "Theta-|Delta-|Alpha-|Spike-Wave-") +
      "Aktivität um {{Feld:Frequenz=2,5}}/s, Beginn " + aw("Ort", ORT) + " " + aw("Seite", SEITE) +
      " um {{Feld:Uhrzeit}} Uhr, Dauer {{Feld:Dauer=26}} Sekunden."),
    p("am_evolution", "anfallsmuster", false,
      "Mit " + aw("Evolution", "räumlicher und zeitlicher Evolution|Evolution in Raum und Frequenz|räumlicher Evolution (Ausweitung)|Evolution in der Frequenz|zeitlicher Evolution (Frequenz und Amplitude)|fehlender Evolution") + "."),
    p("am_korrelat", "anfallsmuster", false,
      "Während der Episode klinisch " + aw("Korrelat", "keine sichtbare Veränderung (subklinisch)|Korrelat wie beschrieben") + "."),
    p("am_reagibilitaet", "anfallsmuster", false,
      aw("Reagibilität", "Erhaltene|Fehlende") + " Reagibilität in direkter Folge der Episoden."),
    p("am_postiktal", "anfallsmuster", false,
      "Postiktale Verlangsamung " + aw("Ort", ORT) + " " + aw("Seite", SEITE) + "."),
    // ---- Periodische und rhythmische Muster (ACNS 2021) ---------------
    p("mu_lpd", "muster", true,
      "LPDs (lateralisierte periodische Entladungen) " + aw("Ort", ORT) + " " + aw("Seite", SEITE) +
      " um {{Feld:Frequenz=1}}/s" + aw("Zusatz", "|, +F (überlagerte schnelle Aktivität)|, +R (rhythmisch)|, +S (steile Morphologie)") + "."),
    p("mu_gpd", "muster", true,
      "GPDs (generalisierte periodische Entladungen) um {{Feld:Frequenz=2}}/s" +
      aw("Morphologie", "|, mit triphasischer Morphologie") + "."),
    p("mu_bipd", "muster", false,
      "BIPDs (bilateral unabhängige periodische Entladungen)."),
    p("mu_lrda", "muster", false,
      "LRDA (lateralisierte rhythmische Delta-Aktivität) " + aw("Ort", ORT) + " " + aw("Seite", SEITE) + "."),
    p("mu_grda", "muster", false,
      "GRDA (generalisierte rhythmische Delta-Aktivität)."),
    p("mu_praevalenz", "muster", false,
      "Prävalenz " + aw("Prävalenz", "selten (unter 1 %)|gelegentlich (1–9 %)|häufig (10–49 %)|reichlich (50–89 %)|kontinuierlich (90 % und mehr)") + " der Ableitung."),
    p("mu_sirpid", "muster", false, "Stimulusinduziert (SIRPIDs)."),
    p("mu_iic", "muster", false,
      "Einordnung: Muster im iktal-interiktalen Kontinuum (IIC)."),
    // ---- Reaktivität und Kontinuität (IPS) ----------------------------
    p("re_reakt", "reaktivitaet", true,
      aw("Reaktivität", "vorhanden|abgeschwächt|fehlend") + " auf " +
      aw("Reiz", "Ansprache und Schmerzreiz|Schmerzreiz|Ansprache|akustische Reize|passive Augenöffnung") + "."),
    p("ko_kont", "kontinuitaet", true,
      aw("Kontinuität", "kontinuierliche Grundaktivität|nahezu kontinuierliche Grundaktivität (Suppressionen unter 10 %)|diskontinuierliche Grundaktivität|Burst-Suppression-Muster|Suppression (durchgehend unter 10 µV)|isoelektrisches EEG") + "."),
    p("ko_burst", "kontinuitaet", false,
      "Suppressionsanteil ca. {{Feld:Prozent=50}} %, Bursts von {{Feld:Sekunden=2}} Sekunden Dauer."),
    p("ko_koma", "kontinuitaet", false,
      aw("Muster", "Alpha-Koma|Theta-Koma|Spindel-Koma") + "-Muster."),
    // ---- Status epilepticus -------------------------------------------
    p("se_salzburg", "se", true,
      "Salzburg-Kriterien eines nonkonvulsiven Status epilepticus: " +
      aw("Ergebnis", "nicht erfüllt|erfüllt (epileptiforme Entladungen über 2,5/s während mindestens 10 s)|erfüllt (Entladungen unter 2,5/s bzw. rhythmische Aktivität über 0,5/s, mit EEG- und klinischer Besserung auf i.v. Antikonvulsivum)|erfüllt (Entladungen unter 2,5/s bzw. rhythmische Aktivität über 0,5/s, mit subtilen iktalen klinischen Phänomenen)|erfüllt (Entladungen unter 2,5/s bzw. rhythmische Aktivität über 0,5/s, mit typischer räumlich-zeitlicher Evolution)|möglicher NCSE (EEG-Besserung ohne klinische Besserung; iktal-interiktales Kontinuum)") + "."),
    p("se_testgabe", "se", false,
      "Testgabe von {{Feld:Substanz=Midazolam 2 mg i.v.}} um {{Feld:Uhrzeit}} Uhr: " +
      aw("Effekt", "EEG- und klinische Besserung|EEG-Besserung ohne klinische Besserung|ohne Effekt") + "."),
    p("se_acns", "se", false,
      "ACNS-Zeitkriterium eines elektrographischen Status erfüllt (mindestens 10 Minuten kontinuierlich bzw. 20 % einer Ableitungsstunde)."),
    // ---- Normvarianten ------------------------------------------------
    p("nv_variante", "normvarianten", true,
      aw("Variante", "Mu-Rhythmus zentral, blockiert durch Bewegung|Lambda-Wellen okzipital|POSTS|Wicket-Spikes temporal|BETS (benigne epileptiforme Transienten des Schlafs, small sharp spikes)|RMTD (rhythmische mitteltemporale Theta-Aktivität)|14-und-6/s-positive Spitzen|6/s-Spike-Wave (Phantom-Spike-Wave)|SREDA") +
      aw("Seite", "| links| rechts| bds.") +
      " — einer Normvariante ohne pathologische Bedeutung entsprechend."),
    // ---- Knochenlücke -------------------------------------------------
    p("kl_breach", "knochenluecke", true,
      "Breach-Rhythmus über der Knochenlücke " + aw("Ort", ORT) + " " + aw("Seite", SEITE) +
      ": amplitudenerhöhte, teils steiler konfigurierte Aktivität — dort nicht sicher als epilepsietypisch zu werten."),
    // ---- Klinische Ereignisse -----------------------------------------
    p("er_ereignis", "ereignisse", true,
      "Ereignis um {{Feld:Uhrzeit}} Uhr: {{Feld:Klinik}} — " +
      aw("Korrelat", "ohne begleitende elektroenzephalographische Veränderungen|mit begleitenden elektroenzephalographischen Veränderungen wie oben beschrieben") + "."),
    p("er_funktionell", "ereignisse", false,
      "In den Sekunden vor, zu Beginn und während der Episode keine erklärenden elektroenzephalographischen Veränderungen."),
    // ---- Beurteilung (Zusatz-Sätze — der Kern entsteht automatisch) ---
    p("beu_sedierung", "beurteilung", true,
      "Unter der laufenden Sedierung mit {{Feld:Sedation=Propofol}} zu interpretieren."),
    p("beu_vergleich", "beurteilung", true,
      "Im Vergleich zum Vor-EEG vom {{Feld:Datum}} " +
      aw("Verlauf", "unverändert|gebessert|verschlechtert") + "."),
    p("beu_empfehlung", "beurteilung", true,
      aw("Empfehlung", "Verlaufs-EEG|Langzeit-EEG|Nachtschlaf-EEG") + " empfohlen.")
  ];

  // Die beiden Start-Vorlagen. punkte = angekreuzt, zusatz = sichtbar
  // und nicht angewählt (☆), werte = NUR Auswahl-Vorwahlen je Punkt
  // (nie Feld-Werte — Grundsatz 1). Die Kern-Beurteilung entsteht
  // automatisch aus dem Befund und steht darum in keiner Vorlage.
  function vorlagen() {
    return [
      { id: "v_eeg", name: "Normal", kuerzel: "eeg",
        punkte: ["abl_satz", "ga_grundrhythmus", "ga_blockade",
                 "vig_haupt", "vl_keine", "ent_keine", "hv_haupt",
                 "ps_haupt", "ekg_haupt"],
        zusatz: ["ga_beta", "vl_irda", "nv_variante", "kl_breach"],
        werte: {} },
      { id: "v_eegips", name: "IPS", kuerzel: "eegips",
        punkte: ["abl_satz", "abl_sed", "art_augen", "art_muskel",
                 "art_50hz", "art_pflege", "ga_diffus", "ga_amplitude",
                 "vig_ips", "vl_keine", "ent_keine", "re_reakt", "ko_kont",
                 "ekg_haupt", "beu_sedierung"],
        zusatz: ["am_episode", "am_evolution", "am_korrelat",
                 "am_reagibilitaet", "mu_lpd", "mu_gpd", "mu_bipd",
                 "mu_lrda", "mu_grda", "mu_praevalenz", "mu_iic",
                 "ko_burst", "ko_koma", "se_salzburg", "se_testgabe",
                 "se_acns", "er_ereignis"],
        werte: { abl_satz: { "Montage": "10/20-Ableitung",
                             "Bedingungen": "im Bett auf der Intensivstation",
                             "Patient": "somnolent" } } }
    ];
  }

  // 16.1 hat den Katalog umgebaut (Schnell-Befund): stand-Wechsel löst
  // in eeg.js den einmaligen Vollersatz aus (eigene Punkte mit
  // id-Anfang "eig" überleben ihn).
  var KATALOG_STAND = "2026-10-02e";

  function master() {
    return { stand: KATALOG_STAND,
             kategorien: JSON.parse(JSON.stringify(KATEGORIEN)),
             punkte: JSON.parse(JSON.stringify(PUNKTE)) };
  }

  return { master: master, vorlagen: vorlagen,
           KATALOG_STAND: KATALOG_STAND, REGELN: REGELN };
})();
