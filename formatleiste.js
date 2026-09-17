// Datei: formatleiste.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Das Schreibfeld mit Formatierung für das Bearbeiten-Fenster.
//        Liefert die Leiste (fett, kursiv, unterstrichen,
//        durchgestrichen, Schriftfarbe, Markierung, Schriftart,
//        Schriftgrösse, zwei Listenarten, Auszeichnungen entfernen)
//        und das Feld darunter.
//        Alles, was von aussen hineinkopiert wird — aus KISIM, Word,
//        Axenita —, läuft durch die Reinigung in auszeichnung.js. So
//        kommt nie fremder Seitenaufbau in einen Baustein.
//        Ein Hinweis unter der Leiste sagt, was am jeweiligen Ziel
//        ankommt: Axenita kennt keine Schriftgrösse und keine
//        Markierung, KISIM und Word können alles.
//        GRUNDSATZ: Hier steht Bausteintext, nie Patiententext.

"use strict";
window.TB = window.TB || {};

TB.formatleiste = (function () {
  var el = function (art, klasse, text) {
    var e = document.createElement(art);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  var SCHRIFTEN = ["Arial", "Times New Roman", "Calibri", "Courier New", "Verdana"];
  // „Normal" entspricht Arial 10 Punkt — der Grundschrift des
  // Schreibfelds und der KISIM-Textfelder.
  var GROESSEN = [["Klein", "11px"], ["Normal", "13.3px"],
                  ["Gross", "17px"], ["Sehr gross", "21px"]];
  var FARBEN = [["Schwarz", "#000000"], ["Rot", "#c00000"], ["Blau", "#0033cc"],
                ["Grün", "#107c41"], ["Grau", "#666666"]];
  var MARKIERUNGEN = [["Gelb", "#ffff00"], ["Grün", "#b6f2c4"], ["Blau", "#cfe3ff"],
                      ["Keine", ""]];

  // Ein Befehl an das Schreibfeld. execCommand ist der einzige Weg, der
  // in allen Browsern an der Cursor-Stelle arbeitet, ohne dass die App
  // eine eigene Textverarbeitung mitbringen müsste.
  function befehl(feld, name, wert) {
    feld.focus();
    try { document.execCommand(name, false, wert === undefined ? null : wert); }
    catch (e) { /* nicht unterstützt — die Leiste bleibt trotzdem bedienbar */ }
  }

  // Schriftgrösse und Markierung gehen über einen umschliessenden
  // Bereich, weil die alten Befehle dafür Grössen 1 bis 7 kennen statt
  // echter Werte.
  function stilSetzen(feld, eigenschaft, wert) {
    feld.focus();
    var auswahl = window.getSelection();
    if (!auswahl || auswahl.isCollapsed || !auswahl.rangeCount) return false;
    var bereich = auswahl.getRangeAt(0);
    var huelle = document.createElement("span");
    huelle.style[eigenschaft] = wert;
    try {
      huelle.appendChild(bereich.extractContents());
      bereich.insertNode(huelle);
      auswahl.removeAllRanges();
      var neu = document.createRange();
      neu.selectNodeContents(huelle);
      auswahl.addRange(neu);
      return true;
    } catch (e) { return false; }
  }

  function erzeuge(platz, einstellungen) {
    var e = einstellungen || {};
    var rahmen = el("div", "schreibfeld-rahmen");
    var leiste = el("div", "formatleiste");
    var feld = el("div", "schreibfeld");
    feld.setAttribute("contenteditable", "true");
    feld.innerHTML = e.wert || "";

    function geaendert() { if (e.beiAenderung) e.beiAenderung(); }

    function knopf(beschriftung, titel, tat, klasse) {
      var k = el("button", "leise klein" + (klasse ? " " + klasse : ""), beschriftung);
      k.type = "button";
      k.title = titel || beschriftung;
      k.addEventListener("mousedown", function (ev) { ev.preventDefault(); });
      k.addEventListener("click", function (ev) {
        ev.preventDefault(); tat(); geaendert(); });
      leiste.appendChild(k);
      return k;
    }
    function waehler(beschriftung, titel, eintraege, tat) {
      var w = document.createElement("select");
      w.className = "klein";
      w.title = titel;
      var erster = el("option", "", beschriftung);
      erster.value = "";
      w.appendChild(erster);
      eintraege.forEach(function (p) {
        var o = el("option", "", p[0]); o.value = p[1]; w.appendChild(o);
      });
      w.addEventListener("mousedown", function () { feld.focus(); });
      w.addEventListener("change", function () {
        if (w.value !== "" || beschriftung === TB.T.formMarkierung) tat(w.value);
        w.selectedIndex = 0; geaendert();
      });
      leiste.appendChild(w);
      return w;
    }

    knopf("F", TB.T.formFett, function () { befehl(feld, "bold"); }, "knopf-fett");
    knopf("K", TB.T.formKursiv, function () { befehl(feld, "italic"); }, "knopf-kursiv");
    knopf("U", TB.T.formUnterstrichen, function () { befehl(feld, "underline"); }, "knopf-unter");
    knopf("S", TB.T.formDurchgestrichen, function () { befehl(feld, "strikeThrough"); }, "knopf-durch");
    knopf("•", TB.T.formListe, function () { befehl(feld, "insertUnorderedList"); });
    knopf("1.", TB.T.formNummern, function () { befehl(feld, "insertOrderedList"); });
    waehler(TB.T.formFarbe, TB.T.formFarbe, FARBEN, function (wert) {
      befehl(feld, "foreColor", wert); });
    waehler(TB.T.formMarkierung, TB.T.formMarkierung, MARKIERUNGEN, function (wert) {
      if (wert === "") { befehl(feld, "hiliteColor", "transparent"); }
      else if (!stilSetzen(feld, "backgroundColor", wert)) {
        befehl(feld, "hiliteColor", wert); }
    });
    waehler(TB.T.formSchriftart, TB.T.formSchriftart,
      SCHRIFTEN.map(function (s) { return [s, s]; }), function (wert) {
        if (!stilSetzen(feld, "fontFamily", wert)) befehl(feld, "fontName", wert); });
    waehler(TB.T.formGroesse, TB.T.formGroesse, GROESSEN, function (wert) {
      stilSetzen(feld, "fontSize", wert); });
    knopf("⌫", TB.T.formSauber, function () {
      befehl(feld, "removeFormat");
      befehl(feld, "insertUnorderedList");
      befehl(feld, "insertUnorderedList");
    });

    rahmen.appendChild(leiste);
    var hinweis = el("div", "erklaerung klein-hinweis", TB.T.formHinweisZiele);
    rahmen.appendChild(hinweis);
    rahmen.appendChild(feld);
    if (platz) platz.appendChild(rahmen);

    // Einfügen von aussen: immer durch die Reinigung. Ohne das käme
    // Words halber Seitenaufbau in den Baustein.
    feld.addEventListener("paste", function (ev) {
      var d = ev.clipboardData;
      if (!d) return;
      var html = "";
      try { html = d.getData("text/html") || ""; } catch (f) { }
      var text = "";
      try { text = d.getData("text/plain") || ""; } catch (f) { }
      var rtf = "";
      try { rtf = d.getData("text/rtf") || ""; } catch (f) { }
      ev.preventDefault();
      // KISIM bietet gar kein HTML an, nur reinen Text und RTF
      // (bewiesen am 16.9.). Darum wird das RTF gelesen, wenn kein HTML
      // da ist — sonst käme aus KISIM nur nackter Text herein.
      var ausRtf = (!html && rtf) ? TB.rtfLesen.lies(rtf) : "";
      var sauber = html
        ? TB.auszeichnung.reinige(html).innerHTML
        : (ausRtf
            ? TB.auszeichnung.reinige(ausRtf).innerHTML
            : String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                          .replace(/\n/g, "<br>"));
      befehl(feld, "insertHTML", sauber);
      geaendert();
    });
    feld.addEventListener("input", geaendert);

    // Tastenkürzel: dieselben Tätigkeiten wie die Leiste. Strg+B, I und U
    // kennt der Browser von sich aus — wir fangen sie trotzdem ab, damit
    // eine geänderte Belegung wirklich gilt und nicht beides zugleich
    // passiert.
    feld.addEventListener("keydown", function (ev) {
      var treffer = TB.tastenkuerzel.befehlFuer(ev);
      if (!treffer) return;
      ev.preventDefault();
      if (treffer.taetigkeit === "sauber") {
        befehl(feld, "removeFormat");
      } else {
        befehl(feld, treffer.befehl);
      }
      geaendert();
    });

    // Das Einsetzen eines Platzhalters an der Cursor-Stelle. Der
    // Platzhalter wird IMMER ohne Auszeichnung eingesetzt, damit er
    // nicht versehentlich mitten drin formatiert ist und dann stumm
    // nicht wirkt (siehe reichtext.js).
    function platzhalterEinsetzen(text, markiereVon, markiereBis) {
      feld.focus();
      befehl(feld, "removeFormat");
      befehl(feld, "insertText", text);
      if (markiereVon !== undefined) {
        var auswahl = window.getSelection();
        try {
          var knoten = auswahl.focusNode;
          if (knoten && knoten.nodeType === 3) {
            var ende = auswahl.focusOffset;
            var anfang = ende - text.length;
            var b = document.createRange();
            b.setStart(knoten, anfang + markiereVon);
            b.setEnd(knoten, anfang + markiereBis);
            auswahl.removeAllRanges();
            auswahl.addRange(b);
          }
        } catch (f) { }
      }
      geaendert();
    }

    return {
      rahmen: rahmen,
      feld: feld,
      wert: function () { return TB.auszeichnung.reinige(feld.innerHTML).innerHTML; },
      reinerText: function () { return TB.auszeichnung.reinerText(feld.innerHTML); },
      setzeWert: function (html) { feld.innerHTML = html || ""; geaendert(); },
      platzhalterEinsetzen: platzhalterEinsetzen,
      fokus: function () { feld.focus(); }
    };
  }

  return { erzeuge: erzeuge, SCHRIFTEN: SCHRIFTEN, GROESSEN: GROESSEN,
           FARBEN: FARBEN, MARKIERUNGEN: MARKIERUNGEN };
})();
