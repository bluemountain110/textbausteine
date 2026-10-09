// Datei: enmg-leser-word.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Liest den Word-Export (.docx) des ENMG-Geräts — rein im
//        Browser, ohne Fremdbibliothek: Eine .docx-Datei ist ein
//        Zip-Ordner; der Text steckt in word/document.xml. Entpackt
//        wird mit der eingebauten Browser-Entpackung
//        (DecompressionStream), gelesen mit einfachen Mustern.
//        Liefert dem Deuter (enmg-leser.js) die Tabellen-Zeilen als
//        Zellen-Listen in Dokument-Reihenfolge plus den reinen Text
//        für den Patientenkopf. Die Datei bleibt im Fenster — nichts
//        wird gespeichert (Grundsatz 1).

"use strict";
window.TB = window.TB || {};

TB.enmgLeserWord = (function () {

  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) {
    return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + b[o + 3] * 16777216;
  }

  // ---- Minimaler Zip-Leser: genau EINE Datei herausholen ----------------
  function zipDatei(bytes, gesucht) {
    // Ende-Kennsatz (EOCD) von hinten suchen.
    var i = bytes.length - 22;
    var ende = Math.max(0, bytes.length - 22 - 65535);
    for (; i >= ende; i--) {
      if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b &&
          bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) break;
    }
    if (i < ende) return Promise.reject(new Error("kein Zip-Endesatz"));
    var anzahl = u16(bytes, i + 10);
    var o = u32(bytes, i + 16); // Anfang des Inhaltsverzeichnisses
    var dec = new TextDecoder("utf-8");
    for (var n = 0; n < anzahl; n++) {
      if (u32(bytes, o) !== 0x02014b50) break;
      var methode = u16(bytes, o + 10);
      var packGroesse = u32(bytes, o + 20);
      var nameLen = u16(bytes, o + 28), extraLen = u16(bytes, o + 30),
          kommLen = u16(bytes, o + 32);
      var lokalOffset = u32(bytes, o + 42);
      var name = dec.decode(bytes.subarray(o + 46, o + 46 + nameLen));
      o = o + 46 + nameLen + extraLen + kommLen;
      if (name !== gesucht) continue;
      var lnLen = u16(bytes, lokalOffset + 26),
          lexLen = u16(bytes, lokalOffset + 28);
      var start = lokalOffset + 30 + lnLen + lexLen;
      var daten = bytes.subarray(start, start + packGroesse);
      if (methode === 0) return Promise.resolve(daten);
      if (methode !== 8)
        return Promise.reject(new Error("Zip-Methode " + methode));
      return new Response(
        new Blob([daten]).stream()
          .pipeThrough(new DecompressionStream("deflate-raw"))
      ).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
    }
    return Promise.reject(new Error(gesucht + " nicht im Zip"));
  }

  // ---- Word-XML in Zeilen und Text verwandeln ----------------------------
  function entEscape(t) {
    return t.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, function (g, z) {
        return String.fromCharCode(+z); })
      .replace(/&amp;/g, "&");
  }
  function textVon(xmlStueck) {
    var teile = [], m,
        re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:(?:tab|br)\b[^>]*\/?>/g;
    while ((m = re.exec(xmlStueck)) !== null)
      teile.push(m[1] === undefined ? " " : entEscape(m[1]));
    return teile.join("").replace(/\s+/g, " ").trim();
  }
  function zerlege(xml) {
    var zeilen = [], m;
    var zeileRe = /<w:tr(?:\s[^>]*)?>([\s\S]*?)<\/w:tr>/g;
    while ((m = zeileRe.exec(xml)) !== null) {
      var zellen = [], zm,
          zellRe = /<w:tc(?:\s[^>]*)?>([\s\S]*?)<\/w:tc>/g;
      while ((zm = zellRe.exec(m[1])) !== null) zellen.push(textVon(zm[1]));
      if (zellen.length) zeilen.push(zellen);
    }
    // Reiner Text des ganzen Dokuments (für den Patientenkopf):
    // Absätze als Zeilen.
    var texte = [], pm, pRe = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
    while ((pm = pRe.exec(xml)) !== null) {
      var t = textVon(pm[1]);
      if (t) texte.push(t);
    }
    return { zeilen: zeilen, texte: texte };
  }

  function lese(puffer) {
    var bytes = new Uint8Array(puffer);
    return zipDatei(bytes, "word/document.xml").then(function (daten) {
      var xml = new TextDecoder("utf-8").decode(daten);
      return zerlege(xml);
    });
  }

  return { lese: lese, zerlege: zerlege };
})();
