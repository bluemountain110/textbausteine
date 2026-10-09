// Datei: enmg-leser-pdf.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Liest den PDF-Export (.pdf) des ENMG-Geräts am Spital — rein
//        im Browser, ohne Fremdbibliothek. Machbar, weil der
//        Keypoint-Export ein ECHTES Text-PDF ist (über Word erzeugt,
//        WinAnsi-Schrift, Positionen per Tm): Die gepressten
//        Inhaltsströme werden mit der eingebauten Browser-Entpackung
//        (DecompressionStream) geöffnet, die Textstücke mit ihren
//        x/y-Positionen eingesammelt, zu Zeilen gruppiert und über die
//        Spalten-Anker der Einheiten-Zeile (ms · Norm · mV …) zu
//        denselben Zellen-Zeilen gemacht, die auch der Word-Leser
//        liefert — der Deuter (enmg-leser.js) ist für beide derselbe.
//        Dies ist der wartungsanfälligste Teil des Werks: Ändert ein
//        Geräte-Update das Export-Layout, meldet der Leser lieber
//        "nicht erkannt", als zu raten. Nichts wird gespeichert.

"use strict";
window.TB = window.TB || {};

TB.enmgLeserPdf = (function () {

  // ---- Zeichen: PDF-Escapes und Windows-Zeichensatz ----------------------
  var CP1252 = { 128: 8364, 130: 8218, 131: 402, 132: 8222, 133: 8230,
    134: 8224, 135: 8225, 136: 710, 137: 8240, 138: 352, 139: 8249,
    140: 338, 142: 381, 145: 8216, 146: 8217, 147: 8220, 148: 8221,
    149: 8226, 150: 8211, 151: 8212, 152: 732, 153: 8482, 154: 353,
    155: 8250, 156: 339, 158: 382, 159: 376 };
  function dekodiere(s) {
    var aus = "", i = 0;
    while (i < s.length) {
      var c = s[i];
      if (c === "\\") {
        var n = s[i + 1];
        if (n >= "0" && n <= "7") {
          var oktal = "", k = 0;
          while (k < 3 && s[i + 1 + k] >= "0" && s[i + 1 + k] <= "7") {
            oktal += s[i + 1 + k]; k++; }
          aus += String.fromCharCode(parseInt(oktal, 8));
          i += 1 + k; continue;
        }
        if (n === "n") aus += "\n";
        else if (n === "r") aus += "\r";
        else if (n === "t") aus += "\t";
        else if (n === "b" || n === "f") aus += "";
        else aus += n;
        i += 2; continue;
      }
      aus += c; i++;
    }
    var fertig = "";
    for (var j = 0; j < aus.length; j++) {
      var code = aus.charCodeAt(j);
      fertig += (code >= 128 && code <= 159 && CP1252[code])
        ? String.fromCharCode(CP1252[code]) : aus[j];
    }
    return fertig;
  }

  // ---- Gepresste Ströme finden und öffnen --------------------------------
  function entpacke(bytes) {
    return new Response(
      new Blob([bytes]).stream()
        .pipeThrough(new DecompressionStream("deflate"))
    ).arrayBuffer().then(function (ab) { return new Uint8Array(ab); })
      .catch(function () {
        return new Response(
          new Blob([bytes]).stream()
            .pipeThrough(new DecompressionStream("deflate-raw"))
        ).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
      });
  }
  function woerterbuchVor(latin, streamPos) {
    // Vom ">> stream" aus das zugehörige "<<" rückwärts suchen (verschachtelt).
    var tiefe = 0, i = streamPos;
    while (i >= 1) {
      var paar = latin.substr(i - 1, 2);
      if (paar === ">>") { tiefe++; i -= 2; continue; }
      if (paar === "<<") {
        tiefe--; if (tiefe === 0) return latin.substring(i - 1, streamPos);
        i -= 2; continue;
      }
      i--;
    }
    return "";
  }
  function inhaltsStroeme(bytes) {
    var latin = "";
    for (var i = 0; i < bytes.length; i += 32768) {
      latin += String.fromCharCode.apply(null,
        bytes.subarray(i, Math.min(i + 32768, bytes.length)));
    }
    var versprechen = [], pos = 0;
    while (true) {
      var s = latin.indexOf("stream", pos);
      if (s === -1) break;
      pos = s + 6;
      // "endstream" selbst überspringen
      if (latin.substr(s - 3, 3) === "end") continue;
      var dict = woerterbuchVor(latin, s);
      if (dict.indexOf("/FlateDecode") === -1) continue;
      var start = s + 6;
      if (latin[start] === "\r") start++;
      if (latin[start] === "\n") start++;
      var ende = latin.indexOf("endstream", start);
      if (ende === -1) continue;
      // Die Browser-Entpackung ist streng: Nachlauf-Bytes (Zeilenende vor
      // "endstream") lassen sie scheitern. Darum exakt auf /Length
      // schneiden, sonst Zeilenenden am Schluss wegschneiden.
      var laenge = /\/Length\s+(\d+)(\s+0\s+R)?/.exec(dict);
      var datenEnde = ende;
      if (laenge && !laenge[2] && start + (+laenge[1]) <= ende) {
        datenEnde = start + (+laenge[1]);
      } else {
        while (datenEnde > start &&
               /[\r\n\t ]/.test(latin[datenEnde - 1])) datenEnde--;
      }
      var roh = bytes.subarray(start, datenEnde);
      versprechen.push(entpacke(roh).then(function (d) {
        var t = "";
        for (var k = 0; k < d.length; k += 32768) {
          t += String.fromCharCode.apply(null,
            d.subarray(k, Math.min(k + 32768, d.length)));
        }
        return t;
      }).catch(function () { return ""; }));
      pos = ende;
    }
    return Promise.all(versprechen).then(function (alle) {
      return alle.filter(function (t) {
        return t.indexOf("BT") !== -1 &&
          (t.indexOf("TJ") !== -1 || t.indexOf("Tj") !== -1);
      });
    });
  }

  // ---- Textstücke mit Position einsammeln --------------------------------
  function stuecke(inhalt) {
    var items = [], x = 0, y = 0, frisch = false;
    var re = /(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+Tm|(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+T[dD]|\[((?:\\.|[^\]\\])*)\]\s*TJ|\(((?:\\.|[^()\\])*)\)\s*Tj/g;
    var m;
    while ((m = re.exec(inhalt)) !== null) {
      if (m[1] !== undefined) {           // Tm: neue Position
        x = parseFloat(m[5]); y = parseFloat(m[6]); frisch = true;
      } else if (m[7] !== undefined) {    // Td/TD: Verschiebung
        x += parseFloat(m[7]); y += parseFloat(m[8]); frisch = true;
      } else {                            // TJ oder Tj: Text
        var rohText = "";
        if (m[9] !== undefined) {
          var sm, sRe = /\(((?:\\.|[^()\\])*)\)/g;
          while ((sm = sRe.exec(m[9])) !== null) rohText += dekodiere(sm[1]);
        } else {
          rohText = dekodiere(m[10]);
        }
        if (rohText === "") continue;
        if (!frisch && items.length) {
          items[items.length - 1].text += rohText;  // Fortsetzung
        } else {
          items.push({ x: x, y: y, text: rohText });
        }
        frisch = false;
      }
    }
    return items.filter(function (t) { return t.text.trim() !== ""; });
  }

  // ---- Stücke zu Zeilen gruppieren (eine Seite) ---------------------------
  function zeilenAusStuecken(items) {
    var zeilen = [];
    items.forEach(function (t) {
      for (var i = 0; i < zeilen.length; i++) {
        if (Math.abs(zeilen[i].y - t.y) <= 2.0) {
          zeilen[i].items.push(t); return;
        }
      }
      zeilen.push({ y: t.y, items: [t] });
    });
    zeilen.sort(function (a, b) { return b.y - a.y; });
    zeilen.forEach(function (z) {
      z.items.sort(function (a, b) { return a.x - b.x; });
      // "<" oder ">" mit der folgenden Zahl zu EINEM Stück verbinden —
      // Norm-Zellen wie "< 4.7" bestehen sonst aus zwei Stücken.
      var fertig = [];
      z.items.forEach(function (t) {
        var letzte = fertig[fertig.length - 1];
        if (letzte && /^[<>]$/.test(letzte.text.trim())) {
          letzte.text = letzte.text.trim() + " " + t.text.trim(); return;
        }
        // Kopfzeile: "F" + "Lat" gehören zusammen.
        if (letzte && letzte.text.trim() === "F" && t.text.trim() === "Lat") {
          letzte.text = "F Lat"; return;
        }
        fertig.push({ x: t.x, text: t.text });
      });
      z.items = fertig;
    });
    return zeilen;
  }

  // ---- Zeilen über Spalten-Anker in Zellen-Zeilen verwandeln --------------
  function zellenZeilen(zeilen) {
    var aus = [], texte = [], anker = null;
    zeilen.forEach(function (z) {
      var t = z.items.map(function (i) { return i.text.trim(); });
      var ganze = t.join(" ").replace(/\s+/g, " ").trim();
      if (ganze) texte.push(ganze);
      var istKopf = (t[0] === "Nerve" || t[0] === "Nerv") &&
        t.indexOf("Lat") !== -1;
      if (istKopf) {
        aus.push(["Nerve"].concat(t.slice(1)));
        anker = "warte"; return;
      }
      if (anker === "warte") {
        // Einheiten-Zeile: ihre x-Positionen sind die Spalten-Anker.
        anker = z.items.map(function (i) {
          return { x: i.x, text: i.text.trim() }; });
        aus.push([""].concat(anker.map(function (a) { return a.text; })));
        return;
      }
      if (!anker || anker === "warte" || !z.items.length) {
        aus.push([ganze]); return;
      }
      // Datenzeile: links der Segmentname, rechts die Werte je Anker.
      var grenzeX = anker[0].x - 6;
      var links = [], zellen = anker.map(function () { return ""; });
      z.items.forEach(function (i) {
        if (i.x < grenzeX) { links.push(i.text.trim()); return; }
        var beste = 0, abstand = Infinity;
        for (var k = 0; k < anker.length; k++) {
          var d = Math.abs(anker[k].x - i.x);
          if (d < abstand) { abstand = d; beste = k; }
        }
        zellen[beste] = (zellen[beste] ? zellen[beste] + " " : "") +
          i.text.trim();
      });
      var segment = links.join(" ").replace(/\s+/g, " ").trim();
      if (!segment && zellen.join("") === "") return;
      if (!segment) { aus.push([ganze]); return; }
      aus.push([segment].concat(zellen));
    });
    return { zeilen: aus, texte: texte };
  }

  function lese(puffer) {
    var bytes = new Uint8Array(puffer);
    return inhaltsStroeme(bytes).then(function (stroeme) {
      // Zeilen je Seite gruppieren (y-Werte gelten nur innerhalb einer
      // Seite), dann ALLE Seiten in EINEM Lauf in Zellen verwandeln —
      // eine Tabelle, die auf Seite 2 weiterläuft, wiederholt ihren
      // Kopf nicht, und ihre Spalten-Anker müssen überleben.
      var alleZeilen = [];
      stroeme.forEach(function (inhalt) {
        alleZeilen = alleZeilen.concat(zeilenAusStuecken(stuecke(inhalt)));
      });
      return zellenZeilen(alleZeilen);
    });
  }

  return { lese: lese, dekodiere: dekodiere, stuecke: stuecke,
           zeilenAusStuecken: zeilenAusStuecken, zellenZeilen: zellenZeilen };
})();
