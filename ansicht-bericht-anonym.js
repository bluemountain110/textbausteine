// Datei: ansicht-bericht-anonym.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Das Fenster des Bericht-Anonymisierers ;;anon (18.10): EIN
//        Feld für Bericht + Zusatzuntersuchungen (auch PDF/Word
//        hineinziehen), Angaben von Hand (Name, Geburtsdatum oder Alter,
//        männlich/weiblich, Fragestellung), rechts die anonyme Fassung.
//        Ein Klick auf ein Wort der Fassung schwärzt es überall; ein
//        Klick auf einen erkannten Arzt-/Personennamen nimmt ihn zurück.
//        Darunter zur Kontrolle, was ganz entfernt wurde (nur hier
//        sichtbar, nie in der Ausgabe). Kopieren oder als Textdatei
//        sichern. GRUNDSATZ: Nichts hiervon wird gespeichert oder
//        abgeglichen — Fenster zu, alles weg.

"use strict";
window.TB = window.TB || {};

TB.berichtAnonymTexte = {
  titel: "Bericht anonymisieren",
  erklaerung: "Bericht UND Zusatzuntersuchungen (MRI, Labor, EEG …) untereinander in das linke Feld einfügen — oder PDF/Word hineinziehen. Rechts entsteht EIN anonymer Text für Claude oder OpenEvidence: Name, Geburtsdatum, Adressen, Telefon, Briefkopf, Anrede, Unterschrift und alle Arzt- und Angehörigen-Namen verschwinden; Alter, Geschlecht, Untersuchungsdaten und Institute bleiben; „Spital Limmattal“ wird „Untersuchungsspital“. Nichts wird gespeichert.",
  name: "Name (falls nicht erkannt)",
  namePlatz: "Vorname Nachname",
  geburt: "Geburtsdatum oder Alter",
  geburtPlatz: "TT.MM.JJJJ oder z. B. 72",
  frage: "Fragestellung (optional, steht oben im Text)",
  fragePlatz: "z. B. Differentialdiagnose? Nächste Schritte?",
  maennlich: "männlich",
  weiblich: "weiblich",
  einfuegen: "Hier Bericht + Zusatzuntersuchungen einfügen (Strg+V) — oder PDF/Word hineinziehen",
  vorschauTitel: "Anonyme Fassung — Klick auf ein Wort schwärzt es überall",
  vorschauLeer: "Noch nichts eingefügt.",
  erkannt: "Erkannt: %s",
  erkanntNichts: "Noch kein Patient erkannt.",
  zusatzTitel: "Zusätzlich geschwärzt (Klick = zurücknehmen):",
  namenTitel: "Als Arzt/Person ersetzt (Klick = doch stehen lassen):",
  kontrolle: "Entfernte Zeilen (%s) — nur hier sichtbar, nie in der Ausgabe",
  kopieren: "Kopieren",
  kopiert: "Anonymer Text kopiert — in Claude oder OpenEvidence einfügen.",
  kopierenFehl: "Kopieren fehlgeschlagen.",
  sichern: "Als Textdatei sichern",
  gesichert: "Gesichert als %s (im Download-Ordner).",
  leeren: "Leeren",
  schliessen: "Schliessen",
  leer: "Zuerst den Bericht einfügen.",
  liest: "Datei wird gelesen …",
  leseFehler: "Datei nicht lesbar: %s"
};

