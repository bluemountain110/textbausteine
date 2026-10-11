// Datei: pdf-formular.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Füllt die Felder eines ausfüllbaren PDF-Formulars (AcroForm)
//        — gebaut für das MediService-Bestellformular (Etappe 13,
//        ;;kisbest). Die Vorlage medi-rezept.pdf liegt normalisiert im
//        App-Ordner (klassisches Querverzeichnis, Felder im Klartext,
//        NeedAppearances gesetzt); hier wird nur noch je Feld der Wert
//        gesetzt und das Ergebnis als Anhangs-Fortschreibung
//        (incremental update) hinten angehängt — das Original bleibt
//        Byte für Byte unangetastet, Betrachter zeichnen die Werte
//        selbst (NeedAppearances).
//        GRUNDSATZ: Alles läuft im Fenster. Das gefüllte PDF wird nie
//        gespeichert und nie abgeglichen — nie Patientendaten.

"use strict";
window.TB = window.TB || {};

TB.pdfFormular = (function () {

  function nachLatin(bytes) {
    var teile = [], STUECK = 0x8000;
    for (var i = 0; i < bytes.length; i += STUECK) {
      teile.push(String.fromCharCode.apply(null, bytes.subarray(i, i + STUECK)));
    }
    return teile.join("");
  }

  // PDF-Namenswert eines /T (…)-Eintrags entschlüsseln.
  function stringWert(roh) {
    var aus = "", i = 0;
    while (i < roh.length) {
      var z = roh[i];
      if (z !== "\\") { aus += z; i += 1; continue; }
      var f = roh[i + 1];
      if (/[0-7]/.test(f)) {
        var m = /^[0-7]{1,3}/.exec(roh.slice(i + 1));
        aus += String.fromCharCode(parseInt(m[0], 8)); i += 1 + m[0].length;
      } else if (f === "n") { aus += "\n"; i += 2; }
      else if (f === "r") { aus += "\r"; i += 2; }
      else if (f === "t") { aus += "\t"; i += 2; }
      else { aus += f; i += 2; }
    }
    return aus;
  }

  // Einen Wert als PDF-Textstring verpacken (Latin-1, Sonderzeichen
  // als Oktal-Escapes; Zeilenwechsel bleiben erhalten).
  function alsPdfString(wert) {
    var aus = "(";
    var s = String(wert == null ? "" : wert);
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c === 40 || c === 41 || c === 92) aus += "\\" + s[i];
      else if (c === 10) aus += "\\n";
      else if (c === 13) aus += "\\r";
      else if (c >= 32 && c <= 126) aus += s[i];
      else if (c <= 255) aus += "\\" + ("00" + c.toString(8)).slice(-3);
      else aus += "?";
    }
    return aus + ")";
  }

  function zahl20(offset) {
    return ("0000000000" + offset).slice(-10) + " 00000 n\r\n";
  }

  // Kern: Vorlage (Uint8Array) + { Feldname: Wert } → neues Uint8Array.
  function fuelle(bytes, werte) {
    var s = nachLatin(bytes);
    var fehlend = Object.keys(werte).slice();
    var neu = [];     // { nr, body }
    var re = /(\d+)\s+0\s+obj\b([\s\S]*?)endobj/g, m;
    while ((m = re.exec(s)) !== null) {
      var body = m[2];
      if (body.indexOf("stream") !== -1) continue;   // nie Strom-Objekte
      var t = /\/T\s*\(((?:\\.|[^\\()])*)\)/.exec(body);
      if (!t) continue;
      var name = stringWert(t[1]);
      if (!(name in werte)) continue;
      fehlend.splice(fehlend.indexOf(name), 1);
      var b = body
        .replace(/\/V\s*\((?:\\.|[^\\()])*\)/g, "")
        .replace(/\/V\s*<[0-9A-Fa-f\s]*>/g, "")
        .replace(/\/AP\s*<<[^<>]*(?:<<[^<>]*>>[^<>]*)*>>/g, "")
        .replace(/\/AP\s*\d+\s+0\s+R/g, "");
      b = b.replace("<<", "<< /V " + alsPdfString(werte[name]) + " ");
      neu.push({ nr: parseInt(m[1], 10), body: b });
    }
    if (!neu.length) throw new Error("kein passendes Formularfeld gefunden");

    // Anker des Originals: Querverzeichnis-Angaben aus dem Nachspann.
    var groesse = /\/Size\s+(\d+)/.exec(s.slice(s.lastIndexOf("trailer")));
    var wurzel = /\/Root\s+(\d+\s+0\s+R)/.exec(s.slice(s.lastIndexOf("trailer")));
    var start = /startxref\s+(\d+)/.exec(s.slice(-200));
    if (!groesse || !wurzel || !start)
      throw new Error("Vorlage ohne klassisches Querverzeichnis");

    var aus = s;
    if (!/[\r\n]$/.test(aus)) aus += "\r\n";
    neu.sort(function (a, b2) { return a.nr - b2.nr; });
    neu.forEach(function (o) {
      o.offset = aus.length;
      aus += o.nr + " 0 obj" + o.body + "endobj\r\n";
    });

    // Querverzeichnis: zusammenhängende Nummern je Unterabschnitt.
    var xrefOffset = aus.length;
    aus += "xref\r\n";
    var i2 = 0;
    while (i2 < neu.length) {
      var j = i2;
      while (j + 1 < neu.length && neu[j + 1].nr === neu[j].nr + 1) j++;
      aus += neu[i2].nr + " " + (j - i2 + 1) + "\r\n";
      for (var k = i2; k <= j; k++) aus += zahl20(neu[k].offset);
      i2 = j + 1;
    }
    aus += "trailer\r\n<< /Size " + groesse[1] + " /Root " + wurzel[1] +
           " /Prev " + start[1] + " >>\r\nstartxref\r\n" + xrefOffset +
           "\r\n%%EOF\r\n";

    var out = new Uint8Array(aus.length);
    for (var p = 0; p < aus.length; p++) out[p] = aus.charCodeAt(p) & 0xff;
    return { bytes: out, fehlend: fehlend };
  }

  return { fuelle: fuelle, alsPdfString: alsPdfString,
           stringWert: stringWert };
})();
