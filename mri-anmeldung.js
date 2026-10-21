// Datei: mri-anmeldung.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die reine Logik der MRI-Anmeldung (;;mri), seit 18.26 in der
//        App (vorher in der Chrome-Erweiterung — SKRIPT-ZUERST, die
//        Erweiterung ist ausgeschaltet). Näd kopiert in Axenita das
//        ausgefüllte Anmelde-Formular; hier wird erkannt, WELCHES
//        Formular es ist (Medizinisch Radiologisches Institut mit 5
//        Standorten per ☒, RNR, Hirslanden mit ☒-Standort, RIMED mit
//        Vorgabe Altstetten) und wer der Patient ist (Nachname,
//        Geburtsdatum, Geschlecht als Kontroll-Hinweis). Dazu Betreff,
//        Mail-Text mit Signatur und die mailto-Adresse. Das Fenster
//        dazu lebt in ansicht-mri.js. Die Erkennungs-Logik ist
//        unverändert aus der Erweiterung übernommen (dort an allen
//        vier Formularen bewiesen). GRUNDSATZ: Nichts davon wird
//        gespeichert oder ins Netz geschickt — die Angaben wandern
//        nur in die eine Outlook-Mail.

"use strict";
window.TB = window.TB || {};

TB.mriRein = (function () {

  // Alle Empfänger. Die Nummer im Aufklappmenü ist die Stelle hier + 1.
  // anbieter gruppiert das Menü und steuert die Erkennung.
  var EMPFAENGER = [
    { anbieter: "mri", gruppe: "Medizinisch Radiologisches Institut", name: "MRI IR Bahnhof Oerlikon", mail: "ir-bho@mri-roentgen.ch" },
    { anbieter: "mri", gruppe: "Medizinisch Radiologisches Institut", name: "MRI Bahnhofsplatz",       mail: "a-bhp@mri-roentgen.ch" },
    { anbieter: "mri", gruppe: "Medizinisch Radiologisches Institut", name: "MRI Bahnhof Oerlikon",    mail: "a-bho@mri-roentgen.ch" },
    { anbieter: "mri", gruppe: "Medizinisch Radiologisches Institut", name: "MRI Stadelhofen",         mail: "a-sth@mri-roentgen.ch" },
    { anbieter: "mri", gruppe: "Medizinisch Radiologisches Institut", name: "MRI Schulthess Klinik",   mail: "a-shk@mri-roentgen.ch" },
    { anbieter: "rnr", gruppe: "RNR", name: "RNR (Wallisellen / Stettbach)", mail: "info@rnr.ch" },
    { anbieter: "hirslanden", gruppe: "Hirslanden", name: "Hirslanden — Klinik Hirslanden / Ärztezentrum Seefeld", mail: "radiologieanmeldung.hirslanden@hirslanden.ch" },
    { anbieter: "hirslanden", gruppe: "Hirslanden", name: "Hirslanden — Klinik Im Park", mail: "radiologieanmeldung.impark@hirslanden.ch" },
    { anbieter: "rimed", gruppe: "RIMED", name: "RIMED Altstetten", mail: "altstetten@rimed.ch" },
    { anbieter: "rimed", gruppe: "RIMED", name: "RIMED Bellevue",   mail: "bellevue@rimed.ch" },
    { anbieter: "rimed", gruppe: "RIMED", name: "RIMED Oerlikon",   mail: "oerlikon@rimed.ch" },
    { anbieter: "rimed", gruppe: "RIMED", name: "RIMED Sihlcity",   mail: "sihlcity@rimed.ch" }
  ];
  var ANBIETER_NAME = { mri: "Medizinisch Radiologisches Institut", rnr: "RNR",
    hirslanden: "Hirslanden", rimed: "RIMED" };
  var KREUZ = "☒"; // ☒

  var SIGNATUR = "Dr. med. Nadir Tissira\r\nFMH Neurologie\r\n\r\n" +
    "Praxis Neuromed\r\nStampfenbachstrasse 63\r\n8006 Zürich\r\n\r\n" +
    "Tel:  044 363 64 22\r\n";

  function nummerVon(mail) {
    for (var i = 0; i < EMPFAENGER.length; i++) {
      if (EMPFAENGER[i].mail === mail) return i + 1;
    }
    return 0;
  }

  // Axenita/ONLYOFFICE kopiert teils geschützte oder schmale Leerzeichen
  // und andere Kästchen-Zeichen — alles auf Normalform bringen.
  function normal(text) {
    return String(text || "")
      .replace(/[      ]/g, " ")
      .replace(/[☑⊠✘✖]/g, KREUZ)
      .replace(/ {2,}/g, " ");
  }

  // Welches Formular ist es? Reihenfolge zählt: Hirslanden zuerst
  // (sein Text nennt „MRI OFFENES GERÄT"), dann RNR, RIMED, zuletzt
  // das Medizinisch Radiologische Institut. Kopf- und Fusszeilen
  // kommen beim Kopieren nicht immer mit — darum zählen auch
  // Merkmale aus dem Formular-Rumpf.
  function anbieterVon(text) {
    var t = normal(text);
    if (/hirslanden/i.test(t) || /Klinik Im Park/i.test(t) ||
        /PATIENTEN-INFORMATIONEN/.test(t) || /MRI OFFENES GER/i.test(t) ||
        /BEFUNDKOPIE AN/.test(t)) return "hirslanden";
    if ((/Wallisellen/i.test(t) && /Stettbach/i.test(t)) || /\brnr\b/i.test(t) ||
        /Praxis-Standort Wunsch/i.test(t)) return "rnr";
    if (/Upright\s*\/\s*offenes MRI/i.test(t) || /VueMotion/i.test(t) || /rimed/i.test(t)) return "rimed";
    if (/mri-roentgen/i.test(t) || /Medizinisch Radiologisch/i.test(t) ||
        /Bitte Voruntersuchungen mitbringen/i.test(t) || /SZINTI/i.test(t)) return "mri";
    var zeilen = t.split(/\r\n?|\n/);
    for (var i = 0; i < zeilen.length; i++) {
      var z = zeilen[i].trim();
      for (var k = 0; k < 5; k++) {
        if (z.indexOf(EMPFAENGER[k].name) !== -1) return "mri";
      }
    }
    return "";
  }

  // Medizinisch Radiologisches Institut: die Zeile, die mit einem
  // Institutsnamen beginnt UND ein ☒ trägt.
  function mriStandort(text) {
    var zeilen = normal(text).split(/\r\n?|\n/);
    for (var i = 0; i < zeilen.length; i++) {
      var z = zeilen[i].trim();
      if (z.indexOf(KREUZ) === -1) continue;
      // „MRI IR Bahnhof Oerlikon" steht an erster Stelle der Liste und
      // enthält „MRI Bahnhof Oerlikon" NICHT — die Reihenfolge ist sicher.
      for (var k = 0; k < 5; k++) {
        if (z.indexOf(EMPFAENGER[k].name) !== -1) return k + 1;
      }
    }
    return 0;
  }

  // Hirslanden: Im Kopf des Formulars steht vor jedem Standort ein
  // Kästchen. Nur der Kopf bis „PATIENTEN-INFORMATIONEN" zählt — weiter
  // unten nennen die Radiologen-Kästchen „Klinik Im Park" nochmals.
  function hirslandenStandort(text) {
    var t = normal(text);
    var bis = t.search(/PATIENTEN-INFORMATIONEN/i);
    var kopf = bis === -1 ? t.slice(0, 1500) : t.slice(0, bis);
    var stuecke = kopf.split(/([☐☒])/);
    for (var i = 1; i < stuecke.length - 1; i += 2) {
      if (stuecke[i] !== KREUZ) continue;
      var danach = stuecke[i + 1];
      if (/Im\s+Park/i.test(danach)) return nummerVon("radiologieanmeldung.impark@hirslanden.ch");
      if (/Klinik\s+Hirslanden|Seefeld/i.test(danach)) return nummerVon("radiologieanmeldung.hirslanden@hirslanden.ch");
    }
    return 0;
  }

  // Die Zelle direkt HINTER einer Beschriftung (Word-Tabellen kommen
  // beim Kopieren mit Tab zwischen den Zellen). Die ERSTE Beschriftung
  // entscheidet — ist ihre Zelle leer, bleibt das Feld leer, statt
  // weiter unten z. B. den Namen des zuweisenden Arztes zu erwischen.
  var BESCHRIFTUNG = {
    name: /^Name:?$/i,
    geb: /^(Geb\.?[\s-]*(Datum|Dat\.?)|Geburtsdatum):?$/i,
    geschlecht: /^Geschl(\.|echt)?:?$/i
  };

  function zerlege(text) {
    var e = { anbieter: "", empfaenger: 0, nachname: "", geb: "", geschlecht: "" };
    var gesehen = { name: false, geb: false, geschlecht: false };
    normal(text).replace(/\r\n?/g, "\n").split("\n").forEach(function (zeile) {
      var zellen = zeile.split("\t").map(function (z) { return z.trim(); });
      zellen.forEach(function (zelle, j) {
        var wert = zellen[j + 1] || "";
        if (!gesehen.name && BESCHRIFTUNG.name.test(zelle)) {
          gesehen.name = true;
          if (wert && wert.toLowerCase() !== "name") e.nachname = wert;
        } else if (!gesehen.name) {
          var m1 = /^Name\s*:\s*(\S.*)$/i.exec(zelle);
          if (m1) { gesehen.name = true; e.nachname = m1[1].trim(); }
        }
        if (!gesehen.geb && BESCHRIFTUNG.geb.test(zelle)) {
          gesehen.geb = true;
          var d = /([0-3]?\d\.[01]?\d\.\d{2,4})/.exec(wert);
          if (d) e.geb = d[1];
        } else if (!gesehen.geb) {
          var m2 = /^(?:Geb\.?[\s-]*(?:Datum|Dat\.?)|Geburtsdatum)\s*:\s*([0-3]?\d\.[01]?\d\.\d{2,4})/i.exec(zelle);
          if (m2) { gesehen.geb = true; e.geb = m2[1]; }
        }
        if (!gesehen.geschlecht && BESCHRIFTUNG.geschlecht.test(zelle)) {
          gesehen.geschlecht = true;
          if (/weiblich/i.test(wert)) e.geschlecht = "Frau";
          else if (/männlich|maennlich/i.test(wert)) e.geschlecht = "Herr";
        }
      });
    });
    e.anbieter = anbieterVon(text);
    if (e.anbieter === "mri") e.empfaenger = mriStandort(text);
    else if (e.anbieter === "rnr") e.empfaenger = nummerVon("info@rnr.ch");
    else if (e.anbieter === "hirslanden") {
      // Im Park nur, wenn angekreuzt; sonst Klinik Hirslanden (Näd 30.9.).
      e.empfaenger = hirslandenStandort(text) ||
        nummerVon("radiologieanmeldung.hirslanden@hirslanden.ch");
    }
    // RIMED: das Formular nennt keinen Standort — Vorgabe Altstetten.
    else if (e.anbieter === "rimed") e.empfaenger = nummerVon("altstetten@rimed.ch");
    return e;
  }

  function betreff(anredeKurz, nachname, geb) {
    var b = "MRI-Anmeldung " + anredeKurz + " " + String(nachname || "").trim();
    if (String(geb || "").trim()) b += ", geb. " + String(geb).trim();
    return b;
  }

  function rumpf(anredeWort, nachname) {
    return "Sehr geehrte Damen und Herren\r\n\r\n" +
      "Gerne möchte ich " + anredeWort + " " + String(nachname || "").trim() +
      " zum MRI anmelden.\r\n\r\n" +
      "Freundliche Grüsse\r\n\r\n" + SIGNATUR;
  }

  function mailAdresse(nr) {
    var x = EMPFAENGER[nr - 1];
    return x ? x.mail : "";
  }

  function mailtoUrl(mail, betreffText, rumpfText) {
    return "mailto:" + mail +
      "?subject=" + encodeURIComponent(betreffText) +
      "&body=" + encodeURIComponent(rumpfText);
  }

  return { normal: normal, EMPFAENGER: EMPFAENGER, ANBIETER_NAME: ANBIETER_NAME,
           KREUZ: KREUZ, SIGNATUR: SIGNATUR, zerlege: zerlege, anbieterVon: anbieterVon,
           betreff: betreff, rumpf: rumpf, mailAdresse: mailAdresse,
           mailtoUrl: mailtoUrl, nummerVon: nummerVon };
})();
