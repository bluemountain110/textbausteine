// Datei: ansicht-kisunla.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die beiden Kisunla-Fenster der Sammelrunde 18.2:
//        1. ;;kisew — die Einwilligung als DRUCKSEITE: Limmi-Briefkopf
//           (Signet, Adresse, Team, „Schlieren, <heute>"), eine
//           Eingabezeile Vorname/Name/Geburtsdatum und der
//           Einwilligungstext aus dem Baustein ;;kisew (einzige
//           Quelle); gedruckt wird über den Browser-Druckdialog
//           (dort auch „als PDF sichern").
//        2. ;;kisbest — die MediService-Bestellung: Stammblatt
//           einfügen → Patient GROSS zur Kontrolle, Formularwerte
//           nachbearbeitbar, feste Angaben (Tel/ZSR/E-Mail) gepflegt
//           in der App; ein Knopf füllt das echte Formular
//           (medi-rezept.pdf) und öffnet den Druck, ein zweiter die
//           fertig adressierte Mail — nach der unübersehbaren
//           KoGu-Erinnerung.
//        GRUNDSATZ: Patientendaten leben nur in diesem Fenster.

"use strict";
window.TB = window.TB || {};

TB.ansichtKisunla = (function () {
  var el = function (a, b, c) { return TB.ui.el(a, b, c); };
  function T() { return TB.T; }
  function K() { return TB.kisunla; }

  // ---- 1. Die Einwilligungs-Druckseite ---------------------------------
  function oeffneEinwilligung() {
    var b = TB.speicher.holenPerKuerzel("kisew");
    if (!b) { TB.ui.melde(T().kisewFehlt, true); return; }
    var alt = document.getElementById("kisew-seite");
    if (alt) alt.remove();

    var BK = K().BRIEFKOPF;
    var seite = el("div"); seite.id = "kisew-seite";
    var kopf = el("div", "kisew-kopf");
    var logo = el("img"); logo.src = BK.logo; logo.alt = "Spital Limmattal";
    logo.className = "kisew-logo";
    var rechts = el("div", "kisew-kopf-rechts");
    BK.adresse.forEach(function (z) { rechts.appendChild(el("div", "", z)); });
    rechts.appendChild(el("div", "kisew-team-titel", BK.teamTitel));
    BK.team.forEach(function (z) { rechts.appendChild(el("div", "", z)); });
    BK.kontakt.forEach(function (z) {
      rechts.appendChild(el("div", "kisew-kontakt", z)); });
    kopf.appendChild(logo); kopf.appendChild(rechts);
    seite.appendChild(kopf);
    seite.appendChild(el("div", "kisew-ort", BK.ortszeile()));

    var zeile = el("div", "kisew-patient");
    [["Vorname", "kisew-vorname"], ["Name", "kisew-name"],
     ["Geburtsdatum", "kisew-geb"]].forEach(function (p) {
      var teil = el("span", "kisew-feld");
      teil.appendChild(el("span", "", p[0] + ": "));
      var e = el("input"); e.type = "text"; e.id = p[1];
      teil.appendChild(e);
      zeile.appendChild(teil);
    });
    seite.appendChild(zeile);

    var inhalt = el("div", "kisew-text");
    inhalt.innerHTML = b.text || "";
    seite.appendChild(inhalt);

    var knoepfe = el("div", "kisew-knoepfe nur-bildschirm");
    var drucken = el("button", "haupt", T().kisewDrucken);
    drucken.addEventListener("click", function () {
      TB.speicher.zaehleFunktion("kisewDruck");
      window.print();
    });
    var zu = el("button", "neben", T().kisewSchliessen);
    zu.addEventListener("click", function () {
      document.body.classList.remove("kisew-druck");
      seite.remove();
    });
    knoepfe.appendChild(drucken); knoepfe.appendChild(zu);
    seite.appendChild(knoepfe);

    document.body.appendChild(seite);
    document.body.classList.add("kisew-druck");
    try { seite.scrollIntoView(); } catch (e) { /* Testlauf ohne Browser */ }
  }

  // ---- 2. Das Bestell-Fenster ------------------------------------------
  function oeffneBestellung() {
    var d = el("dialog", "kisbest");
    d.appendChild(el("h2", "", T().kisbestTitel));

    d.appendChild(el("label", "", T().kisbestEinfuegen));
    var quelle = el("textarea", "kisbest-quelle"); quelle.rows = 4;
    d.appendChild(quelle);

    var patient = el("div", "kisbest-patient", "—");
    d.appendChild(patient);

    var raster = el("div", "kisbest-raster");
    d.appendChild(raster);
    var eingaben = {};
    function feldzeile(ziel, beschriftung, schluessel, wert2) {
      var z = el("label", "kisbest-feld");
      z.appendChild(el("span", "", beschriftung));
      var e = el("input"); e.type = "text"; e.value = wert2 || "";
      z.appendChild(e); ziel.appendChild(z);
      eingaben[schluessel] = e;
      return e;
    }

    d.appendChild(el("label", "", T().kisbestFeste));
    var fest = el("div", "kisbest-raster");
    d.appendChild(fest);
    var f0 = K().festeAngaben();
    feldzeile(fest, "Tel.", "Tel", f0.tel);
    feldzeile(fest, "ZSR", "ZSR", f0.zsr);
    feldzeile(fest, "E-Mail", "EMail", f0.email);
    function festSichern() {
      K().setzeFesteAngaben({ tel: eingaben.Tel.value,
        zsr: eingaben.ZSR.value, email: eingaben.EMail.value });
    }
    ["Tel", "ZSR", "EMail"].forEach(function (k) {
      eingaben[k].addEventListener("change", festSichern); });

    d.appendChild(el("div", "kisbest-erinnerung", T().kisbestErinnerung));
    var hinweis = el("div", "erklaerung", "");
    d.appendChild(hinweis);

    var sb = null;
    function neuLesen() {
      sb = K().stammblattLesen(quelle.value);
      var p = sb.patient;
      patient.textContent = sb.vollstaendig
        ? (p.vorname + " " + p.name + " · geb. " + p.geburtsdatum)
        : "—";
      raster.textContent = "";
      var w = K().formularWerte(sb, {});
      [["Strasse/Nr.", "StrasseNr_2"], ["PLZ/Ort", "PLZOrt_2"],
       ["Tel. Patient", "Tel_2"], ["Krankenkasse", "Krankenkasse"],
       ["Vers.-Nr.", "VersNr"], ["Dosierung", "DosierungRow1"],
       ["Anzahl OP", "Anzahl OPRow1"]].forEach(function (p2) {
        feldzeile(raster, p2[0], p2[1], w[p2[1]]);
      });
    }
    quelle.addEventListener("input", neuLesen);
    neuLesen();

    function werteJetzt() {
      var w = K().formularWerte(sb, {
        dosierung: eingaben.DosierungRow1.value,
        anzahl: eingaben["Anzahl OPRow1"].value });
      ["StrasseNr_2", "PLZOrt_2", "Tel_2", "Krankenkasse", "VersNr",
       "Tel", "ZSR", "EMail"].forEach(function (k) {
        if (eingaben[k]) w[k] = eingaben[k].value;
      });
      return w;
    }

    var knoepfe = el("div", "dialog-knoepfe");
    var formular = el("button", "haupt", T().kisbestFormular);
    formular.addEventListener("click", function () {
      if (!sb || !sb.vollstaendig) { hinweis.textContent = T().kisbestLeer; return; }
      festSichern();
      fetch("medi-rezept.pdf").then(function (a) {
        if (!a.ok) throw new Error("laden");
        return a.arrayBuffer();
      }).then(function (puffer) {
        var erg = TB.pdfFormular.fuelle(new Uint8Array(puffer), werteJetzt());
        var blob = new Blob([erg.bytes], { type: "application/pdf" });
        var url = URL.createObjectURL(blob);
        TB.speicher.zaehleFunktion("kisbestFormular");
        var fenster = window.open(url, "_blank");
        hinweis.textContent = T().kisbestHinweisDruck;
        if (fenster) {
          setTimeout(function () {
            try { fenster.print(); } catch (e) { /* Hinweis steht */ }
          }, 1200);
        }
        // Zusätzlich als Datei anbieten (für „nur sichern").
        var a2 = el("a", "kisbest-datei",
          "Als Datei sichern: " + K().dateiname(sb));
        a2.href = url; a2.download = K().dateiname(sb);
        var altA = d.querySelector(".kisbest-datei");
        if (altA) altA.remove();
        d.insertBefore(a2, knoepfe);
      }).catch(function () {
        hinweis.textContent = T().kisbestVorlageFehlt;
      });
    });
    var mail = el("button", "haupt", T().kisbestMail);
    mail.addEventListener("click", function () {
      if (!sb || !sb.vollstaendig) { hinweis.textContent = T().kisbestLeer; return; }
      var frage = el("dialog", "kisbest-frage");
      frage.appendChild(el("div", "kisbest-erinnerung", T().kisbestErinnerung));
      var ok = el("button", "haupt", T().kisbestMailJetzt);
      ok.addEventListener("click", function () {
        frage.close(); frage.remove();
        TB.speicher.zaehleFunktion("kisbestMail");
        location.href = K().mailAdresse(sb);
      });
      var nein = el("button", "neben", T().abbrechen);
      nein.addEventListener("click", function () { frage.close(); frage.remove(); });
      var kz = el("div", "dialog-knoepfe");
      kz.appendChild(nein); kz.appendChild(ok);
      frage.appendChild(kz);
      TB.ui.dialogOeffnen(frage);
    });
    var zu = el("button", "neben", T().abbrechen);
    zu.addEventListener("click", function () { d.close(); });
    knoepfe.appendChild(zu); knoepfe.appendChild(formular);
    knoepfe.appendChild(mail);
    d.appendChild(knoepfe);
    TB.ui.dialogOeffnen(d);
    setTimeout(function () { quelle.focus(); }, 0);
  }

  return { oeffneEinwilligung: oeffneEinwilligung,
           oeffneBestellung: oeffneBestellung };
})();
