// Datei: enmg-leser.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Der gemeinsame DEUTER der ENMG-Leser: bekommt von den beiden
//        Format-Lesern (enmg-leser-word.js, enmg-leser-pdf.js) einen
//        einheitlichen Strom von Tabellen-Zeilen (je Zeile eine Liste
//        von Zellen-Texten) und macht daraus das Lese-Ergebnis:
//        Patientenkopf, Blöcke je Nerv (motorisch/sensibel) mit
//        Segment-Zeilen und Messwerten. Was er nicht sicher versteht,
//        legt er unverändert in "reste" — lieber sichtbar
//        unvollständig als unsichtbar falsch (Lehre I2).
//        Gebaut gegen Näds echten Keypoint-Export vom 1.10.2026.
//        GRUNDSATZ: Das Ergebnis ist ein Patientenbefund und wird NIE
//        gespeichert, NIE abgeglichen, NIE protokolliert.

"use strict";
window.TB = window.TB || {};

TB.enmgLeser = (function () {

  // ---- Kleine Helfer ----------------------------------------------------
  function num(text) {
    var t = String(text === null || text === undefined ? "" : text)
      .trim().replace(",", ".");
    if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
    return parseFloat(t);
  }
  function istNormText(t) {
    return /^[<>]\s*-?\d/.test(String(t || "").trim());
  }

  // ---- Spalten-Bedeutungen aus Kopf- und Einheiten-Zeile ------------------
  var KOPFWOERTER = {
    "lat": "lat", "amp": "amp", "dur": "dur", "nlg": "nlg",
    "f lat": "fLat", "f-lat": "fLat", "flat": "fLat",
    "abstand": "abstand", "distanz": "abstand",
    "stimulus": "stim", "stim": "stim"
  };
  function bedeutungen(kopfZellen, einheitZellen) {
    var koepfe = kopfZellen.slice(1).filter(function (z) {
      return String(z || "").trim() !== ""; });
    var einheiten = einheitZellen.slice(1).filter(function (z) {
      return String(z || "").trim() !== ""; });
    var m = [], hIdx = 0, letztesFeld = null;
    for (var i = 0; i < einheiten.length; i++) {
      var e = String(einheiten[i]).trim();
      if (/^norm\.?$/i.test(e)) {
        m.push({ feld: letztesFeld, norm: true, einheit: "" });
      } else {
        var kopf = String(koepfe[hIdx] || "").trim().toLowerCase();
        letztesFeld = KOPFWOERTER[kopf] || kopf || null;
        m.push({ feld: letztesFeld, norm: false, einheit: e });
        hIdx++;
      }
    }
    return m;
  }
  function artAusBedeutungen(m) {
    var felder = m.map(function (x) { return x.feld; });
    var einheiten = m.map(function (x) { return (x.einheit || "").toLowerCase(); });
    if (felder.indexOf("fLat") !== -1) return "motor";
    if (felder.indexOf("abstand") !== -1 || felder.indexOf("stim") !== -1)
      return "sens";
    if (einheiten.indexOf("mv") !== -1) return "motor";
    return "sens";
  }

  // ---- Der Deuter ---------------------------------------------------------
  // zeilen: Liste von Zellen-Listen (erste Zelle = linke Spalte).
  // texte:  alle Roh-Texte (für den Patientenkopf).
  function deute(zeilen, texte) {
    var patient = leseKopf(texte);
    var bloecke = [], reste = [];
    var meinungen = null, art = null, block = null;

    function istKopfzeile(z) {
      var erste = String(z[0] || "").trim().toLowerCase();
      if (erste !== "nerve" && erste !== "nerv") return false;
      return z.slice(1).some(function (c) {
        return /^lat$/i.test(String(c || "").trim()); });
    }
    function istNervKopf(z) {
      var t = z.join(" ").trim();
      if (!/(motorisch|sensorisch|sensibel)/i.test(t)) return false;
      return z.slice(1).every(function (c) {
        return String(c || "").trim() === ""; }) || z.length === 1;
    }

    for (var i = 0; i < zeilen.length; i++) {
      var z = zeilen[i];
      if (!z || !z.length) continue;
      if (istKopfzeile(z)) {
        var einheitZeile = zeilen[i + 1] || [];
        meinungen = bedeutungen(z, einheitZeile);
        art = artAusBedeutungen(meinungen);
        block = null;
        i++; // Einheiten-Zeile überspringen
        continue;
      }
      if (!meinungen) continue; // vor der ersten Tabelle: Kopfbereich
      if (istNervKopf(z)) {
        var nervText = z.join(" ").trim();
        var seite = /links/i.test(nervText) ? "links"
                  : (/rechts/i.test(nervText) ? "rechts" : "");
        block = { art: art, nervText: nervText, seite: seite, zeilen: [] };
        bloecke.push(block);
        continue;
      }
      // Datenzeile? Erste Zelle = Segmentname, danach mindestens eine Zahl.
      var segment = String(z[0] || "").trim();
      var werteZellen = z.slice(1);
      var hatZahl = werteZellen.some(function (c) {
        return num(c) !== null || istNormText(c); });
      if (!segment || !hatZahl) {
        var rest = z.join(" ").trim();
        // Wiederholte Tabellentitel, Fussnoten, Kurvenbeschriftungen
        // (einzelne Buchstaben) und Seitenzahlen sind kein Verlust.
        if (rest && rest.length >= 4 && rest.length < 160 &&
            /[A-Za-zÄÖÜäöü]{3}/.test(rest) &&
            !/NLG|Reizung|Ableitung|Kurven|^ID:/i.test(rest)) reste.push(rest);
        continue;
      }
      if (!block) {
        block = { art: art, nervText: "(Nerv ohne Titelzeile)", seite: "",
                  zeilen: [] };
        bloecke.push(block);
      }
      var werte = {}, geraetNorm = {};
      for (var k = 0; k < meinungen.length; k++) {
        var m = meinungen[k], zelle = werteZellen[k];
        if (!m || !m.feld) continue;
        if (m.norm) {
          var n = String(zelle || "").trim();
          if (n) geraetNorm[m.feld] = n;
        } else {
          var w = num(zelle);
          if (w !== null) werte[m.feld] = w;
          else if (werte[m.feld] === undefined) werte[m.feld] = null;
        }
      }
      block.zeilen.push({ segment: segment, werte: werte,
                          geraetNorm: geraetNorm });
    }
    // Leere Blöcke (Nerv-Titel ohne Zeilen) fliegen raus.
    bloecke = bloecke.filter(function (b) { return b.zeilen.length; });
    return { patient: patient, bloecke: bloecke, reste: reste };
  }

  function leseKopf(texte) {
    // Der PDF-Leser liefert Bindestriche als eigene Stücke
    // ("Patienten - ID") — für den Kopf wird das vor dem Suchen geheilt.
    var alles = (texte || []).join("\n")
      .replace(/\s*-\s*/g, "-").replace(/\s+([,.])/g, "$1");
    function greif(muster) {
      var m = muster.exec(alles);
      return m ? m[1].trim() : "";
    }
    return {
      name: greif(/Name:\s*(.+?)(?:\s{2,}|\s*Patienten-ID:|\n|$)/),
      id: greif(/Patienten-ID:\s*(\S+)/),
      geburtsdatum: greif(/Geburtsdatum:\s*(\d{1,2}\.\d{1,2}\.\d{4})/),
      untersuchungsdatum:
        greif(/(?:Datum der Untersuchung|Untersuchungsdatum):\s*(\d{1,2}\.\d{1,2}\.\d{4})/)
    };
  }

  // ---- Einstieg: Datei nach Endung an den Format-Leser geben --------------
  function leseDatei(datei) {
    var name = (datei && datei.name || "").toLowerCase();
    return datei.arrayBuffer().then(function (puffer) {
      if (name.endsWith(".docx")) return TB.enmgLeserWord.lese(puffer);
      if (name.endsWith(".pdf")) return TB.enmgLeserPdf.lese(puffer);
      // Ohne Endung: PDF beginnt mit %PDF, Zip mit PK.
      var b = new Uint8Array(puffer);
      if (b[0] === 0x25 && b[1] === 0x50) return TB.enmgLeserPdf.lese(puffer);
      if (b[0] === 0x50 && b[1] === 0x4b) return TB.enmgLeserWord.lese(puffer);
      return Promise.reject(new Error("unbekanntes Dateiformat"));
    }).then(function (roh) {
      return deute(roh.zeilen, roh.texte);
    });
  }

  return { deute: deute, leseDatei: leseDatei, num: num,
           bedeutungen: bedeutungen, leseKopf: leseKopf };
})();
