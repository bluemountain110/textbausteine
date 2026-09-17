// Datei: ansicht-wolke.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Alles Sichtbare rund um Anmeldung und Abgleich: die schmale
//        Leiste am unteren Rand („abgeglichen vor 3 Minuten“), das
//        Anmelde-Fenster, die Frage vor dem ersten Hochladen, der
//        Entscheid bei einer doppelten Änderung und die Prüfung
//        „Verbindung prüfen“ mit PDF-Bericht.
//        Grundsatz: Nichts scheitert still. Jede Lage hat einen Satz,
//        und wenn etwas nicht geht, arbeitet die App trotzdem weiter.

"use strict";
window.TB = window.TB || {};

TB.ansichtWolke = (function () {
  var el = TB.ui.el, melde = TB.ui.melde, dialogOeffnen = TB.ui.dialogOeffnen;
  var berichtAusgeben = TB.ui.berichtAusgeben, kopiereText = TB.ui.kopiereText;
  var T = function () { return TB.T; };
  var S = function () { return TB.speicher; };

  var konfliktFensterOffen = false;

  // ---- Die Leiste am unteren Rand ---------------------------------------
  function zeitWort(iso) {
    if (!iso) return T().abgleichNie;
    var min = Math.floor((Date.now() - Date.parse(iso)) / 60000);
    if (isNaN(min) || min < 1) return T().abgleichGeradeEben;
    if (min < 60) return T().abgleichVor + min + T().abgleichMinuten;
    if (min < 60 * 24) return T().abgleichVor + Math.floor(min / 60) + T().abgleichStunden;
    return T().abgleichVor + Math.floor(min / 1440) + T().abgleichTagen;
  }

  function zeichneLeiste() {
    var leiste = document.getElementById("abgleich-leiste");
    if (!leiste) return;
    var z = TB.abgleich.zustand();
    leiste.textContent = "";
    leiste.className = z.fehler ? "warn" : "";

    var satz;
    if (!z.eingerichtet) satz = T().nichtEingerichtet;
    else if (!z.angemeldet) satz = T().nichtAngemeldet;
    else if (z.laeuft) satz = T().abgleichLaeuft;
    else if (z.fehler) satz = z.fehler;
    else satz = zeitWort(S().abgleichStand().stand) + T().abgleichAutomatisch;
    leiste.appendChild(el("span", "leiste-text", satz));

    if (z.angemeldet && !z.laeuft && z.offen > 0) {
      leiste.appendChild(el("span", "leiste-offen",
        T().abgleichOffen.replace("%s", z.offen)));
    }

    if (z.konflikte > 0) {
      var kn = el("button", "leise klein",
        T().konfliktAnzahl.replace("%s", z.konflikte) + " — " + T().konfliktAnsehen);
      kn.addEventListener("click", function () { zeigeKonflikte(); });
      leiste.appendChild(kn);
    }

    var knopf;
    if (!z.eingerichtet) { /* kein Knopf — es gibt nichts zu tun */ }
    else if (!z.angemeldet) {
      knopf = el("button", "leise klein", T().anmeldenTitel);
      knopf.addEventListener("click", anmeldeFenster);
    } else if (!z.laeuft) {
      knopf = el("button", "leise klein", T().abgleichJetzt);
      knopf.addEventListener("click", function () { abgleichAnstossenMitFrage(); });
    }
    if (knopf) leiste.appendChild(knopf);
  }

  // ---- Anmelden ---------------------------------------------------------
  function anmeldeFenster() {
    if (!TB.wolke.eingerichtet()) { melde(T().nichtEingerichtet, true); return; }
    var d = el("dialog");
    d.appendChild(el("h2", "", T().anmeldenTitel));
    d.appendChild(el("p", "erklaerung", T().anmeldenText));
    function zeile(beschriftung, feld) {
      var z = el("div", "feldzeile");
      z.appendChild(el("label", "", beschriftung));
      z.appendChild(feld); d.appendChild(z); return feld;
    }
    var fMail = zeile(T().anmeldenMail, el("input"));
    fMail.type = "email"; fMail.autocomplete = "username";
    fMail.value = S().einstellung("letzteMail", "");
    var fPass = zeile(T().anmeldenPasswort, el("input"));
    fPass.type = "password"; fPass.autocomplete = "current-password";
    var hinweis = el("div", "hinweis-warn", "");
    d.appendChild(hinweis);

    var knoepfe = el("div", "dialog-knoepfe");
    var ab = el("button", "neben", T().abbrechen);
    ab.addEventListener("click", function () { d.close(); });
    var ok = el("button", "haupt", T().anmeldenKnopf);
    function versuchen() {
      hinweis.textContent = T().anmeldenLaeuft;
      ok.disabled = true;
      TB.wolke.anmelden(fMail.value, fPass.value).then(function (a) {
        ok.disabled = false;
        if (!a.ok) { hinweis.textContent = a.fehler; return; }
        S().setzeEinstellung("letzteMail", fMail.value.trim());
        d.close(); melde(T().anmeldenFertig);
        zeichneLeiste();
        ersterAbgleich();
      });
    }
    ok.addEventListener("click", versuchen);
    d.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); versuchen(); } });
    knoepfe.appendChild(ab); knoepfe.appendChild(ok);
    d.appendChild(knoepfe);
    dialogOeffnen(d);
    setTimeout(function () { (fMail.value ? fPass : fMail).focus(); }, 0);
  }

  function abmelden() {
    var offen = S().offenAnzahl();
    var frage = offen > 0 ? T().abmeldenOffenFrage.replace("%s", offen)
                          : T().abmeldenFrage;
    if (!confirm(frage)) return;
    TB.wolke.abmelden().then(function () {
      melde(T().abmeldenFertig);
      TB.oberflaeche.zeichne();
    });
  }

  // ---- Erster Abgleich: nie still ---------------------------------------
  function ersterAbgleich() {
    if (!TB.abgleich.erstmalig()) { TB.abgleich.jetzt(); return; }
    var anzahl = S().alle().length;
    var d = el("dialog");
    d.appendChild(el("h2", "", T().abgleichErstmalsTitel));
    d.appendChild(el("p", "erklaerung",
      T().abgleichErstmalsText.replace("%s", anzahl)));
    d.appendChild(el("p", "erklaerung", T().abgleichRatschlagExport));
    var knoepfe = el("div", "dialog-knoepfe");
    var ab = el("button", "neben", T().abbrechen);
    ab.addEventListener("click", function () { d.close(); });
    var ok = el("button", "haupt", T().abgleichErstmalsKnopf);
    ok.addEventListener("click", function () {
      d.close();
      S().merkeAlleOffen();
      TB.abgleich.jetzt();
    });
    knoepfe.appendChild(ab); knoepfe.appendChild(ok);
    d.appendChild(knoepfe);
    dialogOeffnen(d);
  }

  function abgleichAnstossenMitFrage() {
    if (TB.abgleich.erstmalig()) { ersterAbgleich(); return; }
    TB.abgleich.jetzt().then(function (a) {
      if (a.ok) melde(T().abgleichFertig);
      else if (a.fehler) melde(a.fehler, true);
    });
  }

  // ---- Doppelte Änderung: beide Fassungen zeigen ------------------------
  function zeigeKonflikte() {
    var offene = S().konflikte();
    if (!offene.length) { konfliktFensterOffen = false; return; }
    if (konfliktFensterOffen) return;
    konfliktFensterOffen = true;
    var k = offene[0];
    var d = el("dialog");
    d.appendChild(el("h2", "", T().konfliktTitel));
    d.appendChild(el("p", "erklaerung", T().konfliktText));

    function fassung(beschriftung, b) {
      var kasten = el("div", "fassung");
      kasten.appendChild(el("div", "fassung-kopf", beschriftung));
      kasten.appendChild(el("div", "test-detail",
        T().konfliktGeaendert + zeitLesbar(b.aktualisiertAm)));
      kasten.appendChild(el("div", "fassung-titel", b.titel || "(ohne Titel)"));
      kasten.appendChild(el("div", "vorschau-kasten", b.text || ""));
      return kasten;
    }
    d.appendChild(fassung(T().konfliktEigen.replace("%s", S().geraet()), k.eigen));
    d.appendChild(fassung(T().konfliktFremd, k.fremd));

    var knoepfe = el("div", "dialog-knoepfe");
    [[T().konfliktNimmEigen, "eigen", "neben"],
     [T().konfliktNimmFremd, "fremd", "neben"],
     [T().konfliktNimmBeide, "beide", "haupt"]].forEach(function (w) {
      var b = el("button", w[2], w[0]);
      b.addEventListener("click", function () {
        TB.abgleich.loese(k.id, w[1]);
        d.close(); konfliktFensterOffen = false;
        melde(T().konfliktGeloest);
        TB.oberflaeche.zeichne();
        setTimeout(zeigeKonflikte, 200);   // gibt es noch weitere?
      });
      knoepfe.appendChild(b);
    });
    d.appendChild(knoepfe);
    d.addEventListener("close", function () { konfliktFensterOffen = false; });
    dialogOeffnen(d);
  }

  function zeitLesbar(iso) {
    var t = Date.parse(iso || "");
    if (isNaN(t)) return "?";
    var d = new Date(t);
    function z(n) { return (n < 10 ? "0" : "") + n; }
    return d.toLocaleDateString("de-CH") + " " + z(d.getHours()) + ":" + z(d.getMinutes());
  }

  // ---- Karten in den Einstellungen --------------------------------------
  function zeichneKarten(wurzel) {
    // Karte 1: Anmeldung und Abgleich
    var k = el("div", "karte");
    k.appendChild(el("h2", "", T().abgleichTitel));
    var z = TB.abgleich.zustand();
    if (!z.eingerichtet) {
      k.appendChild(el("p", "erklaerung", T().nichtEingerichtet));
    } else if (!z.angemeldet) {
      k.appendChild(el("p", "erklaerung", T().anmeldenText));
      var an = el("button", "haupt", T().anmeldenKnopf);
      an.addEventListener("click", anmeldeFenster);
      k.appendChild(an);
    } else {
      k.appendChild(el("p", "erklaerung",
        (TB.wolke.benutzerMail() || "") + " · " +
        zeitWort(S().abgleichStand().stand) +
        (z.offen ? " · " + T().abgleichOffen.replace("%s", z.offen) : "")));
      var jetzt = el("button", "haupt", T().abgleichJetzt);
      jetzt.addEventListener("click", function () { abgleichAnstossenMitFrage(); });
      k.appendChild(jetzt);
      var ab = el("button", "neben", T().abmeldenKnopf);
      ab.style.marginLeft = "8px";
      ab.addEventListener("click", abmelden);
      k.appendChild(ab);
    }
    wurzel.appendChild(k);

    // Karte 2: Verbindung prüfen
    var v = el("div", "karte");
    v.appendChild(el("h2", "", T().verbindungTitel));
    v.appendChild(el("p", "erklaerung", T().verbindungText));
    var knopf = el("button", "haupt", T().verbindungKnopf);
    var platz = el("div"); platz.style.marginTop = "10px";
    knopf.addEventListener("click", function () {
      knopf.disabled = true;
      platz.textContent = T().verbindungLaeuft;
      TB.wolke.verbindungPruefen().then(function (ergebnisse) {
        knopf.disabled = false;
        platz.textContent = "";
        ergebnisse.forEach(function (e) {
          platz.appendChild(TB.ansichtEinstellungen.testZeile(e)); });
        var pdf = el("button", "haupt", T().berichtPdf);
        pdf.style.marginTop = "10px";
        pdf.addEventListener("click", function () {
          berichtAusgeben(T().kategorieVerbindung, TB.wolke.bericht(ergebnisse)); });
        platz.appendChild(pdf);
        var kop = el("button", "neben", T().berichtKopieren);
        kop.style.marginTop = "10px"; kop.style.marginLeft = "8px";
        kop.addEventListener("click", function () {
          kopiereText(TB.wolke.bericht(ergebnisse), function (ok) {
            melde(ok ? T().berichtKopiert : T().kopierenFehlgeschlagen, !ok); }); });
        platz.appendChild(kop);
      });
    });
    v.appendChild(knopf); v.appendChild(platz);
    wurzel.appendChild(v);
  }

  // ---- Start -------------------------------------------------------------
  function start() {
    TB.abgleich.beiAenderung(function (zustand) {
      zeichneLeiste();
      // Hat der Abgleich etwas mitgebracht, muss die Liste neu gezeichnet
      // werden — sonst sieht es aus, als wäre nichts angekommen, obwohl
      // es längst da ist (Näds Befund vom 16.9.).
      if (!zustand.laeuft && zustand.veraendert > 0) {
        var feld = document.getElementById("suchfeld");
        var stand = feld ? { wert: feld.value, anfang: feld.selectionStart,
                             ende: feld.selectionEnd,
                             hatFokus: document.activeElement === feld } : null;
        TB.oberflaeche.zeichne();
        if (stand) {
          var neu = document.getElementById("suchfeld");
          if (neu) {
            neu.value = stand.wert;
            if (stand.hatFokus) {
              neu.focus();
              try { neu.setSelectionRange(stand.anfang, stand.ende); } catch (e) { }
            }
          }
        }
        melde(T().abgleichNeues.replace("%s", zustand.veraendert));
      }
      if (S().konflikte().length) zeigeKonflikte();
    });
    zeichneLeiste();

    // Regelmässig abgleichen, solange das Fenster sichtbar ist. Ohne das
    // wüsste Näd nie, wann etwas ankommt — und beim Arbeiten über
    // Fernzugriff verliert ein Fenster den Fokus kaum, so dass der
    // Abgleich beim Zurückkommen allein zu selten auslöst (16.9.).
    setInterval(function () {
      zeichneLeiste();
      if (!TB.wolke.angemeldet() || TB.abgleich.erstmalig()) return;
      if (typeof document.hidden === "boolean" && document.hidden) return;
      TB.abgleich.jetzt();
    }, 60000);

    // Beim Zurückkommen ins Fenster oder auf den Reiter sofort abgleichen.
    function beiRueckkehr() {
      if (TB.wolke.angemeldet() && !TB.abgleich.erstmalig()) TB.abgleich.anstossen(400);
    }
    window.addEventListener("focus", beiRueckkehr);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) beiRueckkehr();
    });
    if (TB.wolke.angemeldet()) {
      if (TB.abgleich.erstmalig()) ersterAbgleich();
      else TB.abgleich.anstossen(600);
    }
  }

  return { start: start, zeichneLeiste: zeichneLeiste, zeichneKarten: zeichneKarten,
           anmeldeFenster: anmeldeFenster, zeigeKonflikte: zeigeKonflikte };
})();
