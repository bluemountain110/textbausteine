// Datei: auszeichnung.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die Formatierungs-Werkstatt. Sie kann dreierlei:
//        1. Fremdes HTML (aus KISIM, Word, Outlook) auf das reduzieren,
//           was ein Baustein tragen darf — alles Übrige fliegt raus.
//        2. Aus diesem HTML ein RTF bauen, das KISIM annimmt. Der Kopf
//           ist am 14.9.2026 am Arbeitsrechner bewiesen worden: ohne
//           Codeblatt, Unicode-Regel und Absatz-Zurücksetzung steigt
//           KISIMs Leser aus und zeigt nur den reinen Text.
//        3. Aus demselben HTML den reinen Text ziehen, für alle Wege
//           ohne Formatierung (Mac, iPhone, Suche, Export).
//        Getragen werden: fett, kursiv, unterstrichen, durchgestrichen,
//        Schriftart, Schriftgrösse, Schriftfarbe, farbige Markierung,
//        Absätze, Zeilenumbrüche, Aufzählungen — und seit Etappe 7
//        TABELLEN: Zellen tragen Breite, Hintergrund und Verbünde
//        (rowspan/colspan — die Duplex-Legende ist eine hohe Zelle); innerhalb der
//        Tabelle wird die Schrift auf die Grundschrift eingenordet
//        (Näds Entscheid 22.9.: EINE Schrift je Tabelle), und das gilt
//        auf JEDEM Schreibweg, weil alle durch diese Reinigung laufen.
//        Der reine Text macht aus einer Tabellenzeile eine Textzeile
//        mit Tabulatoren zwischen den Zellen — der Notausgang für
//        Felder, die keine Tabellen können.
//        GRUNDSATZ: Hier fliesst nur Bausteintext durch, nie
//        Patientendaten.
//
// ZWEI FALLEN, die hier absichtlich vermieden werden:
//        - Das RTF reist versteckt in einem HTML-Kommentar. Darin darf
//          NIE "--" vorkommen, sonst zerfällt der Kommentar. Der
//          Bindestrich wird deshalb als Fluchtzeichen geschrieben.
//        - Das RTF muss reines ASCII sein, sonst kommen die Umlaute
//          falsch an.

"use strict";
window.TB = window.TB || {};

