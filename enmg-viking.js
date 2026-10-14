// Datei: enmg-viking.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Der Deuter für die Viking-Berichte der Praxis (18.13). Der
//        Viking legt jeden Teil des Berichts in ein eigenes Word-Feld
//        („FILLIN VikingSubReport:mnc_b" = motorisch, „snc_b" =
//        sensibel, „f-wave_b" = F-Wellen, „pat_b" = Patient,
//        „history" = Fragestellung …). Die Tabellen haben feste
//        Spaltenzahlen; jede Zeile endet mit einer zusätzlichen
//        Zellen-Marke. Daraus wird dasselbe Lese-Ergebnis wie beim
//        Keypoint-Leser (Patient, Blöcke je Nerv, Reste), damit
//        Färbung, Tabelle und Befund-Vorschlag gleich arbeiten.
//        Palmar- und Ringfinger-Zeilen sind Vergleichsmessungen OHNE
//        Normzeile (schwarz); physikalisch unmögliche NLG (über 90 m/s)
//        werden nie gefärbt, sondern als „Distanz prüfen" gemeldet.
//        GRUNDSATZ: Ein Befund — wird NIE gespeichert oder abgeglichen.

"use strict";
window.TB = window.TB || {};

TB.enmgViking = (function () {
  var NLG_MAX = 90, NLG_MIN = 5;

  function zahl(t) {
    var m = /-?\d+(?:[.,]\d+)?/.exec(String(t || ""));
    return m ? parseFloat(m[0].replace(",", ".")) : null;
  }
  function sauber(t) {
    return String(t || "").replace(/[\r\x0B]+/g, " ").replace(/\s+/g, " ").trim();
  }

  // ---- Abschnitte (Word-Felder) ------------------------------------------
  function abschnitte(roh) {
    var aus = {}, frei = [], re = /\x13([^\x13\x14\x15]*)(?:\x14([^\x13\x15]*))?\x15/g;
    var m, letzte = 0;
    while ((m = re.exec(roh))) {
      var zwischen = roh.slice(letzte, m.index);
      if (sauber(zwischen.replace(/[\x07\x0C]/g, " "))) frei.push(zwischen);
      letzte = re.lastIndex;
      var name = /VikingSubReport:([^\s.]+)/i.exec(m[1] || "");
      if (name) aus[name[1].toLowerCase()] = m[2] || "";
    }
    var rest = roh.slice(letzte);
    if (sauber(rest.replace(/[\x07\x0C]/g, " "))) frei.push(rest);
    return { felder: aus, frei: frei };
  }

  // ---- Eine Viking-Tabelle in Zeilen zerlegen ----------------------------
  // Der Text vor der ersten Zellen-Marke enthält den Titel und (in der
  // letzten Zeile) die erste Kopfzelle. Die Kopfzeile hat keine leeren
  // Zellen — ihre Länge bis zur ersten leeren Marke ist die Spaltenzahl.
  function tabelle(text) {
    var t = String(text || "").split("\x07");
    if (t.length < 3) return null;
    var erste = t[0].split(/[\r\x0B]/);
    t[0] = erste[erste.length - 1];
    var n = 0;
    while (n < t.length && sauber(t[n]) !== "") n++;
    if (n < 2 || n >= t.length) return null;
    var kopf = t.slice(0, n).map(sauber);
    var zeilen = [], fehler = 0;
    for (var i = n + 1; i + n < t.length; i += n + 1) {
      var zellen = t.slice(i, i + n).map(sauber);
      if (sauber(t[i + n]) !== "") fehler++;
      if (zellen.every(function (z) { return z === ""; })) continue;
      zeilen.push(zellen);
    }
    return { kopf: kopf, zeilen: zeilen, fehler: fehler };
  }
  function spalten(kopf) {
    var s = {};
    kopf.forEach(function (k, i) {
      var t = k.toLowerCase();
      if (i === 0) s.stim = i;
      else if (/area/.test(t)) s.areaDiff = i;
      else if (/m-latenz/.test(t)) s.mLat = i;
      else if (/f-latenz/.test(t)) s.fLat = i;
      else if (/abgang/.test(t)) s.lat = i;
      else if (/peak/.test(t)) s.peak = i;
      else if (/diff/.test(t)) s.latDiff = i;
      else if (/^latenz/.test(t)) s.lat = i;
      else if (/amplitude/.test(t)) s.amp = i;
      else if (/segment/.test(t)) s.seg = i;
      else if (/distanz/.test(t)) s.abstand = i;
      else if (/nlg/.test(t)) s.nlg = i;
    });
    return s;
  }
  // „N. medianus.R" → { name: "N. medianus", seite: "rechts" }
  function nervTitel(t) {
    var m = /^(N\.?\s*.+?)\s*\.\s*([RL])\s*$/i.exec(sauber(t));
    if (!m) return null;
    return { name: m[1].replace(/^N\.?\s*/, "N. "),
             seite: m[2].toUpperCase() === "R" ? "rechts" : "links" };
  }

  // ---- Der Deuter ---------------------------------------------------------
  function deute(roh) {
    var ab = abschnitte(roh), f = ab.felder;
    var reste = [], bloecke = [];

    // Patient (Name, Geburtsdatum TT/MM/JJJJ, ID) und Untersuchungsdatum
    var patText = sauber(String(f.pat_b || "").replace(/\x07/g, " "));
    var patient = { name: "", id: "", geburtsdatum: "", untersuchungsdatum: "" };
    var nm = /Name:\s*(.+?),\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(patText);
    if (nm) {
      patient.name = nm[1].trim();
      patient.geburtsdatum = ("0" + nm[2]).slice(-2) + "." + ("0" + nm[3]).slice(-2) + "." + nm[4];
    }
    var id = /Patient\s*ID:\s*(\S+)/i.exec(patText);
    if (id) patient.id = id[1];
    var ud = /Untersuchung vom\s*(\d{1,2}\.\d{1,2}\.\d{4})/i.exec(patText);
    if (ud) patient.untersuchungsdatum = ud[1];

    var frage = sauber(String(f.history || "").replace(/\x07/g, " "))
      .replace(/^.*?Fragestellung:\s*/i, "");

    function blockFuer(art, titel) {
      var b = { art: art, nervText: titel.name + " " + titel.seite,
                nervName: titel.name, seite: titel.seite, zeilen: [] };
      bloecke.push(b);
      return b;
    }
    function lesen(art, text) {
      var tab = tabelle(text);
      if (!tab) return;
      if (tab.fehler) reste.push((art === "motor" ? "Motorische" : "Sensible") +
        " Tabelle: " + tab.fehler + " Zeile(n) nicht sicher getrennt — Werte bitte im Original prüfen.");
      var s = spalten(tab.kopf), block = null;
      tab.zeilen.forEach(function (z) {
        var titel = nervTitel(z[0]);
        var rest = z.slice(1).every(function (c) { return c === ""; });
        if (titel && rest) { block = blockFuer(art, titel); return; }
        if (!block) { reste.push(z.join(" ")); return; }
        var w = {
          lat: s.lat !== undefined ? zahl(z[s.lat]) : null,
          amp: s.amp !== undefined ? zahl(z[s.amp]) : null,
          nlg: s.nlg !== undefined ? zahl(z[s.nlg]) : null,
          abstand: s.abstand !== undefined ? zahl(z[s.abstand]) : null
        };
        if (s.peak !== undefined) w.peak = zahl(z[s.peak]);
        if (s.areaDiff !== undefined) w.areaDiff = zahl(z[s.areaDiff]);
        var seg = s.seg !== undefined ? z[s.seg] : "";
        var stim = z[0];
        // Eine Zeile mit Distanz, aber ohne Antwort = gemessen, kein
        // Potential (zählt); ganz leere Zeilen sind Geräte-Wiederholungen.
        var hatWert = ["lat", "amp", "nlg", "peak", "abstand"].some(function (k) {
          return w[k] !== null && w[k] !== undefined; });
        if (!hatWert) return;   // leere Wiederholungszeile des Geräts
        var zeile = { segment: stim && seg && seg.indexOf("-") > 0
                        ? stim + " (" + seg + ")" : (stim || seg),
                      stimulation: stim, werte: w, geraetNorm: {} };
        var segKlein = (seg + " " + stim).toLowerCase();
        // Palmar = Reizort Hohlhand (Vergleichsmessung); entscheidend ist
        // die Stimulations-Spalte, nicht die Segment-Beschriftung.
        if (art === "sens" && /palmar/i.test(stim)) {
          zeile.ohneNorm = true; zeile.vergleich = "palmar";
        }
        if (art === "sens" && /dig\s*iv/.test(segKlein)) {
          zeile.ohneNorm = true; zeile.vergleich = "ringfinger";
        }
        if (w.nlg !== null && (w.nlg > NLG_MAX || w.nlg < NLG_MIN)) {
          zeile.ohneNorm = true; zeile.unplausibel = true;
        }
        block.zeilen.push(zeile);
      });
    }
    lesen("motor", f.mnc_b);
    lesen("sens", f.snc_b);

    // F-Wellen an den motorischen Block desselben Nervs hängen
    var fw = tabelle(f["f-wave_b"]);
    if (fw) {
      var fs = spalten(fw.kopf);
      fw.zeilen.forEach(function (z) {
        var titel = nervTitel(z[0]);
        var fl = fs.fLat !== undefined ? zahl(z[fs.fLat]) : null;
        if (!titel || fl === null) return;
        var ziel = bloecke.filter(function (b) {
          return b.art === "motor" && b.nervName === titel.name && b.seite === titel.seite;
        })[0];
        if (ziel && ziel.zeilen.length) ziel.zeilen[0].werte.fLat = fl;
        else reste.push("F-Welle " + titel.name + " " + titel.seite + ": " + fl + " ms");
      });
    }
    bloecke = bloecke.filter(function (b) { return b.zeilen.length; });

    // Freier Text ausserhalb der Felder (z. B. das EMG der Kollegin)
    var freitext = ab.frei.map(function (t) {
      return sauber(t.replace(/[\x07\x0C]/g, " ")); }).filter(Boolean);
    // Bereits ausgefüllte Beurteilung (Vorlage der Kollegin) — nur Hinweis
    var vorhanden = sauber(String(f.conclusn || "").replace(/\x07/g, " "))
      .replace(/^Beurteilung:\s*/i, "");

    return { patient: patient, bloecke: bloecke, reste: reste,
             fragestellungText: frage, freitext: freitext,
             vorhandeneBeurteilung: vorhanden, format: "viking" };
  }

  function lese(puffer) {
    return deute(TB.enmgLeserDoc.wordText(puffer));
  }

  return { lese: lese, deute: deute, tabelle: tabelle, nervTitel: nervTitel,
           abschnitte: abschnitte };
})();
