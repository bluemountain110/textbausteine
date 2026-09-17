// Datei: rtf-lesen.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Liest RTF und macht daraus das HTML der App. Nötig, weil
//        KISIM beim Kopieren NUR reinen Text und RTF anbietet, kein
//        HTML (bewiesen am 16.9. am Arbeitsrechner) — ohne diesen Leser
//        käme aus KISIM nur nackter Text in einen Baustein.
//
//        Gelesen werden: fett, kursiv, unterstrichen, durchgestrichen,
//        Schriftfarbe, Markierung, Schriftart, Schriftgrösse, Absätze,
//        Zeilenumbrüche, Umlaute und Sonderzeichen.
//        Aufzählungen und Nummerierungen schreibt KISIM in der alten
//        Schreibweise: Die Marke steht als eigener kleiner Block
//        {\pntext\f0 1.\tab} VOR dem Absatz. Der Leser erkennt das und
//        macht daraus eine echte Liste — sonst stünde „1." samt
//        Tabulator wörtlich im Baustein und der Einzug wäre falsch
//        (Näds Probe vom 16.9.).
//        Bewusst NICHT gelesen: Tabellen, Bilder, Kopfzeilen,
//        Formatvorlagen, Einzüge, Tabulatorabstände. Die verwirft der
//        Leser stillschweigend, statt zu versuchen, jeden Sonderfall zu
//        treffen — ein Baustein braucht sie nicht.
//
//        Zwei Schreibweisen muss er beherrschen: KISIM setzt
//        Auszeichnungen als SCHALTER (\b fett\b0), die App selbst als
//        GRUPPEN ({\b fett}). Beides kommt vor, auch gemischt.
//        GRUNDSATZ: Hier fliesst Bausteintext, nie Patientendaten.

"use strict";
window.TB = window.TB || {};