TB.ansichtBerichtAnonym = (function () {
  var T = function () { return TB.berichtAnonymTexte; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };

  function feldZeile(beschriftung, eingabe) {
    var l = el("label", "anon-feld");
    l.appendChild(el("span", "", beschriftung));
    l.appendChild(eingabe);
    return l;
  }

  function oeffne(imFenster) {
    var zustand = { geschlecht: "", zusatz: [], behalten: [] };
    var ergebnis = null, takt = null;

    var d = el("dialog", "anon");
    d.appendChild(el("h2", "", T().titel));
    d.appendChild(el("div", "erklaerung", T().erklaerung));

    // Angaben von Hand
    var angaben = el("div", "anon-angaben");
    var nameFeld = el("input"); nameFeld.type = "text";
    nameFeld.placeholder = T().namePlatz; nameFeld.autocomplete = "off";
    var geburtFeld = el("input"); geburtFeld.type = "text";
    geburtFeld.placeholder = T().geburtPlatz; geburtFeld.autocomplete = "off";
    angaben.appendChild(feldZeile(T().name, nameFeld));
    angaben.appendChild(feldZeile(T().geburt, geburtFeld));
    var gWahl = el("div", "anon-geschlecht");
    var gM = el("button", "neben", T().maennlich);
    var gW = el("button", "neben", T().weiblich);
    [[gM, "männlich"], [gW, "weiblich"]].forEach(function (p) {
      p[0].type = "button";
      p[0].addEventListener("click", function () {
        zustand.geschlecht = zustand.geschlecht === p[1] ? "" : p[1];
        neu();
      });
      gWahl.appendChild(p[0]);
    });
    angaben.appendChild(gWahl);
    d.appendChild(angaben);
    var frageFeld = el("input"); frageFeld.type = "text";
    frageFeld.placeholder = T().fragePlatz; frageFeld.autocomplete = "off";
    d.appendChild(feldZeile(T().frage, frageFeld));

    var erkanntZeile = el("div", "anon-erkannt", "");
    d.appendChild(erkanntZeile);
    var warnBox = el("div", "anon-warnung");
    warnBox.hidden = true;
    d.appendChild(warnBox);

    // Die zwei Spalten
    var spalten = el("div", "anon-spalten");
    var links = el("div", "anon-links");
    var eingabe = el("textarea", "anon-eingabe");
    eingabe.placeholder = T().einfuegen;
    eingabe.spellcheck = false;
    links.appendChild(eingabe);
    var rechts = el("div", "anon-rechts");
    rechts.appendChild(el("div", "anon-spalten-titel", T().vorschauTitel));
    var vorschau = el("div", "anon-vorschau");
    rechts.appendChild(vorschau);
    spalten.appendChild(links); spalten.appendChild(rechts);
    d.appendChild(spalten);

    var zusatzZeile = el("div", "anon-chips");
    var namenZeile = el("div", "anon-chips");
    d.appendChild(zusatzZeile); d.appendChild(namenZeile);
    var kontrolle = el("details", "anon-kontrolle");
    var kSumme = el("summary", "", "");
    var kListe = el("div", "anon-kontrolle-liste");
    kontrolle.appendChild(kSumme); kontrolle.appendChild(kListe);
    d.appendChild(kontrolle);

    function neu() {
      gM.classList.toggle("aktiv", zustand.geschlecht === "männlich");
      gW.classList.toggle("aktiv", zustand.geschlecht === "weiblich");
      clearTimeout(takt);
      takt = setTimeout(rechne, 200);
    }

    function rechne() {
      var roh = eingabe.value;
      if (!roh.trim()) {
        ergebnis = null;
        vorschau.textContent = T().vorschauLeer;
        vorschau.classList.add("anon-leer");
        erkanntZeile.textContent = "";
        warnBox.hidden = true;
        zusatzZeile.textContent = ""; namenZeile.textContent = "";
        kontrolle.hidden = true;
        return;
      }
      ergebnis = TB.berichtAnonym.anonymisiere(roh, {
        name: nameFeld.value, geburt: geburtFeld.value,
        geschlecht: zustand.geschlecht, fragestellung: frageFeld.value,
        zusatz: zustand.zusatz, behalten: zustand.behalten });
      zeichneVorschau(ergebnis.text);
      var e = ergebnis.erkannt, teile = [];
      if (e.name.length) teile.push(e.name.join(" "));
      if (e.geburt) teile.push("geb. " + e.geburt);
      if (ergebnis.alter !== null) teile.push(ergebnis.alter + " Jahre");
      if (ergebnis.geschlecht) teile.push(ergebnis.geschlecht);
      erkanntZeile.textContent = teile.length
        ? T().erkannt.replace("%s", teile.join(" · ")) : T().erkanntNichts;
      warnBox.textContent = ergebnis.warnungen.join(" ");
      warnBox.hidden = !ergebnis.warnungen.length;
      zeichneChips();
      var weg = ergebnis.protokoll.filter(function (p) { return p.art !== "ersetzt"; });
      kontrolle.hidden = !weg.length;
      kSumme.textContent = T().kontrolle.replace("%s", weg.length);
      kListe.textContent = "";
      weg.forEach(function (p) {
        var z = el("div", "anon-kontrolle-zeile");
        z.appendChild(el("span", "anon-kontrolle-art", p.art));
        z.appendChild(el("span", "", p.text));
        kListe.appendChild(z);
      });
    }

    function zeichneVorschau(text) {
      vorschau.textContent = "";
      vorschau.classList.remove("anon-leer");
      var re = /(\[[^\]\n]+\]|[A-Za-zÄÖÜäöüßéèêàâçëïîôûñ][A-Za-zÄÖÜäöüßéèêàâçëïîôûñ'’-]*)/g;
      var pos = 0, m;
      var frag = document.createDocumentFragment();
      while ((m = re.exec(text))) {
        if (m.index > pos) frag.appendChild(document.createTextNode(text.slice(pos, m.index)));
        var w = m[0];
        if (w.charAt(0) === "[") {
          frag.appendChild(el("span", "anon-platz", w));
        } else if (w.length >= 2) {
          var s = el("span", "anon-wort", w);
          s.addEventListener("click", function (ev) {
            var wort = ev.target.textContent;
            if (zustand.zusatz.indexOf(wort) === -1) zustand.zusatz.push(wort);
            neu();
          });
          frag.appendChild(s);
        } else {
          frag.appendChild(document.createTextNode(w));
        }
        pos = m.index + w.length;
      }
      if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
      vorschau.appendChild(frag);
    }

    function chip(text, klasse, klick) {
      var c = el("button", "anon-chip " + (klasse || ""), text);
      c.type = "button";
      c.addEventListener("click", klick);
      return c;
    }
    function zeichneChips() {
      zusatzZeile.textContent = "";
      if (zustand.zusatz.length) {
        zusatzZeile.appendChild(el("span", "anon-chips-titel", T().zusatzTitel));
        zustand.zusatz.forEach(function (w) {
          zusatzZeile.appendChild(chip(w + " ×", "", function () {
            zustand.zusatz = zustand.zusatz.filter(function (x) { return x !== w; });
            neu();
          }));
        });
      }
      namenZeile.textContent = "";
      var namen = (ergebnis.namenArzt || []).concat(ergebnis.namenWeitere || []);
      if (namen.length) {
        namenZeile.appendChild(el("span", "anon-chips-titel", T().namenTitel));
        namen.forEach(function (w) {
          var behalten = zustand.behalten.indexOf(w) !== -1;
          namenZeile.appendChild(chip(w, behalten ? "anon-chip-behalten" : "", function () {
            if (behalten) zustand.behalten = zustand.behalten.filter(function (x) { return x !== w; });
            else zustand.behalten.push(w);
            neu();
          }));
        });
      }
    }

    // PDF/Word ins Feld ziehen → Text wird angehängt
    eingabe.addEventListener("dragover", function (ev) {
      if (ev.dataTransfer && ev.dataTransfer.types &&
          Array.prototype.indexOf.call(ev.dataTransfer.types, "Files") !== -1) {
        ev.preventDefault(); eingabe.classList.add("anon-drop-aktiv");
      }
    });
    eingabe.addEventListener("dragleave", function () {
      eingabe.classList.remove("anon-drop-aktiv"); });
    eingabe.addEventListener("drop", function (ev) {
      var dateien = ev.dataTransfer && ev.dataTransfer.files;
      if (!dateien || !dateien.length) return;
      ev.preventDefault(); eingabe.classList.remove("anon-drop-aktiv");
      Array.prototype.forEach.call(dateien, function (datei) {
        TB.ui.melde(T().liest);
        TB.enmgLeser.leseText(datei).then(function (text) {
          eingabe.value = (eingabe.value.trim() ? eingabe.value.replace(/\s+$/, "") + "\n\n" : "") + text;
          neu();
        }, function (fehler) {
          TB.ui.melde(T().leseFehler.replace("%s",
            (fehler && fehler.message) || "unbekannter Fehler"), true);
        });
      });
    });
    [eingabe, nameFeld, geburtFeld, frageFeld].forEach(function (f) {
      f.addEventListener("input", neu); });

    // Knöpfe
    var zeile = el("div", "dialog-knoepfe");
    var zu = el("button", "neben", T().schliessen);
    zu.addEventListener("click", function () { d.close(); });
    var leeren = el("button", "leise", T().leeren);
    leeren.addEventListener("click", function () {
      eingabe.value = ""; nameFeld.value = ""; geburtFeld.value = "";
      frageFeld.value = "";
      zustand = { geschlecht: "", zusatz: [], behalten: [] };
      neu(); eingabe.focus();
    });
    function aktuell() {
      clearTimeout(takt); rechne();
      if (!ergebnis) { TB.ui.melde(T().leer, true); return null; }
      return ergebnis.text;
    }
    var sichern = el("button", "neben", T().sichern);
    sichern.addEventListener("click", function () {
      var inhalt = aktuell();
      if (!inhalt) return;
      var blob = new Blob([inhalt], { type: "text/plain;charset=utf-8" });
      var a = el("a");
      a.href = URL.createObjectURL(blob);
      a.download = TB.berichtAnonym.dateiname();
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      TB.speicher.zaehleFunktion("berichtAnonym");
      TB.ui.melde(T().gesichert.replace("%s", a.download));
    });
    var kopieren = el("button", "haupt", T().kopieren);
    kopieren.addEventListener("click", function () {
      var inhalt = aktuell();
      if (!inhalt) return;
      TB.ui.kopiereText(inhalt, function (ok) {
        if (ok) TB.speicher.zaehleFunktion("berichtAnonym");
        TB.ui.melde(ok ? T().kopiert : T().kopierenFehl, !ok);
      });
    });
    zeile.appendChild(zu); zeile.appendChild(leeren);
    zeile.appendChild(sichern); zeile.appendChild(kopieren);
    d.appendChild(zeile);

    // Fenster zu = alles weg. Im eigenen Browser-Fenster (;;anon aus
    // KISIM) schliesst „Schliessen" das ganze Fenster.
    d.addEventListener("close", function () {
      eingabe.value = ""; ergebnis = null;
      if (imFenster) { try { window.close(); } catch (e) { /* still */ } }
    });

    rechne();
    TB.ui.dialogOeffnen(d);
    try { eingabe.focus(); } catch (e) { /* still */ }
    return d;
  }

  return { oeffne: oeffne };
})();
