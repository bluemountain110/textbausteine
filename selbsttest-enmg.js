// Datei: selbsttest-enmg.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die Selbsttest-Fälle des ENMG-Befund-Vorschlags (18.13):
//        Viking-Deuter, Normzuordnung der Vergleichszeilen, Bland-Grade,
//        Polyneuropathie-Satz, Fragestellungs-Erkennung, Spalten und
//        die HTML-Aufbereitung. Alle Daten sind ERFUNDEN (Muster Hans,
//        Werte nach dem Muster von Näds Beispielen) — nie echte
//        Befunde in Tests. Wird von selbsttest.js als Gruppe
//        „ENMG-Befund" aufgerufen; eigene Datei, weil selbsttest.js
//        schon sehr gross ist.

"use strict";
window.TB = window.TB || {};

TB.selbsttestEnmgBefund = function () {
  var f = [];
  function fall(name, ok, detail) { f.push({ name: name, ok: !!ok, detail: detail || "" }); }

  // ---- Ein erfundener Viking-Bericht als Roh-Text ---------------------------
  function zeile(zellen, n) {
    var z = zellen.slice();
    while (z.length < n) z.push("");
    return z.join("\x07") + "\x07\x07";
  }
  function feld(name, inhalt) {
    return "\x13FILLIN VikingSubReport:" + name + ".nic\x14" + inhalt + "\x15\r";
  }
  function viking(motorZeilen, sensZeilen, fZeilen, frage) {
    var mk = ["Nerv, Stimulation", "Latenz", "Amplitude", "Segment", "Area Diff.\r", "Distanz", "NLG"];
    var sk = ["Nerve, Stimulation", "Latenz\rAbgang", "Peak\rLatenz", "Amplitude\rµV",
              "Segment", "Lat. - Diff", "Distanz", "NLG"];
    var roh = feld("logoH", "Praxis Muster\r") +
      feld("pat_b", "Elektrodiagnostische Untersuchung vom 10.10.2026 09:00\r\rName:\x07Muster, Hans, 01/01/1960\r\x07Patient ID:\x0799999\r\x07\x07") +
      feld("history", "\rIndikation/Fragestellung: " + frage + " \r\r") +
      feld("mnc_b", "Motorische Neurografie:\r" + zeile(mk, 7) + zeile([], 7) +
        motorZeilen.map(function (z) { return zeile(z, 7); }).join("") + "\r") +
      feld("f-wave_b", "Minimale F- Wellenlatenz\r" + zeile(["Nerv", "M-Latenz", "F-Latenz"], 3) +
        fZeilen.map(function (z) { return zeile(z, 3); }).join("") + "\r") +
      feld("snc_b", "Sensible Neurographie:\r" + zeile(sk, 8) + zeile([], 8) +
        sensZeilen.map(function (z) { return zeile(z, 8); }).join("") + "\r") +
      feld("conclusn", "\rBeurteilung: \r\r");
    return roh;
  }

  try {
    var V = TB.enmgViking, B = TB.enmgBefund;
    // Fall A: CTS rechts + PNP-Muster (Peroneus, Suralis) + unplausible Ulnaris-Zeile
    var rohA = viking(
      [["N. medianus.R"], ["Carpus", "5.6 ms", "6.0 mV", "", "", "60 mm", " m/s"],
       ["Cubitus", "9.6 ms", "5.8 mV", "Carpus-Cubitus", "2.0", "220 mm", "55 m/s"],
       ["N. peroneus communis.L"], ["Tarsus", "6.0 ms", "2.0 mV", "M. extensor digitorum brevis-Tarsus", "", "75 mm", " m/s"],
       ["Fibula", "14.0 ms", "1.8 mV", "Tarsus-Fibula", "1.0", "340 mm", "45 m/s"]],
      [["N. medianus.R"], ["Palmar", "1.8 ms", "2.6 ms", "8 µV", "Palmar-Index; Digitus secundus [II]", "1.8 ms", "80 mm", "50 m/s"],
       ["Carpus", "3.5 ms", "4.2 ms", "1.5 µV", "Index; Digitus secundus [II]-Carpus", "3.5 ms", "130 mm", "36.8 m/s"],
       ["N. suralis.L"], ["Crus", "3.0 ms", "3.8 ms", "1 µV", "Tarsus-Crus", "3.0 ms", "130 mm", "40 m/s"],
       ["N. ulnaris.R"], ["Handgel.", "2.0 ms", "2.6 ms", "14 µV", "Dig. V.-Handgel.", "2.0 ms", "110 mm", "55 m/s"],
       ["unterh. Sulcus", "4.4 ms", "5.4 ms", "10 µV", "Handgel.-unterh. Sulcus", "2.6 ms", "305 mm", "117 m/s"]],
      [["N. medianus.R", "5.6", "28.0"]],
      "Polyneuropathie? Karpaltunnelsyndrom?");
    var a = V.deute(rohA);
    fall("Viking: Patient, Geburtsdatum (TT/MM/JJJJ → TT.MM.JJJJ), Untersuchungsdatum",
      a.patient.name === "Muster, Hans" && a.patient.geburtsdatum === "01.01.1960" &&
      a.patient.untersuchungsdatum === "10.10.2026",
      a.patient.name + " · " + a.patient.geburtsdatum + " · " + a.patient.untersuchungsdatum);
    fall("Viking: Fragestellung aus dem Export gelesen",
      a.fragestellungText === "Polyneuropathie? Karpaltunnelsyndrom?", a.fragestellungText);
    var mot = a.bloecke.filter(function (b) { return b.art === "motor"; });
    fall("Viking: 2 motorische Blöcke, Seiten richtig, F-Welle am Medianus",
      mot.length === 2 && mot[0].seite === "rechts" && mot[1].seite === "links" &&
      mot[0].zeilen[0].werte.fLat === 28 && mot[0].zeilen[1].werte.nlg === 55 &&
      mot[0].zeilen[1].werte.areaDiff === 2,
      mot.map(function (b) { return b.nervText + ":" + b.zeilen.length; }).join(" "));
    var sm = a.bloecke.filter(function (b) { return b.art === "sens" && /medianus/.test(b.nervText); })[0];
    fall("Viking: Palmar-Zeile ist Vergleich ohne Normwert, Handgelenk-Zeile normal",
      sm && sm.zeilen[0].ohneNorm && sm.zeilen[0].vergleich === "palmar" && !sm.zeilen[1].ohneNorm);
    var su = a.bloecke.filter(function (b) { return /ulnaris/.test(b.nervText); })[0];
    fall("Viking: NLG 117 m/s wird als unplausibel markiert, nie gefärbt",
      su && su.zeilen[1].unplausibel && su.zeilen[1].ohneNorm);

    TB.enmg.bewerte(a);
    fall("Viking: Alter aus den Daten (66)", a.alter === 66, String(a.alter));
    var zus = B.zusammenfassung(a);
    fall("Zusammenfassung: CTS rechts als Grad 3 nach Bland – moderat",
      /N\. medianus rechts: Neuropathie über dem Carpaltunnel \(Grad 3 nach Bland – moderat\)/.test(zus), zus.split("\n")[0]);
    fall("Zusammenfassung: unplausible NLG mit „Distanz prüfen“",
      /NLG 117 m\/s\) – Distanz prüfen/.test(zus));
    var fr = B.fragenAusText(a.fragestellungText);
    fall("Fragestellung erkannt: Polyneuropathie + Karpaltunnelsyndrom",
      fr.join(",") === "pnp,cts", fr.join(","));
    var beu = B.beurteilung(a, fr);
    fall("Beurteilung: Polyneuropathie-Satz (sensomotorisch, distal betont)",
      /Befundkonstellation passend zu einer sensomotorischen, distal betonten, .*Polyneuropathie\./.test(beu), beu.split("\n")[0]);
    fall("Beurteilung: Karpaltunnelsyndrom rechts mit Bland-Grad, als Aufzählung",
      /• Karpaltunnelsyndrom rechts \(Grad 3 nach Bland – moderat\)\./.test(beu));

    // Fall B: alles unauffällig
    var rohB = viking(
      [["N. medianus.L"], ["Carpus", "3.0 ms", "8.0 mV", "", "", "60 mm", " m/s"],
       ["Cubitus", "6.6 ms", "7.8 mV", "Carpus-Cubitus", "1.0", "200 mm", "56 m/s"]],
      [["N. suralis.R"], ["Crus", "2.3 ms", "2.9 ms", "9 µV", "Tarsus-Crus", "2.3 ms", "120 mm", "52 m/s"]],
      [], "");
    var b = V.deute(rohB); TB.enmg.bewerte(b);
    fall("Unauffällig: Zusammenfassung „unauffällig“, Beurteilung „Keine Hinweise auf eine Polyneuropathie.“",
      /N\. medianus links: unauffällig\./.test(B.zusammenfassung(b)) &&
      B.beurteilung(b, ["pnp"]) === "Keine Hinweise auf eine Polyneuropathie.",
      B.beurteilung(b, ["pnp"]));
    fall("Ohne Fragestellung: „Unauffällige Neurographie der untersuchten Nerven.“",
      B.beurteilung(b, []) === "Unauffällige Neurographie der untersuchten Nerven.");

    // Bland 4 (SNAP fehlt) und 5 (DML > 6.5)
    function blandFall(dml, snap) {
      var r = viking([["N. medianus.R"], ["Carpus", dml + " ms", "5.0 mV", "", "", "60 mm", " m/s"],
        ["Cubitus", "10.0 ms", "4.8 mV", "Carpus-Cubitus", "1.0", "220 mm", "52 m/s"]],
        [["N. medianus.R"], ["Carpus", snap ? "3.5 ms" : " ms", snap ? "4.2 ms" : " ms",
          snap ? snap + " µV" : " µV", "Index; Digitus secundus [II]-Carpus", " ms", "130 mm",
          snap ? "45 m/s" : " m/s"]], [], "Karpaltunnelsyndrom?");
      var e = V.deute(r); TB.enmg.bewerte(e);
      return B.beurteilung(e, ["cts"]);
    }
    fall("Bland 4: kein SNAP, DML 5.5 ms → schwer", /Grad 4 nach Bland – schwer/.test(blandFall("5.5", null)), blandFall("5.5", null));
    fall("Bland 5: DML 7.0 ms → sehr schwer", /Grad 5 nach Bland – sehr schwer/.test(blandFall("7.0", "6")), blandFall("7.0", "6"));

    // 18.14: Näds Testbefund vom 14.10. (nachgebaut mit erfundenen Werten):
    // Viking schreibt die Handgelenk-Reizung als „Palmar“ und die NLG auf
    // eine Fortsetzungszeile; darunter stehen Näds Myographien.
    var rohC = viking(
      [["N. medianus.R"], ["Carpus", "3.3 ms", "5.5 mV", "M. abductor pollicis brevis-Carpus", "", "70 mm", " m/s"],
       ["Cubitus", "7.3 ms", "5.9 mV", "Carpus-Cubitus", "1.1", "250 mm", "63 m/s"]],
      [["N. medianus.R"], ["Palmar", "2.5 ms", "3.2 ms", "9 µV", "Palmar-Index; Digitus secundus [II]", "2.5 ms", " mm", " m/s"],
       ["", " ms", " ms", " µV", "Index; Digitus secundus [II]-Palmar", "2.5 ms", "150 mm", "60 m/s"]],
      [], "\rALS?").replace("\r\x15\r\x13FILLIN VikingSubReport:conclusn",
        "\r\rMyographien\x0bM. tibialis anterior links: keine pathologische Spontanaktivität, unauffälliges Interferenzmuster\r" +
        "M. gastrocnemius medialislinks: keine pathologische Spontanaktivität, unauffälliges Interferenzmuster, vereinzelte Faszikulationen\r" +
        "\x15\r\x13FILLIN VikingSubReport:conclusn");
    var c = V.deute(rohC); TB.enmg.bewerte(c);
    var cm = c.bloecke.filter(function (b) { return b.art === "sens"; })[0];
    fall("Viking-Fortsetzungszeile: NLG und Distanz gehören zur Zeile darüber (eine Messung)",
      cm && cm.zeilen.length === 1 && cm.zeilen[0].werte.nlg === 60 && cm.zeilen[0].werte.amp === 9,
      cm ? JSON.stringify(cm.zeilen.map(function (z) { return z.werte; })) : "kein Block");
    fall("„Palmar“ mit 150 mm gilt als Handgelenk-Messung (mit Normwert), nicht als Vergleich",
      cm && !cm.zeilen[0].ohneNorm);
    var zc = B.zusammenfassung(c);
    fall("Kein falsches CTS bei unauffälligem Medianus (Näds Fund 14.10.)",
      /N\. medianus rechts: unauffällig\./.test(zc) && !/Carpaltunnel/.test(zc), zc.split("\n")[0]);
    fall("Myographien unter der Tabelle erkannt (2 Muskeln, Seite auch bei „medialislinks“)",
      c.myografie.length === 2 && c.myografie.some(function (m) {
        return m.seite === "links" && /medialis links$/.test(m.muskel) && m.fasz && !m.spont; }),
      c.myografie.map(function (m) { return m.muskel; }).join(" | "));
    var bc = B.beurteilung(c, B.fragenAusText(c.fragestellungText));
    fall("Frage „ALS?“ → keine Hinweise auf Motoneuronerkrankung + benigne Faszikulationen",
      /Keine elektrophysiologischen Hinweise auf eine Motoneuronerkrankung/.test(bc) &&
      /vereinbar mit benignen Faszikulationen/.test(bc), bc.split("\n")[0]);
    fall("Das Wort „als“ ist keine ALS-Frage",
      B.fragenAusText("Schwäche, als Kind schon").indexOf("mnd") === -1 &&
      B.fragenAusText("ALS?").indexOf("mnd") !== -1);
    // 18.15: Nadel-EMG-Tabelle des Viking (Feld emg_npp), erfundene Muskeln
    var emgRoh = "Nadel EMG Untersuchung:\r\r\x07Einstichakt\x07Spontanaktivität\x07Potentiale motorischer Einheiten\x07\x07" +
      "\x07Muscle\x07Einstich\x07Fib.\x07PSW\x07Fasz.\x07Dauer\x07Amplitude\x07Polyphasie\x07Muster\x07Anspannung\x07\x07\x07\x07\x07" +
      "M. tibialis anterior.L\x07normal\x07keine\x07keine\x07keine\x07\x07\x07vermehrt\x07dicht\x07maximal\x07\x07\x07\x07\x07" +
      "M. vastus lateralis.R\x07normal\x07++\x07+\x07+\x07verlängert\x07erhöht\x07keine\x07gelichtet\x07maximal\x07\x07\x07\x07\x07\r\rAbkürzungen:\t\r";
    var et = V.emgTabelle(emgRoh);
    fall("Nadel-EMG-Tabelle: 2 Muskeln, Seiten, Näds Wortlaut",
      et.length === 2 && et[0].seite === "links" &&
      et[0].befund === "keine pathologische Spontanaktivität, vermehrt polyphasische Potentiale, unauffälliges Interferenzmuster",
      et.map(function (m) { return m.muskel + ": " + m.befund; }).join(" | "));
    fall("Nadel-EMG-Tabelle: Fib./PSW ⇒ Spontanaktivität, Dauer/Amplitude/gelichtet ⇒ neurogen, Polyphasie allein unspezifisch",
      et[1].spont && et[1].fasz && et[1].neurogen && !et[0].spont && !et[0].neurogen && et[0].unspez.length === 1);
    var bt = B.beurteilung({ bloecke: [], myografie: et }, ["mnd"]);
    fall("Frage Motoneuron mit Denervierung: Muskeln genannt, „Verteilung bitte beurteilen“",
      /pathologische Spontanaktivität in M\. vastus lateralis rechts/.test(bt) && /Verteilung bitte beurteilen/.test(bt), bt);
    fall("Fragestellung „Kompressionsneuropathie der Armnerven?“ → CTS + Sulcus ulnaris",
      B.fragenAusText("Polyneuropathie? Kompressionsneuropathie der Armnerven?").join(",") === "pnp,cts,sus");
    // 18.17: hinter jeder bewerteten Spalte steht die Norm-Spalte (E1 = (a))
    var sp = TB.enmg.spalten(mot[0]).map(function (s) {
      return s.norm ? s.feld + "Norm" : s.feld; }).join(",");
    fall("Spalten Viking motorisch: mit Fläche Δ, Abstand und Norm-Spalten (18.17; Amplitude seit 18.18), ohne Dauer",
      sp === "segment,lat,latNorm,amp,ampNorm,areaDiff,abstand,nlg,nlgNorm,fLat,fLatNorm", sp);
    var h = B.alsHtml("• Eins\n• Zwei");
    fall("Beurteilung als HTML: Aufzählung wird <ul> mit 2 Punkten",
      (h.match(/<li>/g) || []).length === 2 && /<ul/.test(h));
    var kt = TB.enmgLeserDoc.klartext("\x13FILLIN X\x14Kopf\rA\x07B\x07\x07\x15");
    fall("Word-97-Klartext: Feld-Anweisung weg, Zellen als Tabulator", kt === "Kopf\nA\tB", JSON.stringify(kt));
    fall("Word-97-Erkennung: Verbund-Kopf D0 CF 11 E0",
      TB.enmgLeserDoc.istDoc(new Uint8Array(600).fill(0).map(function (x, i) {
        return [0xD0, 0xCF, 0x11, 0xE0][i] || 0; })) &&
      !TB.enmgLeserDoc.istDoc(new Uint8Array([0x25, 0x50, 0x44, 0x46])));
  } catch (e) {
    fall("ENMG-Befund-Prüfungen liefen durch", false, String(e && e.message || e));
  }
  return f;
};

