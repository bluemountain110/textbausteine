// Datei: formatleiste-tabellen.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die Tabellen-Werkzeugzeile des Schreibfelds (Etappe 7). Sie
//        erscheint, sobald die Schreibmarke in einer Tabelle steht:
//        Zeile/Spalte einfügen und löschen, Spaltenbreite in Stufen,
//        Ausrichtung und Hintergrund je Zelle, Zellen verbinden (nach
//        rechts/unten) und Verbund lösen — plus die Helfer für den
//        Tabulator-Zellensprung und das Einfügen neuer Tabellen, die
//        formatleiste.js mitbenutzt. Eigene Datei, weil die
//        Formatleiste sonst über die 600-Zeilen-Grenze wüchse
//        (Arbeitsweise, Abschnitt 3).
//        GRUNDSATZ: Hier steht Bausteintext, nie Patiententext.

"use strict";
window.TB = window.TB || {};

TB.formatleisteTabellen = (function () {

  function erzeuge(feld, el, geaendert) {
    // ---- Tabellen-Werkzeuge (Etappe 7) ------------------------------
    // Die Zeile erscheint nur, wenn die Schreibmarke in einer Tabelle
    // steht. Werkzeuge: Zeile/Spalte einfügen und löschen, Spaltenbreite
    // in Stufen, Ausrichtung und Hintergrund je Zelle, Zellen verbinden
    // (nach rechts/unten) und Verbund lösen. Die Struktur-Werkzeuge
    // Zeile/Spalte fassen Tabellen MIT Verbünden nicht an.
    var tabLeiste = el("div", "tabellen-leiste");
    tabLeiste.appendChild(el("span", "leisten-titel", TB.T.tabWerkzeug));
    function melde(text) {
      if (TB.ui && TB.ui.melde) TB.ui.melde(text);
    }
    function zelleAmCursor() {
      var auswahl = window.getSelection();
      var k = auswahl && auswahl.anchorNode;
      while (k && k !== feld) {
        if (k.nodeType === 1) {
          var n = k.tagName.toUpperCase();
          if (n === "TD" || n === "TH") return k;
        }
        k = k.parentNode;
      }
      return null;
    }
    function cursorIn(zelle) {
      if (!zelle) return;
      var b = document.createRange();
      b.selectNodeContents(zelle);
      b.collapse(true);
      var auswahl = window.getSelection();
      auswahl.removeAllRanges();
      auswahl.addRange(b);
      feld.focus();
    }
    // Das Gitter der Tabelle: je Zeile die belegten Spalten, Verbünde
    // eingerechnet — dieselbe Legetechnik wie beim RTF-Schreiben.
    function zellenVon(tr) {
      return Array.prototype.filter.call(tr.children, function (z) {
        var n = z.tagName.toUpperCase();
        return n === "TD" || n === "TH";
      });
    }
    function gitter(tabelle) {
      var zeilen = [];
      var haengend = {};
      Array.prototype.forEach.call(tabelle.querySelectorAll("tr"), function (tr) {
        var eintraege = [];
        var zellen = zellenVon(tr);
        var spalte = 0, nr = 0;
        while (nr < zellen.length || haengend[spalte]) {
          if (haengend[spalte]) {
            var h = haengend[spalte];
            eintraege.push({ von: spalte, weite: h.weite, oben: h.zelle });
            h.rest -= 1;
            if (!h.rest) delete haengend[spalte];
            spalte += h.weite;
            continue;
          }
          var z = zellen[nr]; nr += 1;
          var w = Math.max(1, z.colSpan || 1);
          var hoehe = Math.max(1, z.rowSpan || 1);
          eintraege.push({ von: spalte, weite: w, zelle: z });
          if (hoehe > 1) haengend[spalte] = { rest: hoehe - 1, weite: w, zelle: z };
          spalte += w;
        }
        zeilen.push(eintraege);
      });
      return zeilen;
    }
    function eintragZu(tabelle, zelle) {
      var g = gitter(tabelle);
      for (var r = 0; r < g.length; r++) {
        for (var i2 = 0; i2 < g[r].length; i2++) {
          if (g[r][i2].zelle === zelle) {
            return { gitter: g, zeile: r, eintrag: g[r][i2] };
          }
        }
      }
      return null;
    }
    function breiteProzent(zelle, ersatz) {
      var m = String((zelle.style && zelle.style.width) || "")
                .match(/^([\d.]+)%$/);
      return m ? parseFloat(m[1]) : ersatz;
    }
    function inhaltHinueber(ziel, quelle, trenner) {
      if (quelle.textContent.trim() && ziel.textContent.trim()) {
        ziel.appendChild(trenner === "zeile"
          ? document.createElement("br")
          : document.createTextNode(" "));
      }
      while (quelle.firstChild) ziel.appendChild(quelle.firstChild);
    }
    // Nach dem Einfügen oder Löschen einer SPALTE werden alle Spalten
    // der Tabelle gleich breit verteilt — die alten Prozentbreiten
    // stimmen dann ohnehin nicht mehr.
    function breitenAusgleichen(tabelle) {
      Array.prototype.forEach.call(tabelle.querySelectorAll("tr"), function (tr) {
        var n = tr.children.length || 1;
        Array.prototype.forEach.call(tr.children, function (z) {
          z.style.width = (Math.round(1000 / n) / 10) + "%";
        });
      });
    }
    function zeileAnfuegenNach(zeile) {
      // Bei verbundenen Zellen (Etappe 7, 23.9.) legen die Werkzeuge
      // keine Struktur um — eine blind eingefügte Zeile zerrisse den
      // Verbund. Inhalte bearbeiten geht immer.
      if (zeile.closest("table").querySelector("[rowspan],[colspan]")) {
        melde(TB.T.tabVerbundStruktur);
        return null;
      }
      var neu = document.createElement("tr");
      var n = zeile.children.length || 1;
      for (var z2 = 0; z2 < n; z2++) {
        var zelle = document.createElement("td");
        var vorbild = zeile.children[z2];
        if (vorbild && vorbild.style && vorbild.style.width) {
          zelle.style.width = vorbild.style.width;
        }
        neu.appendChild(zelle);
      }
      zeile.parentNode.insertBefore(neu, zeile.nextSibling);
      cursorIn(neu.children[0]);
      return neu;
    }
    function tabKnopf(beschriftung, titel, tat, beiVerbundErlaubt) {
      var k = el("button", "leise klein", beschriftung);
      k.type = "button";
      k.title = titel;
      k.addEventListener("mousedown", function (ev) { ev.preventDefault(); });
      k.addEventListener("click", function (ev) {
        ev.preventDefault();
        var zelle = zelleAmCursor();
        if (!zelle) return;
        if (!beiVerbundErlaubt &&
            zelle.closest("table").querySelector("[rowspan],[colspan]")) {
          melde(TB.T.tabVerbundStruktur);
          return;
        }
        tat(zelle);
        leisteZeigen();
        geaendert();
      });
      tabLeiste.appendChild(k);
    }
    tabKnopf(TB.T.tabZeilePlus, TB.T.tabZeilePlusTitel, function (zelle) {
      zeileAnfuegenNach(zelle.parentNode);
    });
    tabKnopf(TB.T.tabZeileMinus, TB.T.tabZeileMinusTitel, function (zelle) {
      var zeile = zelle.parentNode;
      var tabelle = zeile.closest("table");
      var alle = tabelle.querySelectorAll("tr");
      if (alle.length <= 1) { tabelle.remove(); melde(TB.T.tabTabelleEntfernt); return; }
      var naechste = zeile.nextElementSibling || zeile.previousElementSibling;
      zeile.remove();
      if (naechste) cursorIn(naechste.children[0]);
    });
    tabKnopf(TB.T.tabSpaltePlus, TB.T.tabSpaltePlusTitel, function (zelle) {
      var stelle = Array.prototype.indexOf.call(zelle.parentNode.children, zelle);
      var tabelle = zelle.closest("table");
      Array.prototype.forEach.call(tabelle.querySelectorAll("tr"), function (tr) {
        var neu = document.createElement("td");
        var vorbild = tr.children[stelle];
        if (vorbild) tr.insertBefore(neu, vorbild.nextSibling);
        else tr.appendChild(neu);
      });
      breitenAusgleichen(tabelle);
      melde(TB.T.tabBreitenNeu);
      cursorIn(zelle.nextElementSibling || zelle);
    });
    tabKnopf(TB.T.tabSpalteMinus, TB.T.tabSpalteMinusTitel, function (zelle) {
      var stelle = Array.prototype.indexOf.call(zelle.parentNode.children, zelle);
      var tabelle = zelle.closest("table");
      var uebrig = 0;
      Array.prototype.forEach.call(tabelle.querySelectorAll("tr"), function (tr) {
        if (tr.children[stelle]) tr.children[stelle].remove();
        if (tr.children.length > uebrig) uebrig = tr.children.length;
      });
      if (!uebrig) { tabelle.remove(); melde(TB.T.tabTabelleEntfernt); return; }
      breitenAusgleichen(tabelle);
      melde(TB.T.tabBreitenNeu);
    });
    // Spaltenbreite in Stufen (Näds Entscheid 23.9.): wirkt auf die
    // Spalte der Schreibmarke; die rechte Nachbarspalte (am Rand die
    // linke) gleicht aus. Massgeblich ist die erste Zeile — von ihr
    // nimmt die Anzeige die Spaltenbreiten.
    function spalteBreite(zelle, schritt) {
      var tabelle = zelle.closest("table");
      var info = eintragZu(tabelle, zelle);
      if (!info) return;
      var erste = info.gitter[0];
      var stand = null, dabei = -1;
      erste.forEach(function (e, nr) {
        if (e.zelle && e.von <= info.eintrag.von &&
            info.eintrag.von < e.von + e.weite) { stand = e; dabei = nr; }
      });
      if (!stand) { melde(TB.T.tabBreiteNicht); return; }
      var nachbar = null;
      for (var n2 = dabei + 1; n2 < erste.length; n2++) {
        if (erste[n2].zelle) { nachbar = erste[n2]; break; }
      }
      if (!nachbar) {
        for (var n3 = dabei - 1; n3 >= 0; n3--) {
          if (erste[n3].zelle) { nachbar = erste[n3]; break; }
        }
      }
      if (!nachbar) { melde(TB.T.tabBreiteNicht); return; }
      var ersatz = 100 / Math.max(1, erste.length);
      var w1 = breiteProzent(stand.zelle, ersatz);
      var w2 = breiteProzent(nachbar.zelle, ersatz);
      if (w1 + schritt < 4 || w2 - schritt < 4) { melde(TB.T.tabBreiteGrenze); return; }
      stand.zelle.style.width = (Math.round((w1 + schritt) * 10) / 10) + "%";
      nachbar.zelle.style.width = (Math.round((w2 - schritt) * 10) / 10) + "%";
    }
    tabKnopf(TB.T.tabSchmaler, TB.T.tabSchmalerTitel, function (zelle) {
      spalteBreite(zelle, -3);
    }, true);
    tabKnopf(TB.T.tabBreiter, TB.T.tabBreiterTitel, function (zelle) {
      spalteBreite(zelle, 3);
    }, true);
    // Ausrichtung je Zelle.
    [["L", TB.T.tabAusrLinks, ""], ["M", TB.T.tabAusrMitte, "center"],
     ["R", TB.T.tabAusrRechts, "right"]].forEach(function (a) {
      tabKnopf(a[0], a[1], function (zelle) {
        if (a[2]) zelle.style.textAlign = a[2];
        else zelle.style.removeProperty("text-align");
      }, true);
    });
    // Zell-Hintergrund.
    var GRUENDE = [["Silber", "#c0c0c0"], ["Gelb", "#ffff00"],
                   ["Grün", "#b6f2c4"], ["Blau", "#cfe3ff"], ["Keine", ""]];
    var grundWahl = document.createElement("select");
    grundWahl.className = "klein";
    grundWahl.title = TB.T.tabGrundTitel;
    var grundErster = el("option", "", TB.T.tabGrund);
    grundErster.value = "-";
    grundWahl.appendChild(grundErster);
    GRUENDE.forEach(function (p) {
      var o = el("option", "", p[0]); o.value = p[1]; grundWahl.appendChild(o);
    });
    grundWahl.addEventListener("mousedown", function () { feld.focus(); });
    grundWahl.addEventListener("change", function () {
      var zelle = zelleAmCursor();
      if (zelle && grundWahl.value !== "-") {
        if (grundWahl.value) zelle.style.backgroundColor = grundWahl.value;
        else zelle.style.removeProperty("background-color");
        geaendert();
      }
      grundWahl.selectedIndex = 0;
    });
    tabLeiste.appendChild(grundWahl);
    // Zellen verbinden und lösen (Näds Entscheid 23.9.): verbunden wird
    // von der Zelle der Schreibmarke aus nach rechts oder nach unten —
    // ohne heikles Aufziehen über mehrere Zellen.
    tabKnopf(TB.T.tabVerbRechts, TB.T.tabVerbRechtsTitel, function (zelle) {
      var tabelle = zelle.closest("table");
      var info = eintragZu(tabelle, zelle);
      if (!info) return;
      var nachbar = null;
      info.gitter[info.zeile].forEach(function (e) {
        if (e.von === info.eintrag.von + info.eintrag.weite) nachbar = e;
      });
      if (!nachbar || !nachbar.zelle) { melde(TB.T.tabVerbKein); return; }
      if ((zelle.rowSpan || 1) !== (nachbar.zelle.rowSpan || 1)) {
        melde(TB.T.tabVerbUngleich); return;
      }
      var w = breiteProzent(zelle, 0) + breiteProzent(nachbar.zelle, 0);
      zelle.colSpan = (zelle.colSpan || 1) + (nachbar.zelle.colSpan || 1);
      if (w) zelle.style.width = (Math.round(w * 10) / 10) + "%";
      inhaltHinueber(zelle, nachbar.zelle, "spalte");
      nachbar.zelle.remove();
      cursorIn(zelle);
    }, true);
    tabKnopf(TB.T.tabVerbUnten, TB.T.tabVerbUntenTitel, function (zelle) {
      var tabelle = zelle.closest("table");
      var info = eintragZu(tabelle, zelle);
      if (!info) return;
      var untenZeile = info.gitter[info.zeile + (zelle.rowSpan || 1)];
      var unten = null;
      (untenZeile || []).forEach(function (e) {
        if (e.von === info.eintrag.von && e.weite === info.eintrag.weite &&
            e.zelle) unten = e.zelle;
      });
      if (!unten) { melde(TB.T.tabVerbKein); return; }
      zelle.rowSpan = (zelle.rowSpan || 1) + (unten.rowSpan || 1);
      inhaltHinueber(zelle, unten, "zeile");
      unten.remove();
      cursorIn(zelle);
    }, true);
    tabKnopf(TB.T.tabLoesen, TB.T.tabLoesenTitel, function (zelle) {
      var hoch = zelle.rowSpan || 1, breit = zelle.colSpan || 1;
      if (hoch === 1 && breit === 1) { melde(TB.T.tabLoesenNichts); return; }
      var tabelle = zelle.closest("table");
      var info = eintragZu(tabelle, zelle);
      if (!info) return;
      var reihen = tabelle.querySelectorAll("tr");
      var wTeil = breiteProzent(zelle, 0)
        ? Math.round(breiteProzent(zelle, 0) / breit * 10) / 10 : 0;
      zelle.removeAttribute("rowspan");
      zelle.removeAttribute("colspan");
      if (wTeil) zelle.style.width = wTeil + "%";
      for (var e2 = 1; e2 < breit; e2++) {
        var neuR = document.createElement("td");
        if (wTeil) neuR.style.width = wTeil + "%";
        zelle.parentNode.insertBefore(neuR, zelle.nextSibling);
      }
      for (var r2 = info.zeile + 1; r2 < info.zeile + hoch && r2 < reihen.length; r2++) {
        var davor = null;
        info.gitter[r2].forEach(function (e) {
          if (!davor && e.zelle && e.von > info.eintrag.von) davor = e.zelle;
        });
        for (var e3 = 0; e3 < breit; e3++) {
          var neuU = document.createElement("td");
          if (davor) reihen[r2].insertBefore(neuU, davor);
          else reihen[r2].appendChild(neuU);
        }
      }
      cursorIn(zelle);
    }, true);
    function leisteZeigen() {
      // Ist das Fenster zu (Feld nicht mehr im Dokument), räumt sich
      // der Lauscher selbst weg — sonst sammelten sich welche an.
      if (!feld.isConnected) {
        document.removeEventListener("selectionchange", leisteZeigen);
        return;
      }
      tabLeiste.className = zelleAmCursor()
        ? "tabellen-leiste sichtbar" : "tabellen-leiste";
    }

    document.addEventListener("selectionchange", leisteZeigen);
    feld.addEventListener("focus", leisteZeigen);
    return { tabLeiste: tabLeiste, leisteZeigen: leisteZeigen,
             zelleAmCursor: zelleAmCursor, cursorIn: cursorIn,
             zeileAnfuegenNach: zeileAnfuegenNach, melde: melde };
  }

  return { erzeuge: erzeuge };
})();
