// Datei: tastenkuerzel.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die Tastenkürzel fürs Formatieren im Schreibfeld — welche
//        Taste welche Auszeichnung auslöst. Die Vorgabe entspricht dem,
//        was Word und die meisten Programme benutzen; jedes Kürzel
//        lässt sich in den Einstellungen umbelegen, damit es zu KISIM
//        passt.
//        Die Belegung wird abgeglichen: einmal einstellen, überall
//        gleich.
//
//        WICHTIG: Manche Kombinationen fängt der Browser ab, bevor die
//        Seite sie überhaupt sieht (neues Fenster, neuer Reiter,
//        schliessen, drucken). Die sind hier als gesperrt vermerkt und
//        werden beim Einstellen abgelehnt — sonst belegte Näd eine
//        Taste, die nie ankommt, und suchte den Fehler bei sich.

"use strict";
window.TB = window.TB || {};

TB.tastenkuerzel = (function () {

  // Die Tätigkeiten, die sich belegen lassen. Reihenfolge = Anzeige.
  var TAETIGKEITEN = [
    ["fett", "bold"], ["kursiv", "italic"], ["unterstrichen", "underline"],
    ["durchgestrichen", "strikeThrough"],
    ["liste", "insertUnorderedList"], ["nummern", "insertOrderedList"],
    ["sauber", "removeFormat"]
  ];

  var VORGABE = {
    fett: "Strg+B",
    kursiv: "Strg+I",
    unterstrichen: "Strg+U",
    durchgestrichen: "Strg+Umschalt+X",
    liste: "Strg+Umschalt+L",
    nummern: "Strg+Umschalt+O",
    sauber: "Strg+Leertaste"
  };

  // Was der Browser für sich behält. Diese Kombinationen erreichen die
  // Seite gar nicht oder nur unzuverlässig.
  var GESPERRT = ["Strg+N", "Strg+T", "Strg+W", "Strg+Q", "Strg+P", "Strg+L",
                  "Strg+D", "Strg+R", "Strg+Umschalt+T", "Strg+Umschalt+W",
                  "Strg+Umschalt+Q", "Strg+Umschalt+P"];

  // Von der App selbst belegt (Suchen, Neu).
  var EIGEN = { "Strg+F": "Suche", "Strg+N": "Neuer Baustein" };

  // Strg+Umschalt+N war bis zum 15.9. ebenfalls „Neuer Baustein", weil
  // die App die Umschalttaste nicht beachtet hat. Das ist behoben; die
  // Kombination ist wieder frei.

  // Ein Tastendruck wird zu einem lesbaren Namen — derselbe, der in den
  // Einstellungen steht. Strg steht auch für die Befehlstaste am Mac.
  function nameVon(ereignis) {
    var teile = [];
    if (ereignis.ctrlKey || ereignis.metaKey) teile.push("Strg");
    if (ereignis.altKey) teile.push("Alt");
    if (ereignis.shiftKey) teile.push("Umschalt");
    var taste = ereignis.key;
    if (!taste) return "";
    if (taste === " ") taste = "Leertaste";
    else if (taste.length === 1) taste = taste.toUpperCase();
    else if (["Control", "Shift", "Alt", "Meta"].indexOf(taste) !== -1) return "";
    teile.push(taste);
    return teile.join("+");
  }

  function belegung() {
    var eigene = TB.speicher.einstellung("tastenkuerzel", null) || {};
    var aus = {};
    Object.keys(VORGABE).forEach(function (t) {
      aus[t] = eigene[t] || VORGABE[t];
    });
    return aus;
  }

  function setze(taetigkeit, name) {
    var eigene = TB.speicher.einstellung("tastenkuerzel", null) || {};
    if (name) eigene[taetigkeit] = name; else delete eigene[taetigkeit];
    TB.speicher.setzeEinstellung("tastenkuerzel", eigene);
  }

  function zuruecksetzen() {
    TB.speicher.setzeEinstellung("tastenkuerzel", {});
  }

  // Prüft eine gewünschte Belegung, BEVOR sie gespeichert wird.
  function pruefe(taetigkeit, name) {
    if (!name) return { ok: false, grund: TB.T.kuerzelLeer };
    if (GESPERRT.indexOf(name) !== -1) {
      return { ok: false, grund: TB.T.kuerzelGesperrt.replace("%s", name) };
    }
    if (EIGEN[name]) {
      return { ok: false, grund: TB.T.kuerzelBelegtApp.replace("%s", EIGEN[name]) };
    }
    if (name.indexOf("Strg") === -1 && name.indexOf("Alt") === -1) {
      return { ok: false, grund: TB.T.kuerzelOhneZusatz };
    }
    var b = belegung(), doppelt = null;
    Object.keys(b).forEach(function (t) {
      if (t !== taetigkeit && b[t] === name) doppelt = t; });
    if (doppelt) {
      return { ok: false, grund: TB.T.kuerzelDoppelt.replace("%s", TB.T["kuerzel_" + doppelt]) };
    }
    return { ok: true, grund: "" };
  }

  // Sucht zu einem Tastendruck die Tätigkeit. Liefert den Befehl für
  // das Schreibfeld oder null.
  function befehlFuer(ereignis) {
    var name = nameVon(ereignis);
    if (!name) return null;
    var b = belegung();
    for (var i = 0; i < TAETIGKEITEN.length; i++) {
      var t = TAETIGKEITEN[i][0];
      if (b[t] === name) return { taetigkeit: t, befehl: TAETIGKEITEN[i][1] };
    }
    return null;
  }

  return { TAETIGKEITEN: TAETIGKEITEN, VORGABE: VORGABE, GESPERRT: GESPERRT,
           belegung: belegung, setze: setze, zuruecksetzen: zuruecksetzen,
           pruefe: pruefe, befehlFuer: befehlFuer, nameVon: nameVon };
})();
