// Datei: statistik.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Bereitet die gezählten Zahlen für die Anzeige auf: welche
//        Bausteine wurden am häufigsten eingefügt, welche Funktionen
//        wurden benutzt, seit wann wird gezählt — und seit Etappe 2
//        über ALLE Geräte zusammengezählt, mit einer eigenen Liste,
//        die zeigt, wie viel auf welchem Gerät passiert.
//        GRUNDSATZ: Gezählt wird nur WIE OFT — nie WAS. In der
//        Statistik stehen keine Bausteintexte und keine Patientendaten.

"use strict";
window.TB = window.TB || {};

TB.statistik = (function () {
  var S = function () { return TB.speicher; };

  // Namen der gezählten Funktionen an EINER Stelle (deutsch, weil sie
  // so in der Anzeige erscheinen).
  var F = {
    eingefuegt: "Baustein eingefügt",
    angelegt: "Baustein angelegt",
    geaendert: "Baustein geändert",
    papierkorb: "In den Papierkorb gelegt",
    zurueckgeholt: "Aus dem Papierkorb geholt",
    endgueltig: "Endgültig gelöscht",
    export: "Export erstellt",
    import: "Import ausgeführt",
    selbsttest: "Selbsttest gestartet",
    beispiele: "Beispiele eingefügt",
    gesucht: "Suche benutzt",
    entwurf: "Entwurf erfasst",
    idee: "Idee gesichert",
    entwurfFertig: "Entwurf fertiggestellt"
  };

  function zaehle(schluessel) { S().zaehleFunktion(F[schluessel] || schluessel); }

  function bausteinBenutzt(id) {
    S().merkeBenutzt(id);
    S().zaehleBaustein(id);
    S().zaehleFunktion(F.eingefuegt);
  }

  // Eigene und fremde Zählwerte in EINE Tabelle legen — zwei Anzeigen
  // derselben Sache zählen über dieselbe Funktion.
  function zusammengezaehlt(art) {
    var summe = {};
    function dazu(schluessel, anzahl, zuletzt) {
      var e = summe[schluessel] || { anzahl: 0, zuletzt: null };
      e.anzahl += (anzahl || 0);
      if (zuletzt && (!e.zuletzt || Date.parse(zuletzt) > Date.parse(e.zuletzt))) {
        e.zuletzt = zuletzt;
      }
      summe[schluessel] = e;
    }
    var eigen = (art === "baustein") ? S().statistik().bausteine
                                     : S().statistik().funktionen;
    Object.keys(eigen).forEach(function (k) {
      dazu(k, eigen[k].anzahl, eigen[k].zuletzt); });
    S().fremdStatistik().forEach(function (z) {
      if (z.art === art) dazu(z.schluessel, z.anzahl, z.zuletzt); });
    return summe;
  }

  function gesamtEinfuegungen() {
    var f = zusammengezaehlt("funktion")[F.eingefuegt];
    return f ? f.anzahl : 0;
  }

  // Liste der Bausteine nach Häufigkeit. Gelöschte bleiben gezählt,
  // werden aber als solche gekennzeichnet.
  function bausteinListe(anzahl) {
    var st = zusammengezaehlt("baustein");
    return Object.keys(st).map(function (id) {
      var b = S().holen(id);
      return { id: id, anzahl: st[id].anzahl, zuletzt: st[id].zuletzt,
               titel: b ? (b.titel || "(ohne Titel)") : null,
               entfernt: !b };
    }).sort(function (a, b) { return b.anzahl - a.anzahl; })
      .slice(0, anzahl || 20);
  }

  function funktionListe() {
    var st = zusammengezaehlt("funktion");
    return Object.keys(st).map(function (name) {
      return { name: name, anzahl: st[name].anzahl, zuletzt: st[name].zuletzt };
    }).sort(function (a, b) { return b.anzahl - a.anzahl; });
  }

  // Wie viel läuft auf welchem Gerät? Nur die eingefügten Bausteine
  // werden gezählt — das ist die Zahl, die etwas aussagt.
  function geraeteListe() {
    var pro = {};
    function dazu(name, anzahl, zuletzt) {
      var e = pro[name] || { anzahl: 0, zuletzt: null };
      e.anzahl += (anzahl || 0);
      if (zuletzt && (!e.zuletzt || Date.parse(zuletzt) > Date.parse(e.zuletzt))) {
        e.zuletzt = zuletzt;
      }
      pro[name] = e;
    }
    var eigen = S().statistik().bausteine;
    var eigenSumme = 0, eigenZuletzt = null;
    Object.keys(eigen).forEach(function (k) {
      eigenSumme += eigen[k].anzahl;
      if (eigen[k].zuletzt && (!eigenZuletzt ||
          Date.parse(eigen[k].zuletzt) > Date.parse(eigenZuletzt))) {
        eigenZuletzt = eigen[k].zuletzt;
      }
    });
    if (eigenSumme) {
      dazu(S().geraet() + " (" + TB.T.statistikDiesesGeraet + ")", eigenSumme, eigenZuletzt);
    }
    S().fremdStatistik().forEach(function (z) {
      if (z.art === "baustein") dazu(z.geraet, z.anzahl, z.zuletzt); });
    return Object.keys(pro).map(function (name) {
      return { name: name, anzahl: pro[name].anzahl, zuletzt: pro[name].zuletzt };
    }).sort(function (a, b) { return b.anzahl - a.anzahl; });
  }

  function datum(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("de-CH");
  }

  function bericht() {
    function z(n) { return (n < 10 ? "0" : "") + n; }
    var d = new Date();
    var zeilen = [
      "TEXTBAUSTEINE STATISTIK — " + S().geraet() + " — Welt: " + S().WELT +
        " — Fassung " + TB.FASSUNG,
      "Zeitpunkt: " + d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" +
        z(d.getDate()) + " " + z(d.getHours()) + ":" + z(d.getMinutes()) +
        ":" + z(d.getSeconds()),
      "Gezählt seit: " + datum(S().statistik().seit) + " (dieses Gerät)",
      "Bausteine insgesamt eingefügt (alle Geräte): " + gesamtEinfuegungen(),
      "",
      "— Meistbenutzte Bausteine —"
    ];
    var b = bausteinListe(20);
    if (!b.length) zeilen.push("(noch nichts)");
    b.forEach(function (e) {
      zeilen.push(e.anzahl + "× " + (e.titel || "(gelöschter Baustein)") +
        (e.zuletzt ? "  [zuletzt " + datum(e.zuletzt) + "]" : ""));
    });
    zeilen.push("");
    zeilen.push("— Benutzte Funktionen —");
    var f = funktionListe();
    if (!f.length) zeilen.push("(noch nichts)");
    f.forEach(function (e) {
      zeilen.push(e.anzahl + "× " + e.name +
        (e.zuletzt ? "  [zuletzt " + datum(e.zuletzt) + "]" : ""));
    });
    zeilen.push("");
    zeilen.push("— Verteilung auf die Geräte —");
    var g = geraeteListe();
    if (!g.length) zeilen.push("(noch nichts)");
    g.forEach(function (e) {
      zeilen.push(e.anzahl + "× " + e.name +
        (e.zuletzt ? "  [zuletzt " + datum(e.zuletzt) + "]" : ""));
    });
    return zeilen.join("\n");
  }

  return { F: F, zaehle: zaehle, bausteinBenutzt: bausteinBenutzt,
           gesamtEinfuegungen: gesamtEinfuegungen,
           bausteinListe: bausteinListe, funktionListe: funktionListe,
           geraeteListe: geraeteListe, datum: datum, bericht: bericht };
})();
