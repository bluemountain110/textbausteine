// Datei: abgleich.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Der Abgleich zwischen diesem Gerät und der Datenablage.
//        Ablauf immer gleich: zuerst holen, was anderswo geändert wurde,
//        dann schicken, was hier geändert wurde. Die App wartet nie auf
//        das Netz — sie arbeitet aus dem Gerätespeicher und gleicht im
//        Hintergrund ab.
//        Regel bei zwei Änderungen am selben Baustein: NICHTS wird still
//        überschrieben. Beide Fassungen bleiben liegen, und Näd wählt.
//        GRUNDSATZ: Hier gehen NIE Patientendaten durch.

"use strict";
window.TB = window.TB || {};

TB.abgleich = (function () {
  var S = function () { return TB.speicher; };

  var laeuft = false;
  var letzterFehler = null;
  var veraendert = 0;   // wie viele Bausteine ein Durchgang geändert hat
  var horcher = [];
  var wecker = null;

  function melden() {
    horcher.forEach(function (f) { try { f(zustand()); } catch (e) { } });
  }
  function beiAenderung(f) { horcher.push(f); }

  function zustand() {
    var st = S().abgleichStand();
    return {
      laeuft: laeuft,
      veraendert: veraendert,
      zuletzt: st.zuletzt,
      fehler: letzterFehler,
      offen: S().offenAnzahl(),
      konflikte: S().konflikte().length,
      angemeldet: TB.wolke.angemeldet(),
      eingerichtet: TB.wolke.eingerichtet()
    };
  }

  // ---- Übersetzung zwischen App und Datenablage ----------------------
  // Links die Schreibweise der App, rechts die der Datenbank.
  var PAARE = [
    ["id", "id"], ["titel", "titel"], ["kuerzel", "kuerzel"],
    ["kategorie", "kategorie"], ["text", "text"], ["notiz", "notiz"],
    ["varianten", "varianten"], ["sortierung", "sortierung"],
    ["art", "art"], ["entwurf", "entwurf"], ["ausgabeart", "ausgabeart"],
    ["zuletztBenutztAm", "zuletzt_benutzt_am"],
    ["erstelltAm", "erstellt_am"], ["aktualisiertAm", "aktualisiert_am"],
    ["geloeschtAm", "geloescht_am"]
  ];

  function nachAblage(b, benutzer) {
    var z = { benutzer: benutzer };
    PAARE.forEach(function (p) {
      var w = b[p[0]];
      z[p[1]] = (w === undefined) ? null : w;
    });
    if (!z.art) z.art = "text";
    if (z.entwurf === null) z.entwurf = false;
    if (!z.ausgabeart) z.ausgabeart = "fenster";
    return z;
  }
  function nachApp(z) {
    var b = {};
    PAARE.forEach(function (p) {
      var w = z[p[1]];
      if (w !== undefined) b[p[0]] = w;
    });
    return b;
  }

  function zeit(wert) {
    var t = Date.parse(wert || "");
    return isNaN(t) ? 0 : t;
  }

  // ---- Teil 1: holen ---------------------------------------------------
  function holeBausteine(seit) {
    var bedingung = "order=aktualisiert_am.asc";
    if (seit) bedingung += "&aktualisiert_am=gt." + encodeURIComponent(seit);
    return TB.wolke.holen("bausteine", bedingung).then(function (a) {
      if (!a.ok) return { ok: false, fehler: a.fehler, neuste: null };
      var neuste = null;
      a.zeilen.forEach(function (z) {
        var fremd = nachApp(z);
        if (!fremd.id) return;
        if (!neuste || zeit(fremd.aktualisiertAm) > zeit(neuste)) {
          neuste = fremd.aktualisiertAm;
        }
        var eigen = S().holen(fremd.id);
        if (!eigen) { S().fremdEinspielen(fremd); veraendert++; return; }
        if (zeit(fremd.aktualisiertAm) === zeit(eigen.aktualisiertAm)) return;
        if (!S().istOffen(fremd.id)) {
          // Hier wurde seit dem letzten Abgleich nichts geändert:
          // die neuere Fassung gewinnt.
          if (zeit(fremd.aktualisiertAm) > zeit(eigen.aktualisiertAm)) {
            S().fremdEinspielen(fremd);
            veraendert++;
          }
          return;
        }
        // Hier wartet eine eigene Änderung. Entspricht die Zeile aus der
        // Ablage genau der Ausgangsfassung, ist es die eigene alte
        // Fassung — kein Konflikt, sondern der erwartete Widerhall.
        if (zeit(fremd.aktualisiertAm) === zeit(S().ausgangsfassung(fremd.id))) return;
        // Beide Seiten geändert: liegen lassen und fragen.
        veraendert++;
        S().merkeKonflikt({
          id: fremd.id,
          eigen: JSON.parse(JSON.stringify(eigen)),
          fremd: fremd,
          bemerkt: new Date().toISOString()
        });
      });
      return { ok: true, fehler: null, neuste: neuste };
    });
  }

  function holeEinstellungen(seit) {
    var bedingung = "order=aktualisiert_am.asc";
    if (seit) bedingung += "&aktualisiert_am=gt." + encodeURIComponent(seit);
    return TB.wolke.holen("einstellungen", bedingung).then(function (a) {
      if (!a.ok) return { ok: false, fehler: a.fehler };
      a.zeilen.forEach(function (z) {
        var eigenZeit = S().einstellungZeit(z.schluessel);
        if (zeit(z.aktualisiert_am) > zeit(eigenZeit)) {
          S().fremdEinstellung(z.schluessel, z.wert, z.aktualisiert_am);
          veraendert++;
        }
      });
      return { ok: true, fehler: null };
    });
  }

  function holeStatistik() {
    return TB.wolke.holen("statistik", "limit=2000").then(function (a) {
      if (!a.ok) return { ok: false, fehler: a.fehler };
      var meines = S().geraet();
      S().setzeFremdStatistik(a.zeilen.filter(function (z) {
        return z.geraet !== meines; }));
      return { ok: true, fehler: null };
    });
  }

  // ---- Teil 2: schicken -------------------------------------------------
  function schickeBausteine(benutzer) {
    var offene = S().offeneBausteine();
    var strittig = S().konflikte().map(function (k) { return k.id; });
    var ids = offene.filter(function (id) { return strittig.indexOf(id) === -1; });
    var zeilen = [];
    ids.forEach(function (id) {
      var b = S().holen(id);
      if (b) zeilen.push(nachAblage(b, benutzer));
    });
    if (!zeilen.length) return Promise.resolve({ ok: true, fehler: null, neuste: null });
    return TB.wolke.schreiben("bausteine", zeilen, "id").then(function (a) {
      if (!a.ok) return { ok: false, fehler: a.fehler, neuste: null };
      S().erledigt("bausteine", ids);
      var neuste = null;
      zeilen.forEach(function (z) {
        if (!neuste || zeit(z.aktualisiert_am) > zeit(neuste)) neuste = z.aktualisiert_am;
      });
      return { ok: true, fehler: null, neuste: neuste };
    });
  }

  function schickeEinstellungen(benutzer) {
    var namen = S().offeneEinstellungen();
    if (!namen.length) return Promise.resolve({ ok: true, fehler: null });
    var zeilen = namen.map(function (n) {
      return { benutzer: benutzer, schluessel: n,
               wert: S().einstellung(n, null),
               aktualisiert_am: S().einstellungZeit(n) || new Date().toISOString() };
    });
    return TB.wolke.schreiben("einstellungen", zeilen, "benutzer,schluessel")
      .then(function (a) {
        if (!a.ok) return { ok: false, fehler: a.fehler };
        S().erledigt("einstellungen", namen);
        return { ok: true, fehler: null };
      });
  }

  function schickeStatistik(benutzer) {
    if (!S().statistikOffen()) return Promise.resolve({ ok: true, fehler: null });
    var st = S().statistik();
    var g = S().geraet();
    var zeilen = [];
    Object.keys(st.bausteine).forEach(function (id) {
      zeilen.push({ benutzer: benutzer, geraet: g, art: "baustein", schluessel: id,
                    anzahl: st.bausteine[id].anzahl, zuletzt: st.bausteine[id].zuletzt });
    });
    Object.keys(st.funktionen).forEach(function (name) {
      zeilen.push({ benutzer: benutzer, geraet: g, art: "funktion", schluessel: name,
                    anzahl: st.funktionen[name].anzahl, zuletzt: st.funktionen[name].zuletzt });
    });
    if (!zeilen.length) { S().erledigt("statistik"); return Promise.resolve({ ok: true }); }
    return TB.wolke.schreiben("statistik", zeilen, "benutzer,geraet,art,schluessel")
      .then(function (a) {
        if (!a.ok) return { ok: false, fehler: a.fehler };
        S().erledigt("statistik");
        return { ok: true, fehler: null };
      });
  }

  // ---- Der ganze Durchgang ----------------------------------------------
  function jetzt() {
    if (laeuft) return Promise.resolve({ ok: false, fehler: null });
    if (!TB.wolke.eingerichtet()) {
      return Promise.resolve({ ok: false, fehler: TB.T.abgleichNichtEingerichtet });
    }
    if (!TB.wolke.angemeldet()) {
      return Promise.resolve({ ok: false, fehler: TB.T.abgleichNichtAngemeldet });
    }
    laeuft = true; letzterFehler = null; veraendert = 0; melden();

    var benutzer = TB.wolke.benutzerKennung();
    var seit = S().abgleichStand().zuletzt;
    var neuste = seit;
    function merkeNeuste(w) {
      if (w && (!neuste || zeit(w) > zeit(neuste))) neuste = w;
    }

    return holeBausteine(seit)
      .then(function (a) {
        if (!a.ok) throw a.fehler;
        merkeNeuste(a.neuste);
        return holeEinstellungen(seit);
      })
      .then(function (a) { if (!a.ok) throw a.fehler; return schickeBausteine(benutzer); })
      .then(function (a) {
        if (!a.ok) throw a.fehler;
        merkeNeuste(a.neuste);
        return schickeEinstellungen(benutzer);
      })
      .then(function (a) { if (!a.ok) throw a.fehler; return schickeStatistik(benutzer); })
      .then(function (a) { if (!a.ok) throw a.fehler; return holeStatistik(); })
      .then(function (a) {
        if (!a.ok) throw a.fehler;
        // Fünf Minuten Sicherheitsabstand, falls zwei Geräte die Uhr
        // leicht verschieden stellen. Doppelt Geholtes schadet nicht.
        if (neuste) {
          var t = zeit(neuste) - 5 * 60 * 1000;
          S().setzeAbgleichStand("zuletzt", new Date(t).toISOString());
        }
        S().setzeAbgleichStand("stand", new Date().toISOString());
        laeuft = false; letzterFehler = null; melden();
        return { ok: true, fehler: null };
      })
      .catch(function (f) {
        laeuft = false;
        letzterFehler = (typeof f === "string") ? f : TB.T.wolkeFehlerAllgemein;
        melden();
        return { ok: false, fehler: letzterFehler };
      });
  }

  // Nach jeder Änderung anstossen, aber gebündelt: wer zehn Bausteine
  // hintereinander ändert, löst nicht zehn Abgleiche aus.
  function anstossen(verzoegerung) {
    clearTimeout(wecker);
    wecker = setTimeout(function () { jetzt(); }, verzoegerung || 2500);
    melden();
  }

  // Wurde hier noch nie abgeglichen und liegen schon Bausteine? Dann
  // fragt die Oberfläche vorher nach — stilles Hochladen gibt es nicht.
  function erstmalig() {
    return !S().abgleichStand().zuletzt && S().alle().length > 0;
  }

  // Konflikt auflösen: "eigen", "fremd" oder "beide".
  function loese(id, wahl) {
    var k = S().konflikte().find(function (x) { return x.id === id; });
    if (!k) return;
    if (wahl === "fremd") {
      S().erledigt("bausteine", [id]);
      S().fremdEinspielen(k.fremd);
    } else if (wahl === "beide") {
      S().erledigt("bausteine", [id]);
      S().fremdEinspielen(k.fremd);
      var kopie = JSON.parse(JSON.stringify(k.eigen));
      kopie.id = S().neueKennung();
      kopie.titel = (kopie.titel || "") + TB.T.konfliktZusatz;
      kopie.kuerzel = "";
      S().speichern(kopie);
    } else {
      // "eigen": die eigene Fassung bekommt einen frischen Zeitstempel.
      // Sonst wäre sie älter als die fremde und das ANDERE Gerät würde
      // sie nicht übernehmen — der Konflikt käme dort nie an.
      S().erledigt("bausteine", [id]);
      S().speichern({ id: id });
    }
    S().loeseKonflikt(id);
    anstossen(300);
  }

  // Alle Spaltennamen, die die App in die Tabelle bausteine schreibt.
  function spaltenNamen() {
    return PAARE.map(function (p) { return p[1]; }).concat(["benutzer"]);
  }

  return { zustand: zustand, beiAenderung: beiAenderung, jetzt: jetzt,
           spaltenNamen: spaltenNamen,
           anstossen: anstossen, erstmalig: erstmalig, loese: loese,
           nachAblage: nachAblage, nachApp: nachApp };
})();
