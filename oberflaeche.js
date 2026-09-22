// Datei: oberflaeche.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Der Rahmen der App und die Bausteinliste: Navigation, Suche,
//        Benutzen mit Lücken-Dialog, Bearbeiten, Papierkorb. Die
//        gemeinsamen kleinen Helfer (Meldung, Kopieren, Dialog öffnen)
//        stehen hier als TB.ui und werden von den anderen
//        Ansichts-Dateien mitbenutzt.
//        Diese Datei fasst NIE selbst den Speicher an — sie ruft immer
//        die Speicher-Schnittstelle.
//        Die Einstellungen, die Statistik, die Anleitung und die
//        Chronik stehen in ansicht-einstellungen.js; alles zur
//        Anmeldung und zum Abgleich in ansicht-wolke.js.

"use strict";
window.TB = window.TB || {};

// ---- Gemeinsame Helfer für alle Ansichten ---------------------------
TB.ui = (function () {
  function el(art, klasse, text) {
    var e = document.createElement(art);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function melde(text, warnung) {
    var m = document.getElementById("meldung");
    // Ist gerade ein Fenster (dialog) offen, liegt es in Chromes
    // oberster Ebene und würde die Meldung verdecken. Darum wandert
    // die Meldung dann IN das offene Fenster — sie erscheint an
    // derselben Stelle, aber davor. Ist kein Fenster offen, gehört
    // sie zurück in die Seite. (Näd 18.9.: Warnung war unlesbar.)
    var offenes = document.querySelector("dialog[open]");
    (offenes || document.body).appendChild(m);
    m.textContent = text;
    m.className = "sichtbar" + (warnung ? " warn" : "");
    clearTimeout(melde._t);
    melde._t = setTimeout(function () { m.className = ""; }, 3200);
  }
  function kopiereText(text, fertig) {
    function ersatz() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta); fertig(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { fertig(true); }, ersatz);
    } else { ersatz(); }
  }
  // Ein Knopf, zwei Ergebnisse: PDF im Druckfenster, Text in der
  // Zwischenablage (ein PDF lässt sich nicht in die Zwischenablage legen).
  function berichtAusgeben(kategorie, text) {
    kopiereText(text, function () { /* Rückmeldung kommt unten gesammelt */ });
    var name = TB.bericht.alsPdf(kategorie, text);
    melde(name ? TB.T.berichtPdfFertig : TB.T.berichtPdfBlockiert, !name);
  }
  // Legt ALLE Fassungen gleichzeitig in die Zwischenablage: reinen Text
  // und HTML, und im HTML versteckt das RTF für die Brücke nach KISIM.
  // Jedes Ziel nimmt sich, was es versteht. Bewiesen am 14.9.: nur die
  // moderne Kopiertechnik erhält die versteckte RTF-Marke.
  function kopiereFassungen(html, text, fertig) {
    var traeger = TB.auszeichnung.traegerHtml(html);
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        var eintrag = new ClipboardItem({
          "text/html": new Blob([traeger], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" })
        });
        navigator.clipboard.write([eintrag]).then(
          function () { fertig(true, "alle Fassungen"); },
          function () { kopiereText(text, function (ok) { fertig(ok, "nur reiner Text"); }); });
        return;
      } catch (e) { /* Ersatzweg unten */ }
    }
    kopiereText(text, function (ok) { fertig(ok, "nur reiner Text"); });
  }

  function dialogOeffnen(d) {
    document.body.appendChild(d);
    d.addEventListener("close", function () { d.remove(); });
    if (typeof d.showModal === "function") { d.showModal(); }
    else { d.setAttribute("open", "open"); }   // Ersatzweg für alte Browser
    return d;
  }
  function knopfzeile() { return el("div", "dialog-knoepfe"); }

  return { el: el, melde: melde, kopiereText: kopiereText,
           kopiereFassungen: kopiereFassungen,
           berichtAusgeben: berichtAusgeben, dialogOeffnen: dialogOeffnen,
           knopfzeile: knopfzeile,
           zeichne: function () { TB.oberflaeche.zeichne(); } };
})();

