// Datei: fenster-modus.js
// Projekt: Textbausteine \u2014 Teil: App (Browser), nur App
// Zweck: Der URL-Fenster-Weg, Fassung 2 (17.2). Oeffnet das Skript
//        die App mit ?fenster=eeg oder ?fenster=status&kuerzel=...,
//        dann: (1) SOFORT die Fenster-Klasse und der schlanke Modus
//        beider Werke \u2014 noch VOR dem ersten Zeichnen, damit keine
//        Luecke durch die versteckte Kopfzeile entsteht \u2014, (2) das
//        gerufene Werk, (3) der grosse Uebergeben-Knopf, den die
//        Ansichten rechts unter der Vorschau zeichnen (17.4; die
//        fruehere Fussleiste ist weg). Nach jedem
//        Datenabgleich prueft ein Nachsyncer, ob der Master sich
//        geaendert hat (frisch vom anderen Geraet), und zeichnet dann
//        EINMAL neu \u2014 das behebt den Spital-Fall, in dem die
//        Indikation erst nach einem Klick erschien. "An KISIM
//        uebergeben" legt die fertigen Felder als gekennzeichnetes
//        Paket (TBFENSTER1: + JSON mit Kenncode) in die
//        Zwischenablage; das Skript fuegt ein und leert sie danach.

"use strict";
window.TB = window.TB || {};

