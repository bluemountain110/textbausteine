// Datei: selbsttest.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die Selbsttest-Seite: prüft auf Knopfdruck das Rechnen
//        (Platzhalter-Auswertung mit festen, bekannten Antworten),
//        den Datenbestand (keine doppelte Kennung, kein doppeltes
//        Kürzel, kein Baustein ohne Titel), die Rundreise
//        (Export -> Import-Vorschau -> „0 neu“) und seit Etappe 2 den
//        Abgleich (Übersetzung verlustfrei, Warteschlange sauber) und
//        seit Etappe 7 die Tabellen (Lesen, Reinigen, reiner Text,
//        RTF-Erzeugung, Rundreise, Symbolschrift-Häkchen, verbundene Zellen).
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

  // ---- Tabellen (Etappe 7) ----------------------------------------------
  // Reine Funktions-Prüfungen ohne Wegwerf-Baustein: Lesen, Reinigen,
  // reiner Text, RTF-Erzeugung und die Rundreise Lesen→Erzeugen→Lesen.
  function pruefeTabellen() {
    var faelle = [];
    var A = TB.auszeichnung, L = TB.rtfLesen;
    function fall(name, ok, detail) {
      faelle.push({ name: name, ok: !!ok, detail: ok ? "" : String(detail || "") });
    }
    var probe = '<table><tr><th>Kopf</th><td style="width:30%">A</td></tr>' +
                '<tr><td>{{Feld:Wert}}</td><td>B<br>C</td></tr></table>';
    try {
      var rein = A.reinige('<table><tr><td style="font-family:Times">X</td>' +
                           '</tr></table>').innerHTML;
      fall("Reinigen: Tabelle bleibt, fremde Schrift in der Zelle nicht",
           /<table/.test(rein) && !/font-family/.test(rein), rein);
      var text = A.reinerText(probe);
      fall("Reiner Text: Zellen per Tabulator, Zeilen per Umbruch",
           text.indexOf("Kopf\tA") >= 0 && /\n\{\{Feld:Wert\}\}\t/.test("\n" + text),
           JSON.stringify(text));
      var rtf = A.ausHtml(probe);
      fall("RTF: 2 Zeilen, 4 Zellen, Ränder, rechte Kante",
           (rtf.match(/\\trowd/g) || []).length === 2 &&
           (rtf.match(/\\cell /g) || []).length === 4 &&
           /\\clbrdrl\\brdrw15\\brdrs/.test(rtf) && /\\cellx9214/.test(rtf),
           rtf.slice(0, 200));
      fall("RTF: Platzhalter reist durch die Zelle",
           rtf.indexOf("\\{\\{Feld:Wert\\}\\}") >= 0, rtf.slice(0, 200));
      var zurueck = L.lies(rtf);
      fall("Rundreise: Zeilen und Zellen unverändert, Kopfzeile fett",
           (zurueck.match(/<tr>/g) || []).length === 2 &&
           (zurueck.match(/<td/g) || []).length === 4 &&
           /<b>Kopf<\/b>/.test(zurueck), zurueck);
      var symbol = L.lies("{\\rtf1\\ansi\\ansicpg1252\\deff0{\\fonttbl" +
        "{\\f0\\fnil Arial;}{\\f1\\fnil KisIconPhysio1;}}\\viewkind4\\uc1 " +
        "\\pard\\f0 vor {\\f1 !} und \\u8730? nach\\par }");
      fall("Symbolschrift: ! wird \u00F8, Wurzelzeichen wird \u2713",
           /\u2713|&#10003;/.test(symbol) && /\u00F8|&#248;/.test(symbol) &&
           symbol.indexOf("!") === -1 && !/KisIcon/i.test(symbol) &&
           !/\u221A|&#8730;/.test(symbol), symbol);
      var fett = L.lies("{\\rtf1\\ansi\\ansicpg1252\\deff0{\\fonttbl" +
        "{\\f0\\fnil Arial;}}\\viewkind4\\uc1 \\trowd\\cellx4000\\cellx8000" +
        "\\pard\\intbl\\b eins\\cell\\pard\\intbl zwei\\cell\\row\\pard\\par }");
      fall("Fett läuft über den Absatzwechsel weiter (\\pard löscht es nicht)",
           /<b>eins<\/b>/.test(fett) && /<b>zwei<\/b>/.test(fett), fett);
      var verbund = '<table><tr><td rowspan="2">Hoch</td><td>B</td>' +
        '<td>C</td></tr><tr><td colspan="2">Breit</td></tr></table>';
      var vRtf = A.ausHtml(verbund);
      var vZurueck = L.lies(vRtf);
      fall("Verbundene Zellen: hohe Zelle als \\clvmgf/\\clvmrg, Rundreise heil",
           /\\clvmgf/.test(vRtf) && /\\clvmrg/.test(vRtf) &&
           /rowspan="2"/.test(vZurueck) && /colspan="2"/.test(vZurueck) &&
           (vZurueck.match(/<td/g) || []).length === 4, vRtf + " | " + vZurueck);
      var analyse = TB.reichtext.pruefe(probe, TB.einstellungen.makroUmgebung());
      fall("Platzhalter-Prüfung sieht in die Zellen (keine Fehler, 1 Lücke)",
           analyse.fehler.length === 0 && analyse.luecken.length === 1,
           analyse.fehler.join(" "));
    } catch (e) {
      fall("Tabellen-Prüfung läuft ohne Fehler", false, String(e));
    }
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

  // Etappe 6: Standort-Fassungen — mit einem WEGWERF-Baustein, der nach
  // der Prüfung sofort endgültig entfernt wird (er verlässt das Gerät
  // nie: erst nach dem Test würde der Abgleich angestossen).
  function pruefeVarianten() {
    var faelle = [];
    var S = TB.speicher, B = TB.bausteine;
    var kennung = S.neueKennung();
    var b = S.speichern({ id: kennung, titel: "Selbsttest Variante",
      kuerzel: "", kategorie: "Selbsttest",
      text: "Standard {{Datum}}",
      varianten: { "Spital Limmattal": { text: "Spitalfassung {{Datum}}" } } });
    try {
      var fS = B.fassungFuer(b, "Spital Limmattal");
      faelle.push({ name: "Standort mit eigener Fassung bekommt sie",
        ok: fS.variante === "Spital Limmattal" && /Spitalfassung/.test(fS.text),
        detail: fS.variante || "Standard geliefert" });
      var fP = B.fassungFuer(b, "Praxis Neuromed");
      faelle.push({ name: "Standort OHNE eigene Fassung bekommt die Standardfassung",
        ok: fP.variante === null && /Standard/.test(fP.text),
        detail: fP.variante || "" });
      var fO = B.fassungFuer(b, "");
      faelle.push({ name: "Gerät ohne Standort bekommt die Standardfassung",
        ok: fO.variante === null && /Standard/.test(fO.text), detail: "" });
      var frisch = S.holen(kennung);
      var v = frisch.varianten["Spital Limmattal"];
      faelle.push({ name: "Standort-Fassung hat beim Speichern ihr RTF bekommen",
        ok: !!(v && v.textRtf), detail: v && v.textRtf ? "" : "textRtf fehlt" });
      var treffer = B.suche("Spitalfassung", "").some(function (x) {
        return x.id === kennung; });
      faelle.push({ name: "Suche findet Text in Standort-Fassungen",
        ok: treffer, detail: treffer ? "" : "nicht gefunden" });
      var ex = S.exportObjekt();
      var mit = ex.bausteine.some(function (x) {
        return x.id === kennung && x.varianten &&
               x.varianten["Spital Limmattal"]; });
      faelle.push({ name: "Export nimmt Standort-Fassungen mit",
        ok: mit, detail: mit ? "" : "varianten fehlen im Export" });
    } finally {
      S.endgueltigLoeschen([kennung]);
    }
    var idee = S.speichern({ id: S.neueKennung(), art: "idee",
      titel: "Selbsttest Idee", text: "nur ein Test" });
    var unsichtbar = !TB.bausteine.alleFertigen().some(function (x) {
      return x.id === idee.id; });
    S.endgueltigLoeschen([idee.id]);
    faelle.push({ name: "Ideen erscheinen nie in der Bausteinliste",
      ok: unsichtbar, detail: unsichtbar ? "" : "Idee in der Liste!" });
    return faelle;
  }

  // ---- Masken (Etappe 8) ----------------------------------------------
  // Dieselben Fälle laufen in der Prüfsuite (Node) und hier in der App —
  // die stille Logik wird nie nur "auf Sicht" geliefert.
  function pruefeMasken() {
    var faelle = [];
    var M = TB.masken;
    function fall(name, ok, detail) {
      faelle.push({ name: name, ok: !!ok, detail: ok ? "" : String(detail || "") });
    }
    var maske = "<p>Seite {{Auswahl:Seite:rechts|links|beidseits}}." +
      " {{Ankreuz:Phalen=Der Phalen-Test ist positiv.}}</p>" +
      "<p>{{Wenn:Atrophie}}Es besteht eine Atrophie.{{Ende}}" +
      "{{WennNicht:Atrophie}}Kein Hinweis auf eine Atrophie.{{Ende}}</p>" +
      "<p>{{Wenn:Seite=beidseits}}Beidseitiger Befund.{{Ende}}</p>";
    var a = M.analysiere(maske);
    fall("Maske erkannt, Kästchen gefunden",
      a.istMaske && a.kaestchen.length === 2,
      a.kaestchen.map(function (k) { return k.name; }).join(","));
    fall("Fehlendes {{Ende}} wird gemeldet",
      M.analysiere("<p>{{Wenn:X}}offen</p>").fehler.length === 1);
    fall("{{Wenn:Name=Wert}} ohne Auswahl wird gemeldet",
      M.analysiere("<p>{{Wenn:Seite=rechts}}x{{Ende}}</p>").fehler.length === 1);
    var an = M.wendeAn(maske, { kaestchen: { Phalen: true, Atrophie: false },
      antworten: { Seite: "rechts" }, texte: {} }, []).html;
    fall("Abgewählter Abschnitt fällt, WennNicht springt ein",
      an.indexOf("Es besteht") === -1 && an.indexOf("Kein Hinweis") !== -1, an);
    fall("Ankreuz-Lücke erscheint mit ihrem Text",
      an.indexOf("Der Phalen-Test ist positiv.") !== -1, an);
    var ue = M.wendeAn(maske, { kaestchen: { Phalen: true, Atrophie: true },
      antworten: { Seite: "beidseits" },
      texte: { Phalen: "Der Phalen-Test ist beidseits positiv." } }, []).html;
    fall("Überschriebener Text und Wenn=Wert wirken",
      ue.indexOf("beidseits positiv") !== -1 &&
      ue.indexOf("Beidseitiger Befund.") !== -1, ue);
    var heil = M.wendeAn("<p>A {{Wenn:X}}weg{{Ende}}.</p>",
      { kaestchen: { X: false }, antworten: {}, texte: {} }, []).html;
    fall("Heilung: kein Leerzeichen vor dem Punkt",
      heil.indexOf("A.") !== -1 && heil.indexOf(" .") === -1, heil);
    var stoss = M.wendeAn(
      "<p>{{Ankreuz:A=Satz eins.}}{{Ankreuz:B=Der zweite folgt.}}</p>",
      { kaestchen: { A: true, B: true }, antworten: {}, texte: {} }, []).html;
    fall("Heilung: Abstand zwischen zwei Sätzen aus zwei Stücken",
      stoss.indexOf("eins. Der") !== -1, stoss);
    var kat = M.wendeAn("<p>{{Aus Kategorie:Status}}</p>",
      { kaestchen: {}, antworten: {}, texte: {} }, ["<b>Inhalt A.</b>"]).html;
    fall("Kategorie-Inhalt steht an seinem Platz",
      kat.indexOf("<b>Inhalt A.</b>") !== -1, kat);
    var spiegel = M.textAnwenden("A {{Wenn:X}}weg{{Ende}}.",
      { kaestchen: { X: false }, antworten: {}, texte: {} });
    fall("Text-Spiegel rechnet gleich (fürs Windows-Skript)",
      spiegel === "A.", spiegel);
    function rtfBau(k) {
      return "{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang2055" +
        "{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}" +
        "\\viewkind4\\uc1 \\pard\\f0\\fs20 " + k + "}";
    }
    var gut = rtfBau("\\{\\{Wenn:X\\}\\}{\\b fett} a\\{\\{Ende\\}\\}");
    var boese = rtfBau("{\\b fett \\{\\{Wenn:X\\}\\} b} c \\{\\{Ende\\}\\}");
    fall("RTF-Prüfung: ganze Abschnitte bestehen",
      M.rtfTauglich(gut).ok, M.rtfTauglich(gut).fehler.join("|"));
    fall("RTF-Prüfung: zerschnittene Formatierung wird gemeldet",
      !M.rtfTauglich(boese).ok);
    return faelle;
  }

  function alleTests() {
    return [].concat(
      pruefeRechnen().map(function (f) { f.gruppe = "Rechnen"; return f; }),
      pruefeBestand().map(function (f) { f.gruppe = "Datenbestand"; return f; }),
      pruefeRundreise().map(function (f) { f.gruppe = "Rundreise"; return f; }),
      pruefeTabellen().map(function (f) { f.gruppe = "Tabellen"; return f; }),
      pruefeAbgleich().map(function (f) { f.gruppe = "Abgleich"; return f; }),
      pruefeVarianten().map(function (f) { f.gruppe = "Standort-Fassungen"; return f; }),
      pruefeMasken().map(function (f) { f.gruppe = "Masken"; return f; })
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
