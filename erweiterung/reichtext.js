// Datei: reichtext.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die Brücke zwischen Formatierung und Platzhaltern. Sobald ein
//        Baustein Auszeichnungen trägt, stehen seine Platzhalter nicht
//        mehr in schlichtem Text, sondern zwischen fett, kursiv und
//        Farbe. Diese Datei sorgt dafür, dass sie trotzdem gefunden,
//        geprüft und ausgewertet werden — und dass ein zerrissener
//        Platzhalter auffällt, statt still falsch zu wirken.
//
//        Drei Dinge kann sie:
//        1. `pruefe`   — findet Lücken und meldet zerrissene Platzhalter.
//        2. `auswerte` — ersetzt die Platzhalter und liefert die
//                        formatierte Fassung zurück.
//        3. `luecken`  — sagt, wonach das Ausfüll-Fenster fragen muss.
//
//        Die eigentliche Platzhalter-Sprache steht weiterhin in
//        makros.js; hier wird sie nur sicher auf formatierten Text
//        angewandt. Verschachtelte Bausteine werden VORHER eingesetzt,
//        damit ihre eigene Formatierung erhalten bleibt.
//
//        ZWEI AUSGABEARTEN je Baustein:
//        - "fenster" (Vorgabe): Die Lücken werden vor dem Einfügen
//          abgefragt, der Text kommt fertig ins Zielprogramm.
//        - "marken": Der Text wird sofort eingefügt, die Lücken bleiben
//          als Marken [Beschriftung] stehen. Gedacht fürs Diktieren:
//          Dragon und das Speech Mike springen von Marke zu Marke.
//          ACHTUNG: Eine übersprungene Marke bleibt im Befund stehen.
//          Darum ist das nie die Vorgabe, sondern eine Wahl je Baustein.
//        GRUNDSATZ: Hier fliesst Bausteintext, nie Patientendaten.

"use strict";
window.TB = window.TB || {};

