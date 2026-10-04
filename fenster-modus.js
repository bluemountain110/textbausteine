// Datei: fenster-modus.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Der URL-Fenster-Weg (E11-Nachbesserung, Näds Grundsatz "alles
//        über die URL"): Öffnet das Skript die App mit ?fenster=eeg
//        oder ?fenster=status&kuerzel=statuscts, zeigt die Seite NUR
//        das jeweilige Werk (Kopf und Navigation ausgeblendet) und
//        unten eine Übergabe-Leiste. "An KISIM übergeben" legt die
//        fertigen Felder als gekennzeichnetes Paket (TBFENSTER1: +
//        JSON mit Kenncode aus der URL) in die Zwischenablage — das
//        Skript wartet darauf, fügt ein und springt durch die Felder.
//        Nebenbei merkt sich die App hier ihre eigene Adresse in den
//        Einstellungen (appAdresse), damit das Skript weiß, welche
//        Seite es öffnen muss — ohne dass die Adresse je im Code
//        steht. GRUNDSATZ: nichts wird gespeichert; das Paket liegt
//        nur kurz in der Zwischenablage und wird vom Skript nach dem
//        Einfügen geleert.

"use strict";
window.TB = window.TB || {};

TB.fensterModus = (function () {
  var T = function () { return TB.statusTexte; };

  function merkeAdresse() {
    try {
      if (!TB.speicher || !TB.speicher.setzeEinstellung) return;
      var basis = location.origin + location.pathname;
      if (TB.speicher.einstellung("appAdresse", "") !== basis)
        TB.speicher.setzeEinstellung("appAdresse", basis);
    } catch (e) { /* still: nur eine Bequemlichkeit */ }
  }

  function leiste(art, nonce) {
    var w = document.createElement("div");
    w.className = "fenster-leiste";
    var hinweis = document.createElement("span");
    hinweis.className = "fenster-hinweis";
    hinweis.textContent = T().fensterHinweis;
    w.appendChild(hinweis);
    var knopf = document.createElement("button");
    knopf.className = "fenster-knopf";
    knopf.textContent = T().fensterKnopf;
    knopf.addEventListener("click", function () {
      uebergeben(art, nonce, knopf);
    });
    w.appendChild(knopf);
    document.body.appendChild(w);
    document.body.classList.add("nur-fenster");
  }

  function feld(abschnitt) {
    return { text: abschnitt.text,
             rtf: TB.speicher.rtfHtml(abschnitt.html) || "" };
  }
  function uebergeben(art, nonce, knopf) {
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
    var art = p.get("fenster");
    if (art !== "eeg" && art !== "status") return;
    var nonce = p.get("nonce") || "";
    document.title = "Textbausteine-Fenster " + nonce;
    if (art === "status") {
      var k = p.get("kuerzel") || "";
      if (!TB.ansichtStatus.aktiviereTeilmenge(k)) {
        TB.ui.melde(T().fensterKeinStatus.replace("%s", k), true);
        TB.oberflaeche.geheZu("status");
      }
    } else {
      TB.oberflaeche.geheZu("eeg");
    }
    leiste(art, nonce);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else
    start();

  return { start: start };
})();
