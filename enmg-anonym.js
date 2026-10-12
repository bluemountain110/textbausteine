// Datei: enmg-anonym.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Der ENMG-Anonymisierer (18.5, Näds Wunsch 12.10.): macht aus
//        einem Geräte-Export einen Befundtext OHNE Patientenbezug —
//        Name, Patienten-ID, Geburtsdatum und alle langen Nummern
//        fliegen raus, jedes Datum wird zu Monat/Jahr. Es bleiben:
//        Alter (gerechnet), Geschlecht (falls erkennbar), Monat/Jahr
//        der Untersuchung und der ganze Mess- und Befundtext. Eine
//        Datei, deren Patientenkopf NICHT sicher erkannt wird, kommt
//        NIE in die Ausgabe — lieber sichtbar ausgeschlossen als
//        still halb anonymisiert (Lehre I2).
//        GRUNDSATZ: Alles läuft nur in diesem Fenster; weder die
//        Dateien noch die Ausgabe werden gespeichert oder abgeglichen.

"use strict";
window.TB = window.TB || {};

TB.enmgAnonym = (function () {

  function putzeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Monat/Jahr aus "TT.MM.JJJJ" — mit führender Null.
  function monatJahr(datum) {
    var m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(datum || "").trim());
    if (!m) return "";
    return (m[2].length === 1 ? "0" + m[2] : m[2]) + "/" + m[3];
  }

  // Geschlecht aus dem Rohtext: erst das Geschlecht-Feld des Exports,
  // dann Herr/Frau im Kopfbereich. Ohne Fund: "" (= unbekannt) — das
  // ist kein Ausschlussgrund, nur eine Lücke in der Ausgabe.
  function leseGeschlecht(zeilen) {
    var kopfbereich = zeilen.slice(0, 25).join("\n");
    var alles = zeilen.join("\n");
    var g = /Geschlecht\s*:?\s*(m\b|w\b|männlich|maennlich|weiblich|male|female)/i.exec(alles);
    if (g) return /^m/i.test(g[1]) ? "m" : "w";
    if (/\bHerr\b/.test(kopfbereich)) return "m";
    if (/\bFrau\b/.test(kopfbereich)) return "w";
    return "";
  }

  // Ein Datums-Vorkommen irgendwo im Text: Geburtsdatum verschwindet
  // ganz, jedes andere Datum wird zu Monat/Jahr.
  function datumErsetzen(text, geburtsdatum) {
    var gebKern = String(geburtsdatum || "").replace(/\b0(\d)/g, "$1");
    return text.replace(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g,
      function (ganz, t, mo, j) {
        var kern = (t.replace(/^0/, "")) + "." + (mo.replace(/^0/, "")) + "." + j;
        if (gebKern && kern === gebKern) return "█";
        return (mo.length === 1 ? "0" + mo : mo) + "/" + j;
      });
  }

  // Zeilen, die als GANZES verschwinden (Beschriftungs-Zeilen des
  // Patientenkopfs; der PDF-Leser kann Bindestriche zerteilen, darum
  // die toleranten Muster).
  var KOPFZEILEN = [
    /Name\s*:/i,
    /Patienten\s*-?\s*ID/i,
    /\bPID\b/i,
    /Geburtsdatum/i,
    /Fall\s*-?\s*(Nr|nummer)/i,
    /Adresse/i,
    /\bAHV\b/i,
    /Versicher/i
  ];

  function anonymisiere(zeilen) {
    var kopf = TB.enmgLeser.leseKopf(zeilen);
    var fehlt = [];
    if (!kopf.name) fehlt.push("Name");
    if (!kopf.geburtsdatum) fehlt.push("Geburtsdatum");
    if (!kopf.untersuchungsdatum) fehlt.push("Untersuchungsdatum");
    if (fehlt.length) {
      return { ok: false,
        grund: "Patientenkopf unvollständig erkannt (fehlt: " +
          fehlt.join(", ") + ") — Datei wird NICHT ausgegeben" };
    }
    var alter = TB.enmg.alterAusDaten(kopf.geburtsdatum,
      kopf.untersuchungsdatum);
    if (alter === null || alter === undefined) {
      return { ok: false,
        grund: "Alter nicht berechenbar — Datei wird NICHT ausgegeben" };
    }

    // Namens-Stücke: ganzer Name plus jedes Wort daraus (ab 2 Zeichen),
    // damit auch zerteilte oder wiederholte Vorkommen verschwinden.
    var stuecke = [kopf.name].concat(kopf.name.split(/[,\s]+/))
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length >= 2; });
    if (kopf.id) stuecke.push(kopf.id);

    // 18.7: Die Geräte-Untersuchungsnummern merken (für die Kontrolle
    // der Kurven-Beschriftungen — dort stehen sie als Einzelstücke).
    var geraeteIds = [];
    zeilen.forEach(function (z) {
      var re = /\bID\b\s*:?\s*([0-9][0-9 .\-\/]*[0-9])/g, m;
      while ((m = re.exec(String(z || ""))) !== null) {
        var v = m[1].trim();
        if (geraeteIds.indexOf(v) === -1) geraeteIds.push(v);
        var kompakt = v.replace(/\s+/g, "");
        if (geraeteIds.indexOf(kompakt) === -1) geraeteIds.push(kompakt);
      }
    });

    var behalten = [];
    for (var i = 0; i < zeilen.length; i++) {
      var zeile = String(zeilen[i] || "");
      var weg = KOPFZEILEN.some(function (m) { return m.test(zeile); });
      if (weg) continue;
      stuecke.forEach(function (s) {
        // Kurze Stücke nur als ganzes Wort ersetzen — sonst zerschösse
        // ein Zweibuchstaben-Name wie „Li" jedes „Tibialis". Längere
        // Stücke überall (lieber zu viel geschwärzt als zu wenig; die
        // Schluss-Kontrolle unten fängt Durchgerutschtes ab).
        var muster = s.length <= 3
          ? new RegExp("\\b" + putzeRegex(s) + "\\b", "gi")
          : new RegExp(putzeRegex(s), "gi");
        zeile = zeile.replace(muster, "█");
      });
      zeile = datumErsetzen(zeile, kopf.geburtsdatum);
      zeile = zeile.replace(/\b756\.\d{4}\.\d{4}\.\d{2}\b/g, "█");  // AHV
      zeile = zeile.replace(/\b\d{7,}\b/g, "█");                   // lange IDs
      // 18.6: Die Untersuchungs-Nummer des Geräts („ID: 26 - 040") ist
      // über das EMG-System rückverfolgbar — sie wird geschwärzt
      // (Näds Testfund 12.10.).
      zeile = zeile.replace(/\bID\b\s*:?\s*[0-9][0-9 .\-\/]*/g, "ID: █ ");
      behalten.push(zeile);
    }
    var text = behalten.join("\n")
      .replace(/█(\s*█)+/g, "█").replace(/\n{3,}/g, "\n\n").trim();

    // Letzte Kontrolle: KEIN Namens-Stück und kein Geburtsdatum darf
    // die Anonymisierung überlebt haben.
    var kontrolle = text.toLowerCase();
    var uebrig = stuecke.some(function (s) {
      return s.length >= 3 && kontrolle.indexOf(s.toLowerCase()) !== -1; });
    if (uebrig || (kopf.geburtsdatum && text.indexOf(kopf.geburtsdatum) !== -1)) {
      return { ok: false,
        grund: "Kontrolle fehlgeschlagen (Rest eines Patientenbezugs?) — Datei wird NICHT ausgegeben" };
    }

    var erg = { ok: true, grund: "",
      alter: alter,
      geschlecht: leseGeschlecht(zeilen),
      monatJahr: monatJahr(kopf.untersuchungsdatum),
      text: text };
    // Schutzliste NUR für die Kurven-Ausgabe; wird nie ausgegeben
    // (nicht aufzählbar, damit sie auch kein Durchlauf erwischt).
    Object.defineProperty(erg, "schutz", { enumerable: false,
      value: { stuecke: stuecke, geburtsdatum: kopf.geburtsdatum,
               geraeteIds: geraeteIds } });
    return erg;
  }

  // ---- 18.7: Kurven-Rohdaten anonym ---------------------------------------
  // Aus dem Grafik-Leser (enmg-leser-pdf.js, leseGrafik) wird eine
  // Zahlen-Ausgabe: je Zeichenfläche die Linienzüge mit Farbe, Breite und
  // Punkten (eine Nachkommastelle). Beschriftungen kommen NUR mit, wenn
  // sie unverändert auch im anonymen Text stehen — alles mit
  // Patientenbezug (Name, Geburtsdatum, Geräte-Nummer) ist dort schon
  // weg und fällt damit auch hier heraus. Danach eine Schluss-Kontrolle;
  // schlägt sie an, entfallen die Kurven dieses Befunds ganz.
  function r1(v) { return Math.round(v * 10) / 10; }
  function farbText(f) {
    return f.map(function (x) { return Math.round(x * 100) / 100; }).join(",");
  }
  function beschriftungErlaubt(t, erg) {
    var s = String(t || "").replace(/\s+/g, " ").trim();
    if (!s) return false;
    var sch = erg.schutz || { stuecke: [], geraeteIds: [] };
    var klein = s.toLowerCase();
    if (sch.stuecke.some(function (x) {
          return x.length >= 2 && klein.indexOf(x.toLowerCase()) !== -1; }))
      return false;
    if (sch.geraeteIds.some(function (x) { return x && s.indexOf(x) !== -1; }))
      return false;
    if (/\b\d{1,2}\.\d{1,2}\.\d{4}\b/.test(s)) return false;  // ganze Daten nie
    if (/\d{7,}/.test(s)) return false;
    // Muss im anonymen Text vorkommen (Leerzeichen vereinheitlicht).
    var anonym = erg.text.replace(/\s+/g, " ");
    return anonym.indexOf(s) !== -1;
  }
  function kurvenText(grafik, erg) {
    if (!erg || !erg.ok || !grafik) return "";
    if (!grafik.length) {
      // 18.8: Nie still — ohne Linien steht die technische Diagnose da.
      var diag = "";
      try { diag = typeof grafik.diagnose === "function" ? grafik.diagnose() : ""; }
      catch (e) { diag = "Diagnose nicht möglich"; }
      return "### Kurven-Rohdaten: KEINE Linien gefunden — Diagnose: " +
        (diag || "keine Angaben");
    }
    var teile = [];
    var nPfade = 0;
    grafik.forEach(function (g) {
      teile.push("--- Zeichenfläche " + g.nr + " (" + g.art +
        (g.bbox ? ", BBox " + g.bbox : "") +
        (g.matrix ? ", Matrix " + g.matrix : "") + ") ---");
      g.xobjekte.forEach(function (x) {
        teile.push("FORM " + x.name + " ctm=" + x.ctm.map(r1).join(" "));
      });
      g.texte.forEach(function (t) {
        if (!beschriftungErlaubt(t.text, erg)) return;
        teile.push("TEXT " + r1(t.x) + " " + r1(t.y) + " " +
          t.text.replace(/\s+/g, " ").trim());
      });
      g.pfade.forEach(function (p) {
        nPfade++;
        teile.push((p.art === "flaeche" ? "FLAECHE" : "LINIE") +
          " n=" + p.pts.length +
          " farbe=" + farbText(p.farbe) +
          " breite=" + r1(p.breite) +
          (p.geschlossen ? " zu" : "") + ": " +
          p.pts.map(function (q) { return r1(q[0]) + "," + r1(q[1]); }).join(" "));
      });
    });
    var text = "### Kurven-Rohdaten (" + grafik.length + " Zeichenflächen, " +
      nPfade + " Linienzüge; Koordinaten in PDF-Punkten, y nach oben)\n" +
      teile.join("\n");
    // Schluss-Kontrolle über die ganze Kurven-Ausgabe.
    var sch = erg.schutz || { stuecke: [], geraeteIds: [] };
    var klein = text.toLowerCase();
    var verdacht = sch.stuecke.some(function (s) {
      return s.length >= 3 && klein.indexOf(s.toLowerCase()) !== -1; }) ||
      sch.geraeteIds.some(function (x) { return x && x.length >= 4 && text.indexOf(x) !== -1; }) ||
      (sch.geburtsdatum && text.indexOf(sch.geburtsdatum) !== -1);
    if (verdacht) {
      return "### Kurven-Rohdaten: AUSGELASSEN (Kontrolle schlug an — " +
        "sicherheitshalber nicht ausgegeben)";
    }
    return text;
  }

  // Alle grünen Einträge zu EINER Textdatei; Dateinamen der Quellen
  // bleiben bewusst draussen (sie tragen oft den Patientennamen).
  function sammelausgabe(eintraege) {
    var gruene = eintraege.filter(function (e) { return e.ok; });
    var teile = ["ENMG-Befunde, anonymisiert (Werkzeug der " +
      "Textbausteine-App) — " + gruene.length + " Befunde", ""];
    gruene.forEach(function (e, i) {
      teile.push("=== Befund " + (i + 1) + " — Alter " + e.alter +
        ", Geschlecht " + (e.geschlecht || "unbekannt") +
        ", Untersuchung " + (e.monatJahr || "unbekannt") + " ===");
      teile.push(e.text);
      if (e.kurven) { teile.push(""); teile.push(e.kurven); }
      teile.push("");
    });
    return teile.join("\n");
  }

  function dateiname() {
    var d = new Date();
    function z2(n) { return n < 10 ? "0" + n : "" + n; }
    return "ENMG-anonym-" + d.getFullYear() + "-" + z2(d.getMonth() + 1) +
      "-" + z2(d.getDate()) + ".txt";
  }

  return { anonymisiere: anonymisiere, sammelausgabe: sammelausgabe,
           monatJahr: monatJahr, dateiname: dateiname,
           leseGeschlecht: leseGeschlecht, kurvenText: kurvenText,
           beschriftungErlaubt: beschriftungErlaubt };
})();
