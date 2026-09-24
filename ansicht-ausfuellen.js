// Datei: ansicht-ausfuellen.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Das Ausfüll-Fenster beim Benutzen eines Bausteins — seit
//        Etappe 8 in einer eigenen Datei (oberflaeche.js wäre sonst
//        über die 600-Zeilen-Grenze gewachsen). Es kann drei Stufen:
//        1. Einfache Lücken (Feld, Auswahl) — wie bisher, mit Vorschau.
//        2. Masken: Kästchen mit überschreibbaren Vorgabetexten,
//           Wenn-Abschnitte (ausgegraut, was gerade wegfällt) und die
//           Bausteinwahl je Abschnitt ({{Aus Kategorie:…}}).
//        3. Die Fenster-Kette eines Berichts: erst die Struktur, dann
//           die gewählten Bausteine der Reihe nach, am Ende EIN
//           fertiger Text (Näds Bericht-Ablauf, 23.9.).
//        Esc bricht überall ab, ohne dass etwas kopiert wird. Jede
//        Meldung erscheint IM Fenster (Lehre I4).
//        GRUNDSATZ: Hier fliesst Bausteintext, nie Patientendaten.

"use strict";
window.TB = window.TB || {};

TB.ansichtAusfuellen = (function () {
  var T = null;
  function bereit() { T = TB.T; }

  var el = function (a, b, c) { return TB.ui.el(a, b, c); };
  var dialogOeffnen = function (d) { return TB.ui.dialogOeffnen(d); };
  function holeBaustein(kuerzel) { return TB.speicher.holenPerKuerzel(kuerzel); }

  // ---- Einstieg --------------------------------------------------------
  // beiFertig(ergebnis, fassungsHinweis) — ergebnis wie reichtext.auswerte.
  function starte(b, beiFertig) {
    bereit();
    var umgebung = TB.einstellungen.makroUmgebung();
    var f = TB.bausteine.fassungFuer(b);
    var hinweis = f.variante ? T.benutztVariante.replace("%s", f.variante) : "";
    loese(b, f.text, umgebung, function (ergebnis) {
      beiFertig(ergebnis, hinweis);
    }, null);
  }

  // Einen Baustein (Haupt- oder Unterbaustein) zum fertigen HTML
  // machen — mit Fenster, wenn er eines braucht. beiFertig(ergebnis)
  // oder beiAbbruch() (schweigend, wie bisher).
  function loese(b, html, umgebung, beiFertig, beiAbbruch) {
    var abbruch = beiAbbruch || function () {};
    // Diktat-Bausteine: Kästchen stehen auf ihren Vorgaben, die
    // Lücken werden zu Marken — kein Fenster.
    if (b.ausgabeart === "marken") {
      var vorbereitet = html;
      if (TB.masken.istMaske(html)) {
        vorbereitet = TB.masken.wendeAn(html, { kaestchen: {}, antworten: {}, texte: {} }, []).html;
      }
      beiFertig(TB.reichtext.auswerte(vorbereitet, {}, umgebung, holeBaustein, "marken"));
      return;
    }
    if (TB.masken.istMaske(html)) {
      maskenFenster(b, html, umgebung, beiFertig, abbruch);
      return;
    }
    var analyse = TB.reichtext.pruefe(html, umgebung);
    if (analyse.luecken.length === 0) {
      beiFertig(TB.reichtext.auswerte(html, {}, umgebung, holeBaustein));
      return;
    }
    felderFenster(b, html, umgebung, analyse.luecken, beiFertig, abbruch);
  }

  // ---- Stufe 1: das bisherige Lücken-Fenster ---------------------------
  function felderFenster(b, html, umgebung, luecken, beiFertig, beiAbbruch) {
    var d = el("dialog");
    d.appendChild(el("h2", "", T.ausfuellenTitel + " — " + (b.titel || "")));
    var eingaben = {};
    luecken.forEach(function (l, i) {
      var zeile = el("div", "feldzeile");
      zeile.appendChild(el("label", "", l.beschriftung));
      var feld;
      if (l.art === "auswahl") {
        feld = el("select");
        l.optionen.forEach(function (o) {
          var opt = el("option", "", o); opt.value = o; feld.appendChild(opt);
        });
      } else {
        feld = el("input"); feld.type = "text"; feld.value = l.vorgabe || "";
        if (i === 0) setTimeout(function () { feld.select(); }, 0);
      }
      eingaben[l.beschriftung] = feld;
      zeile.appendChild(feld);
      d.appendChild(zeile);
    });
    d.appendChild(el("label", "", T.vorschauTitel));
    var vorschau = el("div", "vorschau-kasten");
    d.appendChild(vorschau);

    function antworten() {
      var a = {};
      Object.keys(eingaben).forEach(function (k) { a[k] = eingaben[k].value; });
      return a;
    }
    function aktualisiere() {
      vorschau.innerHTML =
        TB.reichtext.auswerte(html, antworten(), umgebung, holeBaustein).html;
    }
    Object.keys(eingaben).forEach(function (k) {
      eingaben[k].addEventListener("input", aktualisiere);
      eingaben[k].addEventListener("change", aktualisiere);
    });
    aktualisiere();

    fensterAbschluss(d, T.kopieren, function () {
      beiFertig(TB.reichtext.auswerte(html, antworten(), umgebung, holeBaustein));
    }, beiAbbruch);
    dialogOeffnen(d);
  }

  // ---- Stufe 2 und 3: das Masken-Fenster -------------------------------
  function maskenFenster(b, html, umgebung, beiFertig, beiAbbruch) {
    var analyse = TB.masken.analysiere(html);
    var d = el("dialog", "maske");
    d.appendChild(el("h2", "", T.ausfuellenTitel + " — " + (b.titel || "")));
    if (analyse.fehler.length) {
      d.appendChild(el("p", "hinweis-warn", T.makroWarnung + analyse.fehler.join(" · ")));
    }

    var vorgabeAn = {};
    analyse.kaestchen.forEach(function (k) { vorgabeAn[k.name] = k.an; });

    // Jede Zeile weiss, wovon sie abhängt (Ausgrauen).
    var zeilen = [];        // { wurzel, bedingungen, felder:[…] }
    var kaestchenFeld = {}; // Name → checkbox
    var textFeld = {};      // Name → textarea (überschreibbare Lücke)
    var antwortFeld = {};   // Beschriftung → input/select
    var katWahl = [];       // je Kategorie-Fundstelle: { zeile, gewaehlt:[Baustein] }

    analyse.zeilen.forEach(function (z) {
      var zeile = el("div", "feldzeile maske-zeile");
      var felder = [];
      if (z.typ === "ankreuz") {
        var k = analyse.kaestchen.filter(function (x) { return x.name === z.name; })[0];
        var kopf = el("label", "maske-kopf");
        var box = el("input"); box.type = "checkbox"; box.checked = k.an;
        kopf.appendChild(box);
        kopf.appendChild(el("span", "", z.name));
        zeile.appendChild(kopf);
        kaestchenFeld[z.name] = box; felder.push(box);
        if (k.text !== null) {
          var ta = el("textarea", "maske-text");
          ta.value = k.text; ta.rows = Math.min(4, Math.max(1, k.text.split("\n").length));
          zeile.appendChild(ta);
          textFeld[z.name] = ta; felder.push(ta);
          box.addEventListener("change", function () { ta.disabled = !box.checked; });
        }
      } else if (z.typ === "auswahl") {
        zeile.appendChild(el("label", "", z.name));
        var w = el("select");
        (z.optionen || []).forEach(function (o) {
          var opt = el("option", "", o); opt.value = o; w.appendChild(opt);
        });
        zeile.appendChild(w); antwortFeld[z.name] = w; felder.push(w);
      } else if (z.typ === "feld") {
        zeile.appendChild(el("label", "", z.name));
        var e = el("input"); e.type = "text"; e.value = z.vorgabe || "";
        zeile.appendChild(e); antwortFeld[z.name] = e; felder.push(e);
      } else if (z.typ === "kategorie") {
        zeile.appendChild(el("label", "", T.maskeKategorie.replace("%s", z.kategorie)));
        var passende = TB.bausteine.alleFertigen().filter(function (x) {
          return x.id !== b.id &&
            String(x.kategorie || "").trim() === String(z.kategorie).trim();
        });
        var wahl = { zeile: z, gewaehlt: [] };
        katWahl.push(wahl);
        if (!passende.length) {
          zeile.appendChild(el("div", "erklaerung", T.maskeKategorieLeer));
        } else {
          var liste = el("div", "maske-katliste");
          passende.forEach(function (x) {
            var eintrag = el("label", "maske-kateintrag");
            var box2 = el("input"); box2.type = "checkbox";
            eintrag.appendChild(box2);
            eintrag.appendChild(el("span", "", x.titel || ("; " + (x.kuerzel || ""))));
            box2.addEventListener("change", function () {
              // Reihenfolge des Anklickens bleibt erhalten (F2).
              var i = wahl.gewaehlt.indexOf(x);
              if (box2.checked && i === -1) wahl.gewaehlt.push(x);
              if (!box2.checked && i !== -1) wahl.gewaehlt.splice(i, 1);
              aktualisiere();
            });
            liste.appendChild(eintrag);
            felder.push(box2);
          });
          zeile.appendChild(liste);
        }
      }
      d.appendChild(zeile);
      zeilen.push({ wurzel: zeile, bedingungen: z.sichtbarWenn || [], felder: felder });
    });

    d.appendChild(el("label", "", T.vorschauTitel));
    var vorschau = el("div", "vorschau-kasten");
    d.appendChild(vorschau);

    function zustandJetzt() {
      var kaestchen = {};
      Object.keys(vorgabeAn).forEach(function (n) { kaestchen[n] = vorgabeAn[n]; });
      Object.keys(kaestchenFeld).forEach(function (n) {
        kaestchen[n] = kaestchenFeld[n].checked; });
      var antworten = {}, texte = {};
      Object.keys(antwortFeld).forEach(function (n) { antworten[n] = antwortFeld[n].value; });
      Object.keys(textFeld).forEach(function (n) { texte[n] = textFeld[n].value; });
      return { kaestchen: kaestchen, antworten: antworten, texte: texte };
    }
    function grauNach(zustand) {
      zeilen.forEach(function (z) {
        var sichtbar = z.bedingungen.every(function (bed) {
          return TB.masken.bedingungGilt(bed, zustand); });
        z.wurzel.classList.toggle("gedimmt", !sichtbar);
        z.felder.forEach(function (f2) { f2.disabled = !sichtbar; });
      });
      // Textfelder abgewählter Kästchen bleiben zusätzlich gesperrt.
      Object.keys(textFeld).forEach(function (n) {
        if (kaestchenFeld[n] && !kaestchenFeld[n].checked) textFeld[n].disabled = true;
      });
    }
    function aktualisiere() {
      var z = zustandJetzt();
      grauNach(z);
      var katVorschau = katWahl.map(function (w) {
        return w.gewaehlt.map(function (x) {
          return "«" + (x.titel || x.kuerzel || "?") + "»"; }).join("<br>");
      });
      var vor = TB.masken.wendeAn(html, z, katVorschau);
      vorschau.innerHTML =
        TB.reichtext.auswerte(vor.html, z.antworten, umgebung, holeBaustein).html;
    }
    d.addEventListener("input", aktualisiere);
    d.addEventListener("change", aktualisiere);
    aktualisiere();

    fensterAbschluss(d, katWahl.length ? T.weiter : T.kopieren, function () {
      var zustand = zustandJetzt();
      // Eine Kategorie in einem abgewählten Abschnitt zählt nicht mit.
      var reihen = katWahl.map(function (w) {
        var sichtbar = (w.zeile.sichtbarWenn || []).every(function (bed) {
          return TB.masken.bedingungGilt(bed, zustand); });
        return { nummer: w.zeile.nummer,
                 gewaehlt: sichtbar ? w.gewaehlt.slice() : [] };
      });
      ketteAufloesen(b, html, umgebung, zustand, reihen, beiFertig, beiAbbruch);
    }, beiAbbruch);
    dialogOeffnen(d);
  }

  // ---- Stufe 3: die gewählten Bausteine nacheinander -------------------
  function ketteAufloesen(b, html, umgebung, zustand, reihen, beiFertig, beiAbbruch) {
    // Alle gewählten Unterbausteine in Berichts-Reihenfolge.
    var auftraege = [];
    reihen.forEach(function (r) {
      r.gewaehlt.forEach(function (x) {
        auftraege.push({ nummer: r.nummer, baustein: x });
      });
    });
    var inhalte = [];
    reihen.forEach(function (r) { inhalte[r.nummer] = []; });

    function fertigstellen() {
      // Ein einzelner Absatz wird ausgepackt, dann trennt genau EIN
      // Umbruch die gewaehlten Bausteine (kein doppelter Abstand).
      function ausgepackt(t) {
        var m = /^\s*<p[^>]*>([\s\S]*)<\/p>\s*$/i.exec(t || "");
        return (m && m[1].indexOf("<p") === -1) ? m[1] : (t || "");
      }
      var kategorieInhalte = inhalte.map(function (teile) {
        return (teile || []).map(ausgepackt).join("<br>");
      });
      var vor = TB.masken.wendeAn(html, zustand, kategorieInhalte);
      var ergebnis = TB.reichtext.auswerte(vor.html, zustand.antworten,
        umgebung, holeBaustein);
      vor.fehler.forEach(function (f2) {
        if (ergebnis.fehler.indexOf(f2) === -1) ergebnis.fehler.push(f2); });
      beiFertig(ergebnis);
    }
    (function naechster(i) {
      if (i >= auftraege.length) { fertigstellen(); return; }
      var a = auftraege[i];
      var f = TB.bausteine.fassungFuer(a.baustein);
      loese(a.baustein, f.text, umgebung, function (erg) {
        inhalte[a.nummer].push(erg.html);
        naechster(i + 1);
      }, beiAbbruch);
    })(0);
  }

  // ---- Gemeinsame Knopfzeile (fest unten, Esc bricht ab) ---------------
  function fensterAbschluss(d, okText, beiOk, beiAbbruch) {
    var knoepfe = el("div", "dialog-knoepfe");
    var ab = el("button", "neben", T.abbrechen);
    var abgeschlossen = false;
    ab.addEventListener("click", function () { d.close(); });
    var ok = el("button", "haupt", okText);
    ok.addEventListener("click", function () {
      abgeschlossen = true; d.close(); beiOk();
    });
    knoepfe.appendChild(ab); knoepfe.appendChild(ok);
    d.appendChild(knoepfe);
    d.addEventListener("close", function () {
      if (!abgeschlossen && beiAbbruch) beiAbbruch();
    });
    d.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && ev.target.tagName !== "TEXTAREA") {
        ev.preventDefault(); ok.click();
      }
    });
  }

  return { starte: starte };
})();