TB.auszeichnung = (function () {

  // ---- Was ein Baustein tragen darf ---------------------------------
  var ERLAUBT = {
    "B": 1, "STRONG": 1, "I": 1, "EM": 1, "U": 1, "S": 1, "STRIKE": 1,
    "BR": 1, "P": 1, "DIV": 1, "UL": 1, "OL": 1, "LI": 1, "SPAN": 1,
    "FONT": 1, "MARK": 1,
    "TABLE": 1, "THEAD": 1, "TBODY": 1, "TR": 1, "TD": 1, "TH": 1
  };
  // Alles, was Inhalt bringt, aber keine Auszeichnung ist, wird zum
  // schlichten Absatz. Alles Gefährliche fliegt ganz raus — ebenso
  // Tabellen-Beiwerk, das ohne Struktur nur Streutext hinterliesse.
  var RAUS = { "SCRIPT": 1, "STYLE": 1, "IFRAME": 1, "OBJECT": 1,
               "EMBED": 1, "LINK": 1, "META": 1, "HEAD": 1,
               "CAPTION": 1, "COLGROUP": 1, "COL": 1 };

  // Punkt-/Bildpunkt-Breite der gerade übernommenen Zelle — wandert als
  // data-Merkmal an die Kopie, breitenNachrechnen macht Prozent daraus.
  var knotenBreiteMerken = null;

  function farbeAlsZahlen(wert) {
    var w = String(wert || "").trim().toLowerCase();
    var m = w.match(/^#([0-9a-f]{3})$/);
    if (m) {
      return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16),
              parseInt(m[1][2] + m[1][2], 16)];
    }
    m = w.match(/^#([0-9a-f]{6})$/);
    if (m) {
      return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16),
              parseInt(m[1].slice(4, 6), 16)];
    }
    m = w.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return [+m[1], +m[2], +m[3]];
    var namen = { black: [0,0,0], white: [255,255,255], red: [255,0,0],
                  green: [0,128,0], blue: [0,0,255], yellow: [255,255,0],
                  orange: [255,165,0], gray: [128,128,128], grey: [128,128,128] };
    return namen[w] || null;
  }

  // Schriftgrösse: der Browser rechnet in Bildpunkten, RTF in halben
  // Punkten. 16 Bildpunkte sind 12 Punkte sind \fs24.
  function groesseAlsHalbePunkte(wert) {
    var w = String(wert || "").trim();
    var m = w.match(/^([\d.]+)\s*(px|pt|em|rem)?$/);
    if (!m) return null;
    var zahl = parseFloat(m[1]);
    if (!isFinite(zahl) || zahl <= 0) return null;
    var einheit = m[2] || "px";
    var punkte;
    if (einheit === "pt") punkte = zahl;
    else if (einheit === "em" || einheit === "rem") punkte = zahl * 12;
    else punkte = zahl * 0.75;
    return Math.max(2, Math.round(punkte * 2));
  }

  // ---- Das Reinigen -------------------------------------------------
  // Liefert eine Kopie des Baums, in der nur Erlaubtes steht.
  function reinige(html) {
    var quelle = document.createElement("div");
    quelle.innerHTML = String(html || "");
    var ziel = document.createElement("div");
    quelle.childNodes.forEach
      ? Array.prototype.forEach.call(quelle.childNodes, function (n) {
          uebernehmen(n, ziel); })
      : null;
    breitenNachrechnen(ziel);
    return ziel;
  }

  // Word/Excel geben Zellbreiten in Punkt/Bildpunkten an; hier werden
  // sie je Zeile in Prozent umgerechnet, Zellen ohne Angabe teilen sich
  // den Rest (23.9.).
  function breitenNachrechnen(ziel) {
    Array.prototype.forEach.call(ziel.querySelectorAll("table"), function (t) {
      Array.prototype.forEach.call(t.querySelectorAll("tr"), function (tr) {
        var roh = [], summe = 0, offene = 0, dabei = false;
        Array.prototype.forEach.call(tr.children, function (z) {
          var wert = z.getAttribute("data-tb-breite");
          z.removeAttribute("data-tb-breite");
          var zahl = wert ? parseFloat(wert) : null;
          if (zahl && zahl > 0) { dabei = true; summe += zahl; }
          else { zahl = null; offene += 1; }
          roh.push(zahl);
        });
        if (!dabei) return;
        var mittel = offene ? (summe / Math.max(1, roh.length - offene)) : 0;
        var gesamt = summe + offene * mittel;
        if (!(gesamt > 0)) return;
        Array.prototype.forEach.call(tr.children, function (z, nr) {
          if (z.style && z.style.width) return;   // Prozent war schon da
          var anteil = (roh[nr] === null ? mittel : roh[nr]) / gesamt * 100;
          z.style.width = (Math.round(anteil * 10) / 10) + "%";
        });
      });
    });
  }

  function uebernehmen(knoten, elternZiel, imTabelle) {
    if (knoten.nodeType === 3) {
      elternZiel.appendChild(document.createTextNode(knoten.nodeValue));
      return;
    }
    if (knoten.nodeType !== 1) return;
    var name = knoten.tagName.toUpperCase();
    if (RAUS[name]) return;
    var neuerEltern = elternZiel;
    var innenTabelle = imTabelle || name === "TABLE";
    if (ERLAUBT[name]) {
      var kopie = document.createElement(name === "STRONG" ? "B"
                : name === "EM" ? "I"
                : name === "STRIKE" ? "S"
                : name === "FONT" ? "SPAN"
                : name === "MARK" ? "SPAN" : name);
      if (name === "TABLE") kopie.className = "tb-tabelle";
      if (name === "TD" || name === "TH") {
        // Verbundene Zellen: rowspan/colspan reisen mit (Etappe 7).
        ["rowspan", "colspan"].forEach(function (a) {
          var wert = parseInt(knoten.getAttribute(a), 10);
          if (wert > 1) kopie.setAttribute(a, wert);
        });
      }
      var stil = stilUebernehmen(knoten, innenTabelle,
                                 name === "TD" || name === "TH",
                                 name === "TABLE");
      if (stil) kopie.setAttribute("style", stil);
      if (knotenBreiteMerken !== null) {
        kopie.setAttribute("data-tb-breite", String(knotenBreiteMerken));
        knotenBreiteMerken = null;
      }
      // Ein SPAN ohne jede Auszeichnung ist nur Ballast.
      if (kopie.tagName === "SPAN" && !stil) { neuerEltern = elternZiel; }
      else { elternZiel.appendChild(kopie); neuerEltern = kopie; }
    }
    Array.prototype.forEach.call(knoten.childNodes, function (k) {
      uebernehmen(k, neuerEltern, innenTabelle); });
  }

  // Fremde Schriftgrössen werden auf eine der Stufen der App gebracht.
  // Grund: KISIM und Word liefern Grössen in Punkt, die im Schreibfeld
  // winzig aussehen (Näd 15.9.: „viel zu klein"). Eine Grösse, die der
  // normalen entspricht, wird ganz weggelassen — dann erbt der Text die
  // Grösse des Ziels, und das ist fast immer das Gewollte.
  // Gerechnet wird in halben Punkten, wie im RTF. Die Spanne um die
  // normale Grösse ist bewusst breit: Was ein Programm als 10, 11 oder
  // 12 Punkt liefert, ist dort die Normalschrift und soll hier nicht
  // als Sondergrösse festgeschrieben werden.
  function groesseEinnorden(wert) {
    var hp = groesseAlsHalbePunkte(wert);
    if (!hp) return null;
    if (hp <= 19) return "12px";          // bis 9,5 Punkt: klein
    if (hp <= 25) return null;            // 10 bis 12,5 Punkt: normal
    if (hp <= 32) return "19px";          // bis 16 Punkt: gross
    return "24px";                        // darüber: sehr gross
  }

  function stilUebernehmen(knoten, imTabelle, istZelle, istTabelle) {
    var teile = [];
    knotenBreiteMerken = null;
    var s = knoten.style || {};
    // In der Tabelle gilt EINE Schrift: Schriftart und -grösse fliegen
    // dort auf JEDEM Weg raus (Einfügen aus KISIM, Word, RTF-Leser).
    var schrift = imTabelle ? "" :
      (s.fontFamily || knoten.getAttribute("face") || "");
    if (schrift) teile.push("font-family:" + schrift.replace(/["';]/g, ""));
    var groesse = imTabelle ? null : groesseEinnorden(s.fontSize || "");
    if (groesse) teile.push("font-size:" + groesse);
    if (istTabelle) {
      // Die echte Druckbreite der Tabelle bleibt erhalten (23.9.).
      var mb = String(s.minWidth || "").match(/^(\d+)px$/);
      if (mb) teile.push("min-width:" + mb[1] + "px");
    }
    if (istZelle) {
      var breite = String(s.width || knoten.getAttribute("width") || "");
      var bm = breite.match(/^([\d.]+)%$/);
      if (bm) teile.push("width:" + bm[1] + "%");
      else {
        // Punkt-/Bildpunkt-Angabe (Word/Excel) fürs Nachrechnen merken.
        var bp = breite.match(/^([\d.]+)\s*(pt|px)?$/);
        if (bp) {
          var einheit = bp[2] === "pt" ? 96 / 72 : 1;
          knotenBreiteMerken = parseFloat(bp[1]) * einheit;
        }
      }
      // Linien je Zellseite reisen ausdrücklich mit (23.9.).
      [["Top", "top"], ["Right", "right"], ["Bottom", "bottom"],
       ["Left", "left"]].forEach(function (seite) {
        var art = s["border" + seite[0] + "Style"];
        if (art === "none") teile.push("border-" + seite[1] + ":none");
        else if (art && art !== "hidden") {
          teile.push("border-" + seite[1] + ":1px solid #444444");
        }
      });
      var ausricht = s.textAlign;
      if (ausricht === "center" || ausricht === "right") {
        teile.push("text-align:" + ausricht);
      }
    }
    var farbe = s.color || knoten.getAttribute("color") || "";
    if (farbe && farbeAlsZahlen(farbe)) teile.push("color:" + farbe);
    // Markierung: Word und KISIM benutzen teils backgroundColor, teils
    // die alte Auszeichnung <mark> oder background — alle drei prüfen.
    var grund = s.backgroundColor || s.background ||
                (knoten.tagName === "MARK" ? "#ffff00" : "") ||
                knoten.getAttribute("bgcolor") || "";
    var grundZahlen = farbeAlsZahlen(grund);
    // Weiss ist keine Markierung, sondern der Papierhintergrund.
    if (grundZahlen && !(grundZahlen[0] > 245 && grundZahlen[1] > 245 && grundZahlen[2] > 245)) {
      teile.push("background-color:" + grund);
    }
    if ((s.fontWeight === "bold" || parseInt(s.fontWeight, 10) >= 600)) teile.push("font-weight:bold");
    if (s.fontStyle === "italic") teile.push("font-style:italic");
    if (/underline/.test(s.textDecoration || s.textDecorationLine || "")) teile.push("text-decoration:underline");
    return teile.join(";");
  }

  // ---- Der reine Text -------------------------------------------------
  function reinerText(html) {
    var d = reinige(html);
    // Tabellen (Etappe 7): eine Tabellenzeile wird eine Textzeile, die
    // Zellen trennt je ein Tabulator — genau so gibt KISIM selbst eine
    // Tabelle als reinen Text her. Zeilenwechsel INNERHALB einer Zelle
    // werden zu Leerzeichen, damit die Zeile eine Zeile bleibt.
    Array.prototype.forEach.call(d.querySelectorAll("table"), function (t) {
      var zeilen = [];
      Array.prototype.forEach.call(t.querySelectorAll("tr"), function (tr) {
        var zellen = [];
        Array.prototype.forEach.call(tr.children, function (z) {
          var k = z.cloneNode(true);
          Array.prototype.forEach.call(k.querySelectorAll("br"), function (b) {
            b.parentNode.replaceChild(document.createTextNode(" "), b); });
          zellen.push((k.textContent || "").replace(/\s+/g, " ").trim());
        });
        zeilen.push(zellen.join("\t"));
      });
      t.parentNode.replaceChild(
        document.createTextNode("\n" + zeilen.join("\n") + "\n"), t);
    });
    // Absätze und Umbrüche werden zu echten Zeilenwechseln, damit der
    // reine Text gleich aussieht wie der formatierte.
    Array.prototype.forEach.call(d.querySelectorAll("br"), function (b) {
      b.parentNode.replaceChild(document.createTextNode("\n"), b); });
    Array.prototype.forEach.call(d.querySelectorAll("p,div,li"), function (p) {
      p.appendChild(document.createTextNode("\n")); });
    return (d.textContent || "").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
  }

  // ---- Das RTF ---------------------------------------------------------
  function neueWerkstatt() {
    return { schriften: ["Arial"], farben: [null], stuecke: [] };
  }
  function schriftNummer(w, name) {
    var sauber = String(name || "").split(",")[0].replace(/["';]/g, "").trim() || "Arial";
    var i = w.schriften.indexOf(sauber);
    if (i === -1) { w.schriften.push(sauber); i = w.schriften.length - 1; }
    return i;
  }
  function farbNummer(w, wert) {
    var z = farbeAlsZahlen(wert);
    if (!z) return 0;
    var schluessel = z.join(",");
    for (var i = 1; i < w.farben.length; i++) {
      if (w.farben[i] === schluessel) return i;
    }
    w.farben.push(schluessel);
    return w.farben.length - 1;
  }

  // Jedes Zeichen, das kein schlichtes ASCII ist, wird als \uN?
  // geschrieben. Der Bindestrich ebenfalls — sonst könnte "--"
  // entstehen und den HTML-Kommentar zerreissen, in dem das RTF reist.
  function zeichen(text) {
    var aus = "";
    for (var i = 0; i < text.length; i++) {
      var z = text.charAt(i), c = text.charCodeAt(i);
      if (z === "\\" || z === "{" || z === "}") { aus += "\\" + z; continue; }
      if (c === 160) { aus += "\\~"; continue; }
      if (c === 45 || c < 32 || c > 126) {
        var n = c > 32767 ? c - 65536 : c;
        aus += "\\u" + n + "?";
        continue;
      }
      aus += z;
    }
    return aus;
  }

  // Kinderliste eines Absatzes ohne den unsichtbaren Schluss-Umbruch:
  // Chrome hängt in Absätze oft ein <br> ans Ende, das nichts anzeigt.
  function blockKinder(knoten) {
    var kinder = Array.prototype.slice.call(knoten.childNodes);
    while (kinder.length) {
      var letzt = kinder[kinder.length - 1];
      if (letzt.nodeType === 1 && letzt.tagName.toUpperCase() === "BR") {
        kinder.pop(); continue;
      }
      if (letzt.nodeType === 3 &&
          !String(letzt.nodeValue).replace(/[ \t\r\n]+/g, "")) {
        kinder.pop(); continue;
      }
      break;
    }
    return kinder;
  }

  function kinderNachRtf(w, kinder, imListenpunkt) {
    var aus = "";
    Array.prototype.forEach.call(kinder, function (k) {
      aus += knotenNachRtf(w, k, imListenpunkt); });
    return aus;
  }

  // Das Zeilenmodell (19.9.): Jeder Absatz beginnt mit \par statt zu
  // enden — so stimmt auch die nackte erste Zeile des Schreibfelds,
  // und ein leerer Absatz (nur <br> darin) ist genau EIN Umbruch.
  // ausHtml streicht das eine \par am Gesamtanfang wieder weg.
  function knotenNachRtf(w, knoten, imListenpunkt) {
    if (knoten.nodeType === 3) {
      return zeichen(String(knoten.nodeValue).replace(/[ \t\r\n]+/g, " "));
    }
    if (knoten.nodeType !== 1) return "";
    var name = knoten.tagName.toUpperCase();

    if (name === "BR") return "\\par ";
    if (name === "UL" || name === "OL") {
      var aus = "";
      var n = 0;
      Array.prototype.forEach.call(knoten.children, function (li) {
        if (li.tagName.toUpperCase() !== "LI") return;
        n += 1;
        var marke = (name === "OL") ? zeichen(n + ".") : "\\u8226?";
        aus += "\\par {\\pntext " + marke + "\\tab}" +
               kinderNachRtf(w, blockKinder(li), true);
      });
      return aus;
    }
    if (name === "LI") {
      return "\\par {\\pntext \\u8226?\\tab}" +
             kinderNachRtf(w, blockKinder(knoten), true);
    }
    if (name === "TABLE") return tabelleNachRtf(w, knoten);
    if (name === "P" || name === "DIV") {
      var kinder = blockKinder(knoten);
      // Ein Absatz, der NUR eine Tabelle enthält, ist die Tabelle —
      // sonst entstünde davor eine leere Zeile.
      if (kinder.length === 1 && kinder[0].nodeType === 1 &&
          kinder[0].tagName.toUpperCase() === "TABLE") {
        return tabelleNachRtf(w, kinder[0]);
      }
      if (imListenpunkt) return kinderNachRtf(w, kinder, imListenpunkt);
      if (!kinder.length) return "\\par ";
      return "\\par " + kinderNachRtf(w, kinder, imListenpunkt);
    }

    var innen = kinderNachRtf(w, knoten.childNodes, imListenpunkt);
    if (name === "B") return "{\\b " + innen + "}";
    if (name === "I") return "{\\i " + innen + "}";
    if (name === "U") return "{\\ul " + innen + "}";
    if (name === "S") return "{\\strike " + innen + "}";
    if (name === "SPAN") {
      var vor = "", nach = "";
      var s = knoten.style || {};
      if (s.fontFamily) { vor += "\\f" + schriftNummer(w, s.fontFamily); }
      var hp = groesseAlsHalbePunkte(s.fontSize);
      if (hp) vor += "\\fs" + hp;
      if (s.color && farbeAlsZahlen(s.color)) vor += "\\cf" + farbNummer(w, s.color);
      if (s.backgroundColor && farbeAlsZahlen(s.backgroundColor)) {
        var hn = farbNummer(w, s.backgroundColor);
        vor += "\\highlight" + hn + "\\chshdng0\\chcbpat" + hn;
      }
      if (s.fontWeight === "bold" || parseInt(s.fontWeight, 10) >= 600) vor += "\\b ";
      if (s.fontStyle === "italic") vor += "\\i ";
      if (/underline/.test(s.textDecoration || s.textDecorationLine || "")) vor += "\\ul ";
      if (!vor) return innen;
      return "{" + vor + (/[a-z0-9]$/i.test(vor) ? " " : "") + innen + nach + "}";
    }
    return innen;
  }

  // ---- Tabellen als RTF (Etappe 7) ----------------------------------
  // Zeilenbau wie in KISIMs eigenen Vorlagen (Proben 22./23.9.): je
  // Zeile \trowd mit Rändern und \cellx-Kanten (Gesamtbreite 9214
  // Twips wie KISIM), je Zelle \pard\intbl Inhalt \cell, dann \row;
  // \par in der Zelle ist der Zeilenwechsel. Verbünde: rowspan wird
  // \clvmgf mit \clvmrg-Fortsetzungen, colspan eine breitere Zelle.
  var TAB_GESAMT = 9214;
  // Zellrand je Seite: ohne Angaben alle vier Linien (Word-Weg); mit
  // ausdrücklichem „none"/Linie je Seite genau diese (KISIM-Bild).
  function zellRand(zelle) {
    var s = (zelle && zelle.style) || {};
    var seiten = [["l", "Left"], ["t", "Top"], ["r", "Right"], ["b", "Bottom"]];
    var ausdruecklich = seiten.some(function (p) {
      return !!s["border" + p[1] + "Style"];
    });
    var aus = "";
    seiten.forEach(function (p) {
      var art = s["border" + p[1] + "Style"];
      var linie = ausdruecklich ? (art && art !== "none" && art !== "hidden")
                                : true;
      if (linie) aus += "\\clbrdr" + p[0] + "\\brdrw15\\brdrs";
    });
    return aus;
  }
  function tabelleNachRtf(w, tabelle) {
    var quellzeilen = [];
    Array.prototype.forEach.call(tabelle.querySelectorAll("tr"), function (tr) {
      var zellen = Array.prototype.filter.call(tr.children, function (z) {
        var n = z.tagName.toUpperCase();
        return n === "TD" || n === "TH";
      });
      if (zellen.length) quellzeilen.push(zellen);
    });
    if (!quellzeilen.length) return "";

    // 1. Gitter legen: jede Zelle an ihre Spalten, senkrechte Verbünde
    //    reservieren die Stelle in den Folgezeilen.
    function spann(zelle, art) {
      var wert = parseInt(zelle.getAttribute(art), 10);
      return (wert > 1) ? wert : 1;
    }
    var haengend = {};   // Spalten-Index -> { rest, weite }
    var gitterzeilen = [];
    var spaltenzahl = 0;
    quellzeilen.forEach(function (zellen) {
      var eintraege = [];
      var spalte = 0, nr = 0;
      while (nr < zellen.length || haengend[spalte]) {
        if (haengend[spalte]) {
          var h = haengend[spalte];
          eintraege.push({ vmrg: true, von: spalte, weite: h.weite,
                           rand: h.rand });
          h.rest -= 1;
          if (!h.rest) delete haengend[spalte];
          spalte += h.weite;
          continue;
        }
        var zelle = zellen[nr]; nr += 1;
        var weite = spann(zelle, "colspan");
        var hoehe = spann(zelle, "rowspan");
        eintraege.push({ zelle: zelle, von: spalte, weite: weite,
                         vmgf: hoehe > 1, rand: zellRand(zelle) });
        if (hoehe > 1) haengend[spalte] = { rest: hoehe - 1, weite: weite,
                                            rand: zellRand(zelle) };
        spalte += weite;
      }
      if (spalte > spaltenzahl) spaltenzahl = spalte;
      gitterzeilen.push(eintraege);
    });

    // 2. Spaltenbreiten: aus unverbundenen Zellen mit Prozent-Angabe;
    //    der Rest wird gleich verteilt.
    var breiten = [];
    gitterzeilen.forEach(function (eintraege, zr) {
      eintraege.forEach(function (e) {
        if (!e.zelle || e.weite !== 1 || breiten[e.von] !== undefined) return;
        var m = String((e.zelle.style && e.zelle.style.width) || "")
                  .match(/^([\d.]+)%$/);
        if (m) breiten[e.von] = parseFloat(m[1]);
      });
    });
    var summe = 0, offene = 0;
    for (var s = 0; s < spaltenzahl; s++) {
      if (breiten[s] !== undefined) summe += breiten[s]; else offene += 1;
    }
    for (var s2 = 0; s2 < spaltenzahl; s2++) {
      if (breiten[s2] === undefined) {
        breiten[s2] = Math.max(1, (100 - summe) / (offene || 1));
      }
    }
    var kanten = [];   // rechte Kante je Spalte, in Twips
    var lauf = 0;
    for (var s3 = 0; s3 < spaltenzahl; s3++) {
      lauf += breiten[s3];
      kanten[s3] = Math.min(TAB_GESAMT, Math.round(TAB_GESAMT * lauf / 100));
    }
    if (spaltenzahl) kanten[spaltenzahl - 1] = TAB_GESAMT;

    // 3. Zeilen schreiben.
    var aus = "\\par\\pard ";
    gitterzeilen.forEach(function (eintraege) {
      var defs = "\\trowd\\trgaph80\\trleft-80\\trpaddl80\\trpaddr80" +
                 "\\trpaddfl3\\trpaddfr3";
      eintraege.forEach(function (e) {
        var schattierung = "";
        if (e.zelle) {
          var grund = (e.zelle.style && e.zelle.style.backgroundColor) || "";
          var gz = farbeAlsZahlen(grund);
          if (gz && !(gz[0] > 245 && gz[1] > 245 && gz[2] > 245)) {
            schattierung = "\\clcbpat" + farbNummer(w, grund);
          }
        }
        defs += e.rand +
                (e.vmgf ? "\\clvmgf" : "") + (e.vmrg ? "\\clvmrg" : "") +
                schattierung + "\\cellx" + kanten[e.von + e.weite - 1];
      });
      aus += defs;
      eintraege.forEach(function (e) {
        if (!e.zelle) { aus += "\\pard\\intbl \\cell "; return; }
        var inhalt = kinderNachRtf(w, blockKinder(e.zelle), false)
                       .replace(/^\\par /, "");
        if (e.zelle.tagName.toUpperCase() === "TH") inhalt = "{\\b " + inhalt + "}";
        var ausricht = (e.zelle.style && e.zelle.style.textAlign) || "";
        var q = ausricht === "center" ? "\\qc" : ausricht === "right" ? "\\qr" : "";
        aus += "\\pard\\intbl" + q + " " + inhalt + "\\cell ";
      });
      aus += "\\row ";
    });
    return aus + "\\pard ";
  }

  function ausHtml(html) {
    var baum = reinige(html);
    var w = neueWerkstatt();
    var koerper = "";
    Array.prototype.forEach.call(baum.childNodes, function (k) {
      koerper += knotenNachRtf(w, k, false); });
    // Beginnt der Inhalt mit einem Absatz, hat er ein \par vorweg —
    // vor der ersten Zeile gehört aber keins.
    koerper = koerper.replace(/^\\par /, "");

    var schrifttabelle = "{\\fonttbl";
    w.schriften.forEach(function (name, i) {
      schrifttabelle += "{\\f" + i + "\\fnil\\fcharset0 " + name + ";}";
    });
    schrifttabelle += "}";

    var farbtabelle = "";
    if (w.farben.length > 1) {
      farbtabelle = "{\\colortbl";
      w.farben.forEach(function (eintrag) {
        if (!eintrag) { farbtabelle += ";"; return; }
        var t = eintrag.split(",");
        farbtabelle += "\\red" + t[0] + "\\green" + t[1] + "\\blue" + t[2] + ";";
      });
      farbtabelle += "}";
    }

    // Der am 14.9.2026 bewiesene Kopf. Jede Zutat hat ihren Grund;
    // die Sparversion ohne sie hat KISIM stillschweigend abgelehnt.
    var kopf = "{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang2055" +
               schrifttabelle + farbtabelle +
               "\\viewkind4\\uc1 \\pard\\f0\\fs20 ";
    var rtf = kopf + koerper + "}";
    // Sicherheitsnetz: kein Doppelstrich, sonst zerfällt der
    // HTML-Kommentar, in dem das RTF reist.
    return rtf.replace(/-{2,}/g, function (t) {
      return t.split("").join("\\u45?").replace(/-/g, "\\u45?"); });
  }

  // Der Träger: derselbe sichtbare Inhalt, das RTF unsichtbar davor.
  // Bewiesen am 14.9.: Beim Markier-Kopieren wirft Chrome die Marke
  // weg, bei der modernen Kopiertechnik bleibt sie erhalten — die App
  // benutzt darum ausschliesslich die moderne.
  function traegerHtml(html) {
    return "<!--TBRTF:" + ausHtml(html) + "-->" + html;
  }

  return { reinige: reinige, reinerText: reinerText, ausHtml: ausHtml,
           traegerHtml: traegerHtml,
           farbeAlsZahlen: farbeAlsZahlen,
           groesseAlsHalbePunkte: groesseAlsHalbePunkte,
           groesseEinnorden: groesseEinnorden };
})();
