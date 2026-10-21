// Datei: ansicht-mri.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Das Fenster der MRI-Anmeldung ;;mri (18.26, vorher in der
//        Chrome-Erweiterung): oben die Formular-Kopie aus Axenita
//        (wird beim Öffnen aus der Zwischenablage gelesen; sonst mit
//        Strg+V einfügen), darunter kompakt Anrede (Herr/Frau, NIE
//        vorgewählt — ohne Wahl keine Mail), Empfänger (nur die
//        Adressen des erkannten Formulars), Nachname und Geburtsdatum.
//        Der Knopf öffnet eine fertig adressierte Outlook-Mail mit
//        Text und Signatur; das PDF zieht Näd hinein, GESENDET WIRD
//        VON HAND. Am Kürzel überall gleich: in der App direkt, am
//        Arbeitsplatz über den URL-Fenster-Weg (?fenster=mri).
//        Die Logik (Erkennung, Mail-Text) lebt in mri-anmeldung.js.
//        GRUNDSATZ: Nichts wird gespeichert — Fenster zu, alles weg.

"use strict";
window.TB = window.TB || {};

TB.mriTexte = {
  titel: "MRI-Anmeldung",
  hinweis: "In Axenita das ausgefüllte Anmelde-Formular markieren (Strg+A) und kopieren (Strg+C) — die Kopie unten wird automatisch gelesen. Erkannt werden Medizinisch Radiologisches Institut, RNR, Hirslanden und RIMED. Alles lässt sich von Hand korrigieren.",
  laden: "Zwischenablage neu einlesen",
  anrede: "Anrede",
  herr: "Herr",
  frau: "Frau",
  institut: "Empfänger",
  institutWahl: "(Empfänger wählen)",
  name: "Nachname",
  geb: "Geb.-Datum",
  oeffnen: "E-Mail in Outlook öffnen",
  erkannt: "Erkannt: %s",
  keinKreuz: "Kein angekreuzter Standort (☒) gefunden — bitte den Standort im Aufklappmenü wählen.",
  unbekannt: "Formular nicht erkannt — alle Empfänger stehen zur Wahl. Bitte melde mir das (Kopie aus dem grossen Feld), dann bringe ich der Maske dieses Formular bei.",
  keinEmpfaenger: "Bitte zuerst den Empfänger im Aufklappmenü wählen.",
  anredeFehlt: "Bitte zuerst Herr oder Frau wählen.",
  formularSagt: "Laut Formular: %s",
  anredeWiderspruch: "Achtung: Deine Wahl passt nicht zur Geschlechtsangabe im Formular (%s) — bitte prüfen.",
  nameFehlt: "Bitte den Nachnamen eintragen.",
  zwischenablageLeer: "Die Zwischenablage liess sich nicht lesen — bitte die Formular-Kopie mit Strg+V ins grosse Feld einfügen.",
  geoeffnet: "Outlook öffnet die fertige Mail samt Signatur. Das PDF (aus Axenita → E-Mail Versand) noch hineinziehen — gesendet wird von Hand.",
  schliessen: "Schliessen"
};

