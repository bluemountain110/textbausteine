// Datei: ansicht-eeg-pflege.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die Pflege des EEG-Katalogs: Punkte bearbeiten (Text mit
//        {{Auswahl:…}}/{{Feld:…}}-Stellen), häufig/selten schalten,
//        per Ziehen umsortieren (auch in eine andere Kategorie),
//        Punkte anlegen und entfernen — und die Vorlagen umbenennen,
//        ihr Kürzel ändern oder sie löschen. Alles synct sofort auf
//        alle Geräte. Die Pflege gibt es NUR in der App (Entscheid
//        Etappe 10, Punkt 4); Skript und Erweiterung lesen nur.

"use strict";
window.TB = window.TB || {};

TB.ansichtEegPflege = (function () {
  var TE = function () { return TB.eegTexte; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };
  var melde = function (t, w) { TB.ui.melde(t, w); };
  var gezogenId = null;
  var bearbeiteId = null;

  function speichere(m) { TB.eeg.speichereMaster(m); }

  // Ziehen: vor oder hinter den Ziel-Punkt, Kategorie wird übernommen.
  function zieheNach(m, id, zielId, dahinter) {
    if (!id || id === zielId) return false;
    var p = TB.eeg.punkt(m, id), ziel = TB.eeg.punkt(m, zielId);
    if (!p || !ziel) return false;
    m.punkte.splice(m.punkte.indexOf(p), 1);
    p.kategorie = ziel.kategorie;
    var wo = m.punkte.indexOf(ziel) + (dahinter ? 1 : 0);
    m.punkte.splice(wo, 0, p);
    return true;
  }

  function oeffne() {
    var wurzel = document.getElementById("inhalt");
    zeichne(wurzel);
  }

  function zeichne(wurzel) {
    wurzel.textContent = "";
    var m = TB.eeg.master();
    if (!m) { TB.ansichtEeg.zeichne(wurzel); return; }

    var kopf = el("div", "status-kopf");
    kopf.appendChild(el("h2", "", TE().pflegeTitel));
    var zurueck = el("button", "", TE().zurueckZumAusfuellen);
    zurueck.addEventListener("click", function () {
      TB.ansichtEeg.zeichne(wurzel); });
    kopf.appendChild(zurueck);
    wurzel.appendChild(kopf);
    wurzel.appendChild(el("p", "klein-hinweis", TE().pflegeHinweis));

    zeichneVorlagen(wurzel);

    ["befund", "beurteilung"].forEach(function (bereich) {
      TB.eeg.jeKategorie(m, bereich).forEach(function (block) {
        var kasten = el("section", "status-kategorie");
        kasten.appendChild(el("h3", "", block.kategorie.name));
        block.punkte.forEach(function (p) {
          kasten.appendChild(zeile(m, p)); });
        var dazu = el("button", "status-weitere", "+ " + TE().punktNeu);
        dazu.addEventListener("click", function () {
          var text = prompt(TE().punktNeu + " — Text:", "");
          if (!text || !text.trim()) return;
          var id = TB.eeg.neuePunktId(m, text);
          var letzter = -1;
          m.punkte.forEach(function (x, i) {
            if (x.kategorie === block.kategorie.id) letzter = i; });
          m.punkte.splice(letzter + 1, 0,
            { id: id, kategorie: block.kategorie.id, haeufig: false,
              text: text.trim() });
          speichere(m); melde(TE().gespeichert); neu();
        });
        kasten.appendChild(dazu);
        wurzel.appendChild(kasten);
      });
    });
  }

  function zeile(m, p) {
    var z = el("div", "status-zeile eeg-pflege-zeile");
    z.draggable = true;
    z.addEventListener("dragstart", function (ev) {
      gezogenId = p.id;
      z.classList.add("wird-gezogen");
      try { ev.dataTransfer.setData("text/plain", p.id); } catch (e) { }
      ev.dataTransfer.effectAllowed = "move";
    });
    z.addEventListener("dragend", function () {
      gezogenId = null; z.classList.remove("wird-gezogen"); });
    function haelfte(ev) {
      var r = z.getBoundingClientRect();
      return (ev.clientY - r.top) > r.height / 2;
    }
    z.addEventListener("dragover", function (ev) {
      if (!gezogenId || gezogenId === p.id) return;
      ev.preventDefault();
      var unten = haelfte(ev);
      z.classList.toggle("ablage-oben", !unten);
      z.classList.toggle("ablage-unten", unten);
    });
    z.addEventListener("dragleave", function () {
      z.classList.remove("ablage-oben", "ablage-unten"); });
    z.addEventListener("drop", function (ev) {
      ev.preventDefault();
      z.classList.remove("ablage-oben", "ablage-unten");
      if (zieheNach(m, gezogenId, p.id, haelfte(ev))) { speichere(m); neu(); }
      gezogenId = null;
    });

    var griff = el("span", "status-griff", "⋮⋮");
    griff.title = TE().ziehenHinweis;
    z.appendChild(griff);

    var inhalt = el("div", "status-zeile-inhalt");
    if (bearbeiteId === p.id) {
      var feld = el("textarea", "status-abweichfeld");
      feld.rows = 3;
      feld.value = p.text;
      function schliesse() {
        var wert = feld.value.trim();
        if (wert && wert !== p.text) {
          p.text = wert; speichere(m); melde(TE().gespeichert); }
        bearbeiteId = null; neu();
      }
      feld.addEventListener("blur", schliesse);
      feld.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape") { bearbeiteId = null; neu(); }
      });
      inhalt.appendChild(feld);
      setTimeout(function () { feld.focus(); }, 0);
    } else {
      var text = el("span", "status-befund", p.text);
      text.title = TE().befundKlickHinweis;
      text.addEventListener("click", function () {
        bearbeiteId = p.id; neu(); });
      inhalt.appendChild(text);
    }
    z.appendChild(inhalt);

    var marke = el("button", "status-merkmal-knopf",
      p.haeufig ? TE().haeufigMarke : TE().seltenMarke);
    marke.addEventListener("click", function () {
      p.haeufig = !p.haeufig; speichere(m); neu(); });
    z.appendChild(marke);

    var weg = el("button", "status-zurueck", "✕");
    weg.title = TE().loeschenKnopf;
    weg.addEventListener("click", function () {
      if (!confirm(TE().punktLoeschenFrage)) return;
      m.punkte.splice(m.punkte.indexOf(p), 1);
      speichere(m); neu();
    });
    z.appendChild(weg);
    return z;
  }

  function zeichneVorlagen(wurzel) {
    var liste = TB.eeg.vorlagen();
    var kasten = el("section", "status-kategorie");
    kasten.appendChild(el("h3", "", TE().vorlagenPflegeTitel));
    liste.forEach(function (v) {
      var z = el("div", "status-zeile");
      z.appendChild(el("span", "status-name",
        v.name + (v.kuerzel ? " (;;" + v.kuerzel + ")" : "")));
      var um = el("button", "status-merkmal-knopf", TE().umbenennen);
      um.addEventListener("click", function () {
        var name = prompt(TE().vorlageNameFrage, v.name);
        if (!name || !name.trim()) return;
        v.name = name.trim();
        TB.eeg.speichereVorlagen(liste); melde(TE().gespeichert); neu();
      });
      z.appendChild(um);
      var ku = el("button", "status-merkmal-knopf", TE().kuerzelAendern);
      ku.addEventListener("click", function () {
        var kuerzel = prompt(TE().vorlageKuerzelFrage, v.kuerzel || "");
        if (kuerzel === null) return;
        v.kuerzel = kuerzel.trim().toLowerCase();
        TB.eeg.speichereVorlagen(liste); melde(TE().gespeichert); neu();
      });
      z.appendChild(ku);
      var weg = el("button", "status-zurueck", "✕");
      weg.title = TE().loeschenKnopf;
      weg.addEventListener("click", function () {
        if (!confirm(TE().vorlageLoeschenFrage.replace("%s", v.name))) return;
        liste.splice(liste.indexOf(v), 1);
        TB.eeg.speichereVorlagen(liste); neu();
      });
      z.appendChild(weg);
      kasten.appendChild(z);
    });
    wurzel.appendChild(kasten);
  }

  function neu() {
    var wurzel = document.getElementById("inhalt");
    zeichne(wurzel);
  }

  return { oeffne: oeffne, zeichne: zeichne, zieheNach: zieheNach };
})();
