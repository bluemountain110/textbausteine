// Datei: normwerte-grundlage.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die Grundausstattung der ENMG-Normwerte als reine DATEN —
//        Näds Grenzwert-Tabellen (kontrolliert von Näd am 8.10.2026,
//        inkl. der Lesekorrektur 38.8 beim Medianus, Alter 65).
//        NLG und Amplituden sind UNTERE Grenzen (richtung "min":
//        gemessener Wert darunter = rot), Latenzen und F-Wellen OBERE
//        Grenzen (richtung "max": darüber = rot). Werte-Reihen laufen
//        über die Alters-Stützstellen 20–80 in 5er-Schritten; dazwischen
//        wird linear gerechnet (enmg.js). Beim Radialis superficialis
//        gibt die Quelle Mittel ± SD und einen Bereich an — als Grenze
//        gilt die untere Bereichsgrenze (47 bzw. 12−6 = 6), in der
//        Pflege änderbar. "schluessel" ordnet Geräte-Segmentnamen den
//        Normzeilen zu; passt kein Schlüssel, gilt die Reihenfolge
//        distal → proximal ("reihe"). FACHREGEL: Diese Zahlen stammen
//        von Näd, nie aus Claudes Gedächtnis.

"use strict";
window.TB = window.TB || {};

TB.normwerteGrundlage = (function () {
  var ALTER = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
  // Kurzschreiber: Zeile mit Alters-Reihe bzw. festem Grenzwert.
  function z(id, name, einheit, richtung, werte) {
    return { id: id, name: name, einheit: einheit, richtung: richtung,
             werte: werte };
  }
  function f(id, name, einheit, richtung, wert) {
    return { id: id, name: name, einheit: einheit, richtung: richtung,
             fest: wert };
  }

  var nerven = [
    {
      id: "medianus", name: "N. medianus", erkennen: ["median"],
      zeilen: [
        z("dml", "dist. motor. Latenz", "ms", "max",
          [3.85, 3.88, 3.9, 3.92, 3.94, 3.96, 3.98, 4.0, 4.02, 4.04, 4.06, 4.08, 4.1]),
        z("va", "motor. Vorderarm (VA)", "m/s", "min",
          [53.2, 52.1, 50.9, 49.7, 48.6, 47.5, 46.3, 45.2, 44, 42.9, 41.7, 40.6, 39.4]),
        z("oa", "motor. Oberarm (OA)", "m/s", "min",
          [53.2, 52.1, 50.9, 49.8, 48.7, 47.5, 46.4, 45.3, 44.1, 43, 41.8, 40.7, 39.5]),
        z("sdistnlg", "sens. orthodr. dist. NLG", "m/s", "min",
          [47.2, 46.3, 45.4, 44.4, 43.5, 42.6, 41.7, 40.7, 39.8, 38.8, 38, 37, 36]),
        z("sdistamp", "sens. orthodr. dist. AMP", "µV", "min",
          [6.3, 6, 5.6, 5.3, 5, 4.7, 4.5, 4.2, 4, 3.8, 3.5, 3.3, 3.1]),
        z("santidist", "sens. antidr. distal", "m/s", "min",
          [56.3, 54.8, 53.3, 51.8, 50.3, 48.8, 47.3, 45.8, 44.3, 42.8, 41.3, 39.8, 38.3]),
        z("santiva", "sens. antidr. VA", "m/s", "min",
          [59.1, 57.5, 55.9, 54.3, 52.7, 51.1, 49.5, 47.9, 46.3, 44.7, 43.1, 41.5, 39.9]),
        f("fwhg", "F-W. Latenz Handgelenk", "ms", "max", 31),
        f("fwellb", "F-W. Latenz Ellbogen", "ms", "max", 27)
      ],
      motor: { latenz: "dml", nlgReihe: ["va", "oa"],
               schluessel: { va: ["vorderarm"], oa: ["axilla", "oberarm"] },
               f: ["fwhg", "fwellb"] },
      sens: { nlgReihe: ["sdistnlg"], amp: "sdistamp",
              schluessel: { santidist: ["antidrom", "antidr"],
                            santiva: ["antidrom vorderarm"] } }
    },
    {
      id: "ulnaris", name: "N. ulnaris", erkennen: ["ulnar"],
      zeilen: [
        z("dml", "dist. motor. Latenz", "ms", "max",
          [3.0, 3.05, 3.1, 3.15, 3.2, 3.25, 3.3, 3.35, 3.4, 3.45, 3.5, 3.55, 3.6]),
        z("va", "motor. VA", "m/s", "min",
          [45.4, 45.1, 44.8, 44.5, 44.2, 43.9, 43.6, 43.3, 43.0, 42.7, 42.4, 42.1, 41.8]),
        z("sulcus", "motor. Sulcus", "m/s", "min",
          [40.0, 39.85, 39.7, 39.55, 39.4, 39.25, 39.1, 38.95, 38.8, 38.65, 38.5, 38.35, 38.2]),
        z("oa", "motor. OA", "m/s", "min",
          [47.1, 46.6, 46.1, 45.6, 45.1, 44.6, 44.1, 43.6, 43.1, 42.6, 42.1, 41.6, 41.1]),
        z("sdistamp", "sens. orthodr. dist. AMP", "µV", "min",
          [5.3, 5.1, 4.9, 4.7, 4.5, 4.3, 4.1, 4.0, 3.8, 3.6, 3.5, 3.3, 3.2]),
        z("sdistnlg", "sens. distal NLG", "m/s", "min",
          [40.8, 40.75, 40.7, 40.65, 40.6, 40.55, 40.5, 40.45, 40.4, 40.35, 40.3, 40.25, 40.2]),
        z("sva", "sens. Vorderarm", "m/s", "min",
          [56.0, 55.35, 54.7, 54.05, 53.4, 52.75, 52.1, 51.45, 50.8, 50.15, 49.5, 48.85, 48.2]),
        z("scubital", "sens. cubital", "m/s", "min",
          [44.2, 43.8, 43.4, 43.0, 42.6, 42.2, 41.8, 41.4, 41.0, 40.6, 40.2, 39.8, 39.4]),
        f("fwhg", "F-W. Latenz Handgelenk", "ms", "max", 32),
        f("fwellb", "F-W. Latenz Ellbogen", "ms", "max", 27)
      ],
      motor: { latenz: "dml", nlgReihe: ["va", "sulcus", "oa"],
               schluessel: { sulcus: ["sulcus"], oa: ["axilla", "oberarm"],
                             va: ["vorderarm"] },
               f: ["fwhg", "fwellb"] },
      sens: { nlgReihe: ["sdistnlg", "sva", "scubital"], amp: "sdistamp",
              schluessel: { sva: ["vorderarm"],
                            scubital: ["cubital", "ellenbogen", "ellbogen"] } }
    },
    {
      id: "radialis", name: "N. radialis superficialis", erkennen: ["radial"],
      zeilen: [
        f("sdistnlg", "sens. orthodr. dist. NLG (aus 56.3 ± 4.3, Bereich 47–64)",
          "m/s", "min", 47),
        f("sdistamp", "sens. orthodr. dist. AMP (aus 12 ± 6)", "µV", "min", 6)
      ],
      motor: null,
      sens: { nlgReihe: ["sdistnlg"], amp: "sdistamp", schluessel: {} }
    },
    {
      id: "suralis", name: "N. suralis", erkennen: ["sural"],
      zeilen: [
        z("snlg", "sens. orthodr. US NLG", "m/s", "min",
          [45.4, 45.1, 44.9, 44.6, 44.4, 44.1, 43.9, 43.6, 43.4, 43.1, 42.9, 42.6, 42.4]),
        z("samp", "sens. orthodr. US AMP", "µV", "min",
          [5.2, 4.9, 4.6, 4.4, 4.1, 3.9, 3.7, 3.5, 3.3, 3.1, 2.9, 2.7, 2.6])
      ],
      motor: null,
      sens: { nlgReihe: ["snlg"], amp: "samp", schluessel: {} }
    },
    {
      id: "peronaeus", name: "N. peronaeus", erkennen: ["peron", "fibul"],
      zeilen: [
        z("dml", "dist. motor. Latenz", "ms", "max",
          [4.65, 4.66, 4.66, 4.67, 4.68, 4.68, 4.69, 4.7, 4.7, 4.71, 4.71, 4.72, 4.72]),
        z("mus", "motor. US", "m/s", "min",
          [44.3, 44.1, 44, 43.8, 43.6, 43.5, 43.3, 43.1, 42.9, 42.8, 42.6, 42.4, 42.2]),
        z("mknie", "motor. Kniekehle", "m/s", "min",
          [42.9, 42.7, 42.4, 42.2, 41.9, 41.7, 41.5, 41.2, 41, 40.8, 40.5, 40.3, 40]),
        z("sus", "sens. US", "m/s", "min",
          [48.6, 48.2, 47.8, 47.4, 47, 46.6, 46.2, 45.8, 45.4, 45, 44.6, 44.2, 43.8]),
        z("sknie", "sens. Kniekehle", "m/s", "min",
          [47.9, 47.6, 47.3, 47, 46.7, 46.4, 46.1, 45.8, 45.5, 45.2, 44.9, 44.6, 44.3]),
        f("fwkn", "F-W. Latenz Knöchel", "ms", "max", 56)
      ],
      motor: { latenz: "dml", nlgReihe: ["mus", "mknie"],
               schluessel: { mknie: ["prox", "knie", "poplit"] },
               f: ["fwkn"] },
      sens: { nlgReihe: ["sus", "sknie"], amp: null,
              schluessel: { sknie: ["knie", "poplit", "prox"] } }
    },
    {
      id: "tibialis", name: "N. tibialis", erkennen: ["tibial"],
      zeilen: [
        z("dml", "dist. motor. Latenz", "ms", "max",
          [5.51, 5.51, 5.51, 5.51, 5.52, 5.52, 5.52, 5.52, 5.52, 5.53, 5.53, 5.53, 5.53]),
        z("mus", "motor. US", "m/s", "min",
          [43.3, 42.5, 41.7, 40.8, 40, 39.2, 38.3, 37.5, 36.7, 35.9, 35, 34.2, 33.4]),
        z("sdist", "sens. distal", "m/s", "min",
          [39, 38.65, 38.3, 37.95, 37.6, 37.25, 36.9, 36.55, 36.2, 35.85, 35.5, 35.15, 34.8]),
        z("sus", "sens. US", "m/s", "min",
          [49.8, 49.5, 49.2, 48.9, 48.6, 48.3, 48, 47.7, 47.4, 47.1, 46.8, 46.5, 46.2]),
        f("fwkn", "F-W. Latenz Knöchel", "ms", "max", 58)
      ],
      motor: { latenz: "dml", nlgReihe: ["mus"], schluessel: {},
               f: ["fwkn"] },
      sens: { nlgReihe: ["sdist", "sus"], amp: null,
              schluessel: { sus: ["knie", "unterschenkel", "poplit", "crural"] } }
    }
  ];

  return {
    stand: "2026-10-08",
    quelleVorgabe: "ENMG-Grenzwerttabellen (Quelle noch zu benennen)",
    bemerkung: "Geschwindigkeiten (m/s) und sensible Amplituden (µV) " +
      "werden auf ganze Zahlen gerundet; Latenzen (ms) und motorische " +
      "Amplituden (mV) auf eine Stelle hinter dem Komma.",
    alter: ALTER,
    nerven: nerven
  };
})();
