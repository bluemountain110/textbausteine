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

    fall("Fragestellung „Kompressionsneuropathie der Armnerven?“ → CTS + Sulcus ulnaris",
      B.fragenAusText("Polyneuropathie? Kompressionsneuropathie der Armnerven?").join(",") === "pnp,cts,sus");
    var sp = TB.enmg.spalten(mot[0]).map(function (s) { return s.feld; }).join(",");
    fall("Spalten Viking motorisch: mit Fläche Δ und Abstand, ohne Dauer",
      sp === "segment,lat,amp,areaDiff,abstand,nlg,fLat", sp);
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