TB.reichtext = (function () {

  var TIEFE = 3; // wie viele Ebenen {{Baustein:kürzel}} tief

  // Die Marken-Zeichen sind einstellbar, weil Dragon anders
  // eingerichtet sein kann als erwartet.
  function markenZeichen(umgebung) {
    var u = umgebung || {};
    return { auf: u.markeAuf || "[", zu: u.markeZu || "]" };
  }

  function baum(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html || "");
    return d;
  }

  function textknoten(wurzel) {
    var liste = [], lauf = wurzel.firstChild;
    (function gehe(k) {
      while (k) {
        if (k.nodeType === 3) liste.push(k);
        else if (k.nodeType === 1) gehe(k.firstChild);
        k = k.nextSibling;
      }
    })(lauf);
    return liste;
  }

  // ---- Zerrissene Platzhalter finden -----------------------------------
  // Ein Platzhalter gilt als heil, wenn seine beiden Klammerpaare im
  // SELBEN Textknoten stehen. Steht dazwischen eine Auszeichnung, ist er
  // zerrissen — dann würde er stumm als roher Text erscheinen.
  function zerrissene(html) {
    var wurzel = baum(html);
    var knoten = textknoten(wurzel);
    var heil = 0, offen = 0, namen = [];
    knoten.forEach(function (k) {
      var t = k.nodeValue;
      var auf = (t.match(/\{\{/g) || []).length;
      var zu = (t.match(/\}\}/g) || []).length;
      var paare = (t.match(/\{\{[^{}]*\}\}/g) || []);
      heil += paare.length;
      if (auf !== paare.length || zu !== paare.length) {
        offen += Math.max(auf, zu) - paare.length;
        var rest = t.replace(/\{\{[^{}]*\}\}/g, "");
        var stueck = rest.match(/\{\{[^{}]*$|^[^{}]*\}\}/);
        if (stueck) namen.push(stueck[0].replace(/[{}]/g, "").trim().slice(0, 24));
      }
    });
    return { heil: heil, zerrissen: offen, namen: namen };
  }

  // ---- Verschachtelte Bausteine einsetzen -------------------------------
  // Muss VOR der Auswertung geschehen und auf HTML-Ebene, damit die
  // Formatierung des eingesetzten Bausteins erhalten bleibt.
  function bausteineEinsetzen(html, holen, tiefe, gesehen) {
    tiefe = tiefe || 0;
    gesehen = gesehen || [];
    if (tiefe >= TIEFE) return { html: html, fehler: [TB.T.reichtextTiefe] };
    var fehler = [];
    var aus = String(html || "").replace(/\{\{\s*Baustein\s*:\s*([^}|:]+?)\s*\}\}/gi,
      function (ganz, kuerzel) {
        var k = String(kuerzel).trim();
        if (gesehen.indexOf(k.toLowerCase()) !== -1) {
          fehler.push(TB.T.reichtextKreis.replace("%s", k));
          return "";
        }
        var b = holen(k);
        if (!b) { fehler.push(TB.T.reichtextUnbekannt.replace("%s", k)); return ganz; }
        var innen = bausteineEinsetzen(b.text || "", holen, tiefe + 1,
          gesehen.concat([k.toLowerCase()]));
        innen.fehler.forEach(function (f) { fehler.push(f); });
        return innen.html;
      });
    return { html: aus, fehler: fehler };
  }

  // ---- Prüfen (für die Live-Anzeige im Bearbeiten-Fenster) -------------
  function pruefe(html, umgebung) {
    var z = zerrissene(html);
    var reinerText = TB.auszeichnung.reinerText(html);
    var analyse = TB.makros.analysiere(reinerText, umgebung || {});
    var fehler = analyse.fehler.slice();
    // Etappe 8: Die Masken-Sprache prüft sich selbst (Paarigkeit von
    // Wenn/Ende, Wenn=Wert braucht seine Auswahl, Sprung-Zahlen).
    if (typeof TB.masken !== "undefined" && TB.masken.istMaske(reinerText)) {
      TB.masken.analysiere(html).fehler.forEach(function (f) {
        if (fehler.indexOf(f) === -1) fehler.push(f); });
    }
    if (z.zerrissen > 0) {
      fehler.unshift(TB.T.reichtextZerrissen.replace("%s", z.zerrissen) +
        (z.namen.length ? " (" + z.namen.join(", ") + ")" : ""));
    }
    return { luecken: analyse.luecken, fehler: fehler, zerrissen: z.zerrissen };
  }

  function luecken(html, umgebung) {
    return TB.makros.analysiere(TB.auszeichnung.reinerText(html),
      umgebung || {}).luecken;
  }

  // ---- Marken statt Abfrage ---------------------------------------------
  // Ersetzt NUR die auszufüllenden Lücken durch Marken. Datum, Zeit,
  // Konstanten und eingesetzte Bausteine werden weiterhin gerechnet —
  // die weiss die App ja schon.
  function markenSetzen(text, umgebung) {
    var z = markenZeichen(umgebung);
    return String(text)
      .replace(/\{\{\s*Feld\s*:\s*([^}=]+?)\s*(?:=[^}]*)?\}\}/gi,
        function (ganz, beschriftung) { return z.auf + String(beschriftung).trim() + z.zu; })
      .replace(/\{\{\s*Auswahl\s*:\s*([^}:]+?)\s*:[^}]*\}\}/gi,
        function (ganz, beschriftung) { return z.auf + String(beschriftung).trim() + z.zu; });
  }

  // Warnt, wenn der Baustein selbst schon Marken-Zeichen enthält —
  // Dragon würde die für Lücken halten.
  function markenKollision(html, umgebung) {
    var z = markenZeichen(umgebung);
    var reiner = TB.auszeichnung.reinerText(html);
    var ohneLuecken = reiner.replace(/\{\{[^{}]*\}\}/g, "");
    var muster = new RegExp("\\" + z.auf + "[^\\" + z.zu + "]*\\" + z.zu);
    return muster.test(ohneLuecken);
  }

  // ---- Auswerten --------------------------------------------------------
  // Jeder Textknoten wird einzeln ausgewertet. So bleibt jede
  // Auszeichnung genau dort, wo sie war.
  function auswerte(html, antworten, umgebung, holen, art) {
    var fehler = [];
    var mitMarken = (art === "marken");
    var vorbereitet = html;
    if (holen) {
      var eingesetzt = bausteineEinsetzen(html, holen, 0, []);
      vorbereitet = eingesetzt.html;
      eingesetzt.fehler.forEach(function (f) { fehler.push(f); });
    }
    var wurzel = baum(vorbereitet);
    if (mitMarken && markenKollision(vorbereitet, umgebung)) {
      fehler.push(TB.T.reichtextMarkeDoppelt);
    }
    textknoten(wurzel).forEach(function (k) {
      if (k.nodeValue.indexOf("{{") === -1) return;
      var roh = mitMarken ? markenSetzen(k.nodeValue, umgebung) : k.nodeValue;
      if (roh.indexOf("{{") === -1) { k.nodeValue = roh; return; }
      var e = TB.makros.auswerten(roh, antworten || {}, umgebung || {});
      e.fehler.forEach(function (f) {
        if (fehler.indexOf(f) === -1) fehler.push(f); });
      k.nodeValue = e.text;
    });
    var ausHtml = wurzel.innerHTML;
    return {
      html: ausHtml,
      text: TB.auszeichnung.reinerText(ausHtml),
      rtf: TB.auszeichnung.ausHtml(ausHtml),
      art: mitMarken ? "marken" : "fenster",
      fehler: fehler
    };
  }

  return { pruefe: pruefe, luecken: luecken, auswerte: auswerte,
           zerrissene: zerrissene, bausteineEinsetzen: bausteineEinsetzen,
           markenSetzen: markenSetzen, markenKollision: markenKollision,
           markenZeichen: markenZeichen };
})();
