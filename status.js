// Datei: status.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Das Herz des Status-Werks: liest und schreibt den
//        Gesamtstatus und die Teilmengen (sie liegen als
//        Einstellungs-Werte statusMaster/statusTeilmengen und syncen
//        damit auf alle Geräte — sie tauchen nirgends in Bausteinlisten,
//        im Kürzel-Weg oder in der Erweiterung auf), erzeugt aus einer
//        Auswahl den fertigen Fliesstext (HTML und reiner Text;
//        Kategorien unterstrichen, Überschriebenes fett in Dunkelgrau)
//        und zählt live die Tardoc-Gruppen (Kriterien: tardoc-daten.js).
//        GRUNDSATZ: Ein AUSGEFÜLLTER Status ist ein Patientenbefund
//        und wird NIE gespeichert — gespeichert werden nur die
//        Vorlagen (Untersuchungen, Normalbefunde, Ankreuz-Muster).
//        Die sichtbaren Texte stehen hier als eigenes Textobjekt
//        (TB.statusTexte), damit texte.js byteweise Erweiterungs-Kopie
//        bleibt — dasselbe Muster wie ansicht-kaertchen.js (E8).

"use strict";
window.TB = window.TB || {};

TB.statusTexte = {
  bereichStatus: "Status",
  bereichUebersicht: "Übersicht",
  statusTitel: "Status-Werk",
  statusLeer: "Noch kein Gesamtstatus auf diesem Konto. Mit dem Knopf unten holst Du die mitgelieferte Grundausstattung — sie synct danach auf alle Geräte.",
  grundausstattungKnopf: "Grundausstattung übernehmen",
  grundausstattungNeuKnopf: "Grundausstattung neu laden",
  grundausstattungWarnung: "Das ersetzt Deinen bearbeiteten Gesamtstatus durch die Lieferfassung. Deine eigenen Status-Muster (Teilmengen) bleiben erhalten. Fortfahren?",
  grundausstattungFertig: "Grundausstattung übernommen.",
  teilmengenTitel: "Status wählen (mehrere möglich):",
  suchePlatzhalter: "Untersuchung suchen …",
  weitereZu: "Weitere Untersuchungen (%s) einblenden",
  weitereAuf: "Weitere Untersuchungen ausblenden",
  zaehlerZeile: "%s Untersuchungen gewählt · %s überschrieben",
  kopierenKnopf: "Kopieren",
  kopiertMeldung: "Status kopiert — am Zielort mit Strg+V (Mac: Cmd+V) einfügen.",
  kopiertNurText: "Status kopiert — nur als reiner Text (ohne Fett).",
  kopierenFehl: "Kopieren fehlgeschlagen.",
  nichtsGewaehlt: "Keine Untersuchung angekreuzt — es gibt nichts zu kopieren.",
  zuruecksetzenKnopf: "Alles zurücksetzen",
  zurueckgesetzt: "Maske geleert — nichts wurde gespeichert.",
  alsStatusKnopf: "Auswahl als eigenen Status speichern",
  alsStatusFrage: "Name des neuen Status:",
  alsStatusErsetzen: "„%s“ gibt es schon — Ankreuz-Muster ersetzen?",
  alsStatusFertig: "Status „%s“ gespeichert (nur das Ankreuz-Muster, keine Befunde).",
  pflegeKnopf: "Status-Pflege",
  zurueckZumAusfuellen: "Zurück zum Ausfüllen",
  vorschauTitel: "Vorschau",
  vorschauLeer: "(noch nichts angekreuzt)",
  abweichungZurueck: "Auf Normalbefund zurück",
  befundKlickHinweis: "Zum Überschreiben anklicken",
  tardocFuerAFehlt: "Für %s A fehlen %s Gruppen — am nächsten: %s",
  tardocFuerAFehlt1: "Für %s A fehlt 1 Gruppe — am nächsten: %s",
  tardocErfuellt: "%s A erfüllt (%s Gruppen).",
  tardocKeine: "keine Gruppe begonnen",
  tardocHinweis: "Zählung nach %s — massgeblich bleibt der Tarif.",
  // Pflege
  pflegeTitel: "Status-Pflege",
  pflegeHinweis: "Änderungen wirken sofort und syncen auf alle Geräte. Häufige Untersuchungen stehen offen in der Maske, seltene hinter „Weitere“.",
  kategorieNeu: "Neue Kategorie",
  kategorieName: "Name der Kategorie:",
  kategorieLoeschenVoll: "Diese Kategorie enthält noch Untersuchungen — zuerst verschieben.",
  untersuchungNeu: "Neue Untersuchung",
  untersuchungLoeschenFrage: "„%s“ endgültig aus dem Gesamtstatus entfernen?",
  haeufigMarke: "häufig",
  seltenMarke: "selten",
  feldName: "Untersuchung",
  feldNormal: "Normalbefund",
  feldKategorie: "Kategorie",
  feldHaeufig: "Häufig untersucht (steht offen in der Maske)",
  feldTardoc: "Tardoc-Etiketten",
  tardocKeineEtiketten: "keine",
  tardocNeu: "Etikett dazu",
  tardocArt: "Statusart",
  tardocGruppe: "Gruppe",
  tardocMerkmale: "Merkmale (mit Komma getrennt)",
  tardocMuskeln: "Anzahl Muskeln",
  teilmengePflegeTitel: "Eigene Status (Ankreuz-Muster)",
  teilmengeUmbenennen: "Umbenennen",
  teilmengeLoeschen: "Löschen",
  teilmengeLoeschenFrage: "Status „%s“ löschen? (Der Gesamtstatus bleibt unberührt.)",
  speichern: "Speichern",
  abbrechen: "Abbrechen",
  loeschenKnopf: "Löschen",
  gespeichert: "Gespeichert.",
  hoch: "▲", runter: "▼"
};

