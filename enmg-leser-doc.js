// Datei: enmg-leser-doc.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Liest das ALTE Word-Format (.doc, Word 97–2003), in dem der
//        Viking in der Praxis seine Berichte speichert (18.13) — rein
//        im Browser, ohne Fremdbibliothek. Eine .doc-Datei ist ein
//        „Verbund-Dokument" (ein kleines Dateisystem in der Datei):
//        Erst wird der Strom „WordDocument" und die Tabelle „0Table"
//        bzw. „1Table" herausgeholt, dann über die Stückliste (Clx) der
//        Haupttext zusammengesetzt. Ergebnis: der rohe Word-Text mit
//        Zellen-Marken (\x07), Absätzen (\r) und Feld-Marken
//        (\x13 … \x14 … \x15). Den Sinn liest enmg-viking.js.
//        GRUNDSATZ: Die Datei bleibt im Fenster — nichts wird gespeichert.

"use strict";
window.TB = window.TB || {};

TB.enmgLeserDoc = (function () {

  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) {
    return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + b[o + 3] * 16777216;
  }
  var ENDE = 0xFFFFFFFE, FREI = 0xFFFFFFFF;

  function istDoc(bytes) {
    return bytes.length > 512 && bytes[0] === 0xD0 && bytes[1] === 0xCF &&
      bytes[2] === 0x11 && bytes[3] === 0xE0;
  }

  // ---- Das Verbund-Dokument (Compound File) ------------------------------
  function verbund(bytes) {
    if (!istDoc(bytes)) throw new Error("keine Word-97-Datei");
    var sekGr = 1 << u16(bytes, 0x1E), miniGr = 1 << u16(bytes, 0x20);
    var anzFat = u32(bytes, 0x2C), ersterOrdner = u32(bytes, 0x30);
    var miniGrenze = u32(bytes, 0x38), ersteMiniFat = u32(bytes, 0x3C);
    var ersteDifat = u32(bytes, 0x44);
    function sektor(n) { return (n + 1) * sekGr; }

    // FAT-Sektoren: 109 im Kopf, weitere in der DIFAT-Kette.
    var fatSektoren = [];
    for (var i = 0; i < 109 && fatSektoren.length < anzFat; i++)
      fatSektoren.push(u32(bytes, 0x4C + i * 4));
    var d = ersteDifat, sicher = 0;
    while (d !== ENDE && d !== FREI && fatSektoren.length < anzFat && sicher++ < 10000) {
      var o = sektor(d);
      for (var k = 0; k < sekGr / 4 - 1 && fatSektoren.length < anzFat; k++)
        fatSektoren.push(u32(bytes, o + k * 4));
      d = u32(bytes, o + sekGr - 4);
    }
    var fat = [];
    fatSektoren.forEach(function (s) {
      var o = sektor(s);
      for (var j = 0; j < sekGr / 4; j++) fat.push(u32(bytes, o + j * 4));
    });
    function kette(start, tabelle) {
      var liste = [], n = start, schutz = 0;
      while (n !== ENDE && n !== FREI && n < tabelle.length && schutz++ < 200000) {
        liste.push(n); n = tabelle[n];
      }
      return liste;
    }
    function lies(start, groesse) {
      var aus = new Uint8Array(groesse), pos = 0;
      kette(start, fat).some(function (s) {
        var o = sektor(s), n = Math.min(sekGr, groesse - pos);
        aus.set(bytes.subarray(o, o + n), pos); pos += n;
        return pos >= groesse;
      });
      return aus;
    }
    // Verzeichnis
    var ordnerBytes = (function () {
      var ks = kette(ersterOrdner, fat), b = new Uint8Array(ks.length * sekGr);
      ks.forEach(function (s, x) {
        b.set(bytes.subarray(sektor(s), sektor(s) + sekGr), x * sekGr); });
      return b;
    })();
    var eintraege = [];
    for (var e = 0; e + 128 <= ordnerBytes.length; e += 128) {
      var nl = u16(ordnerBytes, e + 64), name = "";
      for (var c = 0; c + 2 < nl; c += 2)
        name += String.fromCharCode(u16(ordnerBytes, e + c));
      eintraege.push({ name: name, typ: ordnerBytes[e + 66],
        start: u32(ordnerBytes, e + 116), groesse: u32(ordnerBytes, e + 120) });
    }
    var wurzel = eintraege[0];
    // Mini-Strom für kleine Ströme (unter der Grenze, meist 4096 Bytes)
    var miniStrom = null, miniFat = null;
    function miniVorbereiten() {
      if (miniStrom) return;
      miniStrom = lies(wurzel.start, wurzel.groesse);
      miniFat = [];
      kette(ersteMiniFat, fat).forEach(function (s) {
        var o = sektor(s);
        for (var j = 0; j < sekGr / 4; j++) miniFat.push(u32(bytes, o + j * 4));
      });
    }
    function strom(name) {
      var ein = null;
      eintraege.forEach(function (x) { if (x.typ === 2 && x.name === name) ein = x; });
      if (!ein) return null;
      if (ein.groesse >= miniGrenze) return lies(ein.start, ein.groesse);
      miniVorbereiten();
      var aus = new Uint8Array(ein.groesse), pos = 0;
      kette(ein.start, miniFat).some(function (s) {
        var o = s * miniGr, n = Math.min(miniGr, ein.groesse - pos);
        aus.set(miniStrom.subarray(o, o + n), pos); pos += n;
        return pos >= ein.groesse;
      });
      return aus;
    }
    return { strom: strom };
  }

  // ---- Der Word-Haupttext über die Stückliste ----------------------------
  function wordText(puffer) {
    var bytes = new Uint8Array(puffer);
    var v = verbund(bytes);
    var wd = v.strom("WordDocument");
    if (!wd || u16(wd, 0) !== 0xA5EC) throw new Error("kein Word-Dokument");
    var tabelleName = (u16(wd, 0x0A) & 0x0200) ? "1Table" : "0Table";
    var tab = v.strom(tabelleName);
    if (!tab) throw new Error("Word-Tabelle fehlt");
    var ccpText = u32(wd, 76);
    var fcClx = u32(wd, 418), lcbClx = u32(wd, 422);
    var i = fcClx, ende = fcClx + lcbClx;
    while (i < ende && tab[i] === 1) i += 3 + u16(tab, i + 1);
    if (tab[i] !== 2) throw new Error("Stückliste nicht gefunden");
    var lcb = u32(tab, i + 1), plc = i + 5, n = (lcb - 4) / 12;
    var cp1252 = new TextDecoder("windows-1252"), utf16 = new TextDecoder("utf-16le");
    var teile = [], laenge = 0;
    for (var k = 0; k < n && laenge < ccpText; k++) {
      var cpA = u32(tab, plc + k * 4), cpB = u32(tab, plc + (k + 1) * 4);
      var pcd = plc + (n + 1) * 4 + k * 8;
      var fc = u32(tab, pcd + 2), anzahl = cpB - cpA, s;
      if (fc & 0x40000000) {
        var o = (fc & 0x3FFFFFFF) / 2;
        s = cp1252.decode(wd.subarray(o, o + anzahl));
      } else {
        s = utf16.decode(wd.subarray(fc, fc + 2 * anzahl));
      }
      teile.push(s); laenge += s.length;
    }
    return teile.join("").slice(0, ccpText);
  }

  // Reiner Text (für Einlese-Felder): Feld-Anweisungen weg, Zellen als
  // Tabulator, Absätze als Zeilen.
  function klartext(roh) {
    return String(roh || "")
      .replace(/\x13[^\x13\x14\x15]*\x14/g, "")
      .replace(/\x13[^\x13\x14\x15]*\x15/g, "")
      .replace(/[\x14\x15\x01\x08]/g, "")
      .replace(/\x07+/g, "\t").replace(/[\r\x0B\x0C]/g, "\n")
      .replace(/\t\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  return { istDoc: istDoc, wordText: wordText, klartext: klartext };
})();
