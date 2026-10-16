// Datei: enmg.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Das Herz des ENMG-Werks: verwaltet die Normwerte (Einstellungs-
//        Wert enmgNormwerte, synct auf alle Geräte — enthält NIE
//        Patientendaten), rechnet das Patientenalter aus Geburts- und
//        Untersuchungsdatum, holt den Grenzwert je Nerv/Zeile/Alter
//        (linear zwischen den 5-Jahres-Stützstellen), ordnet die
//        Geräte-Segmente den Normzeilen zu (Schlüsselwörter, sonst
//        Reihenfolge distal → proximal) und färbt jeden Messwert:
//        rot = ausserhalb, grün = innerhalb, schwarz = kein Normwert,
//        seit 18.17 orange = GRENZWERTIG (bis 5 % ausserhalb der
//        Grenze, Näds Entscheid 14.10. — zählt in der Beurteilung
//        nicht als pathologisch). Lieber schwarz als falsch gefärbt
//        (Lehre I2). Dazu die Ausgabe als Tabelle (HTML mit
//        Inline-Stilen, Lehre I1, und reiner Text); seit 18.17 steht
//        die Grenze als eigene Norm-Spalte direkt neben jedem
//        bewerteten Messwert (E1-Entscheid (a), 14.10.).
//        18.18: Chen-Amplituden (motorisch neu, sensibel antidrom) mit
//        Altersgruppen ("stufig") und einer einmaligen Nachführung einer
//        schon gespeicherten Normwert-Ablage; Nerven alphabetisch, links
//        vor rechts (Näd 15.10., wie Keypoint); der Bericht hat EINE
//        Tabelle motorisch und EINE sensibel mit dem Nerv als grauer
//        Zwischenzeile (Näds Keypoint-Vorbild 15.10.).
//        GRUNDSATZ: Ein eingelesener Export ist ein
//        Patientenbefund — er wird NIE gespeichert, NIE abgeglichen.

"use strict";
window.TB = window.TB || {};

