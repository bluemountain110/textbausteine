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
  zumStatus: "Weiter zum Status (Status-Werk öffnen)",
  uebernommen: "(übernommen aus neuropsychologischem Vorbericht)",
  ueberschriftSozial: "Sozialanamnese",
  ueberschriftSchule: "Schul-, Bildungs- und Berufsanamnese",
  ueberschriftFamilie: "Familienanamnese",
  ueberschriftPersoenlich: "Persönliche Anamnese",
  ueberschriftSystem: "Systemanamnese",
  ueberschriftMedis: "Aktuelle Medikamente/Therapien",
  vorlageSatz: "Die ausführliche Anamnese ist dem neuropsychologischen Vorbericht zu entnehmen. Relevante Anamneseergänzungen wurden heute keine gemacht.",
  zusatzTitel: "Zusatzuntersuchungen einlesen",
  zusatzHinweis: "EEG-Brief, Radiologie-Report und weitere Befunde EINZELN hier einfügen und einlesen — die App holt Datum und Beurteilung, ordnet chronologisch. Auch hier: nichts wird gespeichert.",
  zusatzPlatzhalter: "Einen Zusatzuntersuchungs-Bericht einfügen (Strg+V) …",
  zusatzKnopf: "Einlesen",
  zusatzUnbekannt: "Format nicht erkannt — schick mir dieses Beispiel (anonymisiert), ich baue es ein.",
  zusatzLeer: "Zuerst einen Befundtext in das Zusatz-Feld einfügen."
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
  function istKopf(zeile) {
    var z = zeile.trim().replace(/:\s*$/, "").toLowerCase();
    if (!z || z.length > 100) return false;
    if (GENAU.indexOf(z) !== -1) return true;
    return ANFANG.some(function (a) { return z.indexOf(a) === 0; });
  }
  function zielVon(kopf) {
    var z = kopf.trim().replace(/:\s*$/, "").toLowerCase();
    if (z === "sozialanamnese") return "sozial";
    if (z.indexOf("schul-") === 0) return "schule";
    if (z === "familienanamnese") return "familie";
    if (z === "krankheitsanamnese" || z === "persönliche anamnese") return "persoenlich";
    if (z === "systemanamnese") return "system";
    if (z.indexOf("aktuelle medik") === 0) return "medis";
    return null;
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
    zeilen.forEach(function (zeile) {
      if (istKopf(zeile)) { abschluss(); offenZiel = zielVon(zeile); return; }
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
               ? stuetz[1].replace(/\s+/g, " ").trim() : "" };
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
    if (/Limmattal|Schlieren/.test(t)) return "Spital Limmattal";
    return "";
  }
  function zielAus(name) {
    var n = name.toUpperCase();
    if (/PET.?MR/.test(n)) return null;
    if (/^MRT?\b|^MRI\b/.test(n)) return "mri";
    if (/AMYLOID/.test(n)) return "amyloid";
    if (/FDG/.test(n)) return "fdg";
    if (/EEG/.test(n)) return "eeg";
    if (/LUMBAL|LIQUOR/.test(n)) return "lp";
    return null;
  }
  function parseZusatz(text) {
    var t = String(text || "").replace(/\r\n?/g, "\n");
    var beu = t.match(/\nBeurteilung[ \t]*:?[ \t]*\n([\s\S]*?)(?=\n_{4,}|\n\s*Visum|\n\s*Freundliche|$)/);
    if (!beu) return null;
    var inhalt = beu[1].split("\n").map(function (z) {
      return z.replace(/^\s*-\s*/, "").trim();
    }).filter(function (z) { return z; }).join(" ");
    if (!inhalt) return null;
    var name = "", datum = "";
    var stud = t.match(/^Study:\s*\n?\s*(.+)$/m);
    var brief = t.match(/Zusatzuntersuchung\s+(.+?)\s+vom\s+(\d{2}\.\d{2}\.\d{4})/);
    if (brief) { name = brief[1].trim(); datum = brief[2]; }
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
             ort: ortAus(t), beurteilung: inhalt };
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
    var html = ["<p>" + schuetze(satz1) + " " + schuetze(satz2) + "</p>",
                "<p>" + schuetze(TXW.vorlageSatz) + "</p>"];
    var text = [satz1 + " " + satz2, "", TXW.vorlageSatz, ""];
    [[TXW.ueberschriftSozial, "sozial"], [TXW.ueberschriftSchule, "schule"],
     [TXW.ueberschriftFamilie, "familie"],
     [TXW.ueberschriftPersoenlich, "persoenlich"],
     [TXW.ueberschriftSystem, "system"], [TXW.ueberschriftMedis, "medis"]
    ].forEach(function (paar) {
      var roh = z.abschnitte[paar[1]] || "";
      var inhaltHtml, inhaltText;
      if (paar[1] === "medis") {
        var fm = medisFormat(roh);
        inhaltText = fm || roh || "xx";
        inhaltHtml = fm ? schuetze(fm) : (roh ? absatzHtml(roh) : gelbH("xx"));
      } else {
        inhaltText = roh || "xx";
        inhaltHtml = roh ? absatzHtml(roh) : gelbH("xx");
      }
      html.push("<p><u>" + schuetze(paar[0]) + "</u> <i>" +
        schuetze(TXW.uebernommen) + "</i><br>" + inhaltHtml + "</p>");
      text.push(paar[0] + " " + TXW.uebernommen, inhaltText, "");
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
    var geruest = [
      { id: "mri", titel: "MRI Schädel", ort: "Spital Limmattal", eigen: true },
      { id: "labor", titel: "Demenzlabor", ort: "Spital Limmattal und Viollier",
        inhalt: "Unauffällig (Hämatologie, Elektrolyte, Nieren- und Leberwerte, Glukose, HbA1c, Lipide, INR, CRP, TSH, Vitamin B12, Folsäure, BSR, Treponema pallidum)." },
      { id: "eeg", titel: "Standard-EEG", ort: "Spital Limmattal" },
      { id: "lp", titel: "Lumbalpunktion mit Demenzmarkern", ort: "Viollier",
        inhalt: "Liquor klar, Zellzahl x /µl (Norm < 5 /µl), Totalprotein x mg/l (Norm 150-450 mg/l), Amyloid-beta 1-42: xx ng/l (> 599), Amyloid-beta 1-40: xx ng/l, Amyloid-42/40-Quotient: xx (> 0.062), Tau-Protein: xx ng/l (< 404), Phospho-Tau-Protein: xx ng/l (< 56.5) — A x, T x, N x." },
      { id: "apo", titel: "Apolipoprotein-Bestimmung", ort: "Viollier",
        inhalt: "Ex/Ex." },
      { id: "fdg", titel: "FDG-PET", ort: "Universitätsspital Zürich" },
      { id: "amyloid", titel: "Amyloid-PET", ort: "Universitätsspital Zürich" }
    ];
    zusatz.forEach(function (zu) {
      var ziel = null;
      geruest.some(function (a) {
        if (a.id === zu.ziel) { ziel = a; return true; }
        return false;
      });
      if (ziel) {
        ziel.datum = zu.datum; ziel.beurteilung = zu.beurteilung;
        if (zu.ort) ziel.ort = zu.ort;
      } else {
        geruest.push({ id: "eigen" + geruest.length, titel: zu.name,
          ort: zu.ort, datum: zu.datum, beurteilung: zu.beurteilung });
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
    function titelzeile(titel, datum, ort) {
      var dH = datum ? schuetze(datum) : gelbH("xx.xx.2026");
      var dT = datum || "xx.xx.2026";
      var oH = ort ? schuetze(ort) : gelbH("xx");
      var oT = ort || "xx";
      html.push("<p><u>" + schuetze(titel) + " vom " + dH + " (" + oH +
        ")</u>:</p>");
      text.push(titel + " vom " + dT + " (" + oT + "):");
    }
    titelzeile("Demenz-Scores", null, "Spital Limmattal");
    html.push("<ul>" + lis.map(function (l) {
      return "<li>" + l.h + "</li>"; }).join("") + "</ul>");
    lis.forEach(function (l) { text.push("\u2022 " + l.t); });
    sortiert.forEach(function (a) {
      leer();
      titelzeile(a.titel, a.datum, a.ort);
      if (a.beurteilung) {
        html.push("<p>" + absatzHtml(a.beurteilung) + "</p>");
        text.push(a.beurteilung);
      } else if (a.inhalt) {
        html.push("<p>" + schuetze(a.inhalt) + "</p>");
        text.push(a.inhalt);
      } else {
        html.push("<p>" + gelbH("xx.") + "</p>");
        text.push("xx.");
      }
      if (a.eigen) {
        html.push("<p><i>(In der Eigendurchsicht: " + gelbH("xx") +
          ".)</i></p>");
        text.push("(In der Eigendurchsicht: xx.)");
      }
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
        TB.oberflaeche.geheZu("status"); });
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
      var p = parseZusatz(zQuelle.value);
      if (!p) { TB.ui.melde(TXW.zusatzUnbekannt, true); return; }
      state.zusatz.push(p);
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
           medisFormat: medisFormat, parseZusatz: parseZusatz };
})();
