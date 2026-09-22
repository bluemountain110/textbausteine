// Datei: faecher.js
// Projekt: Textbausteine — Teil: Chrome-Erweiterung
// Zweck: Die neun Fächer (;;c1 bis ;;c9 merken die Zwischenablage,
//        ;;v1 bis ;;v9 setzen sie ein — Buchstaben aus den App-
//        Einstellungen) und der Entwurf-Weg ;;neu. Die Fächer liegen
//        im Speicher der Erweiterung auf DIESEM Gerät, überleben das
//        Schliessen von Chrome und leeren sich 12 Stunden nach dem
//        Merken von selbst — sie wandern NIE in die Datenablage, denn
//        in einem Fach kann Patiententext liegen. ;;neu zeigt zuerst
//        die Kontroll-Vorschau mit dem Warnsatz; erst der Knopf legt
//        den Text als Entwurf in die Datenablage (der einzige
//        Schreibweg der Erweiterung, nur NEUE Entwürfe).

"use strict";
window.TB = window.TB || {};

TB.faecherRein = (function () {
  var FRIST_MS = 12 * 60 * 60 * 1000; // 12 Stunden

  // Ein Fach ist gültig, wenn es Inhalt hat und die Frist noch läuft.
  function gueltig(fach, jetztMs) {
    if (!fach || (!fach.text && !fach.html)) return false;
    var t = Date.parse(fach.zeit || "");
    if (isNaN(t)) return false;
    return (jetztMs - t) < FRIST_MS;
  }
  // Kurzes Anzeigewort aus dem Text eines Fachs.
  function wortAus(text) {
    return String(text || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, 40);
  }
  return { gueltig: gueltig, wortAus: wortAus, FRIST_MS: FRIST_MS };
})();

