// Datei: ansicht-enmg.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die ENMG-Ansicht: Export-Datei (PDF oder Word) hineinziehen,
//        Messwerte als Tabelle mit Färbung sehen (rot = ausserhalb
//        Deiner Grenzwerte, grün = innerhalb, schwarz = kein Normwert),
//        neben jedem gefärbten Wert steht klein die angewandte Grenze —
//        der Patient steht gross über der Tabelle, bevor irgendetwas
//        kopiert wird. Kopieren legt Text + formatiertes HTML (+ RTF
//        für KISIM) in die Zwischenablage; im URL-Fenster übergibt der
//        grosse Knopf. GRUNDSATZ: Der Inhalt der Datei bleibt in
//        diesem Fenster — nichts wird gespeichert, nichts abgeglichen.

"use strict";
window.TB = window.TB || {};

TB.ansichtEnmg = (function () {
  var T = function () { return TB.enmgTexte; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };
  var melde = function (t, w) { TB.ui.melde(t, w); };

  var ergebnis = null;    // bewertetes Lese-Ergebnis — NUR im Speicher
  var dateiName = "";
  var liest = false;
  var fensterModus = false;
  function setzeFensterModus(w) { fensterModus = !!w; }

  // ---- Datei annehmen ---------------------------------------------------
  function passt(datei) {
    var n = (datei && datei.name || "").toLowerCase();
    return n.endsWith(".pdf") || n.endsWith(".docx");
  }
  function verarbeite(datei) {
    if (!datei) return;
    if (!passt(datei)) { melde(T().falscheArt, true); return; }
    liest = true;
    neuZeichnen();
    TB.enmgLeser.leseDatei(datei).then(function (erg) {
      liest = false;
      TB.enmg.bewerte(erg);
      ergebnis = erg;
      dateiName = datei.name;
      TB.statistik.zaehle("enmgGelesen");
      neuZeichnen();
      if (!erg.bloecke.length) melde(T().keineMesswerte, true);
    }, function (fehler) {
      liest = false;
      ergebnis = null;
      neuZeichnen();
      melde(T().leseFehler.replace("%s",
        (fehler && fehler.message) || "unbekannter Fehler"), true);
    });
  }
  function neuZeichnen() { TB.oberflaeche.zeichne(); }

  // ---- Bausteine der Ansicht ---------------------------------------------
  function zeichneAblage(wurzel) {
    var zone = el("div", "enmg-drop");
    zone.appendChild(el("div", "enmg-drop-text",
      liest ? T().liest : T().einleitung));
    if (dateiName && !liest)
      zone.appendChild(el("div", "enmg-drop-datei", dateiName));
    var knopf = el("button", "neben", T().dateiKnopf);
    var feld = el("input");
    feld.type = "file"; feld.accept = ".pdf,.docx"; feld.hidden = true;
    feld.addEventListener("change", function () {
      verarbeite(feld.files && feld.files[0]);
    });
    knopf.addEventListener("click", function (ev) {
      ev.stopPropagation(); feld.click(); });
    zone.appendChild(knopf); zone.appendChild(feld);
    zone.addEventListener("click", function () { feld.click(); });
    zone.addEventListener("dragover", function (ev) {
      ev.preventDefault(); zone.classList.add("enmg-drop-aktiv"); });
    zone.addEventListener("dragleave", function () {
      zone.classList.remove("enmg-drop-aktiv"); });
    zone.addEventListener("drop", function (ev) {
      ev.preventDefault(); zone.classList.remove("enmg-drop-aktiv");
      var d = ev.dataTransfer;
      verarbeite(d && d.files && d.files[0]);
    });
    wurzel.appendChild(zone);
  }

  function wertZelle(td, wert, bew, einheitlos) {
    if (wert === null || wert === undefined) { td.textContent = ""; return; }
    if (!bew || !bew.farbe) {
      var s = el("span", "", String(wert));
      s.title = T().ohneZuordnung;
      td.appendChild(s); return;
    }
    var w = el("span", bew.farbe === "rot" ? "enmg-rot" : "enmg-gruen",
      String(wert));
    w.title = bew.zeileName;
    td.appendChild(w);
    var g = el("span", "enmg-grenze",
      (bew.richtung === "max" ? "≤ " : "≥ ") + bew.grenze);
    g.title = T().zuordnungKurz.replace("%s", bew.zeileName)
      .replace("%s", bew.grenze);
    td.appendChild(g);
    if (einheitlos) { /* Einheit steht im Spaltenkopf */ }
  }

  function zeichneBlock(wurzel, block) {
    var kopf = el("div", "enmg-nerv", block.nervText);
    if (!block.nervId)
      kopf.appendChild(el("span", "marke enmg-marke-warn", T().unbekannterNerv));
    wurzel.appendChild(kopf);
    var motor = block.art === "motor";
    var spalten = motor
      ? [T().spalteSegment, T().spalteLat, T().spalteAmpM, T().spalteDur,
         T().spalteNlg, T().spalteFLat]
      : [T().spalteSegment, T().spalteAbstand, T().spalteLat,
         T().spalteAmpU, T().spalteNlg];
    var tabelle = el("table", "enmg-tabelle");
    var kopfzeile = el("tr");
    spalten.forEach(function (s) { kopfzeile.appendChild(el("th", "", s)); });
    tabelle.appendChild(kopfzeile);
    block.zeilen.forEach(function (z) {
      var tr = el("tr");
      tr.appendChild(el("td", "enmg-segment", z.segment));
      var w = z.werte, b = z.bew || {};
      function zelle(wert, bew) {
        var td = el("td", "enmg-wert");
        wertZelle(td, wert, bew);
        tr.appendChild(td);
      }
      if (motor) {
        zelle(w.lat, b.lat); zelle(w.amp, null); zelle(w.dur, null);
        zelle(w.nlg, b.nlg); zelle(w.fLat, b.fLat);
      } else {
        zelle(w.abstand, null); zelle(w.lat, null);
        zelle(w.amp, b.amp); zelle(w.nlg, b.nlg);
      }
      tabelle.appendChild(tr);
    });
    wurzel.appendChild(tabelle);
  }

  function zeichneErgebnis(wurzel) {
    var p = ergebnis.patient || {};
    var kopf = el("div", "enmg-patient");
    var teile = [];
    if (p.name) teile.push(p.name);
    if (p.geburtsdatum) teile.push("geb. " + p.geburtsdatum);
    if (ergebnis.alter !== null && ergebnis.alter !== undefined)
      teile.push(T().jahre.replace("%s", ergebnis.alter));
    if (p.untersuchungsdatum)
      teile.push(T().untersuchungsdatum + ": " + p.untersuchungsdatum);
    kopf.textContent = teile.join("  ·  ");
    wurzel.appendChild(kopf);
    if (ergebnis.alter === null || ergebnis.alter === undefined)
      wurzel.appendChild(el("div", "enmg-warnung", T().alterUnbekannt));

    var letzteArt = "";
    ergebnis.bloecke.forEach(function (block) {
      if (block.art !== letzteArt) {
        letzteArt = block.art;
        wurzel.appendChild(el("h3", "",
          block.art === "motor" ? T().motorTitel : T().sensTitel));
      }
      zeichneBlock(wurzel, block);
    });
    if (ergebnis.reste && ergebnis.reste.length) {
      var r = el("div", "enmg-reste");
      r.appendChild(el("div", "enmg-reste-titel", T().nichtVerstanden));
      ergebnis.reste.forEach(function (t) {
        r.appendChild(el("div", "", t)); });
      wurzel.appendChild(r);
    }
    wurzel.appendChild(el("div", "enmg-legende", T().legende));
    wurzel.appendChild(el("div", "enmg-quelle",
      T().quelleZeile.replace("%s", TB.enmg.quelle())));

    var zeile = TB.ui.knopfzeile();
    var kopieren = el("button", "haupt", T().kopierenKnopf);
    kopieren.addEventListener("click", kopiereTabelle);
    zeile.appendChild(kopieren);
    var leeren = el("button", "leise", T().zuruecksetzenKnopf);
    leeren.addEventListener("click", function () {
      ergebnis = null; dateiName = "";
      neuZeichnen(); melde(T().zurueckgesetzt);
    });
    zeile.appendChild(leeren);
    wurzel.appendChild(zeile);

    if (fensterModus) {
      var gross = el("button", "fenster-knopf-gross",
        TB.fensterModus.knopfText());
      gross.addEventListener("click", function () {
        TB.fensterModus.uebergeben(gross); });
      wurzel.appendChild(gross);
    }
  }

  function kopiereTabelle() {
    if (!ergebnis) { melde(T().nichtsZuKopieren, true); return; }
    var ht = TB.enmg.tabelleHtmlText(ergebnis);
    TB.ui.kopiereFassungen(ht.html, ht.text, function (ok, wie) {
      if (!ok) { melde(T().kopierenFehl, true); return; }
      TB.statistik.zaehle("enmgKopiert");
      melde(wie === "nur reiner Text" ? T().kopiertNurText : T().kopiertMeldung);
    });
  }

  function aktuellerText() {
    if (!ergebnis || !ergebnis.bloecke.length) return null;
    var ht = TB.enmg.tabelleHtmlText(ergebnis);
    return { text: ht.text, html: ht.html };
  }

  function zeichne(wurzel) {
    wurzel.appendChild(el("h2", "", T().enmgTitel));
    if (!fensterModus) {
      var leiste = el("div", "werkzeugleiste");
      var pflege = el("button", "", T().pflegeKnopf);
      pflege.addEventListener("click", function () {
        TB.ansichtEnmgPflege.oeffne(); });
      leiste.appendChild(pflege);
      wurzel.appendChild(leiste);
    }
    zeichneAblage(wurzel);
    if (ergebnis) zeichneErgebnis(wurzel);
    else if (fensterModus) {
      wurzel.appendChild(el("div", "enmg-warnung", T().fensterLeer));
    }
  }

  return { zeichne: zeichne, setzeFensterModus: setzeFensterModus,
           aktuellerText: aktuellerText, verarbeite: verarbeite };
})();
