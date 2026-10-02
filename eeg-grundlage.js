// Datei: eeg-grundlage.js
// Projekt: Textbausteine — Teil: App (Browser) UND Chrome-Erweiterung
//          (byteweise Kopie — Prüfsuite: cmp)
// Zweck: Die Grundausstattung des EEG-Werks: alle Kategorien und
//        Punkte eines ausführlichen EEG-Befunds samt Beurteilung, dazu
//        die beiden Start-Vorlagen „Normal" (;;eeg) und „IPS"
//        (;;eegips). Diese Datei ist NUR die Erstbefüllung und der
//        Nachzieh-Stand — gearbeitet wird immer mit der Fassung in den
//        Einstellungen (eegMaster/eegVorlagen), die auf alle Geräte
//        synct. Jeder Punkt ist ein Satzbaustein mit {{Auswahl:…}}-
//        und {{Feld:…}}-Stellen (dieselbe Schreibweise wie die
//        Baustein-Makros); die ERSTE Auswahl ist immer der
//        Normalfall. Kategorien mit titel=true erscheinen im Befund
//        unterstrichen (der Doppelpunkt nicht); absatz=true setzt
//        davor eine Leerzeile. GRUNDSATZ: Vorlagen speichern nie
//        Feld-Werte oder überschriebene Texte — nichts mit
//        Patientenbezug verlässt je die Sitzung.

"use strict";
window.TB = window.TB || {};

