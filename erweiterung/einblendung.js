// Datei: einblendung.js
// Projekt: Textbausteine — Teil: Chrome-Erweiterung
// Zweck: Alles, was die Erweiterung in eine Seite legen kann: das
//        Lücken-Fenster (Felder und Auswahlen abfragen, mit Vorschau),
//        das Such-Fenster (;;? — sucht seit Etappe 5 auch im TEXT der
//        Bausteine), das Auswahl-Fenster beim Tippen (häufigste fünf
//        zuoberst, dann alphabetisch, Klick fügt ein — es stiehlt nie
//        den Fokus), das Entwurf-Fenster (;;neu) und die kleine
//        Meldung am unteren Rand. Alles wird direkt in die Seite
//        gezeichnet und mit dem Schliessen restlos entfernt.
//        GRUNDSATZ: nichts wird gespeichert, keine Patientendaten.

"use strict";
window.TB = window.TB || {};

TB.einblendung = (function () {

  var AKTIV = null;     // höchstens ein Fenster mit Decke gleichzeitig
  var VORSCHLAG = null; // das Auswahl-Fenster beim Tippen (ohne Decke)

  function zu() {
    if (AKTIV && AKTIV.parentNode) AKTIV.parentNode.removeChild(AKTIV);
    AKTIV = null;
  }

  function baue(doc, klasse) {
    zu();
    zuVorschlag();
    var decke = doc.createElement("div");
    decke.className = "tbx-decke";
    var karte = doc.createElement("div");
    karte.className = "tbx-karte " + klasse;
    decke.appendChild(karte);
    (doc.body || doc.documentElement).appendChild(decke);
    AKTIV = decke;
    return karte;
  }

  function el(doc, art, klasse, text) {
    var e = doc.createElement(art);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // ---- Kleine Meldung ---------------------------------------------------
  function toast(doc, text, fehler) {
    var alt = doc.querySelector(".tbx-toast");
    if (alt && alt.parentNode) alt.parentNode.removeChild(alt);
    var t = el(doc, "div", "tbx-toast" + (fehler ? " tbx-rot" : ""), text);
    (doc.body || doc.documentElement).appendChild(t);
    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 4000);
  }

  // ---- Lücken-Fenster -----------------------------------------------------
  // opt: { titel, luecken, vorschau(antworten)->Text, beiFertig, beiAbbruch }
  function oeffneLuecken(doc, opt) {
    var karte = baue(doc, "tbx-luecken");
    karte.appendChild(el(doc, "div", "tbx-titel", opt.titel || ""));

    var eingaben = [];
    opt.luecken.forEach(function (l) {
      var zeile = el(doc, "label", "tbx-zeile");
      zeile.appendChild(el(doc, "span", "tbx-beschriftung", l.beschriftung));
      var feld;
      if (l.art === "auswahl") {
        feld = doc.createElement("select");
        l.optionen.forEach(function (o) {
          var op = doc.createElement("option");
          op.value = o; op.textContent = o;
          feld.appendChild(op);
        });
      } else {
        feld = doc.createElement("input");
        feld.type = "text";
        feld.value = l.vorgabe || "";
      }
      feld.className = "tbx-feld";
      zeile.appendChild(feld);
      karte.appendChild(zeile);
      eingaben.push({ beschriftung: l.beschriftung, feld: feld });
    });

    karte.appendChild(el(doc, "div", "tbx-klein", TB.TE.vorschau));
    var vorschau = el(doc, "div", "tbx-vorschau", "");
    karte.appendChild(vorschau);

    var leiste = el(doc, "div", "tbx-leiste");
    var abKnopf = el(doc, "button", "tbx-knopf", TB.TE.abbrechen);
    var okKnopf = el(doc, "button", "tbx-knopf tbx-haupt", TB.TE.lueckenEinfuegen);
    leiste.appendChild(abKnopf); leiste.appendChild(okKnopf);
    karte.appendChild(leiste);

    function antworten() {
      var a = {};
      eingaben.forEach(function (e) { a[e.beschriftung] = e.feld.value; });
      return a;
    }
    function zeichneVorschau() {
      var t = "";
      try { t = opt.vorschau(antworten()); } catch (e) { t = ""; }
      vorschau.textContent = t.length > 400 ? t.slice(0, 400) + " …" : t;
    }
    function fertig() { zu(); opt.beiFertig(antworten()); }
    function abbruch() { zu(); opt.beiAbbruch(); }

    eingaben.forEach(function (e, i) {
      e.feld.addEventListener("input", zeichneVorschau);
      e.feld.addEventListener("change", zeichneVorschau);
      e.feld.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault(); ev.stopPropagation();
          if (i + 1 < eingaben.length) eingaben[i + 1].feld.focus();
          else fertig();
        }
      });
    });
    karte.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); abbruch(); }
      ev.stopPropagation(); // die Seite darunter bekommt nichts mit
    });
    okKnopf.addEventListener("click", fertig);
    abKnopf.addEventListener("click", abbruch);

    zeichneVorschau();
    if (eingaben.length) eingaben[0].feld.focus();
    if (eingaben[0] && eingaben[0].feld.select) eingaben[0].feld.select();
  }

  // ---- Such-Fenster (;;?) -------------------------------------------------
  // opt: { bausteine, beiWahl(baustein), beiAbbruch }
  // Seit Etappe 5 sucht es auch im Text der Bausteine (wie das
  // Windows-Skript). Der reine Text wird beim Öffnen einmal je
  // Baustein gebildet, nicht bei jedem Tastendruck.
  function oeffneSuche(doc, opt) {
    var karte = baue(doc, "tbx-suche");
    karte.appendChild(el(doc, "div", "tbx-titel", TB.TE.sucheTitel));
    var feld = doc.createElement("input");
    feld.type = "text"; feld.className = "tbx-feld";
    karte.appendChild(feld);
    karte.appendChild(el(doc, "div", "tbx-klein", TB.TE.sucheHinweis));
    var liste = el(doc, "div", "tbx-liste");
    karte.appendChild(liste);

    var treffer = [], aktiv = 0;
    var textVon = {};
    (opt.bausteine || []).forEach(function (b) {
      try { textVon[b.id] = TB.auszeichnung.reinerText(b.text || "").toLowerCase(); }
      catch (e) { textVon[b.id] = ""; }
    });

    function passt(b, begriff) {
      var kopf = [b.titel, b.kuerzel, b.kategorie].some(function (f) {
        return String(f || "").toLowerCase().indexOf(begriff) !== -1;
      });
      if (kopf) return true;
      return (textVon[b.id] || "").indexOf(begriff) !== -1;
    }
    function zeichne() {
      var begriff = feld.value.toLowerCase().trim();
      treffer = (opt.bausteine || []).filter(function (b) {
        return !begriff || passt(b, begriff);
      }).slice(0, 12);
      if (aktiv >= treffer.length) aktiv = Math.max(0, treffer.length - 1);
      liste.textContent = "";
      if (!treffer.length) {
        liste.appendChild(el(doc, "div", "tbx-klein", TB.TE.sucheLeer));
        return;
      }
      treffer.forEach(function (b, i) {
        var z = el(doc, "div", "tbx-eintrag" + (i === aktiv ? " tbx-aktiv" : ""));
        z.appendChild(el(doc, "span", "", b.titel || "(ohne Titel)"));
        if (b.kuerzel) z.appendChild(el(doc, "span", "tbx-marke", ";;" + b.kuerzel));
        if (b.kategorie) z.appendChild(el(doc, "span", "tbx-klein", b.kategorie));
        z.addEventListener("mousedown", function (ev) {
          ev.preventDefault(); wahl(b);
        });
        liste.appendChild(z);
      });
    }
    function wahl(b) { zu(); opt.beiWahl(b); }
    function abbruch() { zu(); opt.beiAbbruch(); }

    feld.addEventListener("input", function () { aktiv = 0; zeichne(); });
    karte.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { ev.preventDefault(); abbruch(); }
      else if (ev.key === "ArrowDown") { ev.preventDefault(); aktiv = Math.min(aktiv + 1, treffer.length - 1); zeichne(); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); aktiv = Math.max(aktiv - 1, 0); zeichne(); }
      else if (ev.key === "Enter") { ev.preventDefault(); if (treffer[aktiv]) wahl(treffer[aktiv]); }
      ev.stopPropagation();
    });

    zeichne();
    feld.focus();
  }

  // Wo genau steht die Schreibmarke? Liefert {x, oben, unten} in
  // Fenster-Koordinaten des Tipp-Dokuments. Im formatierten Bereich
  // fragt der Browser das direkt; in einfachen Feldern (input,
  // textarea) kennt er es nicht — darum wird der Feldtext bis zur
  // Marke in eine unsichtbare Spiegel-Kopie mit denselben Schrift-
  // und Umbruch-Eigenschaften gelegt und dort gemessen.
  function caretStelle(doc, ziel) {
    try {
      if (ziel && (ziel.tagName === "INPUT" || ziel.tagName === "TEXTAREA")) {
        return caretImFeld(doc, ziel);
      }
      var sel = doc.getSelection();
      if (sel && sel.rangeCount) {
        var rr = sel.getRangeAt(0).getBoundingClientRect();
        if (rr && (rr.left || rr.top || rr.bottom)) {
          return { x: rr.left, oben: rr.top, unten: rr.bottom };
        }
      }
    } catch (e) { }
    if (ziel && ziel.getBoundingClientRect) {
      var r = ziel.getBoundingClientRect();
      return { x: r.left, oben: r.top, unten: r.bottom + 2 };
    }
    return { x: 20, oben: 14, unten: 20 };
  }

  function caretImFeld(doc, feld) {
    var r = feld.getBoundingClientRect();
    var pos = feld.selectionStart || 0;
    var spiegel = doc.createElement("div");
    var stil = doc.defaultView.getComputedStyle(feld);
    ["fontFamily", "fontSize", "fontWeight", "fontStyle", "letterSpacing",
     "lineHeight", "textTransform", "wordSpacing", "textIndent",
     "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
     "borderTopWidth", "borderRightWidth", "borderBottomWidth",
     "borderLeftWidth", "boxSizing"].forEach(function (e) {
      spiegel.style[e] = stil[e];
    });
    spiegel.style.position = "absolute";
    spiegel.style.visibility = "hidden";
    spiegel.style.top = "0"; spiegel.style.left = "-9999px";
    spiegel.style.width = r.width + "px";
    if (feld.tagName === "TEXTAREA") {
      spiegel.style.whiteSpace = "pre-wrap";
      spiegel.style.wordWrap = "break-word";
    } else {
      spiegel.style.whiteSpace = "pre";
    }
    spiegel.textContent = feld.value.slice(0, pos);
    var punkt = doc.createElement("span");
    punkt.textContent = "\u200b";
    spiegel.appendChild(punkt);
    (doc.body || doc.documentElement).appendChild(spiegel);
    var zeilenHoehe = punkt.offsetHeight || 18;
    var x = r.left + (punkt.offsetLeft - feld.scrollLeft);
    var oben = r.top + (punkt.offsetTop - feld.scrollTop);
    spiegel.parentNode.removeChild(spiegel);
    x = Math.min(Math.max(x, r.left), r.right);
    oben = Math.min(Math.max(oben, r.top), r.bottom);
    return { x: x, oben: oben, unten: oben + zeilenHoehe };
  }

  // ---- Auswahl-Fenster beim Tippen (neu in Etappe 5) ----------------------
  // Ohne Decke, ohne Fokus: Es liegt neben dem Feld, in dem getippt
  // wird. Klick (mousedown) fügt ein, bevor das Feld den Fokus
  // verliert. Zeilen sind Bausteine, Fächer oder Kopfzeilen (ohne
  // Wirkung). opt: { haeufig, uebrige, beiWahl } ODER
  // { faecherZeilen: [{nummer, wort}], kopf, beiFach(nummer) }.
  function oeffneVorschlag(doc, ziel, opt) {
    zuVorschlag();
    if (AKTIV) return; // ein offenes Fenster mit Decke hat Vorrang
    var kasten = el(doc, "div", "tbx-vorschlag");
    var liste = el(doc, "div", "tbx-liste");
    kasten.appendChild(liste);

    function zeile(text, marke, tuWas) {
      var z = el(doc, "div", tuWas ? "tbx-eintrag" : "tbx-kopfzeile");
      z.appendChild(el(doc, "span", "", text));
      if (marke) z.appendChild(el(doc, "span", "tbx-marke", marke));
      if (tuWas) z.addEventListener("mousedown", function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        zuVorschlag(); tuWas();
      });
      liste.appendChild(z);
    }

    var leer = true;
    if (opt.faecherZeilen) {
      zeile(opt.kopf, null, null);
      opt.faecherZeilen.forEach(function (f) {
        leer = false;
        zeile(f.wort, ";;" + f.marke, function () { opt.beiFach(f.nummer); });
      });
    } else {
      if (opt.haeufig.length) zeile(TB.TE.wahlHaeufigste, null, null);
      opt.haeufig.forEach(function (b) {
        leer = false;
        zeile(b.titel || "(ohne Titel)", b.kuerzel ? ";;" + b.kuerzel : "",
          function () { opt.beiWahl(b); });
      });
      if (opt.uebrige.length) zeile(TB.TE.wahlAlphabetisch, null, null);
      opt.uebrige.slice(0, 9).forEach(function (b) {
        leer = false;
        zeile(b.titel || "(ohne Titel)", b.kuerzel ? ";;" + b.kuerzel : "",
          function () { opt.beiWahl(b); });
      });
    }
    if (leer) {
      liste.appendChild(el(doc, "div", "tbx-klein", TB.TE.sucheLeer));
    }
    kasten.appendChild(el(doc, "div", "tbx-klein tbx-rand", TB.TE.wahlHinweis));

    // Position (Regel seit 11.1): direkt an der Schreibmarke, und die
    // Zeile, in der getippt wird, bleibt IMMER lesbar — das Fenster
    // erscheint unterhalb der Marke, und nur wenn dort kein Platz ist,
    // oberhalb. Auch in einfachen Feldern wird die Marke gemessen
    // (unsichtbare Spiegel-Kopie des Feldtexts).
    var marke = caretStelle(doc, ziel);
    (doc.body || doc.documentElement).appendChild(kasten);
    VORSCHLAG = kasten;
    var breite = 340;
    var fenster = doc.defaultView || { innerWidth: 800, innerHeight: 600 };
    var hoehe = kasten.offsetHeight || 200;
    var x = marke.x + 8;
    var y = marke.unten + 6;
    if (y + hoehe > fenster.innerHeight - 4 && marke.oben - hoehe - 6 > 0) {
      y = marke.oben - hoehe - 6;
    }
    var maxX = fenster.innerWidth - breite - 8;
    if (x > maxX) x = Math.max(0, maxX);
    if (y < 0) y = 0;
    kasten.style.left = x + "px";
    kasten.style.top = y + "px";
  }

  function zuVorschlag() {
    if (VORSCHLAG && VORSCHLAG.parentNode) VORSCHLAG.parentNode.removeChild(VORSCHLAG);
    VORSCHLAG = null;
  }
  function vorschlagOffen() { return VORSCHLAG !== null; }
  function imVorschlag(el2) {
    return VORSCHLAG !== null && el2 && VORSCHLAG.contains(el2);
  }

  // ---- Entwurf-Fenster (;;neu) --------------------------------------------
  // opt: { text, beiSichern, beiAbbruch } — zeigt die Vorschau und den
  // Warnsatz; erst der Knopf schickt den Entwurf in die Datenablage.
  function oeffneEntwurf(doc, opt) {
    var karte = baue(doc, "tbx-entwurf");
    karte.appendChild(el(doc, "div", "tbx-titel", TB.TE.entwurfTitel));
    karte.appendChild(el(doc, "div", "tbx-warn", TB.TE.entwurfWarnung));
    var vorschau = el(doc, "div", "tbx-vorschau", "");
    var t = String(opt.text || "");
    vorschau.textContent = t.length > 800 ? t.slice(0, 800) + " …" : t;
    karte.appendChild(vorschau);
    var leiste = el(doc, "div", "tbx-leiste");
    var ab = el(doc, "button", "tbx-knopf", TB.TE.abbrechen);
    var ok = el(doc, "button", "tbx-knopf tbx-haupt", TB.TE.entwurfSichern);
    leiste.appendChild(ab); leiste.appendChild(ok);
    karte.appendChild(leiste);
    function abbruch() { zu(); if (opt.beiAbbruch) opt.beiAbbruch(); }
    ab.addEventListener("click", abbruch);
    ok.addEventListener("click", function () { zu(); opt.beiSichern(); });
    karte.setAttribute("tabindex", "-1");
    karte.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { ev.preventDefault(); abbruch(); }
      ev.stopPropagation();
    });
    karte.focus();
    ok.focus();
  }

  return { oeffneLuecken: oeffneLuecken, oeffneSuche: oeffneSuche,
           oeffneVorschlag: oeffneVorschlag, zuVorschlag: zuVorschlag,
           vorschlagOffen: vorschlagOffen, imVorschlag: imVorschlag,
           oeffneEntwurf: oeffneEntwurf,
           toast: toast, schliesse: zu };
})();
