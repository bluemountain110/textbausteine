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
//        Absätze, Zeilenumbrüche und Aufzählungen.
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
    "FONT": 1, "MARK": 1
  };
  // Alles, was Inhalt bringt, aber keine Auszeichnung ist, wird zum
  // schlichten Absatz. Alles Gefährliche fliegt ganz raus.
  var RAUS = { "SCRIPT": 1, "STYLE": 1, "IFRAME": 1, "OBJECT": 1,
               "EMBED": 1, "LINK": 1, "META": 1, "HEAD": 1 };

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
    return ziel;
  }

  function uebernehmen(knoten, elternZiel) {
    if (knoten.nodeType === 3) {
      elternZiel.appendChild(document.createTextNode(knoten.nodeValue));
      return;
    }
    if (knoten.nodeType !== 1) return;
    var name = knoten.tagName.toUpperCase();
    if (RAUS[name]) return;
    var neuerEltern = elternZiel;
    if (ERLAUBT[name]) {
      var kopie = document.createElement(name === "STRONG" ? "B"
                : name === "EM" ? "I"
                : name === "STRIKE" ? "S"
                : name === "FONT" ? "SPAN"
                : name === "MARK" ? "SPAN" : name);
      var stil = stilUebernehmen(knoten);
      if (stil) kopie.setAttribute("style", stil);
      // Ein SPAN ohne jede Auszeichnung ist nur Ballast.
      if (kopie.tagName === "SPAN" && !stil) { neuerEltern = elternZiel; }
      else { elternZiel.appendChild(kopie); neuerEltern = kopie; }
    }
    Array.prototype.forEach.call(knoten.childNodes, function (k) {
      uebernehmen(k, neuerEltern); });
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

  function stilUebernehmen(knoten) {
    var teile = [];
    var s = knoten.style || {};
    var schrift = s.fontFamily || knoten.getAttribute("face") || "";
    if (schrift) teile.push("font-family:" + schrift.replace(/["';]/g, ""));
    var groesse = groesseEinnorden(s.fontSize || "");
    if (groesse) teile.push("font-size:" + groesse);
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
    if (name === "P" || name === "DIV") {
      var kinder = blockKinder(knoten);
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
