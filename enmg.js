// Datei: enmg.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Das Herz des ENMG-Werks: verwaltet die Normwerte (Einstellungs-
//        Wert enmgNormwerte, synct auf alle Geräte — enthält NIE
//        Patientendaten), rechnet das Patientenalter aus Geburts- und
//        Untersuchungsdatum, holt den Grenzwert je Nerv/Zeile/Alter
//        (linear zwischen den 5-Jahres-Stützstellen), ordnet die
//        Geräte-Segmente den Normzeilen zu (Schlüsselwörter, sonst
//        Reihenfolge distal → proximal) und färbt jeden Messwert:
//        rot = ausserhalb, grün = innerhalb, schwarz = kein Normwert.
//        Lieber schwarz als falsch gefärbt (Lehre I2). Dazu die
//        Ausgabe als Tabelle (HTML mit Inline-Stilen, Lehre I1, und
//        reiner Text). GRUNDSATZ: Ein eingelesener Export ist ein
//        Patientenbefund — er wird NIE gespeichert, NIE abgeglichen.

"use strict";
window.TB = window.TB || {};

TB.enmg = (function () {
  var ROT = "#c00000", GRUEN = "#1a7a1a";

  // ---- Ablage der Normwerte (nie Patientendaten) ----------------------
  function normwerte() {
    var g = TB.speicher.einstellung("enmgNormwerte", null);
    return g || TB.normwerteGrundlage;
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
      if (zuordnung[i]) return;
      while (naechste < reihe.length && vergeben[reihe[naechste]]) naechste++;
      if (naechste < reihe.length) {
        zuordnung[i] = reihe[naechste]; vergeben[reihe[naechste]] = true;
      }
    });
    return zuordnung;
  }

  function farbeFuer(wert, grenze, richtung) {
    if (wert === null || wert === undefined || grenze === null) return null;
    var rot = (richtung === "max") ? (wert > grenze) : (wert < grenze);
    return rot ? "rot" : "gruen";
  }
  function bewertung(nerv, zeileId, wert, alter) {
    if (!nerv || wert === null || wert === undefined) return null;
    var zeile = zeileVonNerv(nerv, zeileId);
    if (!zeile) return null;
    var g = grenzeFuer(zeile, alter);
    if (g === null) return null;
    return { farbe: farbeFuer(wert, g, zeile.richtung),
             grenze: rund2(g), richtung: zeile.richtung,
             zeileName: zeile.name };
  }

  // ---- Ein ganzes Lese-Ergebnis bewerten --------------------------------
  function bewerte(ergebnis) {
    var alter = alterAusDaten(ergebnis.patient.geburtsdatum,
                              ergebnis.patient.untersuchungsdatum);
    ergebnis.alter = alter;
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
  function wertHtml(w, bew) {
    if (w === null || w === undefined) return "";
    if (!bew || !bew.farbe) return zahl(w);
    var farbe = bew.farbe === "rot" ? ROT : GRUEN;
    return '<span style="color:' + farbe + ';font-weight:' +
      (bew.farbe === "rot" ? "bold" : "normal") + '">' + zahl(w) +
      '</span> <span style="color:#808080;font-size:8pt">(' +
      (bew.richtung === "max" ? "&le; " : "&ge; ") + bew.grenze + ')</span>';
  }
  function wertText(w, bew) {
    if (w === null || w === undefined) return "";
    if (!bew || !bew.farbe) return zahl(w);
    return zahl(w) + (bew.farbe === "rot" ? " (!)" : "") +
      " (" + (bew.richtung === "max" ? "<=" : ">=") + bew.grenze + ")";
  }
  var TD = '<td style="border:1px solid #808080;padding:2px 6px;' +
           'font-family:Arial;font-size:10pt;text-align:right">';
  var TDL = '<td style="border:1px solid #808080;padding:2px 6px;' +
            'font-family:Arial;font-size:10pt;text-align:left">';
  var TH = '<td style="border:1px solid #808080;padding:2px 6px;' +
           'font-family:Arial;font-size:10pt;font-weight:bold;' +
           'background-color:#efefef;text-align:left">';
  function tabelleHtmlText(ergebnis) {
    var T = TB.enmgTexte, html = [], text = [];
    var p = ergebnis.patient || {};
    var kopf = [];
    if (p.name) kopf.push(p.name);
    if (p.geburtsdatum) kopf.push("geb. " + p.geburtsdatum);
    if (ergebnis.alter !== null && ergebnis.alter !== undefined)
      kopf.push(ergebnis.alter + " J.");
    if (p.untersuchungsdatum) kopf.push("ENMG vom " + p.untersuchungsdatum);
    if (kopf.length) {
      html.push('<p style="font-family:Arial;font-size:10pt"><b>' +
        kopf.join(" · ") + "</b></p>");
      text.push(kopf.join(" · "));
      text.push("");
    }
    (ergebnis.bloecke || []).forEach(function (block) {
      html.push('<p style="font-family:Arial;font-size:10pt;margin-bottom:2px"><b><u>' +
        block.nervText + "</u></b></p>");
      text.push(block.nervText);
      var motor = block.art === "motor";
      var spalten = motor
        ? [T.spalteSegment, T.spalteLat, T.spalteAmpM, T.spalteDur,
           T.spalteNlg, T.spalteFLat]
        : [T.spalteSegment, T.spalteAbstand, T.spalteLat, T.spalteAmpU,
           T.spalteNlg];
      var h = '<table style="border-collapse:collapse;margin-bottom:8px">' +
        "<tr>" + spalten.map(function (s) { return TH + s + "</td>"; }).join("") +
        "</tr>";
      text.push(spalten.join("  |  "));
      block.zeilen.forEach(function (z) {
        var w = z.werte, b = z.bew || {};
        var zellenH, zellenT;
        if (motor) {
          zellenH = [TDL + z.segment + "</td>",
            TD + wertHtml(w.lat, b.lat) + "</td>",
            TD + zahl(w.amp) + "</td>",
            TD + zahl(w.dur) + "</td>",
            TD + wertHtml(w.nlg, b.nlg) + "</td>",
            TD + wertHtml(w.fLat, b.fLat) + "</td>"];
          zellenT = [z.segment, wertText(w.lat, b.lat), zahl(w.amp),
            zahl(w.dur), wertText(w.nlg, b.nlg), wertText(w.fLat, b.fLat)];
        } else {
          zellenH = [TDL + z.segment + "</td>",
            TD + zahl(w.abstand) + "</td>",
            TD + zahl(w.lat) + "</td>",
            TD + wertHtml(w.amp, b.amp) + "</td>",
            TD + wertHtml(w.nlg, b.nlg) + "</td>"];
          zellenT = [z.segment, zahl(w.abstand), zahl(w.lat),
            wertText(w.amp, b.amp), wertText(w.nlg, b.nlg)];
        }
        h += "<tr>" + zellenH.join("") + "</tr>";
        text.push(zellenT.join("  |  "));
      });
      h += "</table>";
      html.push(h);
      text.push("");
    });
    var q = T.quelleZeile.replace("%s", quelle());
    html.push('<p style="font-family:Arial;font-size:8pt;color:#808080">' +
      q + "</p>");
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
    tabelleHtmlText: tabelleHtmlText
  };
})();