if (typeof document !== "undefined") (function () {

  var R = TB.faecherRein;

  function meldung(text, fehler) { TB.seite.meldung(text, fehler); }

  function ladeFaecher() {
    return chrome.storage.local.get("faecher").then(function (o) {
      return o.faecher || {};
    });
  }
  function sichereFaecher(f) {
    return chrome.storage.local.set({ faecher: f });
  }

  // ---- Zwischenablage lesen (Text und, wenn vorhanden, HTML) ------------
  function zwischenablageLesen() {
    return navigator.clipboard.read().then(function (eintraege) {
      var e = eintraege && eintraege[0];
      if (!e) return { text: "", html: "" };
      function hole(art) {
        if (e.types.indexOf(art) === -1) return Promise.resolve("");
        return e.getType(art).then(function (b) { return b.text(); })
          .catch(function () { return ""; });
      }
      return Promise.all([hole("text/plain"), hole("text/html")])
        .then(function (w) { return { text: w[0], html: w[1] }; });
    }).catch(function () {
      return navigator.clipboard.readText()
        .then(function (t) { return { text: t, html: "" }; })
        .catch(function () { return null; });
    });
  }

  // ---- Merken (;;c1 bis ;;c9) --------------------------------------------
  function merken(doc, ziel, nummer) {
    zwischenablageLesen().then(function (z) {
      if (z === null) { meldung(TB.TE.fachLesenVerwehrt, true); return; }
      if (!String(z.text || "").trim() && !z.html) {
        meldung(TB.TE.fachNichtsKopiert, true);
        return;
      }
      ladeFaecher().then(function (f) {
        f[String(nummer)] = { text: z.text || "", html: z.html || "",
          wort: R.wortAus(z.text), zeit: new Date().toISOString() };
        sichereFaecher(f).then(function () {
          meldung(TB.TE.fachGemerkt + nummer, false);
        });
      });
    });
  }

  // ---- Einsetzen (;;v1 bis ;;v9) ------------------------------------------
  // tippLaenge: das getippte Kürzel samt Leertaste wird erst jetzt
  // entfernt — bei leerem Fach bleibt es stehen (nichts geht kaputt).
  function einsetzen(doc, ziel, nummer, tippLaenge) {
    ladeFaecher().then(function (f) {
      var fach = f[String(nummer)];
      if (!R.gueltig(fach, Date.now())) {
        meldung(TB.TE.fachLeer, true);
        return;
      }
      var ort = TB.seite.ortErmitteln(doc, ziel);
      if (!ort) return;
      if (!TB.seite.entferneVorDerMarke(ort, tippLaenge)) return;
      var frisch = TB.seite.ortErmitteln(doc, ziel) || ort;
      if (frisch.art === "feld" || !fach.html) {
        TB.seite.schreibeText(frisch, fach.text || "");
      } else {
        var sauber = TB.auszeichnung.reinige(fach.html).innerHTML;
        if (!TB.seite.schreibeHtml(frisch, sauber, null)) {
          TB.seite.schreibeText(frisch, fach.text || "");
        }
      }
      meldung(TB.TE.fachEingesetzt + nummer, false);
    });
  }

  // ---- Das Auswahl-Fenster im Fächer-Modus --------------------------------
  // Erscheint bei Stamm plus Ziffer (;;v1, ;;c1) und zeigt die neun
  // Fächer; Klick setzt ein bzw. merkt (wie im Windows-Skript).
  function panelFaecher(doc, ziel, ausloeser, istMerken) {
    ladeFaecher().then(function (f) {
      var stamm = TB.seite.fachStamm(istMerken ? "merken" : "einsetzen");
      var zeilen = [];
      for (var n = 1; n <= 9; n++) {
        var fach = f[String(n)];
        var wort = R.gueltig(fach, Date.now()) ? (fach.wort || "(ohne Text)")
          : TB.TE.fachLeerZeile;
        zeilen.push({ nummer: n, marke: stamm + n, wort: wort });
      }
      TB.einblendung.oeffneVorschlag(doc, ziel, {
        faecherZeilen: zeilen,
        kopf: istMerken ? TB.TE.faecherMerkenKopf : TB.TE.faecherKopf,
        beiFach: function (nummer) {
          var ort = TB.seite.ortErmitteln(doc, ziel);
          if (!ort) return;
          var m = /;;([^\s;?]{1,64})$/.exec(ort.textVor || "");
          var laenge = m ? m[0].length : 0;
          if (istMerken) {
            if (laenge && !TB.seite.entferneVorDerMarke(ort, laenge)) return;
            merken(doc, ziel, nummer);
          } else {
            einsetzen(doc, ziel, nummer, laenge);
          }
        }
      });
    });
  }

  // ---- ;;neu: Zwischenablage als Entwurf in die Datenablage ---------------
  // Bedienung wie im Windows-Skript: Text markieren, Strg+C, dann
  // irgendwo ;;neu und Leertaste. Es kommt IMMER zuerst die Kontroll-
  // Vorschau mit dem Warnsatz; gesichert wird erst per Knopf.
  function neuStarten(doc, ziel) {
    zwischenablageLesen().then(function (z) {
      if (z === null) { meldung(TB.TE.fachLesenVerwehrt, true); return; }
      var text = String(z.text || "");
      if (!text.trim() && !z.html) {
        meldung(TB.TE.entwurfLeer, true);
        return;
      }
      var html;
      if (z.html) {
        html = TB.auszeichnung.reinige(z.html).innerHTML;
      } else {
        html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
          .replace(/\r\n/g, "\n").replace(/\n/g, "<br>");
      }
      var vorschau = text.trim();
      if (!vorschau) {
        try { vorschau = TB.auszeichnung.reinerText(html); } catch (e) { vorschau = ""; }
      }
      TB.einblendung.oeffneEntwurf(TB.seite.obersteTuer(), {
        text: vorschau,
        beiSichern: function () {
          chrome.runtime.sendMessage({ art: "entwurfSichern", html: html })
            .then(function (a) {
              if (a && a.ok) meldung(TB.TE.entwurfGesichert, false);
              else meldung(TB.TE.entwurfFehler + ((a && a.fehler) || ""), true);
            })
            .catch(function () { meldung(TB.TE.entwurfFehler, true); });
        }
      });
    });
  }

  TB.faecher = { merken: merken, einsetzen: einsetzen,
                 panelFaecher: panelFaecher, neuStarten: neuStarten };
})();
