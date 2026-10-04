// Datei: ansicht-bericht-mc.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Der Bereich „Berichte“ mit dem Bericht Memory Clinic:
//        Näd kopiert den neuropsychologischen Vorbericht aus der
//        KISIM-Zwischenablage in EIN Feld; die App zerschneidet ihn an
//        den bekannten Zwischentiteln und baut daraus die Inhalte für
//        seine KISIM-Vorlage — das Anamnese-Feld (Sozial-, Schul-,
//        Familien-, Persönliche und Systemanamnese, Medikamente;
//        Krankheitsanamnese wird zu Persönliche Anamnese) und die
//        Demenz-Scores (IQCODE, IADL, CDR aus dem Text gelesen).
//        Je KISIM-Feld ein Kopieren-Knopf; über den Wächter kommt
//        alles formatiert in KISIM an.
//        GRUNDSATZ 1: Der Vorbericht ist ein Patiententext — er wird
//        NIE gespeichert, nichts verlässt dieses Fenster ausser über
//        die Zwischenablage. Die sichtbaren Texte stehen hier als
//        eigenes Textobjekt (texte.js bleibt Erweiterungs-Kopie,
//        Muster ansicht-kaertchen.js).

"use strict";
window.TB = window.TB || {};

TB.berichtMcTexte = {
  bereichBerichte: "Berichte",
  mcTitel: "Bericht Memory Clinic",
  mcHinweis: "Vorbericht der Neuropsychologie unten hineinkopieren — die App sortiert die Abschnitte in Deine KISIM-Vorlage ein. Es wird nichts gespeichert; beim Verlassen der Seite ist alles weg.",
  quellePlatzhalter: "Hier den ganzen Text aus der KISIM-Zwischenablage einfügen (Strg+V) …",
  wahlGeschlecht: "Anrede",
  auto: "automatisch (aus dem Text)",
  patientin: "weiblich", patient: "männlich",
  wahlErscheinen: "Erschienen",
  erschienBegleitung: "in Begleitung", erschienAllein: "alleine",
  begleitPlatzhalter: "z. B. des Ehemanns",
  wahlKompetenz: "Anamnesekompetenz",
  kompetenz1: "vollumfänglich gegeben",
  kompetenz2: "nur partiell gegeben",
  kompetenz3: "nicht gegeben",
  einsortierenKnopf: "Einsortieren",
  quelleLeer: "Zuerst den Vorbericht in das grosse Feld einfügen.",
  zielAnamnese: "Für das KISIM-Feld „Anamnese“",
  zielUntersuchungen: "Für das KISIM-Feld „Untersuchungen“ (Demenz-Scores)",
  kopierenKnopf: "Kopieren",
  kopiertMeldung: "Kopiert — in KISIM ins Feld klicken und mit Strg+V einfügen.",
  kopiertNurText: "Kopiert — nur als reiner Text (ohne Unterstreichungen).",
  kopierenFehl: "Kopieren fehlgeschlagen.",
  fehltHinweis: "Im Vorbericht nicht gefunden (steht als xx im Ergebnis): %s",
  allesGefunden: "Alle Abschnitte gefunden.",
  zumStatus: "Memory-Status öffnen (im Status-Werk vorausgewählt)",
  uebernommen: "(übernommen aus neuropsychologischem Vorbericht)",
  ueberschriftSozial: "Sozialanamnese",
  ueberschriftSchule: "Schul-, Bildungs- und Berufsanamnese",
  ueberschriftFamilie: "Familienanamnese",
  ueberschriftPersoenlich: "Persönliche Anamnese",
  ueberschriftSystem: "Systemanamnese",
  ueberschriftMedis: "Aktuelle Medikamente/Therapien",
  vorlageSatz: "Die ausführliche Anamnese ist dem neuropsychologischen Vorbericht zu entnehmen. Relevante Anamneseergänzungen wurden heute keine gemacht.",
  zusatzTitel: "Zusatzuntersuchungen einlesen",
  zusatzHinweis: "EEG-Brief, Radiologie-Report, Viollier-LP — oder den GANZEN übernommenen Untersuchungsblock aus KISIM auf einmal — hier einfügen und einlesen. Die App holt Datum und Befund und ordnet chronologisch. Auch hier: nichts wird gespeichert.",
  zusatzPlatzhalter: "Einen Zusatzuntersuchungs-Bericht einfügen (Strg+V) …",
  zusatzKnopf: "Einlesen",
  zusatzUnbekannt: "Format nicht erkannt — schick mir dieses Beispiel (anonymisiert), ich baue es ein.",
  zusatzLeer: "Zuerst einen Befundtext in das Zusatz-Feld einfügen.",
  anamneseVom: "Anamnese vom",
  fremdTitel: "Fremdanamnese"
};