// ---- 18.18: Chen-Amplituden, Tabellen je Art, Sortierung, AAN-Schwellen,
//      Rauschfilter, myopathisches Muster, Fenster-Ziele. Alle Daten
//      ERFUNDEN (Muster Hans). Gruppe „ENMG 18.18".
TB.selbsttestEnmg1818 = function () {
  var f = [];
  function fall(name, ok, detail) { f.push({ name: name, ok: !!ok, detail: detail || "" }); }
  function zeile(zellen, n) {
    var z = zellen.slice();
    while (z.length < n) z.push("");
    return z.join("\x07") + "\x07\x07";
  }
  function feld(name, inhalt) {
    return "\x13FILLIN VikingSubReport:" + name + ".nic\x14" + inhalt + "\x15\r";
  }
  function viking(motorZeilen, sensZeilen) {
    var mk = ["Nerv, Stimulation", "Latenz", "Amplitude", "Segment", "Area Diff.\r", "Distanz", "NLG"];
    var sk = ["Nerve, Stimulation", "Latenz\rAbgang", "Peak\rLatenz", "Amplitude\rµV",
              "Segment", "Lat. - Diff", "Distanz", "NLG"];
    return feld("pat_b", "Elektrodiagnostische Untersuchung vom 10.10.2026 09:00\r\rName:\x07Muster, Hans, 01/01/1960\r\x07Patient ID:\x0799999\r\x07\x07") +
      feld("history", "\rIndikation/Fragestellung: Polyneuropathie? \r\r") +
      feld("mnc_b", "Motorische Neurografie:\r" + zeile(mk, 7) + zeile([], 7) +
        motorZeilen.map(function (z) { return zeile(z, 7); }).join("") + "\r") +
      feld("snc_b", "Sensible Neurographie:\r" + zeile(sk, 8) + zeile([], 8) +
        sensZeilen.map(function (z) { return zeile(z, 8); }).join("") + "\r");
  }
  function lies(m, s) { var e = TB.enmgViking.deute(viking(m, s)); TB.enmg.bewerte(e); return e; }
  try {
    var E = TB.enmg, B = TB.enmgBefund, G = TB.normwerteGrundlage;
    function nerv(id) { return G.nerven.filter(function (n) { return n.id === id; })[0]; }
    var med = nerv("medianus");
    // F1: motorische Amplituden nach Chen
    var b1 = E.bewertung(med, "mamp", 4.5, 45), b2 = E.bewertung(med, "mamp", 4.0, 45),
        b3 = E.bewertung(med, "mamp", 3.9, 45);
    fall("F1 Chen: Medianus MSAP 45 J. (Grenze 4.2) — 4.5 grün, 4.0 grenzwertig, 3.9 rot",
      b1.farbe === "gruen" && b2.farbe === "grenzwertig" && b3.farbe === "rot",
      [b1.farbe, b2.farbe, b3.farbe, b1.grenze].join(" "));
    var z = E.zeileVonNerv(med, "mamp");
    fall("Chen-Altersgruppen ohne Zwischenrechnung: 39 J. 5.9 · 40 J. 4.2 · 59 J. 4.2 · 60 J. 3.8",
      E.grenzeFuer(z, 39) === 5.9 && E.grenzeFuer(z, 40) === 4.2 &&
      E.grenzeFuer(z, 59) === 4.2 && E.grenzeFuer(z, 60) === 3.8,
      [39, 40, 59, 60].map(function (a) { return E.grenzeFuer(z, a); }).join(" "));
    var tz = E.zeileVonNerv(nerv("tibialis"), "mamp");
    fall("F2: Tibialis MSAP ab 60 J. 4.4 mV (nicht 1.1); 25 J. 5.8; 45 J. 5.3",
      E.grenzeFuer(tz, 65) === 4.4 && E.grenzeFuer(tz, 25) === 5.8 && E.grenzeFuer(tz, 45) === 5.3);
    fall("Ulnaris MSAP fest 7.9 mV, Peroneus EDB 2.6 (bis 39 J.) / 1.1 (ab 40 J.)",
      E.grenzeFuer(E.zeileVonNerv(nerv("ulnaris"), "mamp"), 70) === 7.9 &&
      E.grenzeFuer(E.zeileVonNerv(nerv("peronaeus"), "mamp"), 30) === 2.6 &&
      E.grenzeFuer(E.zeileVonNerv(nerv("peronaeus"), "mamp"), 50) === 1.1);
    // F3/F4: sensibel antidrom, tiefere BMI-Zahl
    fall("F3/F4: sensibel antidrom — Medianus 13 µV (< 50 J.) / 8 µV (ab 50), Ulnaris 8 / 4, Suralis 4, Radialis 11",
      E.grenzeFuer(E.zeileVonNerv(med, "sdistamp"), 45) === 13 &&
      E.grenzeFuer(E.zeileVonNerv(med, "sdistamp"), 65) === 8 &&
      E.grenzeFuer(E.zeileVonNerv(nerv("ulnaris"), "sdistamp"), 30) === 8 &&
      E.grenzeFuer(E.zeileVonNerv(nerv("ulnaris"), "sdistamp"), 70) === 4 &&
      E.grenzeFuer(E.zeileVonNerv(nerv("suralis"), "samp"), 70) === 4 &&
      E.grenzeFuer(E.zeileVonNerv(nerv("radialis"), "sdistamp"), 70) === 11);
    // Nachführung einer gespeicherten Ablage von vor 18.18
    var alt = JSON.parse(JSON.stringify(G));
    alt.stand = "2026-10-08";
    alt.nerven.forEach(function (n) {
      n.zeilen = n.zeilen.filter(function (x) { return x.id !== "mamp"; });
      if (n.motor) { delete n.motor.amp; delete n.motor.ampAusser; }
      n.zeilen.forEach(function (x) {
        if (x.id === "sdistamp" || x.id === "samp") { delete x.stufig; x.fest = 5; delete x.werte; }
      });
    });
    var altMed = alt.nerven.filter(function (n) { return n.id === "medianus"; })[0];
    E.zeileVonNerv(altMed, "dml").werte[0] = 3.7;   // Näds eigene Änderung
    var neu = E.nachfuehren(alt);
    var nMed = neu.nerven.filter(function (n) { return n.id === "medianus"; })[0];
    fall("Nachführung: gespeicherte Ablage bekommt die Chen-Zeilen, Näds eigene Werte bleiben",
      neu.stand === G.stand && !!E.zeileVonNerv(nMed, "mamp") &&
      nMed.motor.amp === "mamp" && E.zeileVonNerv(nMed, "sdistamp").stufig === true &&
      E.zeileVonNerv(nMed, "dml").werte[0] === 3.7 &&
      nMed.zeilen[1].id === "mamp" && nMed.zeilen.length === med.zeilen.length,
      nMed.zeilen.map(function (x) { return x.id; }).join(","));
    // Sortierung + Nerv-Zeilen
    var bl = [{ art: "motor", nervText: "Ulnaris Motorisch Rechts", seite: "rechts", zeilen: [] },
              { art: "motor", nervText: "Medianus Motorisch Rechts", seite: "rechts", zeilen: [] },
              { art: "sens", nervText: "Suralis Sensorisch Links", seite: "links", zeilen: [] },
              { art: "motor", nervText: "Medianus Motorisch Links", seite: "links", zeilen: [] }];
    var so = E.sortiere(bl).map(function (b) { return E.nervZeile(b); }).join(" · ");
    fall("Sortierung alphabetisch, links vor rechts (wie Keypoint)",
      so === "N. medianus links · N. medianus rechts · N. suralis links · N. ulnaris rechts", so);
    // Tabellen: eine motorisch, eine sensibel, graue Nerv-Zeile
    var a = lies(
      [["N. ulnaris.R"], ["Handgel.", "3.0 ms", "9.0 mV", "", "", "70 mm", " m/s"],
       ["N. medianus.L"], ["Carpus", "3.5 ms", "6.0 mV", "", "", "70 mm", " m/s"],
       ["Cubitus", "7.5 ms", "5.8 mV", "Carpus-Cubitus", "1.0", "220 mm", "55 m/s"]],
      [["N. suralis.R"], ["Crus", "2.5 ms", "3.0 ms", "9 µV", "Tarsus-Crus", "2.5 ms", "120 mm", "50 m/s"]]);
    var ht = E.tabelleHtmlText(a);
    fall("Bericht: genau EINE Tabelle motorisch und EINE sensibel",
      (ht.html.match(/<table/g) || []).length === 2 &&
      ht.html.indexOf(TB.enmgTexte.motorTitel) < ht.html.indexOf(TB.enmgTexte.sensTitel));
    fall("Bericht: Nerv als graue Zwischenzeile (über alle Spalten), Medianus vor Ulnaris",
      /<td colspan="\d+" style="[^"]*background-color:#d9d9d9[^"]*"><b>N\. medianus links<\/b>/.test(ht.html) &&
      ht.html.indexOf("N. medianus links") < ht.html.indexOf("N. ulnaris rechts"));
    fall("Bericht: Segment-Spalte breit (30 %), motorische Amplitude mit Norm-Spalte",
      /style="width:30%;/.test(ht.html) &&
      E.spaltenFuerArt(a.bloecke.filter(function (b) { return b.art === "motor"; }), "motor")
        .some(function (s) { return s.norm && s.feld === "amp"; }));
    var rtf = TB.speicher.rtfHtml(ht.html) || "";
    fall("Bericht als RTF (KISIM/Word): echte Tabellenzeilen, graue Nerv-Zeile schattiert",
      rtf.indexOf("\\trowd") !== -1 && rtf.indexOf("\\clcbpat") !== -1, rtf.length + " Zeichen");
    // Abweichender Ableitmuskel: keine Amplituden-Norm
    var tibAnt = lies([["N. peroneus communis.L"], ["Fib. Köpfchen", "3.0 ms", "4.0 mV", "M. tibialis anterior-Fib. Köpfchen", "", "80 mm", " m/s"]], []);
    fall("Peroneus mit Ableitung Tib. ant.: keine EDB-Amplitudengrenze (bleibt schwarz)",
      !tibAnt.bloecke[0].zeilen[0].bew.amp, JSON.stringify(tibAnt.bloecke[0].zeilen[0].bew.amp || null));
    // AAN-Schwellen je Nerv (Alter 66: Peroneus-DML-Grenze 4.71, Amplitude 1.1)
    function peron(dml, amp) {
      var e = lies([["N. peroneus communis.L"], ["Tarsus", dml + " ms", amp + " mV",
        "M. extensor digitorum brevis-Tarsus", "", "80 mm", " m/s"]], []);
      return B.zusammenfassung(e);
    }
    var p1 = peron("5.06", "3.0"), p2 = peron("6.0", "3.0"), p3 = peron("6.0", "0.5");
    fall("AAN: Peroneus-DML 5.06 (107 %) ist verlängert, aber NICHT demyelinisierend (Näds Beispiel)",
      /verlängerte distale motorische Latenz/.test(p1) && !/demyelinisierend/.test(p1), p1);
    fall("AAN: DML 6.0 (127 %) bei normaler Amplitude → „im demyelinisierenden Bereich“",
      /Latenz \(im demyelinisierenden Bereich\)/.test(p2), p2);
    fall("AAN: DML 6.0 bei verminderter Amplitude (0.5 mV) → strengere 150 %-Schwelle, nicht demyelinisierend; Amplitude reduziert",
      !/demyelinisierend/.test(p3) && /reduzierte motorische Amplitude/.test(p3), p3);
    // PNP: demyelinisierend erst ab zwei Nerven
    var zwei = lies(
      [["N. peroneus communis.L"], ["Tarsus", "6.0 ms", "3.0 mV", "M. extensor digitorum brevis-Tarsus", "", "80 mm", " m/s"],
       ["N. tibialis.L"], ["Malleolus", "7.2 ms", "6.0 mV", "M. abductor hallucis-Malleolus", "", "80 mm", " m/s"]],
      [["N. suralis.L"], ["Crus", "2.5 ms", "3.0 ms", "9 µV", "Tarsus-Crus", "2.5 ms", "120 mm", "50 m/s"]]);
    var bz = B.beurteilung(zwei, ["pnp"]);
    fall("PNP: zwei Nerven im demyelinisierenden Bereich → „überwiegend demyelinisierenden“",
      /überwiegend demyelinisierenden Polyneuropathie/.test(bz), bz);
    var eins = lies(
      [["N. peroneus communis.L"], ["Tarsus", "6.0 ms", "3.0 mV", "M. extensor digitorum brevis-Tarsus", "", "80 mm", " m/s"]],
      [["N. suralis.L"], ["Crus", "2.5 ms", "3.0 ms", "2 µV", "Tarsus-Crus", "2.5 ms", "120 mm", "50 m/s"]]);
    var be = B.beurteilung(eins, ["pnp"]);
    fall("PNP: nur EIN Nerv demyelinisierend → nicht „demyelinisierende PNP“, Hinweis „nur im N. …“",
      /am ehesten axonalen/.test(be) && /Demyelinisierungskriterien nur im N\. peroneus communis links/.test(be), be);
    // Rauschfilter (Keypoint-Kurvenseiten)
    var ker = TB.enmgLeser.deute([
      ["Nerve", "Lat", "Amp"], ["", "ms", "mV"], ["Medianus Motorisch Rechts"],
      ["Handgelenk - APB", "3.2", "8.0"],
      ["Motorische Kurven"], ["Medianus Motorisch Rechts"], ["Handgelenk - APB"],
      ["2mV/D 2ms/D"], ["Bemerkung Probe"], ["Bemerkung Probe"]], []);
    fall("Rauschfilter: Kurvenseiten-Wiederholungen weg, Echtes genau einmal",
      ker.reste.length === 1 && ker.reste[0] === "Bemerkung Probe", JSON.stringify(ker.reste));
    fall("Technik-Sätze („Reizung … Nadelelektroden“) fallen weg, Myografie-Zeilen nicht",
      TB.enmgViking.istTechnikSatz("Reizung mit Oberflächenelektroden, Ableitung mit Oberflächen- oder Nadelelektroden.") &&
      !TB.enmgViking.istTechnikSatz("M. tibialis anterior links: keine pathologische Spontanaktivität"));
    // Myopathisches Muster
    var emg = "\x07Muscle\x07Einstich\x07Fib.\x07PSW\x07Fasz.\x07Dauer\x07Amplitude\x07Polyphasie\x07Muster\x07Anspannung\x07\x07\x07\x07\x07" +
      "M. deltoideus.R\x07normal\x07keine\x07keine\x07keine\x07verkürzt\x07vermindert\x07vermehrt\x07früh dicht\x07maximal\x07\x07\x07\x07\x07" +
      "M. vastus lateralis.R\x07normal\x07keine\x07keine\x07keine\x07verkürzt\x07\x07keine\x07dicht\x07maximal\x07\x07\x07\x07\x07";
    var et = TB.enmgViking.emgTabelle(emg);
    fall("Myopathisch nur, wenn kurz + klein + früh im selben Muskel zusammenkommen",
      et.length === 2 && et[0].myopath && !et[0].neurogen && !et[1].myopath &&
      /myopathisches Muster/.test(et[0].befund), et.map(function (m) { return m.befund; }).join(" | "));
    var bm = B.beurteilung({ bloecke: [], myografie: et }, ["myo"]);
    fall("Frage Myopathie → „myopathisches Muster in M. deltoideus rechts“",
      /myopathisches Muster in M\. deltoideus rechts/.test(bm), bm);
    // Fenster-Ziele
    TB.fensterModus._setzeZiel("word");
    var kw = TB.fensterModus.knopfText();
    TB.fensterModus._setzeZiel("kisim");
    fall("Fenster: Ziel Word heisst „An Word übergeben“, KISIM bleibt „An KISIM übergeben“",
      kw === TB.statusTexte.fensterKnopfWord && TB.fensterModus.knopfText() === TB.statusTexte.fensterKnopf, kw);
    fall(";;enmg: Ansicht liefert die KISIM-Felder einzeln (Fragestellung/Befund/Beurteilung)",
      typeof TB.ansichtEnmg.aktuelleFelder === "function");
    // ---- 18.19: Näds Funde aus dem Spital-Test 16.10. ----------------------
    fall("18.19: Bericht ohne Patientenzeile (Name/geb./Alter stehen nur im Fenster)",
      ht.html.indexOf("geb. ") === -1 && ht.text.indexOf("Muster, Hans") === -1 &&
      ht.html.indexOf("ENMG vom") === -1);
    fall("18.19: Normwert-Quelle kursiv",
      /<i>Normwerte: [^<]*<\/i>/.test(ht.html));
    var zs = B.zusammenfassung(a).split("\n").slice(1);   // 18.24: ohne „Neurografien:“
    fall("18.19: Zusammenfassung — jeder Nerv ein Aufzählungspunkt (wird <ul>/<li>)",
      zs.length >= 3 && zs.every(function (l) { return /^• N\. /.test(l); }) &&
      (B.alsHtml(zs.join("\n")).match(/<li>/g) || []).length === zs.length, zs.join(" | "));
    var ohneFrage = B.beurteilung(lies(
      [["N. peroneus communis.L"], ["Tarsus", "6.0 ms", "3.0 mV", "M. extensor digitorum brevis-Tarsus", "", "80 mm", " m/s"]], []), []);
    fall("18.19: Beurteilung ohne Fragestellung — „Auffällig: … – …“, keine Doppelklammer",
      /^Auffällig: N\. peroneus communis links – verlängerte distale motorische Latenz \(im demyelinisierenden Bereich\)\.$/.test(ohneFrage) &&
      ohneFrage.indexOf("))") === -1, ohneFrage);
    var kr = TB.enmgLeser.deute([
      ["Nerve", "Lat", "Amp"], ["", "ms", "mV"], ["Peroneus profundus Motorisch Rechts"],
      ["OSG - EDB", "6.5", "1.3"], ["Dist. CF - OSG", "17.3", "0.9"],
      ["Tibialis Motorisch Links"], ["Ankle - Abd hal", "4.4", "0.3"],
      ["Rechts Peroneus profundus"], ["Dist. CF - EDB"], ["Links Tibialis Rechts Tibialis"],
      ["Ankle - Abd hal Ankle - Abd hal"], ["Leitungsblock fraglich"]], []);
    fall("18.19: Rauschfilter — umgestellte Kurven-Beschriftungen weg, echter Text bleibt (Näds Bild 16.10.)",
      kr.reste.length === 1 && kr.reste[0] === "Leitungsblock fraglich", JSON.stringify(kr.reste));
    // ---- 18.20: Näds Funde vom 16.10. abends ------------------------------
    var spT = E.spaltenFuerArt(a.bloecke.filter(function (b) { return b.art === "motor"; }), "motor")
      .filter(function (x) { return x.norm; }).map(function (x) { return x.titel; });
    fall("18.20: Norm-Spalte nennt die Einheit („Norm (ms)“, „Norm (mV)“)",
      spT.indexOf("Norm (ms)") !== -1 && spT.indexOf("Norm (mV)") !== -1, spT.join(", "));
    var gwErg = lies([["N. suralis.R"]], [["N. suralis.R"], ["Crus", "2.5 ms", "3.0 ms", "9 µV", "Tarsus-Crus", "2.5 ms", "120 mm", "42.5 m/s"]]);
    var gwZ = gwErg.bloecke[0].zeilen[0];
    var gwHt = E.tabelleHtmlText(gwErg).html;
    fall("18.21: grenzwertig ist im Fenster orange, im Befund rot (nicht fett)",
      gwZ.bew.nlg && gwZ.bew.nlg.farbe === "grenzwertig" && gwHt.indexOf("#b06f00") === -1 &&
      gwHt.indexOf('color:#c00000;font-weight:normal">42.5<') !== -1, gwZ.bew.nlg && gwZ.bew.nlg.farbe);
    // Klick im Fenster = „als normwertig werten“ (wie ansicht-enmg.js)
    gwZ.bew.nlg.farbeVorher = gwZ.bew.nlg.farbe; gwZ.bew.nlg.farbe = "normal";
    var gwHt2 = E.tabelleHtmlText(gwErg).html, gwZs = B.zusammenfassung(gwErg);
    fall("18.21: als normwertig gewertet → im Befund schwarz, Zusammenfassung „unauffällig“",
      gwHt2.indexOf(">42.5<") !== -1 && gwHt2.indexOf('#c00000;font-weight:normal">42.5') === -1 &&
      /N\. suralis rechts: unauffällig\./.test(gwZs), gwZs);
    var kp = TB.enmgLeser.deute([["Nerve", "Lat", "Amp"], ["", "ms", "mV"], ["Medianus Motorisch Rechts"],
      ["Handgelenk - APB", "3.2", "8.0"], ["Ulnaris Motorisch Rechts"], ["HG - ADM", "2.2", "9"],
      ["Handgelenk - APB HG - APB"], ["Mitt.: 5 Mitt.: 1"], ["EMG Befunde"],
      ["Einstisch", "Spontan Aktivität", "Willkür. Aktivität"],
      ["Muskel", "Interpretation", "Aktivität", "Fib", "PSW", "Fasz", "Amp", "IP", "Hinweise"],
      ["Rechts", "Ext indicis", "Normal", "0/10", "0/10", "0/10", "3.5 mV", "Voll"],
      ["Rechts", "Abd pollicis brevis", "subakute Denervation", "Erhöht", "2/10", "2/10", "1/10", "3.5 mV", "Voll"]], []);
    fall("18.20: Keypoint-Nadel-EMG gelesen (2 Muskeln, Denervation erkannt), keine Rausch-Zeilen",
      kp.myografie.length === 2 && !kp.myografie[0].spont && kp.myografie[1].spont &&
      kp.myografie[1].fasz && /subakute Denervation/.test(kp.myografie[1].befund) && kp.reste.length === 0,
      JSON.stringify(kp.reste) + " · " + kp.myografie.map(function (m) { return m.muskel; }).join(", "));
    TB.enmg.bewerte(kp);
    var kpB = B.beurteilung(kp, []), kpZ = B.zusammenfassung(kp);
    fall("18.20: Keypoint-EMG in Zusammenfassung und Beurteilung (Denervation genannt)",
      /Myografien?:/.test(kpZ) && /• M\. Abd pollicis brevis rechts: subakute Denervation/.test(kpZ) &&
      /pathologische Spontanaktivität in M\. Abd pollicis brevis rechts/.test(kpB), kpB);
    var kp2 = TB.enmgLeser.deute([["EMG Befunde"], ["Einstisch Spontan Aktivität Willkür. Aktivität"],
      ["Muskel Interpretation Aktivität Fib PSW Fasz Amp IP Hinweise"],
      ["Rechts Ext indicis Normal 0/10 0/10 0/10 3.5 mV Voll"],
      ["Rechts Abd pollicis brevis subakute Denervation Erhöht 2/10 2/10 1/10 3.5 mV Voll"],
      ["Rechts Abd dig min (man) subakute Denervation 3/10 3/10 1/10 3.5 mV Voll"]], []);
    fall("18.21: Keypoint-EMG wie im Spital (Einstich-Spalte meist leer, „Normal“ = Interpretation)",
      kp2.myografie.length === 3 && kp2.myografie[2].spont &&
      kp2.myografie[2].muskel === "M. Abd dig min (man) rechts" &&
      /^keine pathologische Spontanaktivität/.test(kp2.myografie[0].befund) &&
      /^Einstichaktivität erhöht/.test(kp2.myografie[1].befund),
      kp2.myografie.map(function (m) { return m.muskel + ": " + m.befund; }).join(" | "));
    // ---- 18.22: Näds Funde vom 16.10. spätabends ----------------------------
    var kp3 = TB.enmgLeser.deute([["EMG Befunde"], ["Muskel Interpretation Aktivität Fib PSW Fasz Amp IP Hinweise"],
      ["Rechts Tibialis anterior subakute Denervation 3/10 4/10 1/10 3.5 mV Voll"],
      ["Rechts Gastroc caput med subakute Denervation 7/10 7/10 1/10 3.5 mV Voll"],
      ["Links Biceps Normal 0/10 0/10 0/10 3.5 mV Voll"],
      ["Rechts Biceps Normal 0/10 0/10 0/10 3.5 mV Voll"]], []);
    TB.enmg.bewerte(kp3);
    fall("18.22: Muskeln alphabetisch, links vor rechts",
      kp3.myografie.map(function (m) { return m.muskel; }).join(", ") ===
      "M. Biceps links, M. Biceps rechts, M. Gastroc caput med rechts, M. Tibialis anterior rechts",
      kp3.myografie.map(function (m) { return m.muskel; }).join(", "));
    var mt = E.myoTabelle(kp3);
    fall("18.22: Myografie-Tabelle unter den Normwerten — Spalten wie am Gerät, leere „Hinweise“ weg, Interpretation farbig",
      /Myografie \(Nadel-EMG\)/.test(mt.html) && /Interpretation/.test(mt.html) && !/Hinweise/.test(mt.html) &&
      /color:#c00000;font-weight:bold">subakute Denervation/.test(mt.html) &&
      /color:#1a7a1a;font-weight:bold">Normal/.test(mt.html) && /Rechts Gastroc caput med/.test(mt.html) &&
      E.tabelleHtmlText(kp3).html.indexOf("Myografie (Nadel-EMG)") !== -1);
    var kz = B.zusammenfassung(kp3);
    fall("18.22: Zusammenfassung je Muskel kurz („subakute Denervation mit Faszikulationen“, „unauffällig“)",
      /• M\. Gastroc caput med rechts: subakute Denervation mit Faszikulationen\./.test(kz) &&
      /• M\. Biceps links: unauffällig\./.test(kz), kz);
    var pnpMyo = lies([["N. peroneus communis.R"], ["Tarsus", "4.0 ms", "0.5 mV", "M. extensor digitorum brevis-Tarsus", "", "80 mm", " m/s"]],
      [["N. suralis.R"], ["Crus", "2.5 ms", "3.0 ms", "1 µV", "Tarsus-Crus", "2.5 ms", "120 mm", "50 m/s"]]);
    pnpMyo.myografie = kp3.myografie;
    var pb = B.beurteilung(pnpMyo, ["pnp"]);
    fall("18.22: Denervation in Gastrocnemius/Tibialis anterior passt zur axonalen PNP (Näd 16.10.), nicht als „Zusätzlich“",
      /am ehesten axonalen/.test(pb) &&
      /Spontanaktivität in M\. Gastroc caput med rechts, M\. Tibialis anterior rechts passt zur axonalen Schädigung/.test(pb) &&
      !/Zusätzlich in der Myografie/.test(pb), pb);
    var bl = TB.ansichtEnmg._balkenLage(51.3, { grenze: 43.24, richtung: "min" }, "nlg");
    var bl2 = TB.ansichtEnmg._balkenLage(43.5, { grenze: 43.24, richtung: "min" }, "nlg");
    var bl3 = TB.ansichtEnmg._balkenLage(3.0, { grenze: 4.0, richtung: "max" }, "lat");
    fall("18.22: Balken geeicht — NLG 51.3 bei Grenze 43.2 steht klar im Normalen, 43.5 knapp, DML 3.0 bei 4.0 links im Grünen",
      bl.links > 75 && bl2.links < 55 && bl2.links > 50 && bl3.links < 25,
      [bl.links, bl2.links, bl3.links].map(function (x) { return Math.round(x); }).join(" / "));
    // ---- 18.23: Näds Funde vom 16.10. nachts ---------------------------------
    var mtA = E.myoTabelle(kp3, { amp: false }), mtB = E.myoTabelle(kp3, { amp: true });
    fall("18.23: Myografie-Spalte „Amp“ (Keypoint-Standardwert) nur auf Wunsch",
      mtA.hatAmp && !/>Amp</.test(mtA.html) && />Amp</.test(mtB.html));
    fall("18.23: Myografie-Spalten mit festen Breiten (Interpretation breit, Zahlen schmal), Kopf „Einstich“",
      /width:[0-9.]+%;[^"]*">Interpretation/.test(mtA.html) && kp3.myografie[0].tabelle.kopf[2] === "Einstich");
    var ht3 = E.tabelleHtmlText(kp3);
    fall("18.23: Leerzeile zwischen Normwert-Zeile und Myografie; Bericht endet mit Tabelle",
      /<\/i><\/p>\n<p[^>]*><br><\/p><p[^>]*><b>Myografie/.test(ht3.html) && ht3.endetMitTabelle === true);
    var blA = TB.ansichtEnmg._balkenLage(2.7, { grenze: 3.8, richtung: "min" }, "amp");
    var blB = TB.ansichtEnmg._balkenLage(5.2, { grenze: 7.9, richtung: "min" }, "amp");
    fall("18.23: Amplituden-Balken — 2.7 bei 3.8 und 5.2 bei 7.9 stehen deutlich im Roten",
      blA.links < 30 && blB.links < 25, Math.round(blA.links) + " / " + Math.round(blB.links));
    fall("18.23: Feld, das mit einer Aufzählung endet, wird für KISIM markiert (Skript löscht die Schlusszeile)",
      String(TB.fensterModus.uebergeben).indexOf("listeEnde") !== -1);
    // 18.23 (Näd 16.10. nachts): „--“ = nicht ableitbar, nie still weglassen
    // (erfundene Werte nach dem Muster seines Peroneus-Bildes)
    var naK = TB.enmgLeser.deute([["Nerve", "Lat", "Amp", "Dur", "NLG"],
      ["", "ms", "Norm", "mV", "ms", "m/s", "Norm"],
      ["Peroneus profundus Motorisch Links"],
      ["OSG - EDB", "--", "", "--", "--", "", ""],
      ["Dist. CF-OSG", "--", "", "--", "--", "--", ""],
      ["Peroneus profundus Motorisch Rechts"],
      ["OSG - EDB", "4.1", "", "4.0", "5.9", "", ""],
      ["Dist. CF-OSG", "11.2", "", "3.8", "6.5", "46.0", ""],
      ["Nerve", "Lat", "Amp", "NLG"], ["", "ms", "µV", "m/s", "Norm"],
      ["Suralis Sensorisch Links"],
      ["Wade - Knöchel", "--", "--", "--", ""]], []);
    naK.patient.geburtsdatum = "01.01.1956"; naK.patient.untersuchungsdatum = "10.10.2026";
    TB.enmg.bewerte(naK);
    var naL = naK.bloecke.filter(function (b) { return b.art === "motor" && b.seite === "links"; })[0];
    fall("18.23: Nerv nur mit „--“ bleibt in der Tabelle (Peroneus links, 2 Zeilen, Suralis links)",
      naL && naL.zeilen.length === 2 && naL.zeilen[0].na && naL.zeilen[0].na.amp &&
      naK.bloecke.some(function (b) { return b.art === "sens" && b.seite === "links"; }),
      naK.bloecke.map(function (b) { return b.nervText + ":" + b.zeilen.length; }).join(" | "));
    var naHt = E.tabelleHtmlText(naK);
    fall("18.23: Bericht zeigt „n. a.“ rot und fett, mit Erklärung unter der Tabelle",
      /color:#c00000;font-weight:bold">n\. a\.<\/span>/.test(naHt.html) && /n\. a\. = nicht ableitbar/.test(naHt.html),
      naHt.text.split("\n").slice(0, 6).join(" / "));
    var naZ = B.zusammenfassung(naK), naB = B.beurteilung(naK, []);
    fall("18.23: Zusammenfassung „kein motorisches Potential ableitbar“ bzw. „kein sensibles Potential“",
      /N\. peronaeus (\(profundus\) )?links: kein motorisches Potential ableitbar\./.test(naZ) &&
      /N\. suralis links: kein sensibles Potential ableitbar\./.test(naZ), naZ);
    fall("18.23: Beurteilung nennt den fehlenden Nerv als auffällig",
      /N\. peronaeus (\(profundus\) )?links – kein motorisches Potential ableitbar/.test(naB), naB);
    var naP = B.beurteilung(naK, ["pnp", "peron"]);
    fall("18.23: mit Fragestellung PNP: axonal; Peroneusläsion links „Läsionsort nicht bestimmbar“",
      /am ehesten axonalen/.test(naP) && /Peroneusläsion am Fibulaköpfchen links: kein motorisches Potential ableitbar – Läsionsort/.test(naP), naP);
    var naV = lies([["N. peroneus communis.L"], ["Tarsus", " ms", " mV", "M. extensor digitorum brevis-Tarsus", "", "80 mm", " m/s"]],
      [["N. suralis.R"], ["Crus", "2.5 ms", "3.0 ms", "12 µV", "Tarsus-Crus", "2.5 ms", "120 mm", "50 m/s"]]);
    fall("18.23: Viking-Reizung ohne Antwort (nur Distanz) → „kein motorisches Potential ableitbar“",
      /N\. peroneus communis links: kein motorisches Potential ableitbar/.test(B.zusammenfassung(naV)),
      B.zusammenfassung(naV));
    // 18.24 (Näd 17.10.): Überschriften „Neurografie(n):“ / „Myografie(n):“
    var zsU = B.zusammenfassung(kp3), zsN = B.zusammenfassung(naK);
    fall("18.24: Zusammenfassung beginnt mit „Neurografien:“ (mehrere Nerven), Myografie im Plural bei mehreren Muskeln",
      zsN.split("\n")[0] === "Neurografien:" && /(^|\n)Myografien:\n/.test(zsU) && !/Neurografie/.test(zsU), zsN.split("\n")[0]);
    var ein = { patient: {}, bloecke: [naK.bloecke[1]], myografie: [kp3.myografie[0]] };
    var zsE = B.zusammenfassung(ein);
    fall("18.24: Einzahl bei einem Nerv und einem Muskel („Neurografie:“, „Myografie:“)",
      zsE.split("\n")[0] === "Neurografie:" && /\nMyografie:\n/.test(zsE), zsE);
    var mb = String(TB.speicher.merkeBenutzt);
    fall("18.20: Benutzen schreibt den Baustein nie zurück (kein Hochladen, kein neuer Zeitstempel)",
      mb.indexOf("merkeOffen") === -1 && mb.indexOf("aktualisiertAm") === -1);
  } catch (e) {
    fall("ENMG-18.18-Prüfungen liefen durch", false, String(e && e.stack || e));
  }
  return f;
};