TB.status = (function () {
  var S = function () { return TB.speicher; };

  // ---- Ablage: Einstellungs-Werte, sie syncen wie alle Einstellungen --
  function master() { return S().einstellung("statusMaster", null); }
  function speichereMaster(m) {
    S().setzeEinstellung("statusMaster", m);
    if (TB.abgleich) TB.abgleich.anstossen();
  }
  function teilmengen() { return S().einstellung("statusTeilmengen", []) || []; }
  function speichereTeilmengen(liste) {
    S().setzeEinstellung("statusTeilmengen", liste);
    if (TB.abgleich) TB.abgleich.anstossen();
  }
  function grundausstattung(nurLeereTeilmengen) {
    speichereMaster(TB.statusGrundlage.master());
    if (!nurLeereTeilmengen || !teilmengen().length) {
      speichereTeilmengen(TB.statusGrundlage.teilmengen());
    }
  }

  // ---- Zugriffe auf den Master ----------------------------------------
  function untersuchung(m, id) {
    return m.untersuchungen.find(function (x) { return x.id === id; }) || null;
  }
  function jeKategorie(m) {
    // Liefert die Kategorien in ihrer Reihenfolge, jede mit ihren
    // Untersuchungen in Listen-Reihenfolge (die Liste IST die Ordnung).
    return m.kategorien.map(function (k) {
      return { kategorie: k, untersuchungen: m.untersuchungen.filter(
        function (x) { return x.kategorie === k.id; }) };
    });
  }
  function neueUntersuchungsId(m, wunsch) {
    var basis = String(wunsch || "u").toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
      .replace(/[^a-z0-9]/g, "").slice(0, 24) || "u";
    var id = basis, nr = 1;
    while (untersuchung(m, id)) { nr += 1; id = basis + nr; }
    return id;
  }

  // ---- Fliesstext (HTML und reiner Text) ------------------------------
  // Kategorien unterstrichen, jede auf neuer Zeile; Untersuchungen als
  // „Name: Befund.“; Überschriebenes fett in Dunkelgrau (Näd 26.9.).
  var ABWEICHFARBE = "#444444";
  function schuetze(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function mitPunkt(t) {
    var s = String(t || "").trim();
    if (!s) return s;
    return /[.!?…]$/.test(s) ? s : s + ".";
  }
  function befundVon(u, abweichungen) {
    var a = abweichungen && abweichungen[u.id];
    if (a !== undefined && a !== null && String(a).trim() !== "" &&
        String(a).trim() !== String(u.normal).trim()) {
      return { text: mitPunkt(a), abweichend: true };
    }
    return { text: mitPunkt(u.normal), abweichend: false };
  }
  function fliesstext(m, gewaehlt, abweichungen) {
    var html = [], text = [];
    jeKategorie(m).forEach(function (block) {
      var teile = block.untersuchungen.filter(function (u) {
        return !!gewaehlt[u.id]; });
      if (!teile.length) return;
      var zeileHtml = "<u>" + schuetze(block.kategorie.name) + ":</u> ";
      var zeileText = block.kategorie.name + ": ";
      var stueckeH = [], stueckeT = [];
      teile.forEach(function (u) {
        var b = befundVon(u, abweichungen);
        var satzT = u.name + ": " + b.text;
        stueckeT.push(satzT);
        var satzH = schuetze(u.name) + ": " + schuetze(b.text);
        if (b.abweichend) {
          satzH = "<b><span style=\"color:" + ABWEICHFARBE + "\">" +
                  satzH + "</span></b>";
        }
        stueckeH.push(satzH);
      });
      html.push("<p>" + zeileHtml + stueckeH.join(" ") + "</p>");
      text.push(zeileText + stueckeT.join(" "));
    });
    return { html: html.join(""), text: text.join("\n") };
  }

  // ---- Tardoc-Zählung --------------------------------------------------
  // Je Statusart und Gruppe wird die MENGE der Merkmal-Namen der
  // angekreuzten Untersuchungen gezählt (Muskeln als Anzahl). Eine
  // Gruppe ist erfüllt, wenn ihre Mindestzahl erreicht ist; A verlangt
  // mindestens 4 erfüllte Gruppen.
  function tardoc(m, gewaehlt) {
    var daten = TB.tardocDaten.arten;
    var stand = {};
    Object.keys(daten).forEach(function (art) { stand[art] = {}; });
    m.untersuchungen.forEach(function (u) {
      if (!gewaehlt[u.id] || !u.tardoc) return;
      u.tardoc.forEach(function (e) {
        if (!daten[e.a] || !daten[e.a].gruppen[e.g]) return;
        var z = stand[e.a][e.g] ||
                (stand[e.a][e.g] = { namen: {}, muskeln: 0 });
        (e.m || []).forEach(function (name) { z.namen[name] = true; });
        if (e.muskeln) z.muskeln += e.muskeln;
      });
    });
    var ergebnis = {};
    Object.keys(daten).forEach(function (art) {
      var d = daten[art];
      var gruppen = [], erfuellte = 0;
      Object.keys(d.gruppen).forEach(function (g) {
        var soll = d.gruppen[g].min;
        var z = stand[art][g];
        var ist = z ? Object.keys(z.namen).length + z.muskeln : 0;
        if (ist > soll) ist = soll;   // Anzeige nie über dem Soll
        var voll = ist >= soll;
        if (voll) erfuellte += 1;
        gruppen.push({ nummer: Number(g), name: d.gruppen[g].name,
                       ist: ist, soll: soll, erfuellt: voll });
      });
      var stufe = erfuellte >= d.minGruppenA ? "A" : (erfuellte > 0 ? "B" : "–");
      // „Am nächsten“: begonnene, unerfüllte Gruppen zuerst (nach
      // Fortschritt), dann die mit dem kleinsten Soll.
      var offene = gruppen.filter(function (g) { return !g.erfuellt; });
      offene.sort(function (a, b) {
        var fa = a.ist / a.soll, fb = b.ist / b.soll;
        if (fb !== fa) return fb - fa;
        return a.soll - b.soll;
      });
      ergebnis[art] = { name: d.name, stufe: stufe, erfuellte: erfuellte,
                        noetig: d.minGruppenA, gruppen: gruppen,
                        naechste: offene.slice(0, 3) };
    });
    return ergebnis;
  }
  function tardocFehltText(a) {
    var TS = TB.statusTexte;
    if (a.stufe === "A") {
      return TS.tardocErfuellt.replace("%s", a.name)
        .replace("%s", String(a.erfuellte));
    }
    var fehlen = a.noetig - a.erfuellte;
    var naechste = a.naechste.map(function (g) {
      return g.name + " (" + g.ist + " von " + g.soll + ")"; }).join(", ");
    if (!naechste) naechste = TS.tardocKeine;
    var vorlage = fehlen === 1 ? TS.tardocFuerAFehlt1 : TS.tardocFuerAFehlt;
    var t = vorlage.replace("%s", a.name);
    if (fehlen !== 1) t = t.replace("%s", String(fehlen));
    return t.replace("%s", naechste);
  }

  // ---- Teilmengen ------------------------------------------------------
  function teilmengeSpeichern(name, punkte) {
    var liste = teilmengen();
    var da = liste.find(function (t) {
      return t.name.toLowerCase() === String(name).toLowerCase(); });
    if (da) { da.punkte = punkte.slice(); }
    else {
      liste.push({ id: "t" + Date.now().toString(36), name: String(name),
                   punkte: punkte.slice() });
    }
    speichereTeilmengen(liste);
    return !da;
  }

  return { master: master, speichereMaster: speichereMaster,
           teilmengen: teilmengen, speichereTeilmengen: speichereTeilmengen,
           teilmengeSpeichern: teilmengeSpeichern,
           grundausstattung: grundausstattung,
           untersuchung: untersuchung, jeKategorie: jeKategorie,
           neueUntersuchungsId: neueUntersuchungsId,
           fliesstext: fliesstext, tardoc: tardoc,
           tardocFehltText: tardocFehltText };
})();