TB.enmg = (function () {
  var ROT = "#c00000", GRUEN = "#1a7a1a", ORANGE = "#b06f00";

  // ---- Ablage der Normwerte (nie Patientendaten) ----------------------
  function normwerte() {
    var g = TB.speicher.einstellung("enmgNormwerte", null);
    if (g && g.nerven && (g.stand || "") < TB.normwerteGrundlage.stand) {
      // 18.18: Eine gespeicherte Ablage aus der Zeit vor Chen bekommt
      // EINMAL die neuen Amplituden-Zeilen; Näds übrige Werte bleiben.
      var neu = nachfuehren(g);
      try { speichereNormwerte(neu); } catch (e) { /* still */ }
      return neu;
    }
    return g || TB.normwerteGrundlage;
  }
  // Reine Funktion (ohne Speichern) — auch für den Selbsttest.
  function nachfuehren(alt) {
    var G = TB.normwerteGrundlage, ids = G.nachfuehrung1818 || [];
    var n = JSON.parse(JSON.stringify(alt));
    function kopie(x) { return JSON.parse(JSON.stringify(x)); }
    G.nerven.forEach(function (gn) {
      var sn = null;
      n.nerven.forEach(function (x) { if (x.id === gn.id) sn = x; });
      if (!sn) { n.nerven.push(kopie(gn)); return; }
      gn.zeilen.forEach(function (gz, gi) {
        if (ids.indexOf(gz.id) === -1) return;
        var idx = -1;
        sn.zeilen.forEach(function (z, i) { if (z.id === gz.id) idx = i; });
        if (idx !== -1) { sn.zeilen[idx] = kopie(gz); return; }
        // Neue Zeile an dieselbe Stelle wie in der Grundausstattung
        var vorId = gi > 0 ? gn.zeilen[gi - 1].id : null, pos = -1;
        sn.zeilen.forEach(function (z, i) { if (z.id === vorId) pos = i; });
        sn.zeilen.splice(pos + 1, 0, kopie(gz));
      });
      ["motor", "sens"].forEach(function (art) {
        if (!gn[art]) return;
        if (!sn[art]) { sn[art] = kopie(gn[art]); return; }
        ["amp", "ampAusser"].forEach(function (k) {
          if (gn[art][k] !== undefined) sn[art][k] = kopie(gn[art][k]);
        });
      });
    });
    n.stand = G.stand;
    n.bemerkung = G.bemerkung;
    return n;
  }
  function speichereNormwerte(n) {
    TB.speicher.setzeEinstellung("enmgNormwerte", n);
    if (TB.abgleich) TB.abgleich.anstossen();
  }
  function grundausstattung() {
    var frisch = JSON.parse(JSON.stringify(TB.normwerteGrundlage));
    speichereNormwerte(frisch);
    return frisch;
  }
  function quelle() {
    return TB.speicher.einstellung("enmgNormQuelle", "") ||
           normwerte().quelleVorgabe || TB.normwerteGrundlage.quelleVorgabe;
  }
  function setzeQuelle(name) {
    TB.speicher.setzeEinstellung("enmgNormQuelle", name || "");
    if (TB.abgleich) TB.abgleich.anstossen();
  }

  // ---- Alter -----------------------------------------------------------
  function datumAusText(t) {
    var m = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(t || "");
    if (!m) return null;
    return new Date(+m[3], +m[2] - 1, +m[1]);
  }
  function alterAusDaten(gebText, untText) {
    var g = datumAusText(gebText), u = datumAusText(untText);
    if (!g || !u) return null;
    var a = u.getFullYear() - g.getFullYear();
    var vorGeburtstag = (u.getMonth() < g.getMonth()) ||
      (u.getMonth() === g.getMonth() && u.getDate() < g.getDate());
    if (vorGeburtstag) a -= 1;
    return (a >= 0 && a < 130) ? a : null;
  }

  // ---- Grenzwert mit linearer Zwischenrechnung -------------------------
  function zeileVonNerv(nerv, zeileId) {
    for (var i = 0; i < nerv.zeilen.length; i++)
      if (nerv.zeilen[i].id === zeileId) return nerv.zeilen[i];
    return null;
  }
  function grenzeFuer(zeile, alter) {
    if (!zeile) return null;
    if (typeof zeile.fest === "number") return zeile.fest;
    if (alter === null || alter === undefined) return null;
    var A = normwerte().alter, W = zeile.werte;
    if (!A || !W || W.length !== A.length) return null;
    if (zeile.stufig) {
      // 18.18: Altersgruppe — Wert der Stützstelle am oder unter dem Alter
      var st = W[0];
      for (var j = 0; j < A.length; j++) if (alter >= A[j]) st = W[j];
      return st;
    }
    if (alter <= A[0]) return W[0];
    if (alter >= A[A.length - 1]) return W[W.length - 1];
    for (var i = 1; i < A.length; i++) {
      if (alter <= A[i]) {
        var t = (alter - A[i - 1]) / (A[i] - A[i - 1]);
        return W[i - 1] + (W[i] - W[i - 1]) * t;
      }
    }
    return W[W.length - 1];
  }
  function rund2(x) { return Math.round(x * 100) / 100; }

  // ---- Nerv erkennen ----------------------------------------------------
  function erkenneNerv(text) {
    var t = (text || "").toLowerCase();
    var nerven = normwerte().nerven || [];
    for (var i = 0; i < nerven.length; i++) {
      var e = nerven[i].erkennen || [];
      for (var k = 0; k < e.length; k++)
        if (t.indexOf(e[k]) !== -1) return nerven[i];
    }
    return null;
  }

  // ---- Segmente den Normzeilen zuordnen ---------------------------------
  // Erst Schlüsselwörter, dann Reihenfolge distal → proximal. Was nicht
  // sicher zuzuordnen ist, bleibt OHNE Zuordnung (= schwarz) — lieber
  // sichtbar unvollständig als unsichtbar falsch.
  function ordneNlg(zeilen, reihe, schluessel) {
    var zuordnung = {}, vergeben = {};
    zeilen.forEach(function (z, i) {
      if (z.werte.nlg === null || z.werte.nlg === undefined) return;
      if (z.ohneNorm) return;   // 18.13: Vergleichs-/unplausible Zeile
      var seg = (z.segment || "").toLowerCase();
      Object.keys(schluessel || {}).forEach(function (zielId) {
        if (zuordnung[i] || vergeben[zielId]) return;
        var tokens = schluessel[zielId];
        for (var k = 0; k < tokens.length; k++) {
          if (seg.indexOf(tokens[k]) !== -1) {
            zuordnung[i] = zielId; vergeben[zielId] = true; return;
          }
        }
      });
    });
    var naechste = 0;
    zeilen.forEach(function (z, i) {
      if (z.werte.nlg === null || z.werte.nlg === undefined) return;
      if (z.ohneNorm) return;
      if (zuordnung[i]) return;
      while (naechste < reihe.length && vergeben[reihe[naechste]]) naechste++;
      if (naechste < reihe.length) {
        zuordnung[i] = reihe[naechste]; vergeben[reihe[naechste]] = true;
      }
    });
    return zuordnung;
  }

  // 18.17: bis 5 % ausserhalb der Grenze heisst „grenzwertig" (orange)
  // und zählt in der Beurteilung nicht als pathologisch (Näd 14.10.;
  // Beispiel: Suralis 44 m/s bei Grenze 44.8 → grenzwertig).
  function farbeFuer(wert, grenze, richtung) {
    if (wert === null || wert === undefined || grenze === null) return null;
    var drueber = (richtung === "max") ? (wert - grenze) : (grenze - wert);
    if (drueber <= 0) return "gruen";
    return (drueber <= Math.abs(grenze) * 0.05) ? "grenzwertig" : "rot";
  }
  function bewertung(nerv, zeileId, wert, alter) {
    if (!nerv || wert === null || wert === undefined) return null;
    var zeile = zeileVonNerv(nerv, zeileId);
    if (!zeile) return null;
    var g = grenzeFuer(zeile, alter);
    if (g === null) return null;
    return { farbe: farbeFuer(wert, g, zeile.richtung),
             grenze: rund2(g), richtung: zeile.richtung,
             zeileName: zeile.name, zeileId: zeile.id };
  }

  function ampAusgenommen(regeln, z, block) {
    var t = ((z.segment || "") + " " + (z.segmentGeraet || "") + " " +
             (block.nervText || "")).toLowerCase();
    return (regeln.ampAusser || []).some(function (w) {
      return t.indexOf(w) !== -1; });
  }

  // ---- 18.18: Nerv-Anzeige und Reihenfolge ------------------------------
  // „Medianus Motorisch Rechts" (Keypoint) → „N. medianus" + „rechts";
  // Viking liefert Name und Seite schon getrennt. Zusätze, die nicht
  // Nerv/Art/Seite sind, bleiben in Klammern stehen (nichts geht verloren).
  function nervAnzeige(block) {
    var nerv = erkenneNerv(block.nervText);
    var name = block.nervName || "";
    if (!name) {
      var rest = String(block.nervText || "").split(/\s+/).filter(function (w) {
        var k = w.toLowerCase().replace(/[(),.:;]/g, "");
        if (!k) return false;
        if (/^(motorisch|sensorisch|sensibel|motor|sens|links|rechts|li|re|n)$/.test(k))
          return false;
        if (nerv && (nerv.erkennen || []).some(function (e) {
              return k.indexOf(e) !== -1; })) return false;
        return true;
      }).join(" ");
      if (nerv) name = nerv.name + (rest ? " (" + rest + ")" : "");
      else name = rest || String(block.nervText || "");
    }
    return { name: name, seite: block.seite || "" };
  }
  function nervZeile(block) {
    var a = nervAnzeige(block);
    return a.name + (a.seite ? " " + a.seite : "");
  }
  // Alphabetisch nach Nerv, dann links vor rechts (Näd 15.10.); bei
  // Gleichstand bleibt die Geräte-Reihenfolge (stabil).
  function sortiere(bloecke) {
    var RANG = { links: 0, rechts: 1 };
    return bloecke.map(function (b, i) {
      var a = nervAnzeige(b);
      return { b: b, i: i, k: a.name.replace(/^n\.\s*/i, "").toLowerCase(),
               s: RANG[a.seite] !== undefined ? RANG[a.seite] : 2 };
    }).sort(function (x, y) {
      var c = x.k.localeCompare(y.k, "de");
      if (c) return c;
      if (x.s !== y.s) return x.s - y.s;
      return x.i - y.i;
    }).map(function (x) { return x.b; });
  }

  // ---- Ein ganzes Lese-Ergebnis bewerten --------------------------------
  function bewerte(ergebnis) {
    var alter = alterAusDaten(ergebnis.patient.geburtsdatum,
                              ergebnis.patient.untersuchungsdatum);
    ergebnis.alter = alter;
    ergebnis.bloecke = sortiere(ergebnis.bloecke || []);
    (ergebnis.bloecke || []).forEach(function (block) {
      var nerv = erkenneNerv(block.nervText);
      block.nervId = nerv ? nerv.id : null;
      block.zeilen.forEach(function (z) { z.bew = z.bew || {}; });
      if (!nerv) return;
      var regeln = (block.art === "motor") ? nerv.motor : nerv.sens;
      if (!regeln) return;
      var zuordnung = ordneNlg(block.zeilen, regeln.nlgReihe || [],
                               regeln.schluessel || {});
      var fGesehen = 0;
      block.zeilen.forEach(function (z, i) {
        z.bew = {};
        if (block.art === "motor") {
          if (i === 0 && regeln.latenz)
            z.bew.lat = bewertung(nerv, regeln.latenz, z.werte.lat, alter);
          // 18.18: motorische Amplitude (Chen) an der distalen Reizung —
          // nicht bei einem anderen Ableitmuskel (z. B. Tib. ant.).
          if (i === 0 && regeln.amp && !ampAusgenommen(regeln, z, block))
            z.bew.amp = bewertung(nerv, regeln.amp, z.werte.amp, alter);
          if (zuordnung[i])
            z.bew.nlg = bewertung(nerv, zuordnung[i], z.werte.nlg, alter);
          if (z.werte.fLat !== null && z.werte.fLat !== undefined &&
              regeln.f && regeln.f[fGesehen]) {
            z.bew.fLat = bewertung(nerv, regeln.f[fGesehen], z.werte.fLat, alter);
            fGesehen++;
          }
        } else {
          if (zuordnung[i])
            z.bew.nlg = bewertung(nerv, zuordnung[i], z.werte.nlg, alter);
          // Die Amplituden-Norm gilt für das distale Segment — das ist
          // die Zeile, die die erste Normzeile der Reihe erhalten hat.
          if (regeln.amp && zuordnung[i] === (regeln.nlgReihe || [])[0])
            z.bew.amp = bewertung(nerv, regeln.amp, z.werte.amp, alter);
        }
      });
    });
    return ergebnis;
  }

  // ---- Ausgabe: HTML (Inline-Stile) und reiner Text ----------------------
  function zahl(w) {
    return (w === null || w === undefined) ? "" : String(w);
  }
  // 18.17: Die Grenze steht nicht mehr als graue Klammer am Wert,
  // sondern in der eigenen Norm-Spalte daneben (E1 = (a)).
  function wertHtml(w, bew) {
    if (w === null || w === undefined) return "";
    if (!bew || !bew.farbe) return zahl(w);
    var farbe = bew.farbe === "rot" ? ROT :
                bew.farbe === "grenzwertig" ? ORANGE : GRUEN;
    return '<span style="color:' + farbe + ';font-weight:' +
      (bew.farbe === "rot" ? "bold" : "normal") + '">' + zahl(w) + '</span>';
  }
  function wertText(w, bew) {
    if (w === null || w === undefined) return "";
    if (!bew || !bew.farbe) return zahl(w);
    return zahl(w) + (bew.farbe === "rot" ? " (!)" :
      bew.farbe === "grenzwertig" ? " (grenzwertig)" : "");
  }
  // Inhalt der Norm-Spalte: „≤ 4.2" bzw. „≥ 50" — leer ohne Bewertung.
  function normHtml(bew) {
    if (!bew || bew.grenze === null || bew.grenze === undefined) return "";
    return '<span style="color:#808080;font-size:8pt">' +
      (bew.richtung === "max" ? "&le; " : "&ge; ") + bew.grenze + "</span>";
  }
  function normText(bew) {
    if (!bew || bew.grenze === null || bew.grenze === undefined) return "";
    return (bew.richtung === "max" ? "<= " : ">= ") + bew.grenze;
  }
  var TD = '<td style="border:1px solid #808080;padding:2px 6px;' +
           'font-family:Arial;font-size:10pt;text-align:right">';
  var TDL = '<td style="border:1px solid #808080;padding:2px 6px;' +
            'font-family:Arial;font-size:10pt;text-align:left">';
  var TH = '<td style="border:1px solid #808080;padding:2px 6px;' +
           'font-family:Arial;font-size:10pt;font-weight:bold;' +
           'background-color:#efefef;text-align:left">';
  // 18.13: Spalten je Block — nur, was das Gerät auch liefert (Keypoint:
  // Dauer; Viking: Fläche, Abstand, Peak). Bildschirm und Kopie benutzen
  // dieselbe Liste.
  function spalten(block) {
    var T = TB.enmgTexte;
    var alle = block.art === "motor"
      ? [["segment", T.spalteSegment, false], ["lat", T.spalteLat, true],
         ["amp", T.spalteAmpM, true], ["dur", T.spalteDur, false],
         ["areaDiff", T.spalteArea, false], ["abstand", T.spalteAbstand, false],
         ["nlg", T.spalteNlg, true], ["fLat", T.spalteFLat, true]]
      : [["segment", T.spalteSegment, false], ["abstand", T.spalteAbstand, false],
         ["lat", T.spalteLat, false], ["peak", T.spaltePeak, false],
         ["amp", T.spalteAmpU, true], ["nlg", T.spalteNlg, true]];
    var aus = [];
    alle.filter(function (a) {
      if (a[0] === "segment") return true;
      return block.zeilen.some(function (z) {
        return z.werte[a[0]] !== null && z.werte[a[0]] !== undefined; });
    }).forEach(function (a) {
      aus.push({ feld: a[0], titel: a[1], bewertet: a[2] });
      // 18.17 (E1 = (a)): hinter jedem bewerteten Messwert eine eigene
      // Norm-Spalte — aber nur, wenn in diesem Block überhaupt eine
      // Bewertung dieser Spalte vorliegt (sonst bliebe sie ganz leer).
      if (a[2] && block.zeilen.some(function (z) {
            return z.bew && z.bew[a[0]]; }))
        aus.push({ feld: a[0], titel: T.spalteNorm, norm: true });
    });
    return aus;
  }
  // 18.18: Spalten über ALLE Blöcke einer Art (eine gemeinsame Tabelle)
  function spaltenFuerArt(bloecke, art) {
    var alle = [];
    bloecke.forEach(function (b) { alle = alle.concat(b.zeilen); });
    return spalten({ art: art, zeilen: alle });
  }
  var TDN = '<td style="border:1px solid #808080;padding:2px 6px;' +
            'font-family:Arial;font-size:10pt;background-color:#d9d9d9;' +
            'text-align:left">';
  function esc(t) {
    return String(t === null || t === undefined ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // 18.18 (Näd 15.10., Vorbild Keypoint): EINE Tabelle motorisch und EINE
  // sensibel; der Nerv steht als graue Zwischenzeile über seinen Zeilen,
  // die Segment-Spalte ist breit genug (30 %). Keine Sätze „Reizung …".
  function artTabelle(bloecke, art) {
    var T = TB.enmgTexte;
    var sp = spaltenFuerArt(bloecke, art);
    var html = '<p style="font-family:Arial;font-size:10pt;margin:8px 0 2px"><b>' +
      (art === "motor" ? T.motorTitel : T.sensTitel) + "</b></p>";
    var text = [art === "motor" ? T.motorTitel : T.sensTitel];
    var h = '<table style="border-collapse:collapse;width:100%;margin-bottom:8px">' +
      "<tr>" + sp.map(function (s, i) {
        return (i === 0 ? TH.replace('style="', 'style="width:30%;') : TH) +
          s.titel + "</td>"; }).join("") + "</tr>";
    text.push(sp.map(function (s) { return s.titel; }).join("  |  "));
    bloecke.forEach(function (block) {
      h += '<tr>' + TDN.replace("<td ", '<td colspan="' + sp.length + '" ') +
        "<b>" + esc(nervZeile(block)) + "</b></td></tr>";
      text.push(nervZeile(block));
      block.zeilen.forEach(function (z) {
        var w = z.werte, b = z.bew || {};
        h += "<tr>" + sp.map(function (s) {
          if (s.feld === "segment") return TDL + esc(z.segment) + "</td>";
          if (s.norm) return TD + normHtml(b[s.feld]) + "</td>";
          return TD + (s.bewertet ? wertHtml(w[s.feld], b[s.feld]) : zahl(w[s.feld])) + "</td>";
        }).join("") + "</tr>";
        text.push(sp.map(function (s) {
          if (s.feld === "segment") return z.segment;
          if (s.norm) return normText(b[s.feld]);
          return s.bewertet ? wertText(w[s.feld], b[s.feld]) : zahl(w[s.feld]);
        }).join("  |  "));
      });
    });
    h += "</table>";
    return { html: html + h, text: text.join("\n") };
  }
  function tabelleHtmlText(ergebnis) {
    // 18.19 (Näd 16.10.): Die Patientenzeile gehört nicht in den Befund —
    // sie steht nur oben im Fenster (zur Kontrolle vor dem Übergeben).
    var T = TB.enmgTexte, html = [], text = [];
    ["motor", "sens"].forEach(function (art) {
      var bl = (ergebnis.bloecke || []).filter(function (b) {
        return (b.art === "motor") === (art === "motor"); });
      if (!bl.length) return;
      var t = artTabelle(bl, art);
      html.push(t.html); text.push(t.text, "");
    });
    var q = T.quelleZeile.replace("%s", quelle());
    // 18.19: Normwert-Quelle kursiv (Näd 16.10.)
    html.push('<p style="font-family:Arial;font-size:8pt;color:#808080"><i>' +
      esc(q) + "</i></p>");
    text.push(q);
    return { html: html.join("\n"), text: text.join("\n") };
  }

  return {
    normwerte: normwerte, speichereNormwerte: speichereNormwerte,
    grundausstattung: grundausstattung,
    quelle: quelle, setzeQuelle: setzeQuelle,
    datumAusText: datumAusText, alterAusDaten: alterAusDaten,
    zeileVonNerv: zeileVonNerv, grenzeFuer: grenzeFuer,
    erkenneNerv: erkenneNerv, ordneNlg: ordneNlg,
    bewertung: bewertung, bewerte: bewerte,
    tabelleHtmlText: tabelleHtmlText, spalten: spalten,
    spaltenFuerArt: spaltenFuerArt, nervAnzeige: nervAnzeige,
    nervZeile: nervZeile, sortiere: sortiere, nachfuehren: nachfuehren,
    farbeFuer: farbeFuer
  };
})();
