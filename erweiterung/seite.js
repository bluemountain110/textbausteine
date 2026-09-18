// Datei: seite.js
// Projekt: Textbausteine — Teil: Chrome-Erweiterung
// Zweck: Das Herzstück auf der Seite. Es liest auf EINGESCHALTETEN
//        Seiten die letzten Tastendrücke mit, erkennt ;;kürzel + Leer-
//        oder Tab-Taste und setzt den Baustein direkt an der
//        Schreibmarke ein: in einfachen Feldern als reinen Text, in
//        formatierten Editoren (auch dem Axenita-Editor im Rahmen) als
//        formatiertes HTML. ;;? öffnet die Suche, Bausteine mit Lücken
//        das Ausfüll-Fenster (einblendung.js). Es speichert und
//        protokolliert NICHTS von dem, was auf der Seite steht — im
//        Arbeitsspeicher liegt nur der Blick auf die Zeichen unmittelbar
//        vor der Schreibmarke, und der verfällt mit jedem Tastendruck.
//        GRUNDSATZ: keine Patientendaten in Speicher, Ablage oder Netz.

"use strict";
window.TB = window.TB || {};

// ---- Reine Helfer (auch im Prüflauf ohne Browser testbar) --------------
TB.kuerzelweg = (function () {
  var SENTINEL = "\u2038"; // Einfügezeichen — kommt in Befunden nie vor

  // ";;kürzel" unmittelbar vor der Schreibmarke?
  function findeAusloeser(textVor) {
    var m = /;;([^\s;]{1,64})$/.exec(String(textVor || ""));
    if (!m) return null;
    return { kuerzel: m[1], laenge: m[0].length, text: m[0] };
  }
  // ";;" vor der Schreibmarke — der Boden für ;;? (Suche).
  function endetMitAufruf(textVor) {
    return /;;$/.test(String(textVor || ""));
  }
  function baueKarte(bausteine) {
    var k = {};
    (bausteine || []).forEach(function (b) {
      var s = String(b.kuerzel || "").trim().toLowerCase();
      if (s) k[s] = b;
    });
    return k;
  }
  // {{Cursor}} wurde vorab zum Sentinel: Position finden und entfernen.
  function textMitCursor(text) {
    var t = String(text || "");
    var p = t.indexOf(SENTINEL);
    if (p === -1) return { text: t, position: -1 };
    return { text: t.split(SENTINEL).join(""), position: p };
  }
  return { findeAusloeser: findeAusloeser, endetMitAufruf: endetMitAufruf,
           baueKarte: baueKarte, textMitCursor: textMitCursor,
           SENTINEL: SENTINEL };
})();

