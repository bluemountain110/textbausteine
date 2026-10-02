// Datei: eeg.js
// Projekt: Textbausteine — Teil: App (Browser) UND Chrome-Erweiterung
//          (byteweise Kopie — Prüfsuite: cmp)
// Zweck: Das Herz des EEG-Werks: liest und schreibt Katalog und
//        Vorlagen (Einstellungs-Werte eegMaster/eegVorlagen, syncen
//        auf alle Geräte), zerlegt Punkt-Texte in feste Stücke,
//        Auswahlen und Felder, löst sie mit den gewählten Werten auf
//        und erzeugt den fertigen Fliesstext für Befund und
//        Beurteilung (HTML und reiner Text; Kategorien unterstrichen,
//        der Doppelpunkt nicht, Überschriebenes fett in Dunkelgrau).
//        In der App kommt der Speicher aus TB.speicher; in der
//        Erweiterung setzt seite-eeg.js die Quelle TB.eegQuelle
//        (nur lesend). GRUNDSATZ: Ein AUSGEFÜLLTER Befund ist ein
//        Patientenbefund und wird NIE gespeichert — Vorlagen tragen
//        nur Ankreuz-Muster und Auswahl-Vorwahlen, nie Feld-Werte.

"use strict";
window.TB = window.TB || {};

TB.eegTexte = {
  bereichEeg: "EEG",
  eegTitel: "EEG-Werk",
  eegLeer: "Noch kein EEG-Katalog auf diesem Konto. Mit dem Knopf unten holst Du die mitgelieferte Grundausstattung — sie synct danach auf alle Geräte.",
  grundKnopf: "Grundausstattung übernehmen",
  vorlagenTitel: "Vorlage wählen:",
  suchePlatzhalter: "Punkt suchen …",
  weitereZu: "Weitere Punkte (%s) einblenden",
  weitereAuf: "Weitere Punkte ausblenden",
  nurGewaehlteKnopf: "Nur Gewählte und Zusätze",
  zaehlerZeile: "%s Punkte gewählt · %s überschrieben",
  befundTitel: "Befund",
  beurteilungTitel: "Beurteilung",
  kopierenBefund: "Befund kopieren",
  kopierenBeurteilung: "Beurteilung kopieren",
  kopierenBeides: "Beides kopieren (ein Block)",
  kopiertMeldung: "Kopiert — am Zielort mit Strg+V (Mac: Cmd+V) einfügen.",
  kopiertNurText: "Kopiert — nur als reiner Text (ohne Formatierung).",
  kopierenFehl: "Kopieren fehlgeschlagen.",
  nichtsGewaehlt: "Kein Punkt angekreuzt — es gibt nichts zu kopieren.",
  zuruecksetzenKnopf: "Alles zurücksetzen",
  zurueckgesetzt: "Maske geleert — nichts wurde gespeichert.",
  alsVorlageKnopf: "Auswahl als eigene Vorlage speichern",
  vorlageNameFrage: "Name der neuen Vorlage:",
  vorlageKuerzelFrage: "Kürzel der Vorlage (ohne ;;) — damit öffnet ;;kürzel dieses Werk:",
  vorlageErsetzen: "„%s“ gibt es schon — Vorlage ersetzen?",
  vorlageKuerzelBelegt: "Achtung: Ein Baustein trägt schon das Kürzel „%s“ — der Baustein hat am Arbeitsplatz Vorrang.",
  vorlageFertig: "Vorlage „%s“ gespeichert (nur Ankreuz-Muster und Auswahl-Vorwahlen, keine Befunde).",
  pflegeKnopf: "EEG-Pflege",
  vorschauLeer: "(noch nichts angekreuzt)",
  befundKlickHinweis: "Zum Überschreiben anklicken",
  abweichungZurueck: "Auf Vorgabe zurück",
  // Pflege
  pflegeTitel: "EEG-Pflege",
  pflegeHinweis: "Änderungen wirken sofort und syncen auf alle Geräte. Häufige Punkte stehen offen in der Maske, seltene hinter „Weitere“. Auswahl-Stellen schreibst Du als {{Auswahl:Name:eins|zwei}}, Freifelder als {{Feld:Name=Vorgabe}} — die erste Auswahl ist der Normalfall.",
  zurueckZumAusfuellen: "Zurück zum Ausfüllen",
  punktNeu: "Punkt dazu",
  punktLoeschenFrage: "Diesen Punkt endgültig aus dem Katalog entfernen?",
  haeufigMarke: "häufig",
  seltenMarke: "selten",
  ziehenHinweis: "Zum Verschieben ziehen und an der gewünschten Stelle loslassen — auch in eine andere Kategorie",
  vorlagenPflegeTitel: "Vorlagen",
  umbenennen: "Umbenennen",
  kuerzelAendern: "Kürzel",
  loeschenKnopf: "Löschen",
  vorlageLoeschenFrage: "Vorlage „%s“ löschen? (Der Katalog bleibt unberührt.)",
  gespeichert: "Gespeichert.",
  zusatzAn: "Zusatz dieser Vorlage: erscheint beim Laden sichtbar, aber nicht angewählt — Klick nimmt ihn wieder raus",
  zusatzAus: "Als Zusatz vormerken: wird mit „Als eigene Vorlage speichern“ der Vorlage mitgegeben und erscheint dann beim Laden sichtbar, aber nicht angewählt"
};

