// Datei: selbsttest-abloesung.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die Selbsttest-Fälle der Erweiterungs-Ablösung 18.26: die
//        MRI-Anmeldung (mri-anmeldung.js — Formular-Erkennung aller
//        vier Anbieter, Standort per ☒, Patientenfelder, Betreff und
//        Mail-Text) und die Patienten-Kette (pat-kette.js — Zerlegen
//        der Axenita-Kopie, Excel-Zeile). Alle Daten sind ERFUNDEN
//        (Muster/Probemann/Probefrau) — nie echte Patienten in Tests.
//        Wird von selbsttest.js als Gruppe „Ablösung 18.26" gerufen;
//        eigene Datei, weil selbsttest.js schon sehr gross ist.

"use strict";
window.TB = window.TB || {};

TB.selbsttestAbloesung = function () {
  var f = [];
  function fall(name, ok, detail) { f.push({ name: name, ok: !!ok, detail: detail || "" }); }

  try {
    var R = TB.mriRein, P = TB.patRein;

    // ---- Normalform: fremde Leerzeichen und Kästchen-Zeichen ----------
    fall("MRI: geschützte Leerzeichen und ☑ werden eingenordet",
      R.normal("MRI Stadelhofen ☑") === "MRI Stadelhofen " + R.KREUZ,
      R.normal("MRI Stadelhofen ☑"));

    // ---- Formular-Erkennung (erfundene Formular-Rümpfe) ---------------
    var mriText = "Medizinisch Radiologisches Institut\n" +
      "MRI Bahnhofsplatz\nMRI Stadelhofen " + R.KREUZ + "\n" +
      "Name:\tProbemann\nGeb.-Datum:\t04.04.1944\nGeschl.:\tmännlich\n" +
      "Bitte Voruntersuchungen mitbringen";
    var e1 = R.zerlege(mriText);
    fall("MRI-Formular erkannt, ☒ Stadelhofen = Empfänger 4",
      e1.anbieter === "mri" && e1.empfaenger === 4,
      e1.anbieter + "/" + e1.empfaenger);
    fall("MRI-Formular: Nachname, Geburtsdatum, Geschlecht gelesen",
      e1.nachname === "Probemann" && e1.geb === "04.04.1944" && e1.geschlecht === "Herr",
      e1.nachname + "/" + e1.geb + "/" + e1.geschlecht);

    var eIr = R.zerlege("SZINTI\n" + R.KREUZ + " MRI IR Bahnhof Oerlikon\n");
    fall("MRI: „IR Bahnhof Oerlikon“ wird nicht mit „Bahnhof Oerlikon“ verwechselt",
      eIr.empfaenger === 1, String(eIr.empfaenger));

    var e2 = R.zerlege("Anmeldung\nStandorte Wallisellen und Stettbach\nPraxis-Standort Wunsch\n");
    fall("RNR erkannt, eine Adresse (Empfänger 6)",
      e2.anbieter === "rnr" && e2.empfaenger === 6, e2.anbieter + "/" + e2.empfaenger);

    var e3 = R.zerlege("Radiologie Hirslanden\n☐ Klinik Hirslanden " +
      R.KREUZ + " Klinik Im Park\nPATIENTEN-INFORMATIONEN\nKlinik Im Park nochmals");
    fall("Hirslanden: ☒ im Kopf entscheidet — Im Park (Empfänger 8)",
      e3.anbieter === "hirslanden" && e3.empfaenger === 8, e3.anbieter + "/" + e3.empfaenger);
    var e3b = R.zerlege("Radiologie Hirslanden\nPATIENTEN-INFORMATIONEN\n");
    fall("Hirslanden ohne Kreuz: Vorgabe Klinik Hirslanden (Empfänger 7)",
      e3b.empfaenger === 7, String(e3b.empfaenger));

    var e4 = R.zerlege("Anmeldung Upright / offenes MRI\n");
    fall("RIMED erkannt, Vorgabe Altstetten (Empfänger 9)",
      e4.anbieter === "rimed" && e4.empfaenger === 9, e4.anbieter + "/" + e4.empfaenger);

    var e5 = R.zerlege("Irgendein ganz anderes Blatt\n");
    fall("Unbekanntes Formular: kein Anbieter, kein Empfänger",
      e5.anbieter === "" && e5.empfaenger === 0, e5.anbieter + "/" + e5.empfaenger);

    // Die ERSTE Name-Beschriftung entscheidet — ist ihre Zelle leer,
    // bleibt das Feld leer (nicht den zuweisenden Arzt erwischen).
    var e6 = R.zerlege("mri-roentgen\nName:\t\nZuweiser\nName:\tDr. Probearzt\n");
    fall("Leere erste Name-Zelle bleibt leer (kein Arztname)",
      e6.nachname === "", e6.nachname);

    // ---- Betreff, Mail-Text, mailto -----------------------------------
    fall("Betreff: „MRI-Anmeldung Frau Probefrau, geb. 01.01.1950\"",
      R.betreff("Frau", "Probefrau", "01.01.1950") ===
        "MRI-Anmeldung Frau Probefrau, geb. 01.01.1950");
    var ru = R.rumpf("Herrn", "Probemann");
    fall("Mail-Text: Anrede, Satz und Signatur",
      ru.indexOf("Herrn Probemann zum MRI anmelden") !== -1 &&
      ru.indexOf("Praxis Neuromed") !== -1 &&
      ru.indexOf("Freundliche Grüsse") !== -1);
    var mu = R.mailtoUrl("a-sth@mri-roentgen.ch", "Betreff ä", "Zeile 1\r\nZeile 2");
    fall("mailto-Adresse: Empfänger, Betreff und Text kodiert",
      mu.indexOf("mailto:a-sth@mri-roentgen.ch?subject=") === 0 &&
      mu.indexOf("%C3%A4") !== -1 && mu.indexOf("%0D%0A") !== -1, mu.slice(0, 60));
    fall("Empfänger-Liste: 12 Adressen, Nummer 4 = Stadelhofen",
      R.EMPFAENGER.length === 12 && R.mailAdresse(4) === "a-sth@mri-roentgen.ch");

    // ---- Patienten-Kette ;;pat ----------------------------------------
    var kopie = "Probemann Hans, Männlich\n01.01.1960 (66 J)\nTelefon\nAdresse\n" +
      "Musterweg 1\n8000 Zürich (ZH)\nSchweiz\n";
    var p1 = P.zerlege(kopie);
    fall(";;pat: Name, Geburtsdatum, Strasse und Ort aus der Axenita-Kopie",
      p1.name === "Probemann Hans" && p1.geb === "01.01.1960" &&
      p1.strasse === "Musterweg 1" && p1.ort === "8000 Zürich",
      JSON.stringify(p1));
    fall(";;pat: die Kette ist die Excel-Zeile mit Kommas",
      P.kette(p1) === "Probemann Hans, 01.01.1960, Musterweg 1, 8000 Zürich",
      P.kette(p1));
    var p2 = P.zerlege("Probefrau Erika, Weiblich\n02.02.1950\n");
    fall(";;pat ohne Adresse: Kette bleibt kürzer",
      P.kette(p2) === "Probefrau Erika, 02.02.1950", P.kette(p2));
    var p3 = P.zerlege("Nur irgendein Text ohne Patient\n");
    fall(";;pat: ohne Patientenangaben bleibt alles leer",
      p3.name === "" && p3.geb === "");

    // ---- Verankerung in der App ---------------------------------------
    fall("Fenster und Handgriff sind geladen (ansicht-mri.js, pat-kette.js)",
      !!(TB.ansichtMri && TB.ansichtMri.oeffne) &&
      !!(TB.patKette && TB.patKette.starten));
    var traeger = (TB.kisunlaUmbau && TB.kisunlaUmbau.neu || []);
    var tMri = traeger.filter(function (b) { return b.kuerzel === "mri"; })[0];
    var tPat = traeger.filter(function (b) { return b.kuerzel === "pat"; })[0];
    fall("Träger-Bausteine ;;mri und ;;pat liegen im Umbau (Kategorie Werkzeuge)",
      !!tMri && !!tPat && tMri.kategorie === "Werkzeuge" && tPat.kategorie === "Werkzeuge");
    fall("Texte des MRI-Fensters vollständig",
      !!(TB.mriTexte && TB.mriTexte.titel && TB.mriTexte.anredeFehlt &&
         TB.mriTexte.unbekannt && TB.mriTexte.geoeffnet) &&
      !!(TB.patTexte && TB.patTexte.fertig && TB.patTexte.nichtErkannt));
  } catch (e) {
    fall("Ablösungs-Prüfungen liefen durch", false, String(e && e.message || e));
  }
  return f;
};
