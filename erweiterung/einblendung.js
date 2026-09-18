// Datei: einblendung.js
// Projekt: Textbausteine — Teil: Chrome-Erweiterung
// Zweck: Die drei Einblendungen, die die Erweiterung in eine Seite
//        legen kann: das Lücken-Fenster (Felder und Auswahlen eines
//        Bausteins abfragen, mit Vorschau), das Such-Fenster (;;?)
//        und die kleine Meldung am unteren Rand. Alles wird direkt in
//        die Seite gezeichnet und mit dem Schliessen restlos entfernt —
//        Eingaben aus den Lücken werden nirgends behalten.
//        Bedienung ohne Maus: Tab wandert, Eingabetaste fügt ein,
//        Esc bricht ab. GRUNDSATZ: nichts wird gespeichert.

"use strict";
window.TB = window.TB || {};

TB.einblendung = (function () {

  var AKTIV = null; // höchstens eine Einblendung gleichzeitig

  function zu() {
    if (AKTIV && AKTIV.parentNode) AKTIV.parentNode.removeChild(AKTIV);
    AKTIV = null;
  }

  function baue(doc, klasse) {
    zu();
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

    function passt(b, begriff) {
      return [b.titel, b.kuerzel, b.kategorie].some(function (f) {
        return String(f || "").toLowerCase().indexOf(begriff) !== -1;
      });
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

  return { oeffneLuecken: oeffneLuecken, oeffneSuche: oeffneSuche,
           toast: toast, schliesse: zu };
})();
