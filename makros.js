// Datei: makros.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die Platzhalter-Sprache ({{Datum}}, {{Feld:…}}, {{Auswahl:…}},
//        Konstanten, {{Baustein:kürzel}}, {{Cursor}}). Hier wird ein
//        Bausteintext untersucht (welche Lücken fragt er ab?) und
//        ausgewertet (fertiger Text). App und späterer Kürzel-Export
//        (Etappe 3) benutzen DIESELBE Sprache aus dieser Datei.
//        Bei {{Auswahl:…}} trennt | ODER / die Möglichkeiten — / ist auf
//        jeder Tastatur leicht zu finden.

"use strict";
window.TB = window.TB || {};

TB.makros = (function () {

  var MUSTER = /\{\{([^{}]+)\}\}/g;

  function zerlege(inhalt) {
    // "Feld:Seite=rechts"  ->  { name:"Feld", rest:"Seite=rechts" }
    var doppelpunkt = inhalt.indexOf(":");
    if (doppelpunkt === -1) return { name: inhalt.trim(), rest: null };
    return { name: inhalt.slice(0, doppelpunkt).trim(),
             rest: inhalt.slice(doppelpunkt + 1) };
  }

  function zweiStellig(n) { return (n < 10 ? "0" : "") + n; }

  function formatiereDatum(d, format) {
    var f = format || "TT.MM.JJJJ";
    return f.replace(/JJJJ/g, String(d.getFullYear()))
            .replace(/JJ/g, String(d.getFullYear()).slice(-2))
            .replace(/MM/g, zweiStellig(d.getMonth() + 1))
            .replace(/TT/g, zweiStellig(d.getDate()));
  }
  function formatiereZeit(d) {
    return zweiStellig(d.getHours()) + ":" + zweiStellig(d.getMinutes());
  }

  // Untersuchen: Welche Lücken (Feld/Auswahl) fragt der Text ab?
  // Gleiche Beschriftung mehrfach -> EINMAL fragen. Liefert auch
  // Schreibweisen-Fehler für die Live-Prüfung beim Bearbeiten.
  function analysiere(text, umgebung) {
    var u = umgebung || {};
    var konstanten = u.konstanten || {};
    var luecken = [], fehler = [], gesehen = {};
    var m;
    MUSTER.lastIndex = 0;
    while ((m = MUSTER.exec(text || "")) !== null) {
      var t = zerlege(m[1]);
      var name = t.name;
      if (/^Datum([+-]\d+)?$/.test(name) || name === "Zeit" ||
          name === "Cursor") continue;
      // Etappe 8: Die Masken-Platzhalter gehören masken.js — hier
      // zählen sie nur als BEKANNT, damit die Prüfung nicht anschlägt.
      // Ihre eigene Prüfung (Paarigkeit usw.) macht TB.masken.
      if (name === "Ankreuz" || name === "Wenn" || name === "WennNicht" ||
          name === "Ende" || name === "Aus Kategorie" || name === "Sprung") continue;
      if (name === "Feld" || name === "Auswahl") {
        if (t.rest === null || t.rest.trim() === "") {
          fehler.push("{{" + m[1] + "}}: Beschriftung fehlt"); continue;
        }
        if (name === "Feld") {
          var gleich = t.rest.indexOf("=");
          var beschriftung = (gleich === -1 ? t.rest : t.rest.slice(0, gleich)).trim();
          var vorgabe = gleich === -1 ? "" : t.rest.slice(gleich + 1);
          if (!beschriftung) { fehler.push("{{" + m[1] + "}}: Beschriftung fehlt"); continue; }
          if (!gesehen[beschriftung]) {
            gesehen[beschriftung] = true;
            luecken.push({ art: "feld", beschriftung: beschriftung, vorgabe: vorgabe });
          }
        } else {
          var teile = t.rest.split(":");
          var b2 = (teile[0] || "").trim();
          var optionen = (teile[1] || "").split(/[|\/]/)
            .map(function (s) { return s.trim(); })
            .filter(function (s) { return s !== ""; });
          if (!b2 || optionen.length < 2) {
            fehler.push("{{" + m[1] + "}}: braucht Beschriftung und mindestens zwei Möglichkeiten (mit | getrennt)");
            continue;
          }
          if (!gesehen[b2]) {
            gesehen[b2] = true;
            luecken.push({ art: "auswahl", beschriftung: b2, optionen: optionen });
          }
        }
      } else if (name === "Baustein") {
        if (!t.rest || !t.rest.trim()) fehler.push("{{" + m[1] + "}}: Kürzel fehlt");
      } else if (!(name in konstanten)) {
        fehler.push("{{" + name + "}}: unbekannter Platzhalter (weder eingebaut noch eine Konstante aus den Einstellungen)");
      }
    }
    // Verwaiste Klammern finden: alles, was wie ein Platzhalter aussieht,
    // aber keiner ist — etwa {{Auswahl:{{Feld:X}}eins}} aus einem
    // verschachtelten Einfügen (Näd 13.9.). Sonst meldet die Prüfung
    // fälschlich „in Ordnung".
    var ohneGueltige = String(text || "").replace(MUSTER, "");
    var offen = (ohneGueltige.match(/\{\{/g) || []).length;
    var zu = (ohneGueltige.match(/\}\}/g) || []).length;
    if (offen || zu) {
      fehler.push("Unvollständiger Platzhalter: " + (offen + zu) +
        " Klammernpaar(e) gehören zu keinem gültigen Platzhalter — " +
        "vermutlich steckt ein Platzhalter in einem anderen drin");
    }
    return { luecken: luecken, fehler: fehler };
  }

  // Auswerten: fertigen Text bauen. antworten = { Beschriftung: Wert }.
  // umgebung: { jetzt, datumsformat, konstanten, holeBaustein, tiefe }
  function auswerten(text, antworten, umgebung) {
    var u = umgebung || {};
    var jetzt = u.jetzt || new Date();
    var konstanten = u.konstanten || {};
    var a = antworten || {};
    var tiefe = u.tiefe || 0;
    var fehler = [];
    if (tiefe > 3) return { text: text, fehler: ["Verschachtelung zu tief (mehr als 3 Ebenen)"] };

    var ergebnis = String(text || "").replace(MUSTER, function (ganz, inhalt) {
      var t = zerlege(inhalt);
      var name = t.name;
      var datum = /^Datum([+-]\d+)?$/.exec(name);
      if (datum) {
        var d = new Date(jetzt.getTime());
        if (datum[1]) d.setDate(d.getDate() + parseInt(datum[1], 10));
        return formatiereDatum(d, u.datumsformat);
      }
      if (name === "Zeit") return formatiereZeit(jetzt);
      if (name === "Cursor") return ""; // wirkt erst am Kürzel-Weg (Etappe 3)
      if (name === "Feld") {
        var gleich = t.rest ? t.rest.indexOf("=") : -1;
        var b = t.rest ? (gleich === -1 ? t.rest : t.rest.slice(0, gleich)).trim() : "";
        var vorgabe = gleich === -1 ? "" : t.rest.slice(gleich + 1);
        return (a[b] !== undefined) ? a[b] : vorgabe;
      }
      if (name === "Auswahl") {
        var b2 = t.rest ? (t.rest.split(":")[0] || "").trim() : "";
        return (a[b2] !== undefined) ? a[b2] : "";
      }
      if (name === "Baustein") {
        var kuerzel = (t.rest || "").trim();
        var anderer = u.holeBaustein ? u.holeBaustein(kuerzel) : null;
        if (!anderer) { fehler.push("{{Baustein:" + kuerzel + "}}: kein Baustein mit diesem Kürzel"); return ganz; }
        var innen = auswerten(anderer.text, a,
          { jetzt: jetzt, datumsformat: u.datumsformat, konstanten: konstanten,
            holeBaustein: u.holeBaustein, tiefe: tiefe + 1 });
        fehler = fehler.concat(innen.fehler);
        return innen.text;
      }
      if (name === "Ankreuz" || name === "Wenn" || name === "WennNicht" ||
          name === "Ende" || name === "Aus Kategorie") return "";
      if (name === "Sprung") return "\n";
      if (name in konstanten) return String(konstanten[name]);
      fehler.push("{{" + name + "}}: unbekannter Platzhalter");
      return ganz;
    });
    return { text: ergebnis, fehler: fehler };
  }

  return { analysiere: analysiere, auswerten: auswerten,
           formatiereDatum: formatiereDatum };
})();
