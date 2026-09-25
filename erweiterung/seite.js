// Datei: seite.js
// Projekt: Textbausteine — Teil: Chrome-Erweiterung
// Zweck: Das Herzstück auf der Seite. Es liest auf EINGESCHALTETEN
//        Seiten die letzten Tastendrücke mit, erkennt ;;kürzel und
//        NUR die Leertaste als Auslöser (Tab gehört dem Feldwechsel,
//        Entscheid aus Etappe 4) und setzt den Baustein direkt an der
//        Schreibmarke ein: in einfachen Feldern als reinen Text, in
//        formatierten Editoren (auch dem Axenita-Editor im Rahmen) als
//        formatiertes HTML. Ab ;; plus einem Zeichen zeigt es das
//        Auswahl-Fenster neben dem Feld (einblendung.js), ;;? öffnet
//        die Suche, ;;c1–;;c9 und ;;v1–;;v9 gehören den Fächern und
//        ;;neu dem Entwurf (faecher.js). Es speichert und protokolliert
//        NICHTS von dem, was auf der Seite steht.
//        GRUNDSATZ: keine Patientendaten in Speicher, Ablage oder Netz.

"use strict";
window.TB = window.TB || {};

// ---- Reine Helfer (auch im Prüflauf ohne Browser testbar) --------------
TB.kuerzelweg = (function () {
  var SENTINEL = "\u2038"; // Einfügezeichen — kommt in Befunden nie vor

  // ";;kürzel" unmittelbar vor der Schreibmarke?
  function findeAusloeser(textVor) {
    var m = /;;([^\s;?]{1,64})$/.exec(String(textVor || ""));
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
  // Fach gemeint? NUR Stamm plus Ziffer (;;v1 bis ;;v9) zählt — das
  // blosse ;;v zeigt die Bausteine (Vorrangregel vom 20.9.).
  function fachNummer(wort, stamm) {
    var m = /^(.+)([1-9])$/.exec(String(wort || "").toLowerCase());
    if (!m) return 0;
    if (m[1] !== String(stamm || "").toLowerCase()) return 0;
    return Number(m[2]);
  }
  // Häufigste fünf zuoberst, danach alphabetisch — wie im Windows-Skript.
  function ordne(passend, anzahlVon) {
    var haeufig = [], uebrige = [];
    (passend || []).forEach(function (b) {
      if ((anzahlVon(b.id) || 0) > 0) haeufig.push(b); else uebrige.push(b);
    });
    haeufig.sort(function (a, b) { return (anzahlVon(b.id) || 0) - (anzahlVon(a.id) || 0); });
    function titel(x) { return String(x.titel || "").toLowerCase(); }
    uebrige.sort(function (a, b) { return titel(a) < titel(b) ? -1 : titel(a) > titel(b) ? 1 : 0; });
    while (haeufig.length > 5) uebrige.push(haeufig.pop());
    uebrige.sort(function (a, b) { return titel(a) < titel(b) ? -1 : titel(a) > titel(b) ? 1 : 0; });
    return { haeufig: haeufig, uebrige: uebrige };
  }
  // Präfix-Filter wie im Skript: Kürzel ODER Titel beginnt damit.
  function passtPraefix(b, praefix) {
    var p = String(praefix || "").toLowerCase();
    if (!p) return true;
    var k = String(b.kuerzel || "").toLowerCase();
    var t = String(b.titel || "").toLowerCase();
    return k.indexOf(p) === 0 || t.indexOf(p) === 0;
  }
  return { findeAusloeser: findeAusloeser, endetMitAufruf: endetMitAufruf,
           baueKarte: baueKarte, textMitCursor: textMitCursor,
           fachNummer: fachNummer, ordne: ordne, passtPraefix: passtPraefix,
           SENTINEL: SENTINEL };
})();

// ---- Ab hier braucht es eine Seite -------------------------------------
if (typeof document !== "undefined") (function () {

  var KW = TB.kuerzelweg;
  var zustand = { bausteine: [], karte: {}, einstellungen: {}, statistik: {} };
  TB.seite = { zustand: zustand };

  // Etappe 6: Standort-Fassungen werden GLEICH BEIM LADEN aufgelöst —
  // ein einziger Ort, und alles danach (Kürzel, Auswahl-Fenster,
  // ;;?-Suche, {{Baustein:…}}) arbeitet automatisch mit der richtigen
  // Fassung. Das gespeicherte Original bleibt unberührt (Kopie).
  // Vorbelegung ohne Wahl: "Praxis Neuromed" (Entscheid W1, 22.9.).
  function fassungAufloesen(b, ort) {
    var v = b && b.varianten;
    if (!ort || !v || typeof v !== "object" || !v[ort] ||
        !String((v[ort] || {}).text || "").trim()) return b;
    var kopie = {};
    Object.keys(b).forEach(function (f) { kopie[f] = b[f]; });
    kopie.text = v[ort].text;
    return kopie;
  }
  function ladeDaten() {
    if (typeof chrome === "undefined" || !chrome.storage) return;
    chrome.storage.local.get(["bausteine", "einstellungen", "statistik", "standort"]).then(function (o) {
      var ort = (o.standort === undefined) ? "Praxis Neuromed" : o.standort;
      zustand.bausteine = (o.bausteine || []).map(function (b) {
        return fassungAufloesen(b, ort); });
      zustand.karte = KW.baueKarte(zustand.bausteine);
      zustand.einstellungen = o.einstellungen || {};
      zustand.statistik = (o.statistik && o.statistik.bausteine) || {};
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
  TB.seite.umgebung = umgebung;

  function anzahlVon(id) {
    var e = zustand.statistik[id];
    return e ? (e.anzahl || 0) : 0;
  }

  // Die Fächer-Buchstaben kommen aus den App-Einstellungen (auf allen
  // Geräten gleich; Vorgabe c wie Kopieren und v wie Einsetzen).
  function fachStamm(welcher) {
    var s = zustand.einstellungen[welcher === "merken"
      ? "fachStammMerken" : "fachStammEinsetzen"];
    var vorgabe = welcher === "merken" ? "c" : "v";
    return String(s || vorgabe).trim().toLowerCase() || vorgabe;
  }
  TB.seite.fachStamm = fachStamm;

  // Das Fenster fürs Einblenden: das oberste erreichbare — dort sieht
  // man es auch, wenn getippt im Editor-Rahmen wurde.
  function obersteTuer() {
    try { void window.top.document.body; return window.top.document; }
    catch (e) { return document; }
  }
  TB.seite.obersteTuer = obersteTuer;

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
  TB.seite.meldung = meldung;

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
  TB.seite.ortErmitteln = ortErmitteln;

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
      var sel = ort.doc.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
      // Loeschen ueber den Editor-Befehl, nicht ueber die rohe Struktur:
      // Wird das getippte Kuerzel in einer frisch begonnenen Zeile
      // entfernt, hielte die rohe Loeschung die Schreibmarke nicht in
      // der Zeile — sie spraenge in die Zeile darueber und die
      // Eingabetaste waere annulliert (Befund 21.9., Fach-Einsetzen).
      var ok = false;
      try { ok = ort.doc.execCommand("delete"); } catch (e) { ok = false; }
      if (!ok) {
        r.deleteContents();
        sel.removeAllRanges(); r.collapse(true); sel.addRange(r);
      }
      return true;
    }
    return false;
  }
  TB.seite.entferneVorDerMarke = entferneVorDerMarke;

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
  TB.seite.schreibeText = schreibeText;

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
  TB.seite.schreibeHtml = schreibeHtml;

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
    // Härtung (Nachrunde 25.09.): Seiten wie Axenita bauen ihr Feld
    // nach Eingaben um und verlieren dabei die lebende Auswahl. Der
    // Anker kommt darum primär an die GEMERKTE Stelle (knoten/offset
    // aus dem Ort); die Auswahl ist nur noch Rückfallebene.
    var r = null;
    try {
      if (ort.knoten && ort.doc.contains(ort.knoten)) {
        r = ort.doc.createRange();
        var grenze = (ort.knoten.nodeType === 3)
          ? ort.knoten.nodeValue.length : ort.knoten.childNodes.length;
        r.setStart(ort.knoten, Math.min(ort.offset || 0, grenze));
        r.collapse(true);
      }
    } catch (e) { r = null; }
    if (!r) {
      var sel = ort.doc.getSelection();
      if (!sel || !sel.rangeCount) throw new Error(TB.TE.stelleVerloren);
      r = sel.getRangeAt(0);
    }
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
  TB.seite.halteStelle = halteStelle;

  function starteBaustein(ort, baustein, urspruenglich) {
    // Härtung (Nachrunde 25.09.): Stirbt der Start (z. B. weil die
    // Seite das Feld umgebaut hat), war das Kürzel schon gelöscht und
    // es geschah STILL nichts. Jetzt kommt der Text zurück und eine
    // Meldung zeigt den Grund.
    try { starteBausteinKern(ort, baustein, urspruenglich); }
    catch (w) {
      try { if (urspruenglich) schreibeText(ort, urspruenglich); } catch (e2) {}
      meldung(TB.TE.startFehler + ": " + (w && w.message ? w.message : w), true);
    }
  }
  function starteBausteinKern(ort, baustein, urspruenglich) {
    var u = umgebung();
    // Etappe 8: Masken (Kästchen, Wenn-Abschnitte, Bausteinwahl je
    // Abschnitt) haben ihr eigenes Fenster und ihre eigene Kette.
    if (TB.masken.istMaske(baustein.text || "")) {
      TB.seiteMasken.starte(ort, baustein, urspruenglich);
      return;
    }
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
  TB.seite.starteBaustein = starteBaustein;

  // Der Masken-Ablauf (Etappe 8) wohnt in seite-masken.js — diese
  // Datei stände sonst über der 600-Zeilen-Grenze. Er braucht ein
  // paar Helfer von hier:
  TB.seite.maskenHelfer = {
    umgebung: umgebung, halteStelle: halteStelle,
    schreibeText: schreibeText, schreibeHtml: schreibeHtml,
    inZwischenablage: inZwischenablage, meldung: meldung,
    zaehle: zaehle, obersteTuer: obersteTuer,
    bausteine: function () { return zustand.bausteine || []; }
  };

  function starteSuche(ort) {
    var zurueck = halteStelle(ort);
    TB.einblendung.oeffneSuche(obersteTuer(), {
      bausteine: zustand.bausteine,
      beiWahl: function (b) { starteBaustein(zurueck(), b, null); },
      beiAbbruch: function () { zurueck(); }
    });
  }

  // ---- Auswahl-Fenster beim Tippen (neu in Etappe 5) --------------------
  // Ab ;; plus einem Zeichen erscheint neben dem Feld die Liste:
  // häufigste fünf zuoberst, dann alphabetisch. Klick fügt ein, Weiter-
  // tippen verfeinert, Esc schliesst. Es stiehlt keinen Fokus. Bei
  // Stamm plus Ziffer (;;v1, ;;c1) zeigt es die neun Fächer.
  function panelNachziehen(doc, ziel) {
    var ort = ortErmitteln(doc, ziel);
    if (!ort) { TB.einblendung.zuVorschlag(); return; }
    var m = KW.findeAusloeser(ort.textVor);
    if (!m) { TB.einblendung.zuVorschlag(); return; }
    var wort = m.kuerzel.toLowerCase();
    var nE = KW.fachNummer(wort, fachStamm("einsetzen"));
    var nM = KW.fachNummer(wort, fachStamm("merken"));
    if (nE || nM) {
      TB.faecher.panelFaecher(doc, ziel, m, nM > 0);
      return;
    }
    var passend = zustand.bausteine.filter(function (b) {
      return KW.passtPraefix(b, wort);
    });
    var geordnet = KW.ordne(passend, anzahlVon);
    TB.einblendung.oeffneVorschlag(doc, ziel, {
      haeufig: geordnet.haeufig, uebrige: geordnet.uebrige,
      beiWahl: function (b) {
        var frisch = ortErmitteln(doc, ziel);
        if (!frisch) return;
        var m2 = KW.findeAusloeser(frisch.textVor);
        if (m2 && entferneVorDerMarke(frisch, m2.laenge)) {
          starteBaustein(ortErmitteln(doc, ziel) || frisch, b, m2 ? m2.text : null);
        }
      }
    });
  }

  // ---- Tastendruck -------------------------------------------------------
  function beiTaste(e, doc) {
    if (e.defaultPrevented || e.isComposing) return;
    if (devMussSchweigen()) return;
    if (e.key === "Escape" && TB.einblendung.vorschlagOffen()) {
      e.preventDefault(); e.stopPropagation();
      TB.einblendung.zuVorschlag();
      return;
    }
    if (e.key !== " " && e.key !== "?") return;
    var ort = ortErmitteln(doc, e.target);
    if (!ort) return;

    if (e.key === "?" && KW.endetMitAufruf(ort.textVor)) {
      e.preventDefault(); e.stopPropagation();
      TB.einblendung.zuVorschlag();
      if (entferneVorDerMarke(ort, 2)) starteSuche(ortErmitteln(doc, e.target) || ort);
      return;
    }
    if (e.key !== " ") return;
    var m = KW.findeAusloeser(ort.textVor);
    if (!m) return;
    var wort = m.kuerzel.toLowerCase();
    var b = zustand.karte[wort];
    // ;;neu und die Fächer greifen nur, wenn KEIN echter Baustein das
    // Kürzel trägt — ein echtes Kürzel hat immer Vorrang (20.9.).
    if (!b && wort === "neu") {
      e.preventDefault(); e.stopPropagation();
      TB.einblendung.zuVorschlag();
      if (entferneVorDerMarke(ort, m.laenge)) TB.faecher.neuStarten(doc, e.target);
      return;
    }
    if (!b) {
      var nM = KW.fachNummer(wort, fachStamm("merken"));
      if (nM) {
        e.preventDefault(); e.stopPropagation();
        TB.einblendung.zuVorschlag();
        if (entferneVorDerMarke(ort, m.laenge)) TB.faecher.merken(doc, e.target, nM);
        return;
      }
      var nE = KW.fachNummer(wort, fachStamm("einsetzen"));
      if (nE) {
        e.preventDefault(); e.stopPropagation();
        TB.einblendung.zuVorschlag();
        TB.faecher.einsetzen(doc, e.target, nE, m.laenge);
        return;
      }
    }
    if (!b) {
      meldung(TB.TE.unbekanntesKuerzel.replace("%s", m.kuerzel), false);
      return; // die Leertaste läuft normal weiter
    }
    e.preventDefault(); e.stopPropagation();
    TB.einblendung.zuVorschlag();
    if (!entferneVorDerMarke(ort, m.laenge)) return;
    var frisch = ortErmitteln(doc, e.target) || ort;
    starteBaustein(frisch, b, m.text);
  }

  // Nach jedem Tippen (auch Backspace) das Auswahl-Fenster nachziehen.
  function beiEingabe(e, doc) {
    if (devMussSchweigen()) return;
    panelNachziehen(doc, e.target);
  }

  // ---- Anbinden: dieses Dokument und alle erreichbaren Rahmen ----------
  var gebunden = new WeakSet();
  function binde(doc) {
    if (!doc || gebunden.has(doc)) return;
    gebunden.add(doc);
    prodMarkeSetzen(doc);
    doc.addEventListener("keydown", function (e) { beiTaste(e, doc); }, true);
    doc.addEventListener("input", function (e) { beiEingabe(e, doc); }, true);
    doc.addEventListener("mousedown", function (e) {
      if (!TB.einblendung.imVorschlag(e.target)) TB.einblendung.zuVorschlag();
    }, true);
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
