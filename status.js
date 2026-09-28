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
  nameKlickHinweis: "Klick kreuzt an oder ab",
  tardocFuerAFehlt: "Für %s A fehlen %s Gruppen — am nächsten: %s",
  tardocFuerAFehlt1: "Für %s A fehlt 1 Gruppe — am nächsten: %s",
  tardocErfuellt: "%s A erfüllt (%s Gruppen).",
  tardocKeine: "keine Gruppe begonnen",
  tardocHinweis: "Zählung nach %s: B = bis zu 3, A = ab 4 dokumentierte Gruppen. Die Ampel zählt nur Gruppen — ob die Exploration als eigenständige Leistung erbracht wurde (Neurostatus B 23 Min. / A 46 Min., Hirnnerven A 35 Min.), beurteilst Du; massgeblich bleibt der Tarif.",
  tardocPilleA: "%s: A (%s Gruppen)",
  tardocPilleB: "%s: B (%s von bis zu 3 Gruppen)",
  tardocPilleLeer: "%s: –",
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
  hoch: "▲", runter: "▼",
  nurGewaehlteKnopf: "Nur Gewählte",
  muskelnKnopf: "Muskeln (%s/%s)",
  muskelnHinweis: "Einzelne Muskeln an- und abwählen — der Text nennt nur die gewählten",
  muskelnKeine: "keine Defizite.",
  tardocLesenKnopf: "Tardoc-Kriterien nachlesen",
  tardocLesenTitel: "Tardoc-Kriterien (TARDOC 1.4c)",
  tardocLesenEinleitung: "Von Claude zusammengefasst, eng am Original — zum Prüfen führt jeder Positions-Titel auf die Original-Seite (kodia.ch, öffnet in neuem Tab).",
  tardocLesenB: "%s (%s): dokumentierte Untersuchung und Beurteilung von bis zu 3 der untenstehenden Gruppen%s.",
  tardocLesenA: "%s (%s): dokumentierte Untersuchung und Beurteilung von 4 oder mehr Gruppen%s.",
  tardocLesenMin: " — hinterlegt mit %s Minuten",
  tardocLesenGruppe: "Gruppe %s · %s — mind. %s: ",
  tardocLesenGruppeMuskeln: "Gruppe %s · %s — mind. %s Muskeln: ",
  tardocLesenZu: "Schliessen",
  tardocLesenGruppeKopf: "Gruppe — Mindestzahl",
  tardocLesenGleich: "Was in einer Gruppe dokumentiert sein muss, ist bei B und A laut Tarif identisch (die Zellen sind darum in beiden Spalten gleich). Der Unterschied steht in der Kopfzeile: B verlangt bis zu 3 dieser Gruppen, A verlangt 4 oder mehr — bei entsprechend längerer hinterlegter Dauer.",
  tardocLesenStand: "Stand der Zusammenfassung: 27.09.2026. Massgeblich ist immer der Originaltext des Tarifs.",
  exportKnopf: "Status als Datei sichern",
  exportHinweis: "Sichert Gesamtstatus und eigene Status als Datei — zum Aufheben oder zum Schicken an Claude, damit Deine Änderungen in die Grundausstattung einfliessen können.",
  exportFertig: "Status-Datei erstellt: %s"
};

