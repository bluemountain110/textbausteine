// Datei: einstellungen.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die Vorgabewerte und der bequeme Zugriff auf alle
//        Einstellungen: Anzeigename der App, Datumsformat und die
//        eigenen Konstanten (im Baustein als {{Name}} verwendbar).
//        Gespeichert wird über die Speicher-Schnittstelle.

"use strict";
window.TB = window.TB || {};

TB.einstellungen = (function () {
  var S = function () { return TB.speicher; };

  function anzeigename() { return S().einstellung("anzeigename", "Bausteine"); }
  function setzeAnzeigename(w) { S().setzeEinstellung("anzeigename", (w || "Bausteine").trim() || "Bausteine"); }

  function datumsformat() { return S().einstellung("datumsformat", "TT.MM.JJJJ"); }
  function setzeDatumsformat(w) { S().setzeEinstellung("datumsformat", (w || "TT.MM.JJJJ").trim() || "TT.MM.JJJJ"); }

  // Konstanten: { Name: Wert } — Vorgabe: ein leerer "Untersucher".
  function konstanten() {
    var k = S().einstellung("konstanten", null);
    if (!k || typeof k !== "object") { k = { "Untersucher": "" }; }
    return k;
  }
  function setzeKonstante(name, wert) {
    var k = konstanten(); k[name] = wert;
    S().setzeEinstellung("konstanten", k);
  }
  function entferneKonstante(name) {
    var k = konstanten(); delete k[name];
    S().setzeEinstellung("konstanten", k);
  }

  // Die Umgebung, die der Makro-Auswerter überall bekommt.
  function makroUmgebung() {
    return {
      datumsformat: datumsformat(),
      konstanten: konstanten(),
      holeBaustein: function (kuerzel) { return S().holenPerKuerzel(kuerzel); }
    };
  }

  return { anzeigename: anzeigename, setzeAnzeigename: setzeAnzeigename,
           datumsformat: datumsformat, setzeDatumsformat: setzeDatumsformat,
           konstanten: konstanten, setzeKonstante: setzeKonstante,
           entferneKonstante: entferneKonstante, makroUmgebung: makroUmgebung };
})();