TB.ansichtBerichtMc = (function () {
  var TX = function () { return TB.berichtMcTexte; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };

  // ---- Zerschneiden an den bekannten Zwischentiteln -------------------
  // Ein Zwischentitel ist eine EIGENE, kurze Zeile. Manche tragen einen
  // Zusatz in Klammern („Fremdanamnese (Gespräch …)“) — darum genügt
  // bei diesen der Zeilenanfang.
  var GENAU = ["konsultationsgrund", "anamnese", "aktuell", "sozialanamnese",
    "geburts- und entwicklungsanamnese", "familienanamnese",
    "krankheitsanamnese", "persönliche anamnese", "systemanamnese",
    "befunde und beobachtungen", "verhalten", "affekt", "beurteilung",
    "schlussatz", "schlusssatz"];
  var ANFANG = ["fremdanamnese", "ergänzende information", "iqcode",
    "die iadl", "iadl-skala", "die badl", "badl",
    "kognitive und funktionelle leistung", "schul-",
    "aktuelle medikation", "aktuelle medikamente",
    "testpsychologische", "empfehlungen"];
  // Score-Absätze (IQCODE, IADL, BADL, CDR) schliessen den laufenden
  // Abschnitt IMMER, auch als lange Zeile — sonst rutschten sie in die
  // Fremdanamnese (Befund Spital 30.9.). Sie gehören nur zu den
  // Untersuchungen.
  var SCORE_ANFANG = ["iqcode", "die iadl", "iadl-skala", "die badl", "badl",
    "kognitive und funktionelle leistung"];
  function istKopf(zeile) {
    var z = zeile.trim().replace(/:\s*$/, "").toLowerCase();
    if (z && SCORE_ANFANG.some(function (a) { return z.indexOf(a) === 0; })) return true;
    if (!z || z.length > 100) return false;
    if (GENAU.indexOf(z) !== -1) return true;
    return ANFANG.some(function (a) { return z.indexOf(a) === 0; });
  }
  function zielVon(kopf) {
    var z = kopf.trim().replace(/:\s*$/, "").toLowerCase();
    if (z === "aktuell") return "aktuell";
    if (z.indexOf("fremdanamnese") === 0) return "fremd";
    if (z === "sozialanamnese") return "sozial";
    if (z.indexOf("schul-") === 0) return "schule";
    if (z === "familienanamnese") return "familie";
    if (z === "krankheitsanamnese" || z === "persönliche anamnese") return "persoenlich";
    if (z === "systemanamnese") return "system";
    if (z.indexOf("aktuelle medik") === 0) return "medis";
    return null;
  }
  // Datum der neuropsychologischen Untersuchung (1.10.): Nur der Kopf
  // (erste 8 Zeilen) zählt, und nur ein PLAUSIBEL junges Datum — ein
  // Geburtsdatum (1941) kann es nie sein, egal wie die Zeile lautet
  // (Befund 1.10.: „Demenz-Scores vom 20.06.1941"). Bevorzugt wird eine
  // Zeile mit „Untersuchung", dann „Bericht/Datum", sonst die erste.
  function neuroDatumVon(zeilen, jahrJetzt) {
    var jahr = jahrJetzt || new Date().getFullYear();
    var kandidaten = [];
    zeilen.slice(0, 8).forEach(function (zl, i) {
      if (/geb/i.test(zl)) return;
      (zl.match(/\d{2}\.\d{2}\.\d{4}/g) || []).forEach(function (d) {
        var j = parseInt(d.slice(6), 10);
        if (j < jahr - 5 || j > jahr + 1) return;
        kandidaten.push({ d: d, i: i,
          rang: /untersuch/i.test(zl) ? 0 : /bericht|datum/i.test(zl) ? 1 : 2 });
      });
    });
    kandidaten.sort(function (a, b) { return (a.rang - b.rang) || (a.i - b.i); });
    return kandidaten.length ? kandidaten[0].d : null;
  }
  function zerlege(text) {
    var zeilen = String(text || "").replace(/\r\n?/g, "\n").split("\n");
    var abschnitte = {}, offenZiel = null, sammel = [];
    function abschluss() {
      if (offenZiel && !abschnitte[offenZiel]) {
        abschnitte[offenZiel] = sammel.join("\n").trim();
      }
      offenZiel = null; sammel = [];
    }
    var fremdKopf = "";
    zeilen.forEach(function (zeile) {
      if (istKopf(zeile)) {
        abschluss(); offenZiel = zielVon(zeile);
        if (offenZiel === "fremd" && !fremdKopf) fremdKopf = zeile.trim();
        return;
      }
      if (offenZiel) sammel.push(zeile);
    });
    abschluss();
    var alles = String(text || "");
    function zahl(muster) {
      var t = alles.match(muster);
      return t ? t[1].replace(",", ".") : null;
    }
    var scores = {
      iqcode: zahl(/IQCODE-?Score\s+beträgt\s+([\d]+[.,][\d]+)/i) ||
              zahl(/IQCODE[^\d]{0,60}([\d]+[.,][\d]+)/i),
      iadl: zahl(/Scorewert\s+von\s+([\d]+\s*\/\s*8)/i) ||
            zahl(/\b([\d])\s*\/\s*8\b/),
      cdr: zahl(/CDR[^\d]{0,20}([0-3](?:[.,]5)?)/i)
    };
    if (scores.iadl) scores.iadl = scores.iadl.replace(/\s+/g, "");
    var weiblich = (alles.match(/Patientin/g) || []).length;
    var maennlich = (alles.match(/\bPatient(?!in)/g) || []).length;
    var begleit = alles.match(/in Begleitung\s+([^.\n]{3,60})/);
    // Sammelrunde 27.9.: Der Unterstützungsbedarf aus dem IADL-Absatz
    // wandert mit in die Demenz-Scores (bis zum Absatzende).
    var stuetz = alles.match(/Unterstützungsbedarf:\s*([\s\S]*?)(?=\n\s*\n|$)/);
    // Datum des neuropsychologischen Berichts (29.9.): nur im KOPF des
    // Vorberichts suchen (erste 8 Zeilen), damit alte Fremd-Daten aus dem
    // Anamnesetext ("Untersuchung vom 05.05.2025") nicht greifen. Nicht
    // gefunden = gelb, das ist so gewollt.
    var neuroDatum = neuroDatumVon(zeilen);
    var TXW = TX();
    var fehlend = [];
    [["sozial", TXW.ueberschriftSozial], ["schule", TXW.ueberschriftSchule],
     ["familie", TXW.ueberschriftFamilie], ["persoenlich", TXW.ueberschriftPersoenlich],
     ["system", TXW.ueberschriftSystem], ["medis", TXW.ueberschriftMedis]
    ].forEach(function (paar) {
      if (!abschnitte[paar[0]]) fehlend.push(paar[1]);
    });
    return { abschnitte: abschnitte, fehlend: fehlend, scores: scores,
             geschlecht: weiblich >= maennlich ? "w" : "m",
             begleitung: begleit ? begleit[1].trim() : "",
             unterstuetzung: stuetz
               ? stuetz[1].replace(/\s+/g, " ").trim() : "",
             fremdKopf: fremdKopf, neuroDatum: neuroDatum };
  }

  // ---- Aus den Teilen die KISIM-Feldinhalte bauen ---------------------
  function schuetze(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function absatzHtml(t) { return schuetze(t).replace(/\n/g, "<br>"); }
  // Gelb = "hier hat die App NICHTS eingefügt" (Näd 28.9.)
  function gelbH(t) {
    return "<span style=\"background-color:#ffd54d\">" + schuetze(t) + "</span>";
  }

  // ---- Medikamente aus der kopierten KISIM-Tabelle (28.9.) ------------
  // Ergebnis: "Name Stärke x-x-x" (Mo-Mi-Ab, vierte Zahl nur bei
  // Nachtdosis), Wochentags-Schemata aus der Bemerkung, "(pausiert)".
  var MEDFORMEN = /^(.+?)\s+(?:Tabl|Filmtabl|Tbl|Kaps|Drag|Supp|Lipolotio|Lotion|Creme|Salbe|Gel|Spray|Gtt|Tropfen|Sirup|Lös|Btl|Sachet|Inj|Amp|Ret\w*|Depot\w*|Brausetabl|Pulver|Kautabl|Lutschtabl)\b\s*(.*)$/;
  var MEDHERSTELLER = ["Mepha", "Sandoz", "Galepharm", "Spirig", "Axapharm",
    "Helvepharm", "Zentiva", "Streuli", "Viatris", "Teva", "Actavis",
    "Nobel", "eco"];
  function medName(roh, topisch) {
    var m = roh.match(MEDFORMEN);
    var name = m ? m[1] : (roh.match(/^([^a-zäöü]*[A-ZÄÖÜ0-9])(?=[a-zäöü])/) || [null, roh.split(/\s+/)[0]])[1];
    var rest = m ? m[2] : roh.slice(name.length);
    name = name.trim().split(/\s+/).filter(function (w, i) {
      if (i === 0) return true;
      if (w.length === 1) return false;              // "EXCIPIAL U"
      return MEDHERSTELLER.indexOf(w) === -1;
    }).map(function (w) {
      return w.split("-").map(function (t) {
        return (t.length > 1 && t === t.toUpperCase())
          ? t.charAt(0) + t.slice(1).toLowerCase() : t;
      }).join("-");
    }).join(" ");
    var st = rest.match(/([\d]+(?:[.,][\d]+)?(?:\/[\d]+(?:[.,][\d]+)?)*)\s*(mg|mcg|µg|g|ml|IE|E|%)?/);
    var staerke = "";
    if (st && st[1] && !topisch) {
      var einheit = st[2] || "mg";
      var stZiff = st[1].replace(/[.,]/g, "").replace(/^0+/, "");
      var nameZiff = (name.match(/[\d/]+/g) || []).join("");
      staerke = nameZiff.indexOf(stZiff) !== -1
        ? einheit : st[1].replace(",", ".") + " " + einheit;
    }
    return name + (staerke ? " " + staerke : "");
  }
  function medDosis(f, bem) {
    function v(x) {
      x = String(x || "").trim();
      if (!x) return 0;
      if (x === "½") return 0.5;
      if (x === "1½") return 1.5;
      return parseFloat(x.replace(",", ".").replace("½", ".5")) || 0;
    }
    var w = [v(f[2]), v(f[3]), v(f[4]), v(f[5])];
    if (w[0] || w[1] || w[2] || w[3]) {
      var n = w[3] ? 4 : 3;
      return w.slice(0, n).join("-");
    }
    var TAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag",
                "Freitag", "Samstag", "Sonntag"];
    var da = TAGE.filter(function (t) { return bem.indexOf(t) !== -1; });
    if (da.length) {
      var menge = bem.match(/:\s*([\d½.,]+)\s*Stk/);
      return da.join("/") + (menge ? " je " + menge[1].replace("½", "0.5") : "");
    }
    return "";
  }
  function medisFormat(inhalt) {
    if (!inhalt) return null;
    var zeilen = String(inhalt).split("\n");
    var meds = [], letzte = null;
    zeilen.forEach(function (zeile) {
      if (/Medikamentenname/.test(zeile)) return;
      if (/^\s*\*\s*Aus medizinischen/.test(zeile)) return;
      if (zeile.indexOf("\t") !== -1) {
        var f = zeile.split("\t");
        if (f.length >= 8 && f[0].trim()) {
          letzte = { f: f, bem: (f[8] || "").trim() };
          meds.push(letzte);
          return;
        }
      }
      if (letzte && zeile.trim()) letzte.bem += " " + zeile.trim();
    });
    if (!meds.length) return null;
    var teile = meds.map(function (m) {
      var pausiert = /pausiert/i.test(m.bem);
      var dosis = medDosis(m.f, m.bem.replace(/pausiert\.?/i, ""));
      var topisch = /topisch|lokal|kutan/i.test(m.f[7] || "");
      return medName(m.f[0].trim(), topisch) + (dosis ? " " + dosis : "") +
        (pausiert ? " (pausiert)" : "");
    });
    return teile.join(", ");
  }

  // ---- Zusatzuntersuchungen: Datum + Beurteilung herausholen ----------
  function ortAus(t) {
    if (/Universitätsspital|USZ/.test(t)) return "Universitätsspital Zürich";
    if (/Limmattal|Schlieren|LA Radiologie|044 736/.test(t)) return "Spital Limmattal";
    return "";
  }
  function zielAus(name) {
    var n = name.toUpperCase();
    if (/PET.?MR/.test(n)) return null;
    // Nur ein MR des KOPFES belegt die MRI-Zeile (1.10.: ein MR LWS
    // hätte sie sonst besetzt); andere MR erhalten eine eigene Zeile.
    if (/\bMR[IT]?\b|MAGNETRESONANZ/.test(n) &&
        /SCH[ÄA]DEL|NEUROKRAN|HIRN|KOPF|HYPOPHYS|CEREBR|KRANI/.test(n)) return "mri";
    if (/AMYLOID/.test(n)) return "amyloid";
    if (/FDG/.test(n)) return "fdg";
    if (/\bEEG\b/.test(n)) return "eeg";
    if (/LUMBAL|LIQUOR/.test(n)) return "lp";
    return null;
  }
  // Befundtext aus den Zeilen NACH der Kopfzeile bzw. nach „Beurteilung"
  // (1.10., Näds Entscheid): Die Unterschrift beendet den Text; Striche
  // („- …") fallen weg und der Text läuft zusammen; ECHTE Aufzählungs-
  // punkte (•, Word-Symbolpunkt) bleiben eine Aufzählung; reine Etiketten
  // wie „Beurteilung" oder „Befund/Beurteilung" fallen weg.
  var SIGNATUR = /^\s*(Dr\.?\s*med\b|Prof\.?\s|PD\s+Dr|Leitende[rn]?\s|Ober(arzt|ärztin)\b|Fach(arzt|ärztin)\b|Assistenz(arzt|ärztin)\b|Dieser Befund|Freundliche|Mit freundlichen|Visum\b|vis\s+\d)|elektronisch visiert/i;
  var PUNKTMARKE = /^\s*[\u2022\u25CF\u25AA\u25E6\u00B7\u2219\u2299\uF0B7\uF0A7\u2023\u2043]\s*/;
  var STRICH = /^\s*[-\u2013\u2014]\s*/;
  var ETIKETT = /^\s*((Befund\s*\/\s*)?Beurteilung|Befund)\s*:?\s*$/i;
  function befundText(zeilen) {
    var nachEtikett = -1;
    zeilen.forEach(function (z, i) {
      if (nachEtikett === -1 && /^\s*(Befund\s*\/\s*)?Beurteilung\s*:?\s*$/i.test(z)) nachEtikett = i;
    });
    if (nachEtikett !== -1) zeilen = zeilen.slice(nachEtikett + 1);
    var fliess = [], punkte = [], imPunkt = false;
    for (var i = 0; i < zeilen.length; i++) {
      var z = String(zeilen[i]).replace(/\s+$/, "");
      if (SIGNATUR.test(z) || /^\s*_{4,}/.test(z)) break;
      if (ETIKETT.test(z)) continue;
      if (!z.trim()) { imPunkt = false; continue; }
      if (PUNKTMARKE.test(z)) {
        punkte.push(z.replace(PUNKTMARKE, "").trim()); imPunkt = true; continue;
      }
      if (STRICH.test(z)) {
        var r = z.replace(STRICH, "").trim();
        if (r) fliess.push(r);
        imPunkt = false; continue;
      }
      if (imPunkt && punkte.length) { punkte[punkte.length - 1] += " " + z.trim(); continue; }
      fliess.push(z.trim());
    }
    return { text: fliess.join(" ").replace(/\s{2,}/g, " ").trim(),
             punkte: punkte.length ? punkte : null };
  }
  // Untersuchungsblock aus KISIM (1.10.): mehrere Befunde, je mit einer
  // Kopfzeile „[Zusatzuntersuchung] Name [Neurologie] vom TT.MM.JJJJ".
  var KOPFZEILE = /^\s*(Zusatzuntersuchung\s+)?(.{2,80}?)\s+vom\s+(\d{2}\.\d{2}\.\d{4})\s*$/;
  function parseBlock(t) {
    var eintraege = [], akt = null;
    t.split("\n").forEach(function (zl) {
      var m = KOPFZEILE.exec(zl);
      if (m) { akt = { name: m[2].trim(), datum: m[3], zeilen: [] }; eintraege.push(akt); return; }
      if (akt) akt.zeilen.push(zl);
    });
    if (!eintraege.length) return null;
    // Intern (KISIM-Block, kein Briefkopf/keine Unterschrift) = Spital
    // Limmattal; ein fremder Bericht mit Unterschrift bleibt gelb.
    var hatSignatur = t.split("\n").some(function (z) { return SIGNATUR.test(z); });
    var ort = ortAus(t) || (hatSignatur ? "" : "Spital Limmattal");
    var aus = [];
    eintraege.forEach(function (e) {
      var b = befundText(e.zeilen);
      if (!b.text && !b.punkte) return;
      var name = e.name.replace(/\s+Neurologie$/i, "").trim();
      aus.push({ ziel: zielAus(name), name: name, datum: e.datum, ort: ort,
                 beurteilung: b.text, punkte: b.punkte });
    });
    return aus.length ? aus : null;
  }
  // Alle Befunde aus einem eingefügten Text (Liste). parseZusatz bleibt
  // für den Einzelfall und gibt den ersten zurück.
  function parseZusatzAlle(text) {
    var t = String(text || "").replace(/\r\n?/g, "\n");
    var einzeln = parseEinzeln(t);
    if (einzeln) return [einzeln];
    var block = parseBlock(t);
    if (block) return block;
    var rest = parseRest(t);
    return rest ? [rest] : [];
  }
  function parseZusatz(text) {
    var l = parseZusatzAlle(text);
    return l.length ? l[0] : null;
  }
  // Sonderformate mit fester Gestalt: Viollier, Punktat, Radiology
  // Report, PACS-Export „Study:".
  function parseEinzeln(text) {
    var t = String(text || "").replace(/\r\n?/g, "\n");
    // Viollier-Demenzmarker (29.9.): Werte fuer die LP-Zeile; A/T/N
    // bleibt IMMER gelb (aerztliche Wertung).
    if (/Amyloid.?beta\s*1.42/i.test(t)) {
      var w = {};
      var m;
      if ((m = t.match(/Amyloid.?beta\s*1.42\D{0,20}?(\d+)/i))) w.ab42 = m[1];
      if ((m = t.match(/Amyloid.?beta\s*1.40\D{0,20}?(\d+)/i))) w.ab40 = m[1];
      if ((m = t.match(/42\/40\s*Quotient\D{0,20}?(0[.,]\d+)/i)))
        w.quotient = m[1].replace(",", ".");
      if ((m = t.match(/(?:^|[^o-])Tau.Protein\D{0,20}?(\d+(?:[.,]\d+)?)/i)))
        w.tau = m[1].replace(",", ".");
      if ((m = t.match(/Phospho.Tau.Protein\D{0,20}?(\d+(?:[.,]\d+)?)/i)))
        w.ptau = m[1].replace(",", ".");
      var datumLp = "";
      var ez = t.match(/Entnahmedatum([^\n]*)/i);
      if (ez) {
        var alle = ez[1].match(/\d{2}\.\d{2}\.\d{4}/g);
        if (alle) datumLp = alle[alle.length - 1];
      }
      if (!Object.keys(w).length) return null;
      return { ziel: "lp", name: "Lumbalpunktion mit Demenzmarkern",
               datum: datumLp, ort: "Viollier", werte: w };
    }
    // Hausinternes LP-Punktat als Klebetext (29.9.).
    if (/PUNKTATE\/LIQUOR|Zellzahl\s*\(WBC\)/i.test(t)) {
      var w2 = {};
      var m2;
      if ((m2 = t.match(/Zellzahl\s*\(WBC\)\s*<\s*5\s*(\d+(?:[.,]\d+)?)/i)))
        w2.zellzahl = m2[1].replace(",", ".");
      if ((m2 = t.match(/Totalprotein\s*Liquor\s*150\s*-\s*450\s*(\d+(?:[.,]\d+)?)/i)))
        w2.protein = m2[1].replace(",", ".");
      if (!Object.keys(w2).length) return null;
      return { ziel: "lp", name: "Lumbalpunktion mit Demenzmarkern",
               datum: "", ort: "Spital Limmattal", werte: w2 };
    }
    var rrT = t.match(/\n_{4,}[ \t]*\nUntersuchung[ \t]*:?[ \t]*\n/);
    var studT = t.match(/^Study:/m);
    if (!rrT && !studT) return null;
    return parseRest(t);
  }
  // Allgemeiner Weg: „Beurteilung" suchen, Name/Datum aus dem Kopf.
  function parseRest(text) {
    var t = String(text || "");
    var beu = t.match(/\nBeurteilung[ \t]*:?[ \t]*\n([\s\S]*)$/);
    if (!beu) return null;
    var bt = befundText(beu[1].split("\n"));
    var inhalt = bt.text;
    if (!inhalt && !bt.punkte) return null;
    var name = "", datum = "";
    // „Radiology Report" (30.9.): Blöcke durch ____-Linien getrennt; nur
    // der Block „Untersuchung" nennt die Untersuchung — im Block
    // „Klinische Befunde" stehen fremde Daten (CT vom …), die nicht zählen.
    var rr = t.match(/\n_{4,}[ \t]*\nUntersuchung[ \t]*:?[ \t]*\n\s*(.+?)\s+vom\s+(\d{2}\.\d{2}\.\d{4})/);
    var stud = t.match(/^Study:\s*\n?\s*(.+)$/m);
    var brief = t.match(/Zusatzuntersuchung\s+(.+?)\s+vom\s+(\d{2}\.\d{2}\.\d{4})/);
    if (rr) { name = rr[1].trim(); datum = rr[2]; }
    else if (brief) { name = brief[1].trim(); datum = brief[2]; }
    else if (stud) {
      name = stud[1].trim();
      var cdt = t.match(/Content Date\/Time:\s*(\d{4})-(\d{2})-(\d{2})/);
      if (cdt) datum = cdt[3] + "." + cdt[2] + "." + cdt[1];
    } else {
      var frei = t.match(/^(.{3,60}?)\s+vom\s+(\d{2}\.\d{2}\.\d{4})/m);
      if (frei) { name = frei[1].trim(); datum = frei[2]; }
    }
    if (!name) return null;
    return { ziel: zielAus(name), name: name, datum: datum,
             ort: ortAus(t), beurteilung: inhalt, punkte: bt.punkte };
  }
  function bauAnamnese(z, wahl) {
    var TXW = TX();
    var pat = wahl.geschlecht === "m" ? "Der Patient" : "Die Patientin";
    var satz1 = wahl.erscheinen === "allein"
      ? pat + " erschien pünktlich und alleine zur Sprechstunde."
      : pat + " erschien pünktlich und in Begleitung " +
        (wahl.begleitText || "xx") + " zur Sprechstunde.";
    var satz2 = "Die Anamnesekompetenz ist " +
      (wahl.kompetenz === 3
        ? "leider nicht gegeben, sodass die Anamnese überwiegend mit den Angehörigen durchgeführt wurde."
        : wahl.kompetenz === 2
          ? "nur partiell gegeben, sodass relevante Aspekte mit den Angehörigen erfolgt sind."
          : "vollumfänglich gegeben.");
    // Seit 15.15 (Naed 29.9.): Leerzeile zwischen den Abschnitten (bei
    // Strg+V in KISIM fehlten die Abstaende), "Aktuell" wird zu
    // "Anamnese vom [Berichtsdatum]", die Fremdanamnese kommt mit
    // (Klammerinhalt ohne die Mitarbeiterin) mit, und Abschnitte, die im
    // Vorbericht fehlen, werden ganz weggelassen statt gelb gefuellt.
    var html = ["<p>" + schuetze(satz1) + " " + schuetze(satz2) + "</p>"];
    var text = [satz1 + " " + satz2];
    function abstand() { html.push("<p><br></p>"); text.push(""); }
    abstand();
    html.push("<p>" + schuetze(TXW.vorlageSatz) + "</p>");
    text.push(TXW.vorlageSatz);
    function block(titelH, titelT, inhaltHtml, inhaltText) {
      abstand();
      html.push("<p>" + titelH + " <i>" + schuetze(TXW.uebernommen) +
        "</i><br>" + inhaltHtml + "</p>");
      text.push(titelT + " " + TXW.uebernommen, inhaltText);
    }
    if (z.abschnitte.aktuell) {
      var ndH = z.neuroDatum ? schuetze(z.neuroDatum) : gelbH("xx.xx.2026");
      var ndT = z.neuroDatum || "xx.xx.2026";
      block("<u>" + schuetze(TXW.anamneseVom) + " " + ndH + "</u>",
        TXW.anamneseVom + " " + ndT,
        absatzHtml(z.abschnitte.aktuell), z.abschnitte.aktuell);
    }
    if (z.abschnitte.fremd) {
      var klammer = /\(([^)]*)\)/.exec(z.fremdKopf || "");
      var innen = klammer ? klammer[1] : "";
      // Die Mitarbeiterin faellt raus: "Gespraech von Frau X mit dem
      // Ehemann" wird zu "Gespraech mit dem Ehemann".
      innen = innen.replace(/Gespräch\s+von\s+(?:Frau|Herrn?)\s+\S+\s+(?:\S+\s+)?mit/i,
        "Gespräch mit").trim();
      var ft = TXW.fremdTitel + (innen ? " (" + innen + ")" : "");
      block("<u>" + schuetze(ft) + "</u>", ft,
        absatzHtml(z.abschnitte.fremd), z.abschnitte.fremd);
    }
    [[TXW.ueberschriftSozial, "sozial"], [TXW.ueberschriftSchule, "schule"],
     [TXW.ueberschriftFamilie, "familie"],
     [TXW.ueberschriftPersoenlich, "persoenlich"],
     [TXW.ueberschriftSystem, "system"], [TXW.ueberschriftMedis, "medis"]
    ].forEach(function (paar) {
      var roh = z.abschnitte[paar[1]] || "";
      if (!roh) return;
      var inhaltHtml, inhaltText;
      if (paar[1] === "medis") {
        var fm = medisFormat(roh);
        inhaltText = fm || roh;
        inhaltHtml = fm ? schuetze(fm) : absatzHtml(roh);
      } else {
        inhaltText = roh;
        inhaltHtml = absatzHtml(roh);
      }
      block("<u>" + schuetze(paar[0]) + "</u>", paar[0],
        inhaltHtml, inhaltText);
    });
    return { html: html.join(""), text: text.join("\n").trim() };
  }
  function bauUntersuchungen(z, zusatz) {
    zusatz = zusatz || [];
    var s = z.scores;
    // Demenz-Scores als ECHTE Aufzählung (28.9.): KISIM übernimmt die
    // HTML-Fassung — <ul><li> wird dort zur richtigen Liste. Fehlende
    // Werte gelb, damit sichtbar ist, wo die App nichts eingefügt hat.
    function wert(v, ersatz) {
      return { h: v ? schuetze(v) : gelbH(ersatz), t: v || ersatz };
    }
    var iq = wert(s.iqcode, "x"), ia = wert(s.iadl, "x/8"),
        cd = wert(s.cdr, "x");
    var lis = [
      { h: "IQCODE (Fragebogen zur geistigen Leistungsfähigkeit für ältere Personen): " + iq.h + " (Cut-off ≤ 3.19).",
        t: "IQCODE (Fragebogen zur geistigen Leistungsfähigkeit für ältere Personen): " + iq.t + " (Cut-off ≤ 3.19)." },
      { h: "IADL-Skala (instrumental activities of daily living) nach Lawton und Brody: " + ia.h + " Punkte." + (z.unterstuetzung ? " Unterstützungsbedarf: " + schuetze(z.unterstuetzung) : ""),
        t: "IADL-Skala (instrumental activities of daily living) nach Lawton und Brody: " + ia.t + " Punkte." + (z.unterstuetzung ? " Unterstützungsbedarf: " + z.unterstuetzung : "") },
      { h: "ADL-Skala (activities of daily living, Barthel-Index): nicht eingeschränkt.",
        t: "ADL-Skala (activities of daily living, Barthel-Index): nicht eingeschränkt." },
      { h: "CDR-Skala (kognitive und funktionelle Leistung, formal): " + cd.h + ".",
        t: "CDR-Skala (kognitive und funktionelle Leistung, formal): " + cd.t + "." }
    ];
    // Abschnitts-Gerüst; eingelesene Zusatzuntersuchungen ersetzen ihren
    // Abschnitt (Datum, Ort, Beurteilung) oder werden neu eingefügt;
    // danach chronologische Ordnung (Scores fix zuerst, undatierte am
    // Schluss in Gerüst-Reihenfolge). Demenzlabor NEU ohne Homocystein
    // ("nehmen wir nicht ab", Näd 28.9.); Laborwerte füllt Näd selbst.
    // Seit 15.16 (Naed 30.9.): Nur das Demenzlabor steht IMMER als
    // Vorlage da (wird immer gemacht); alle anderen Zeilen — auch die
    // Lumbalpunktion — erscheinen NUR, wenn ein eingelesener Befund sie
    // fuellt.
    var geruest = [
      { id: "mri", titel: "MRI Schädel", ort: "Spital Limmattal", eigen: true },
      { id: "labor", titel: "Demenzlabor", ort: "Spital Limmattal und Viollier",
        pflicht: true,
        inhalt: "Unauffällig (Hämatologie, Elektrolyte, Nieren- und Leberwerte, Glukose, HbA1c, Lipide, INR, CRP, TSH, Vitamin B12, Folsäure, BSR, Treponema pallidum)." },
      { id: "eeg", titel: "Standard-EEG", ort: "Spital Limmattal" },
      { id: "lp", titel: "Lumbalpunktion mit Demenzmarkern", ort: "Viollier",
        werte: {},
        inhalt: "Liquor klar, Zellzahl x /µl (Norm < 5 /µl), Totalprotein x mg/l (Norm 150-450 mg/l), Amyloid-beta 1-42: xx ng/l (> 599), Amyloid-beta 1-40: xx ng/l, Amyloid-42/40-Quotient: xx (> 0.062), Tau-Protein: xx ng/l (< 404), Phospho-Tau-Protein: xx ng/l (< 56.5) — A x, T x, N x." },
      { id: "apo", titel: "Apolipoprotein-Bestimmung", ort: "Viollier",
        inhalt: "Ex/Ex." },
      { id: "fdg", titel: "FDG-PET", ort: "Universitätsspital Zürich" },
      { id: "amyloid", titel: "Amyloid-PET", ort: "Universitätsspital Zürich" }
    ];
    // Ist eine Zeile schon gefüllt (zweites EEG, zweites Kopf-MR), bekommt
    // der weitere Befund seine eigene Zeile; jedes Kopf-MR trägt den
    // Eigendurchsicht-Satz (Näd 1.10.: „bei jedem MR Schädel").
    function belegt(a) { return !!(a.beurteilung || a.punkte || a.datum); }
    zusatz.forEach(function (zu) {
      var ziel = null;
      geruest.some(function (a) {
        if (a.id === zu.ziel && !(a.id !== "lp" && belegt(a))) { ziel = a; return true; }
        return false;
      });
      if (ziel) {
        if (zu.punkte) ziel.punkte = zu.punkte;
        if (ziel.id === "mri" && zu.name) ziel.titel = zu.name;
        if (zu.datum) ziel.datum = zu.datum;
        if (zu.beurteilung) ziel.beurteilung = zu.beurteilung;
        if (zu.ort && ziel.id !== "lp") ziel.ort = zu.ort;
        if (zu.werte && ziel.werte) {
          Object.keys(zu.werte).forEach(function (k) {
            ziel.werte[k] = zu.werte[k];
          });
        }
      } else {
        geruest.push({ id: "eigen" + geruest.length,
          titel: zu.ziel === "eeg" ? "Standard-EEG" : zu.name,
          ort: zu.ort, datum: zu.datum, beurteilung: zu.beurteilung,
          punkte: zu.punkte, eigen: zu.ziel === "mri" });
      }
    });
    function iso(d) {
      var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d || "");
      return m ? m[3] + m[2] + m[1] : null;
    }
    var sortiert = geruest.map(function (a, i) { return [a, i]; })
      .sort(function (x, y) {
        var a = iso(x[0].datum), b = iso(y[0].datum);
        if (a && b && a !== b) return a < b ? -1 : 1;
        if (a && !b) return -1;
        if (!a && b) return 1;
        return x[1] - y[1];
      }).map(function (p) { return p[0]; });
    var html = [], text = [];
    function leer() { html.push("<p><br></p>"); text.push(""); }
    // Naeds Format fuer ALLE Befunde (30.9.): unterstrichen bis und mit
    // der schliessenden Klammer nach dem Ort, dann Doppelpunkt, und die
    // Beurteilung UNMITTELBAR auf derselben Zeile.
    function kopfteile(titel, datum, ort) {
      var dH = datum ? schuetze(datum) : gelbH("xx.xx.2026");
      var dT = datum || "xx.xx.2026";
      var oH = ort ? schuetze(ort) : gelbH("xx");
      var oT = ort || "xx";
      return { h: "<u>" + schuetze(titel) + " vom " + dH + " (" + oH + ")</u>:",
               t: titel + " vom " + dT + " (" + oT + "):" };
    }
    var sk = kopfteile("Demenz-Scores", z.neuroDatum, "Spital Limmattal");
    html.push("<p>" + sk.h + "</p>");
    text.push(sk.t);
    html.push("<ul>" + lis.map(function (l) {
      return "<li>" + l.h + "</li>"; }).join("") + "</ul>");
    lis.forEach(function (l) { text.push("\u2022 " + l.t); });
    sortiert.forEach(function (a) {
      var hatWerte = a.werte && Object.keys(a.werte).length > 0;
      if (!a.pflicht && !a.beurteilung && !a.datum && !hatWerte && !a.punkte) return;
      leer();
      var k = kopfteile(a.titel, a.datum, a.ort);
      var iH, iT;
      if (a.id === "lp" && !a.beurteilung) {
        function lw(k, ersatz) {
          var v = a.werte ? a.werte[k] : null;
          return { h: v ? schuetze(v) : gelbH(ersatz), t: v || ersatz };
        }
        var zz = lw("zellzahl", "x"), tp = lw("protein", "x"),
            a42 = lw("ab42", "xx"), a40 = lw("ab40", "xx"),
            qo = lw("quotient", "xx"), ta = lw("tau", "xx"),
            pt = lw("ptau", "xx");
        iH = "Liquor klar, Zellzahl " + zz.h + " /µl (Norm < 5 /µl), Totalprotein " +
          tp.h + " mg/l (Norm 150-450 mg/l), Amyloid-beta 1-42: " + a42.h +
          " ng/l (> 599), Amyloid-beta 1-40: " + a40.h +
          " ng/l, Amyloid-42/40-Quotient: " + qo.h + " (> 0.062), Tau-Protein: " +
          ta.h + " ng/l (< 404), Phospho-Tau-Protein: " + pt.h +
          " ng/l (< 56.5) — A " + gelbH("x") + ", T " + gelbH("x") + ", N " + gelbH("x") + ".";
        iT = "Liquor klar, Zellzahl " + zz.t + " /µl (Norm < 5 /µl), Totalprotein " +
          tp.t + " mg/l (Norm 150-450 mg/l), Amyloid-beta 1-42: " + a42.t +
          " ng/l (> 599), Amyloid-beta 1-40: " + a40.t +
          " ng/l, Amyloid-42/40-Quotient: " + qo.t + " (> 0.062), Tau-Protein: " +
          ta.t + " ng/l (< 404), Phospho-Tau-Protein: " + pt.t +
          " ng/l (< 56.5) — A x, T x, N x.";
      }
      else if (a.beurteilung) { iH = absatzHtml(a.beurteilung); iT = a.beurteilung; }
      else if (a.punkte) { iH = ""; iT = ""; }
      else if (a.inhalt) { iH = schuetze(a.inhalt); iT = a.inhalt; }
      else { iH = gelbH("xx."); iT = "xx."; }
      var eigenH = " <i>(in der Eigendurchsicht: " + gelbH("xx") + ".)</i>";
      var eigenT = " (in der Eigendurchsicht: xx.)";
      if (a.punkte) {
        // Echte Aufzählung (1.10.): Kopf + allfälliger Fliesstext, dann
        // die Punkte als Liste; Eigendurchsicht danach.
        html.push("<p>" + k.h + (iH ? " " + iH : "") + "</p>");
        text.push(k.t + (iT ? " " + iT : ""));
        html.push("<ul>" + a.punkte.map(function (p) {
          return "<li>" + schuetze(p) + "</li>"; }).join("") + "</ul>");
        a.punkte.forEach(function (p) { text.push("\u2022 " + p); });
        if (a.eigen) { html.push("<p>" + eigenH.trim() + "</p>"); text.push(eigenT.trim()); }
        return;
      }
      if (a.eigen) { iH += eigenH; iT += eigenT; }
      html.push("<p>" + k.h + " " + iH + "</p>");
      text.push(k.t + " " + iT);
    });
    return { html: html.join(""), text: text.join("\n") };
  }

  // ---- Die Ansicht -----------------------------------------------------
  function kopiere(f) {
    TB.ui.kopiereFassungen(f.html, f.text, function (ok, wie) {
      if (ok && wie === "alle Fassungen") TB.ui.melde(TX().kopiertMeldung);
      else if (ok) TB.ui.melde(TX().kopiertNurText, true);
      else TB.ui.melde(TX().kopierenFehl, true);
    });
  }
  function zielkarte(titel, fassung) {
    var karte = el("div", "karte bmc-ziel");
    var kopf = el("div", "bmc-zielkopf");
    kopf.appendChild(el("h3", "", titel));
    var k = el("button", "", TX().kopierenKnopf);
    k.addEventListener("click", function () {
      TB.speicher.zaehleFunktion("berichtMc");
      kopiere(fassung);
    });
    kopf.appendChild(k);
    karte.appendChild(kopf);
    var schau = el("div", "bmc-vorschau");
    schau.innerHTML = fassung.html;
    karte.appendChild(schau);
    return karte;
  }
  function zeichne(wurzel) {
    var TXW = TX();
    wurzel.appendChild(el("h2", "", TXW.mcTitel));
    wurzel.appendChild(el("p", "erklaerzeile", TXW.mcHinweis));
    var quelle = el("textarea", "bmc-quelle");
    quelle.rows = 10;
    quelle.placeholder = TXW.quellePlatzhalter;
    wurzel.appendChild(quelle);

    var wahlen = el("div", "bmc-wahlen");
    function beschriftet(text, feld) {
      var z = el("label", "bmc-wahl");
      z.appendChild(el("span", "", text));
      z.appendChild(feld);
      return z;
    }
    var wGeschlecht = el("select");
    [["auto", TXW.auto], ["w", TXW.patientin], ["m", TXW.patient]]
      .forEach(function (o) {
        var e = el("option", "", o[1]); e.value = o[0];
        wGeschlecht.appendChild(e); });
    wahlen.appendChild(beschriftet(TXW.wahlGeschlecht, wGeschlecht));
    var wErscheinen = el("select");
    [["auto", TXW.auto], ["begleitung", TXW.erschienBegleitung],
     ["allein", TXW.erschienAllein]].forEach(function (o) {
      var e = el("option", "", o[1]); e.value = o[0];
      wErscheinen.appendChild(e); });
    wahlen.appendChild(beschriftet(TXW.wahlErscheinen, wErscheinen));
    var wBegleit = el("input");
    wBegleit.placeholder = TXW.begleitPlatzhalter;
    wahlen.appendChild(beschriftet("", wBegleit));
    var wKompetenz = el("select");
    [[1, TXW.kompetenz1], [2, TXW.kompetenz2], [3, TXW.kompetenz3]]
      .forEach(function (o) {
        var e = el("option", "", o[1]); e.value = String(o[0]);
        wKompetenz.appendChild(e); });
    wahlen.appendChild(beschriftet(TXW.wahlKompetenz, wKompetenz));
    wurzel.appendChild(wahlen);

    var zKarte = el("div", "karte bmc-zusatz");
    zKarte.appendChild(el("h3", "", TXW.zusatzTitel));
    zKarte.appendChild(el("p", "erklaerzeile", TXW.zusatzHinweis));
    var zQuelle = el("textarea", "bmc-quelle");
    zQuelle.rows = 5;
    zQuelle.placeholder = TXW.zusatzPlatzhalter;
    zKarte.appendChild(zQuelle);
    var zKnopf = el("button", "", TXW.zusatzKnopf);
    zKarte.appendChild(zKnopf);
    var zChips = el("div", "bmc-chips");
    zKarte.appendChild(zChips);
    wurzel.appendChild(zKarte);

    var los = el("button", "knopf-fett", TXW.einsortierenKnopf);
    wurzel.appendChild(los);
    var meldung = el("p", "erklaerzeile");
    wurzel.appendChild(meldung);
    var ziele = el("div");
    wurzel.appendChild(ziele);

    // Alles Eingelesene lebt NUR in dieser Ansicht (state) — beim
    // Verlassen der Seite ist es weg, nichts wird gespeichert.
    var state = { z: null, wahl: null, zusatz: [] };
    function renderChips() {
      zChips.textContent = "";
      state.zusatz.forEach(function (zu, i) {
        var chip = el("span", "bmc-chip",
          zu.name + (zu.datum ? " vom " + zu.datum : ""));
        var weg = el("button", "bmc-chip-weg", "\u00d7");
        weg.addEventListener("click", function () {
          state.zusatz.splice(i, 1);
          renderChips();
          if (state.z) renderZiele();
        });
        chip.appendChild(weg);
        zChips.appendChild(chip);
      });
    }
    function renderZiele() {
      var z = state.z, wahl = state.wahl;
      meldung.textContent = z.fehlend.length
        ? TXW.fehltHinweis.replace("%s", z.fehlend.join(", "))
        : TXW.allesGefunden;
      ziele.textContent = "";
      ziele.appendChild(zielkarte(TXW.zielAnamnese, bauAnamnese(z, wahl)));
      ziele.appendChild(zielkarte(TXW.zielUntersuchungen,
        bauUntersuchungen(z, state.zusatz)));
      var weiter = el("button", "", TXW.zumStatus);
      weiter.addEventListener("click", function () {
        // E11 (Näds Vorgabe): direkt den Memory-Status aktivieren —
        // nur diesen; fällt er je weg, öffnet schlicht das Status-Werk.
        if (!TB.ansichtStatus.aktiviereTeilmenge("memory"))
          TB.oberflaeche.geheZu("status");
      });
      ziele.appendChild(weiter);
    }
    function haltFest() {
      var z = zerlege(quelle.value);
      state.z = z;
      state.wahl = {
        geschlecht: wGeschlecht.value === "auto" ? z.geschlecht : wGeschlecht.value,
        erscheinen: wErscheinen.value === "auto"
          ? (z.begleitung ? "begleitung" : "allein") : wErscheinen.value,
        begleitText: wBegleit.value.trim() || z.begleitung,
        kompetenz: Number(wKompetenz.value)
      };
    }
    los.addEventListener("click", function () {
      if (!quelle.value.trim()) { TB.ui.melde(TXW.quelleLeer, true); return; }
      haltFest();
      renderZiele();
    });
    zKnopf.addEventListener("click", function () {
      if (!zQuelle.value.trim()) { TB.ui.melde(TXW.zusatzLeer, true); return; }
      var liste = parseZusatzAlle(zQuelle.value);
      if (!liste.length) { TB.ui.melde(TXW.zusatzUnbekannt, true); return; }
      liste.forEach(function (p) { state.zusatz.push(p); });
      zQuelle.value = "";
      renderChips();
      // Auch OHNE Vorbericht nutzbar: dann entsteht das
      // Untersuchungs-Gerüst mit den eingelesenen Zeilen.
      if (!state.z) haltFest();
      renderZiele();
    });
  }

  return { zeichne: zeichne, zerlege: zerlege,
           bauAnamnese: bauAnamnese, bauUntersuchungen: bauUntersuchungen,
           medisFormat: medisFormat, parseZusatz: parseZusatz,
           parseZusatzAlle: parseZusatzAlle, neuroDatumVon: neuroDatumVon };
})();
