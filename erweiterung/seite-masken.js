// Datei: seite-masken.js
// Projekt: Textbausteine — Teil: Chrome-Erweiterung
// Zweck: Der Masken-Ablauf beim Benutzen eines Bausteins auf einer
//        Seite (Etappe 8) — Spiegel von ansicht-ausfuellen.js in der
//        App: erst das Masken-Fenster (Kästchen, Wenn-Abschnitte,
//        Bausteinwahl je {{Aus Kategorie:…}}), dann die gewählten
//        Bausteine der Reihe nach, am Ende EIN fertiger Text im
//        Zielfeld. Esc bricht überall ab, nichts wird eingesetzt.
//        Eigene Datei, weil seite.js sonst über die 600-Zeilen-Grenze
//        gewachsen wäre. Die Helfer kommen aus TB.seite.maskenHelfer.
//        GRUNDSATZ: nichts wird gespeichert, keine Patientendaten.

"use strict";
window.TB = window.TB || {};

TB.seiteMasken = (function () {
  function H() { return TB.seite.maskenHelfer; }

  function starteMaske(ort, baustein, urspruenglich) {
    var u = H().umgebung();
    var zurueck = H().halteStelle(ort);
    loeseMaske(baustein, u, function (erg) {
      var ziel = zurueck();
      var ok;
      if (ziel.art === "feld") { H().schreibeText(ziel, erg.text); ok = true; }
      else { ok = H().schreibeHtml(ziel, erg.html, null); }
      if (!ok) { H().inZwischenablage(erg); }
      else if (erg.fehler.length) {
        H().meldung(TB.TE.bausteinFehler + erg.fehler[0], true);
      }
      H().zaehle(baustein.id);
    }, function () {
      if (urspruenglich) H().schreibeText(zurueck(), urspruenglich);
      else zurueck();
    });
  }

  // Einen Baustein (Haupt- oder Unterbaustein) zum fertigen Ergebnis
  // machen — mit Fenster, wenn er eines braucht.
  function loeseMaske(b, u, beiFertig, beiAbbruch) {
    var html = b.text || "";
    if (b.ausgabeart === "marken") {
      var vorbereitet = html;
      if (TB.masken.istMaske(html)) {
        vorbereitet = TB.masken.wendeAn(html,
          { kaestchen: {}, antworten: {}, texte: {} }, []).html;
      }
      beiFertig(TB.reichtext.auswerte(vorbereitet, {}, u, u.holeBaustein, "marken"));
      return;
    }
    if (!TB.masken.istMaske(html)) {
      var luecken = TB.reichtext.luecken(html, u);
      if (!luecken.length) {
        beiFertig(TB.reichtext.auswerte(html, {}, u, u.holeBaustein, "fenster"));
        return;
      }
      TB.einblendung.oeffneLuecken(H().obersteTuer(), {
        titel: b.titel || b.kuerzel || "",
        luecken: luecken,
        vorschau: function (antworten) {
          return TB.reichtext.auswerte(html, antworten, u,
            u.holeBaustein, "fenster").text;
        },
        beiFertig: function (antworten) {
          beiFertig(TB.reichtext.auswerte(html, antworten, u,
            u.holeBaustein, "fenster"));
        },
        beiAbbruch: beiAbbruch
      });
      return;
    }
    var analyse = TB.masken.analysiere(html);
    TB.einblendung.oeffneMaske(H().obersteTuer(), {
      titel: b.titel || b.kuerzel || "",
      zeilen: analyse.zeilen,
      kaestchen: analyse.kaestchen,
      okText: analyse.kategorien.length ? TB.TE.weiter : TB.TE.lueckenEinfuegen,
      bausteineFuer: function (kategorie) {
        return H().bausteine().filter(function (x) {
          return x.id !== b.id &&
            String(x.kategorie || "").trim() === String(kategorie).trim();
        });
      },
      vorschau: function (z, katVorschau) {
        var vor = TB.masken.wendeAn(html, z, katVorschau.map(function (t) {
          return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/\n/g, "<br>"); }));
        return TB.reichtext.auswerte(vor.html, z.antworten, u,
          u.holeBaustein, "fenster").text;
      },
      beiFertig: function (z, reihen) {
        var auftraege = [];
        reihen.forEach(function (r) {
          r.gewaehlt.forEach(function (x) {
            auftraege.push({ nummer: r.nummer, baustein: x });
          });
        });
        var inhalte = [];
        reihen.forEach(function (r) { inhalte[r.nummer] = []; });
        (function naechster(i) {
          if (i >= auftraege.length) {
            function ausgepackt(t) {
              var m = /^\s*<p[^>]*>([\s\S]*)<\/p>\s*$/i.exec(t || "");
              return (m && m[1].indexOf("<p") === -1) ? m[1] : (t || "");
            }
            var kategorieInhalte = inhalte.map(function (teile) {
              return (teile || []).map(ausgepackt).join("<br>"); });
            var vor = TB.masken.wendeAn(html, z, kategorieInhalte);
            var erg = TB.reichtext.auswerte(vor.html, z.antworten, u,
              u.holeBaustein, "fenster");
            vor.fehler.forEach(function (f) {
              if (erg.fehler.indexOf(f) === -1) erg.fehler.push(f); });
            beiFertig(erg);
            return;
          }
          var a = auftraege[i];
          loeseMaske(a.baustein, u, function (erg2) {
            inhalte[a.nummer].push(erg2.html);
            naechster(i + 1);
          }, beiAbbruch);
        })(0);
      },
      beiAbbruch: beiAbbruch
    });
  }


  return { starte: starteMaske };
})();
