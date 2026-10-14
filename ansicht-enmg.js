// Datei: ansicht-enmg.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die ENMG-Ansicht: Export-Datei (Keypoint-PDF, Word .docx oder
//        seit 18.13 der Viking-Bericht als altes Word .doc) hineinziehen,
//        Messwerte als Tabelle mit Färbung sehen (rot = ausserhalb
//        Deiner Grenzwerte, grün = innerhalb, schwarz = kein Normwert),
//        neben jedem gefärbten Wert steht klein die angewandte Grenze —
//        der Patient steht gross über der Tabelle, bevor irgendetwas
//        kopiert wird. Seit 18.13 darunter der BEFUND-VORSCHLAG:
//        Fragestellungen zum Anklicken, Zusammenfassung je Nerv und
//        Beurteilung (beide frei änderbar). „Bericht kopieren" legt
//        Fragestellung, Tabelle, Zusammenfassung und Beurteilung in die
//        Zwischenablage; im URL-Fenster übergibt der grosse Knopf.
//        GRUNDSATZ: Der Inhalt der Datei bleibt in diesem Fenster —
//        nichts wird gespeichert, nichts abgeglichen.

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
  // Befund-Vorschlag (18.13) — ebenfalls nur im Speicher
  var fragen = [], zusText = "", beuText = "", beuGeaendert = false,
      zusGeaendert = false;
  function setzeFensterModus(w) { fensterModus = !!w; }

  // ---- Datei annehmen ---------------------------------------------------
  function passt(datei) {
    var n = (datei && datei.name || "").toLowerCase();
    return n.endsWith(".pdf") || n.endsWith(".docx") || n.endsWith(".doc");
  }
  function vorschlagNeu() {
    zusText = TB.enmgBefund.zusammenfassung(ergebnis);
    beuText = TB.enmgBefund.beurteilung(ergebnis, fragen);
    zusGeaendert = false; beuGeaendert = false;
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
      fragen = TB.enmgBefund.fragenAusText(erg.fragestellungText || "");
      vorschlagNeu();
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
    feld.type = "file"; feld.accept = ".pdf,.docx,.doc"; feld.hidden = true;
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

  function wertZelle(td, wert, bew) {
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
  }

  function zeichneBlock(wurzel, block) {
    var kopf = el("div", "enmg-nerv", block.nervText);
    if (!block.nervId)
      kopf.appendChild(el("span", "marke enmg-marke-warn", T().unbekannterNerv));
    wurzel.appendChild(kopf);
    var sp = TB.enmg.spalten(block);
    var tabelle = el("table", "enmg-tabelle");
    var kopfzeile = el("tr");
    sp.forEach(function (s) { kopfzeile.appendChild(el("th", "", s.titel)); });
    tabelle.appendChild(kopfzeile);
    block.zeilen.forEach(function (z) {
      var tr = el("tr");
      var segTd = el("td", "enmg-segment", z.segment);
      if (z.unplausibel) {
        segTd.appendChild(el("span", "marke enmg-marke-warn", T().unplausibel));
      } else if (z.vergleich) {
        segTd.title = T().vergleichOhneNorm;
      }
      tr.appendChild(segTd);
      var w = z.werte, b = z.bew || {};
      sp.forEach(function (s) {
        if (s.feld === "segment") return;
        var td = el("td", "enmg-wert");
        wertZelle(td, w[s.feld], s.bewertet ? b[s.feld] : null);
        tr.appendChild(td);
      });
      tabelle.appendChild(tr);
    });
    wurzel.appendChild(tabelle);
  }

  // ---- Befund-Vorschlag (18.13) -------------------------------------------
  function zeichneBefund(wurzel) {
    var B = TB.enmgBefund;
    var kasten = el("div", "enmg-befund");
    kasten.appendChild(el("h3", "", T().befundTitel));
    kasten.appendChild(el("div", "erklaerung", T().befundHinweis));

    var fz = el("div", "status-teilmengen");
    fz.appendChild(el("span", "enmg-befund-beschriftung", T().fragestellungTitel));
    B.FRAGEN.forEach(function (f) {
      var k = el("button", "status-chip" + (fragen.indexOf(f.id) !== -1 ? " aktiv" : ""),
        f.text);
      k.addEventListener("click", function () {
        var i = fragen.indexOf(f.id);
        if (i === -1) fragen.push(f.id); else fragen.splice(i, 1);
        if (beuGeaendert) melde(T().beurteilungVonHand, true);
        else beuText = B.beurteilung(ergebnis, fragen);
        neuZeichnen();
      });
      fz.appendChild(k);
    });
    kasten.appendChild(fz);
    if (ergebnis.fragestellungText)
      kasten.appendChild(el("div", "enmg-befund-export",
        T().ausExport.replace("%s", ergebnis.fragestellungText)));

    function feld(titel, wert, beiAenderung) {
      var l = el("label", "enmg-befund-feld");
      l.appendChild(el("span", "enmg-befund-beschriftung", titel));
      var ta = el("textarea");
      ta.value = wert;
      ta.rows = Math.max(3, String(wert).split("\n").length + 1);
      ta.addEventListener("input", function () { beiAenderung(ta.value); });
      l.appendChild(ta);
      kasten.appendChild(l);
    }
    feld(T().zusammenfassungTitel, zusText, function (v) {
      zusText = v; zusGeaendert = true; });
    feld(T().beurteilungTitel, beuText, function (v) {
      beuText = v; beuGeaendert = true; });
    if (ergebnis.vorhandeneBeurteilung)
      kasten.appendChild(el("div", "enmg-befund-export",
        T().vorhandeneBeurteilung.replace("%s", ergebnis.vorhandeneBeurteilung)));

    var neu = el("button", "leise", T().neuVorschlagen);
    neu.addEventListener("click", function () {
      if ((zusGeaendert || beuGeaendert) && !window.confirm(T().neuVorschlagenFrage))
        return;
      vorschlagNeu(); neuZeichnen(); melde(T().neuVorgeschlagen);
    });
    kasten.appendChild(neu);
    wurzel.appendChild(kasten);
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

    zeichneBefund(wurzel);

    var zeile = TB.ui.knopfzeile();
    var bericht = el("button", "haupt", T().berichtKopieren);
    bericht.addEventListener("click", function () { kopiere(true, true); });
    var nurText = el("button", "neben", T().nurTextKopieren);
    nurText.addEventListener("click", function () { kopiere(false, true); });
    var nurTab = el("button", "neben", T().kopierenKnopf);
    nurTab.addEventListener("click", function () { kopiere(true, false); });
    var leeren = el("button", "leise", T().zuruecksetzenKnopf);
    leeren.addEventListener("click", function () {
      ergebnis = null; dateiName = ""; fragen = []; zusText = ""; beuText = "";
      neuZeichnen(); melde(T().zurueckgesetzt);
    });
    zeile.appendChild(leeren); zeile.appendChild(nurTab);
    zeile.appendChild(nurText); zeile.appendChild(bericht);
    wurzel.appendChild(zeile);

    if (fensterModus) {
      var gross = el("button", "fenster-knopf-gross",
        TB.fensterModus.knopfText());
      gross.addEventListener("click", function () {
        TB.fensterModus.uebergeben(gross); });
      wurzel.appendChild(gross);
    }
  }

  // ---- Zusammensetzen: Fragestellung · Tabelle · Zusammenfassung · Beurteilung
  function fragestellungZeile() {
    var t = TB.enmgBefund.FRAGEN.filter(function (f) {
      return fragen.indexOf(f.id) !== -1; }).map(function (f) { return f.text; });
    if (!t.length && ergebnis.fragestellungText) return ergebnis.fragestellungText;
    return t.join(" ");
  }
  function zusammensetzen(mitTabelle, mitText) {
    var B = TB.enmgBefund, html = [], text = [];
    var P = '<p style="font-family:Arial;font-size:10pt;margin:8px 0 2px"><b>';
    var fr = fragestellungZeile();
    if (mitText && fr) {
      html.push(P + T().fragestellungTitel + "</b> " +
        B.alsHtml(fr).replace(/^<p[^>]*>|<\/p>$/g, "") + "</p>");
      text.push(T().fragestellungTitel + " " + fr, "");
    }
    if (mitTabelle) {
      var ht = TB.enmg.tabelleHtmlText(ergebnis);
      html.push(ht.html); text.push(ht.text, "");
    }
    if (mitText) {
      html.push(P + T().zusammenfassungTitel + "</b></p>" + B.alsHtml(zusText));
      text.push(T().zusammenfassungTitel, zusText, "");
      html.push(P + T().beurteilungTitel + "</b></p>" + B.alsHtml(beuText));
      text.push(T().beurteilungTitel, beuText);
    }
    return { html: html.join("\n"), text: text.join("\n") };
  }

  function kopiere(mitTabelle, mitText) {
    if (!ergebnis) { melde(T().nichtsZuKopieren, true); return; }
    var ht = zusammensetzen(mitTabelle, mitText);
    TB.ui.kopiereFassungen(ht.html, ht.text, function (ok, wie) {
      if (!ok) { melde(T().kopierenFehl, true); return; }
      TB.statistik.zaehle("enmgKopiert");
      melde(wie === "nur reiner Text" ? T().kopiertNurText : T().kopiertMeldung);
    });
  }

  function aktuellerText() {
    if (!ergebnis || !ergebnis.bloecke.length) return null;
    var ht = zusammensetzen(true, true);
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
      var anonym = el("button", "", T().anonymKnopf);
      anonym.addEventListener("click", function () {
        TB.ansichtEnmgAnonym.oeffne(); });
      leiste.appendChild(anonym);
      wurzel.appendChild(leiste);
    }
    zeichneAblage(wurzel);
    if (ergebnis) zeichneErgebnis(wurzel);
    else if (fensterModus) {
      wurzel.appendChild(el("div", "enmg-warnung", T().fensterLeer));
    }
  }

  return { zeichne: zeichne, setzeFensterModus: setzeFensterModus,
           aktuellerText: aktuellerText, verarbeite: verarbeite,
           zusammensetzen: zusammensetzen };
})();