// ---- Ab hier braucht es eine Seite -------------------------------------
if (typeof document !== "undefined") (function () {

  var KW = TB.kuerzelweg;
  var zustand = { bausteine: [], karte: {}, einstellungen: {} };

  function ladeDaten() {
    if (typeof chrome === "undefined" || !chrome.storage) return;
    chrome.storage.local.get(["bausteine", "einstellungen"]).then(function (o) {
      zustand.bausteine = o.bausteine || [];
      zustand.karte = KW.baueKarte(zustand.bausteine);
      zustand.einstellungen = o.einstellungen || {};
    });
  }
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.onChanged.addListener(ladeDaten);
  }
  ladeDaten();
  // Sicherheitsnetz gegen veraltete Stände in lange offenen Reitern:
  // zusätzlich jede Minute und bei jeder Rückkehr ins Fenster frisch
  // laden — ein neuer Baustein wirkt so ohne Neuladen der Seite.
  setInterval(ladeDaten, 60000);
  window.addEventListener("focus", ladeDaten);

  function umgebung() {
    var e = zustand.einstellungen;
    var konstanten = (e.konstanten && typeof e.konstanten === "object")
      ? e.konstanten : {};
    return {
      datumsformat: e.datumsformat || "TT.MM.JJJJ",
      konstanten: konstanten,
      markeAuf: e.markeAuf, markeZu: e.markeZu,
      holeBaustein: function (k) {
        return zustand.karte[String(k || "").toLowerCase()] || null;
      }
    };
  }

  // Das Fenster fürs Einblenden: das oberste erreichbare — dort sieht
  // man es auch, wenn getippt im Editor-Rahmen wurde.
  function obersteTuer() {
    try { void window.top.document.body; return window.top.document; }
    catch (e) { return document; }
  }

  // Dev schweigt, wenn die normale Erweiterung auf derselben Seite ist —
  // sonst würde ein Kürzel doppelt ersetzt.
  function prodMarkeSetzen(doc) {
    if (!TB.ERW.istDev) {
      try { doc.documentElement.setAttribute("data-tb-prod", "1"); } catch (e) { }
    }
  }
  function devMussSchweigen() {
    if (!TB.ERW.istDev) return false;
    var da = false;
    try { da = document.documentElement.hasAttribute("data-tb-prod"); } catch (e) { }
    if (!da) { try {
      da = window.top.document.documentElement.hasAttribute("data-tb-prod");
    } catch (e) { } }
    return da;
  }

  function meldung(text, fehler) {
    TB.einblendung.toast(obersteTuer(), text, fehler);
  }

  function zaehle(id) {
    if (typeof chrome === "undefined" || !chrome.storage) return;
    chrome.storage.local.get("statistik").then(function (o) {
      var st = o.statistik || { bausteine: {}, funktionen: {} };
      var e = st.bausteine[id] || { anzahl: 0, zuletzt: null };
      e.anzahl += 1; e.zuletzt = new Date().toISOString();
      st.bausteine[id] = e;
      chrome.storage.local.set({ statistik: st, statistikOffen: true });
    });
  }

  // ---- Ort der Schreibmarke: Feld oder formatierter Editor -------------
  function istFeld(el) {
    if (!el) return false;
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName !== "INPUT") return false;
    var art = (el.getAttribute("type") || "text").toLowerCase();
    return ["text", "search", "email", "url", "tel"].indexOf(art) !== -1;
  }

  function ortErmitteln(doc, ziel) {
    if (istFeld(ziel)) {
      if (ziel.selectionStart !== ziel.selectionEnd) return null;
      return { art: "feld", el: ziel, pos: ziel.selectionStart,
               textVor: ziel.value.slice(0, ziel.selectionStart) };
    }
    if (ziel && ziel.isContentEditable) {
      var sel = doc.getSelection();
      if (!sel || !sel.rangeCount || !sel.isCollapsed) return null;
      var k = sel.anchorNode;
      var textVor = (k && k.nodeType === 3)
        ? k.nodeValue.slice(0, sel.anchorOffset) : "";
      return { art: "reich", doc: doc, knoten: k,
               offset: sel.anchorOffset, textVor: textVor };
    }
    return null;
  }

  function entferneVorDerMarke(ort, laenge) {
    if (ort.art === "feld") {
      ort.el.setRangeText("", ort.pos - laenge, ort.pos, "end");
      ort.el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    if (ort.knoten && ort.knoten.nodeType === 3 && ort.offset >= laenge) {
      var r = ort.doc.createRange();
      r.setStart(ort.knoten, ort.offset - laenge);
      r.setEnd(ort.knoten, ort.offset);
      r.deleteContents();
      var sel = ort.doc.getSelection();
      sel.removeAllRanges(); r.collapse(true); sel.addRange(r);
      return true;
    }
    return false;
  }

  function schreibeText(ort, roher) {
    var c = KW.textMitCursor(roher);
    if (ort.art === "feld") {
      var start = ort.el.selectionStart;
      ort.el.focus();
      ort.el.setRangeText(c.text, start, start, "end");
      if (c.position >= 0) {
        ort.el.selectionStart = ort.el.selectionEnd = start + c.position;
      }
      ort.el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    return schreibeHtml(ort, null, c.text);
  }

  function schreibeHtml(ort, html, ersatzText) {
    var doc = ort.doc, ok = false;
    var inhalt = html !== null ? html
      : String(ersatzText).replace(/&/g, "&amp;").replace(/</g, "&lt;")
          .replace(/\n/g, "<br>");
    try { ok = doc.execCommand("insertHTML", false, inhalt); } catch (e) { ok = false; }
    if (!ok) {
      try {
        var sel = doc.getSelection();
        var r = sel.getRangeAt(0);
        r.insertNode(r.createContextualFragment(inhalt));
        sel.collapseToEnd();
        ok = true;
      } catch (e2) { ok = false; }
    }
    if (ok) {
      var marke = doc.querySelector("span[data-tb-cursor]");
      if (marke) {
        var r2 = doc.createRange();
        r2.setStartBefore(marke); r2.collapse(true);
        marke.parentNode.removeChild(marke);
        var sel2 = doc.getSelection();
        sel2.removeAllRanges(); sel2.addRange(r2);
      }
      var wurzel = doc.activeElement || doc.body;
      wurzel.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return ok;
  }

  // Rettungsweg: konnte nicht eingesetzt werden -> Zwischenablage.
  function inZwischenablage(erg) {
    try {
      var eintrag = new ClipboardItem({
        "text/html": new Blob([erg.html], { type: "text/html" }),
        "text/plain": new Blob([erg.text], { type: "text/plain" })
      });
      navigator.clipboard.write([eintrag]);
    } catch (e) {
      try { navigator.clipboard.writeText(erg.text); } catch (e2) { }
    }
    meldung(TB.TE.inZwischenablage, true);
  }

  // ---- Der eigentliche Einsatz -----------------------------------------
  function setzeEin(ort, baustein, antworten) {
    var u = umgebung();
    var art = baustein.ausgabeart === "marken" ? "marken" : "fenster";
    var eingesetzt = TB.reichtext.bausteineEinsetzen(
      baustein.text || "", u.holeBaustein, 0, []);
    var mitMarker = eingesetzt.html.replace(/\{\{\s*Cursor\s*\}\}/gi,
      '<span data-tb-cursor="1">' + KW.SENTINEL + "</span>");
    var erg = TB.reichtext.auswerte(mitMarker, antworten || {}, u, null, art);
    var fehler = eingesetzt.fehler.concat(erg.fehler);
    var ok;
    if (ort.art === "feld") { schreibeText(ort, erg.text); ok = true; }
    else { ok = schreibeHtml(ort, erg.html, null); }
    if (!ok) { inZwischenablage(erg); }
    else if (fehler.length) { meldung(TB.TE.bausteinFehler + fehler[0], true); }
    zaehle(baustein.id);
  }

  // Damit Suche und Lücken-Fenster die Stelle wiederfinden, obwohl der
  // Fokus zur Einblendung wandert: die Stelle festhalten und nachher
  // wiederherstellen.
  function halteStelle(ort) {
    if (ort.art === "feld") {
      return function () {
        ort.el.focus();
        var p = Math.min(ort.el.value.length, ort.el.selectionStart);
        ort.el.setSelectionRange(p, p);
        return ort;
      };
    }
    var anker = ort.doc.createElement("span");
    anker.setAttribute("data-tb-anker", "1");
    var sel = ort.doc.getSelection();
    var r = sel.getRangeAt(0);
    r.insertNode(anker);
    return function () {
      var r2 = ort.doc.createRange();
      r2.setStartBefore(anker); r2.collapse(true);
      anker.parentNode.removeChild(anker);
      var s2 = ort.doc.getSelection();
      s2.removeAllRanges(); s2.addRange(r2);
      return ort;
    };
  }

  function starteBaustein(ort, baustein, urspruenglich) {
    var u = umgebung();
    var luecken = TB.reichtext.luecken(baustein.text || "", u);
    if (baustein.ausgabeart === "marken" || !luecken.length) {
      setzeEin(ort, baustein, {});
      return;
    }
    var zurueck = halteStelle(ort);
    TB.einblendung.oeffneLuecken(obersteTuer(), {
      titel: baustein.titel || baustein.kuerzel || "",
      luecken: luecken,
      vorschau: function (antworten) {
        var e2 = TB.reichtext.auswerte(baustein.text || "", antworten, u,
          u.holeBaustein, "fenster");
        return e2.text;
      },
      beiFertig: function (antworten) {
        setzeEin(zurueck(), baustein, antworten);
      },
      beiAbbruch: function () {
        if (urspruenglich) schreibeText(zurueck(), urspruenglich);
        else zurueck();
      }
    });
  }

  function starteSuche(ort) {
    var zurueck = halteStelle(ort);
    TB.einblendung.oeffneSuche(obersteTuer(), {
      bausteine: zustand.bausteine,
      beiWahl: function (b) { starteBaustein(zurueck(), b, null); },
      beiAbbruch: function () { zurueck(); }
    });
  }

  // ---- Tastendruck -------------------------------------------------------
  function beiTaste(e, doc) {
    if (e.defaultPrevented || e.isComposing) return;
    if (devMussSchweigen()) return;
    if (e.key !== " " && e.key !== "Tab" && e.key !== "?") return;
    var ort = ortErmitteln(doc, e.target);
    if (!ort) return;

    if (e.key === "?" && KW.endetMitAufruf(ort.textVor)) {
      e.preventDefault(); e.stopPropagation();
      if (entferneVorDerMarke(ort, 2)) starteSuche(ortErmitteln(doc, e.target) || ort);
      return;
    }
    if (e.key !== " " && e.key !== "Tab") return;
    var m = KW.findeAusloeser(ort.textVor);
    if (!m) return;
    var b = zustand.karte[m.kuerzel.toLowerCase()];
    if (!b) {
      meldung(TB.TE.unbekanntesKuerzel.replace("%s", m.kuerzel), false);
      return; // die Leertaste läuft normal weiter
    }
    e.preventDefault(); e.stopPropagation();
    if (!entferneVorDerMarke(ort, m.laenge)) return;
    var frisch = ortErmitteln(doc, e.target) || ort;
    starteBaustein(frisch, b, m.text);
  }

  // ---- Anbinden: dieses Dokument und alle erreichbaren Rahmen ----------
  var gebunden = new WeakSet();
  function binde(doc) {
    if (!doc || gebunden.has(doc)) return;
    gebunden.add(doc);
    prodMarkeSetzen(doc);
    doc.addEventListener("keydown", function (e) { beiTaste(e, doc); }, true);
  }
  function rahmenSuchen(doc) {
    binde(doc);
    var rahmen = doc.querySelectorAll("iframe");
    for (var i = 0; i < rahmen.length; i++) {
      try {
        var innen = rahmen[i].contentDocument;
        if (innen) rahmenSuchen(innen);
      } catch (e) { /* fremder Ursprung — dort läuft eine eigene Kopie */ }
    }
  }
  rahmenSuchen(document);
  setInterval(function () { rahmenSuchen(document); }, 3000);
})();