TB.eegGrundlage = (function () {
  var SEITE = "links|rechts|bds.|bds. linksbetont|bds. rechtsbetont|bds. ohne eindeutige Seitenbetonung";
  var ORT = "frontotemporal|frontal|frontopolar|frontozentral|temporal|temporal anterior|temporal posterior|temporoparietal|temporookzipital|zentral|zentroparietal|parietal|parietookzipital|okzipital|hemisphäriell|bifrontal|bitemporal|bifrontotemporal|generalisiert|multifokal";
  function aw(label, liste) { return "{{Auswahl:" + label + ":" + liste + "}}"; }
  function p(id, kat, haeufig, text) {
    return { id: id, kategorie: kat, haeufig: !!haeufig, text: text };
  }

  var KATEGORIEN = [
    { id: "voreeg", name: "Vor-EEG", bereich: "befund", titel: false, absatz: false },
    { id: "ableitung", name: "Ableitung", bereich: "befund", titel: false, absatz: true },
    { id: "artefakte", name: "Artefakte", bereich: "befund", titel: false, absatz: true },
    { id: "grundaktivitaet", name: "Grundaktivität", bereich: "befund", titel: true, absatz: true },
    { id: "vigilanz", name: "Vigilanz", bereich: "befund", titel: true, absatz: false },
    { id: "verlangsamung", name: "Verlangsamungsherde", bereich: "befund", titel: true, absatz: false },
    { id: "entladungen", name: "Entladungen", bereich: "befund", titel: true, absatz: false },
    { id: "anfallsmuster", name: "Anfallsmuster", bereich: "befund", titel: true, absatz: false },
    { id: "muster", name: "Periodische und rhythmische Muster", bereich: "befund", titel: true, absatz: false },
    { id: "reaktivitaet", name: "Reaktivität", bereich: "befund", titel: true, absatz: false },
    { id: "kontinuitaet", name: "Kontinuität", bereich: "befund", titel: true, absatz: false },
    { id: "se", name: "Status epilepticus", bereich: "befund", titel: true, absatz: false },
    { id: "normvarianten", name: "Normvarianten", bereich: "befund", titel: true, absatz: false },
    { id: "knochenluecke", name: "Knochenlücke", bereich: "befund", titel: true, absatz: false },
    { id: "hyperventilation", name: "Hyperventilation", bereich: "befund", titel: true, absatz: true },
    { id: "photostimulation", name: "Photostimulation", bereich: "befund", titel: true, absatz: false },
    { id: "ereignisse", name: "Klinische Ereignisse", bereich: "befund", titel: true, absatz: true },
    { id: "ekg", name: "EKG", bereich: "befund", titel: true, absatz: true },
    { id: "beurteilung", name: "Beurteilung", bereich: "beurteilung", titel: false, absatz: false }
  ];

  var PUNKTE = [
    // ---- Vor-EEG ------------------------------------------------------
    p("ve_vor", "voreeg", false,
      "Vor-EEG vom {{Feld:Datum}}: {{Feld:Kurzbefund}}"),
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
      aw("Menge", "Wenig|Mässig viele|Viele|Keine") + " Lid- und Bulbusartefakte bds. frontal."),
    p("art_muskel", "artefakte", true,
      aw("Menge", "Wenig|Mässig viele|Viele|Keine") + " Muskelartefakte" +
      aw("Schwerpunkt", "| v. a. frontal| v. a. temporal| diffus") + "."),
    p("art_bewegung", "artefakte", false,
      aw("Menge", "Wiederholt|Viele") + " Bewegungsartefakte."),
    p("art_50hz", "artefakte", false,
      "50-Hz-Artefakte " + aw("Schwerpunkt", "diffus|über einzelnen Elektroden") + "."),
    p("art_pflege", "artefakte", false,
      "Beatmungs-, Pflege- und Lagerungsartefakte."),
    p("art_elektrode", "artefakte", false,
      "Elektrodenartefakt über {{Feld:Elektrode=F4}}."),
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
    p("ga_blockade", "grundaktivitaet", true,
      aw("Blockade", "Positive visuelle Blockade|Fehlende visuelle Blockade|Visuelle Blockade nicht beurteilbar (Augen nicht geöffnet)") + "."),
    p("ga_seitendifferenz", "grundaktivitaet", false,
      "Seitendifferenz der Grundaktivität: {{Feld:Beschreibung=Amplitudenminderung links temporal}}."),
    p("ga_beta", "grundaktivitaet", false,
      aw("Grad", "Leicht|Deutlich") + " vermehrte Beta-Aktivität " +
      aw("Schwerpunkt", "frontal|über den hinteren Hirnarealen|diffus") + ", a. e. " +
      aw("Ursache", "bei fehlender Entspannung|medikamentös (Benzodiazepine)|medikamentös (Propofol)") + "."),
    p("ga_av", "grundaktivitaet", false,
      aw("Grad", "Leichte|Mässiggradige|Schwere") +
      " Allgemeinveränderung mit diffuser Verlangsamung der Grundaktivität in den " +
      aw("Band", "Theta-|Theta-/Delta-|Delta-") + "Bereich."),
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
    p("vig_schlaf", "vigilanz", false,
      "Schlafstadium " + aw("Stadium", "N1 mit Vertexwellen|N2 mit Schlafspindeln und K-Komplexen|N3 mit hochgespannter Delta-Aktivität|REM") + " erreicht."),
    p("vig_ips", "vigilanz", false,
      "Durchgehend " + aw("Zustand", "somnolent|soporös|komatös") + ", keine Schlaf-Wach-Differenzierung abgrenzbar."),
    p("vig_spindeln", "vigilanz", false,
      "Schlafelemente (Spindeln) " + aw("Stand", "erhalten|nicht abgrenzbar") + "."),
    p("vig_posts", "vigilanz", false,
      "POSTS (positive okzipitale scharfe Transienten des Schlafs)."),
    p("vig_arousal", "vigilanz", false,
      "Arousals " + aw("Auslöser", "spontan|auf Reiz") + "."),
    // ---- Verlangsamungsherde ------------------------------------------
    p("vl_keine", "verlangsamung", true, "keine."),
    p("vl_wellen", "verlangsamung", true,
      aw("Häufigkeit", "Wiederholt eingelagerte|Vereinzelt eingelagerte|Gehäufte|Intermittierende|Subkontinuierliche|Kontinuierliche") +
      " Wellen aus dem " + aw("Band", "Theta-Band|Delta-Band|Theta- und Delta-Band|Subdelta-Band") +
      " " + aw("Ort", ORT) + " " + aw("Seite", SEITE) + "."),
    p("vl_polymorph", "verlangsamung", false,
      aw("Häufigkeit", "Intermittierende|Kontinuierliche") + " polymorphe Delta-Aktivität " +
      aw("Ort", ORT) + " " + aw("Seite", SEITE) + "."),
    p("vl_ausbreitung", "verlangsamung", false,
      "Mit Ausbreitung nach {{Feld:Richtung=parietal}}."),
    p("vl_irda", "verlangsamung", false,
      aw("Art", "FIRDA (frontal intermittierende rhythmische Delta-Aktivität)|OIRDA (okzipital intermittierende rhythmische Delta-Aktivität)|TIRDA (temporal intermittierende rhythmische Delta-Aktivität)") +
      aw("Seite", "| links| rechts| bds.") + "."),
    p("vl_steil", "verlangsamung", false,
      aw("Häufigkeit", "Vereinzelt|Wiederholt") + " eingelagerte steilere Transienten " +
      aw("Ort", ORT) + " " + aw("Seite", SEITE) +
      ", die Kriterien für epilepsietypische Potenziale jedoch nicht vollständig erfüllt."),
    // ---- Entladungen --------------------------------------------------
    p("ent_keine", "entladungen", true, "keine."),
    p("ent_etp", "entladungen", true,
      aw("Häufigkeit", "Vereinzelte|Wiederholte|Gehäufte") + " " +
      aw("Form", "Sharp Waves|Spikes|Spike-Wave-Komplexe|Sharp-Wave-Komplexe|Polyspikes|Polyspike-Wave-Komplexe|Sharp-Slow-Wave-Komplexe") +
      " " + aw("Ort", ORT) + " " + aw("Seite", SEITE) +
      ", Amplitudenmaximum über {{Feld:Elektrode=F4}}."),
    p("ent_gen", "entladungen", false,
      aw("Häufigkeit", "Vereinzelte|Wiederholte") + " generalisierte " +
      aw("Form", "3/s Spike-Wave-Komplexe|4–5/s Spike-Wave-Komplexe|atypische, langsame Spike-Wave-Komplexe (unter 2,5/s)|Polyspike-Wave-Komplexe") + "."),
    p("ent_aktivierung", "entladungen", false,
      "Aktivierung durch " + aw("Auslöser", "Hyperventilation|Photostimulation|Schläfrigkeit und Schlaf") + "."),
    p("ent_zaehlung", "entladungen", false,
      "Während {{Feld:Minuten=14}} Minuten insgesamt {{Feld:Anzahl=8}} derartige Episoden, maximale Dauer {{Feld:Sekunden=2,5}} Sekunden."),
    // ---- Anfallsmuster ------------------------------------------------
    p("am_episode", "anfallsmuster", true,
      "Episode mit rhythmischer " + aw("Band", "Theta-|Delta-|Alpha-|Spike-Wave-") +
      "Aktivität um {{Feld:Frequenz=2,5}}/s, Beginn " + aw("Ort", ORT) + " " + aw("Seite", SEITE) +
      " um {{Feld:Uhrzeit}} Uhr, Dauer {{Feld:Dauer=26}} Sekunden."),
    p("am_evolution", "anfallsmuster", false,
      "Mit " + aw("Evolution", "räumlicher und zeitlicher Evolution|räumlicher Evolution (Ausweitung)|zeitlicher Evolution (Frequenz und Amplitude)|fehlender Evolution") + "."),
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
    // ---- Hyperventilation ---------------------------------------------
    p("hv_haupt", "hyperventilation", true,
      aw("Ergebnis", "keine neuen Aspekte|Zunahme der Verlangsamung|Provokation epilepsietypischer Potenziale|physiologische diffuse Verlangsamung, rasch rückläufig|nicht durchgeführt (fehlende Kooperation)|nicht durchgeführt (Kontraindikation)|nicht durchgeführt") + "."),
    // ---- Photostimulation ---------------------------------------------
    p("ps_haupt", "photostimulation", true,
      aw("Ergebnis", "keine neuen Aspekte|partielles photic driving|deutliches photic driving|nicht durchgeführt") + "."),
    p("ps_ppr", "photostimulation", false,
      "Photoparoxysmale Reaktion, " + aw("Ausdehnung", "okzipital begrenzt|generalisiert") + ", " +
      aw("Verlauf", "selbstlimitierend|die Stimulation überdauernd") + ", bei {{Feld:Frequenz=15}} Hz."),
    p("ps_pmr", "photostimulation", false, "Photomyogene Reaktion."),
    // ---- Klinische Ereignisse -----------------------------------------
    p("er_ereignis", "ereignisse", true,
      "Ereignis um {{Feld:Uhrzeit}} Uhr: {{Feld:Klinik}} — " +
      aw("Korrelat", "ohne begleitende elektroenzephalographische Veränderungen|mit begleitenden elektroenzephalographischen Veränderungen wie oben beschrieben") + "."),
    p("er_funktionell", "ereignisse", false,
      "In den Sekunden vor, zu Beginn und während der Episode keine erklärenden elektroenzephalographischen Veränderungen."),
    // ---- EKG ----------------------------------------------------------
    p("ekg_haupt", "ekg", true,
      aw("Befund", "normokarder Sinusrhythmus|normofrequenter Sinusrhythmus|Sinusbradykardie|Sinustachykardie|absolute Arrhythmie, a. e. bei Vorhofflimmern|vereinzelte Extrasystolen") + "."),
    p("ekg_pause", "ekg", false,
      "Pause von {{Feld:Sekunden=3}} s um {{Feld:Uhrzeit}} Uhr — Rückmeldung an die Behandler erfolgt."),
    // ---- Beurteilung --------------------------------------------------
    p("beu_normal", "beurteilung", true, "Normaler Grundrhythmus."),
    p("beu_av", "beurteilung", true,
      aw("Grad", "Leichte|Mässiggradige|Schwere") + " Allgemeinveränderung."),
    p("beu_herd_keine", "beurteilung", true, "Keine Verlangsamungsherde."),
    p("beu_herd", "beurteilung", true,
      aw("Häufigkeit", "Intermittierend|Kontinuierlich") + " " +
      aw("Grad", "leichtgradiger|mässiggradiger|schwergradiger") + " Herdbefund " +
      aw("Ort", ORT) + " " + aw("Seite", SEITE) + "."),
    p("beu_etp_keine", "beurteilung", true, "Keine epilepsietypischen Potentiale."),
    p("beu_etp", "beurteilung", true,
      aw("Häufigkeit", "Vereinzelte|Wiederholte|Gehäufte") + " epilepsietypische Potentiale " +
      aw("Ort", ORT) + " " + aw("Seite", SEITE) + "."),
    p("beu_anfall_kein", "beurteilung", false, "Kein Anfallsablauf."),
    p("beu_anfall", "beurteilung", false,
      "Aufzeichnung von {{Feld:Anzahl=1}} Anfallsabläufen, " +
      aw("Korrelat", "subklinisch|mit klinischem Korrelat") + "."),
    p("beu_ncse", "beurteilung", false,
      "Die Salzburg-Kriterien eines nonkonvulsiven Status epilepticus sind " +
      aw("Ergebnis", "nicht erfüllt|erfüllt") + "."),
    p("beu_ncse_moeglich", "beurteilung", false,
      "Befund vereinbar mit einem möglichen NCSE (iktal-interiktales Kontinuum) — Verlaufs-EEG bzw. Therapieversuch empfohlen."),
    p("beu_koma", "beurteilung", false,
      aw("Muster", "Schwere diffuse Funktionsstörung|Burst-Suppression-Muster") + " " +
      aw("Reaktivität", "mit erhaltener Reaktivität|ohne erhaltene Reaktivität") + "."),
    p("beu_sedierung", "beurteilung", false,
      "Unter der laufenden Sedierung mit {{Feld:Sedation=Propofol}} zu interpretieren."),
    p("beu_beta", "beurteilung", false,
      "Leicht vermehrte Beta-Aktivität, a. e. bei " +
      aw("Ursache", "fehlender Entspannung|Benzodiazepin-Medikation") + ". Zeichen der Schläfrigkeit."),
    p("beu_funktionell", "beurteilung", false,
      "Aufzeichnung eines funktionellen Anfalls" +
      aw("Kontext", "| im Zuge der Photostimulation") + "."),
    p("beu_vergleich", "beurteilung", false,
      "Im Vergleich zum Vor-EEG vom {{Feld:Datum}} " +
      aw("Verlauf", "unverändert|gebessert|verschlechtert") + "."),
    p("beu_empfehlung", "beurteilung", false,
      aw("Empfehlung", "Verlaufs-EEG|Langzeit-EEG|Nachtschlaf-EEG") + " empfohlen.")
  ];

  // Die beiden Start-Vorlagen. punkte = angekreuzt, zusatz = sichtbar
  // und nicht angewählt (☆), werte = NUR Auswahl-Vorwahlen je Punkt
  // (nie Feld-Werte — Grundsatz 1).
  function vorlagen() {
    return [
      { id: "v_eeg", name: "Normal", kuerzel: "eeg",
        punkte: ["abl_satz", "art_augen", "art_muskel", "ga_grundrhythmus",
                 "ga_blockade", "vig_haupt", "vl_keine", "ent_keine",
                 "hv_haupt", "ps_haupt", "ekg_haupt",
                 "beu_normal", "beu_herd_keine", "beu_etp_keine"],
        zusatz: ["ga_beta", "ga_av", "vl_wellen", "vl_irda", "ent_etp",
                 "ent_gen", "ps_ppr", "er_ereignis", "nv_variante",
                 "kl_breach", "beu_av", "beu_herd", "beu_etp", "beu_beta",
                 "beu_funktionell", "beu_vergleich", "beu_empfehlung"],
        werte: {} },
      { id: "v_eegips", name: "IPS", kuerzel: "eegips",
        punkte: ["abl_satz", "abl_sed", "art_augen", "art_muskel",
                 "art_50hz", "art_pflege", "ga_diffus", "ga_amplitude",
                 "vig_ips", "vl_keine", "ent_keine", "re_reakt", "ko_kont",
                 "ekg_haupt", "beu_av", "beu_etp_keine", "beu_sedierung"],
        zusatz: ["ga_av", "vl_polymorph", "vl_wellen", "ent_etp",
                 "am_episode", "am_evolution", "am_korrelat",
                 "am_reagibilitaet", "mu_lpd", "mu_gpd", "mu_bipd",
                 "mu_lrda", "mu_grda", "mu_praevalenz", "mu_iic",
                 "ko_burst", "ko_koma", "se_salzburg", "se_testgabe",
                 "se_acns", "er_ereignis", "beu_herd", "beu_etp",
                 "beu_ncse", "beu_ncse_moeglich", "beu_koma"],
        werte: { abl_satz: { "Montage": "10/20-Ableitung",
                             "Bedingungen": "im Bett auf der Intensivstation",
                             "Patient": "somnolent" } } }
    ];
  }

  var KATALOG_STAND = "2026-10-02";

  function master() {
    return { stand: KATALOG_STAND,
             kategorien: JSON.parse(JSON.stringify(KATEGORIEN)),
             punkte: JSON.parse(JSON.stringify(PUNKTE)) };
  }

  return { master: master, vorlagen: vorlagen, KATALOG_STAND: KATALOG_STAND };
})();
