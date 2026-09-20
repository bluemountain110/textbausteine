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

  // ---- Zwischenspeicher-Kürzel (Etappe 4, Feinschliff 20.9.) --------
  // Die neun Fächer des Windows-Skripts werden über Kürzel bedient:
  // ;;c1 bis ;;c9 kopiert die Zwischenablage IN ein Fach (wie Strg+C),
  // ;;v1 bis ;;v9 setzt sie von dort ein (wie Strg+V). Den Buchstaben
  // davor bestimmt Näd selbst; die Ziffer bleibt.
  function fachStammMerken() {
    return String(S().einstellung("fachStammMerken", "c") || "c").trim().toLowerCase();
  }
  function setzeFachStammMerken(w) {
    S().setzeEinstellung("fachStammMerken", saubererStamm(w, "c"));
  }
  function fachStammEinsetzen() {
    return String(S().einstellung("fachStammEinsetzen", "v") || "v").trim().toLowerCase();
  }
  function setzeFachStammEinsetzen(w) {
    S().setzeEinstellung("fachStammEinsetzen", saubererStamm(w, "v"));
  }
  // Nur Buchstaben, kein Strichpunkt, keine Ziffer am Schluss — sonst
  // liesse sich ;;c11 nicht mehr von ;;c1 unterscheiden.
  function saubererStamm(w, vorgabe) {
    var s = String(w || "").trim().toLowerCase().replace(/[^a-zäöü]/g, "");
    return s || vorgabe;
  }
  // Die Tastenkombination als zweiter Weg zum Merken (ohne ;;c).
  // Gespeichert als Kürzel des Skripts: "^!" = Strg+Alt, "^+" = Strg+Umschalt,
  // "" = ausgeschaltet.
  function fachTasten() { return S().einstellung("fachTasten", "^!"); }
  function setzeFachTasten(w) { S().setzeEinstellung("fachTasten", w || ""); }

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
           entferneKonstante: entferneKonstante, makroUmgebung: makroUmgebung,
           fachStammMerken: fachStammMerken, setzeFachStammMerken: setzeFachStammMerken,
           fachStammEinsetzen: fachStammEinsetzen, setzeFachStammEinsetzen: setzeFachStammEinsetzen,
           fachTasten: fachTasten, setzeFachTasten: setzeFachTasten };
})();