TB.status = (function () {
  var S = function () { return TB.speicher; };

  // ---- Ablage: Einstellungs-Werte, sie syncen wie alle Einstellungen --
  function master() {
    var m = S().einstellung("statusMaster", null);
    // Nachzieh-Migration (28.9.): Neuerungen der Grundausstattung —
    // aktuell die Einzelmuskel-Merkmale — werden in einen früher
    // gespeicherten Katalog sanft nachgezogen. Näds eigene Texte
    // bleiben unberührt: Nur wenn der Normalbefund noch dem der
    // Grundausstattung entspricht, kommen die Merkmale dazu.
    if (m) {
      var a = migriereMerkmale(m);
      var b = migriereNeue(m);
      if (a || b) speichereMaster(m);
    }
    return m;
  }
  // Nachziehen (28.9., Katalog-Ausbau): Untersuchungen, die die
  // Grundausstattung neu bekommt, werden in einen gespeicherten Katalog
  // eingefügt — an derselben Stelle, hinter dem jeweiligen Vorgänger.
  // Bestehende Einträge (auch umformulierte) bleiben unberührt.
  function migriereNeue(m) {
    var frisch = TB.statusGrundlage.master();
    var geaendert = false;
    var liste = m.untersuchungen || (m.untersuchungen = []);
    function posVon(id) {
      for (var i = 0; i < liste.length; i++)
        if (liste[i].id === id) return i;
      return -1;
    }
    frisch.untersuchungen.forEach(function (g, idx) {
      if (posVon(g.id) !== -1) return;
      var ziel = liste.length;
      if (idx > 0) {
        var vorher = posVon(frisch.untersuchungen[idx - 1].id);
        if (vorher !== -1) ziel = vorher + 1;
      }
      liste.splice(ziel, 0, JSON.parse(JSON.stringify(g)));
      geaendert = true;
    });
    return geaendert;
  }
  function migriereMerkmale(m) {
    var frisch = TB.statusGrundlage.master();
    var geaendert = false;
    (m.untersuchungen || []).forEach(function (u) {
      if (u.merkmale) return;
      var g = frisch.untersuchungen.find(function (x) {
        return x.id === u.id; });
      if (g && g.merkmale &&
          (u.normal === g.normal ||
           u.normal === "keine Defizite; im Einzelnen: " + g.normal)) {
        u.merkmale = g.merkmale;
        u.normal = g.normal;
        geaendert = true;
      }
    });
    // Zweiter Nachzieh-Schritt (28.9.): Wo die Merkmale schon da sind,
    // aber noch der alte Vorspann-Text steht, wird er auf die reine
    // Liste gehoben.
    (m.untersuchungen || []).forEach(function (u) {
      if (!u.merkmale) return;
      var g = frisch.untersuchungen.find(function (x) {
        return x.id === u.id; });
      if (g && u.normal === "keine Defizite; im Einzelnen: " + g.normal) {
        u.normal = g.normal;
        geaendert = true;
      }
    });
    return geaendert;
  }
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
  // Motorik-Merkmale (Nachbesserung 27.9.): Bei Untersuchungen mit
  // Einzelmerkmalen (Einzelkraftprüfung Arme/Beine) wird der
  // Normalbefund aus den GEWÄHLTEN Merkmalen zusammengesetzt.
  // merkmalWahl[uid] ist eine Menge ABGEWÄHLTER Merkmal-Kennungen;
  // fehlt sie, sind alle Merkmale an (Standard).
  function merkmalAn(merkmalWahl, uid, mid) {
    return !(merkmalWahl && merkmalWahl[uid] && merkmalWahl[uid][mid]);
  }
  function gewaehlteMerkmale(u, merkmalWahl) {
    if (!u.merkmale) return null;
    return u.merkmale.filter(function (mk) {
      return merkmalAn(merkmalWahl, u.id, mk.id); });
  }
  // Näd 28.9.: ohne "keine Defizite"-Vorspann — sonst müsste man bei
  // einem Defizit zwei Stellen ändern. Der Befund ist die reine Liste.
  function normalVon(u, merkmalWahl) {
    if (!u.merkmale) return u.normal;
    var an = gewaehlteMerkmale(u, merkmalWahl);
    if (!an.length) return "xx.";
    return an.map(function (mk) {
      return mk.name + " M5/M5"; }).join(", ") + ".";
  }

  function befundVon(u, abweichungen, merkmalWahl) {
    var soll = normalVon(u, merkmalWahl);
    var a = abweichungen && abweichungen[u.id];
    if (a !== undefined && a !== null && String(a).trim() !== "" &&
        String(a).trim() !== String(soll).trim()) {
      return { text: mitPunkt(a), abweichend: true, normal: soll };
    }
    return { text: mitPunkt(soll), abweichend: false, normal: soll };
  }
  function fliesstext(m, gewaehlt, abweichungen, merkmalWahl) {
    var html = [], text = [];
    jeKategorie(m).forEach(function (block) {
      var teile = block.untersuchungen.filter(function (u) {
        return !!gewaehlt[u.id]; });
      if (!teile.length) return;
      var zeileHtml = "<u>" + schuetze(block.kategorie.name) + ":</u> ";
      var zeileText = block.kategorie.name + ": ";
      var stueckeH = [], stueckeT = [];
      teile.forEach(function (u) {
        var b = befundVon(u, abweichungen, merkmalWahl);
        var satzT = u.name + ": " + b.text;
        stueckeT.push(satzT);
        var satzH;
        if (b.abweichend) {
          // Sammelrunde 27.9. (Näd): Der Untersuchungsname bleibt
          // normal; vom Befund wird nur der wirklich veränderte
          // Wortbereich fett in Dunkelgrau hervorgehoben.
          var d = wortUnterschied(b.normal, b.text);
          satzH = schuetze(u.name) + ": " + schuetze(d.vor) +
                  "<b><span style=\"color:" + ABWEICHFARBE + "\">" +
                  schuetze(d.mitte) + "</span></b>" + schuetze(d.nach);
        } else {
          satzH = schuetze(u.name) + ": " + schuetze(b.text);
        }
        stueckeH.push(satzH);
      });
      html.push("<p>" + zeileHtml + stueckeH.join(" ") + "</p>");
      text.push(zeileText + stueckeT.join(" "));
    });
    return { html: html.join(""), text: text.join("\n") };
  }

  // Wort-Unterschied zwischen Normalbefund und überschriebenem Befund:
  // gemeinsamer Anfang und gemeinsames Ende (auf Wortgrenzen gerundet)
  // bleiben normal, der Bereich vom ersten bis zum letzten veränderten
  // Wort wird hervorgehoben. Ist alles anders, ist alles hervorgehoben.
  function wortUnterschied(normal, abw) {
    var a = String(normal), b = String(abw);
    var vorn = 0, hinten = 0;
    while (vorn < a.length && vorn < b.length &&
           a.charAt(vorn) === b.charAt(vorn)) vorn++;
    while (hinten < a.length - vorn && hinten < b.length - vorn &&
           a.charAt(a.length - 1 - hinten) === b.charAt(b.length - 1 - hinten))
      hinten++;
    // Auf Wortgrenzen zurückrunden, damit nie ein halbes Wort
    // hervorgehoben wird ("8/8" → "4/6" hebt das ganze Stück hervor).
    while (vorn > 0 && b.charAt(vorn - 1) !== " ") vorn--;
    while (hinten > 0 && b.charAt(b.length - hinten) !== " ") hinten--;
    var mitte = b.slice(vorn, b.length - hinten);
    // Messwort mitnehmen (Näd 27.9.): Beginnt der veränderte Bereich
    // mit einem Wert (Ziffern, /, +, −), wird das Wort davor — die
    // Bezeichnung der Messstelle — mit hervorgehoben:
    // „malleolär 4/6" statt nur „4/6".
    if (mitte && vorn > 0) {
      var erstes = mitte.split(" ")[0];
      if (/[0-9\/+−-]/.test(erstes)) {
        var davor = b.lastIndexOf(" ", vorn - 2);
        if (davor >= 0 && /[A-Za-zÄÖÜäöü]/.test(b.charAt(davor + 1))) {
          vorn = davor + 1;
          mitte = b.slice(vorn, b.length - hinten);
        }
      }
    }
    if (!mitte) { vorn = 0; hinten = 0; mitte = b; }
    return { vor: b.slice(0, vorn), mitte: mitte,
             nach: b.slice(b.length - hinten) };
  }

  // ---- Tardoc-Zählung --------------------------------------------------
  // Je Statusart und Gruppe wird die MENGE der Merkmal-Namen der
  // angekreuzten Untersuchungen gezählt (Muskeln als Anzahl). Eine
  // Gruppe ist erfüllt, wenn ihre Mindestzahl erreicht ist; A verlangt
  // mindestens 4 erfüllte Gruppen.
  function tardoc(m, gewaehlt, merkmalWahl) {
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
        if (e.muskeln) {
          var anzahl = u.merkmale
            ? gewaehlteMerkmale(u, merkmalWahl).length : e.muskeln;
          z.muskeln += anzahl;
        }
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
  function teilmengeSpeichern(name, punkte, merkmalAb) {
    var liste = teilmengen();
    var da = liste.find(function (t) {
      return t.name.toLowerCase() === String(name).toLowerCase(); });
    if (da) { da.punkte = punkte.slice();
              if (merkmalAb) da.merkmalAb = merkmalAb; }
    else {
      var eintrag = { id: "t" + Date.now().toString(36),
                      name: String(name), punkte: punkte.slice() };
      if (merkmalAb) eintrag.merkmalAb = merkmalAb;
      liste.push(eintrag);
    }
    speichereTeilmengen(liste);
    return !da;
  }

  // ---- Tardoc-Nachlese (Näds Wunsch 27.9.): Die Kriterien beider
  // Statusarten als lesbare Struktur — Zusammenfassung aus
  // tardoc-daten.js, mit Original-Links zum Prüfen.
  function tardocKriterien() {
    var T = TB.statusTexte;
    var daten = TB.tardocDaten.arten;
    return Object.keys(daten).map(function (art) {
      var d = daten[art];
      var minB = d.dauerB ? T.tardocLesenMin.replace("%s", d.dauerB) : "";
      var minA = d.dauerA ? T.tardocLesenMin.replace("%s", d.dauerA) : "";
      var gruppen = Object.keys(d.gruppen).map(function (nr) {
        var g = d.gruppen[nr];
        var vorlage = g.einheit === "Muskeln"
          ? T.tardocLesenGruppeMuskeln : T.tardocLesenGruppe;
        return { nr: nr,
          kopf: vorlage.replace("%s", nr).replace("%s", g.name)
                       .replace("%s", g.min),
          merkmale: g.merkmale || "" };
      });
      return { art: art, name: d.name,
        zeileB: T.tardocLesenB.replace("%s", d.titelB)
          .replace("%s", d.positionB).replace("%s", minB),
        zeileA: T.tardocLesenA.replace("%s", d.titelA)
          .replace("%s", d.positionA).replace("%s", minA),
        linkA: d.linkA, linkB: d.linkB, gruppen: gruppen };
    });
  }

  // ---- Export (Sammelrunde 27.9.): Gesamtstatus + eigene Status als
  // Datei, Dateiname nach der Berichts-Regel (Gerät, Datum, Zeit mit
  // Sekunden). Enthält NUR Vorlagen — nie einen ausgefüllten Befund.
  function exportDatei() {
    var jetzt = new Date();
    function zwei(n) { return (n < 10 ? "0" : "") + n; }
    var stempel = jetzt.getFullYear() + "-" + zwei(jetzt.getMonth() + 1) +
      "-" + zwei(jetzt.getDate()) + "-" + zwei(jetzt.getHours()) +
      "-" + zwei(jetzt.getMinutes()) + "-" + zwei(jetzt.getSeconds());
    var name = "Status-Export-" + S().geraet() + "-" + stempel + ".json";
    var inhalt = JSON.stringify({ art: "textbausteine-status-export",
      fassung: TB.FASSUNG, erstellt: jetzt.toISOString(),
      kiAnleitung: {
        zweck: "Status-Werk der Textbausteine-App (Näd, Neurologe). master = Gesamtkatalog der Untersuchungen (id, kategorie, name, normal, haeufig, tardoc-Etiketten, bei Einzelkraftprüfungen merkmale mit Untergruppen). teilmengen = Näds eigene Status-Vorlagen (punkte = Untersuchungs-ids, merkmalAb = je Untersuchung abgewählte Merkmal-ids).",
        fuerDich: "Vergleiche diesen Stand mit der von Claude gelieferten Grundausstattung (status-grundlage.js der genannten App-Fassung): Abweichungen in master sind Näds bewusste Anpassungen — übernehmen statt überschreiben. Neue Untersuchungen brauchen eindeutige id, Kategorie aus KATEGORIEN, Normalbefund mit Punkt am Ende und wo passend Tardoc-Etiketten n(gruppe,[merkmale]) bzw. h(...).",
        geliefertMit: "App " + TB.FASSUNG
      },
      master: master(), teilmengen: teilmengen() }, null, 2);
    var blob = new Blob([inhalt], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return name;
  }

  return { master: master, speichereMaster: speichereMaster,
           teilmengen: teilmengen, speichereTeilmengen: speichereTeilmengen,
           teilmengeSpeichern: teilmengeSpeichern,
           grundausstattung: grundausstattung,
           untersuchung: untersuchung, jeKategorie: jeKategorie,
           neueUntersuchungsId: neueUntersuchungsId,
           fliesstext: fliesstext, tardoc: tardoc,
           tardocFehltText: tardocFehltText,
           wortUnterschied: wortUnterschied,
           normalVon: normalVon, gewaehlteMerkmale: gewaehlteMerkmale,
           migriereMerkmale: migriereMerkmale,
           migriereNeue: migriereNeue,
           merkmalAn: merkmalAn,
           tardocKriterien: tardocKriterien,
           exportDatei: exportDatei };
})();
