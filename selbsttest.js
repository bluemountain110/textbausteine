// Datei: selbsttest.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die Selbsttest-Seite: prüft auf Knopfdruck das Rechnen
//        (Platzhalter-Auswertung mit festen, bekannten Antworten),
//        den Datenbestand (keine doppelte Kennung, kein doppeltes
//        Kürzel, kein Baustein ohne Titel), die Rundreise
//        (Export -> Import-Vorschau -> „0 neu“) und seit Etappe 2 den
//        Abgleich (Übersetzung verlustfrei, Warteschlange sauber).
//        Grün heisst bewiesen, Rot heisst Programmfehler — nie
//        „kommt darauf an“.
//        Die Prüfungen laufen über LISTEN, nicht über handgeschriebene
//        Aufzählungen: eine aufzählende Prüfung veraltet mit dem ersten
//        neuen Feld und schweigt dabei.

"use strict";
window.TB = window.TB || {};

TB.selbsttest = (function () {

  function pruefeRechnen() {
    var faelle = [];
    var fest = new Date(2026, 0, 15, 14, 5); // 15.01.2026, 14:05
    var umgebung = { jetzt: fest, datumsformat: "TT.MM.JJJJ",
                     konstanten: { "Untersucher": "Dr. Muster" } };

    function fall(name, text, antworten, erwartet) {
      var e = TB.makros.auswerten(text, antworten, umgebung);
      faelle.push({ name: name,
        ok: e.text === erwartet && e.fehler.length === 0,
        detail: e.fehler.length ? e.fehler.join("; ")
                : (e.text === erwartet ? "" : "erhalten: „" + e.text + "“, erwartet: „" + erwartet + "“") });
    }

    fall("Datum", "Heute ist {{Datum}}.", {}, "Heute ist 15.01.2026.");
    fall("Datum verschoben", "{{Datum+7}} / {{Datum-1}}", {}, "22.01.2026 / 14.01.2026");
    fall("Zeit", "Es ist {{Zeit}} Uhr.", {}, "Es ist 14:05 Uhr.");
    fall("Feld mit Antwort", "Kontrolle in {{Feld:Wochen=6}} Wochen.", { "Wochen": "12" }, "Kontrolle in 12 Wochen.");
    fall("Feld mit Vorgabe", "Kontrolle in {{Feld:Wochen=6}} Wochen.", {}, "Kontrolle in 6 Wochen.");
    fall("Auswahl", "Seite: {{Auswahl:Seite:rechts|links|beidseits}}", { "Seite": "links" }, "Seite: links");
    fall("Auswahl mit Schrägstrich", "Seite: {{Auswahl:Seite:rechts/links}}", { "Seite": "rechts" }, "Seite: rechts");
    fall("Gleiche Lücke zweimal", "{{Feld:Name}} und nochmals {{Feld:Name}}", { "Name": "A" }, "A und nochmals A");
    fall("Konstante", "Untersucher: {{Untersucher}}", {}, "Untersucher: Dr. Muster");
    fall("Cursor verschwindet", "vor{{Cursor}}nach", {}, "vornach");
    fall("Datumsformat", "{{Datum}}", {}, "15.01.2026");

    var unbekannt = TB.makros.auswerten("{{Gibtsnicht}}", {}, umgebung);
    faelle.push({ name: "Unbekannter Platzhalter wird gemeldet",
      ok: unbekannt.fehler.length === 1, detail: unbekannt.fehler.join("; ") });

    var analyse = TB.makros.analysiere(
      "{{Feld:A}} {{Feld:A}} {{Auswahl:B:x|y}} {{Datum}}",
      { konstanten: {} });
    faelle.push({ name: "Analyse: Lücken einmal je Beschriftung",
      ok: analyse.luecken.length === 2 && analyse.fehler.length === 0,
      detail: "gefunden: " + analyse.luecken.length + " Lücken, " +
              analyse.fehler.length + " Fehler" });
    return faelle;
  }

  function pruefeBestand() {
    var faelle = [];
    var alle = TB.speicher.laden().bausteine;
    var aktive = TB.speicher.alleAktiven();
    var fertige = TB.bausteine.alleFertigen();

    var ids = {}, doppelteId = 0;
    alle.forEach(function (b) { if (ids[b.id]) doppelteId++; ids[b.id] = true; });
    faelle.push({ name: "Keine doppelte Kennung", ok: doppelteId === 0,
                  detail: doppelteId ? doppelteId + " doppelt" : "" });

    var kuerzel = {}, doppelteK = [];
    aktive.forEach(function (b) {
      var k = (b.kuerzel || "").toLowerCase();
      if (!k) return;
      if (kuerzel[k]) doppelteK.push(k); kuerzel[k] = true;
    });
    faelle.push({ name: "Kein doppeltes Kürzel (aktive Bausteine)",
                  ok: doppelteK.length === 0, detail: doppelteK.join(", ") });

    var ohneTitel = fertige.filter(function (b) { return !(b.titel || "").trim(); }).length;
    faelle.push({ name: "Kein fertiger Baustein ohne Titel", ok: ohneTitel === 0,
                  detail: ohneTitel ? ohneTitel + " ohne Titel" : "" });

    var kaputtesDatum = alle.filter(function (b) {
      return b.geloeschtAm && isNaN(Date.parse(b.geloeschtAm)); }).length;
    faelle.push({ name: "Papierkorb-Daten lesbar", ok: kaputtesDatum === 0,
                  detail: kaputtesDatum ? kaputtesDatum + " unlesbar" : "" });

    var ohneStempel = alle.filter(function (b) {
      return isNaN(Date.parse(b.aktualisiertAm || "")); }).length;
    faelle.push({ name: "Jeder Baustein hat ein lesbares Änderungsdatum",
                  ok: ohneStempel === 0,
                  detail: ohneStempel ? ohneStempel + " ohne Datum" : "" });

    var st = TB.speicher.statistik();
    var stOk = st && typeof st.bausteine === "object" &&
               typeof st.funktionen === "object" && !!st.seit;
    faelle.push({ name: "Statistik-Zählung vorhanden und lesbar", ok: stOk,
                  detail: stOk ? "" : "Aufbau unerwartet" });

    // Etappe 4: Jeder fertige Baustein trägt seinen RTF-Vorrat für das
    // Windows-Skript — und der beginnt wie echtes RTF.
    var ohneRtf = fertige.filter(function (b) {
      return !(b.textRtf || "").length; }).length;
    var falschesRtf = fertige.filter(function (b) {
      return b.textRtf && b.textRtf.indexOf("{\\rtf1") !== 0; }).length;
    faelle.push({ name: "RTF-Vorrat: fertige Bausteine tragen ihr Druckformat",
                  ok: ohneRtf === 0 && falschesRtf === 0,
                  detail: (ohneRtf ? ohneRtf + " ohne RTF " : "") +
                          (falschesRtf ? falschesRtf + " unerwartet" : "") });
    return faelle;
  }

  function pruefeRundreise() {
    var ex = JSON.stringify(TB.speicher.exportObjekt());
    var v = TB.speicher.importVorschau(ex);
    var ok = !v.fehler && v.neu.length === 0 && v.zurueck.length === 0;
    return [{ name: "Rundreise: Export → Import-Vorschau → 0 neu",
      ok: ok,
      detail: v.fehler ? v.fehler :
        (v.neu.length + " neu, " + v.zurueck.length + " zurückzuholen, " +
         v.vorhanden.length + " vorhanden") }];
  }

  // ---- Abgleich ---------------------------------------------------------
  function pruefeAbgleich() {
    var faelle = [];

    // 1. Übersetzung App -> Datenablage -> App muss jedes Feld erhalten.
    var muster = {
      id: "11111111-2222-4333-8444-555555555555",
      titel: "Muster", kuerzel: "mu", kategorie: "Test",
      text: "Ein Text mit {{Datum}}", notiz: "Notiz",
      textRtf: "{\\rtf1\\ansi Probe}",
      varianten: { spital: "A" }, sortierung: 3, art: "text", entwurf: false,
      zuletztBenutztAm: "2026-09-13T10:00:00.000Z",
      erstelltAm: "2026-09-01T08:00:00.000Z",
      aktualisiertAm: "2026-09-13T10:00:00.000Z",
      geloeschtAm: null
    };
    var zurueck = TB.abgleich.nachApp(TB.abgleich.nachAblage(muster, "benutzer-1"));
    var fehlende = Object.keys(muster).filter(function (f) {
      return JSON.stringify(zurueck[f]) !== JSON.stringify(muster[f]); });
    faelle.push({ name: "Übersetzung zur Datenablage und zurück verlustfrei",
      ok: fehlende.length === 0,
      detail: fehlende.length ? "abweichend: " + fehlende.join(", ") : "" });

    // 2. In der Warteschlange darf nichts stehen, das es nicht gibt.
    var geister = TB.speicher.offeneBausteine().filter(function (id) {
      return !TB.speicher.holen(id); });
    faelle.push({ name: "Warteschlange enthält nur vorhandene Bausteine",
      ok: geister.length === 0, detail: geister.length ? geister.length + " verwaist" : "" });

    // 3. Dasselbe für offene Entscheidungen.
    var k = TB.speicher.konflikte();
    var kGeister = k.filter(function (x) { return !x.id || !x.eigen || !x.fremd; });
    faelle.push({ name: "Offene Entscheidungen vollständig",
      ok: kGeister.length === 0,
      detail: k.length ? k.length + " offen" : "keine offen" });

    // 4. Zugangsdaten: ohne sie wird nie abgeglichen.
    var ein = TB.wolke.eingerichtet();
    faelle.push({ name: "Zugangsdaten dieser Welt eingetragen", ok: ein,
      detail: ein ? TB.speicher.WELT : "konfiguration.js ausfüllen" });

    // 5. Anmeldung — ein Hinweis, kein Fehler: ohne Netz ist das normal.
    faelle.push({ name: "Anmeldung auf diesem Gerät", ok: true,
      detail: TB.wolke.angemeldet() ? (TB.wolke.benutzerMail() || "angemeldet")
                                    : "nicht angemeldet (die App arbeitet trotzdem)" });
    return faelle;
  }

  function alleTests() {
    return [].concat(
      pruefeRechnen().map(function (f) { f.gruppe = "Rechnen"; return f; }),
      pruefeBestand().map(function (f) { f.gruppe = "Datenbestand"; return f; }),
      pruefeRundreise().map(function (f) { f.gruppe = "Rundreise"; return f; }),
      pruefeAbgleich().map(function (f) { f.gruppe = "Abgleich"; return f; })
    );
  }

  function bericht(ergebnisse) {
    function z(n) { return (n < 10 ? "0" : "") + n; }
    var d = new Date();
    var zeilen = [
      "TEXTBAUSTEINE SELBSTTEST — " + TB.speicher.geraet() +
      " — Welt: " + TB.speicher.WELT + " — Fassung " + TB.FASSUNG,
      "Zeitpunkt: " + d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) +
      " " + z(d.getHours()) + ":" + z(d.getMinutes()) + ":" + z(d.getSeconds()),
      ""
    ];
    var gruppe = "";
    ergebnisse.forEach(function (f) {
      if (f.gruppe !== gruppe) { gruppe = f.gruppe; zeilen.push("— " + gruppe + " —"); }
      zeilen.push((f.ok ? "GRÜN  " : "ROT   ") + f.name + (f.detail ? "  [" + f.detail + "]" : ""));
    });
    var rot = ergebnisse.filter(function (f) { return !f.ok; }).length;
    zeilen.push("");
    zeilen.push("Ergebnis: " + (ergebnisse.length - rot) + " grün, " + rot + " rot.");
    return zeilen.join("\n");
  }

  return { alleTests: alleTests, bericht: bericht };
})();