TB.eeg = (function () {
  function S() {
    if (TB.speicher) return TB.speicher;
    return TB.eegQuelle || null;   // Erweiterung: nur lesend
  }

  // ---- Ablage ----------------------------------------------------------
  function master() {
    var q = S(); if (!q) return null;
    var m = q.einstellung("eegMaster", null);
    if (m && TB.speicher && migriereNeue(m)) speichereMaster(m);
    return m;
  }
  function speichereMaster(m) {
    TB.speicher.setzeEinstellung("eegMaster", m);
    if (TB.abgleich) TB.abgleich.anstossen();
  }
  function vorlagen() {
    var q = S(); if (!q) return [];
    return q.einstellung("eegVorlagen", []) || [];
  }
  function speichereVorlagen(liste) {
    TB.speicher.setzeEinstellung("eegVorlagen", liste);
    if (TB.abgleich) TB.abgleich.anstossen();
  }
  function grundausstattung(nurLeereVorlagen) {
    speichereMaster(TB.eegGrundlage.master());
    if (!nurLeereVorlagen || !vorlagen().length) {
      speichereVorlagen(TB.eegGrundlage.vorlagen());
    }
  }
  // Nachziehen: Punkte und Kategorien, die die Grundausstattung neu
  // bekommt, werden hinter ihrem Vorgänger eingefügt; Näds eigene
  // Texte und seine Reihenfolge bleiben unberührt.
  function migriereNeue(m) {
    var frisch = TB.eegGrundlage.master();
    var geaendert = false;
    m.kategorien = m.kategorien || [];
    m.punkte = m.punkte || [];
    frisch.kategorien.forEach(function (k, idx) {
      if (m.kategorien.some(function (x) { return x.id === k.id; })) return;
      var ziel = m.kategorien.length;
      if (idx > 0) {
        for (var i = 0; i < m.kategorien.length; i++)
          if (m.kategorien[i].id === frisch.kategorien[idx - 1].id) ziel = i + 1;
      }
      m.kategorien.splice(ziel, 0, JSON.parse(JSON.stringify(k)));
      geaendert = true;
    });
    function posVon(id) {
      for (var i = 0; i < m.punkte.length; i++)
        if (m.punkte[i].id === id) return i;
      return -1;
    }
    frisch.punkte.forEach(function (g, idx) {
      if (posVon(g.id) !== -1) return;
      var ziel = m.punkte.length;
      if (idx > 0) {
        var vorher = posVon(frisch.punkte[idx - 1].id);
        if (vorher !== -1) ziel = vorher + 1;
      }
      m.punkte.splice(ziel, 0, JSON.parse(JSON.stringify(g)));
      geaendert = true;
    });
    if (m.stand !== frisch.stand) { m.stand = frisch.stand; geaendert = true; }
    return geaendert;
  }

  // ---- Zugriffe --------------------------------------------------------
  function punkt(m, id) {
    return m.punkte.find(function (x) { return x.id === id; }) || null;
  }
  function jeKategorie(m, bereich) {
    return m.kategorien.filter(function (k) {
      return !bereich || (k.bereich || "befund") === bereich;
    }).map(function (k) {
      return { kategorie: k, punkte: m.punkte.filter(function (x) {
        return x.kategorie === k.id; }) };
    });
  }
  function vorlageMitKuerzel(kuerzel) {
    var k = String(kuerzel || "").toLowerCase();
    return vorlagen().find(function (v) {
      return String(v.kuerzel || "").toLowerCase() === k; }) || null;
  }
  function neuePunktId(m, wunsch) {
    var basis = String(wunsch || "p").toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
      .replace(/[^a-z0-9]/g, "").slice(0, 24) || "p";
    var id = basis, nr = 1;
    while (punkt(m, id)) { nr += 1; id = basis + nr; }
    return id;
  }

  // ---- Zerlegen und Auflösen -------------------------------------------
  // Stücke: {art:"text", wert} · {art:"auswahl", label, optionen[]} ·
  // {art:"feld", label, vorgabe}. Gleiche Beschriftung mehrfach im
  // Punkt → derselbe Wert überall.
  function zerlege(text) {
    var stuecke = [], rest = String(text || "");
    var muster = /\{\{(Auswahl|Feld):([^:}=]+?)(?::([^}]*)|=([^}]*))?\}\}/;
    while (rest.length) {
      var t = muster.exec(rest);
      if (!t) { stuecke.push({ art: "text", wert: rest }); break; }
      if (t.index > 0) stuecke.push({ art: "text", wert: rest.slice(0, t.index) });
      if (t[1] === "Auswahl") {
        stuecke.push({ art: "auswahl", label: t[2].trim(),
                       optionen: String(t[3] || "").split("|") });
      } else {
        stuecke.push({ art: "feld", label: t[2].trim(),
                       vorgabe: t[4] !== undefined ? t[4] : "" });
      }
      rest = rest.slice(t.index + t[0].length);
    }
    return stuecke;
  }
  function wertVon(stueck, werte, pid) {
    var je = (werte && werte[pid]) || {};
    if (je[stueck.label] !== undefined) return je[stueck.label];
    if (stueck.art === "auswahl") return stueck.optionen[0] || "";
    return stueck.vorgabe;
  }
  // Der aufgelöste Text eines Punkts aus den aktuellen Werten (ohne
  // Überschreibung) — die „Vorgabe", gegen die Überschriebenes
  // verglichen wird.
  function aufgeloest(p, werte) {
    return zerlege(p.text).map(function (s) {
      return s.art === "text" ? s.wert : wertVon(s, werte, p.id);
    }).join("");
  }
  function mitPunktEnde(t) {
    var s = String(t || "").trim();
    if (!s) return s;
    return /[.!?…:]$/.test(s) ? s : s + ".";
  }
  function schuetze(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Wort-Unterschied (eigene Kopie der Status-Logik, damit die Datei
  // auch in der Erweiterung ohne status.js läuft).
  var ABWEICHFARBE = "#444444";
  function wortUnterschied(normal, abw) {
    var a = String(normal), b = String(abw);
    var vorn = 0, hinten = 0;
    while (vorn < a.length && vorn < b.length &&
           a.charAt(vorn) === b.charAt(vorn)) vorn++;
    while (hinten < a.length - vorn && hinten < b.length - vorn &&
           a.charAt(a.length - 1 - hinten) === b.charAt(b.length - 1 - hinten))
      hinten++;
    while (vorn > 0 && b.charAt(vorn - 1) !== " ") vorn--;
    while (hinten > 0 && b.charAt(b.length - hinten) !== " ") hinten--;
    var mitte = b.slice(vorn, b.length - hinten);
    if (!mitte) { vorn = 0; hinten = 0; mitte = b; }
    return { vor: b.slice(0, vorn), mitte: mitte,
             nach: b.slice(b.length - hinten) };
  }

  // ---- Fliesstext -------------------------------------------------------
  // Je Bereich (befund/beurteilung): Kategorien in Listen-Reihenfolge;
  // titel=true schreibt „Name" unterstrichen (Doppelpunkt NICHT
  // unterstrichen), absatz=true setzt eine Leerzeile davor (nie vor
  // dem ersten gedruckten Block). Überschriebenes: nur der veränderte
  // Wortbereich fett in Dunkelgrau.
  function bereichText(m, bereich, gewaehlt, werte, abweichungen) {
    var html = [], text = [], schonWas = false;
    jeKategorie(m, bereich).forEach(function (block) {
      var teile = block.punkte.filter(function (p) { return !!gewaehlt[p.id]; });
      if (!teile.length) return;
      var stueckeH = [], stueckeT = [];
      teile.forEach(function (p) {
        var soll = aufgeloest(p, werte);
        var a = abweichungen && abweichungen[p.id];
        var istAbw = (a !== undefined && a !== null &&
                      String(a).trim() !== "" &&
                      String(a).trim() !== soll.trim());
        var fertig = mitPunktEnde(istAbw ? a : soll);
        stueckeT.push(fertig);
        if (istAbw) {
          var d = wortUnterschied(mitPunktEnde(soll), fertig);
          stueckeH.push(schuetze(d.vor) +
            "<b><span style=\"color:" + ABWEICHFARBE + "\">" +
            schuetze(d.mitte) + "</span></b>" + schuetze(d.nach));
        } else {
          stueckeH.push(schuetze(fertig));
        }
      });
      if (block.kategorie.absatz && schonWas) {
        html.push("<p>&nbsp;</p>");
        text.push("");
      }
      var vorH = block.kategorie.titel
        ? "<u>" + schuetze(block.kategorie.name) + "</u>: " : "";
      var vorT = block.kategorie.titel ? block.kategorie.name + ": " : "";
      html.push("<p>" + vorH + stueckeH.join(" ") + "</p>");
      text.push(vorT + stueckeT.join(" "));
      schonWas = true;
    });
    return { html: html.join(""), text: text.join("\n") };
  }
  function fliesstext(m, gewaehlt, werte, abweichungen) {
    return {
      befund: bereichText(m, "befund", gewaehlt, werte, abweichungen),
      beurteilung: bereichText(m, "beurteilung", gewaehlt, werte, abweichungen)
    };
  }
  // Beides als EIN Block (Axenita-Weg und „Beides kopieren"):
  // unterstrichene Titel „Befund" und „Beurteilung", Leerzeile dazwischen.
  function block(f) {
    var T = TB.eegTexte;
    var html = "<p><u>" + T.befundTitel + "</u></p>" + f.befund.html +
      "<p>&nbsp;</p><p><u>" + T.beurteilungTitel + "</u></p>" + f.beurteilung.html;
    var text = T.befundTitel + "\n" + f.befund.text + "\n\n" +
      T.beurteilungTitel + "\n" + f.beurteilung.text;
    return { html: html, text: text };
  }

  // ---- Vorlagen ---------------------------------------------------------
  function vorlageSpeichern(name, kuerzel, punkte, zusatz, werte) {
    var liste = vorlagen();
    var da = liste.find(function (v) {
      return v.name.toLowerCase() === String(name).toLowerCase(); });
    var zu = (zusatz || []).filter(function (id) {
      return punkte.indexOf(id) === -1; });
    var w = werte || {};
    if (da) {
      da.kuerzel = String(kuerzel || da.kuerzel || "");
      da.punkte = punkte.slice();
      if (zu.length) da.zusatz = zu; else delete da.zusatz;
      da.werte = w;
    } else {
      liste.push({ id: "v" + Date.now().toString(36), name: String(name),
                   kuerzel: String(kuerzel || ""), punkte: punkte.slice(),
                   zusatz: zu.length ? zu : undefined, werte: w });
    }
    speichereVorlagen(liste);
    return !da;
  }

  return { master: master, speichereMaster: speichereMaster,
           vorlagen: vorlagen, speichereVorlagen: speichereVorlagen,
           vorlageSpeichern: vorlageSpeichern,
           vorlageMitKuerzel: vorlageMitKuerzel,
           grundausstattung: grundausstattung, migriereNeue: migriereNeue,
           punkt: punkt, jeKategorie: jeKategorie, neuePunktId: neuePunktId,
           zerlege: zerlege, wertVon: wertVon, aufgeloest: aufgeloest,
           fliesstext: fliesstext, block: block,
           wortUnterschied: wortUnterschied };
})();