TB.oberflaeche = (function () {
  var T = null, S = null;
  var ansicht = "bausteine";
  var suchbegriff = "", kategorieFilter = "";
  var sucheGezaehlt = false; // Suche wird einmal je Sitzung gezählt

  var el = TB.ui.el, melde = TB.ui.melde, kopiereText = TB.ui.kopiereText;
  var dialogOeffnen = TB.ui.dialogOeffnen;

  // ---- Navigation ------------------------------------------------------
  var BEREICHE = [
    ["bausteine", function () { return T.bereichBausteine; }],
    ["entwuerfe", function () {
      var n = TB.bausteine.alleEntwuerfe().length;
      return T.bereichEntwuerfe + (n ? " (" + n + ")" : ""); }],
    ["ideen", function () {
      var n = TB.bausteine.alleIdeen().filter(function (b) {
        return b.kategorie !== "eingeplant"; }).length;
      return T.bereichIdeen + (n ? " (" + n + ")" : ""); }],
    ["papierkorb", function () { return T.bereichPapierkorb; }],
    ["einstellungen", function () { return T.bereichEinstellungen; }],
    ["statistik", function () { return T.bereichStatistik; }],
    ["hilfe", function () { return T.bereichHilfe; }],
    ["chronik", function () { return T.bereichChronik; }]
  ];
  function zeichneNavigation() {
    var nav = document.getElementById("haupt-nav");
    nav.textContent = "";
    BEREICHE.forEach(function (b) {
      var k = el("button", ansicht === b[0] ? "aktiv" : "", b[1]());
      k.addEventListener("click", function () { ansicht = b[0]; zeichne(); });
      nav.appendChild(k);
    });
  }
  function geheZu(name) { ansicht = name; zeichne(); }

  // ---- Bausteinliste ---------------------------------------------------
  function zeileFuerBaustein(b, aktionen) {
    var li = el("li");
    var textTeil = el("div", "zeile-text");
    textTeil.appendChild(el("div", "zeile-titel", b.titel || "(ohne Titel)"));
    var neben = [];
    if (b.kategorie) neben.push(b.kategorie);
    var ersteZeile = TB.auszeichnung.reinerText(b.text || "").split("\n")[0];
    if (ersteZeile) neben.push(ersteZeile);
    textTeil.appendChild(el("div", "zeile-neben", neben.join(" · ")));
    li.appendChild(textTeil);
    if (b.ausgabeart === "marken") li.appendChild(el("span", "marke marke-diktat", T.markeKennzeichen));
    if (TB.bausteine.hatVarianten(b)) {
      var mv = el("span", "marke", T.markeVarianten);
      mv.title = Object.keys(b.varianten || {}).join(", ");
      li.appendChild(mv);
    }
    if (b.kuerzel) li.appendChild(el("span", "marke", ";" + b.kuerzel));
    (aktionen || []).forEach(function (a) {
      var k = el("button", "leise", a[0]);
      k.title = a[0];
      k.addEventListener("click", function (ev) { ev.stopPropagation(); a[1](); });
      li.appendChild(k);
    });
    return li;
  }

  function zeichneBausteine(wurzel) {
    var leiste = el("div", "werkzeugleiste");
    var suche = el("input");
    suche.type = "search"; suche.placeholder = T.suchfeld;
    suche.value = suchbegriff; suche.id = "suchfeld";
    suche.addEventListener("input", function () {
      if (!sucheGezaehlt && suche.value.length >= 2) {
        sucheGezaehlt = true; TB.statistik.zaehle("gesucht"); }
      suchbegriff = suche.value; zeichneListe(); });
    suche.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        var erster = TB.bausteine.suche(suchbegriff, kategorieFilter)[0];
        if (erster) benutzeBaustein(erster);
      }
    });
    leiste.appendChild(suche);

    var wahl = el("select");
    var alle = el("option", "", T.alleKategorien); alle.value = "";
    wahl.appendChild(alle);
    TB.bausteine.kategorien().forEach(function (k) {
      var o = el("option", "", k); o.value = k; wahl.appendChild(o);
    });
    wahl.value = kategorieFilter;
    wahl.addEventListener("change", function () {
      kategorieFilter = wahl.value; zeichneListe(); });
    leiste.appendChild(wahl);

    var idee = el("button", "neben", T.ideeKnopf);
    idee.addEventListener("click", function () { TB.ansichtEntwuerfe.schnellIdee(); });
    leiste.appendChild(idee);
    var neu = el("button", "haupt", T.neuKnopf);
    neu.addEventListener("click", function () { bearbeiteBaustein(null); });
    leiste.appendChild(neu);
    wurzel.appendChild(leiste);

    var listenPlatz = el("div"); listenPlatz.id = "listen-platz";
    wurzel.appendChild(listenPlatz);
    zeichneListe();
    setTimeout(function () { suche.focus(); }, 0);
  }

  function zeichneListe() {
    var platz = document.getElementById("listen-platz");
    if (!platz) return;
    platz.textContent = "";
    if (TB.bausteine.alleFertigen().length === 0) {
      platz.appendChild(el("div", "leer", T.leererBestand)); return;
    }
    var treffer = TB.bausteine.suche(suchbegriff, kategorieFilter);
    if (treffer.length === 0) {
      platz.appendChild(el("div", "leer", T.keineTreffer)); return;
    }
    function haengeGruppe(name, liste) {
      if (!liste.length) return;
      platz.appendChild(el("div", "gruppe", name));
      var ul = el("ul", "liste");
      liste.forEach(function (b) {
        var li = zeileFuerBaustein(b, [
          [T.bearbeitenKnopf, function () { bearbeiteBaustein(b); }],
          [T.loeschenKnopf, function () {
            S.inPapierkorb(b.id); TB.statistik.zaehle("papierkorb");
            TB.abgleich.anstossen(); melde(T.inPapierkorb); zeichne(); }]
        ]);
        li.addEventListener("click", function () { benutzeBaustein(b); });
        ul.appendChild(li);
      });
      platz.appendChild(ul);
    }
    if (!suchbegriff && !kategorieFilter) {
      var letzte = TB.bausteine.zuletztBenutzt(5);
      haengeGruppe(T.zuletztBenutzt, letzte);
      var letzteIds = letzte.map(function (b) { return b.id; });
      var kategorien = {};
      treffer.forEach(function (b) {
        if (letzteIds.indexOf(b.id) !== -1) return;
        var k = b.kategorie || T.ohneKategorie;
        (kategorien[k] = kategorien[k] || []).push(b);
      });
      Object.keys(kategorien).sort(function (a, b) {
        return a.localeCompare(b, "de"); })
        .forEach(function (k) { haengeGruppe(k, kategorien[k]); });
    } else {
      haengeGruppe(treffer.length + " Treffer", treffer);
    }
  }

  // ---- Baustein benutzen (Lücken-Dialog + Kopieren) --------------------
  function holeBaustein(kuerzel) { return S.holenPerKuerzel(kuerzel); }

  function benutzeBaustein(b) {
    var umgebung = TB.einstellungen.makroUmgebung();
    // Etappe 6: Auf einem Gerät mit Standort liefert derselbe Baustein
    // die Standort-Fassung; ohne eigene Fassung die Standardfassung.
    var f = TB.bausteine.fassungFuer(b);
    var fassungsHinweis = f.variante ?
      T.benutztVariante.replace("%s", f.variante) : "";
    // Diktat-Bausteine gehen ohne Rückfrage hinaus — die Lücken werden
    // ja im Zielprogramm angesprungen.
    if (b.ausgabeart === "marken") {
      abschliessen(b, TB.reichtext.auswerte(f.text, {}, umgebung, holeBaustein, "marken"), fassungsHinweis);
      return;
    }
    var analyse = TB.reichtext.pruefe(f.text, umgebung);
    if (analyse.luecken.length === 0) {
      abschliessen(b, TB.reichtext.auswerte(f.text, {}, umgebung, holeBaustein), fassungsHinweis);
      return;
    }
    var d = el("dialog");
    d.appendChild(el("h2", "", T.ausfuellenTitel + " — " + (b.titel || "") + fassungsHinweis));
    var eingaben = {};
    analyse.luecken.forEach(function (l, i) {
      var zeile = el("div", "feldzeile");
      zeile.appendChild(el("label", "", l.beschriftung));
      var feld;
      if (l.art === "auswahl") {
        feld = el("select");
        l.optionen.forEach(function (o) {
          var opt = el("option", "", o); opt.value = o; feld.appendChild(opt);
        });
      } else {
        feld = el("input"); feld.type = "text"; feld.value = l.vorgabe || "";
        if (i === 0) setTimeout(function () { feld.select(); }, 0);
      }
      eingaben[l.beschriftung] = feld;
      zeile.appendChild(feld);
      d.appendChild(zeile);
    });
    var vorschauTitel = el("label", "", T.vorschauTitel);
    var vorschau = el("div", "vorschau-kasten");
    d.appendChild(vorschauTitel); d.appendChild(vorschau);

    function antworten() {
      var a = {};
      Object.keys(eingaben).forEach(function (k) { a[k] = eingaben[k].value; });
      return a;
    }
    function aktualisiereVorschau() {
      vorschau.innerHTML =
        TB.reichtext.auswerte(f.text, antworten(), umgebung, holeBaustein).html;
    }
    Object.keys(eingaben).forEach(function (k) {
      eingaben[k].addEventListener("input", aktualisiereVorschau);
      eingaben[k].addEventListener("change", aktualisiereVorschau);
    });
    aktualisiereVorschau();

    var knoepfe = el("div", "dialog-knoepfe");
    var ab = el("button", "neben", T.abbrechen);
    ab.addEventListener("click", function () { d.close(); });
    var ok = el("button", "haupt", T.kopieren);
    ok.addEventListener("click", function () {
      var e = TB.reichtext.auswerte(f.text, antworten(), umgebung, holeBaustein);
      d.close(); abschliessen(b, e, fassungsHinweis);
    });
    knoepfe.appendChild(ab); knoepfe.appendChild(ok);
    d.appendChild(knoepfe);
    d.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && ev.target.tagName !== "TEXTAREA") {
        ev.preventDefault(); ok.click(); }
    });
    dialogOeffnen(d);
  }

  function abschliessen(b, ausgewertet, fassungsHinweis) {
    if (ausgewertet.fehler.length) {
      melde(T.makroWarnung + ausgewertet.fehler.join(" · "), true); return;
    }
    TB.ui.kopiereFassungen(ausgewertet.html, ausgewertet.text, function (ok, wie) {
      if (ok) {
        TB.statistik.bausteinBenutzt(b.id);
        TB.abgleich.anstossen(8000);   // Zählwerte haben es nicht eilig
        melde((ausgewertet.art === "marken" ? T.kopiertMarken : T.kopiert) +
              (fassungsHinweis || ""));
        zeichneListe();
      } else { melde(T.kopierenFehlgeschlagen, true); }
    });
  }

  // ---- Baustein bearbeiten: seit Etappe 6 in ansicht-bearbeiten.js ------
  // (oberflaeche.js war über die 600-Zeilen-Grenze gewachsen; das
  // Bearbeiten-Fenster ist ein eigenes Thema und hat jetzt seine Datei.)
  function bearbeiteBaustein(b) { TB.ansichtBearbeiten.bearbeite(b); }

  // ---- Papierkorb -------------------------------------------------------
  function zeichnePapierkorb(wurzel) {
    var liste = S.allePapierkorb().sort(function (a, b) {
      return Date.parse(b.geloeschtAm) - Date.parse(a.geloeschtAm); });
    if (!liste.length) {
      wurzel.appendChild(el("div", "leer", T.papierkorbLeer)); return;
    }
    var ul = el("ul", "liste");
    liste.forEach(function (b) {
      var li = zeileFuerBaustein(b, [
        [T.zurueckholen, function () {
          S.zurueckholen(b.id); TB.statistik.zaehle("zurueckgeholt");
          TB.abgleich.anstossen(); melde(T.zurueckgeholt); zeichne(); }],
        [T.endgueltigLoeschen, function () {
          if (confirm(T.endgueltigFrage.replace("%s", "1"))) {
            S.endgueltigLoeschen([b.id]); TB.statistik.zaehle("endgueltig");
            melde(T.endgueltigGeloescht); zeichne();
          } }]
      ]);
      li.querySelector(".zeile-neben").textContent =
        T.geloeschtAmText + new Date(b.geloeschtAm).toLocaleDateString("de-CH");
      li.style.cursor = "default";
      ul.appendChild(li);
    });
    wurzel.appendChild(ul);
  }

  // ---- Rahmen -----------------------------------------------------------
  function setzeKopf() {
    var name = TB.einstellungen.anzeigename();
    document.getElementById("app-name").textContent = name;
    document.title = name + (S.WELT === "dev" ? " DEV" : "");
    document.getElementById("dev-marke").hidden = (S.WELT !== "dev");
    if (S.WELT === "dev") document.body.classList.add("dev-welt");
    // Die Fassung steht seit dem 20.9. sichtbar oben auf jeder Seite —
    // so sieht Näd sofort, ob die neuste Fassung geladen ist.
    var marke = document.getElementById("fassung-marke");
    if (!marke) {
      marke = document.createElement("span");
      marke.id = "fassung-marke";
      marke.className = "fassung-marke";
      var kopf = document.getElementById("app-name");
      if (kopf && kopf.parentNode) kopf.parentNode.appendChild(marke);
    }
    var ort = TB.einstellungen.standort();
    marke.textContent = "Fassung " + TB.FASSUNG.split(" · ")[0] +
      " · " + TB.FASSUNG.split(" · ").pop() +
      (ort ? " · " + ort : "") +
      (S.WELT === "dev" ? " · TESTWELT" : "");
  }

  function zeichne() {
    zeichneNavigation();
    var wurzel = document.getElementById("inhalt");
    wurzel.textContent = "";
    wurzel.className = (ansicht === "bausteine") ? "" : "breit";
    if (ansicht === "bausteine") zeichneBausteine(wurzel);
    else if (ansicht === "entwuerfe") TB.ansichtEntwuerfe.zeichne(wurzel);
    else if (ansicht === "ideen") TB.ansichtIdeen.zeichne(wurzel);
    else if (ansicht === "papierkorb") zeichnePapierkorb(wurzel);
    else if (ansicht === "einstellungen") TB.ansichtEinstellungen.zeichne(wurzel);
    else if (ansicht === "statistik") TB.ansichtEinstellungen.zeichneStatistik(wurzel);
    else if (ansicht === "chronik") TB.ansichtEinstellungen.zeichneChronik(wurzel);
    else TB.ansichtEinstellungen.zeichneHilfe(wurzel);
    TB.ansichtWolke.zeichneLeiste();
  }

  function start() {
    if (start._lief) return; // läuft genau einmal
    start._lief = true;
    T = TB.T; S = TB.speicher;
    TB.wolke.start(S.WELT);
    console.log("Textbausteine — Welt: " + S.WELT + " — Gerät: " + S.geraet() +
                " — Fassung " + TB.FASSUNG);
    var geraeumt = S.raeumePapierkorbAuf();
    if (geraeumt) console.log("Papierkorb: " + geraeumt + " alte Einträge entfernt.");
    // Etappe 4: Bausteine aus der Zeit vor dem RTF-Vorrat bekommen ihn
    // hier still — ohne neuen Zeitstempel, damit kein Konflikt entsteht.
    var nachgeruestet = S.rtfNachruesten ? S.rtfNachruesten() : 0;
    if (nachgeruestet) {
      console.log("RTF-Vorrat: " + nachgeruestet + " Baustein(e) nachgerüstet.");
      TB.abgleich.anstossen();
    }
    setzeKopf();
    document.addEventListener("keydown", function (ev) {
      // Steht der Cursor in einem Feld, mischt sich die App nicht ein —
      // sonst fiele Näd beim Belegen eines Kürzels aus den Einstellungen
      // heraus (15.9.). Und mit Umschalt oder Alt ist es ein anderes
      // Kürzel: Strg+Umschalt+N ist NICHT Strg+N.
      var ziel = ev.target;
      if (ziel && ziel.nodeType === 1 &&
          (ziel.tagName === "INPUT" || ziel.tagName === "TEXTAREA" ||
           ziel.tagName === "SELECT" || ziel.isContentEditable)) return;
      if (ev.shiftKey || ev.altKey) return;
      var befehl = ev.ctrlKey || ev.metaKey;
      if (befehl && (ev.key === "f" || ev.key === "F")) {
        // Nur auf der Bausteine-Seite ist Strg+F unsere Suche; auf
        // allen anderen Seiten gehört Strg+F dem Browser (19.9.) —
        // vorher riss es Näd aus den Einstellungen heraus.
        if (ansicht === "bausteine") {
          var s = document.getElementById("suchfeld");
          if (s) { ev.preventDefault(); s.focus(); s.select(); }
        }
      }
      if (befehl && (ev.key === "n" || ev.key === "N")) {
        ev.preventDefault();
        if (ansicht !== "bausteine") { ansicht = "bausteine"; zeichne(); }
        bearbeiteBaustein(null);
      }
    });
    zeichne();
    TB.ansichtWolke.start();
  }

  return { start: start, zeichne: zeichne, zeichneListe: zeichneListe,
           zeichneNavigation: zeichneNavigation,
           geheZu: geheZu, setzeKopf: setzeKopf,
           zeileFuerBaustein: zeileFuerBaustein,
           bearbeiteBaustein: bearbeiteBaustein };
})();

document.addEventListener("DOMContentLoaded", TB.oberflaeche.start);
