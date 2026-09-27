// Datei: ansicht-uebersicht.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die Bausteine-Übersicht: alle fertigen Bausteine als
//        sortierbare Liste (nach Kategorie und Titel, nach Titel,
//        nach Kürzel oder nach „zuletzt benutzt“), mit Kürzel und
//        erster Textzeile — und als PDF ausgebbar (Bericht-Regel:
//        Dateiname mit Ursprung, Datum und Uhrzeit). Gedacht als
//        Spickzettel neben KISIM und als Inventar beim Aufräumen.

"use strict";
window.TB = window.TB || {};

TB.ansichtUebersicht = (function () {
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };

  var TU = {
    titel: "Bausteine-Übersicht",
    sortierung: "Sortierung:",
    nachKategorie: "Kategorie, dann Titel",
    nachTitel: "Titel",
    nachKuerzel: "Kürzel",
    nachBenutzt: "Zuletzt benutzt",
    pdfKnopf: "Als PDF sichern",
    bearbeitenHinweis: "Klick öffnet den Baustein zum Bearbeiten",
    leer: "Noch keine fertigen Bausteine.",
    ohneKategorie: "(ohne Kategorie)",
    ohneKuerzel: "—",
    nie: "nie benutzt"
  };
  var sortierung = "kategorie";

  function fertige() {
    return TB.speicher.alleAktiven().filter(function (b) {
      return !b.entwurf && b.art !== "idee"; });
  }
  function ersteZeile(b) {
    var t = "";
    try { t = TB.auszeichnung.reinerText(b.text || ""); } catch (e) { t = ""; }
    t = t.split("\n")[0] || "";
    return t.length > 90 ? t.slice(0, 90) + "…" : t;
  }
  function vergleicher() {
    function texte(a, b) { return a.localeCompare(b, "de"); }
    if (sortierung === "titel") {
      return function (a, b) { return texte(a.titel || "", b.titel || ""); };
    }
    if (sortierung === "kuerzel") {
      return function (a, b) {
        return texte(a.kuerzel || "\uffff", b.kuerzel || "\uffff"); };
    }
    if (sortierung === "benutzt") {
      return function (a, b) {
        return String(b.zuletztBenutztAm || "")
          .localeCompare(String(a.zuletztBenutztAm || "")); };
    }
    return function (a, b) {
      var k = texte(a.kategorie || "\uffff", b.kategorie || "\uffff");
      return k !== 0 ? k : texte(a.titel || "", b.titel || "");
    };
  }
  function benutztText(b) {
    if (!b.zuletztBenutztAm) return TU.nie;
    return String(b.zuletztBenutztAm).slice(0, 10);
  }

  function alsBerichtText(liste) {
    var zeilen = [], kategorie = null;
    liste.forEach(function (b) {
      if (sortierung === "kategorie") {
        var k = b.kategorie || TU.ohneKategorie;
        if (k !== kategorie) {
          kategorie = k;
          if (zeilen.length) zeilen.push("");
          zeilen.push("== " + k + " ==");
        }
      }
      zeilen.push((b.kuerzel ? ";;" + b.kuerzel : TU.ohneKuerzel) +
        "  " + (b.titel || "?") + "  —  " + ersteZeile(b));
    });
    return zeilen.join("\n");
  }

  function zeichne(wurzel) {
    wurzel.textContent = "";
    wurzel.appendChild(el("h2", "", TU.titel));

    var liste = fertige().sort(vergleicher());

    var leiste = el("div", "werkzeugleiste");
    leiste.appendChild(el("span", "klein-hinweis", TU.sortierung));
    var wahl = el("select");
    [["kategorie", TU.nachKategorie], ["titel", TU.nachTitel],
     ["kuerzel", TU.nachKuerzel], ["benutzt", TU.nachBenutzt]]
      .forEach(function (paar) {
        var o = el("option", "", paar[1]);
        o.value = paar[0];
        if (paar[0] === sortierung) o.selected = true;
        wahl.appendChild(o);
      });
    wahl.addEventListener("change", function () {
      sortierung = wahl.value; zeichne(wurzel); });
    leiste.appendChild(wahl);
    var pdf = el("button", "", TU.pdfKnopf);
    pdf.addEventListener("click", function () {
      TB.ui.berichtAusgeben("Uebersicht", alsBerichtText(liste)); });
    leiste.appendChild(pdf);
    wurzel.appendChild(leiste);

    if (!liste.length) {
      wurzel.appendChild(el("p", "klein-hinweis", TU.leer));
      return;
    }
    var tabelle = el("div", "uebersicht-tabelle");
    var kategorie = null;
    liste.forEach(function (b) {
      if (sortierung === "kategorie") {
        var k = b.kategorie || TU.ohneKategorie;
        if (k !== kategorie) {
          kategorie = k;
          tabelle.appendChild(el("h3", "", k));
        }
      }
      var z = el("div", "uebersicht-zeile");
      // Sammelrunde 27.9.: Klick öffnet den Baustein zum Bearbeiten.
      z.title = TU.bearbeitenHinweis;
      z.addEventListener("click", function () {
        TB.oberflaeche.bearbeiteBaustein(b); });
      z.appendChild(el("span", "uebersicht-kuerzel",
        b.kuerzel ? ";;" + b.kuerzel : TU.ohneKuerzel));
      z.appendChild(el("span", "uebersicht-titel", b.titel || "?"));
      z.appendChild(el("span", "uebersicht-text", ersteZeile(b)));
      z.appendChild(el("span", "uebersicht-benutzt", benutztText(b)));
      tabelle.appendChild(z);
    });
    wurzel.appendChild(tabelle);
  }

  return { zeichne: zeichne };
})();
