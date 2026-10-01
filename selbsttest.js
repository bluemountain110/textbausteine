// Datei: selbsttest.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die Selbsttest-Seite: prüft auf Knopfdruck das Rechnen
//        (Platzhalter-Auswertung mit festen, bekannten Antworten),
//        den Datenbestand (keine doppelte Kennung, kein doppeltes
//        Kürzel, kein Baustein ohne Titel), die Rundreise
//        (Export -> Import-Vorschau -> „0 neu“) und seit Etappe 2 den
//        Abgleich (Übersetzung verlustfrei, Warteschlange sauber) und
//        seit Etappe 7 die Tabellen (Lesen, Reinigen, reiner Text,
//        RTF-Erzeugung, Rundreise, Symbolschrift-Häkchen, verbundene Zellen)
//        und seit Etappe 9 das Status-Werk (Grundlage, Fliesstext,
//        Tardoc-Zählung) und den Bericht Memory Clinic (Zerlegen).
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
    var kProbe = document.createElement("div");
    kProbe.innerHTML = "<p>A {{Feld:Grund=X}} <b>f</b> " +
      "{{Wenn:Y}}drin {{Ankreuz:Z=Satz.}}{{Ende}} {{Unbekannt:Q}}</p>";
    var kSoll = kProbe.innerHTML;
    TB.kaertchen.schmueckeElement(kProbe);
    var keineKlammern = kProbe.textContent.indexOf("{{") === -1;
    var kZurueck = TB.kaertchen.entHtml(kProbe);
    fall("Kärtchen: Rundreise verlustfrei, Klammern unsichtbar",
      keineKlammern && kZurueck === kSoll, kZurueck);
    fall("Kärtchen: unbekannter Platzhalter überlebt als Rohform",
      kZurueck.indexOf("{{Unbekannt:Q}}") !== -1, kZurueck);
    fall("RTF-Prüfung: zerschnittene Formatierung wird gemeldet",
      !M.rtfTauglich(boese).ok);
    return faelle;
  }

  // ---- Status-Werk (Etappe 9) ----------------------------------------
  // Geprüft wird die GRUNDAUSSTATTUNG (feste, bekannte Daten) — nicht
  // Näds bearbeitete Fassung. Strukturprüfungen laufen über die Listen,
  // damit sie mit jeder neuen Untersuchung von selbst mitwachsen.
  function pruefeStatus() {
    var faelle = [];
    var m = TB.statusGrundlage.master();
    var teilmengen = TB.statusGrundlage.teilmengen();
    var katIds = {}, uIds = {}, doppelt = [], fremdKat = [], leerText = [];
    m.kategorien.forEach(function (k) { katIds[k.id] = true; });
    m.untersuchungen.forEach(function (u) {
      if (uIds[u.id]) doppelt.push(u.id);
      uIds[u.id] = true;
      if (!katIds[u.kategorie]) fremdKat.push(u.id);
      if (!u.name || !u.normal) leerText.push(u.id);
    });
    faelle.push({ name: "Kennungen eindeutig", ok: !doppelt.length,
      detail: doppelt.join(", ") });
    faelle.push({ name: "Jede Untersuchung hat ihre Kategorie",
      ok: !fremdKat.length, detail: fremdKat.join(", ") });
    faelle.push({ name: "Name und Normalbefund überall gefüllt",
      ok: !leerText.length, detail: leerText.join(", ") });
    var blind = [];
    teilmengen.forEach(function (t) {
      t.punkte.forEach(function (p) {
        if (!uIds[p]) blind.push(t.name + ":" + p); });
    });
    faelle.push({ name: "Alle Status-Muster zeigen auf Vorhandenes",
      ok: !blind.length, detail: blind.join(", ") });
    var schief = [];
    m.untersuchungen.forEach(function (u) {
      (u.tardoc || []).forEach(function (e) {
        var art = TB.tardocDaten.arten[e.a];
        if (!art || !art.gruppen[e.g]) schief.push(u.id);
        else if (!(e.m && e.m.length) && !e.muskeln) schief.push(u.id);
      });
    });
    faelle.push({ name: "Tardoc-Etiketten gültig", ok: !schief.length,
      detail: schief.join(", ") });

    var leerF = TB.status.fliesstext(m, {}, {});
    faelle.push({ name: "Leere Auswahl ergibt leeren Text",
      ok: leerF.text === "" && leerF.html === "", detail: leerF.text });
    var f = TB.status.fliesstext(m, { meningismus: true },
      { meningismus: "angedeutet endgradig" });
    faelle.push({ name: "Fliesstext: Kategorie unterstrichen, Punkt ergänzt",
      ok: f.html.indexOf("<u>Kopf und Hirnnerven:</u>") !== -1 &&
          f.text === "Kopf und Hirnnerven: Meningismus: angedeutet endgradig.",
      detail: f.text });
    faelle.push({ name: "Fliesstext: Abweichung fett in Dunkelgrau",
      ok: f.html.indexOf("<b><span style=\"color:#444444\">") !== -1,
      detail: f.html.slice(0, 120) });
    var teilA = "radial 8/8, patellär 8/8, malleolär 8/8, Grosszehengrundgelenk 8/8.";
    var teilB = "radial 8/8, patellär 8/8, malleolär 4/6, Grosszehengrundgelenk 8/8.";
    var d = TB.status.wortUnterschied(teilA, teilB);
    faelle.push({ name: "Teil-Hervorhebung: nur der veränderte Wortbereich",
      ok: d.mitte === "malleolär 4/6," && d.vor.indexOf("patellär") !== -1 &&
          d.nach.indexOf("Grosszehengrundgelenk") !== -1,
      detail: JSON.stringify(d.mitte) });
    var fT = TB.status.fliesstext(m, { pallaesthesie: true },
      { pallaesthesie: teilB });
    var uk = m.untersuchungen.find(function (x) {
      return x.id === "kraftarme"; });
    var wahlAb = { kraftarme: { pect: true, daumopp: true } };
    var nv = TB.status.normalVon(uk, wahlAb);
    faelle.push({ name: "Einzelmuskeln: Text nennt nur die Gewählten",
      ok: nv.indexOf("Mm. pectorales") === -1 &&
          nv.indexOf("Daumenopposition") === -1 &&
          nv.indexOf("Arminnenrotation M5/M5") === 0,
      detail: nv.slice(0, 90) });
    faelle.push({ name: "Einzelmuskeln: alle an ergibt den unveränderten Volltext",
      ok: TB.status.normalVon(uk, {}) === uk.normal, detail: "" });
    var alleAb = {}; uk.merkmale.forEach(function (mk) { alleAb[mk.id] = true; });
    faelle.push({ name: "Einzelmuskeln: alle ab ergibt xx.",
      ok: TB.status.normalVon(uk, { kraftarme: alleAb }) === "xx.",
      detail: "" });
    var abBis3 = {}; uk.merkmale.forEach(function (mk, i) {
      if (i >= 3) abBis3[mk.id] = true; });
    var td3 = TB.status.tardoc(m, { kraftarme: true },
      { kraftarme: abBis3 });
    faelle.push({ name: "Einzelmuskeln: Tardoc zählt nur die Gewählten",
      ok: td3.neuro.gruppen[3].ist === 3 && !td3.neuro.gruppen[3].erfuellt,
      detail: JSON.stringify(td3.neuro.gruppen[3]) });
    var vorher = JSON.parse(JSON.stringify(TB.status.teilmengen()));
    TB.status.teilmengeSpeichern("Selbsttest-Muskeln", ["kraftarme"],
      { kraftarme: ["pect", "daumopp"] });
    var ts2 = TB.status.teilmengen().find(function (t) {
      return t.name === "Selbsttest-Muskeln"; });
    faelle.push({ name: "Eigener Status trägt die Muskel-Auswahl",
      ok: !!ts2 && !!ts2.merkmalAb &&
          ts2.merkmalAb.kraftarme.join(",") === "pect,daumopp",
      detail: JSON.stringify(ts2 && ts2.merkmalAb) });
    TB.status.speichereTeilmengen(vorher);
    var altKatalog = { untersuchungen: [
      { id: "kraftarme", kategorie: "motorik", name: uk.name,
        normal: "keine Defizite; im Einzelnen: " + uk.normal,
        haeufig: true, tardoc: [] }] };
    var migriert = TB.status.migriereMerkmale(altKatalog);
    faelle.push({ name: "Alter Katalog: Einzelmuskeln und neuer Text nachgezogen",
      ok: migriert === true &&
          altKatalog.untersuchungen[0].merkmale.length === uk.merkmale.length &&
          altKatalog.untersuchungen[0].normal === uk.normal,
      detail: altKatalog.untersuchungen[0].normal.slice(0, 60) });
    // ---- Sammelrunde 15.16: Näds Katalog-Wünsche und Tardoc-Prüfung ----
    var ids16 = {}; m.untersuchungen.forEach(function (x) { ids16[x.id] = x; });
    faelle.push({ name: "Katalog 30.9.: Aufteilungen da (Weber/Rinne, Würgereflex, Lasègue, Kernig/Brudzinski, Proximale Prüfung, FNV, Sprache)",
      ok: !!(ids16.weber && ids16.rinne && ids16.wuergreflex && ids16.lasegueumgekehrt &&
             ids16.brudzinski && ids16.aufstehenhocke && ids16.einbeinhuepfen &&
             ids16.trendelenburg && ids16.ffv && ids16.fnfv && ids16.nachsprechen &&
             ids16.aufforderungen && ids16.mer) &&
          !ids16.weberrinne && !ids16.proximal && !ids16.merarme && !ids16.merbeine &&
          ids16.aufstehenhocke.kategorie === "gang" &&
          ids16.mer.normal.indexOf("BSR") < ids16.mer.normal.indexOf("PSR"),
      detail: "" });
    faelle.push({ name: "Kraftprüfung: Kleinfingeropposition am Schluss; Zehen II–V und Zehenflexion vor Eversion/Inversion",
      ok: ids16.kraftarme.merkmale[ids16.kraftarme.merkmale.length - 1].name === "Kleinfingeropposition" &&
          ids16.kraftbeine.merkmale.map(function (x) { return x.id; }).slice(-5).join(",") === "gzheb,zehheb,zehflex,eversion,inversion",
      detail: ids16.kraftbeine.merkmale.map(function (x) { return x.id; }).join(",") });
    var tdB = TB.status.tardoc(m, { mer: true, babinski: true, kloni: true });
    faelle.push({ name: "Tardoc: Babinski/Kloni zählen nicht als zweites Reflex-Merkmal",
      ok: tdB.neuro.gruppen[2].ist === 1 && !tdB.neuro.gruppen[2].erfuellt,
      detail: JSON.stringify(tdB.neuro.gruppen[2]) });
    var tdR = TB.status.tardoc(m, { belastungstest: true });
    faelle.push({ name: "Tardoc: eine Muskelausdauerbelastung erfüllt den Muskelstatus allein",
      ok: tdR.neuro.gruppen[3].erfuellt === true, detail: JSON.stringify(tdR.neuro.gruppen[3]) });
    var tdH = TB.status.tardoc(m, { groessegewicht: true, blutdruckpuls: true });
    faelle.push({ name: "Tardoc: Grösse/Gewicht und Blutdruck/Puls zählen auch beim Hirnnerven-Allgemeinstatus",
      ok: tdH.hirn.gruppen[0].erfuellt === true, detail: JSON.stringify(tdH.hirn.gruppen[0]) });
    var tdS = TB.status.tardoc(m, { schnauzreflex: true, palmomental: true });
    faelle.push({ name: "Tardoc: Schnauzreflex nur bei den Hirnnerven, nicht bei Neuro-Primitivreflexen",
      ok: tdS.neuro.gruppen[11].ist === 1, detail: JSON.stringify(tdS.neuro.gruppen[11]) });
    var tmTest = [{ id: "x", name: "x", punkte: ["weberrinne", "merarme", "merbeine", "az"],
                    merkmalAb: { weberrinne: ["a"] } }];
    var um = TB.status.umschluessle(tmTest);
    faelle.push({ name: "Umstellung: eigene Status zeigen danach auf die aufgeteilten Untersuchungen",
      ok: um === true && tmTest[0].punkte.join(",") === "weber,rinne,mer,az" && !tmTest[0].merkmalAb.weberrinne,
      detail: tmTest[0].punkte.join(",") });
    faelle.push({ name: "Grundausstattung trägt die Katalog-Kennung (Umstellung greift nur einmal)",
      ok: m.stand === TB.statusGrundlage.KATALOG_STAND, detail: String(m.stand) });
    var ohneNeue = TB.statusGrundlage.master();
    ohneNeue.untersuchungen = ohneNeue.untersuchungen.filter(function (x) {
      return x.id !== "uhrentest" && x.id !== "affekt"; });
    var nachgezogen = TB.status.migriereNeue(ohneNeue);
    faelle.push({ name: "Katalog-Ausbau: neue Untersuchungen werden nachgezogen",
      ok: nachgezogen === true &&
          ohneNeue.untersuchungen.length ===
            TB.statusGrundlage.master().untersuchungen.length &&
          ohneNeue.untersuchungen.some(function (x) {
            return x.id === "uhrentest"; }) &&
          TB.status.migriereNeue(ohneNeue) === false,
      detail: String(ohneNeue.untersuchungen.length) });
    var kr = TB.status.tardocKriterien();
    var alleGruppen = kr[0].gruppen.length === 15 && kr[1].gruppen.length === 10;
    faelle.push({ name: "Tardoc-Nachlese: beide Positionen, alle Gruppen, Original-Links",
      ok: kr.length === 2 && alleGruppen &&
          kr[0].zeileB.indexOf("bis zu 3") !== -1 &&
          kr[0].zeileA.indexOf("MP.00.0040") !== -1 &&
          kr[0].linkB.indexOf("browser.tartools.ch/de/lkaat/data/L/MP.00.0020") !== -1 &&
          kr[0].linkB.indexOf("MP.00.0020") !== -1 &&
          kr[1].gruppen[9].merkmale.indexOf("Synophrys") !== -1,
      detail: JSON.stringify([kr[0].gruppen.length, kr[1].gruppen.length]) });
    faelle.push({ name: "Teil-Hervorhebung im Fliesstext: Name bleibt normal",
      ok: fT.html.indexOf("color:#444444\">malleolär 4/6,</span></b>") !== -1 &&
          fT.html.indexOf("Pallästhesie") <
          fT.html.indexOf("<b><span"),
      detail: fT.html.slice(0, 200) });

    var wahl = {};
    ["az", "vigilanz", "kooperation", "haendigkeit",
     "beruehrung", "pallaesthesie", "fnv", "khv", "diadochokinese"]
      .forEach(function (id) { wahl[id] = true; });
    var t = TB.status.tardoc(m, wahl);
    faelle.push({ name: "Tardoc: feste Auswahl ergibt Neurostatus A",
      ok: t.neuro.stufe === "A" && t.neuro.erfuellte === 4,
      detail: t.neuro.stufe + " mit " + t.neuro.erfuellte + " Gruppen" });
    faelle.push({ name: "Tardoc: dieselbe Auswahl ergibt Hirnnerven B",
      ok: t.hirn.stufe === "B",
      detail: t.hirn.stufe + " mit " + t.hirn.erfuellte + " Gruppen" });
    var t0 = TB.status.tardoc(m, {});
    faelle.push({ name: "Tardoc: leere Auswahl ergibt keine Stufe",
      ok: t0.neuro.stufe === "–" && t0.hirn.stufe === "–",
      detail: t0.neuro.stufe + "/" + t0.hirn.stufe });
    return faelle;
  }

  // ---- Bericht Memory Clinic (Etappe 9): Zerlegen mit fester Antwort --
  function pruefeBerichtMc() {
    var faelle = [];
    var probe = "Konsultationsgrund\nDemenzabklärung\n\nSozialanamnese\nVerheiratet, keine Kinder.\n\nKrankheitsanamnese\nSchädelbruch mit drei Jahren.\n\nSystemanamnese\nNikotin: nihil.\n\nIQCODE (Fragebogen): Der IQCODE-Score beträgt 3.12, was unterhalb des Cut-offs liegt.\n\nDie IADL-Skala ergab einen Scorewert von 8/8.\n\nKognitive und funktionelle Leistung (formal): CDR 0,5.\n";
    var z = TB.ansichtBerichtMc.zerlege(probe);
    faelle.push({ name: "Zerlegen: Krankheitsanamnese wird Persönliche Anamnese",
      ok: z.abschnitte.persoenlich === "Schädelbruch mit drei Jahren." &&
          z.abschnitte.sozial === "Verheiratet, keine Kinder." &&
          z.abschnitte.system === "Nikotin: nihil.",
      detail: JSON.stringify(z.abschnitte) });
    faelle.push({ name: "Zerlegen: fehlende Abschnitte werden gemeldet",
      ok: z.fehlend.indexOf("Familienanamnese") !== -1 &&
          z.fehlend.indexOf("Sozialanamnese") === -1,
      detail: z.fehlend.join(", ") });
    faelle.push({ name: "Scores: IQCODE, IADL und CDR aus dem Text gelesen",
      ok: z.scores.iqcode === "3.12" && z.scores.iadl === "8/8" &&
          z.scores.cdr === "0.5",
      detail: JSON.stringify(z.scores) });
    var an = TB.ansichtBerichtMc.bauAnamnese(z,
      { geschlecht: "w", erscheinen: "allein", begleitText: "", kompetenz: 1 });
    faelle.push({ name: "Anamnese-Feld: Überschriften unterstrichen, fehlende Abschnitte weggelassen, Abstände dazwischen",
      ok: an.html.indexOf("<u>Persönliche Anamnese</u>") !== -1 &&
          an.html.indexOf("Familienanamnese") === -1 &&
          (an.html.match(/<p><br><\/p>/g) || []).length >= 3,
      detail: "" });
    var un = TB.ansichtBerichtMc.bauUntersuchungen(z);
    faelle.push({ name: "Untersuchungen-Feld: Scores eingesetzt",
      ok: un.text.indexOf("Lawton und Brody: 8/8 Punkte.") !== -1 &&
          un.text.indexOf(": 3.12 (Cut-off") !== -1,
      detail: "" });
    faelle.push({ name: "Demenz-Scores als ECHTE Liste (4 li); leere Zeilen und LP weggelassen; unterstrichen bis und mit Ort-Klammer",
      ok: un.text.indexOf("\u2022 IQCODE") !== -1 &&
          un.text.indexOf("\u2022 CDR-Skala") !== -1 &&
          (un.html.match(/<li>/g) || []).length === 4 &&
          un.html.indexOf("<ul>") !== -1 &&
          un.html.indexOf("Amyloid-PET") === -1 &&
          un.html.indexOf("FDG-PET") === -1 &&
          un.html.indexOf("Standard-EEG") === -1 &&
          un.html.indexOf("<p><br></p>") !== -1 &&
          un.html.indexOf(" (Spital Limmattal und Viollier)</u>: Unauffällig") !== -1 &&
          un.html.indexOf("Lumbalpunktion") === -1 &&
          un.html.indexOf(":</u") === -1,
      detail: "" });
    var medTab = "Aktuelle Medikation\nMedikamentennameWirkstoff\t*\tMo\tMi\tAb\tNa\tEinheit\tAnw.Art\tBemerkung\t\n" +
      "ALDACTONE Tabl 50 mgSpironolacton 50 mg\t\t1\t\t\t\tStk\tp.o.\t\t\n" +
      "BISOPROLOL Mepha Tabl 2.5 mg 30 StkBisoprolol fumarat 2.5 mg\t\t\u00bd\t\t\t\tStk\tp.o.\t\t\n" +
      "TORASEMID Sandoz eco Tabl 10 mgTorasemid 10 mg\t\t1\t\u00bd\t\t\tStk\tp.o.\tPausiert.\t";
    var zM = TB.ansichtBerichtMc.zerlege("Sozialanamnese\nlebt allein.\n" + medTab);
    faelle.push({ name: "Medikamente: KISIM-Tabelle wird kompakte Zeile (Stärke, pausiert)",
      ok: TB.ansichtBerichtMc.medisFormat(zM.abschnitte.medis) ===
          "Aldactone 50 mg 1-0-0, Bisoprolol 2.5 mg 0.5-0-0, Torasemid 10 mg 1-0.5-0 (pausiert)",
      detail: TB.ansichtBerichtMc.medisFormat(zM.abschnitte.medis) });
    var pEeg = TB.ansichtBerichtMc.parseZusatz(
      "Schlieren, 28. August 2026\nZusatzuntersuchung EEG vom 28.08.2026\n\nBeurteilung \nNormale Grundaktivität. \nFreundliche Grüsse");
    faelle.push({ name: "Einlesen: EEG-Brief (Datum, Ort, Beurteilung)",
      ok: !!pEeg && pEeg.ziel === "eeg" && pEeg.datum === "28.08.2026" &&
          pEeg.ort === "Spital Limmattal" &&
          pEeg.beurteilung === "Normale Grundaktivität.",
      detail: JSON.stringify(pEeg) });
    var pMri = TB.ansichtBerichtMc.parseZusatz(
      "Study:\nMR HYPOPHYSE\nContent Date/Time: 2026-06-03 14:22\nBeurteilung\n- Kein Adenom.\n- Keine Raumforderung.\n____\nVisum");
    faelle.push({ name: "Einlesen: Radiologie-Report (MR → MRI-Schädel-Zeile, ISO-Datum)",
      ok: !!pMri && pMri.ziel === "mri" && pMri.datum === "03.06.2026" &&
          pMri.beurteilung === "Kein Adenom. Keine Raumforderung.",
      detail: JSON.stringify(pMri) });
    var unC = TB.ansichtBerichtMc.bauUntersuchungen(z, [pEeg, pMri]);
    var iM = unC.text.indexOf("MR HYPOPHYSE vom 03.06.2026");
    var iE = unC.text.indexOf("Standard-EEG vom 28.08.2026");
    var iF = unC.text.indexOf("Demenzlabor vom xx.xx.2026");
    faelle.push({ name: "Zusatzuntersuchungen chronologisch (MR Juni vor EEG August, undatierte Vorlage am Schluss; MR trägt seinen eigenen Namen)",
      ok: iM !== -1 && iE !== -1 && iF !== -1 && iM < iE && iE < iF &&
          unC.text.indexOf("(Spital Limmattal): Kein Adenom. Keine Raumforderung. (in der Eigendurchsicht: xx.)") !== -1,
      detail: iM + "/" + iE + "/" + iF });
    var probeA = "Neuropsychologische Untersuchung, Bericht vom 22.09.2026\n\nAktuell\nSie sei seit sechs Monaten vergesslich.\n\nFremdanamnese (Gespräch von Frau Muster mit dem Ehemann)\nHerr X berichtet von Veränderungen.\n\nSozialanamnese\nVerheiratet.";
    var zA = TB.ansichtBerichtMc.zerlege(probeA);
    var anA = TB.ansichtBerichtMc.bauAnamnese(zA,
      { geschlecht: "w", erscheinen: "allein", begleitText: "", kompetenz: 1 });
    faelle.push({ name: "Anamnese vom [Berichtsdatum] + Fremdanamnese ohne Mitarbeiterin",
      ok: zA.neuroDatum === "22.09.2026" &&
          anA.html.indexOf("<u>Anamnese vom 22.09.2026</u>") !== -1 &&
          anA.html.indexOf("Fremdanamnese (Gespräch mit dem Ehemann)") !== -1 &&
          anA.html.indexOf("Muster") === -1,
      detail: (zA.neuroDatum || "kein Datum") });
    var pVio = TB.ansichtBerichtMc.parseZusatz("VIOLLIER\nEntnahmedatum 03.08.2026 09.09.2026\nDemenzmarker\nAmyloid-beta 1-42 274 ng/L\nAmyloid-beta 1-40 2988 ng/L\nAmyloid 42/40 Quotient 0.092\nTau-Protein 155 ng/L\nPhospho-Tau-Protein 17.9 ng/L");
    var pPkt = TB.ansichtBerichtMc.parseZusatz("PUNKTATE/LIQUOR\nZellzahl (WBC) < 5 1 /µL\nTotalprotein Liquor 150 - 450 271 mg/l");
    var unL = TB.ansichtBerichtMc.bauUntersuchungen(zA, [pVio, pPkt]);
    faelle.push({ name: "LP: Viollier-Werte + Punktat füllen die Zeile, Ort bleibt Viollier, A/T/N gelb",
      ok: !!pVio && pVio.datum === "09.09.2026" && !!pPkt &&
          unL.text.indexOf("Lumbalpunktion mit Demenzmarkern vom 09.09.2026 (Viollier): Liquor klar, Zellzahl 1 /µl") !== -1 &&
          unL.text.indexOf("Amyloid-42/40-Quotient: 0.092 (> 0.062), Tau-Protein: 155 ng/l (< 404), Phospho-Tau-Protein: 17.9 ng/l (< 56.5) — A x, T x, N x.") !== -1,
      detail: JSON.stringify(pVio) });
    var z2 = TB.ansichtBerichtMc.zerlege("Die IADL-Skala ergab einen Scorewert von 8/8. Gemäss diesen Fragebögen wäre sie auf geringe Fremdhilfe angewiesen. Unterstützungsbedarf: Die Einzahlungen erledigt der Ehemann, er traue ihr das Erlernen bei Bedarf zu.\n\nSozialanamnese\nVerheiratet.");
    var un2 = TB.ansichtBerichtMc.bauUntersuchungen(z2);
    faelle.push({ name: "IADL: Unterstützungsbedarf wandert mit",
      ok: un2.text.indexOf("8/8 Punkte. Unterstützungsbedarf: Die Einzahlungen erledigt der Ehemann, er traue ihr das Erlernen bei Bedarf zu.") !== -1,
      detail: un2.text.slice(0, 260) });
    // ---- Sammelrunde 15.16 (Befunde Spital 30.9.) ---------------------
    var langerScore = "Fremdanamnese (Gespräch mit dem Ehemann)\nEr berichte von Vergesslichkeit.\nIQCODE (Fragebogen zur geistigen Leistungsfähigkeit für ältere Personen): Der IQCODE-Score beträgt 3.40, was oberhalb des Cut-offs von 3.19 liegt.\nDie IADL-Skala (instrumental activities of daily living) nach Lawton und Brody zur Erfassung der Alltagskompetenz ergab einen Scorewert von 6/8.\n\nSozialanamnese\nVerwitwet.";
    var zL = TB.ansichtBerichtMc.zerlege(langerScore);
    faelle.push({ name: "Scores (lange Zeilen) bleiben aus der Fremdanamnese draussen",
      ok: zL.abschnitte.fremd === "Er berichte von Vergesslichkeit." && zL.scores.iqcode === "3.40",
      detail: JSON.stringify(zL.abschnitte.fremd) });
    var zG = TB.ansichtBerichtMc.zerlege("Frau Muster, Geburtsdatum 08.10.1944\nNeuropsychologische Untersuchung vom 12.09.2026\n\nAktuell\nVergesslich.");
    faelle.push({ name: "Datum der Neuropsychologie: nie das Geburtsdatum",
      ok: zG.neuroDatum === "12.09.2026", detail: String(zG.neuroDatum) });
    var rr = "Radiology Report\nConcept Modifier: Language = German\nBefund:\nMeier Petra\n___________________________\n03.06.2026 / ef\n___________________________\nKlinische Befunde oder Diagnosen\nHbA1c vom 14.05.2026: 6.0%\nCT Schädel vom 13.05.2026: Altersentsprechender Normalbefund.\n___________________________\nFragestellung\nHypophysenadenom?\n___________________________\nUntersuchung\nMR Hypophyse vom 03.06.2026\n___________________________\nBefund\nMittelständige Hypophyse.\n___________________________\nBeurteilung\n- Kein Nachweis eines Hypophysenmikroadenoms, kein Hypophysen Makroadenom.\n-\n___________________________\nVisum\nDr. med. Edgar Felix\nLA Radiologie, T 044 736 8269";
    var pRR = TB.ansichtBerichtMc.parseZusatz(rr);
    faelle.push({ name: "Einlesen: Radiology Report (nur Block „Untersuchung“ zählt, Ort Limmattal)",
      ok: !!pRR && pRR.name === "MR Hypophyse" && pRR.datum === "03.06.2026" &&
          pRR.ort === "Spital Limmattal" &&
          pRR.beurteilung === "Kein Nachweis eines Hypophysenmikroadenoms, kein Hypophysen Makroadenom.",
      detail: JSON.stringify(pRR) });
    var unR = TB.ansichtBerichtMc.bauUntersuchungen(zG, [pRR]);
    faelle.push({ name: "Untersuchungen: MR Hypophyse als eigene Zeile, bis Klammer unterstrichen, Scores vom Neuropsych-Datum",
      ok: unR.html.indexOf("<u>MR Hypophyse vom 03.06.2026 (Spital Limmattal)</u>: Kein Nachweis") !== -1 &&
          unR.html.indexOf("<u>Demenz-Scores vom 12.09.2026 (Spital Limmattal)</u>:") !== -1 &&
          unR.text.indexOf("MRI Schädel") === -1,
      detail: unR.html.slice(0, 200) });
    return faelle;
  }

  function alleTests() {
    return mitErgebniszeile([].concat(
      pruefeRechnen().map(function (f) { f.gruppe = "Rechnen"; return f; }),
      pruefeBestand().map(function (f) { f.gruppe = "Datenbestand"; return f; }),
      pruefeRundreise().map(function (f) { f.gruppe = "Rundreise"; return f; }),
      pruefeTabellen().map(function (f) { f.gruppe = "Tabellen"; return f; }),
      pruefeAbgleich().map(function (f) { f.gruppe = "Abgleich"; return f; }),
      pruefeVarianten().map(function (f) { f.gruppe = "Standort-Fassungen"; return f; }),
      pruefeMasken().map(function (f) { f.gruppe = "Masken"; return f; }),
      pruefeStatus().map(function (f) { f.gruppe = "Status-Werk"; return f; }),
      pruefeBerichtMc().map(function (f) { f.gruppe = "Bericht Memory Clinic"; return f; })
    ));
  }

  // Ergebniszeile am Ende der Bildschirm-Liste (Näd 28.9.) — färbt sich
  // selbst grün oder rot; der PDF-Bericht filtert sie heraus, weil er
  // seine eigene Schlusszeile schreibt.
  function mitErgebniszeile(faelle) {
    var rotZahl = faelle.filter(function (f) { return !f.ok; }).length;
    faelle.push({ name: "Ergebnis: " + (faelle.length - rotZahl) +
      " grün, " + rotZahl + " rot.", ok: rotZahl === 0, detail: "",
      istSumme: true });
    return faelle;
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
    ergebnisse = ergebnisse.filter(function (f) { return !f.istSumme; });
    var rot = ergebnisse.filter(function (f) { return !f.ok; }).length;
    zeilen.push("");
    zeilen.push("Ergebnis: " + (ergebnisse.length - rot) + " grün, " + rot + " rot.");
    return zeilen.join("\n");
  }

  return { alleTests: alleTests, bericht: bericht };
})();
