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

  function merkeAdresse() {
    try {
      if (!TB.speicher || !TB.speicher.setzeEinstellung) return;
      var basis = location.origin + location.pathname;
      if (TB.speicher.einstellung("appAdresse", "") !== basis)
        TB.speicher.setzeEinstellung("appAdresse", basis);
    } catch (e) { /* still: nur eine Bequemlichkeit */ }
  }

  function zeigeWerk() {
    if (art === "status") {
      if (!TB.ansichtStatus.aktiviereTeilmenge(kuerzel)) {
        TB.ui.melde(T().fensterKeinStatus.replace("%s", kuerzel), true);
        TB.oberflaeche.geheZu("status");
      }
    } else {
      TB.oberflaeche.geheZu("eeg");
    }
  }

  function fingerabdruck() {
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
    return { text: abschnitt.text,
             rtf: TB.speicher.rtfHtml(abschnitt.html) || "" };
  }
  function uebergeben(knopf) {
    var felder;
    if (art === "eeg") {
      var f = TB.ansichtEeg.aktuelleFelder();
      if (!f) { TB.ui.melde(T().fensterLeer, true); return; }
      felder = { indikation: feld(f.indikation), anamnese: feld(f.anamnese),
                 befund: feld(f.befund), beurteilung: feld(f.beurteilung) };
    } else {
      var s = TB.ansichtStatus.aktuellerText();
      if (!s || !s.text) { TB.ui.melde(T().fensterLeer, true); return; }
      felder = { block: feld(s) };
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
    if (art !== "eeg" && art !== "status") return;
    kuerzel = p.get("kuerzel") || "";
    nonce = p.get("nonce") || "";
    document.title = "Textbausteine-Fenster " + nonce;
    // VOR dem ersten Zeichnen: Fenster-Klasse und schlanker Modus,
    // damit Masse (Kopfhoehe) und Inhalt von Anfang an stimmen.
    document.body.classList.add("nur-fenster");
    TB.ansichtEeg.setzeFensterModus(true);
    TB.ansichtStatus.setzeFensterModus(true);
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

  return { start: start, pruefeNeu: pruefeNeu, uebergeben: uebergeben };
})();
