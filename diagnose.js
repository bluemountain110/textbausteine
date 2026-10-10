// Datei: diagnose.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Der Grundstein des Diagnosen-Werks (Etappe 13). Erkennt in
//        hineinkopiertem Vorbericht-Text die Demenz-Scores (MMS/MMSE,
//        MoCA, Uhrentest) samt Datum und macht daraus die kompakte
//        Score-Zeile des Diagnoseblocks („MMS 08/2026: 29/30; …").
//        Dazu der kleine Helfer fürs Ausfüll-Fenster: Wird in ein
//        „Scores…“-Feld ein ganzer Bericht eingefügt, ersetzt die
//        Erkennung ihn durch die Score-Zeile — erkennt sie nichts,
//        bleibt der eingefügte Text unverändert stehen (lieber
//        sichtbar roh als unsichtbar falsch, Lehre I2).
//        GRUNDSATZ: Alles läuft nur im Fenster. Hier wird nichts
//        gespeichert und nichts abgeglichen — nie Patientendaten.

"use strict";
window.TB = window.TB || {};

TB.diagnose = (function () {

  // ---- Datum lesen ----------------------------------------------------
  // Verstanden werden "08/2026" und "12.09.2026" (auch "1.9.2026").
  function datumIn(stueck) {
    var voll = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(stueck);
    if (voll) return { tag: +voll[1], monat: +voll[2], jahr: +voll[3] };
    var kurz = /(\d{1,2})\/(\d{4})/.exec(stueck);
    if (kurz && +kurz[1] >= 1 && +kurz[1] <= 12) {
      return { tag: 0, monat: +kurz[1], jahr: +kurz[2] };
    }
    return null;
  }
  function zweiStellig(n) { return (n < 10 ? "0" : "") + n; }
  function datumText(d) { return zweiStellig(d.monat) + "/" + d.jahr; }
  function datumZahl(d) {
    return d ? (d.jahr * 10000 + d.monat * 100 + d.tag) : -1;
  }

  // ---- Scores erkennen ------------------------------------------------
  var TESTS = [
    { name: "MMS", muster: /\bMMSE?\b/gi, nenner: "30" },
    { name: "MoCA", muster: /\bMoCA\b/gi, nenner: "30" },
    { name: "Uhrentest", muster: /\bUhrentest(?:[- ]?Zeichnen)?\b/gi, nenner: "7" }
  ];
  var REIHENFOLGE = { "MMS": 0, "MoCA": 1, "Uhrentest": 2 };

  // Liefert { eintraege: [{test, datum|null, wert}], zeile } — die
  // Zeile ist leer, wenn nichts erkannt wurde.
  function erkenneScores(text) {
    var t = String(text || "");
    var zeilen = t.split(/\r?\n/);
    var eintraege = [], schluessel = {};
    var kontext = null, kontextFrisch = 0;

    zeilen.forEach(function (z) {
      // Ein Satz wie "Demenz-Scores vom 12.09.2026" liefert das Datum
      // für die nächsten Zeilen ohne eigenes Datum.
      var vom = /(?:score|testung|untersuchung|neuropsycholog)[^\n]*?vom\s+(\d{1,2}\.\d{1,2}\.\d{4})/i.exec(z);
      if (vom) { kontext = datumIn(vom[1]); kontextFrisch = 15; }
      else if (kontextFrisch > 0) kontextFrisch -= 1;
      if (kontextFrisch === 0) kontext = null;

      // Fundstellen aller Testnamen in dieser Zeile, der Reihe nach —
      // das Fenster eines Fundes endet am nächsten Testnamen.
      var funde = [];
      TESTS.forEach(function (test) {
        test.muster.lastIndex = 0;
        var m;
        while ((m = test.muster.exec(z)) !== null) {
          funde.push({ test: test, start: m.index, ende: m.index + m[0].length });
        }
      });
      funde.sort(function (a, b) { return a.start - b.start; });
      funde.forEach(function (f, i) {
        var bis = (i + 1 < funde.length) ? funde[i + 1].start
                                         : Math.min(z.length, f.ende + 80);
        var fenster = z.slice(f.ende, bis);
        var wert = new RegExp("(\\d{1,2})\\s*(?:\\/|von)\\s*" +
                              f.test.nenner + "\\b").exec(fenster);
        if (!wert) return;
        var datum = datumIn(fenster.slice(0, wert.index)) ||
                    datumIn(z.slice(Math.max(0, f.start - 30), f.start)) ||
                    kontext;
        var eintrag = { test: f.test.name, datum: datum,
                        wert: wert[1] + "/" + f.test.nenner };
        var k = eintrag.test + "|" + (datum ? datumText(datum) : "-") +
                "|" + eintrag.wert;
        if (!schluessel[k]) { schluessel[k] = true; eintraege.push(eintrag); }
      });
    });

    eintraege.sort(function (a, b) {
      var d = datumZahl(b.datum) - datumZahl(a.datum);
      if (d !== 0) return d;
      return REIHENFOLGE[a.test] - REIHENFOLGE[b.test];
    });
    var zeile = eintraege.map(function (e) {
      return e.test + (e.datum ? " " + datumText(e.datum) : "") + ": " + e.wert;
    }).join("; ");
    return { eintraege: eintraege, zeile: zeile };
  }

  // Nur wenn der eingefügte Text nach BERICHT aussieht (lang oder
  // mehrzeilig) UND etwas erkannt wurde, wird ersetzt — von Hand
  // getippte Zeilen bleiben unangetastet.
  function scoresZeileFuerFeld(eingefuegt) {
    var t = String(eingefuegt || "");
    if (t.length <= 60 && t.indexOf("\n") === -1) return null;
    var erg = erkenneScores(t);
    return erg.eintraege.length ? erg.zeile : null;
  }

  // ---- Feld-Veredelung im Ausfüll-Fenster ------------------------------
  // Gilt für jedes Feld, dessen Beschriftung mit „Scores“ beginnt.
  function feldVeredeln(beschriftung, eingabe, zeile, beiErkannt) {
    if (!/^scores/i.test(String(beschriftung || ""))) return;
    eingabe.addEventListener("paste", function () {
      setTimeout(function () {
        var neu = scoresZeileFuerFeld(eingabe.value);
        if (neu === null) return;
        eingabe.value = neu;
        eingabe.title = (TB.T && TB.T.scoresErkannt) || "";
        if (zeile && !zeile.querySelector(".diagnose-erkannt")) {
          var hinweis = document.createElement("div");
          hinweis.className = "erklaerung diagnose-erkannt";
          hinweis.textContent = (TB.T && TB.T.scoresErkannt) || "";
          zeile.appendChild(hinweis);
        }
        if (beiErkannt) beiErkannt();
      }, 0);
    });
  }

  return { erkenneScores: erkenneScores,
           scoresZeileFuerFeld: scoresZeileFuerFeld,
           feldVeredeln: feldVeredeln };
})();
