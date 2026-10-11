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

  // ---- Voll-Erkennung (18.2): ganze Vordiagnose oder Befund lesen ------
  // Liest den Text, den Näd ins Einlese-Feld des Diagnoseblocks legt —
  // typischerweise die bestehende KISIM-Diagnose (unser eigenes Format)
  // oder ein Zusatzbefund (Radiologie, Liquor) — und liefert die Werte
  // für ALLE Felder des Diagnoseblocks. Gelesen wird nur der
  // Alzheimer-Block; weitere Diagnosen (2., 3. …) bleiben unberührt.
  var DX_MCI = "Mild Neurocognitive Impairment (MCI) im Rahmen eines Morbus Alzheimer";
  var DX_DEM = "Leichte Demenz im Rahmen eines Morbus Alzheimer";

  function putze(s) {
    return String(s || "").replace(/\s+/g, " ").replace(/[,\s]+$/, "").trim();
  }

  function erkenneDiagnose(text) {
    var alle = String(text || "").split(/\r?\n/);
    // Auf den Alzheimer-Block einschränken: ab der Titelzeile bis zur
    // nächsten nummerierten Diagnose oder den KISIM-Fussblöcken.
    var start = -1;
    for (var i = 0; i < alle.length; i++) {
      if (/Morbus Alzheimer|Neurocognitive/i.test(alle[i])) { start = i; break; }
    }
    var zeilen = [];
    if (start === -1) { zeilen = alle; }
    else {
      for (var j = start; j < alle.length; j++) {
        var z0 = alle[j];
        if (j > start && (/^\s*\d+\.\s/.test(z0) ||
            /^(Behandlungen für Codierung|DRG|Ambulant vor stationär)/i.test(z0.trim())))
          break;
        zeilen.push(z0);
      }
    }
    var block = zeilen.join("\n");
    var felder = {}, kaestchen = {}, stadium = null, gefunden = 0;
    function setze(kreuz, beschriftung, wert) {
      if (wert === null || wert === undefined || wert === "") return;
      if (kreuz) kaestchen[kreuz] = true;
      if (beschriftung) felder[beschriftung] = putze(wert);
      gefunden += 1;
    }

    if (/Mild Neurocognitive Impairment|Mild Neurocognitive Disorder|\(MCI\)/i.test(block)) stadium = DX_MCI;
    else if (/Leichte Demenz|Major Neurocognitive/i.test(block)) stadium = DX_DEM;
    if (stadium) gefunden += 1;

    // EM frei: Jahr, „ca. 2019" oder „unklar" (18.3); „ca." bleibt dran.
    var em = /\bEM\b[.:\s]*((?:ca\.\s*)?\d{4}|unklar)/i.exec(block);
    if (em) setze(null, "EM", em[1].replace(/\s+/g, " "));
    // ED: Erstdiagnose als Monat/Jahr, Datum, Jahr oder „unklar" (18.3).
    var ed = /\bED\b[.:\s]*((?:ca\.\s*)?(?:\d{1,2}\/\d{4}|\d{1,2}\.\d{1,2}\.\d{4}|\d{4})|unklar)/i.exec(block);
    if (ed) setze(null, "ED (Monat/Jahr)", ed[1].replace(/\s+/g, " "));

    // Neuropsych-Profil: ab der Schlüsselzeile, Folgezeilen hängen an,
    // bis eine andere bekannte Zeile beginnt.
    var ANDERE = /^(MMS|MMSE|MoCA|Uhrentest|Liquor|ApoE|c?MRI\b|Therapien|Negative Co|Kisunla|CAVE|DSM|EM\b|ED\b|Diagnostik|\d+\.)/i;
    for (var k = 0; k < zeilen.length; k++) {
      var np = /Neuropsychologisches Profil:\s*(.*)$/i.exec(zeilen[k]);
      if (!np) continue;
      var wert = np[1];
      for (var k2 = k + 1; k2 < zeilen.length; k2++) {
        var folge = zeilen[k2].trim();
        if (!folge || ANDERE.test(folge)) break;
        wert += " " + folge;
      }
      setze("Neuropsychologie", "Neuropsychologisches Profil", wert);
      break;
    }

    var sc = erkenneScores(block);
    if (sc.eintraege.length)
      setze("Scores", "Scores (Vorbericht hier einfügen)", sc.zeile);

    var lp = /Liquor-?Marker\s+(\d{1,2}\/\d{4}|\d{1,2}\.\d{1,2}\.\d{4})\s*\(([^)]+)\)\s*:\s*([^\n]+)/i.exec(block);
    if (lp) {
      var lpErg = lp[3], er = /\(\s*Erlangen-Score\s*([^)]+)\)/i.exec(lpErg);
      if (er) { setze(null, "Erlangen-Score", er[1]); lpErg = lpErg.replace(er[0], ""); }
      setze("Liquor-Marker", "LP Monat/Jahr", lp[1]);
      setze(null, "LP-Labor", lp[2]);
      setze(null, "LP-Ergebnis", lpErg.replace(/[.\s]+$/, ""));
      kaestchen["Liquor-Marker"] = true;
    }

    var apo = /ApoE[- ]?(?:Bestimmung|Genotypisierung)?\s*(\d{1,2}\.\d{1,2}\.\d{4}|\d{1,2}\/\d{4})?\s*\(([^)]+)\)\s*:\s*([^\s,;]+)/i.exec(block);
    if (apo) {
      setze("ApoE", "ApoE-Datum", apo[1] || "");
      setze(null, "ApoE-Labor", apo[2]);
      setze(null, "ApoE-Genotyp", apo[3].replace(/[.]+$/, ""));
      kaestchen["ApoE"] = true;
    }

    // cMRI-Zeile aus einer Vordiagnose …
    var mri = /(?:^|\n)\s*c?MRI\s+(\d{1,2}\.\d{1,2}\.\d{4}|\d{1,2}\/\d{4})\s*:\s*([^\n]+)/i.exec(block);
    if (mri) {
      setze("cMRI", "MRI-Datum", mri[1]);
      setze(null, "MRI-Befund (Beurteilung)", mri[2].replace(/\s+$/, ""));
      kaestchen["cMRI"] = true;
    } else {
      // … oder ein hineingelegter Radiologie-Befund: Datum + Beurteilung.
      var hatMr = /\b(MRI?|MRT|Schädel)\b/i.test(block) && /Beurteilung/i.test(block);
      if (hatMr) {
        var bu = /Beurteilung[:\s]*\n?([\s\S]{1,500}?)(?=\n\s*\n|\nMit freundlich|\nFreundliche|$)/i.exec(block);
        var md = /(?:Untersuchung(?:sdatum)?\s*(?:vom)?|vom)\s*(\d{1,2}\.\d{1,2}\.\d{4})/i.exec(block) ||
                 /(\d{1,2}\.\d{1,2}\.\d{4})/.exec(block);
        if (bu) {
          setze("cMRI", "MRI-Befund (Beurteilung)", bu[1]);
          if (md) setze(null, "MRI-Datum", md[1]);
          kaestchen["cMRI"] = true;
        }
      }
    }

    var cof = /Negative Co-?Faktoren:?\s*([^\n]*)/i.exec(block);
    if (cof && putze(cof[1])) {
      setze("Negative Co-Faktoren", "Negative Co-Faktoren (Wortlaut)", cof[1]);
    }

    // Therapien: erste Zeile nach dem Titel ist die symptomatische
    // Therapie, Kisunla hat seine eigene Zeile; CAVE wird ignoriert.
    for (var t2 = 0; t2 < zeilen.length; t2++) {
      if (!/^\s*Therapien:?\s*$/i.test(zeilen[t2])) continue;
      for (var t3 = t2 + 1; t3 < zeilen.length; t3++) {
        var tz = zeilen[t3].trim();
        if (!tz) continue;
        if (/^CAVE/i.test(tz)) continue;
        if (/^Kisunla/i.test(tz)) continue;
        if (/^\d+\./.test(tz)) break;
        setze("Symptomatische Therapie", "Symptomatische Therapie (Wortlaut)", tz);
        break;
      }
      break;
    }
    // Rückfall für zusammengeklebte Zeilen ("Therapien:Rezirkane …"):
    if (!felder["Symptomatische Therapie (Wortlaut)"]) {
      var tf = /Therapien:?\s*([^\n]+)/i.exec(block);
      if (tf) {
        var tft = tf[1].replace(/Kisunla[\s\S]*$/i, "").replace(/CAVE[\s\S]*$/i, "");
        if (putze(tft))
          setze("Symptomatische Therapie", "Symptomatische Therapie (Wortlaut)", tft);
      }
    }
    var kis = /Kisunla\s*\(Donanemab\)\s*ab\s*(\d{1,2}\.\d{1,2}\.\d{4}|\d{1,2}\/\d{4})/i.exec(block);
    if (kis) setze("Kisunla", "Kisunla ab (Datum)", kis[1]);

    return { stadium: stadium, felder: felder, kaestchen: kaestchen,
             gefunden: gefunden };
  }

  return { erkenneScores: erkenneScores,
           scoresZeileFuerFeld: scoresZeileFuerFeld,
           feldVeredeln: feldVeredeln,
           erkenneDiagnose: erkenneDiagnose,
           DX_MCI: DX_MCI, DX_DEM: DX_DEM };
})();
