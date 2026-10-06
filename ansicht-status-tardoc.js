// Datei: ansicht-status-tardoc.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die Tardoc-Anzeige des Status-Werks: die Ampeln (A/B je
//        Statusart, „am nächsten“-Hinweis) und das Nachlese-Fenster
//        mit den Kriterien beider Positionen samt LKAAT-Links. In
//        Etappe 11 aus ansicht-status.js ausgegliedert, weil die Datei
//        über die 600-Zeilen-Grenze gewachsen war. Gezeichnet wird mit
//        TB.ansichtStatusTardoc.zeichne(wurzel, master, gewählteMenge,
//        merkmalWahl); die Zählung selbst lebt weiter in status.js.

"use strict";
window.TB = window.TB || {};

TB.ansichtStatusTardoc = (function () {
  var TS = function () { return TB.statusTexte; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };
  // 17.4 (Naed): kompakt — nur die zwei Pillen; Erklaertexte,
  // Fusszeile und Nachlese-Knopf erst hinter dem Pfeil.
  var offenDetails = false;

  function zeichne(wurzel, m, menge, merkmalWahl) {
    var stand = TB.status.tardoc(m, menge, merkmalWahl);
    var kasten = el("div", "status-tardoc" +
      (offenDetails ? "" : " kompakt"));
    var kopfzeile = el("div", "status-tardoc-kompakt");
    var details = el("div", "status-tardoc-details");
    Object.keys(stand).forEach(function (art) {
      var a = stand[art];
      var wort = a.stufe === "A"
        ? TS().tardocPilleA : (a.stufe === "B" ? TS().tardocPilleB
                                               : TS().tardocPilleLeer);
      var pille = el("span", "status-pille" +
        (a.stufe === "A" ? " gut" : (a.stufe === "B" ? " halb" : "")),
        wort.replace("%s", a.name).replace("%s", String(a.erfuellte)));
      kopfzeile.appendChild(pille);
      var hinweisText = TB.status.tardocFehltText(a);
      var zeile = el("div", "status-tardoc-zeile");
      var hinweis = el("span", "klein-hinweis status-tardoc-hinweis",
        hinweisText);
      hinweis.title = hinweisText;
      zeile.appendChild(hinweis);
      details.appendChild(zeile);
    });
    var pfeil = el("button", "status-tardoc-pfeil",
      (offenDetails ? "▾ " : "▸ ") + TS().tardocPfeilWort);
    pfeil.title = TS().tardocPfeil;
    pfeil.addEventListener("click", function () {
      offenDetails = !offenDetails;
      TB.oberflaeche.neu();
    });
    kopfzeile.appendChild(pfeil);
    kasten.appendChild(kopfzeile);
    if (offenDetails) {
      var fuss = el("div", "status-tardoc-fuss",
        TS().tardocHinweis.replace("%s", TB.tardocDaten.fassung));
      var lesen = el("button", "status-tardoc-lesen", TS().tardocLesenKnopf);
      lesen.addEventListener("click", zeigeKriterien);
      fuss.appendChild(lesen);
      details.appendChild(fuss);
      kasten.appendChild(details);
    }
    wurzel.appendChild(kasten);
  }

  // Das Nachlese-Fenster (Näds Wunsch 27.9.): beide Positionen mit
  // Gruppenliste — Zusammenfassung, jeder Titel verlinkt aufs Original.
  function zeigeKriterien() {
    var schleier = el("div", "status-schleier");
    schleier.addEventListener("click", function (e) {
      if (e.target === schleier) schleier.remove(); });
    var karte = el("div", "status-lesen-karte");
    var kopf = el("div", "status-kopf");
    kopf.appendChild(el("h3", "", TS().tardocLesenTitel));
    var zu = el("button", "", TS().tardocLesenZu);
    zu.addEventListener("click", function () { schleier.remove(); });
    kopf.appendChild(zu);
    karte.appendChild(kopf);
    karte.appendChild(el("p", "klein-hinweis", TS().tardocLesenEinleitung));
    TB.status.tardocKriterien().forEach(function (art) {
      karte.appendChild(el("h4", "", art.name));
      // Näd 28.9.: Tabelle — jede Zeile eine Gruppe, Spalten
      // Exploration B und A, in jeder Zelle die Anforderung. Die Zellen
      // sind laut Tarif in beiden Spalten identisch; der Unterschied
      // steht in der Kopfzeile (Anzahl Gruppen, Minuten).
      karte.appendChild(el("p", "klein-hinweis", TS().tardocLesenGleich));
      var huelle = el("div", "status-lesen-tabelle-huelle");
      var tab = el("table", "status-lesen-tabelle");
      var kopfzeile = el("tr");
      kopfzeile.appendChild(el("th", "", TS().tardocLesenGruppeKopf));
      [["halb", art.zeileB, art.linkB], ["gut", art.zeileA, art.linkA]]
        .forEach(function (p) {
          var th = el("th", p[0]);
          var link = el("a", "", p[1]);
          link.href = p[2]; link.target = "_blank"; link.rel = "noopener";
          th.appendChild(link);
          kopfzeile.appendChild(th);
        });
      tab.appendChild(kopfzeile);
      art.gruppen.forEach(function (g) {
        var tr = el("tr");
        tr.appendChild(el("td", "status-lesen-gruppenname", g.kopf));
        ["halb", "gut"].forEach(function (k) {
          tr.appendChild(el("td", k, g.merkmale)); });
        tab.appendChild(tr);
      });
      huelle.appendChild(tab);
      karte.appendChild(huelle);
    });
    karte.appendChild(el("p", "klein-hinweis", TS().tardocLesenStand));
    schleier.appendChild(karte);
    document.body.appendChild(schleier);
  }

  return { zeichne: zeichne, zeigeKriterien: zeigeKriterien };
})();
