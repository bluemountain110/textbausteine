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
    return alleStroeme(bytes).then(function (alle) {
      return alle.map(function (s) { return s.inhalt; })
        .filter(function (t) {
          return t.indexOf("BT") !== -1 &&
            (t.indexOf("TJ") !== -1 || t.indexOf("Tj") !== -1);
        });
    });
  }

  // 18.7: ALLE gepressten Ströme samt Wörterbuch — der Text-Leser oben
  // nimmt nur die mit Text, der Grafik-Leser unten die mit Linien.
  function alleStroeme(bytes) {
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
      versprechen.push((function (wb) {
        return entpacke(roh).then(function (d) {
          var t = "";
          for (var k = 0; k < d.length; k += 32768) {
            t += String.fromCharCode.apply(null,
              d.subarray(k, Math.min(k + 32768, d.length)));
          }
          return { dict: wb, inhalt: t };
        }).catch(function () { return { dict: wb, inhalt: "" }; });
      })(dict));
      pos = ende;
    }
    return Promise.all(versprechen);
  }

  // ---- 18.7: Der Grafik-Leser (Kurven) -----------------------------------
  // Keypoint zeichnet seine Kurven als VEKTOR-Linien (Näds Zoom-Test
  // 12.10.: gestochen scharf). Dieser Teil liest die Zeichenbefehle
  // eines Inhaltsstroms: Linienzüge (m/l/c/v/y/h), Rechtecke (re),
  // Farbe (RG/G/K/rg/g/k/SC…), Strichstärke (w) und die
  // Koordinaten-Umrechnung (q/Q/cm) — dazu die Text-Stücke MIT
  // Position im selben Koordinatensystem (für die Beschriftungen wie
  // „Handgelenk - APB" oder „2mV/D 2ms/D"). Ergebnis je Strom:
  // { pfade: [{ pts:[[x,y]…], art:"linie"|"flaeche", farbe, breite,
  //   geschlossen }], texte: [{ x, y, text }], xobjekte: [{ name, ctm }] }.
  // Schriften, Bilder und Verwaltungs-Ströme werden übersprungen.

  // Zerlegt einen Inhaltsstrom in Bausteine (Zahl, Name, Zeichenkette,
  // Feld, Befehl). Inline-Bilder (BI … ID … EI) werden übersprungen.
  function bausteine(s) {
    var aus = [], i = 0, n = s.length;
    var LEER = " \t\r\n\f\0";
    var TRENN = "()<>[]{}/%";
    while (i < n) {
      var c = s[i];
      if (LEER.indexOf(c) !== -1) { i++; continue; }
      if (c === "%") { while (i < n && s[i] !== "\n" && s[i] !== "\r") i++; continue; }
      if (c === "(") {
        var tiefe = 1, j = i + 1, roh = "";
        while (j < n && tiefe > 0) {
          var z = s[j];
          if (z === "\\") { roh += z + (s[j + 1] || ""); j += 2; continue; }
          if (z === "(") tiefe++;
          else if (z === ")") { tiefe--; if (tiefe === 0) break; }
          roh += z; j++;
        }
        aus.push({ t: "str", v: roh }); i = j + 1; continue;
      }
      if (c === "<" && s[i + 1] === "<") { aus.push({ t: "<<" }); i += 2; continue; }
      if (c === ">" && s[i + 1] === ">") { aus.push({ t: ">>" }); i += 2; continue; }
      if (c === "<") {
        var e = s.indexOf(">", i);
        aus.push({ t: "hex", v: s.substring(i + 1, e === -1 ? n : e) });
        i = e === -1 ? n : e + 1; continue;
      }
      if (c === "[") { aus.push({ t: "[" }); i++; continue; }
      if (c === "]") { aus.push({ t: "]" }); i++; continue; }
      if (c === "{" || c === "}") { i++; continue; }
      if (c === "/") {
        var k = i + 1;
        while (k < n && LEER.indexOf(s[k]) === -1 && TRENN.indexOf(s[k]) === -1) k++;
        aus.push({ t: "name", v: s.substring(i + 1, k) }); i = k; continue;
      }
      var m = i;
      while (m < n && LEER.indexOf(s[m]) === -1 && TRENN.indexOf(s[m]) === -1) m++;
      var wort = s.substring(i, m);
      i = m;
      if (/^[+\-]?(\d+\.?\d*|\.\d+)$/.test(wort)) {
        aus.push({ t: "num", v: parseFloat(wort) }); continue;
      }
      if (wort === "BI") {
        // Inline-Bild: bis zum alleinstehenden "EI" überspringen.
        var ei = i;
        while (true) {
          ei = s.indexOf("EI", ei);
          if (ei === -1) { i = n; break; }
          var vor = s[ei - 1], nach = s[ei + 2];
          if ((vor === undefined || LEER.indexOf(vor) !== -1) &&
              (nach === undefined || LEER.indexOf(nach) !== -1)) {
            i = ei + 2; break;
          }
          ei += 2;
        }
        continue;
      }
      if (wort) aus.push({ t: "op", v: wort });
    }
    return aus;
  }

  function mal(m, c) {   // m × c (PDF-Reihenfolge: neue Matrix zuerst)
    return [m[0] * c[0] + m[1] * c[2], m[0] * c[1] + m[1] * c[3],
            m[2] * c[0] + m[3] * c[2], m[2] * c[1] + m[3] * c[3],
            m[4] * c[0] + m[5] * c[2] + c[4], m[4] * c[1] + m[5] * c[3] + c[5]];
  }
  function punkt(c, x, y) {
    return [c[0] * x + c[2] * y + c[4], c[1] * x + c[3] * y + c[5]];
  }
  function farbeAus(zahlen) {
    if (zahlen.length === 1) return [zahlen[0], zahlen[0], zahlen[0]];
    if (zahlen.length === 3) return zahlen;
    if (zahlen.length === 4) {          // CMYK → RGB (genug zum Erkennen)
      return [1 - Math.min(1, zahlen[0] + zahlen[3]),
              1 - Math.min(1, zahlen[1] + zahlen[3]),
              1 - Math.min(1, zahlen[2] + zahlen[3])];
    }
    return [0, 0, 0];
  }

  function grafikAusInhalt(inhalt) {
    var tok = bausteine(inhalt);
    var zst = { ctm: [1, 0, 0, 1, 0, 0], w: 1, strich: [0, 0, 0], fuell: [0, 0, 0] };
    var stapel = [];
    var pfade = [], texte = [], xobjekte = [];
    var teilpfade = [], aktuell = null;
    var imText = false, tm = null, tlm = null, leading = 0;
    var ops = [];   // Operanden seit dem letzten Befehl
    var feld = null;

    function zahlen(k) {
      var z = ops.filter(function (o) { return o.t === "num"; })
        .map(function (o) { return o.v; });
      return k ? z.slice(-k) : z;
    }
    function neuerPunkt(x, y) {
      var p = punkt(zst.ctm, x, y);
      if (!aktuell) { aktuell = { pts: [], geschlossen: false }; teilpfade.push(aktuell); }
      aktuell.pts.push(p);
    }
    function malen(art) {
      var skala = Math.sqrt(Math.abs(zst.ctm[0] * zst.ctm[3] - zst.ctm[1] * zst.ctm[2])) || 1;
      teilpfade.forEach(function (tp) {
        if (tp.pts.length < 2) return;
        pfade.push({ pts: tp.pts, art: art, geschlossen: tp.geschlossen,
          farbe: (art === "flaeche" ? zst.fuell : zst.strich).slice(),
          breite: zst.w * skala });
      });
      teilpfade = []; aktuell = null;
    }
    function textAus(roh) {
      if (!tm) return;
      var p = punkt(zst.ctm, tm[4], tm[5]);
      var t = dekodiere(roh);
      if (t.trim()) texte.push({ x: p[0], y: p[1], text: t });
    }
    function td(tx, ty) {
      tlm = mal([1, 0, 0, 1, tx, ty], tlm);
      tm = tlm.slice();
    }

    for (var i = 0; i < tok.length; i++) {
      var b = tok[i];
      if (b.t === "[") { feld = []; continue; }
      if (b.t === "]") { ops.push({ t: "arr", v: feld || [] }); feld = null; continue; }
      if (feld) { feld.push(b); continue; }
      if (b.t !== "op") { ops.push(b); continue; }
      var o = b.v, z;
      switch (o) {
        case "q": stapel.push({ ctm: zst.ctm.slice(), w: zst.w,
                    strich: zst.strich.slice(), fuell: zst.fuell.slice() }); break;
        case "Q": if (stapel.length) zst = stapel.pop(); break;
        case "cm": z = zahlen(6); if (z.length === 6) zst.ctm = mal(z, zst.ctm); break;
        case "w": z = zahlen(1); if (z.length) zst.w = z[0]; break;
        case "RG": case "G": case "K": zst.strich = farbeAus(zahlen()); break;
        case "rg": case "g": case "k": zst.fuell = farbeAus(zahlen()); break;
        case "SC": case "SCN": z = zahlen(); if (z.length) zst.strich = farbeAus(z); break;
        case "sc": case "scn": z = zahlen(); if (z.length) zst.fuell = farbeAus(z); break;
        case "m": z = zahlen(2);
          if (z.length === 2) { aktuell = null; neuerPunkt(z[0], z[1]); } break;
        case "l": z = zahlen(2); if (z.length === 2) neuerPunkt(z[0], z[1]); break;
        case "c": z = zahlen(6); if (z.length === 6) neuerPunkt(z[4], z[5]); break;
        case "v": case "y": z = zahlen(4); if (z.length === 4) neuerPunkt(z[2], z[3]); break;
        case "h": if (aktuell) aktuell.geschlossen = true; break;
        case "re": z = zahlen(4);
          if (z.length === 4) {
            aktuell = null;
            neuerPunkt(z[0], z[1]); neuerPunkt(z[0] + z[2], z[1]);
            neuerPunkt(z[0] + z[2], z[1] + z[3]); neuerPunkt(z[0], z[1] + z[3]);
            aktuell.geschlossen = true; aktuell = null;
          } break;
        case "S": case "s":
          if (o === "s" && aktuell) aktuell.geschlossen = true;
          malen("linie"); break;
        case "f": case "F": case "f*": malen("flaeche"); break;
        case "B": case "B*": case "b": case "b*": malen("linie"); break;
        case "n": teilpfade = []; aktuell = null; break;
        case "BT": imText = true; tm = [1, 0, 0, 1, 0, 0]; tlm = tm.slice(); break;
        case "ET": imText = false; break;
        case "Tm": z = zahlen(6); if (z.length === 6) { tm = z.slice(); tlm = z.slice(); } break;
        case "Td": z = zahlen(2); if (z.length === 2 && tlm) td(z[0], z[1]); break;
        case "TD": z = zahlen(2); if (z.length === 2 && tlm) { leading = -z[1]; td(z[0], z[1]); } break;
        case "TL": z = zahlen(1); if (z.length) leading = z[0]; break;
        case "T*": if (tlm) td(0, -leading); break;
        case "Tj": ops.filter(function (x) { return x.t === "str"; })
          .forEach(function (x) { textAus(x.v); }); break;
        case "'": case "\"": if (tlm) td(0, -leading);
          ops.filter(function (x) { return x.t === "str"; })
            .forEach(function (x) { textAus(x.v); }); break;
        case "TJ":
          ops.filter(function (x) { return x.t === "arr"; }).forEach(function (a) {
            var t = a.v.filter(function (x) { return x.t === "str"; })
              .map(function (x) { return x.v; }).join("");
            if (t) textAus(t);
          }); break;
        case "Do":
          var nm = ops.filter(function (x) { return x.t === "name"; }).pop();
          if (nm) xobjekte.push({ name: nm.v, ctm: zst.ctm.slice() });
          break;
      }
      ops = [];
    }
    return { pfade: pfade, texte: texte, xobjekte: xobjekte };
  }

  // Welche Ströme sind Zeichenflächen? Seiten-Inhalte und Form-Objekte —
  // nicht Schriften, Bilder, Querverzeichnisse, Farbprofile, Metadaten.
  function istZeichenStrom(dict) {
    if (/\/Length[123]\b/.test(dict)) return false;
    if (/\/Subtype\s*\/(Image|Type1C|CIDFontType0C|OpenType|XML)\b/.test(dict)) return false;
    if (/\/Type\s*\/(XRef|ObjStm|Metadata|EmbeddedFile)\b/.test(dict)) return false;
    if (/\/Alternate\b/.test(dict) || /\/FunctionType\b/.test(dict)) return false;
    return true;
  }

  // Liest ALLE Zeichenflächen einer PDF-Datei: je Strom mit Linien das
  // Grafik-Ergebnis plus die Kerndaten seines Wörterbuchs (Art, BBox,
  // Matrix — für die spätere Zuordnung von Form-Objekten).
  function leseGrafik(puffer) {
    var bytes = new Uint8Array(puffer);
    return alleStroeme(bytes).then(function (alle) {
      var aus = [];
      alle.forEach(function (s, idx) {
        if (!s.inhalt || !istZeichenStrom(s.dict)) return;
        if (!/\b(l|re|c)\b/.test(s.inhalt)) return;
        var g;
        try { g = grafikAusInhalt(s.inhalt); } catch (e) { return; }
        if (!g.pfade.length) return;
        var bbox = /\/BBox\s*\[([^\]]*)\]/.exec(s.dict);
        var matrix = /\/Matrix\s*\[([^\]]*)\]/.exec(s.dict);
        g.nr = idx + 1;
        g.art = /\/Subtype\s*\/Form\b/.test(s.dict) ? "Form-Objekt" : "Seiteninhalt";
        g.bbox = bbox ? bbox[1].trim().replace(/\s+/g, " ") : "";
        g.matrix = matrix ? matrix[1].trim().replace(/\s+/g, " ") : "";
        aus.push(g);
      });
      return aus;
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
           zeilenAusStuecken: zeilenAusStuecken, zellenZeilen: zellenZeilen,
           leseGrafik: leseGrafik, grafikAusInhalt: grafikAusInhalt,
           bausteine: bausteine };
})();
