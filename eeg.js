// Datei: eeg.js
// Projekt: Textbausteine — Teil: App (Browser) UND Chrome-Erweiterung
//          (byteweise Kopie — Prüfsuite: cmp)
// Zweck: Das Herz des EEG-Werks: liest und schreibt Katalog und
//        Vorlagen (Einstellungs-Werte eegMaster/eegVorlagen, syncen
//        auf alle Geräte), zerlegt Punkt-Texte in feste Stücke,
//        Auswahlen und Felder, löst sie mit den gewählten Werten auf
//        und erzeugt den fertigen Fliesstext für Befund und
//        Beurteilung (HTML und reiner Text; Kategorien unterstrichen,
//        der Doppelpunkt nicht, Überschriebenes OHNE Hervorhebung —
//        im EEG steht nur, was auffällig ist). NEU in 16.1: die
//        Herd- und Entladungs-Zeilen des Schnell-Befunds (Band,
//        Lokalisations-Kette, Ausbreitung, Seite) und die Automatik,
//        die die Beurteilung aus dem Befund baut (Regeln in
//        eeg-grundlage.js, REGELN).
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
  seltenTitel: "Selten gebraucht (aufklappen):",
  herdDazu: "+ Herd",
  transDazu: "+ steile Transienten",
  mediDazu: "+ Medikament",
  indikationTitel: "Indikation/Fragestellung",
  anamneseTitel: "Relevante Anamnese",
  kopierenIndikation: "Indikation kopieren",
  kopierenAnamnese: "Anamnese kopieren",
  entDazu: "+ Entladung",
  zeileWeg: "Zeile entfernen (vorbereitete Zeilen werden geleert)",
  zeileZaehlt: "Zeile zählt im Befund — jedes Anfassen kreuzt sie von selbst an",
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
  // Nachziehen. Beim Stand-Wechsel auf den 16.1-Umbau wird der
  // Katalog EINMAL voll ersetzt (Schnell-Befund braucht die neue
  // Struktur); eigene Punkte mit id-Anfang "eig" werden hinten an
  // ihre Kategorie gehängt, die Start-Vorlagen neu gesetzt, eigene
  // Vorlagen bleiben. Danach gilt wieder: Neues wird hinter seinem
  // Vorgänger eingefügt, Näds Texte und Reihenfolge bleiben.
  function migriereNeue(m) {
    var frisch = TB.eegGrundlage.master();
    var geaendert = false;
    if (m.stand !== frisch.stand) {
      var eigene = (m.punkte || []).filter(function (p) {
        return String(p.id).indexOf("eig") === 0; });
      m.kategorien = frisch.kategorien;
      m.punkte = frisch.punkte;
      eigene.forEach(function (p) {
        if (!m.kategorien.some(function (k) { return k.id === p.kategorie; }))
          p.kategorie = m.kategorien[0].id;
        m.punkte.push(p);
      });
      m.stand = frisch.stand;
      if (TB.speicher) {
        var liste = vorlagen().filter(function (v) {
          return v.id !== "v_eeg" && v.id !== "v_eegips"; });
        liste = TB.eegGrundlage.vorlagen().concat(liste);
        liste.forEach(function (v) {
          v.punkte = (v.punkte || []).filter(function (id) {
            return m.punkte.some(function (p) { return p.id === id; }); });
          if (v.zusatz) v.zusatz = v.zusatz.filter(function (id) {
            return m.punkte.some(function (p) { return p.id === id; }); });
        });
        speichereVorlagen(liste);
      }
      return true;
    }
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
  // auch in der Erweiterung ohne status.js läuft) — dient nur noch der
  // Maske (↺ und Klick-Stelle), die AUSGABE hebt nichts hervor.
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

  // ---- Herd- und Entladungs-Zeilen des Schnell-Befunds ------------------
  // Eine Zeile: { haeufigkeit, band|form, lok:[bis 4 Regionen ODER
  // "generalisiert"/"hemisphärisch"], ausbreitung, seite }. Die
  // Lokalisations-Kette bindet: frontal+temporal → "fronto-temporal",
  // temporal+frontal → "temporo-frontal" (letztes Glied voll).
  function R() { return TB.eegGrundlage.REGELN; }
  function bandVon(id) {
    return R().baender.find(function (b) { return b.id === id; }) ||
      R().baender[0];
  }
  function kettenText(lok) {
    var glieder = (lok || []).filter(function (x) { return !!x; });
    if (!glieder.length) return "";
    if (glieder[0] === "generalisiert") return "generalisiert";
    if (glieder[0] === "hemisphärisch") return "hemisphärisch";
    return glieder.map(function (g, i) {
      if (i === glieder.length - 1) return g;
      var r = R().regionen.find(function (x) { return x.id === g; });
      return (r ? r.binde : g) + "-";
    }).join("");
  }
  function lokMitSeite(z) {
    var kette = kettenText(z.lok);
    if (kette === "generalisiert") return "generalisiert";
    var seite = z.seite || "";
    return (kette + (seite ? " " + seite : "")).trim();
  }
  function ausbreitungsText(z) {
    if (!z.ausbreitung) return "";
    if (kettenText(z.lok) === "generalisiert") return "";
    return ", mit Ausbreitung " + z.ausbreitung;
  }
  function herdBefundSatz(z) {
    var h = z.haeufigkeit || R().herdHaeufigkeiten[0];
    return h + " eingelagerte Wellen aus dem " + bandVon(z.band).wort +
      " " + lokMitSeite(z) + ausbreitungsText(z) + ".";
  }
  function herdBeurteilungSatz(z) {
    var b = bandVon(z.band);
    var zusatz = b.zusatz || "";
    if (kettenText(z.lok) === "generalisiert") {
      return b.gen + " " + R().verlangsamungGen + zusatz + ".";
    }
    return b.herd + " " + R().herdWort + " " + lokMitSeite(z) + zusatz + ".";
  }
  function entBefundSatz(z) {
    var h = z.haeufigkeit || R().entHaeufigkeiten[0];
    var form = z.form || R().entFormen[0];
    if (kettenText(z.lok) === "generalisiert") {
      return h + " generalisierte " + form + ".";
    }
    return h + " " + form + " " + lokMitSeite(z) + ausbreitungsText(z) + ".";
  }
  function transBefundSatz(z) {
    var h = z.haeufigkeit || R().transHaeufigkeiten[0];
    var lage = lokMitSeite(z);
    return h + " " + R().transWort + (lage ? " " + lage : "") +
      ausbreitungsText(z) + R().transSchluss + ".";
  }
  function entBeurteilungSatz(z) {
    if (kettenText(z.lok) === "generalisiert") {
      return R().etpGeneralisiert + ".";
    }
    return R().etpWort + " " + lokMitSeite(z) + ".";
  }

  // ---- Beurteilungs-Automatik -------------------------------------------
  // Baut die Kern-Beurteilung aus dem Befund (Näd 2.10.: er will sie
  // nie selbst machen): Grundrhythmus-Satz aus der Frequenz (unter 8
  // leicht, unter 6 mittelschwer; 8,0 noch normal, 6,0 noch leicht),
  // dann fGRDA, dann je Herd-Zeile ihr Satz (ohne Häufigkeit), dann
  // je Entladungs-Zeile ihrer. Jeder Satz trägt eine feste Kennung
  // und lässt sich in der Maske überschreiben.
  function hzWert(gewaehlt, werte) {
    var ids = ["ga_grundrhythmus", "ga_diffus"];
    for (var i = 0; i < ids.length; i++) {
      if (!gewaehlt[ids[i]]) continue;
      var roh = (werte && werte[ids[i]] && werte[ids[i]]["Frequenz"]);
      if (roh === undefined) roh = (ids[i] === "ga_diffus") ? "6" : "9";
      var zahl = parseFloat(String(roh).replace(",", "."));
      if (!isNaN(zahl)) return zahl;
    }
    return null;
  }
  function avSatz(hz) {
    var r = R();
    if (hz === null) return null;
    if (hz >= r.avNormalAb) return r.avSaetze.normal;
    if (hz >= r.avLeichtAb) return r.avSaetze.leicht;
    return r.avSaetze.mittel;
  }
  function schlafStadium(gewaehlt) {
    var tiefstes = null;
    var reihen = R().schlafStadien;
    R().schlafElemente.forEach(function (e) {
      if (!gewaehlt[e.id]) return;
      if (tiefstes === null ||
          reihen.indexOf(e.stadium) > reihen.indexOf(tiefstes))
        tiefstes = e.stadium;
    });
    return tiefstes;
  }
  function grossAnfang(t) {
    t = String(t || "");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function autoBeurteilung(gewaehlt, werte, zeilen) {
    var z = zeilen || {};
    var herde = z.herde || [], ent = z.entladungen || [];
    var saetze = [];
    // Eingeschränkte Beurteilbarkeit steht GANZ VORN (Näd 2.10.).
    if (gewaehlt["art_grenze"]) {
      var grad = (werte && werte["art_grenze"] &&
        werte["art_grenze"]["Grad"]) || "leicht";
      saetze.push({ id: "auto_grenze",
        text: R().grenzSatz.replace("%s", grossAnfang(grad)) });
    }
    // "Grundaktivität: nicht beurteilbar." ERSETZT den
    // Grundrhythmus-Satz der Automatik.
    if (gewaehlt["ga_nb"]) {
      saetze.push({ id: "auto_ganb", text: R().gaNbBeurteilung });
    } else {
      var av = avSatz(hzWert(gewaehlt, werte));
      if (av) saetze.push({ id: "auto_av", text: av });
    }
    if (gewaehlt["ga_fgrda"]) {
      saetze.push({ id: "auto_fgrda", text: R().fgrdaBeurteilung });
    }
    var stadium = schlafStadium(gewaehlt);
    if (stadium) {
      saetze.push({ id: "auto_schlaf",
        text: R().schlafSatz.replace("%s", stadium) });
    }
    function keineSatz(pid, tabelle, vorgabe) {
      var wert = (werte && werte[pid] && werte[pid]["Befund"]) || "keine.";
      return tabelle[wert] || vorgabe;
    }
    if (herde.length) {
      herde.forEach(function (h, i) {
        saetze.push({ id: "auto_h" + i, text: herdBeurteilungSatz(h) }); });
    } else if (gewaehlt["vl_keine"]) {
      saetze.push({ id: "auto_hkeine",
        text: keineSatz("vl_keine", R().keineVariantenHerde,
                        R().keineHerde) });
    }
    if (ent.length) {
      ent.forEach(function (e, i) {
        saetze.push({ id: "auto_e" + i, text: entBeurteilungSatz(e) }); });
    } else if (gewaehlt["ent_keine"]) {
      saetze.push({ id: "auto_ekeine",
        text: keineSatz("ent_keine", R().keineVariantenEtp,
                        R().keineEtp) });
    }
    return saetze;
  }

  // ---- Fliesstext -------------------------------------------------------
  // Je Bereich (befund/beurteilung): Kategorien in Listen-Reihenfolge;
  // titel=true schreibt „Name" unterstrichen (Doppelpunkt NICHT
  // unterstrichen), absatz=true setzt eine Leerzeile davor (nie vor
  // dem ersten gedruckten Block). Überschriebenes: nur der veränderte
  // Wortbereich fett in Dunkelgrau.
  function satzFertig(soll, abweichungen, id) {
    var a = abweichungen && abweichungen[id];
    var istAbw = (a !== undefined && a !== null &&
                  String(a).trim() !== "" &&
                  String(a).trim() !== String(soll).trim());
    return mitPunktEnde(istAbw ? a : soll);
  }
  function bereichText(m, bereich, gewaehlt, werte, abweichungen, zeilen) {
    var z = zeilen || {};
    var html = [], text = [], schonWas = false;
    jeKategorie(m, bereich).forEach(function (block) {
      var teile = block.punkte.filter(function (p) { return !!gewaehlt[p.id]; });
      var zeilenSaetze = [], nachSaetze = [];
      if (bereich === "anamnese" && block.kategorie.zeilen === "medis") {
        var medis = z.medis || [];
        if (medis.length) {
          var teileSatz = medis.map(function (mz) {
            var name = (mz.name === R().mediFreitext)
              ? String(mz.frei || "").trim() : (mz.name || "");
            var dosis = String(mz.dosis || "").trim();
            if (dosis && !/mg/i.test(dosis)) dosis += " mg";
            return name + (dosis ? " " + dosis : "");
          }).join(", ") + ".";
          // steht NACH dem Titel-Punkt "Aktuelle ... Medikation:"
          nachSaetze.push({ id: "z_medis", satz: teileSatz });
        }
      }
      if (bereich === "befund" && block.kategorie.zeilen) {
        var liste = z[block.kategorie.zeilen] || [];
        var trans = (block.kategorie.zeilen === "herde")
          ? (z.transienten || []) : [];
        if (liste.length || trans.length) {
          // Zeilen ersetzen „keine." und stehen vor den Zusatz-Punkten.
          teile = teile.filter(function (p) {
            return p.id !== "vl_keine" && p.id !== "ent_keine"; });
          liste.forEach(function (zle, i) {
            var satz = block.kategorie.zeilen === "herde"
              ? herdBefundSatz(zle) : entBefundSatz(zle);
            zeilenSaetze.push({ id: "z_" + block.kategorie.zeilen + i,
                                satz: satz });
          });
          trans.forEach(function (zle, i) {
            zeilenSaetze.push({ id: "z_trans" + i,
                                satz: transBefundSatz(zle) });
          });
        }
      }
      // Hyperventilation/Photostimulation: Häkchen weg heisst
      // automatisch "nicht durchgeführt." (überschreibbar; Näd 2.10.).
      if (bereich === "befund" && !teile.length && !zeilenSaetze.length &&
          (block.kategorie.id === "hyperventilation" ||
           block.kategorie.id === "photostimulation")) {
        zeilenSaetze.push({ id: "auto_" + block.kategorie.id,
                            satz: R().nichtDurchgefuehrt });
      }
      var autoSaetze = [];
      if (bereich === "beurteilung" && block.kategorie.id === "beurteilung") {
        autoSaetze = autoBeurteilung(gewaehlt, werte, z);
      }
      if (!teile.length && !zeilenSaetze.length && !nachSaetze.length &&
          !autoSaetze.length) return;
      var stueckeH = [], stueckeT = [];
      autoSaetze.forEach(function (a) {
        var fertig = satzFertig(a.text, abweichungen, a.id);
        stueckeT.push(fertig);
        stueckeH.push(schuetze(fertig));
      });
      zeilenSaetze.forEach(function (zs) {
        var fertig = satzFertig(zs.satz, abweichungen, zs.id);
        stueckeT.push(fertig);
        stueckeH.push(schuetze(fertig));
      });
      teile.forEach(function (p) {
        var soll = aufgeloest(p, werte);
        var a = abweichungen && abweichungen[p.id];
        var istAbw = (a !== undefined && a !== null &&
                      String(a).trim() !== "" &&
                      String(a).trim() !== soll.trim());
        var fertig = mitPunktEnde(istAbw ? a : soll);
        stueckeT.push(fertig);
        stueckeH.push(schuetze(fertig));
      });
      nachSaetze.forEach(function (zs) {
        var fertig = satzFertig(zs.satz, abweichungen, zs.id);
        stueckeT.push(fertig);
        stueckeH.push(schuetze(fertig));
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
  function fliesstext(m, gewaehlt, werte, abweichungen, zeilen) {
    return {
      indikation: bereichText(m, "indikation", gewaehlt, werte,
                              abweichungen, zeilen),
      anamnese: bereichText(m, "anamnese", gewaehlt, werte,
                            abweichungen, zeilen),
      befund: bereichText(m, "befund", gewaehlt, werte, abweichungen, zeilen),
      beurteilung: bereichText(m, "beurteilung", gewaehlt, werte,
                               abweichungen, zeilen)
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
  function vorlageSpeichern(name, kuerzel, punkte, zusatz, werte, zeilen) {
    var liste = vorlagen();
    var da = liste.find(function (v) {
      return v.name.toLowerCase() === String(name).toLowerCase(); });
    var zu = (zusatz || []).filter(function (id) {
      return punkte.indexOf(id) === -1; });
    var w = werte || {};
    var z = zeilen || {};
    var herde = (z.herde || []).map(function (x) {
      return JSON.parse(JSON.stringify(x)); });
    var ent = (z.entladungen || []).map(function (x) {
      return JSON.parse(JSON.stringify(x)); });
    var trans = (z.transienten || []).map(function (x) {
      return JSON.parse(JSON.stringify(x)); });
    if (da) {
      da.kuerzel = String(kuerzel || da.kuerzel || "");
      da.punkte = punkte.slice();
      if (zu.length) da.zusatz = zu; else delete da.zusatz;
      da.werte = w;
      if (herde.length) da.herde = herde; else delete da.herde;
      if (ent.length) da.entladungen = ent; else delete da.entladungen;
      if (trans.length) da.transienten = trans; else delete da.transienten;
    } else {
      liste.push({ id: "v" + Date.now().toString(36), name: String(name),
                   kuerzel: String(kuerzel || ""), punkte: punkte.slice(),
                   zusatz: zu.length ? zu : undefined, werte: w,
                   herde: herde.length ? herde : undefined,
                   entladungen: ent.length ? ent : undefined,
                   transienten: trans.length ? trans : undefined });
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
           wortUnterschied: wortUnterschied,
           kettenText: kettenText, herdBefundSatz: herdBefundSatz,
           herdBeurteilungSatz: herdBeurteilungSatz,
           entBefundSatz: entBefundSatz,
           entBeurteilungSatz: entBeurteilungSatz,
           transBefundSatz: transBefundSatz,
           autoBeurteilung: autoBeurteilung, avSatz: avSatz };
})();