TB.fensterModus = (function () {
  var T = function () { return TB.statusTexte; };
  var art = "", kuerzel = "", nonce = "", gemerkt = "";
  // 17.6: Wohin geht der Text? "kisim" (Spital, Skript holt ihn aus der
  // Zwischenablage) oder "axenita" (Praxis, die Erweiterung nimmt ihn
  // ueber ihre Bruecke in diesem Fenster entgegen). Fuer Naed sieht
  // beides gleich aus — nur der Knopf nennt das Zielprogramm.
  var ziel = "kisim";
  function knopfText() {
    return ziel === "axenita" ? T().fensterKnopfAxenita : T().fensterKnopf;
  }

  function merkeAdresse() {
    try {
      if (!TB.speicher || !TB.speicher.setzeEinstellung) return;
      var basis = location.origin + location.pathname;
      if (TB.speicher.einstellung("appAdresse", "") !== basis)
        TB.speicher.setzeEinstellung("appAdresse", basis);
    } catch (e) { /* still: nur eine Bequemlichkeit */ }
  }

  function zeigeWerk() {
    if (art === "enmg") {
      // ENMG: Die Daten kommen aus der hineingezogenen Datei, nicht aus
      // dem Abgleich — es gibt nichts vorzubelegen.
      TB.oberflaeche.geheZu("enmg");
    } else if (art === "status") {
      if (!TB.ansichtStatus.aktiviereTeilmenge(kuerzel)) {
        TB.ui.melde(T().fensterKeinStatus.replace("%s", kuerzel), true);
        TB.oberflaeche.geheZu("status");
      }
    } else {
      // 17.5: das EEG-Fenster startet mit der Vorlage des Kuerzels
      // (ohne Kuerzel: Normal), damit der Normalbefund vorsteht.
      try {
        TB.ansichtEeg.aktiviereVorlagePerKuerzel(kuerzel || "eeg");
      } catch (e) { /* Vorlage fehlt — leer starten */ }
      TB.oberflaeche.geheZu("eeg");
    }
  }

  function fingerabdruck() {
    // ENMG hängt nicht am Abgleich: konstanter Abdruck, damit ein
    // Datenabgleich die eingelesene Datei nie aus der Ansicht wirft.
    if (art === "enmg") return "enmg";
    var m = (art === "eeg") ? TB.eeg.master() : TB.status.master();
    var teil = (art === "status")
      ? TB.status.teilmengen().map(function (t) {
          return t.id + ":" + (t.kuerzel || ""); }).join(",")
      : "";
    return JSON.stringify((m && m.kategorien) || []) + "|" + teil;
  }

  function pruefeNeu() {
    try {
      var z = TB.abgleich.zustand();
      if (z && z.laeuft) return;
      var jetzt = fingerabdruck();
      if (jetzt === gemerkt) return;
      gemerkt = jetzt;
      zeigeWerk();
    } catch (e) { /* still */ }
  }

  function feld(abschnitt) {
    return { text: abschnitt.text, html: abschnitt.html,
             rtf: TB.speicher.rtfHtml(abschnitt.html) || "" };
  }
  // Praxis: Axenita hat EIN Feld — dorthin kommt, was rechts in der
  // Vorschau steht (Indikation, Anamnese, Befund, Beurteilung).
  function eegBlockFuerAxenita(f) {
    var E = TB.eegTexte, html = "", text = [];
    [[E.indikationTitel, f.indikation], [E.anamneseTitel, f.anamnese]]
      .forEach(function (paar) {
        if (!paar[1] || !String(paar[1].text || "").trim()) return;
        html += "<p><b>" + paar[0] + "</b></p>" + paar[1].html + "<p><br></p>";
        text.push(paar[0] + "\n" + paar[1].text + "\n");
      });
    var b = TB.eeg.block(f);
    return { html: html + b.html, text: text.join("\n") + b.text };
  }
  function anErweiterung(paket, knopf) {
    if (!document.documentElement.hasAttribute("data-tb-bruecke")) {
      TB.ui.melde(T().fensterErwFehlt, true); return;
    }
    var fertig = false;
    function antwort(ev) {
      if (ev.source !== window) return;
      var d = ev.data;
      if (!d || d.tbFensterAck !== 1 || d.nonce !== nonce) return;
      fertig = true;
      window.removeEventListener("message", antwort);
      if (d.ok) {
        knopf.textContent = T().fensterUebergeben;
        knopf.disabled = true;
        setTimeout(function () { try { window.close(); } catch (e) {} }, 300);
      } else {
        TB.ui.melde(T().fensterErwFehler, true);
      }
    }
    window.addEventListener("message", antwort);
    window.postMessage({ tbFensterPaket: 1, nonce: nonce, paket: paket },
                       location.origin);
    setTimeout(function () {
      if (fertig) return;
      window.removeEventListener("message", antwort);
      TB.ui.melde(T().fensterErwFehler, true);
    }, 5000);
  }
  function uebergeben(knopf) {
    var felder;
    if (art === "eeg") {
      var f = TB.ansichtEeg.aktuelleFelder();
      if (!f) { TB.ui.melde(T().fensterLeer, true); return; }
      felder = { indikation: feld(f.indikation), anamnese: feld(f.anamnese),
                 befund: feld(f.befund), beurteilung: feld(f.beurteilung) };
      if (ziel === "axenita") felder.block = eegBlockFuerAxenita(f);
    } else if (art === "enmg") {
      var e = TB.ansichtEnmg.aktuellerText();
      if (!e || !e.text) {
        TB.ui.melde(TB.enmgTexte.fensterLeer, true); return;
      }
      felder = { block: feld(e) };
    } else {
      var s = TB.ansichtStatus.aktuellerText();
      if (!s || !s.text) { TB.ui.melde(T().fensterLeer, true); return; }
      felder = { block: feld(s) };
    }
    if (ziel === "axenita") {
      anErweiterung({ art: art, felder: felder }, knopf);
      return;
    }
    var paket = "TBFENSTER1:" + JSON.stringify(
      { art: art, nonce: nonce, felder: felder });
    navigator.clipboard.writeText(paket).then(function () {
      knopf.textContent = T().fensterUebergeben;
      knopf.disabled = true;
      setTimeout(function () { try { window.close(); } catch (e) {} }, 600);
    }, function () {
      TB.ui.melde(T().fensterFehler, true);
    });
  }

  function start() {
    merkeAdresse();
    var p = new URLSearchParams(location.search);
    art = p.get("fenster") || "";
    if (art !== "eeg" && art !== "status" && art !== "enmg") return;
    kuerzel = p.get("kuerzel") || "";
    nonce = p.get("nonce") || "";
    ziel = (p.get("ziel") === "axenita") ? "axenita" : "kisim";
    document.title = "Textbausteine-Fenster " + nonce;
    // VOR dem ersten Zeichnen: Fenster-Klasse und schlanker Modus,
    // damit Masse (Kopfhoehe) und Inhalt von Anfang an stimmen.
    document.body.classList.add("nur-fenster");
    TB.ansichtEeg.setzeFensterModus(true);
    TB.ansichtStatus.setzeFensterModus(true);
    TB.ansichtEnmg.setzeFensterModus(true);
    zeigeWerk();
    gemerkt = fingerabdruck();
    // Frische Daten holen und nach dem Abgleich EINMAL nachziehen.
    try {
      TB.abgleich.beiAenderung(pruefeNeu);
      TB.abgleich.anstossen();
    } catch (e) { /* still */ }
    setTimeout(pruefeNeu, 2500);
    setTimeout(pruefeNeu, 6000);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else
    start();

  return { start: start, pruefeNeu: pruefeNeu, uebergeben: uebergeben,
           knopfText: knopfText };
})();
