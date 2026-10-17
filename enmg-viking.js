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
//        18.18: Technik-Sätze („Reizung …") fallen weg, Reste erscheinen
//        nur einmal, das myopathische Muster wird erkannt.
//        GRUNDSATZ: Ein Befund — wird NIE gespeichert oder abgeglichen.

"use strict";
window.TB = window.TB || {};

TB.enmgViking = (function () {
  var NLG_MAX = 90, NLG_MIN = 5, PALMAR_MAX_MM = 120;

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
    var zeilen = [], fehler = 0, i;
    for (i = n + 1; i + n < t.length; i += n + 1) {
      var zellen = t.slice(i, i + n).map(sauber);
      if (sauber(t[i + n]) !== "") fehler++;
      if (zellen.every(function (z) { return z === ""; })) continue;
      zeilen.push(zellen);
    }
    // 18.14: Text NACH der Tabelle (z. B. Näds Myographien, die er im
    // Viking-Bericht unter die sensible Tabelle schreibt)
    var nachher = t.slice(i).join(" ");
    return { kopf: kopf, zeilen: zeilen, fehler: fehler, nachher: nachher };
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

  // ---- Myografie aus Freitext (18.14) --------------------------------------
  // Näd schreibt die Nadel-EMG-Befunde vorerst von Hand in den Viking-
  // Bericht: „M. tibialis anterior links: keine pathologische
  // Spontanaktivität, unauffälliges Interferenzmuster". Erkannt werden
  // Muskel, Seite und drei Merkmale — der Wortlaut bleibt Näds.
  function myografieZeile(z) {
    var m = /^(?:EMG\s+)?(M{1,2}\.\s*[^:]{2,80}?):\s*(.+)$/i.exec(z);
    if (!m) return null;
    var muskel = m[1].replace(/(\S)(links|rechts)\s*$/i, "$1 $2").replace(/\s+/g, " ").trim();
    var seite = /links\s*$/i.test(muskel) ? "links" : (/rechts\s*$/i.test(muskel) ? "rechts" : "");
    var b = m[2].trim(), k = b.toLowerCase();
    var keineSpont = /kein(e)?\s+(eindeutige\s+)?(pathologische\s+)?spontanaktivit/.test(k);
    var spont = !keineSpont && /spontanaktivit|fibrillation|positive scharfe|\bpsw\b/.test(k);
    var fasz = /faszikulation/.test(k) && !/kein(e)?\s+faszikulation/.test(k);
    var neurogen = /neurogen|erhöhte amplitud|riesenpotential/.test(k) ||
      (/gelichtet/.test(k) && !/schmerz|mitarbeit|minderinnervation/.test(k));
    var myopath = /myopath/.test(k) && !/kein(e)?\s+(hinweis\w*\s+auf\s+(ein\w*\s+)?)?myopath/.test(k);
    return { muskel: muskel, seite: seite, befund: b.replace(/\.$/, ""),
             spont: spont, fasz: fasz, neurogen: neurogen, myopath: myopath,
             unspez: /polyphas/.test(k) ? ["Polyphasie"] : [], quelle: "text" };
  }

  // ---- Nadel-EMG-Tabelle des Viking (18.15) -----------------------------------
  // Feld „emg_npp": Kopfzeilen mit verbundenen Zellen, dann je Muskel eine
  // Zeile: Muskel · Einstich · Fib. · PSW · Fasz. · Dauer · Amplitude ·
  // Polyphasie · Muster · Anspannung. Die Spalten werden über die Kopfzeile
  // „Muscle …" gesucht, die Muskelzeilen an „M. …" erkannt. Daraus wird
  // eine Zeile in Näds Wortlaut („keine pathologische Spontanaktivität,
  // unauffälliges Interferenzmuster") plus die Merkmale für die Beurteilung.
  function leer(w) { return !w || /^(keine?|normal|0|-|–|n\.?\s*a\.?)$/i.test(w); }
  function emgTabelle(text) {
    var t = String(text || "").split("\x07").map(sauber), aus = [];
    var k = -1;
    for (var i = 0; i < t.length; i++) if (/^(muscle|muskel)$/i.test(t[i])) { k = i; break; }
    if (k === -1) return aus;
    var kopf = [], kopfO = [];
    for (var j = k; j < t.length && t[j] !== ""; j++) { kopf.push(t[j].toLowerCase()); kopfO.push(t[j]); }
    kopfO[0] = "Muskel";
    var n = kopf.length;
    function sp(re) { for (var x = 0; x < n; x++) if (re.test(kopf[x])) return x; return -1; }
    var S = { einstich: sp(/einstich/), fib: sp(/^fib/), psw: sp(/psw|scharf/), fasz: sp(/fasz/),
              dauer: sp(/dauer/), amp: sp(/amplitude/), poly: sp(/polyphas/),
              muster: sp(/muster/), anspannung: sp(/anspannung/) };
    for (i = k + n; i < t.length; i++) {
      if (!/^M{1,2}\.\s/.test(t[i])) continue;
      var z = t.slice(i, i + n);
      i += n - 1;
      function w(x) { return x >= 0 ? (z[x] || "") : ""; }
      var name = z[0].replace(/\s*\.\s*([RL])\s*$/i, function (a, s1) {
        return s1.toUpperCase() === "R" ? " rechts" : " links"; });
      var seite = /rechts$/.test(name) ? "rechts" : (/links$/.test(name) ? "links" : "");
      var fib = w(S.fib), psw = w(S.psw), fz = w(S.fasz);
      var spont = !leer(fib) || !leer(psw), fasz = !leer(fz);
      var teile = [];
      if (!leer(w(S.einstich))) teile.push("Einstichaktivität " + w(S.einstich));
      teile.push(spont ? "pathologische Spontanaktivität (" +
        [!leer(fib) ? "Fib. " + fib : "", !leer(psw) ? "PSW " + psw : ""].filter(Boolean).join(", ") + ")"
        : "keine pathologische Spontanaktivität");
      if (fasz) teile.push("Faszikulationen (" + fz + ")");
      var neurogen = false, unspez = [];
      var dauer = w(S.dauer).toLowerCase(), amp = w(S.amp).toLowerCase(), poly = w(S.poly);
      if (dauer && !leer(dauer)) {
        teile.push("Potentialdauer " + w(S.dauer));
        if (/verläng|erhöh|lang/.test(dauer)) neurogen = true;
      }
      if (amp && !leer(amp)) {
        teile.push("Amplituden " + w(S.amp));
        if (/erhöh|gross|groß|hoch/.test(amp)) neurogen = true;
      }
      if (!leer(poly)) {
        var pt = /vermehrt/i.test(poly) ? "vermehrt polyphasische Potentiale" : "Polyphasie " + poly;
        teile.push(pt); unspez.push(pt);
      }
      var muster = w(S.muster).toLowerCase(), ansp = w(S.anspannung).toLowerCase();
      // 18.18: myopathisches Muster nur, wenn im SELBEN Muskel kurze
      // Dauer, kleine Amplitude und frühe Rekrutierung zusammenkommen
      // (Näd 15.10.: „kannst Du machen").
      var myopath = /kurz|verkürz|vermindert|erniedrig/.test(dauer) &&
        /klein|niedrig|vermindert|erniedrig|reduz/.test(amp) &&
        /früh|frueh/.test(muster + " " + ansp);
      if (myopath) {
        teile.push("Interferenzmuster " + w(S.muster));
      } else if (/dicht|voll|interferenz/.test(muster) || muster === "") {
        if (muster) teile.push("unauffälliges Interferenzmuster");
      } else {
        teile.push("Interferenzmuster " + w(S.muster) +
          (ansp && !/maxim/.test(ansp) ? " (Anspannung " + w(S.anspannung) + ")" : ""));
        if (/gelichtet|einzel|reduziert/.test(muster) && !/submax|schwach|gering/.test(ansp)) neurogen = true;
      }
      if (myopath) teile.push("myopathisches Muster (kurze, kleine Potentiale, frühe Rekrutierung)");
      // 18.22: die Zeile so, wie sie im Bericht des Geräts steht (Tabelle)
      var zellen = z.slice(0, n); zellen[0] = name;
      aus.push({ muskel: name, seite: seite, befund: teile.join(", "), spont: spont,
                 fasz: fasz, neurogen: neurogen && !myopath, myopath: myopath,
                 unspez: unspez, quelle: "tabelle",
                 tabelle: { kopf: kopfO, zellen: zellen } });
    }
    return aus;
  }

  // 18.18: Die Technik-Sätze der Vorlage („Reizung …, Ableitung mit
  // Oberflächen-/Nadelelektroden") unter den Tabellen braucht Näd im
  // Bericht nicht (15.10.: „ich leite nur selten mit Nadelelektroden ab").
  function istTechnikSatz(z) {
    var t = String(z || "");
    if (/^\s*(reizung|ableitung|stimulation)\b/i.test(t)) return true;
    return /\b(reizung|ableitung)/i.test(t) &&
           /(oberfläch|oberflaech|nadel|elektrod|surface)/i.test(t);
  }

  // ---- Der Deuter ---------------------------------------------------------
  function deute(roh) {
    var ab = abschnitte(roh), f = ab.felder;
    var reste = [], bloecke = [], nachTexte = [];

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
        // 18.14: Der Viking schreibt eine Reizung manchmal auf ZWEI
        // Zeilen — oben Reizort, Latenz und Amplitude, darunter (ohne
        // Reizort) Segment, Distanz und NLG. Diese Fortsetzung gehört zur
        // Zeile darüber (Näds Testbefund 14.10.: sonst „kein SNAP“ → CTS).
        var vor = block.zeilen[block.zeilen.length - 1];
        if (!stim && vor && w.lat === null && w.amp === null &&
            (w.peak === null || w.peak === undefined) &&
            (vor.werte.nlg === null || vor.werte.nlg === undefined)) {
          if (w.nlg !== null) vor.werte.nlg = w.nlg;
          if (w.abstand !== null) vor.werte.abstand = w.abstand;
          if (seg) vor.segmentGeraet = seg;
          einordnen(vor, art);
          return;
        }
        var zeile = { stimulation: stim, segmentGeraet: seg, werte: w, geraetNorm: {} };
        einordnen(zeile, art);
        block.zeilen.push(zeile);
      });
      if (tab.nachher) nachTexte.push(tab.nachher);
    }
    // Beschriftung und Rolle einer Zeile (auch nach dem Zusammenführen)
    function einordnen(zeile, art) {
      var stim = zeile.stimulation || "", seg = zeile.segmentGeraet || "", w = zeile.werte;
      zeile.segment = stim && seg && seg.indexOf("-") > 0 ? stim + " (" + seg + ")" : (stim || seg);
      // 18.23: gemessen (Distanz), aber keine Antwort → nicht ableitbar
      var leer = function (k) { return w[k] === null || w[k] === undefined; };
      if (leer("lat") && leer("amp") && leer("peak") && leer("nlg")) zeile.na = { lat: true, amp: true };
      else delete zeile.na;
      zeile.ohneNorm = false; zeile.vergleich = ""; zeile.unplausibel = false;
      var segKlein = (seg + " " + stim).toLowerCase();
      // Palmar = Reizort Hohlhand (Vergleichsmessung, kurze Strecke). Die
      // Viking-Beschriftung ist nicht verlässlich (Näds Vorlage nennt
      // auch die Handgelenk-Reizung „Palmar“): Ab 120 mm Distanz gilt die
      // Zeile als Standardmessung Handgelenk–Finger.
      if (art === "sens" && /palmar/i.test(stim) &&
          (w.abstand === null || w.abstand === undefined || w.abstand < PALMAR_MAX_MM)) {
        zeile.ohneNorm = true; zeile.vergleich = "palmar";
      }
      if (art === "sens" && /dig\s*iv/.test(segKlein)) {
        zeile.ohneNorm = true; zeile.vergleich = "ringfinger";
      }
      if (w.nlg !== null && w.nlg !== undefined && (w.nlg > NLG_MAX || w.nlg < NLG_MIN)) {
        zeile.ohneNorm = true; zeile.unplausibel = true;
      }
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
    var myo = emgTabelle(f.emg_npp), freitext = [];
    ab.frei.concat(nachTexte).forEach(function (t) {
      String(t).replace(/[\x07\x0C]/g, " ").split(/[\r\x0B]+/).forEach(function (zeile) {
        var z = sauber(zeile);
        if (!z) return;
        var m = myografieZeile(z);
        if (m) myo.push(m);
        else if (!/^(myograph|myografie|elektromyogra|emg:?$)/i.test(z) &&
                 !istTechnikSatz(z)) freitext.push(z);
      });
    });
    // Bereits ausgefüllte Beurteilung (Vorlage der Kollegin) — nur Hinweis
    var vorhanden = sauber(String(f.conclusn || "").replace(/\x07/g, " "))
      .replace(/^Beurteilung:\s*/i, "");

    var gesehen = {};
    reste = reste.filter(function (r) {
      var k = sauber(r).toLowerCase();
      if (!k || gesehen[k]) return false;
      gesehen[k] = true; return true;
    });
    return { patient: patient, bloecke: bloecke, reste: reste,
             fragestellungText: frage, freitext: freitext, myografie: myo,
             vorhandeneBeurteilung: vorhanden, format: "viking" };
  }

  function lese(puffer) {
    return deute(TB.enmgLeserDoc.wordText(puffer));
  }

  return { lese: lese, deute: deute, tabelle: tabelle, nervTitel: nervTitel,
           abschnitte: abschnitte, myografieZeile: myografieZeile,
           emgTabelle: emgTabelle, istTechnikSatz: istTechnikSatz };
})();
