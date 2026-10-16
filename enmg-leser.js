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
//        18.18: Wiederholungen der Kurvenseiten werden ausgefiltert.
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
    var emg = false, myografie = [];

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
        emg = false;
        var einheitZeile = zeilen[i + 1] || [];
        meinungen = bedeutungen(z, einheitZeile);
        art = artAusBedeutungen(meinungen);
        block = null;
        i++; // Einheiten-Zeile überspringen
        continue;
      }
      // 18.20: Nadel-EMG-Tabelle des Keypoint („EMG Befunde“, Kopf
      // „Muskel Interpretation Aktivität Fib PSW Fasz Amp IP Hinweise“,
      // Zeilen „Rechts Abd pollicis brevis subakute Denervation Erhöht
      // 2/10 2/10 1/10 3.5 mV Voll“ — Näds Bild 16.10.).
      var zt = z.map(function (c) { return String(c || ""); }).join(" ")
        .replace(/\s+/g, " ").trim();
      if (/^muskel\b/i.test(zt) && /\bfib\b/i.test(zt) && /\bpsw\b/i.test(zt)) {
        emg = true; continue;
      }
      if (/^emg[- ]?befunde?$/i.test(zt) ||
          (/^einsti/i.test(zt) && /spontan/i.test(zt))) continue;
      if (emg) {
        var mz = emgZeile(zt);
        if (mz) { myografie.push(mz); continue; }
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
    return { patient: patient, bloecke: bloecke, reste: ohneRauschen(reste, bloecke),
             myografie: myografie };
  }

  // ---- 18.20: eine Zeile der Keypoint-Nadel-EMG-Tabelle -----------------
  // Spalten: Seite+Muskel · Interpretation · Einstich-Aktivität · Fib ·
  // PSW · Fasz (je „n/10“) · Amplitude · IP (Interferenzmuster) ·
  // Hinweise. Die Interpretation steht zwischen Muskelname und
  // Aktivität und wird an bekannten Fachwörtern erkannt.
  var GRAD = "(\\d+\\s*/\\s*\\d+|[0-4]\\+?|\\+{1,4}|-|–)";
  // 18.21 (Näds Bild 16.10.): Die Spalte „Einstich Aktivität“ ist meist
  // LEER, „Normal“ steht in der Interpretation. Darum zuerst nur die drei
  // Spontanaktivitäts-Werte als Anker; Muskel, Interpretation und
  // Einstich werden dann von hinten aus dem Text davor gelöst.
  var EMG_RE = new RegExp("^(rechts|links|re\\.?|li\\.?)\\s+(.+?)\\s+" +
    GRAD + "\\s+" + GRAD + "\\s+" + GRAD + "\\s*(.*)$", "i");
  var AKT_RE = /\s+(erhöht|erhoeht|vermindert|reduziert|fehlend|gesteigert|normal)$/i;
  var INTERP_RE = /\s+((?:(?:akute|subakute|chronische?|floride|frische|alte)\s+)?(?:denervation|denervierung)|chronisch[- ]neurogen\w*|neurogen\w*|myopath\w*|reinnervation\w*|normal|unauffällig|pathologisch)$/i;
  function grad(t) {
    var m = /(\d+)\s*\/\s*\d+/.exec(t || "");
    if (m) return +m[1];
    if (/\+/.test(t || "")) return (t.match(/\+/g) || []).length;
    var n = parseInt(t, 10);
    return isNaN(n) ? 0 : n;
  }
  function emgZeile(t) {
    var m = EMG_RE.exec(t);
    if (!m) return null;
    var seite = /^r/i.test(m[1]) ? "rechts" : "links";
    var name = m[2], interp = "", akt = "";
    var mk = AKT_RE.exec(name);
    if (mk) {
      var ohne = name.slice(0, mk.index);
      // „normal“ am Ende ist nur dann die Einstich-Aktivität, wenn davor
      // noch eine Interpretation steht („… Normal Normal“).
      if (!/^normal$/i.test(mk[1]) || INTERP_RE.test(ohne)) { akt = mk[1]; name = ohne; }
    }
    var mi = INTERP_RE.exec(name);
    if (mi && mi.index > 0) { interp = mi[1]; name = name.slice(0, mi.index); }
    var fib = m[3], psw = m[4], fz = m[5], rest = m[6] || "";
    var amp = "", ip = "", hinweis = "";
    var ma = /^([\d.,]+\s*[mµu]?V)\s*/i.exec(rest);
    if (ma) { amp = ma[1]; rest = rest.slice(ma[0].length); }
    var mp = /^(voll|dicht|gelichtet|reduziert|einzel\w*|gemischt|übergang\w*|fehlend|keine?)\b\s*/i.exec(rest);
    if (mp) { ip = mp[1]; rest = rest.slice(mp[0].length); }
    hinweis = rest.trim();
    var spont = grad(fib) > 0 || grad(psw) > 0 || /denerv/i.test(interp);
    var fasz = grad(fz) > 0;
    var ipk = ip.toLowerCase(), ik = interp.toLowerCase();
    var myopath = /myopath/.test(ik);
    var neurogen = !myopath && (/neurogen|chronisch|reinnervation/.test(ik) ||
                                /gelichtet|einzel|reduziert/.test(ipk));
    var teile = [];
    if (akt && !/^normal$/i.test(akt)) teile.push("Einstichaktivität " + akt.toLowerCase());
    teile.push(spont && (grad(fib) > 0 || grad(psw) > 0)
      ? "pathologische Spontanaktivität (Fib. " + fib + ", PSW " + psw + ")"
      : (spont ? "pathologische Spontanaktivität" : "keine pathologische Spontanaktivität"));
    if (fasz) teile.push("Faszikulationen (" + fz + ")");
    if (amp) teile.push("Amplitude " + amp);
    if (ip) teile.push(/^voll$/i.test(ip) ? "volles Interferenzmuster"
      : (/^dicht$/i.test(ip) ? "dichtes Interferenzmuster" : "Interferenzmuster " + ip.toLowerCase()));
    var befund = teile.join(", ") + (interp && !/^(normal|unauffällig)$/i.test(interp) ? " – " + interp : "") +
      (hinweis ? " (" + hinweis + ")" : "");
    return { muskel: "M. " + name.trim() + " " + seite, seite: seite, befund: befund,
             spont: spont, fasz: fasz, neurogen: neurogen, myopath: myopath,
             unspez: [], quelle: "keypoint" };
  }

  // 18.18: Die Kurvenseiten des Keypoint wiederholen Segment- und
  // Nervnamen, Skalen („2mV/D 2ms/D") und den Patientenkopf — das ist
  // kein Verlust und gehört nicht unter „Nicht zugeordnete Zeilen".
  // Was übrig bleibt, erscheint genau einmal.
  function schluessel(t) {
    return String(t || "").toLowerCase().replace(/\s*([-|:])\s*/g, "$1")
      .replace(/\s+/g, " ").trim();
  }
  function ohneRauschen(reste, bloecke) {
    var bekannt = {}, gesehen = {};
    bloecke.forEach(function (b) {
      bekannt[schluessel(b.nervText)] = true;
      b.zeilen.forEach(function (z) {
        bekannt[schluessel(z.segment)] = true;
        bekannt[schluessel(String(z.segment || "").split("|")[0])] = true;
      });
    });
    // 18.19 (Näds Bild 16.10.): Kurvenseiten schreiben dieselben Teile
    // anders zusammen („Rechts Peroneus profundus", „Dist. CF - EDB",
    // „Ankle - Abd hal Ankle - Abd hal"). Besteht eine Zeile NUR aus
    // bekannten Bausteinen — Segment-Teilen, Wörtern der Nerv-Titel,
    // Seite und Art —, ist sie Rauschen.
    var teile = {};
    function merk(t) {
      var x = String(t || "").toLowerCase().replace(/\s+/g, " ").trim();
      if (x.length >= 2) teile[x] = true;
    }
    bloecke.forEach(function (b) {
      String(b.nervText || "").split(/\s+/).forEach(merk);
      b.zeilen.forEach(function (z) {
        String(z.segment || "").split(/\s*[-|]\s*/).forEach(merk);
      });
    });
    ["rechts", "links", "motorisch", "sensorisch", "sensibel", "motor", "sens"].forEach(merk);
    var liste = Object.keys(teile).sort(function (a, b) { return b.length - a.length; });
    function nurBekanntes(r) {
      var t = " " + String(r).replace(/\s+/g, " ") + " ";
      liste.forEach(function (x) {
        var re = new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        t = t.replace(re, " ");
      });
      // 18.20: Was übrig bleibt, sind höchstens Kürzel wie „HG“ (Näds
      // Bild 16.10.: „HG - APB“ neben „Handgelenk - APB“).
      var stuecke = t.split(/[\s\-|.,:;()\/]+/).filter(Boolean);
      return stuecke.every(function (s) { return /^[A-ZÄÖÜ]{1,3}$/.test(s); });
    }
    return reste.filter(function (r) {
      var k = schluessel(r);
      if (!k || bekannt[k] || gesehen[k]) return false;
      if (nurBekanntes(r)) return false;
      if (/^([\d.,]+\s*(mv|µv|uv|ms|s)\s*\/\s*d\s*)+$/i.test(r.trim())) return false;
      if (/^(seite|page)\s*\d+/i.test(r.trim())) return false;
      // 18.20: Mittelungs-Angaben der Kurvenseiten („Mitt.: 5 Mitt.: 1“)
      if (/^(mitt\.?:?\s*\d+\s*)+$/i.test(r.trim())) return false;
      if (/^(patientendaten|motorische kurven|sensible kurven|sensorische kurven)$/i.test(r.trim()))
        return false;
      if (/(name:|geburtsdatum|patienten\s*-?\s*id|datum der untersuchung)/i.test(r))
        return false;
      gesehen[k] = true;
      return true;
    });
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
      // 18.13: altes Word (.doc) = Viking der Praxis — eigener Deuter,
      // liefert das fertige Lese-Ergebnis.
      if (name.endsWith(".doc") || TB.enmgLeserDoc.istDoc(new Uint8Array(puffer)))
        return { fertig: TB.enmgViking.lese(puffer) };
      if (name.endsWith(".docx")) return TB.enmgLeserWord.lese(puffer);
      if (name.endsWith(".pdf")) return TB.enmgLeserPdf.lese(puffer);
      // Ohne Endung: PDF beginnt mit %PDF, Zip mit PK.
      var b = new Uint8Array(puffer);
      if (b[0] === 0x25 && b[1] === 0x50) return TB.enmgLeserPdf.lese(puffer);
      if (b[0] === 0x50 && b[1] === 0x4b) return TB.enmgLeserWord.lese(puffer);
      return Promise.reject(new Error("unbekanntes Dateiformat"));
    }).then(function (roh) {
      if (roh.fertig) return roh.fertig;
      return deute(roh.zeilen, roh.texte);
    });
  }

  // 18.2: Nur den TEXT einer Datei liefern (für das Einlese-Feld des
  // Diagnoseblocks und künftige Werkzeuge) — dieselben Leser, ohne den
  // ENMG-Deuter dahinter. Auch hier gilt: nichts wird gespeichert.
  function leseText(datei) {
    var name = (datei && datei.name || "").toLowerCase();
    return datei.arrayBuffer().then(function (puffer) {
      var b = new Uint8Array(puffer);
      if (TB.enmgLeserDoc.istDoc(b))
        return { texte: [TB.enmgLeserDoc.klartext(TB.enmgLeserDoc.wordText(puffer))] };
      if (name.endsWith(".pdf") || (b[0] === 0x25 && b[1] === 0x50))
        return TB.enmgLeserPdf.lese(puffer);
      if (name.endsWith(".docx") || (b[0] === 0x50 && b[1] === 0x4b))
        return TB.enmgLeserWord.lese(puffer);
      return Promise.reject(new Error("unbekanntes Dateiformat"));
    }).then(function (roh) {
      // roh.texte enthält bereits jede Zeile als Klartext (auch die
      // Tabellenzeilen) — die Zellen-Zeilen kämen nur doppelt dazu.
      return (roh.texte || []).join("\n");
    });
  }

  return { deute: deute, leseDatei: leseDatei, leseText: leseText, num: num,
           bedeutungen: bedeutungen, leseKopf: leseKopf, ohneRauschen: ohneRauschen };
})();
