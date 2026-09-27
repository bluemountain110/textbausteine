// Datei: ansicht-status.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die Status-Ansicht zum Ausfüllen: Status-Knöpfe (Teilmengen,
//        kombinierbar), Ankreuzen einzelner Untersuchungen, Befund
//        durch Anklicken überschreiben (wird fett in Dunkelgrau),
//        Live-Vorschau, Tardoc-Ampeln und Kopieren. Häufige
//        Untersuchungen stehen offen, seltene hinter „Weitere“.
//        NICHTS aus dieser Ansicht wird gespeichert — beim Verlassen
//        oder Zurücksetzen ist der Patientenbefund weg (Grundsatz 1).
//        Nur „Auswahl als eigenen Status speichern“ legt das blosse
//        Ankreuz-Muster als Teilmenge ab.

"use strict";
window.TB = window.TB || {};

TB.ansichtStatus = (function () {
  var TS = function () { return TB.statusTexte; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };
  var melde = function (t, w) { TB.ui.melde(t, w); };

  // Sitzungszustand — lebt nur im Speicher des Browsers, nie im Lager.
  var aktiveTeilmengen = {};   // teilmengen-id -> true
  var manuellAn = {}, manuellAb = {};   // untersuchungs-id -> true
  var abweichungen = {};       // untersuchungs-id -> überschriebener Befund
  var offeneSelten = {};       // kategorie-id -> true
  var suchbegriff = "";
  var nurGewaehlte = false;   // Schalter „Nur Gewählte" (Sammelrunde 27.9.)
  var bearbeiteId = null;      // Untersuchung, deren Befund gerade offen ist
  var sucheFokus = false;

  function inTeilmenge(id) {
    return TB.status.teilmengen().some(function (t) {
      return aktiveTeilmengen[t.id] && t.punkte.indexOf(id) !== -1; });
  }
  function istGewaehlt(id) {
    if (manuellAn[id]) return true;
    if (manuellAb[id]) return false;
    return inTeilmenge(id);
  }
  function gewaehltAlsMenge(m) {
    var menge = {};
    m.untersuchungen.forEach(function (u) {
      if (istGewaehlt(u.id)) menge[u.id] = true; });
    return menge;
  }
  function schalte(id, an) {
    delete manuellAn[id]; delete manuellAb[id];
    if (an && !inTeilmenge(id)) manuellAn[id] = true;
    if (!an && inTeilmenge(id)) manuellAb[id] = true;
  }
  function allesLeeren() {
    aktiveTeilmengen = {}; manuellAn = {}; manuellAb = {};
    abweichungen = {}; bearbeiteId = null;
  }
  function passtZurSuche(u) {
    if (!suchbegriff) return true;
    var s = suchbegriff.toLowerCase();
    return (u.name + " " + u.normal).toLowerCase().indexOf(s) !== -1;
  }

  // ---- Zeichnen --------------------------------------------------------
  function zeichne(wurzel) {
    wurzel.textContent = "";
    var m = TB.status.master();
    if (!m) { zeichneLeer(wurzel); return; }

    // Sammelrunde 27.9.: Kopfzeile bis Suchfeld kleben beim Scrollen
    // oben fest, damit Ampeln und Suche immer erreichbar bleiben.
    var klebt = el("div", "status-sticky");
    var kopf = el("div", "status-kopf");
    kopf.appendChild(el("h2", "", TS().statusTitel));
    var pflege = el("button", "", TS().pflegeKnopf);
    pflege.addEventListener("click", function () {
      TB.ansichtStatusPflege.oeffne(); });
    kopf.appendChild(pflege);
    klebt.appendChild(kopf);

    zeichneTeilmengen(klebt);
    zeichneTardoc(klebt, m);

    var suchzeile = el("div", "status-suchzeile");
    var suche = el("input", "status-suche");
    suche.type = "search";
    suche.placeholder = TS().suchePlatzhalter;
    suche.value = suchbegriff;
    suche.addEventListener("input", function () {
      suchbegriff = suche.value.trim();
      sucheFokus = true;
      neu();
    });
    suchzeile.appendChild(suche);
    var nurG = el("button",
      "status-nurgew" + (nurGewaehlte ? " aktiv" : ""),
      TS().nurGewaehlteKnopf);
    nurG.addEventListener("click", function () {
      nurGewaehlte = !nurGewaehlte; neu(); });
    suchzeile.appendChild(nurG);
    klebt.appendChild(suchzeile);
    wurzel.appendChild(klebt);

    var flaeche = el("div", "status-flaeche");
    var links = el("div", "status-maske");
    TB.status.jeKategorie(m).forEach(function (block) {
      zeichneKategorie(links, m, block); });
    flaeche.appendChild(links);
    flaeche.appendChild(zeichneRechts(m));
    wurzel.appendChild(flaeche);

    if (sucheFokus) {
      sucheFokus = false;
      suche.focus();
      var wert = suche.value; suche.value = ""; suche.value = wert;
    }
  }

  function zeichneLeer(wurzel) {
    wurzel.appendChild(el("h2", "", TS().statusTitel));
    wurzel.appendChild(el("p", "hinweis-warn", TS().statusLeer));
    var k = el("button", "", TS().grundausstattungKnopf);
    k.addEventListener("click", function () {
      TB.status.grundausstattung(true);
      melde(TS().grundausstattungFertig);
      neu();
    });
    wurzel.appendChild(k);
  }

  function zeichneTeilmengen(wurzel) {
    var liste = TB.status.teilmengen();
    if (!liste.length) return;
    var zeile = el("div", "status-teilmengen");
    zeile.appendChild(el("span", "klein-hinweis", TS().teilmengenTitel));
    liste.forEach(function (t) {
      var k = el("button",
        "status-chip" + (aktiveTeilmengen[t.id] ? " aktiv" : ""), t.name);
      k.addEventListener("click", function () {
        if (aktiveTeilmengen[t.id]) delete aktiveTeilmengen[t.id];
        else aktiveTeilmengen[t.id] = true;
        neu();
      });
      zeile.appendChild(k);
    });
    wurzel.appendChild(zeile);
  }

  function zeichneTardoc(wurzel, m) {
    var stand = TB.status.tardoc(m, gewaehltAlsMenge(m));
    var kasten = el("div", "status-tardoc");
    Object.keys(stand).forEach(function (art) {
      var a = stand[art];
      var zeile = el("div", "status-tardoc-zeile");
      var wort = a.stufe === "A"
        ? TS().tardocPilleA : (a.stufe === "B" ? TS().tardocPilleB
                                               : TS().tardocPilleLeer);
      var pille = el("span", "status-pille" +
        (a.stufe === "A" ? " gut" : (a.stufe === "B" ? " halb" : "")),
        wort.replace("%s", a.name).replace("%s", String(a.erfuellte)));
      zeile.appendChild(pille);
      zeile.appendChild(el("span", "klein-hinweis",
        TB.status.tardocFehltText(a)));
      kasten.appendChild(zeile);
    });
    kasten.appendChild(el("div", "status-tardoc-fuss",
      TS().tardocHinweis.replace("%s", TB.tardocDaten.fassung)));
    wurzel.appendChild(kasten);
  }

  function zeichneKategorie(ziel, m, block) {
    var sichtbar = function (u) {
      if (nurGewaehlte && !istGewaehlt(u.id)) return false;
      return passtZurSuche(u);
    };
    var haeufige = block.untersuchungen.filter(function (u) {
      return u.haeufig && sichtbar(u); });
    var seltene = block.untersuchungen.filter(function (u) {
      return !u.haeufig && sichtbar(u); });
    if (!haeufige.length && !seltene.length) return;

    var kasten = el("section", "status-kategorie");
    kasten.appendChild(el("h3", "", block.kategorie.name));
    haeufige.forEach(function (u) { kasten.appendChild(zeile(u)); });

    if (seltene.length) {
      var offen = !!offeneSelten[block.kategorie.id] || !!suchbegriff ||
                  nurGewaehlte;
      if (offen) {
        seltene.forEach(function (u) {
          var z = zeile(u); z.classList.add("selten");
          kasten.appendChild(z); });
      }
      if (!suchbegriff && !nurGewaehlte) {
        var schalter = el("button", "status-weitere", offen
          ? TS().weitereAuf
          : TS().weitereZu.replace("%s", String(seltene.length)));
        schalter.addEventListener("click", function () {
          if (offen) delete offeneSelten[block.kategorie.id];
          else offeneSelten[block.kategorie.id] = true;
          neu();
        });
        kasten.appendChild(schalter);
      }
    }
    ziel.appendChild(kasten);
  }

  function zeile(u) {
    var z = el("div", "status-zeile");
    var kreuz = el("input");
    kreuz.type = "checkbox";
    kreuz.checked = istGewaehlt(u.id);
    kreuz.addEventListener("change", function () {
      schalte(u.id, kreuz.checked); neu(); });
    z.appendChild(kreuz);

    var inhalt = el("div", "status-zeile-inhalt");
    var name = el("span", "status-name", u.name + ": ");
    name.title = TS().nameKlickHinweis;
    name.addEventListener("click", function () {
      schalte(u.id, !istGewaehlt(u.id)); neu(); });
    inhalt.appendChild(name);

    if (bearbeiteId === u.id) {
      var feld = el("textarea", "status-abweichfeld");
      feld.rows = 2;
      feld.value = (abweichungen[u.id] !== undefined)
        ? abweichungen[u.id] : u.normal;
      function schliesse() {
        var wert = feld.value.trim();
        if (!wert || wert === u.normal.trim()) delete abweichungen[u.id];
        else { abweichungen[u.id] = wert; schalte(u.id, true); }
        bearbeiteId = null; neu();
      }
      feld.addEventListener("blur", schliesse);
      feld.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape") { bearbeiteId = null; neu(); }
        if (ev.key === "Enter" && !ev.shiftKey) {
          ev.preventDefault(); feld.blur(); }
      });
      inhalt.appendChild(feld);
      setTimeout(function () { feld.focus(); feld.select(); }, 0);
    } else {
      var abweichend = abweichungen[u.id] !== undefined;
      var text = el("span",
        "status-befund" + (abweichend ? " abweichend" : ""),
        abweichend ? abweichungen[u.id] : u.normal);
      text.title = TS().befundKlickHinweis;
      text.addEventListener("click", function () {
        bearbeiteId = u.id; neu(); });
      inhalt.appendChild(text);
      if (abweichend) {
        var zurueck = el("button", "status-zurueck", "↺");
        zurueck.title = TS().abweichungZurueck;
        zurueck.addEventListener("click", function () {
          delete abweichungen[u.id]; neu(); });
        inhalt.appendChild(zurueck);
      }
    }
    z.appendChild(inhalt);
    return z;
  }

  function zeichneRechts(m) {
    var rechts = el("div", "status-rechts");
    var menge = gewaehltAlsMenge(m);
    var anzahl = Object.keys(menge).length;
    var ueberschrieben = Object.keys(abweichungen).filter(function (id) {
      return menge[id]; }).length;

    var knoepfe = el("div", "status-knoepfe");
    var kopieren = el("button", "status-kopieren", TS().kopierenKnopf);
    kopieren.addEventListener("click", function () {
      if (!anzahl) { melde(TS().nichtsGewaehlt, true); return; }
      var f = TB.status.fliesstext(m, menge, abweichungen);
      TB.ui.kopiereFassungen(f.html, f.text, function (ok, wie) {
        if (!ok) { melde(TS().kopierenFehl, true); return; }
        TB.speicher.zaehleFunktion("statusKopiert");
        melde(wie === "alle Fassungen"
          ? TS().kopiertMeldung : TS().kopiertNurText);
      });
    });
    knoepfe.appendChild(kopieren);

    var leeren = el("button", "", TS().zuruecksetzenKnopf);
    leeren.addEventListener("click", function () {
      allesLeeren(); melde(TS().zurueckgesetzt); neu(); });
    knoepfe.appendChild(leeren);

    var speichern = el("button", "", TS().alsStatusKnopf);
    speichern.addEventListener("click", function () {
      if (!anzahl) { melde(TS().nichtsGewaehlt, true); return; }
      var name = prompt(TS().alsStatusFrage, "");
      if (!name || !name.trim()) return;
      name = name.trim();
      var gibtEs = TB.status.teilmengen().some(function (t) {
        return t.name.toLowerCase() === name.toLowerCase(); });
      if (gibtEs &&
          !confirm(TS().alsStatusErsetzen.replace("%s", name))) return;
      var punkte = m.untersuchungen.filter(function (u) {
        return menge[u.id]; }).map(function (u) { return u.id; });
      TB.status.teilmengeSpeichern(name, punkte);
      melde(TS().alsStatusFertig.replace("%s", name));
      neu();
    });
    knoepfe.appendChild(speichern);
    rechts.appendChild(knoepfe);

    rechts.appendChild(el("div", "sammel-zaehler",
      TS().zaehlerZeile.replace("%s", String(anzahl))
        .replace("%s", String(ueberschrieben))));

    var vorschau = el("div", "vorschau-kasten status-vorschau");
    vorschau.appendChild(el("h3", "", TS().vorschauTitel));
    var inhalt = el("div", "status-vorschau-inhalt");
    if (!anzahl) {
      inhalt.appendChild(el("p", "klein-hinweis", TS().vorschauLeer));
    } else {
      var f = TB.status.fliesstext(m, menge, abweichungen);
      inhalt.innerHTML = f.html;   // eigener, geschützter HTML-Aufbau
    }
    vorschau.appendChild(inhalt);
    rechts.appendChild(vorschau);
    return rechts;
  }

  function neu() {
    var wurzel = document.getElementById("inhalt");
    zeichne(wurzel);
  }

  return { zeichne: zeichne };
})();
