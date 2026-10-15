// Datei: ansicht-anzeigen.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Das Nachschlage-Fenster (18.17, Näds Wunsch 13.10.): Bausteine
//        mit der Ausgabeart „Nur anzeigen" (z. B. ;;txirr) fügen NICHTS
//        ein, sondern zeigen ihren Text zum schnellen Nachschlagen.
//        Kopiert wird nur auf Knopfdruck („Kopieren": formatiert und
//        als reiner Text mit •-Punkten). Am Mac per Klick oder Kürzel,
//        im Spital und in der Praxis über den URL-Fenster-Weg
//        (?fenster=anzeigen&kuerzel=…) — überall dieselbe Ansicht.
//        Schliessen oder Esc schliesst; im eigenen Fenster das ganze
//        Fenster. GRUNDSATZ: Hier wird nichts gespeichert.

"use strict";
window.TB = window.TB || {};

TB.anzeigenTexte = {
  hinweis: "Nur zum Nachschlagen — es wird nichts eingefügt.",
  kopieren: "Kopieren",
  kopiert: "Kopiert — mit Strg+V (Mac: ⌘V) einfügen.",
  kopierenFehl: "Kopieren fehlgeschlagen.",
  schliessen: "Schliessen",
  standort: "Fassung für %s",
  // Beschriftungen der dritten Ausgabeart im Bearbeiten-Fenster. Sie
  // wohnen hier (nicht in texte.js), weil texte.js byteweise mit der
  // eingefrorenen Erweiterung geteilt ist (SKRIPT-ZUERST, 15.10.).
  artAnzeigen: "Nur anzeigen (Nachschlagen)",
  artAnzeigenText: "Klick oder Kürzel ZEIGT den Text nur in einem Fenster — nichts wird eingefügt, nichts landet in der Zwischenablage. Kopieren gibt es dort auf Knopfdruck. Für Nachschlage-Bausteine wie ;;txirr."
};

TB.ansichtAnzeigen = (function () {
  var T = function () { return TB.anzeigenTexte; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };

  function holeBaustein(kuerzel) { return TB.speicher.holenPerKuerzel(kuerzel); }

  // Reiner Text mit sichtbaren Aufzählungen: KISIM nimmt aus dem
  // Browser nur reinen Text an — ohne •/1. gingen die Listen dort
  // als gewöhnliche Zeilen unter.
  function textMitPunkten(html) {
    var wurzel = document.createElement("div");
    wurzel.innerHTML = html || "";
    var zeilen = [], aktuell = "";
    function zeileFertig() {
      zeilen.push(aktuell.replace(/[ \t]+$/, ""));
      aktuell = "";
    }
    function lauf(knoten, liste) {
      Array.prototype.forEach.call(knoten.childNodes, function (k) {
        if (k.nodeType === 3) { aktuell += k.nodeValue.replace(/\s+/g, " "); return; }
        if (k.nodeType !== 1) return;
        var n = k.nodeName;
        if (n === "BR") { zeileFertig(); return; }
        if (n === "UL" || n === "OL") {
          if (aktuell.trim()) zeileFertig();
          lauf(k, { nummeriert: n === "OL", zaehler: 0 });
          return;
        }
        if (n === "LI") {
          if (aktuell.trim()) zeileFertig();
          var zeichen = "• ";
          if (liste && liste.nummeriert) { liste.zaehler += 1; zeichen = liste.zaehler + ". "; }
          aktuell = zeichen;
          lauf(k, null);
          zeileFertig();
          return;
        }
        var block = /^(P|DIV|H[1-6]|TABLE|TR|BLOCKQUOTE)$/.test(n);
        if (block && aktuell.trim()) zeileFertig();
        if (n === "TD" || n === "TH") { lauf(k, null); aktuell += "\t"; return; }
        lauf(k, liste);
        if (block) zeileFertig();
      });
    }
    lauf(wurzel, null);
    if (aktuell.trim()) zeileFertig();
    return zeilen.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function oeffne(b, imFenster) {
    if (!b) return null;
    var umgebung = TB.einstellungen.makroUmgebung();
    var f = TB.bausteine.fassungFuer(b);
    var erg = TB.reichtext.auswerte(f.text, {}, umgebung, holeBaustein);
    var html = erg.html || "";

    var d = el("dialog", "anzeigen");
    d.appendChild(el("h2", "", b.titel || (";;" + (b.kuerzel || ""))));
    var unter = T().hinweis;
    if (f.variante) unter += " " + T().standort.replace("%s", f.variante) + ".";
    d.appendChild(el("div", "erklaerung", unter));
    var inhalt = el("div", "anzeigen-text");
    inhalt.innerHTML = html;
    d.appendChild(inhalt);

    var zeile = el("div", "dialog-knoepfe");
    var zu = el("button", "neben", T().schliessen);
    zu.addEventListener("click", function () { d.close(); });
    var kopieren = el("button", "haupt", T().kopieren);
    kopieren.addEventListener("click", function () {
      TB.ui.kopiereFassungen(html, textMitPunkten(html), function (ok) {
        TB.ui.melde(ok ? T().kopiert : T().kopierenFehl, !ok);
      });
    });
    zeile.appendChild(zu); zeile.appendChild(kopieren);
    d.appendChild(zeile);

    d.addEventListener("close", function () {
      if (imFenster) { try { window.close(); } catch (e) { /* still */ } }
    });
    try { TB.statistik.bausteinBenutzt(b.id); } catch (e) { /* still */ }
    TB.ui.dialogOeffnen(d);
    try { kopieren.focus(); } catch (e2) { /* still */ }
    return d;
  }

  return { oeffne: oeffne, textMitPunkten: textMitPunkten };
})();
