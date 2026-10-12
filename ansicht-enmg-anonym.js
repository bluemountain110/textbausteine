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

    // 18.7: Kurven-Rohdaten mitliefern (für die Kurven-Analyse). Gilt
    // für Dateien, die NACH dem Ankreuzen hineingezogen werden.
    var kurvenZeile = el("label", "anonym-kurven-wahl");
    var kurvenKreuz = el("input"); kurvenKreuz.type = "checkbox";
    kurvenZeile.appendChild(kurvenKreuz);
    kurvenZeile.appendChild(el("span", "", T().anonymKurvenWahl));
    d.appendChild(kurvenZeile);
    kurvenKreuz.addEventListener("change", function () {
      if (!vorschau.hidden) vorschau.textContent =
        TB.enmgAnonym.sammelausgabe(eintraege, kurvenKreuz.checked);
    });

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
        if (e.ok) {
          var erg = el("span", "anonym-ergebnis");
          erg.appendChild(el("span", "",
            T().jahre.replace("%s", e.alter) + " · "));
          // 18.6: Steht das Geschlecht nicht im Export (Keypoint!),
          // stellt ein Klick es um: m → w → unbekannt.
          var g = el("button", "anonym-geschlecht",
            e.geschlecht || T().anonymOhneGeschlecht);
          g.title = T().anonymGeschlechtTipp;
          g.addEventListener("click", function (ev) {
            ev.stopPropagation();
            e.geschlecht = e.geschlecht === "m" ? "w"
              : (e.geschlecht === "w" ? "" : "m");
            zeichneListe();
          });
          erg.appendChild(g);
          erg.appendChild(el("span", "", " · " + (e.monatJahr || "—")));
          if (e.grafik && !e.grafik.length) {
            erg.appendChild(el("span", "anonym-kurven-leer",
              " · " + T().anonymKurvenLeer));
          }
          if (e.grafik && e.grafik.length) {
            var kb = el("button", "anonym-geschlecht",
              T().anonymKurvenKnopf.replace("%s", e.grafik.reduce(
                function (s, g) { return s + g.pfade.length; }, 0)));
            kb.addEventListener("click", function (ev) {
              ev.stopPropagation(); zeigeKurven(e); });
            erg.appendChild(el("span", "", " · "));
            erg.appendChild(kb);
          }
          zeile.appendChild(erg);
        } else {
          zeile.appendChild(el("span", "anonym-ergebnis", e.grund));
        }
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
        TB.enmgAnonym.sammelausgabe(eintraege, kurvenKreuz.checked);
    }

    function verarbeite(dateien) {
      var neu = Array.prototype.slice.call(dateien || []);
      if (!neu.length) return;
      offen += neu.length;
      zeichneListe();
      // 18.9: JEDES PDF wird auf Kurven gelesen — unabhängig vom
      // Häkchen (Näds Test 12.10.: Häkchen nach dem Hineinziehen gesetzt
      // → still keine Kurven). Das Häkchen entscheidet erst beim
      // Sichern/Vorschauen, ob die Kurven in die Ausgabe kommen.
      neu.forEach(function (datei) {
        TB.enmgLeser.leseText(datei).then(function (text) {
          var erg = TB.enmgAnonym.anonymisiere(text.split("\n"));
          erg.name = datei.name;
          var istPdf = /\.pdf$/i.test(datei.name);
          if (erg.ok && !istPdf) {
            erg.kurven = "### Kurven-Rohdaten: nicht möglich — Word-Datei " +
              "(Kurven nur aus dem PDF-Export)";
          }
          if (!erg.ok || !istPdf) { eintraege.push(erg); return; }
          return datei.arrayBuffer().then(function (puffer) {
            return TB.enmgLeserPdf.leseGrafik(puffer);
          }).then(function (grafik) {
            erg.kurven = TB.enmgAnonym.kurvenText(grafik, erg);
            // Für die Vorschau nur die Linien (ohne Beschriftungen).
            erg.grafik = grafik.map(function (g) {
              return { nr: g.nr, pfade: g.pfade }; });
            eintraege.push(erg);
          }, function () {
            erg.kurven = "### Kurven-Rohdaten: nicht lesbar";
            eintraege.push(erg);
          });
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

    // Kurven-Vorschau: die erkannten Linien je Zeichenfläche als Bild —
    // NUR Linien, keine Beschriftung, darum ohne jeden Patientenbezug.
    var kurvenBlatt = el("div", "anonym-kurven");
    kurvenBlatt.hidden = true;
    d.insertBefore(kurvenBlatt, vorschau);
    function zeigeKurven(e) {
      kurvenBlatt.textContent = "";
      kurvenBlatt.hidden = false;
      var ns = "http://www.w3.org/2000/svg";
      e.grafik.forEach(function (g) {
        var alle = [];
        g.pfade.forEach(function (p) { alle = alle.concat(p.pts); });
        if (!alle.length) return;
        var xs = alle.map(function (q) { return q[0]; });
        var ys = alle.map(function (q) { return q[1]; });
        var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
        var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
        var bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0);
        kurvenBlatt.appendChild(el("div", "anonym-kurven-titel",
          T().anonymKurvenFlaeche.replace("%s", g.nr)
            .replace("%s", g.pfade.length)));
        var svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 " + bw + " " + bh);
        svg.setAttribute("class", "anonym-kurven-bild");
        g.pfade.forEach(function (p) {
          var pl = document.createElementNS(ns,
            p.geschlossen ? "polygon" : "polyline");
          pl.setAttribute("points", p.pts.map(function (q) {
            return (q[0] - x0).toFixed(1) + "," + (y1 - q[1]).toFixed(1);
          }).join(" "));
          var farbe = "rgb(" + p.farbe.map(function (v) {
            return Math.round(v * 255); }).join(",") + ")";
          if (p.art === "flaeche") {
            pl.setAttribute("fill", farbe); pl.setAttribute("stroke", "none");
          } else {
            pl.setAttribute("fill", "none"); pl.setAttribute("stroke", farbe);
            pl.setAttribute("stroke-width", Math.max(0.3, p.breite));
          }
          svg.appendChild(pl);
        });
        kurvenBlatt.appendChild(svg);
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
      eintraege = []; vorschau.hidden = true;
      kurvenBlatt.hidden = true; kurvenBlatt.textContent = "";
      zeichneListe(); });
    var zeigen = el("button", "neben", T().anonymVorschau);
    zeigen.addEventListener("click", function () {
      vorschau.hidden = !vorschau.hidden;
      if (!vorschau.hidden)
        vorschau.textContent = TB.enmgAnonym.sammelausgabe(eintraege, kurvenKreuz.checked);
    });
    var sichern = el("button", "haupt", T().anonymSichern);
    sichern.addEventListener("click", function () {
      var inhalt = TB.enmgAnonym.sammelausgabe(eintraege, kurvenKreuz.checked);
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
