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
  vorlageSatz: "Die ausführliche Anamnese ist dem neuropsychologischen Vorbericht zu entnehmen. Relevante Anamneseergänzungen wurden heute keine gemacht."
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
      var inhalt = z.abschnitte[paar[1]] || "xx";
      html.push("<p><u>" + schuetze(paar[0]) + "</u> <i>" +
        schuetze(TXW.uebernommen) + "</i><br>" + absatzHtml(inhalt) + "</p>");
      text.push(paar[0] + " " + TXW.uebernommen, inhalt, "");
    });
    return { html: html.join(""), text: text.join("\n").trim() };
  }
  function bauUntersuchungen(z) {
    var s = z.scores;
    var zeilen = [
      ["u", "Demenz-Scores vom xx.xx.2026 (Spital Limmattal):"],
      ["p", "IQCODE (Fragebogen zur geistigen Leistungsfähigkeit für ältere Personen): " + (s.iqcode || "x") + " (Cut-off ≤ 3.19)."],
      ["p", "IADL-Skala (instrumental activities of daily living) nach Lawton und Brody: " + (s.iadl || "x/8") + " Punkte." + (z.unterstuetzung ? " Unterstützungsbedarf: " + z.unterstuetzung : "")],
      ["p", "ADL-Skala (activities of daily living, Barthel-Index): nicht eingeschränkt."],
      ["p", "CDR-Skala (kognitive und funktionelle Leistung, formal): " + (s.cdr || "x") + "."],
      ["leer", ""],
      ["u", "MRI Schädel vom xx.xx.2026 (Spital Limmattal):"], ["", "xx (in der Eigendurchsicht: xx)."],
      ["leer", ""],
      ["u", "Demenzlabor vom xx.xx.2026 (Spital Limmattal und Viollier):"],
      ["", "Homocystein xxx µmol/l, übriges Labor unauffällig (Hämatologie, Elektrolyte, Nieren- und Leberwerte, Glukose, HbA1c, Lipide, INR, CRP, TSH, Vitamin B12, Folsäure, BSR, Treponema pallidum)."],
      ["leer", ""],
      ["u", "Standard-EEG vom xx.xx.2026 (Spital Limmattal):"], ["", "xx."],
      ["leer", ""],
      ["u", "Lumbalpunktion mit Demenzmarkern vom xx.xx.2026 (Viollier):"],
      ["", "Liquor klar, Zellzahl x /µl (Norm < 5 /µl), Totalprotein x mg/l (Norm 150-450 mg/l), Amyloid-beta 1-42: xx ng/l (> 599), Amyloid-beta 1-40: xx ng/l, Amyloid-42/40-Quotient: xx (> 0.062), Tau-Protein: xx ng/l (< 404), Phospho-Tau-Protein: xx ng/l (< 56.5) — A x, T x, N x."],
      ["leer", ""],
      ["u", "Apolipoprotein-Bestimmung vom xx.xx.2026 (Viollier):"], ["", "Ex/Ex."],
      ["leer", ""],
      ["u", "FDG-PET vom xx.xx.2026 (Universitätsspital Zürich):"], ["", "xx."],
      ["leer", ""],
      ["u", "Amyloid-PET vom xx.xx.2026 (Universitätsspital Zürich):"], ["", "xx."]
    ];
    var html = [], text = [];
    zeilen.forEach(function (paar) {
      if (paar[0] === "leer") { html.push("<p></p>"); text.push(""); return; }
      if (paar[0] === "p") {   // Aufzählungspunkt (Sammelrunde 27.9.)
        html.push("<p>\u2022 " + schuetze(paar[1]) + "</p>");
        text.push("\u2022 " + paar[1]);
        return;
      }
      var inhalt = paar[0] === "u"
        ? "<u>" + schuetze(paar[1]) + "</u>" : schuetze(paar[1]);
      html.push("<p>" + inhalt + "</p>");
      text.push(paar[1]);
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

    var los = el("button", "knopf-fett", TXW.einsortierenKnopf);
    wurzel.appendChild(los);
    var meldung = el("p", "erklaerzeile");
    wurzel.appendChild(meldung);
    var ziele = el("div");
    wurzel.appendChild(ziele);

    los.addEventListener("click", function () {
      if (!quelle.value.trim()) { TB.ui.melde(TXW.quelleLeer, true); return; }
      var z = zerlege(quelle.value);
      var wahl = {
        geschlecht: wGeschlecht.value === "auto" ? z.geschlecht : wGeschlecht.value,
        erscheinen: wErscheinen.value === "auto"
          ? (z.begleitung ? "begleitung" : "allein") : wErscheinen.value,
        begleitText: wBegleit.value.trim() || z.begleitung,
        kompetenz: Number(wKompetenz.value)
      };
      meldung.textContent = z.fehlend.length
        ? TXW.fehltHinweis.replace("%s", z.fehlend.join(", "))
        : TXW.allesGefunden;
      ziele.textContent = "";
      ziele.appendChild(zielkarte(TXW.zielAnamnese, bauAnamnese(z, wahl)));
      ziele.appendChild(zielkarte(TXW.zielUntersuchungen, bauUntersuchungen(z)));
      var weiter = el("button", "", TXW.zumStatus);
      weiter.addEventListener("click", function () {
        TB.oberflaeche.geheZu("status"); });
      ziele.appendChild(weiter);
    });
  }

  return { zeichne: zeichne, zerlege: zerlege,
           bauAnamnese: bauAnamnese, bauUntersuchungen: bauUntersuchungen };
})();