TB.ansichtMri = (function () {
  var T = function () { return TB.mriTexte; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };
  var R = function () { return TB.mriRein; };

  function zwischenablageText() {
    try {
      return navigator.clipboard.readText()
        .then(function (t) { return String(t || ""); })
        .catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  function oeffne(imFenster) {
    var d = el("dialog", "mri");
    d.appendChild(el("h2", "", T().titel));
    d.appendChild(el("div", "erklaerung", T().hinweis));

    var quelle = el("textarea", "mri-quelle");
    quelle.rows = 6;
    d.appendChild(quelle);

    var kLaden = el("button", "neben", T().laden);
    kLaden.type = "button";
    var ladenZeile = el("div", "mri-laden");
    ladenZeile.appendChild(kLaden);
    d.appendChild(ladenZeile);

    var erkannt = el("div", "mri-erkannt", "");
    d.appendChild(erkannt);

    // ---- Anrede: zwei Knöpfe, NICHTS vorgewählt ----------------------
    var anrede = ""; // "Herr" | "Frau" | ""
    var formularGeschlecht = "";
    var zAnrede = el("div", "mri-zeile");
    zAnrede.appendChild(el("label", "", T().anrede));
    var anredeBox = el("div", "mri-anrede");
    var kHerr = el("button", "neben", T().herr);
    var kFrau = el("button", "neben", T().frau);
    kHerr.type = "button"; kFrau.type = "button";
    anredeBox.appendChild(kHerr); anredeBox.appendChild(kFrau);
    zAnrede.appendChild(anredeBox);
    var formularHinweis = el("span", "mri-formular", "");
    zAnrede.appendChild(formularHinweis);
    d.appendChild(zAnrede);

    var zInstitut = el("div", "mri-zeile");
    zInstitut.appendChild(el("label", "", T().institut));
    var wahlInst = document.createElement("select");
    // Das Menü zeigt nur, was zum erkannten Formular passt (Näd 30.9.:
    // „die Auswahl immer einschränken auf die, die möglich sind"). Nur
    // ein unbekanntes Formular zeigt alle Empfänger.
    function fuelleMenue(anbieter, vorwahl) {
      wahlInst.textContent = "";
      if (!vorwahl) {
        var leer = document.createElement("option");
        leer.value = "0"; leer.textContent = T().institutWahl;
        wahlInst.appendChild(leer);
      }
      var gruppen = {};
      R().EMPFAENGER.forEach(function (x, i) {
        if (anbieter && x.anbieter !== anbieter) return;
        var ziel = wahlInst;
        if (!anbieter) {
          if (!gruppen[x.gruppe]) {
            gruppen[x.gruppe] = document.createElement("optgroup");
            gruppen[x.gruppe].label = x.gruppe;
            wahlInst.appendChild(gruppen[x.gruppe]);
          }
          ziel = gruppen[x.gruppe];
        }
        var o = document.createElement("option");
        o.value = String(i + 1); o.textContent = x.name + "  (" + x.mail + ")";
        ziel.appendChild(o);
      });
      wahlInst.value = String(vorwahl || 0);
    }
    fuelleMenue("", 0);
    zInstitut.appendChild(wahlInst);
    d.appendChild(zInstitut);

    var zName = el("div", "mri-zeile");
    zName.appendChild(el("label", "", T().name));
    var fName = document.createElement("input");
    fName.type = "text";
    zName.appendChild(fName);
    d.appendChild(zName);

    var zGeb = el("div", "mri-zeile");
    zGeb.appendChild(el("label", "", T().geb));
    var fGeb = document.createElement("input");
    fGeb.type = "text";
    zGeb.appendChild(fGeb);
    d.appendChild(zGeb);

    var hinweis = el("div", "mri-warn", "");
    d.appendChild(hinweis);
    var fussHinweis = el("div", "mri-erkannt", "");
    d.appendChild(fussHinweis);

    var zeile = el("div", "dialog-knoepfe");
    var kZu = el("button", "neben", T().schliessen);
    kZu.type = "button";
    var kOeffnen = el("button", "haupt", T().oeffnen);
    kOeffnen.type = "button";
    zeile.appendChild(kZu); zeile.appendChild(kOeffnen);
    d.appendChild(zeile);

    // Knopf-Zustand und Kontroll-Hinweis zur Anrede nachführen.
    function anredeZeichnen() {
      kHerr.className = "neben" + (anrede === "Herr" ? " aktiv" : "");
      kFrau.className = "neben" + (anrede === "Frau" ? " aktiv" : "");
      kHerr.textContent = (anrede === "Herr" ? "✓ " : "") + T().herr;
      kFrau.textContent = (anrede === "Frau" ? "✓ " : "") + T().frau;
      kOeffnen.disabled = !anrede;
      kOeffnen.title = anrede ? "" : T().anredeFehlt;
      var wort = formularGeschlecht === "Frau" ? "weiblich"
        : formularGeschlecht === "Herr" ? "männlich" : "";
      if (anrede && formularGeschlecht && anrede !== formularGeschlecht) {
        formularHinweis.textContent = T().anredeWiderspruch.replace("%s", wort);
        formularHinweis.className = "mri-formular mri-rot";
      } else {
        formularHinweis.textContent = wort ? T().formularSagt.replace("%s", wort) : "";
        formularHinweis.className = "mri-formular";
      }
    }
    kHerr.addEventListener("click", function () { anrede = "Herr"; hinweis.textContent = ""; anredeZeichnen(); });
    kFrau.addEventListener("click", function () { anrede = "Frau"; hinweis.textContent = ""; anredeZeichnen(); });

    // Jede neue Kopie ist ein neuer Patient: ALLES frisch aus der Kopie,
    // auch Empfänger und Anrede — nichts vom vorherigen bleibt stehen.
    function erkennen() {
      var erg = R().zerlege(quelle.value);
      fuelleMenue(erg.anbieter, erg.empfaenger);
      fName.value = erg.nachname;
      fGeb.value = erg.geb;
      formularGeschlecht = erg.geschlecht;
      anrede = "";
      anredeZeichnen();
      fussHinweis.textContent = "";
      erkannt.textContent = erg.anbieter
        ? T().erkannt.replace("%s", R().ANBIETER_NAME[erg.anbieter]) : "";
      if (!quelle.value.trim()) hinweis.textContent = "";
      else if (!erg.anbieter) hinweis.textContent = T().unbekannt;
      else if (erg.empfaenger) hinweis.textContent = "";
      else hinweis.textContent = T().keinKreuz;
    }

    quelle.addEventListener("input", erkennen);
    wahlInst.addEventListener("change", function () {
      if (wahlInst.value !== "0") hinweis.textContent = "";
    });
    kLaden.addEventListener("click", function () {
      zwischenablageText().then(function (t) {
        if (t === null) { hinweis.textContent = T().zwischenablageLeer; return; }
        quelle.value = t;
        erkennen();
      });
    });
    kOeffnen.addEventListener("click", function () {
      if (!anrede) { hinweis.textContent = T().anredeFehlt; return; }
      var nr = parseInt(wahlInst.value, 10) || 0;
      if (!nr) { hinweis.textContent = T().keinEmpfaenger; return; }
      var name = fName.value.trim();
      if (!name) { hinweis.textContent = T().nameFehlt; return; }
      var herr = anrede === "Herr";
      var url = R().mailtoUrl(R().mailAdresse(nr),
        R().betreff(anrede, name, fGeb.value),
        R().rumpf(herr ? "Herrn" : "Frau", name));
      TB.ansichtMri.letzteMail = url; // fürs Nachschauen im Prüflauf
      var a = document.createElement("a");
      a.href = url;
      document.body.appendChild(a);
      a.click();
      a.parentNode.removeChild(a);
      hinweis.textContent = "";
      fussHinweis.textContent = T().geoeffnet;
    });
    kZu.addEventListener("click", function () { d.close(); });
    d.addEventListener("close", function () {
      if (imFenster) { try { window.close(); } catch (e) { /* still */ } }
    });

    anredeZeichnen();
    TB.ui.dialogOeffnen(d);

    // Beim Öffnen die Zwischenablage lesen — klappt das nicht (der
    // Browser fragt um Erlaubnis oder verweigert ohne Klick), hilft
    // der Hinweis: einfach mit Strg+V ins grosse Feld einfügen.
    zwischenablageText().then(function (t) {
      if (t === null || !t.trim()) {
        if (t === null) hinweis.textContent = T().zwischenablageLeer;
        try { quelle.focus(); } catch (e) { /* still */ }
        return;
      }
      quelle.value = t;
      erkennen();
      try { quelle.focus(); } catch (e) { /* still */ }
    });
    return d;
  }

  return { oeffne: oeffne, letzteMail: "" };
})();
