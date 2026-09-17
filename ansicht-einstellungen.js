// Datei: ansicht-einstellungen.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die vier ruhigen Ansichten der App: Einstellungen (Name,
//        Datumsformat, Konstanten, Gerätename, Sicherung, Selbsttest,
//        Verbindung prüfen, Über die App), Statistik, Anleitung und
//        Chronik. Ausgelagert aus oberflaeche.js, damit keine Datei
//        über 600 Zeilen wächst.
//        Die gemeinsamen Helfer kommen aus TB.ui.

"use strict";
window.TB = window.TB || {};

TB.ansichtEinstellungen = (function () {
  var el = TB.ui.el, melde = TB.ui.melde, kopiereText = TB.ui.kopiereText;
  var dialogOeffnen = TB.ui.dialogOeffnen, berichtAusgeben = TB.ui.berichtAusgeben;
  var T = function () { return TB.T; };
  var S = function () { return TB.speicher; };

  // ---- Einstellungen ----------------------------------------------------
  function zeichne(wurzel) {
    var E = TB.einstellungen;

    var k1 = el("div", "karte");
    k1.appendChild(el("h2", "", T().bereichEinstellungen));
    var z1 = el("div", "feldzeile");
    z1.appendChild(el("label", "", T().einstAnzeigename));
    var fName = el("input"); fName.type = "text"; fName.value = E.anzeigename();
    fName.addEventListener("change", function () {
      E.setzeAnzeigename(fName.value); TB.oberflaeche.setzeKopf();
      TB.abgleich.anstossen(); melde(T().gespeichert); });
    z1.appendChild(fName); k1.appendChild(z1);
    var z2 = el("div", "feldzeile");
    z2.appendChild(el("label", "", T().einstDatumsformat));
    var fFormat = el("input"); fFormat.type = "text"; fFormat.value = E.datumsformat();
    fFormat.addEventListener("change", function () {
      E.setzeDatumsformat(fFormat.value); TB.abgleich.anstossen();
      melde(T().gespeichert); });
    z2.appendChild(fFormat); k1.appendChild(z2);
    wurzel.appendChild(k1);

    // Anmeldung und Abgleich stehen in ansicht-wolke.js — sie bekommen
    // hier ihren Platz, damit alles Einstellbare an einem Ort ist.
    TB.ansichtWolke.zeichneKarten(wurzel);

    var k2 = el("div", "karte");
    k2.appendChild(el("h2", "", T().einstKonstanten));
    var tabelle = el("table", "konstanten");
    function zeichneKonstanten() {
      tabelle.textContent = "";
      var konst = E.konstanten();
      Object.keys(konst).forEach(function (name) {
        var tr = el("tr");
        var tdName = el("td"); tdName.style.width = "30%";
        var fName2 = el("input"); fName2.type = "text"; fName2.value = name;
        fName2.addEventListener("change", function () {
          var neu = fName2.value.trim();
          if (!neu || neu === name) { fName2.value = name; return; }
          var wert = E.konstanten()[name];
          E.entferneKonstante(name); E.setzeKonstante(neu, wert);
          zeichneKonstanten(); TB.abgleich.anstossen(); melde(T().gespeichert);
        });
        tdName.appendChild(fName2);
        tr.appendChild(tdName);
        var tdWert = el("td");
        var fWert = el("input"); fWert.type = "text"; fWert.value = konst[name];
        fWert.addEventListener("change", function () {
          E.setzeKonstante(name, fWert.value); TB.abgleich.anstossen();
          melde(T().gespeichert); });
        tdWert.appendChild(fWert); tr.appendChild(tdWert);
        var tdWeg = el("td");
        var weg = el("button", "leise", T().einstKonstanteLoeschen);
        weg.addEventListener("click", function () {
          E.entferneKonstante(name); zeichneKonstanten();
          TB.abgleich.anstossen(); melde(T().gespeichert); });
        tdWeg.appendChild(weg); tr.appendChild(tdWeg);
        tabelle.appendChild(tr);
      });
    }
    zeichneKonstanten();
    k2.appendChild(tabelle);
    var neuKonst = el("button", "neben", T().einstKonstanteNeu);
    neuKonst.style.marginTop = "8px";
    neuKonst.addEventListener("click", function () {
      var name = prompt(T().einstKonstanteName);
      if (name && name.trim()) {
        E.setzeKonstante(name.trim(), ""); zeichneKonstanten();
        TB.abgleich.anstossen(); }
    });
    k2.appendChild(neuKonst);
    wurzel.appendChild(k2);

    // Tastenkürzel fürs Formatieren.
    var kT = el("div", "karte");
    kT.appendChild(el("h2", "", T().kuerzelTitel));
    kT.appendChild(el("p", "erklaerung", T().kuerzelText));
    var kTabelle = el("table", "konstanten");
    function zeichneKuerzel() {
      kTabelle.textContent = "";
      var b = TB.tastenkuerzel.belegung();
      TB.tastenkuerzel.TAETIGKEITEN.forEach(function (paar) {
        var name = paar[0];
        var tr = el("tr");
        var tdName = el("td", "", T()["kuerzel_" + name]);
        tdName.style.width = "45%";
        tr.appendChild(tdName);
        var tdFeld = el("td");
        var feld = el("input"); feld.type = "text"; feld.readOnly = true;
        feld.value = b[name];
        feld.addEventListener("focus", function () {
          feld.value = T().kuerzelDruecke; });
        feld.addEventListener("blur", function () {
          feld.value = TB.tastenkuerzel.belegung()[name]; });
        feld.addEventListener("keydown", function (ev) {
          ev.preventDefault();
          var gewuenscht = TB.tastenkuerzel.nameVon(ev);
          if (!gewuenscht) return;
          var urteil = TB.tastenkuerzel.pruefe(name, gewuenscht);
          if (!urteil.ok) { melde(urteil.grund, true); return; }
          TB.tastenkuerzel.setze(name, gewuenscht);
          TB.abgleich.anstossen();
          feld.blur(); zeichneKuerzel(); melde(T().kuerzelGeaendert);
        });
        tdFeld.appendChild(feld);
        tr.appendChild(tdFeld);
        kTabelle.appendChild(tr);
      });
    }
    zeichneKuerzel();
    kT.appendChild(kTabelle);
    var kZurueck = el("button", "neben", T().kuerzelZuruecksetzen);
    kZurueck.style.marginTop = "8px";
    kZurueck.addEventListener("click", function () {
      TB.tastenkuerzel.zuruecksetzen(); TB.abgleich.anstossen();
      zeichneKuerzel(); melde(T().kuerzelGeaendert); });
    kT.appendChild(kZurueck);
    wurzel.appendChild(kT);

    // Gerätename — bleibt auf diesem Gerät.
    var kG = el("div", "karte");
    kG.appendChild(el("h2", "", T().einstGeraetTitel));
    kG.appendChild(el("p", "erklaerung", T().einstGeraetText));
    var fGeraet = el("input"); fGeraet.type = "text"; fGeraet.value = S().geraet();
    fGeraet.style.maxWidth = "260px";
    fGeraet.addEventListener("change", function () {
      S().setzeGeraet(fGeraet.value);
      fGeraet.value = S().geraet();
      melde(T().gespeichert);
    });
    kG.appendChild(fGeraet);
    wurzel.appendChild(kG);

    var k3 = el("div", "karte");
    k3.appendChild(el("h2", "", T().einstExportTitel));
    k3.appendChild(el("p", "erklaerung", T().einstExportText));
    var exKnopf = el("button", "haupt", T().exportKnopf);
    exKnopf.addEventListener("click", function () {
      var name = S().exportDateiname();
      var blob = new Blob([JSON.stringify(S().exportObjekt(), null, 1)],
        { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      TB.statistik.zaehle("export");
      melde(T().exportFertig + name);
    });
    k3.appendChild(exKnopf);
    var imKnopf = el("button", "neben", T().importKnopf);
    imKnopf.style.marginLeft = "8px";
    var datei = el("input"); datei.type = "file"; datei.accept = ".json";
    datei.hidden = true;
    datei.addEventListener("change", function () {
      var f = datei.files[0]; if (!f) return;
      f.text().then(function (text) { importDialog(text); });
      datei.value = "";
    });
    imKnopf.addEventListener("click", function () { datei.click(); });
    k3.appendChild(imKnopf); k3.appendChild(datei);
    var beispiele = el("button", "neben", T().beispieleKnopf);
    beispiele.style.marginLeft = "8px";
    beispiele.addEventListener("click", function () {
      TB.bausteine.beispieleEinfuegen(); TB.statistik.zaehle("beispiele");
      TB.abgleich.anstossen(); melde(T().beispieleFertig);
      TB.oberflaeche.zeichne(); });
    k3.appendChild(beispiele);
    wurzel.appendChild(k3);

    var k4 = el("div", "karte");
    k4.appendChild(el("h2", "", T().bereichSelbsttest));
    var testKnopf = el("button", "haupt", T().selbsttestKnopf);
    var testPlatz = el("div"); testPlatz.style.marginTop = "10px";
    testKnopf.addEventListener("click", function () {
      TB.statistik.zaehle("selbsttest");
      testPlatz.textContent = T().selbsttestLaeuft;
      setTimeout(function () {
        var ergebnisse = TB.selbsttest.alleTests();
        testPlatz.textContent = "";
        ergebnisse.forEach(function (f) { testPlatz.appendChild(testZeile(f)); });
        var pdf = el("button", "haupt", T().berichtPdf);
        pdf.style.marginTop = "10px";
        pdf.addEventListener("click", function () {
          berichtAusgeben(T().kategorieSelbsttest, TB.selbsttest.bericht(ergebnisse)); });
        testPlatz.appendChild(pdf);
        var bericht = el("button", "neben", T().berichtKopieren);
        bericht.style.marginTop = "10px"; bericht.style.marginLeft = "8px";
        bericht.addEventListener("click", function () {
          kopiereText(TB.selbsttest.bericht(ergebnisse), function (ok) {
            melde(ok ? T().berichtKopiert : T().kopierenFehlgeschlagen, !ok); });
        });
        testPlatz.appendChild(bericht);
      }, 30);
    });
    k4.appendChild(testKnopf); k4.appendChild(testPlatz);
    wurzel.appendChild(k4);

    // Zwischenablage untersuchen — für die Abklärung, warum aus einem
    // bestimmten Programm etwas anders ankommt als erwartet.
    var kZ = el("div", "karte");
    kZ.appendChild(el("h2", "", T().untersuchTitel));
    kZ.appendChild(el("p", "erklaerung", T().untersuchText));
    var untersuchFeld = el("div", "schreibfeld untersuch-feld");
    untersuchFeld.setAttribute("contenteditable", "true");
    untersuchFeld.textContent = T().untersuchHier;
    var untersuchAusgabe = el("pre", "rohtext");
    untersuchAusgabe.hidden = true;
    untersuchFeld.addEventListener("paste", function (ev) {
      ev.preventDefault();
      var d = ev.clipboardData;
      var arten = [];
      try { arten = Array.prototype.slice.call(d.types || []); } catch (e) { }
      function hole(art) { try { return d.getData(art) || ""; } catch (e) { return ""; } }
      var html = hole("text/html"), rtf = hole("text/rtf"), text = hole("text/plain");
      var ausRtf = (!html && rtf) ? TB.rtfLesen.lies(rtf) : "";
      var sauber = html ? TB.auszeichnung.reinige(html).innerHTML
                        : (ausRtf ? TB.auszeichnung.reinige(ausRtf).innerHTML : "");
      var zeilen = [
        "Angebotene Sprachen: " + (arten.join(", ") || "(keine)"),
        "Reiner Text: " + text.length + " Zeichen",
        "HTML: " + html.length + " Zeichen",
        "RTF: " + rtf.length + " Zeichen",
        "",
        "— REINER TEXT —",
        text.slice(0, 1500) || "(keiner)",
        "",
        "— RTF, wie es ankommt (erste 4000 Zeichen) —",
        rtf.slice(0, 4000) || "(keins)",
        "",
        "— HTML, wie es ankommt (erste 3000 Zeichen) —",
        html.slice(0, 3000) || "(keins)",
        "",
        "— Was der RTF-Leser daraus macht —",
        (ausRtf ? ausRtf.slice(0, 3000) : "(kein RTF oder HTML war vorhanden)"),
        "",
        "— Was am Ende im Baustein landet —",
        sauber.slice(0, 3000) || "(leer)"
      ];
      untersuchAusgabe.hidden = false;
      untersuchAusgabe.textContent = zeilen.join("\n");
      // Ohne HTML bleibt der reine Text — mehr kann die App heute nicht
      // daraus machen. Genau dafür entsteht der RTF-Leser.
      untersuchFeld.innerHTML = sauber ||
        String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>");
    });
    kZ.appendChild(untersuchFeld);
    var kopierUntersuch = el("button", "haupt", T().untersuchKopieren);
    kopierUntersuch.style.marginTop = "10px";
    kopierUntersuch.addEventListener("click", function () {
      kopiereText(untersuchAusgabe.textContent, function (ok) {
        melde(ok ? T().berichtKopiert : T().kopierenFehlgeschlagen, !ok); }); });
    kZ.appendChild(kopierUntersuch);
    kZ.appendChild(untersuchAusgabe);
    wurzel.appendChild(kZ);

    var k5 = el("div", "karte");
    k5.appendChild(el("h2", "", T().ueberTitel));
    k5.appendChild(el("p", "erklaerung",
      T().fassung + ": " + TB.FASSUNG + " · " + T().welt + ": " +
      (S().WELT === "dev" ? T().weltDev : T().weltProd) + " · " +
      T().geraetName + ": " + S().geraet()));
    wurzel.appendChild(k5);
  }

  // Eine Ergebniszeile: GRÜN/ROT, Name, Erläuterung. Wird vom
  // Selbsttest und von der Verbindungsprüfung gleich benutzt.
  function testZeile(f) {
    var z = el("div", "test-zeile");
    z.appendChild(el("span", f.ok ? "punkt-gut" : "punkt-warn", f.ok ? "GRÜN" : "ROT"));
    z.appendChild(el("span", "", f.name));
    if (f.detail) z.appendChild(el("span", "test-detail", f.detail));
    return z;
  }

  function importDialog(text) {
    var v = S().importVorschau(text);
    if (v.fehler) { melde(T().importFehler + v.fehler, true); return; }
    var d = el("dialog");
    d.appendChild(el("h2", "", T().importTitel));
    var ul = el("ul");
    ul.appendChild(el("li", "", v.neu.length + " " + T().importNeu));
    ul.appendChild(el("li", "", v.vorhanden.length + " " + T().importVorhanden));
    ul.appendChild(el("li", "", v.zurueck.length + " " + T().importZurueck));
    d.appendChild(ul);
    var knoepfe = el("div", "dialog-knoepfe");
    var ab = el("button", "neben", T().abbrechen);
    ab.addEventListener("click", function () { d.close(); });
    var ok = el("button", "haupt", T().importAnwenden);
    ok.addEventListener("click", function () {
      var e = S().importAnwenden(v);
      TB.statistik.zaehle("import");
      TB.abgleich.anstossen();
      d.close();
      melde(T().importFertig.replace("%s", e.neu)
        .replace("%s", e.vorhanden).replace("%s", e.zurueck));
      TB.oberflaeche.zeichne();
    });
    knoepfe.appendChild(ab); knoepfe.appendChild(ok);
    d.appendChild(knoepfe);
    dialogOeffnen(d);
  }

  // ---- Statistik --------------------------------------------------------
  function zeichneStatistik(wurzel) {
    var St = TB.statistik;
    var kopf = el("div", "karte");
    kopf.appendChild(el("h2", "", T().statistikTitel));
    kopf.appendChild(el("p", "erklaerung", T().statistikErklaerung));
    kopf.appendChild(el("p", "", T().statistikSeit +
      St.datum(S().statistik().seit) + " · " + T().statistikGesamt +
      St.gesamtEinfuegungen()));
    wurzel.appendChild(kopf);

    function liste(titel, eintraege, nameVon) {
      var k = el("div", "karte");
      k.appendChild(el("h2", "", titel));
      if (!eintraege.length) {
        k.appendChild(el("p", "erklaerung", T().statistikLeer));
      } else {
        eintraege.forEach(function (e) {
          var z = el("div", "test-zeile");
          z.appendChild(el("span", "zaehler", e.anzahl + T().statistikMal));
          z.appendChild(el("span", "", nameVon(e)));
          if (e.zuletzt) z.appendChild(el("span", "test-detail",
            T().statistikZuletzt + St.datum(e.zuletzt)));
          k.appendChild(z);
        });
      }
      wurzel.appendChild(k);
    }
    liste(T().statistikBausteine, St.bausteinListe(20), function (e) {
      return e.entfernt ? T().statistikEntfernt : e.titel; });
    liste(T().statistikFunktionen, St.funktionListe(), function (e) { return e.name; });
    liste(T().statistikGeraete, St.geraeteListe(), function (e) { return e.name; });

    var knoepfe = el("div", "karte");
    var pdfKnopf = el("button", "haupt", T().berichtPdf);
    pdfKnopf.addEventListener("click", function () {
      berichtAusgeben(T().kategorieStatistik, St.bericht()); });
    knoepfe.appendChild(pdfKnopf);
    var kopieren = el("button", "neben", T().berichtKopieren);
    kopieren.style.marginLeft = "8px";
    kopieren.addEventListener("click", function () {
      kopiereText(St.bericht(), function (ok) {
        melde(ok ? T().berichtKopiert : T().kopierenFehlgeschlagen, !ok); }); });
    knoepfe.appendChild(kopieren);
    var zuruecksetzen = el("button", "leise", T().statistikZuruecksetzen);
    zuruecksetzen.style.marginLeft = "8px";
    zuruecksetzen.addEventListener("click", function () {
      if (confirm(T().statistikFrage)) {
        S().statistikZuruecksetzen(); TB.abgleich.anstossen();
        melde(T().statistikZurueckgesetzt); TB.oberflaeche.zeichne(); } });
    knoepfe.appendChild(zuruecksetzen);
    wurzel.appendChild(knoepfe);
  }

  // ---- Anleitung --------------------------------------------------------
  function zeichneHilfe(wurzel) {
    TB.hilfe.inhalt().forEach(function (kapitel) {
      var k = el("div", "karte");
      k.appendChild(el("h2", "", kapitel[0]));
      kapitel[1].forEach(function (abschnitt) {
        k.appendChild(el("h3", "unterkapitel", abschnitt[0]));
        k.appendChild(el("p", "erklaerung", abschnitt[1]));
      });
      wurzel.appendChild(k);
    });
  }

  // ---- Chronik ----------------------------------------------------------
  function zeichneChronik(wurzel) {
    TB.chronik.eintraege().forEach(function (e) {
      var k = el("div", "karte");
      k.appendChild(el("h2", "", e[1]));
      k.appendChild(el("div", "gruppe", e[0]));
      k.appendChild(el("p", "erklaerung", e[2]));
      if (e[3]) k.appendChild(el("p", "erklaerung", T().chronikBesonders + e[3]));
      wurzel.appendChild(k);
    });
  }

  return { zeichne: zeichne, zeichneStatistik: zeichneStatistik,
           zeichneHilfe: zeichneHilfe, zeichneChronik: zeichneChronik,
           testZeile: testZeile };
})();
