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
    nie: "nie benutzt",
    werk: "Werk",
    werkStatus: "Status (Werk)",
    werkEeg: "EEG (Werk)",
    werkBerichte: "Berichte (Werk)"
  };
  var sortierung = "kategorie";

  // 17.5 (Naed): Alles mit ;;Kuerzel gehoert in die Uebersicht — auch
  // die Werke (Status-Teilmengen, EEG-Vorlagen, MC-Bericht).
  function werkGruppen() {
    var g = [];
    try {
      var st = (TB.status.teilmengen() || []).map(function (t) {
        return { kuerzel: t.kuerzel || "", titel: t.name || "?",
                 zeile: (t.punkte || []).length + " Untersuchungen",
                 klick: function () {
                   TB.ansichtStatus.aktiviereTeilmenge(t.kuerzel); } };
      });
      if (st.length) g.push({ name: TU.werkStatus, zeilen: st });
    } catch (e) { /* Status-Werk nicht bereit */ }
    try {
      var ee = (TB.eeg.vorlagen() || []).map(function (v) {
        return { kuerzel: v.kuerzel || "", titel: "EEG — " + (v.name || "?"),
                 zeile: (v.punkte || []).length + " Punkte",
                 klick: function () {
                   TB.ansichtEeg.aktiviereVorlagePerKuerzel(v.kuerzel);
                   TB.oberflaeche.geheZu("eeg"); } };
      });
      if (ee.length) g.push({ name: TU.werkEeg, zeilen: ee });
    } catch (e) { /* EEG-Werk nicht bereit */ }
    g.push({ name: TU.werkBerichte, zeilen: [
      { kuerzel: "bermc", titel: "Bericht Memory Clinic",
        zeile: "Strg+Alt+B am Arbeitsplatz",
        klick: function () {
          try { TB.oberflaeche.geheZu("berichte"); } catch (e) {} } }
    ] });
    return g;
  }
  function werkeAnhaengen(ziel) {
    werkGruppen().forEach(function (gruppe) {
      ziel.appendChild(el("h3", "", gruppe.name));
      gruppe.zeilen.forEach(function (w) {
        var z = el("div", "uebersicht-zeile");
        z.addEventListener("click", w.klick);
        z.appendChild(el("span", "uebersicht-kuerzel",
          w.kuerzel ? ";;" + w.kuerzel : TU.ohneKuerzel));
        z.appendChild(el("span", "uebersicht-titel", w.titel));
        z.appendChild(el("span", "uebersicht-text", w.zeile));
        z.appendChild(el("span", "uebersicht-benutzt", TU.werk));
        ziel.appendChild(z);
      });
    });
  }
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
    werkGruppen().forEach(function (gruppe) {
      if (zeilen.length) zeilen.push("");
      zeilen.push("== " + gruppe.name + " ==");
      gruppe.zeilen.forEach(function (w) {
        zeilen.push((w.kuerzel ? ";;" + w.kuerzel : TU.ohneKuerzel) +
          "  " + w.titel + "  —  " + w.zeile);
      });
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

    var tabelle = el("div", "uebersicht-tabelle");
    if (!liste.length) {
      wurzel.appendChild(el("p", "klein-hinweis", TU.leer));
    }
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
    werkeAnhaengen(tabelle);
    wurzel.appendChild(tabelle);
  }

  return { zeichne: zeichne };
})();
