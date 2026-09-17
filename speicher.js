// Datei: speicher.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die EINE Speicher-Schnittstelle. Alles Laden, Speichern,
//        Löschen (weich, mit Papierkorb), Export und Import läuft
//        hier durch — nirgends sonst wird in den Speicher geschrieben.
//        Die App liest und schreibt IMMER zuerst hier, also sofort und
//        ohne Netz; der Abgleich mit der Datenablage läuft danach im
//        Hintergrund (abgleich.js). Darum merkt sich diese Datei in
//        einer Warteschlange, was noch hochgeladen werden muss.
//        GRUNDSATZ: Hier landen NIE Patientendaten — nur Bausteine,
//        Kategorien, Einstellungen und Zählwerte.

"use strict";
window.TB = window.TB || {};

TB.FASSUNG = "6 · Etappe 2 · 17.09.2026";

TB.speicher = (function () {

  // ---- Welt (Dev/Prod) und Ablage ----------------------------------
  function ermittleWelt() {
    try {
      if (typeof location !== "undefined" &&
          /welt=dev/.test(location.search)) return "dev";
    } catch (e) { /* Node-Testlauf ohne location */ }
    return "prod";
  }
  var WELT = ermittleWelt();
  var SCHLUESSEL = "textbausteine." + WELT + ".v1";
  var GERAETESCHLUESSEL = "textbausteine." + WELT + ".geraet";

  // Austauschbares Lager: Browser-Speicher, im Testlauf ein Objekt.
  var lager = (function () {
    try { localStorage.setItem("_t", "1"); localStorage.removeItem("_t");
          return localStorage; } catch (e) {
      var m = {};
      return { getItem: function (k) { return (k in m) ? m[k] : null; },
               setItem: function (k, v) { m[k] = String(v); },
               removeItem: function (k) { delete m[k]; } };
    }
  })();

  var daten = null;

  function jetztISO() { return new Date().toISOString(); }

  function neueKennung() {
    try { return crypto.randomUUID(); } catch (e) {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,
        function (c) { var r = Math.random() * 16 | 0;
          return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16); });
    }
  }

  // Der Gerätename bleibt IMMER auf diesem Gerät — er wird nie
  // abgeglichen, sonst hiessen alle Geräte gleich. Zwei Windows-Rechner
  // lassen sich so auseinanderhalten.
  function geraet() {
    var g = lager.getItem(GERAETESCHLUESSEL);
    if (!g) {
      var art = "Geraet";
      try {
        var kennung = navigator.platform || navigator.userAgent || "";
        if (/iPhone/.test(navigator.userAgent)) art = "iPhone";
        else if (/iPad/.test(navigator.userAgent)) art = "iPad";
        else if (/Mac/.test(kennung)) art = "Mac";
        else if (/Win/.test(kennung)) art = "Windows";
      } catch (e) { /* Testlauf ohne Browser */ }
      g = art + "-" + neueKennung().slice(0, 4);
      lager.setItem(GERAETESCHLUESSEL, g);
    }
    return g;
  }
  function setzeGeraet(name) {
    var n = String(name || "").trim();
    if (n) lager.setItem(GERAETESCHLUESSEL, n);
  }

  function laden() {
    if (daten) return daten;
    var roh = lager.getItem(SCHLUESSEL);
    if (roh) { try { daten = JSON.parse(roh); } catch (e) { daten = null; } }
    if (!daten || !Array.isArray(daten.bausteine)) {
      daten = { bausteine: [], einstellungen: {} };
    }
    if (!daten.einstellungen) daten.einstellungen = {};
    if (!daten.einstellungenZeit) daten.einstellungenZeit = {};
    if (!daten.statistik || typeof daten.statistik !== "object") {
      daten.statistik = { seit: jetztISO(), bausteine: {}, funktionen: {} };
    }
    if (!Array.isArray(daten.fremdStatistik)) daten.fremdStatistik = [];
    if (!daten.abgleich || typeof daten.abgleich !== "object") {
      daten.abgleich = { zuletzt: null, stand: null };
    }
    if (!daten.warteschlange || typeof daten.warteschlange !== "object") {
      daten.warteschlange = { bausteine: {}, einstellungen: {}, statistik: false };
    }
    if (!Array.isArray(daten.konflikte)) daten.konflikte = [];
    return daten;
  }

  function sichern() {
    lager.setItem(SCHLUESSEL, JSON.stringify(daten));
  }

  // ---- Warteschlange: was muss noch hoch? ---------------------------
  // Zu jedem wartenden Baustein wird die AUSGANGSFASSUNG gemerkt: der
  // Änderungszeitpunkt, den er hatte, als er zuletzt mit der Ablage
  // einig war. Nur so lässt sich später unterscheiden, ob eine Zeile
  // aus der Ablage die eigene zurückgeworfene Fassung ist oder eine
  // echte Änderung von einem anderen Gerät.
  function merkeOffen(id, ausgangsfassung) {
    var w = laden().warteschlange.bausteine;
    if (!(id in w)) w[id] = ausgangsfassung || null;
  }
  function ausgangsfassung(id) {
    var w = laden().warteschlange.bausteine;
    return (id in w) ? w[id] : undefined;
  }
  // Alles in die Warteschlange legen, ohne einen Zeitstempel zu ändern
  // (für den allerersten Abgleich eines Geräts).
  function merkeAlleOffen() {
    laden();
    daten.bausteine.forEach(function (b) { merkeOffen(b.id, b.aktualisiertAm); });
    Object.keys(daten.einstellungen).forEach(function (n) {
      daten.warteschlange.einstellungen[n] = true; });
    daten.warteschlange.statistik = true;
    sichern();
  }
  function offeneBausteine() {
    return Object.keys(laden().warteschlange.bausteine);
  }
  function offeneEinstellungen() {
    return Object.keys(laden().warteschlange.einstellungen);
  }
  function statistikOffen() { return !!laden().warteschlange.statistik; }
  function istOffen(id) { return !!laden().warteschlange.bausteine[id]; }
  function erledigt(art, schluesselListe) {
    laden();
    if (art === "statistik") { daten.warteschlange.statistik = false; }
    else {
      (schluesselListe || []).forEach(function (k) {
        delete daten.warteschlange[art][k]; });
    }
    sichern();
  }
  function offenAnzahl() {
    return offeneBausteine().length + offeneEinstellungen().length +
           (statistikOffen() ? 1 : 0);
  }

  // ---- Abgleich-Stand ------------------------------------------------
  function abgleichStand() { return laden().abgleich; }
  function setzeAbgleichStand(feld, wert) {
    laden().abgleich[feld] = wert; sichern();
  }

  // ---- Bausteine ----------------------------------------------------
  var FELDER = ["titel", "kuerzel", "kategorie", "text", "notiz", "varianten",
                "sortierung", "art", "entwurf", "ausgabeart", "zuletztBenutztAm"];

  function alle() { return laden().bausteine; }
  function alleAktiven() {
    return laden().bausteine.filter(function (b) { return !b.geloeschtAm; });
  }
  function allePapierkorb() {
    return laden().bausteine.filter(function (b) { return !!b.geloeschtAm; });
  }
  function holen(id) {
    return laden().bausteine.find(function (b) { return b.id === id; }) || null;
  }
  function holenPerKuerzel(kuerzel) {
    var k = String(kuerzel || "").toLowerCase();
    return alleAktiven().find(function (b) {
      return !b.entwurf && (b.kuerzel || "").toLowerCase() === k; }) || null;
  }

  // Die EINE Erzeugungs-/Speicher-Funktion: setzt Kennung und Zeiten
  // und legt den Baustein in die Warteschlange fürs Hochladen.
  function speichern(eintrag) {
    laden();
    var b = holen(eintrag.id);
    if (!b) {
      b = { id: eintrag.id || neueKennung(), erstelltAm: jetztISO(), art: "text",
            entwurf: false, ausgabeart: "fenster" };
      daten.bausteine.push(b);
    }
    merkeOffen(b.id, b.aktualisiertAm);
    FELDER.forEach(function (f) {
      if (eintrag[f] !== undefined) b[f] = eintrag[f];
    });
    b.aktualisiertAm = jetztISO();
    sichern();
    return b;
  }

  function merkeBenutzt(id) {
    var b = holen(id);
    if (b) { merkeOffen(id, b.aktualisiertAm);
             b.zuletztBenutztAm = jetztISO(); b.aktualisiertAm = jetztISO();
             sichern(); }
  }

  function inPapierkorb(id) {
    var b = holen(id);
    if (b) { merkeOffen(id, b.aktualisiertAm);
             b.geloeschtAm = jetztISO(); b.aktualisiertAm = jetztISO();
             sichern(); }
  }
  function zurueckholen(id) {
    var b = holen(id);
    if (b) { merkeOffen(id, b.aktualisiertAm);
             b.geloeschtAm = null; b.aktualisiertAm = jetztISO();
             sichern(); }
  }
  function endgueltigLoeschen(ids) {
    laden();
    daten.bausteine = daten.bausteine.filter(function (b) {
      return ids.indexOf(b.id) === -1; });
    ids.forEach(function (id) { delete daten.warteschlange.bausteine[id]; });
    sichern();
  }
  // Papierkorb-Frist: 30 Tage, Prüfung bei jedem Start.
  function raeumePapierkorbAuf(jetzt) {
    var grenze = (jetzt || Date.now()) - 30 * 24 * 60 * 60 * 1000;
    var alt = allePapierkorb().filter(function (b) {
      return Date.parse(b.geloeschtAm) < grenze; });
    if (alt.length) endgueltigLoeschen(alt.map(function (b) { return b.id; }));
    return alt.length;
  }

  // Einspielen einer Fassung aus der Datenablage: übernimmt die Zeiten
  // der Gegenseite unverändert und legt NICHTS in die Warteschlange —
  // sonst schickten wir das eben Empfangene sofort wieder zurück.
  function fremdEinspielen(baustein) {
    laden();
    var b = holen(baustein.id);
    if (!b) { daten.bausteine.push(baustein); }
    else {
      Object.keys(baustein).forEach(function (f) { b[f] = baustein[f]; });
    }
    sichern();
  }

  // ---- Einstellungen -------------------------------------------------
  function einstellung(name, vorgabe) {
    var e = laden().einstellungen;
    return (e[name] !== undefined && e[name] !== null) ? e[name] : vorgabe;
  }
  function setzeEinstellung(name, wert) {
    laden();
    daten.einstellungen[name] = wert;
    daten.einstellungenZeit[name] = jetztISO();
    daten.warteschlange.einstellungen[name] = true;
    sichern();
  }
  function einstellungZeit(name) { return laden().einstellungenZeit[name] || null; }
  function fremdEinstellung(name, wert, zeit) {
    laden();
    daten.einstellungen[name] = wert;
    daten.einstellungenZeit[name] = zeit;
    sichern();
  }

  // ---- Statistik ------------------------------------------------------
  // Gezählt wird NUR, wie oft etwas benutzt wird. Niemals Inhalte.
  function zaehleBaustein(id) {
    laden();
    var e = daten.statistik.bausteine[id] || { anzahl: 0, zuletzt: null };
    e.anzahl += 1; e.zuletzt = jetztISO();
    daten.statistik.bausteine[id] = e;
    daten.warteschlange.statistik = true;
    sichern();
  }
  function zaehleFunktion(name) {
    laden();
    var e = daten.statistik.funktionen[name] || { anzahl: 0, zuletzt: null };
    e.anzahl += 1; e.zuletzt = jetztISO();
    daten.statistik.funktionen[name] = e;
    daten.warteschlange.statistik = true;
    sichern();
  }
  function statistik() { return laden().statistik; }
  function fremdStatistik() { return laden().fremdStatistik; }
  function setzeFremdStatistik(zeilen) {
    laden(); daten.fremdStatistik = zeilen || []; sichern();
  }
  function statistikZuruecksetzen() {
    laden();
    daten.statistik = { seit: jetztISO(), bausteine: {}, funktionen: {} };
    daten.fremdStatistik = [];
    daten.warteschlange.statistik = true;
    sichern();
  }

  // ---- Konflikte ------------------------------------------------------
  // Ein Konflikt wird NIE still entschieden: beide Fassungen bleiben
  // liegen, bis Näd gewählt hat.
  function konflikte() { return laden().konflikte; }
  function merkeKonflikt(eintrag) {
    laden();
    daten.konflikte = daten.konflikte.filter(function (k) {
      return k.id !== eintrag.id; });
    daten.konflikte.push(eintrag);
    sichern();
  }
  function loeseKonflikt(id) {
    laden();
    daten.konflikte = daten.konflikte.filter(function (k) { return k.id !== id; });
    sichern();
  }

  // ---- Export / Import ----------------------------------------------
  function exportObjekt() {
    laden();
    return {
      art: "textbausteine-export",
      fassung: 2,
      erstellt: jetztISO(),
      welt: WELT,
      geraet: geraet(),
      anzahlAktiv: alleAktiven().length,
      anzahlPapierkorb: allePapierkorb().length,
      bausteine: daten.bausteine,
      einstellungen: daten.einstellungen,
      statistik: daten.statistik
    };
  }
  function exportDateiname(jetzt) {
    var d = jetzt || new Date();
    function z(n) { return (n < 10 ? "0" : "") + n; }
    return "Textbausteine-Export-" + d.getFullYear() + "-" +
      z(d.getMonth() + 1) + "-" + z(d.getDate()) + "-" +
      z(d.getHours()) + z(d.getMinutes()) + z(d.getSeconds()) + ".json";
  }

  // Import: fügt nur hinzu, überschreibt nie. Vorschau vor Anwendung.
  function importVorschau(jsonText) {
    var obj;
    try { obj = JSON.parse(jsonText); } catch (e) {
      return { fehler: "kein gültiges JSON" }; }
    if (!obj || obj.art !== "textbausteine-export" ||
        !Array.isArray(obj.bausteine)) {
      return { fehler: "keine Textbausteine-Export-Datei" };
    }
    laden();
    var neu = [], vorhanden = [], zurueck = [];
    obj.bausteine.forEach(function (fremd) {
      if (!fremd || !fremd.id) return;
      var eigen = holen(fremd.id);
      if (!eigen) { neu.push(fremd); }
      else if (eigen.geloeschtAm && !fremd.geloeschtAm) { zurueck.push(eigen.id); }
      else { vorhanden.push(eigen.id); }
    });
    return { fehler: null, neu: neu, vorhanden: vorhanden, zurueck: zurueck };
  }
  function importAnwenden(vorschau) {
    laden();
    vorschau.neu.forEach(function (fremd) {
      daten.bausteine.push(fremd); merkeOffen(fremd.id, null); });
    vorschau.zurueck.forEach(function (id) { zurueckholen(id); });
    sichern();
    return { neu: vorschau.neu.length, vorhanden: vorschau.vorhanden.length,
             zurueck: vorschau.zurueck.length };
  }

  return {
    WELT: WELT,
    laden: laden, sichern: sichern, neueKennung: neueKennung,
    geraet: geraet, setzeGeraet: setzeGeraet,
    alle: alle, alleAktiven: alleAktiven, allePapierkorb: allePapierkorb,
    holen: holen, holenPerKuerzel: holenPerKuerzel,
    speichern: speichern, merkeBenutzt: merkeBenutzt,
    inPapierkorb: inPapierkorb, zurueckholen: zurueckholen,
    endgueltigLoeschen: endgueltigLoeschen,
    raeumePapierkorbAuf: raeumePapierkorbAuf,
    fremdEinspielen: fremdEinspielen,
    einstellung: einstellung, setzeEinstellung: setzeEinstellung,
    einstellungZeit: einstellungZeit, fremdEinstellung: fremdEinstellung,
    zaehleBaustein: zaehleBaustein, zaehleFunktion: zaehleFunktion,
    statistik: statistik, statistikZuruecksetzen: statistikZuruecksetzen,
    fremdStatistik: fremdStatistik, setzeFremdStatistik: setzeFremdStatistik,
    offeneBausteine: offeneBausteine, offeneEinstellungen: offeneEinstellungen,
    ausgangsfassung: ausgangsfassung, merkeAlleOffen: merkeAlleOffen,
    statistikOffen: statistikOffen, istOffen: istOffen, erledigt: erledigt,
    offenAnzahl: offenAnzahl,
    abgleichStand: abgleichStand, setzeAbgleichStand: setzeAbgleichStand,
    konflikte: konflikte, merkeKonflikt: merkeKonflikt, loeseKonflikt: loeseKonflikt,
    exportObjekt: exportObjekt, exportDateiname: exportDateiname,
    importVorschau: importVorschau, importAnwenden: importAnwenden
  };
})();