TB.rtfLesen = (function () {

  // Gruppen, deren ganzer Inhalt übersprungen wird.
  var UEBERSPRINGEN = {
    fonttbl: 1, colortbl: 1, stylesheet: 1, info: 1, pict: 1, object: 1, pn: 1,
    header: 1, footer: 1, footnote: 1, generator: 1, listtable: 1,
    listoverridetable: 1, rsidtbl: 1, themedata: 1, colorschememapping: 1,
    latentstyles: 1, datastore: 1, xmlnstbl: 1, bkmkstart: 1, bkmkend: 1,
    fldinst: 1, filetbl: 1, revtbl: 1, mmathPr: 1
  };

  function leerZustand() {
    return { b: false, i: false, ul: false, strike: false,
             cf: 0, highlight: 0, fs: 0, f: -1 };
  }
  function gleich(a, b) {
    return a.b === b.b && a.i === b.i && a.ul === b.ul && a.strike === b.strike &&
           a.cf === b.cf && a.highlight === b.highlight && a.fs === b.fs && a.f === b.f;
  }
  function kopie(z) {
    return { b: z.b, i: z.i, ul: z.ul, strike: z.strike,
             cf: z.cf, highlight: z.highlight, fs: z.fs, f: z.f };
  }

  function entschaerfe(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Die Farbtabelle: {\colortbl ;\red255\green255\blue0;...}
  // Der erste Eintrag ist leer und bedeutet „Vorgabefarbe".
  function farbtabelle(roh) {
    var treffer = roh.match(/\{\\colortbl([^}]*)\}/i);
    var farben = [null];
    if (!treffer) return farben;
    treffer[1].split(";").forEach(function (stueck, i) {
      if (i === 0 && !/red/i.test(stueck)) return;      // führendes Semikolon
      var r = stueck.match(/\\red(\d+)/i), g = stueck.match(/\\green(\d+)/i),
          b = stueck.match(/\\blue(\d+)/i);
      if (r && g && b) farben.push([+r[1], +g[1], +b[1]]);
      else if (stueck.trim() === "") farben.push(null);
    });
    // Ein abschliessender Strichpunkt erzeugt einen leeren Eintrag am
    // Ende — der gehört nicht zur Tabelle.
    while (farben.length > 1 && farben[farben.length - 1] === null) farben.pop();
    return farben;
  }

  // Die Schrifttabelle: {\fonttbl{\f0\fnil\fcharset0 Arial;}...}
  function schrifttabelle(roh) {
    var schriften = {};
    var bereich = roh.match(/\{\\fonttbl(.*)/i);
    if (!bereich) return schriften;
    // Aus {\f0\fnil\fcharset0 Arial;} soll „Arial" werden: erst alles
    // bis zum Strichpunkt nehmen, dann die Steuerwörter herausstreichen.
    var muster = /\{\\f(\d+)([^;{}]*);/g, t;
    while ((t = muster.exec(bereich[1])) !== null) {
      var name = String(t[2]).replace(/\\[a-zA-Z]+-?\d*\s?/g, "").trim();
      if (name) schriften[+t[1]] = name;
    }
    return schriften;
  }

  // Welche Schrift ist die Vorgabe? Die muss nicht an jedes Stück
  // geschrieben werden — sonst steht in jedem Baustein hundertmal
  // „Arial" und macht ihn unlesbar.
  function vorgabeSchrift(roh, schriften) {
    var t = roh.match(/\\deff(\d+)/);
    var nummer = t ? +t[1] : 0;
    return schriften[nummer] || "";
  }

  function farbeAlsText(eintrag) {
    if (!eintrag) return "";
    return "rgb(" + eintrag[0] + ", " + eintrag[1] + ", " + eintrag[2] + ")";
  }

  function lies(roh) {
    var text = String(roh || "");
    if (text.indexOf("{\\rtf") === -1) return "";
    var farben = farbtabelle(text);
    var schriften = schrifttabelle(text);
    var grundschrift = vorgabeSchrift(text, schriften);

    var zustand = leerZustand();
    var stapel = [];
    var absaetze = [];            // fertige Absätze als HTML
    var stuecke = [];             // Stücke des laufenden Absatzes
    var laufend = leerZustand();  // Zustand des laufenden Stücks
    var puffer = "";
    var marke = null;             // Listen-Marke des laufenden Absatzes
    var sammleMarke = null;       // solange die Marke gelesen wird
    var markeTiefe = -1;
    var ueberspringeBis = -1;     // Stapeltiefe, ab der übersprungen wird
    var uc = 1;                   // wie viele Zeichen ein \uN ersetzt
    var i = 0, n = text.length;

    function stueckSchliessen() {
      if (!puffer) return;
      stuecke.push({ text: puffer, stil: kopie(laufend) });
      puffer = "";
    }
    function absatzSchliessen() {
      stueckSchliessen();
      absaetze.push({ stuecke: stuecke, marke: marke });
      stuecke = [];
      marke = null;
    }
    function schreibe(zeichen) {
      if (sammleMarke !== null) { sammleMarke += zeichen; return; }
      if (ueberspringeBis >= 0) return;
      if (!gleich(zustand, laufend)) { stueckSchliessen(); laufend = kopie(zustand); }
      puffer += zeichen;
    }

    while (i < n) {
      var c = text.charAt(i);

      if (c === "{") {
        stapel.push({ z: kopie(zustand), ueber: ueberspringeBis });
        i++;
        continue;
      }
      if (c === "}") {
        var oben = stapel.pop();
        if (oben) {
          if (sammleMarke !== null && stapel.length <= markeTiefe) {
            marke = sammleMarke.replace(/&#9;|\t/g, "").trim();
            sammleMarke = null; markeTiefe = -1;
          }
          if (ueberspringeBis >= 0 && stapel.length < ueberspringeBis) ueberspringeBis = -1;
          zustand = oben.z;
          if (!gleich(zustand, laufend)) { stueckSchliessen(); laufend = kopie(zustand); }
        }
        i++;
        continue;
      }
      if (c === "\\") {
        // Steuersymbol oder Steuerwort
        var naechstes = text.charAt(i + 1);
        if (naechstes === "\\" || naechstes === "{" || naechstes === "}") {
          schreibe(entschaerfe(naechstes)); i += 2; continue;
        }
        if (naechstes === "'") {
          var hex = text.substr(i + 2, 2);
          var wert = parseInt(hex, 16);
          if (!isNaN(wert)) schreibe(entschaerfe(cp1252(wert)));
          i += 4; continue;
        }
        if (naechstes === "~") { schreibe("&nbsp;"); i += 2; continue; }
        if (naechstes === "-" ) { i += 2; continue; }        // weicher Trenner
        if (naechstes === "_" ) { schreibe("&#8209;"); i += 2; continue; }
        if (naechstes === "*") {
          // {\*\irgendwas ...} — eine Gruppe, die ein Leser überspringen
          // darf, wenn er sie nicht kennt. Wir kennen keine davon.
          if (ueberspringeBis < 0) ueberspringeBis = stapel.length;
          i += 2; continue;
        }
        if (naechstes === "\n" || naechstes === "\r") { i += 2; continue; }

        var wort = text.slice(i + 1).match(/^([a-zA-Z]+)(-?\d+)? ?/);
        if (!wort) { i += 2; continue; }
        var name = wort[1];
        var zahl = (wort[2] === undefined) ? null : parseInt(wort[2], 10);
        i += 1 + wort[0].length;

        if (name === "pntext") {
          // Ab hier bis zum Ende der Gruppe steht die Listen-Marke.
          sammleMarke = ""; markeTiefe = stapel.length - 1;
          continue;
        }
        if (UEBERSPRINGEN[name.toLowerCase()]) {
          if (ueberspringeBis < 0) ueberspringeBis = stapel.length;
          continue;
        }
        if (ueberspringeBis >= 0) continue;

        switch (name) {
          case "par": case "line": case "sect":
            if (name === "line") { stueckSchliessen(); stuecke.push({ umbruch: true }); }
            else absatzSchliessen();
            break;
          case "pard": zustand = leerZustand(); break;
          case "plain": zustand = leerZustand(); break;
          case "b": zustand.b = (zahl !== 0); break;
          case "i": zustand.i = (zahl !== 0); break;
          case "ul": zustand.ul = (zahl !== 0); break;
          case "ulnone": zustand.ul = false; break;
          case "strike": zustand.strike = (zahl !== 0); break;
          case "striked": zustand.strike = (zahl !== 0); break;
          case "cf": zustand.cf = zahl || 0; break;
          case "highlight": case "chcbpat": zustand.highlight = zahl || 0; break;
          case "fs": zustand.fs = zahl || 0; break;
          case "f": zustand.f = (zahl === null ? -1 : zahl); break;
          case "tab": schreibe("&#9;"); break;
          case "emdash": schreibe("&#8212;"); break;
          case "endash": schreibe("&#8211;"); break;
          case "lquote": schreibe("&#8216;"); break;
          case "rquote": schreibe("&#8217;"); break;
          case "ldblquote": schreibe("&#8222;"); break;
          case "rdblquote": schreibe("&#8220;"); break;
          case "bullet": schreibe("&#8226;"); break;
          case "uc": uc = (zahl === null ? 1 : zahl); break;
          case "u":
            if (zahl !== null) {
              var punkt = zahl < 0 ? zahl + 65536 : zahl;
              schreibe("&#" + punkt + ";");
              // Die Ersatzzeichen danach überspringen.
              var weg = uc;
              while (weg > 0 && i < n) {
                if (text.charAt(i) === "\\" && text.charAt(i + 1) === "'") i += 4;
                else i += 1;
                weg--;
              }
            }
            break;
          default: break;   // alles Unbekannte still verwerfen
        }
        continue;
      }
      if (c === "\n" || c === "\r") { i++; continue; }
      schreibe(entschaerfe(c));
      i++;
    }
    absatzSchliessen();

    // ---- Aus den Stücken HTML bauen -----------------------------------
    var zeilen = absaetze.map(function (absatz) {
      var zeile = "";
      absatz.stuecke.forEach(function (st) {
        if (st.umbruch) { zeile += "<br>"; return; }
        if (!st.text) return;
        zeile += huelle(st.text, st.stil, farben, schriften, grundschrift);
      });
      return { html: zeile, marke: absatz.marke };
    });
    // Leere Absätze am Rand wegräumen — KISIM hängt regelmässig einen an.
    function leer(z) { return !z.html.replace(/<[^>]*>|&nbsp;|\s/g, ""); }
    while (zeilen.length && leer(zeilen[zeilen.length - 1])) zeilen.pop();
    while (zeilen.length && leer(zeilen[0])) zeilen.shift();

    // Aufeinanderfolgende Listen-Absätze werden zu EINER Liste.
    var aus = "", offeneListe = null;
    function listenArt(m) {
      return /[0-9]|^[a-zA-Z][.)]/.test(m) ? "ol" : "ul";
    }
    zeilen.forEach(function (z) {
      if (z.marke) {
        var art = listenArt(z.marke);
        if (offeneListe !== art) {
          if (offeneListe) aus += "</" + offeneListe + ">";
          aus += "<" + art + ">";
          offeneListe = art;
        }
        aus += "<li>" + z.html + "</li>";
      } else {
        if (offeneListe) { aus += "</" + offeneListe + ">"; offeneListe = null; }
        aus += (aus && !/>$/.test(aus) ? "<br>" : (aus ? "" : "")) + z.html;
        if (!/(<\/(ul|ol)>)$/.test(aus)) { /* Umbruch folgt beim nächsten */ }
        aus += "<br>";
      }
    });
    if (offeneListe) aus += "</" + offeneListe + ">";
    return aus.replace(/(<br>)+$/, "");
  }

  function huelle(inhalt, stil, farben, schriften, grundschrift) {
    var teile = [];
    if (stil.f >= 0 && schriften[stil.f] && schriften[stil.f] !== grundschrift) {
      teile.push("font-family:" + schriften[stil.f]);
    }
    if (stil.fs) {
      var groesse = TB.auszeichnung.groesseEinnorden((stil.fs / 2) + "pt");
      if (groesse) teile.push("font-size:" + groesse);
    }
    if (stil.cf && farben[stil.cf]) {
      var f = farben[stil.cf];
      // Schwarz ist die Vorgabe und keine Auszeichnung.
      if (!(f[0] === 0 && f[1] === 0 && f[2] === 0)) {
        teile.push("color:" + farbeAlsText(f));
      }
    }
    if (stil.highlight && farben[stil.highlight]) {
      var h = farben[stil.highlight];
      if (!(h[0] > 245 && h[1] > 245 && h[2] > 245)) {
        teile.push("background-color:" + farbeAlsText(h));
      }
    }
    var aus = inhalt;
    if (teile.length) aus = '<span style="' + teile.join(";") + '">' + aus + "</span>";
    if (stil.ul) aus = "<u>" + aus + "</u>";
    if (stil.strike) aus = "<s>" + aus + "</s>";
    if (stil.i) aus = "<i>" + aus + "</i>";
    if (stil.b) aus = "<b>" + aus + "</b>";
    return aus;
  }

  // Die Zeichen 128 bis 159 sind in Windows-1252 anders belegt als in
  // der reinen Zeichentabelle — vor allem Anführungszeichen und Striche.
  var SONDER = { 128: 8364, 130: 8218, 131: 402, 132: 8222, 133: 8230,
    134: 8224, 135: 8225, 136: 710, 137: 8240, 138: 352, 139: 8249,
    140: 338, 142: 381, 145: 8216, 146: 8217, 147: 8220, 148: 8221,
    149: 8226, 150: 8211, 151: 8212, 152: 732, 153: 8482, 154: 353,
    155: 8250, 156: 339, 158: 382, 159: 376 };
  function cp1252(wert) {
    if (SONDER[wert]) return String.fromCharCode(SONDER[wert]);
    return String.fromCharCode(wert);
  }

  return { lies: lies, farbtabelle: farbtabelle, schrifttabelle: schrifttabelle };
})();
