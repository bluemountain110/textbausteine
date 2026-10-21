// Datei: pat-kette.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die Patienten-Kette ;;pat, seit 18.26 in der App (vorher in
//        der Chrome-Erweiterung — SKRIPT-ZUERST). Näd markiert in
//        Axenita die Patienteninformation, kopiert sie (Strg+C) und
//        benutzt ;;pat. Daraus wird EINE Zeile für seine
//        Patientenliste in Excel — Name, Geburtsdatum, Strasse,
//        PLZ Ort, mit Komma getrennt (Beispiel: „Hans Muster,
//        15.02.1951, Klosbachstrasse 24, 8049 Zürich"). Die Kette
//        wird NICHT ins Feld geschrieben, sondern in die
//        Zwischenablage gelegt; eine Meldung zeigt sie an, in Excel
//        setzt Strg+V ein. Am Arbeitsplatz macht das Windows-Skript
//        dasselbe (pat.ahk — die Logik ist dort gespiegelt).
//        GRUNDSATZ: Nichts wird gespeichert oder ins Netz geschickt —
//        die Angaben wandern nur von Zwischenablage zu Zwischenablage.

"use strict";
window.TB = window.TB || {};

TB.patTexte = {
  fertig: "In der Zwischenablage: %s — in der Patientenliste mit Strg+V einsetzen.",
  nichtErkannt: "Keine Patientenangaben erkannt. Zuerst in Axenita die Patienteninformation markieren und mit Strg+C kopieren, dann ;;pat benutzen.",
  nurAnzeige: "Die Kette konnte nicht in die Zwischenablage gelegt werden — bitte von Hand übernehmen: %s",
  lesenVerwehrt: "Die Zwischenablage liess sich nicht lesen — bitte dem Browser den Zugriff erlauben und nochmals versuchen."
};

// ---- Reine Helfer (auch im Prüflauf ohne Browser testbar) --------------
TB.patRein = (function () {

  // Aus der Axenita-Kopie herausholen: Name (die Zeile mit dem
  // Geschlecht dahinter), Geburtsdatum (die Datumszeile, auch mit
  // „(30 J)" dahinter) und die zwei Zeilen unter „Adresse" — die
  // Kantonsklammer „(ZH)" und das Land fallen weg.
  function zerlege(text) {
    var zeilen = String(text || "").replace(/\r\n?/g, "\n").split("\n")
      .map(function (z) { return z.trim(); });
    var e = { name: "", geb: "", strasse: "", ort: "" };
    var adresseAb = -1;
    zeilen.forEach(function (z, i) {
      var m;
      if (!e.name && (m = /^(.+?)\s*,\s*(Weiblich|Männlich|Divers)\b/i.exec(z))) {
        e.name = m[1].trim();
      }
      if (!e.geb && (m = /^([0-3]?\d\.[01]?\d\.\d{4})(\s*\(\d+\s*J\.?\))?$/.exec(z))) {
        e.geb = m[1];
      }
      if (adresseAb === -1 && /^Adresse$/i.test(z)) adresseAb = i;
    });
    if (adresseAb !== -1) {
      var teile = [];
      for (var i = adresseAb + 1; i < zeilen.length && teile.length < 2; i++) {
        var z = zeilen[i];
        if (!z) continue;
        if (/^(Schweiz|Suisse|Svizzera|Liechtenstein|Deutschland|Österreich|Frankreich|Italien)$/i.test(z)) break;
        teile.push(z);
      }
      e.strasse = teile[0] || "";
      e.ort = (teile[1] || "").replace(/\s*\([A-Z]{2}\)\s*$/, "");
    }
    return e;
  }

  // Die fertige Zeile: was erkannt wurde, mit Komma gereiht — fehlt
  // etwas (z. B. keine Adresse hinterlegt), bleibt die Kette kürzer.
  function kette(e) {
    return [e.name, e.geb, e.strasse, e.ort]
      .map(function (x) { return String(x || "").trim(); })
      .filter(function (x) { return x !== ""; })
      .join(", ");
  }

  return { zerlege: zerlege, kette: kette };
})();

// ---- Der eine Handgriff hinter ;;pat in der App ------------------------
TB.patKette = (function () {
  var T = function () { return TB.patTexte; };

  function zwischenablageText() {
    try {
      return navigator.clipboard.readText()
        .then(function (t) { return String(t || ""); })
        .catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  // Zwischenablage lesen, Kette bauen, Kette zurück in die
  // Zwischenablage, Meldung zeigen. Nichts scheitert still.
  function starten() {
    return zwischenablageText().then(function (t) {
      if (t === null) { TB.ui.melde(T().lesenVerwehrt, true); return; }
      var e = TB.patRein.zerlege(t);
      if (!e.name && !e.geb) {
        TB.ui.melde(T().nichtErkannt, true);
        return;
      }
      var k = TB.patRein.kette(e);
      TB.patKette.letzteKette = k; // fürs Nachschauen im Prüflauf
      var schreiben;
      try { schreiben = navigator.clipboard.writeText(k); }
      catch (w) { schreiben = Promise.reject(w); }
      return schreiben.then(function () {
        TB.ui.melde(T().fertig.replace("%s", k), false);
      }).catch(function () {
        TB.ui.melde(T().nurAnzeige.replace("%s", k), true);
      });
    });
  }

  return { starten: starten, letzteKette: "" };
})();
