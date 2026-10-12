// Datei: ansicht-enmg-anonym.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Das Anonymisier-Fenster des ENMG-Werks (18.5): viele
//        Geräte-Exporte aufs Mal hineinziehen, je Datei grün (mit
//        Alter/Geschlecht/Monat-Jahr) oder rot (Grund) sehen, die
//        Ausgabe VORSCHAUEN und als EINE Textdatei sichern. Rote
//        Dateien kommen NIE in die Ausgabe; Quell-Dateinamen stehen
//        nur in der Liste hier, nie in der Ausgabe (sie tragen oft
//        den Patientennamen). GRUNDSATZ: Alles bleibt in diesem
//        Fenster — nichts wird gespeichert oder abgeglichen.

"use strict";
window.TB = window.TB || {};

TB.ansichtEnmgAnonym = (function () {
  var T = function () { return TB.enmgTexte; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };

  function oeffne() {
    var eintraege = [];   // { name, ok, grund, alter, geschlecht, monatJahr, text }
    var offen = 0;

    var d = el("dialog", "anonym");
    d.appendChild(el("h2", "", T().anonymTitel));
    d.appendChild(el("div", "erklaerung", T().anonymErklaerung));

    var zone = el("div", "enmg-drop");
    var zonenText = el("div", "enmg-drop-text", T().anonymEinleitung);
    zone.appendChild(zonenText);
    var knopf = el("button", "neben", T().anonymDateiKnopf);
    var feld = el("input");
    feld.type = "file"; feld.accept = ".pdf,.docx";
    feld.multiple = true; feld.hidden = true;
    zone.appendChild(knopf); zone.appendChild(feld);
    d.appendChild(zone);

    var liste = el("div", "anonym-liste");
    d.appendChild(liste);
    var stand = el("div", "anonym-stand", "");
    d.appendChild(stand);
    var vorschau = el("pre", "anonym-vorschau");
    vorschau.hidden = true;
    d.appendChild(vorschau);

    function zeichneListe() {
      liste.textContent = "";
      eintraege.forEach(function (e) {
        var zeile = el("div", "anonym-zeile " +
          (e.ok ? "anonym-gruen" : "anonym-rot"));
        zeile.appendChild(el("span", "anonym-datei", e.name));
        zeile.appendChild(el("span", "anonym-ergebnis", e.ok
          ? (T().jahre.replace("%s", e.alter) + " · " +
             (e.geschlecht || T().anonymOhneGeschlecht) + " · " +
             (e.monatJahr || "—"))
          : e.grund));
        liste.appendChild(zeile);
      });
      var gruene = eintraege.filter(function (e) { return e.ok; }).length;
      var rote = eintraege.length - gruene;
      stand.textContent = eintraege.length
        ? T().anonymStand.replace("%s", gruene).replace("%s", rote) +
          (offen ? " " + T().anonymLiest.replace("%s", offen) : "")
        : "";
      sichern.disabled = !gruene;
      zeigen.disabled = !gruene;
      if (!vorschau.hidden) vorschau.textContent =
        TB.enmgAnonym.sammelausgabe(eintraege);
    }

    function verarbeite(dateien) {
      var neu = Array.prototype.slice.call(dateien || []);
      if (!neu.length) return;
      offen += neu.length;
      zeichneListe();
      neu.forEach(function (datei) {
        TB.enmgLeser.leseText(datei).then(function (text) {
          var erg = TB.enmgAnonym.anonymisiere(text.split("\n"));
          erg.name = datei.name;
          eintraege.push(erg);
        }, function (fehler) {
          eintraege.push({ name: datei.name, ok: false,
            grund: T().anonymLeseFehler.replace("%s",
              (fehler && fehler.message) || "unbekannter Fehler") });
        }).then(function () {
          offen -= 1;
          zeichneListe();
        });
      });
    }

    feld.addEventListener("change", function () {
      verarbeite(feld.files); feld.value = ""; });
    knopf.addEventListener("click", function (ev) {
      ev.stopPropagation(); feld.click(); });
    zone.addEventListener("click", function () { feld.click(); });
    zone.addEventListener("dragover", function (ev) {
      ev.preventDefault(); zone.classList.add("enmg-drop-aktiv"); });
    zone.addEventListener("dragleave", function () {
      zone.classList.remove("enmg-drop-aktiv"); });
    zone.addEventListener("drop", function (ev) {
      ev.preventDefault(); zone.classList.remove("enmg-drop-aktiv");
      verarbeite(ev.dataTransfer && ev.dataTransfer.files);
    });

    var zeile = el("div", "dialog-knoepfe");
    var zu = el("button", "neben", T().anonymSchliessen);
    zu.addEventListener("click", function () { d.close(); });
    var leeren = el("button", "leise", T().anonymLeeren);
    leeren.addEventListener("click", function () {
      eintraege = []; vorschau.hidden = true; zeichneListe(); });
    var zeigen = el("button", "neben", T().anonymVorschau);
    zeigen.addEventListener("click", function () {
      vorschau.hidden = !vorschau.hidden;
      if (!vorschau.hidden)
        vorschau.textContent = TB.enmgAnonym.sammelausgabe(eintraege);
    });
    var sichern = el("button", "haupt", T().anonymSichern);
    sichern.addEventListener("click", function () {
      var inhalt = TB.enmgAnonym.sammelausgabe(eintraege);
      var blob = new Blob([inhalt], { type: "text/plain;charset=utf-8" });
      var a = el("a");
      a.href = URL.createObjectURL(blob);
      a.download = TB.enmgAnonym.dateiname();
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      TB.speicher.zaehleFunktion("enmgAnonym");
      TB.ui.melde(T().anonymGesichert.replace("%s", a.download));
    });
    zeile.appendChild(zu); zeile.appendChild(leeren);
    zeile.appendChild(zeigen); zeile.appendChild(sichern);
    d.appendChild(zeile);

    zeichneListe();
    TB.ui.dialogOeffnen(d);
  }

  return { oeffne: oeffne };
})();
