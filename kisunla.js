// Datei: kisunla.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Das Herz der Kisunla-Werkzeuge (Etappe 13, Sammelrunde 18.2):
//        1. Der Stammblatt-Leser: liest das Ergebnis von Näds
//           KISIM-Stammblatt-Baustein (beschriftete Zeilen je
//           Abschnitt) und liefert die Patienten- und Garantenwerte;
//           nicht gefüllte KISIM-Makros (@<…>) zählen als leer.
//        2. Die Werte fürs MediService-Bestellformular samt festen
//           Angaben (Tel/ZSR/E-Mail — Einstellung, die Näd EINMAL in
//           der App pflegt und die nie im Chat landet), Mail-Adresse,
//           Betreff und Mail-Text der Bestellung.
//        3. Der einmalige Baustein-Umbau 18.1 → 18.2 (männlich/
//           weiblich-Dauerregel) und das Anlegen von ;;kisbest.
//        GRUNDSATZ: Stammblatt-Text und gefülltes Formular leben nur
//        im Fenster — nie gespeichert, nie abgeglichen.

"use strict";
window.TB = window.TB || {};

TB.kisunla = (function () {

  // ---- Stammblatt lesen ------------------------------------------------
  var ABSCHNITTE = ["Patient", "Fall", "Beruf", "Angehörige 1",
    "Angehörige 2", "Hausarzt", "Behandelnder Arzt", "Einweisender Arzt",
    "Garant 1", "Garant 2"];

  function wert(roh) {
    var w = String(roh || "").trim();
    if (/^@<[^>]*>$/.test(w)) return "";   // nicht gefülltes KISIM-Makro
    return w;
  }

  function stammblattLesen(text) {
    var abschnitt = "";
    var p = {}, fall = {}, garant1 = {};
    String(text || "").split(/\r?\n/).forEach(function (zeile) {
      var z = zeile.trim();
      if (ABSCHNITTE.indexOf(z) !== -1) { abschnitt = z; return; }
      var m = /^([A-Za-zÄÖÜäöüé .\/-]+?)\s*:\s*(.*)$/.exec(z);
      if (!m) return;
      var k = m[1].trim(), v = wert(m[2]);
      if (abschnitt === "Patient" || abschnitt === "") {
        if (k === "Name") p.name = p.name || v;
        else if (k === "Vorname") p.vorname = p.vorname || v;
        else if (k === "Adresse") p.strasse = v;
        else if (k === "Plz" || k === "PLZ") p.plz = v;
        else if (k === "Ort") p.ort = v;
        else if (k === "Geschlecht") p.geschlecht = v;
        else if (k === "Geburtsdatum") p.geburtsdatum = v;
        else if (k === "Telefon") p.telefon = v;
        else if (k === "Mobil") p.mobil = v;
        else if (k === "Sprache") p.sprache = v;
      } else if (abschnitt === "Fall") {
        if (k === "Fallnummer") fall.fallnummer = v;
        else if (k === "Patientennummer") fall.patientennummer = v;
      } else if (abschnitt === "Garant 1") {
        if (k === "Name") garant1.name = v;
        else if (k === "Policenummer") garant1.policennummer = v;
        else if (k === "VeKa-Nr.") garant1.vekaNr = v;
      }
    });
    var vollstaendig = !!(p.vorname && p.name && p.geburtsdatum);
    return { patient: p, fall: fall, garant1: garant1,
             vollstaendig: vollstaendig };
  }

  // ---- Feste Angaben (einmal in der App gepflegt, synct als
  // Einstellung zwischen Näds Geräten — nie Patientendaten) -------------
  function festeAngaben() {
    var f = TB.speicher.einstellung("kisunlaFesteAngaben", null);
    return (f && typeof f === "object")
      ? f : { tel: "", zsr: "", email: "" };
  }
  function setzeFesteAngaben(f) {
    TB.speicher.setzeEinstellung("kisunlaFesteAngaben", {
      tel: String(f.tel || "").trim(),
      zsr: String(f.zsr || "").trim(),
      email: String(f.email || "").trim()
    });
  }

  function heute() {
    return TB.makros.formatiereDatum(new Date(), "TT.MM.JJJJ");
  }

  // ---- Werte fürs MediService-Formular ---------------------------------
  // extra: { dosierung, anzahl } aus den Fenster-Feldern.
  function formularWerte(sb, extra) {
    var p = sb.patient, fest = festeAngaben();
    var e = extra || {};
    return {
      "Tel": fest.tel, "ZSR": fest.zsr, "EMail": fest.email,
      "Vorname Name_2": ((p.vorname || "") + " " + (p.name || "")).trim(),
      "Tel_2": p.telefon || p.mobil || "",
      "StrasseNr_2": p.strasse || "",
      "PLZOrt_2": ((p.plz || "") + " " + (p.ort || "")).trim(),
      "Krankenkasse": sb.garant1.name || "",
      "Geburtsdatum": p.geburtsdatum || "",
      "VersNr": sb.garant1.vekaNr || sb.garant1.policennummer || "",
      "DosierungRow1": e.dosierung || "350 mg",
      "Anzahl OPRow1": e.anzahl || "3",
      "Unterschrift des Arztes": heute()
    };
  }

  function dateiname(sb) {
    var p = sb.patient;
    return "Medi Service - " + (p.vorname || "Vorname") + " " +
      (p.name || "Nachname") + " " + (p.geburtsdatum || "Geburtsdatum") +
      ".pdf";
  }

  // ---- Die Bestell-Mail -------------------------------------------------
  var MAIL_AN = "pharmacare@mediservice.ch";
  var MAIL_CC = "Apotheke@spital-limmattal.ch,FND@spital-limmattal.ch";
  var MAIL_TEXT = "Sehr geehrte Damen und Herren\n\n" +
    "Gerne möchte ich die im PDF angehängte Donanemab Bestellung bei " +
    "Ihnen tätigen.\n\n" +
    "Ich bitte Sie, das Medikament an unsere Spital Apotheke zu senden " +
    "und mich zu informieren, wenn das Medikament versendet wurde. " +
    "Vielen Dank!\n\n\n" +
    "Freundliche Grüsse\nNadir Tissira\n\n\n" +
    "Dr. med. Nadir Tissira\nOberarzt Neurologie\n\n" +
    "Spital Limmattal\nUrdorferstrasse 100, CH-8952 Schlieren\n" +
    "Telefon Sekretariat: +41 44 733 25 51\n" +
    "Telefon Zentrale: +41 44 733 11 11\n" +
    "Fax: +41 44 733 25 53\nneurologie@spital-limmattal.ch";

  function betreff(sb) {
    var p = sb.patient;
    return "Bestellung Donanemab - " + (p.vorname || "") + " " +
      (p.name || "") + ", " + (p.geburtsdatum || "");
  }
  function mailAdresse(sb) {
    return "mailto:" + MAIL_AN +
      "?cc=" + encodeURIComponent(MAIL_CC) +
      "&subject=" + encodeURIComponent(betreff(sb)) +
      "&body=" + encodeURIComponent(MAIL_TEXT.replace(/\n/g, "\r\n"));
  }

  // ---- Briefkopf der Memory Clinic (für die Einwilligungs-Druckseite) --
  var BRIEFKOPF = {
    logo: "logo-limmi.png",
    adresse: ["Spital Limmattal", "Urdorferstrasse 100", "CH-8952 Schlieren"],
    teamTitel: "Memory Clinic / Kognitive Neurologie",
    team: [
      "Dr. med. Georg Egli, Leiter Memory Clinic",
      "Dr. med. Nadir Tissira, Stv. Leiter Memory Clinic",
      "lic. phil. Béatrice Brunner, Neuropsychologin",
      "M.Sc. Maria José Jann, Neuropsychologin",
      "M.Sc. Laura Rinke, Neuropsychologin",
      "lic. phil. Regula Thöni, Neuropsychologin",
      "M.Sc. Emanuela Vulpiani, Neuropsychologin",
      "Jeannette Schläpfer, Sozialarbeiterin FH",
      "lic. phil. Rahel Weisshaupt Konsiliarneuropsychologin"
    ],
    kontakt: ["Sekretariat Tel.: +41 44 733 25 51",
              "neurologie@spital-limmattal.ch"],
    ortszeile: function () { return "Schlieren, " + heute(); }
  };

  // ---- Einmalige Umbauten (wie berZweiZeilen, Lehre-Muster) ------------
  // 18.2: männlich/weiblich-Texte + ;;kisbest anlegen.
  // 18.3/18.4: ;;dxkis heisst neu ;;dxad (Kürzel wird IMMER umgehängt);
  //       die Titelzeile beginnt mit „Morbus Alzheimer" und trägt EM
  //       und ED (Text NUR gehoben, wenn er wörtlich EINER
  //       Lieferfassung entspricht — eigene Fassung bleibt).
  // 18.4: Aufräumen — Kopien, die „Beide behalten" aus den
  //       Umbau-Scheinkonflikten vom 11.10. gemacht hat (Titel endet
  //       auf „(zweite Fassung)", kein Kürzel, Text wörtlich ein
  //       Lieferstand), wandern in den Papierkorb.
  function umbau182() {
    if (!TB.kisunlaUmbau) return 0;
    var S = TB.speicher, getan = 0;
    var liefertexte = [];
    Object.keys(TB.kisunlaUmbau.texte).forEach(function (k) {
      var paar = TB.kisunlaUmbau.texte[k];
      liefertexte.push(paar.alt, paar.neu);
      var b = S.holenPerKuerzel(k);
      if (!b) return;
      if (b.text === paar.neu) return;
      if (b.text !== paar.alt) return;   // Näds eigene Fassung bleibt
      S.speichern({ id: b.id, text: paar.neu });
      getan += 1;
    });
    if (!S.holenPerKuerzel("kisbest")) {
      var v = TB.kisunlaUmbau.kisbest;
      if (!S.holen(v.id)) { S.speichern(v); getan += 1; }
    }
    // 18.7: weitere neue Lieferbausteine (z. B. ;;txirr) — nur anlegen,
    // wenn weder Kürzel noch Kennung schon da sind (auch nicht im
    // Papierkorb: was Näd gelöscht hat, bleibt gelöscht).
    (TB.kisunlaUmbau.neu || []).forEach(function (nb) {
      if (S.holenPerKuerzel(nb.kuerzel) || S.holen(nb.id)) return;
      S.speichern(nb); getan += 1;
    });
    liefertexte.push(TB.kisunlaUmbau.kisbest.text);
    var d = TB.kisunlaUmbau.dxad;
    if (d) {
      liefertexte = liefertexte.concat(d.alte, [d.neu]);
      var bd = S.holenPerKuerzel(d.altKuerzel) || S.holenPerKuerzel(d.kuerzel);
      if (bd) {
        var aend = { id: bd.id }, tun = false;
        if (bd.kuerzel === d.altKuerzel) { aend.kuerzel = d.kuerzel; tun = true; }
        if (d.alte.indexOf(bd.text) !== -1 && bd.text !== d.neu) {
          aend.text = d.neu; aend.notiz = d.notiz; tun = true;
        }
        if (tun) { S.speichern(aend); getan += 1; }
      }
    }
    // 18.5: die VOLLSTÄNDIGE Liefertext-Liste aus den Umbau-Daten
    // (erfasst auch kisew, kismri … — in 18.4 blieb die kisew-Kopie
    // stehen, weil nur die Umbau-Texte auf der Liste standen).
    (TB.kisunlaUmbau.liefertexte || []).forEach(function (t) {
      if (liefertexte.indexOf(t) === -1) liefertexte.push(t);
    });
    S.alle().slice().forEach(function (b) {
      if (b.kuerzel) return;
      if (!/\(zweite Fassung\)$/.test(String(b.titel || ""))) return;
      if (liefertexte.indexOf(b.text) === -1) return;
      S.inPapierkorb(b.id);
      getan += 1;
    });
    return getan;
  }

  // Sonderstart beim Benutzen: kisew und kisbest öffnen ihre Fenster
  // statt zu kopieren (Kürzel-zuerst: dieselben Kürzel wirken am
  // Arbeitsplatz über den URL-Fenster-Weg).
  function sonderStart(b) {
    var k = String(b && b.kuerzel || "").toLowerCase();
    if (k === "kisew") { TB.ansichtKisunla.oeffneEinwilligung(); return true; }
    if (k === "kisbest") { TB.ansichtKisunla.oeffneBestellung(); return true; }
    // 18.10: ;;anon öffnet den Bericht-Anonymisierer
    if (k === "anon") { TB.ansichtBerichtAnonym.oeffne(); return true; }
    return false;
  }

  return { stammblattLesen: stammblattLesen,
           festeAngaben: festeAngaben, setzeFesteAngaben: setzeFesteAngaben,
           formularWerte: formularWerte, dateiname: dateiname,
           betreff: betreff, mailAdresse: mailAdresse,
           MAIL_AN: MAIL_AN, MAIL_CC: MAIL_CC, MAIL_TEXT: MAIL_TEXT,
           BRIEFKOPF: BRIEFKOPF, heute: heute,
           umbau182: umbau182, sonderStart: sonderStart };
})();
