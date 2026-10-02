// Datei: ansicht-eeg.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die EEG-Ansicht zum Ausfüllen: Vorlagen-Knöpfe (Normal, IPS,
//        eigene), Ankreuzen einzelner Punkte, Auswahlen und Felder
//        direkt im Satz, Überschreiben durch Anklicken (nur der
//        veränderte Teil fett in Dunkelgrau), Zusätze mit ☆, zwei
//        Live-Vorschauen (Befund und Beurteilung) und drei
//        Kopier-Knöpfe. Häufige Punkte stehen offen, seltene hinter
//        „Weitere". NICHTS aus dieser Ansicht wird gespeichert — beim
//        Verlassen oder Zurücksetzen ist der Patientenbefund weg
//        (Grundsatz 1). Nur „Als eigene Vorlage speichern" legt
//        Ankreuz-Muster und Auswahl-Vorwahlen ab, nie Feld-Werte.

"use strict";
window.TB = window.TB || {};

TB.ansichtEeg = (function () {
  var TE = function () { return TB.eegTexte; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };
  var melde = function (t, w) { TB.ui.melde(t, w); };

  // Sitzungszustand — lebt nur im Speicher des Browsers, nie im Lager.
  var aktiveVorlagen = {};     // vorlagen-id -> true
  var manuellAn = {}, manuellAb = {};
  var werte = {};              // punkt-id -> { Label: Wert }
  var abweichungen = {};       // punkt-id -> überschriebener Text
  var angeheftet = {};         // punkt-id -> true (☆)
  var offeneSelten = {};       // kategorie-id -> true
  var suchbegriff = "";
  var nurGewaehlte = false;
  var bearbeiteId = null;
  var sucheFokus = false;

  function inVorlage(id) {
    return TB.eeg.vorlagen().some(function (v) {
      return aktiveVorlagen[v.id] && v.punkte.indexOf(id) !== -1; });
  }
  function istGewaehlt(id) {
    if (manuellAn[id]) return true;
    if (manuellAb[id]) return false;
    return inVorlage(id);
  }
  function gewaehltAlsMenge(m) {
    var menge = {};
    m.punkte.forEach(function (p) {
      if (istGewaehlt(p.id)) menge[p.id] = true; });
    return menge;
  }
  function schalte(id, an) {
    delete manuellAn[id]; delete manuellAb[id];
    if (an && !inVorlage(id)) manuellAn[id] = true;
    if (!an && inVorlage(id)) manuellAb[id] = true;
  }
  function allesLeeren() {
    aktiveVorlagen = {}; manuellAn = {}; manuellAb = {};
    werte = {}; abweichungen = {}; angeheftet = {};
    bearbeiteId = null;
  }
  function passtZurSuche(p) {
    if (!suchbegriff) return true;
    return p.text.toLowerCase().indexOf(suchbegriff.toLowerCase()) !== -1;
  }

  // ---- Zeichnen --------------------------------------------------------
  function zeichne(wurzel) {
    wurzel.textContent = "";
    var m = TB.eeg.master();
    if (!m) { zeichneLeer(wurzel); return; }

    var klebt = el("div", "status-sticky");
    var kopf = el("div", "status-kopf");
    kopf.appendChild(el("h2", "", TE().eegTitel));
    var pflege = el("button", "", TE().pflegeKnopf);
    pflege.addEventListener("click", function () {
      TB.ansichtEegPflege.oeffne(); });
    kopf.appendChild(pflege);
    klebt.appendChild(kopf);

    zeichneVorlagen(klebt);

    var suchzeile = el("div", "status-suchzeile");
    var suche = el("input", "status-suche");
    suche.type = "search";
    suche.placeholder = TE().suchePlatzhalter;
    suche.value = suchbegriff;
    suche.addEventListener("input", function () {
      suchbegriff = suche.value.trim();
      sucheFokus = true;
      neu();
    });
    suchzeile.appendChild(suche);
    var nurG = el("button",
      "status-nurgew" + (nurGewaehlte ? " aktiv" : ""),
      TE().nurGewaehlteKnopf);
    nurG.addEventListener("click", function () {
      nurGewaehlte = !nurGewaehlte; neu(); });
    suchzeile.appendChild(nurG);
    klebt.appendChild(suchzeile);

    var flaeche = el("div", "status-flaeche");
    var linksSpalte = el("div", "status-linksspalte");
    linksSpalte.appendChild(klebt);
    var links = el("div", "status-maske");
    TB.eeg.jeKategorie(m, "befund").forEach(function (block) {
      zeichneKategorie(links, block); });
    links.appendChild(el("h3", "eeg-beurteilung-titel", TE().beurteilungTitel));
    TB.eeg.jeKategorie(m, "beurteilung").forEach(function (block) {
      zeichneKategorie(links, block); });
    linksSpalte.appendChild(links);
    flaeche.appendChild(linksSpalte);
    flaeche.appendChild(zeichneRechts(m));
    wurzel.appendChild(flaeche);
    function messeKopf() {
      var kz = document.querySelector("header");
      var h = kz ? Math.ceil(kz.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty("--kopf-h", h + "px");
    }
    messeKopf();
    if (sucheFokus) {
      sucheFokus = false;
      suche.focus();
      var wert = suche.value; suche.value = ""; suche.value = wert;
    }
  }

  function zeichneLeer(wurzel) {
    wurzel.appendChild(el("h2", "", TE().eegTitel));
    wurzel.appendChild(el("p", "hinweis-warn", TE().eegLeer));
    var k = el("button", "", TE().grundKnopf);
    k.addEventListener("click", function () {
      TB.eeg.grundausstattung(true);
      neu();
    });
    wurzel.appendChild(k);
  }

  function zeichneVorlagen(wurzel) {
    var liste = TB.eeg.vorlagen();
    if (!liste.length) return;
    var zeile = el("div", "status-teilmengen");
    zeile.appendChild(el("span", "klein-hinweis", TE().vorlagenTitel));
    liste.forEach(function (v) {
      var beschriftung = v.name + (v.kuerzel ? " (;;" + v.kuerzel + ")" : "");
      var k = el("button",
        "status-chip" + (aktiveVorlagen[v.id] ? " aktiv" : ""), beschriftung);
      k.addEventListener("click", function () {
        if (aktiveVorlagen[v.id]) {
          delete aktiveVorlagen[v.id];
          (v.zusatz || []).forEach(function (id) {
            var nochAndersWo = liste.some(function (x) {
              return x.id !== v.id && aktiveVorlagen[x.id] &&
                (x.zusatz || []).indexOf(id) !== -1; });
            if (!nochAndersWo) delete angeheftet[id];
          });
        } else {
          aktiveVorlagen[v.id] = true;
          (v.zusatz || []).forEach(function (id) { angeheftet[id] = true; });
          // Auswahl-Vorwahlen der Vorlage anwenden (nie Feld-Werte).
          Object.keys(v.werte || {}).forEach(function (pid) {
            var je = werte[pid] || (werte[pid] = {});
            Object.keys(v.werte[pid]).forEach(function (label) {
              je[label] = v.werte[pid][label]; });
          });
          nurGewaehlte = true;
        }
        neu();
      });
      zeile.appendChild(k);
    });
    wurzel.appendChild(zeile);
  }

  function zeichneKategorie(ziel, block) {
    var sichtbar = function (p) {
      if (nurGewaehlte && !istGewaehlt(p.id) && !angeheftet[p.id]) return false;
      return passtZurSuche(p);
    };
    var vorne = function (p) {
      return p.haeufig || istGewaehlt(p.id) || !!angeheftet[p.id]; };
    var haeufige = block.punkte.filter(function (p) {
      return vorne(p) && sichtbar(p); });
    var seltene = block.punkte.filter(function (p) {
      return !vorne(p) && sichtbar(p); });
    if (!haeufige.length && !seltene.length) return;

    var kasten = el("section", "status-kategorie");
    kasten.appendChild(el("h3", "", block.kategorie.name));
    haeufige.forEach(function (p) { kasten.appendChild(zeile(p)); });
    if (seltene.length) {
      var offen = !!offeneSelten[block.kategorie.id] || !!suchbegriff ||
                  nurGewaehlte;
      if (offen) {
        seltene.forEach(function (p) {
          var z = zeile(p); z.classList.add("selten");
          kasten.appendChild(z); });
      }
      if (!suchbegriff && !nurGewaehlte) {
        var schalter = el("button", "status-weitere", offen
          ? TE().weitereAuf
          : TE().weitereZu.replace("%s", String(seltene.length)));
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

  function zeile(p) {
    var z = el("div", "status-zeile eeg-zeile" +
      (angeheftet[p.id] && !istGewaehlt(p.id) ? " ist-zusatz" : ""));
    var kreuz = el("input");
    kreuz.type = "checkbox";
    kreuz.checked = istGewaehlt(p.id);
    kreuz.addEventListener("change", function () {
      schalte(p.id, kreuz.checked); neu(); });
    z.appendChild(kreuz);

    var inhalt = el("div", "status-zeile-inhalt");
    var soll = TB.eeg.aufgeloest(p, werte);
    if (bearbeiteId === p.id) {
      var feld = el("textarea", "status-abweichfeld");
      feld.rows = 2;
      feld.value = (abweichungen[p.id] !== undefined)
        ? abweichungen[p.id] : soll;
      function wachse() {
        feld.style.height = "auto";
        feld.style.height = (feld.scrollHeight + 4) + "px";
      }
      feld.addEventListener("input", wachse);
      setTimeout(wachse, 0);
      function schliesse() {
        var wert = feld.value.trim();
        if (!wert || wert === soll.trim()) delete abweichungen[p.id];
        else { abweichungen[p.id] = wert; schalte(p.id, true); }
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
    } else if (abweichungen[p.id] !== undefined) {
      var text = el("span", "status-befund");
      var d = TB.eeg.wortUnterschied(soll, abweichungen[p.id]);
      text.appendChild(document.createTextNode(d.vor));
      text.appendChild(el("b", "abweichend-teil", d.mitte));
      text.appendChild(document.createTextNode(d.nach));
      text.title = TE().befundKlickHinweis;
      text.addEventListener("click", function () {
        bearbeiteId = p.id; neu(); });
      inhalt.appendChild(text);
      var zurueck = el("button", "status-zurueck", "↺");
      zurueck.title = TE().abweichungZurueck;
      zurueck.addEventListener("click", function () {
        delete abweichungen[p.id]; neu(); });
      inhalt.appendChild(zurueck);
    } else {
      // Stücke: feste Texte anklickbar (öffnet Überschreiben),
      // Auswahlen als Listen, Felder als Eingaben — direkt im Satz.
      var huelle = el("span", "eeg-stuecke");
      TB.eeg.zerlege(p.text).forEach(function (s) {
        if (s.art === "text") {
          var st = el("span", "status-befund", s.wert);
          st.title = TE().befundKlickHinweis;
          st.addEventListener("click", function () {
            bearbeiteId = p.id; neu(); });
          huelle.appendChild(st);
        } else if (s.art === "auswahl") {
          var ddl = el("select", "eeg-auswahl");
          s.optionen.forEach(function (o) {
            var opt = el("option", "", o === "" ? "—" : o);
            opt.value = o;
            ddl.appendChild(opt);
          });
          ddl.value = TB.eeg.wertVon(s, werte, p.id);
          ddl.title = s.label;
          ddl.addEventListener("change", function () {
            var je = werte[p.id] || (werte[p.id] = {});
            je[s.label] = ddl.value;
            schalte(p.id, true);
            neu();
          });
          huelle.appendChild(ddl);
        } else {
          var ein = el("input", "eeg-feld");
          ein.type = "text";
          ein.value = TB.eeg.wertVon(s, werte, p.id);
          ein.placeholder = s.label;
          ein.title = s.label;
          ein.addEventListener("change", function () {
            var je = werte[p.id] || (werte[p.id] = {});
            je[s.label] = ein.value;
            schalte(p.id, true);
            neu();
          });
          huelle.appendChild(ein);
        }
      });
      inhalt.appendChild(huelle);
    }
    z.appendChild(inhalt);

    var stern = el("button", "status-zusatz" + (angeheftet[p.id] ? " an" : ""),
      angeheftet[p.id] ? "\u2605" : "\u2606");
    stern.title = angeheftet[p.id] ? TE().zusatzAn : TE().zusatzAus;
    stern.addEventListener("click", function () {
      if (angeheftet[p.id]) delete angeheftet[p.id];
      else angeheftet[p.id] = true;
      neu();
    });
    z.appendChild(stern);
    return z;
  }

  function kopierKnopf(beschriftung, nimm) {
    var k = el("button", "status-kopieren", beschriftung);
    k.addEventListener("click", function () {
      var m = TB.eeg.master();
      var menge = gewaehltAlsMenge(m);
      if (!Object.keys(menge).length) {
        melde(TE().nichtsGewaehlt, true); return; }
      var f = TB.eeg.fliesstext(m, menge, werte, abweichungen);
      var teil = nimm(f);
      TB.ui.kopiereFassungen(teil.html, teil.text, function (ok, wie) {
        if (!ok) { melde(TE().kopierenFehl, true); return; }
        TB.speicher.zaehleFunktion("eegKopiert");
        melde(wie === "alle Fassungen"
          ? TE().kopiertMeldung : TE().kopiertNurText);
      });
    });
    return k;
  }

  function zeichneRechts(m) {
    var rechts = el("div", "status-rechts");
    var menge = gewaehltAlsMenge(m);
    var anzahl = Object.keys(menge).length;
    var ueberschrieben = Object.keys(abweichungen).filter(function (id) {
      return menge[id]; }).length;

    var knoepfe = el("div", "status-knoepfe");
    knoepfe.appendChild(kopierKnopf(TE().kopierenBefund,
      function (f) { return f.befund; }));
    knoepfe.appendChild(kopierKnopf(TE().kopierenBeurteilung,
      function (f) { return f.beurteilung; }));
    knoepfe.appendChild(kopierKnopf(TE().kopierenBeides,
      function (f) { return TB.eeg.block(f); }));

    var leeren = el("button", "", TE().zuruecksetzenKnopf);
    leeren.addEventListener("click", function () {
      allesLeeren(); melde(TE().zurueckgesetzt); neu(); });
    knoepfe.appendChild(leeren);

    var speichern = el("button", "", TE().alsVorlageKnopf);
    speichern.addEventListener("click", function () {
      if (!anzahl) { melde(TE().nichtsGewaehlt, true); return; }
      var name = prompt(TE().vorlageNameFrage, "");
      if (!name || !name.trim()) return;
      name = name.trim();
      var alt = TB.eeg.vorlagen().find(function (v) {
        return v.name.toLowerCase() === name.toLowerCase(); });
      if (alt && !confirm(TE().vorlageErsetzen.replace("%s", name))) return;
      var kuerzel = prompt(TE().vorlageKuerzelFrage,
        alt ? (alt.kuerzel || "") : "");
      if (kuerzel === null) return;
      kuerzel = kuerzel.trim().toLowerCase();
      if (kuerzel && TB.speicher.holenPerKuerzel &&
          TB.speicher.holenPerKuerzel(kuerzel)) {
        melde(TE().vorlageKuerzelBelegt.replace("%s", kuerzel), true);
      }
      var punkte = m.punkte.filter(function (p) {
        return menge[p.id]; }).map(function (p) { return p.id; });
      var zusatz = m.punkte.filter(function (p) {
        return angeheftet[p.id] && !menge[p.id]; }).map(function (p) {
          return p.id; });
      // Nur Auswahl-Werte sichern — nie Feld-Werte (Grundsatz 1).
      var w = {};
      m.punkte.forEach(function (p) {
        if (!menge[p.id] && zusatz.indexOf(p.id) === -1) return;
        var je = werte[p.id]; if (!je) return;
        var behalten = {};
        TB.eeg.zerlege(p.text).forEach(function (s) {
          if (s.art === "auswahl" && je[s.label] !== undefined &&
              je[s.label] !== s.optionen[0]) behalten[s.label] = je[s.label];
        });
        if (Object.keys(behalten).length) w[p.id] = behalten;
      });
      TB.eeg.vorlageSpeichern(name, kuerzel, punkte, zusatz, w);
      melde(TE().vorlageFertig.replace("%s", name));
      neu();
    });
    knoepfe.appendChild(speichern);
    rechts.appendChild(knoepfe);

    rechts.appendChild(el("div", "sammel-zaehler",
      TE().zaehlerZeile.replace("%s", String(anzahl))
        .replace("%s", String(ueberschrieben))));

    var f = anzahl ? TB.eeg.fliesstext(m, menge, werte, abweichungen) : null;
    [[TE().befundTitel, f && f.befund], [TE().beurteilungTitel, f && f.beurteilung]]
      .forEach(function (paar) {
        var vorschau = el("div", "vorschau-kasten status-vorschau");
        vorschau.appendChild(el("h3", "", paar[0]));
        var inhalt = el("div", "status-vorschau-inhalt");
        if (!paar[1] || !paar[1].html) {
          inhalt.appendChild(el("p", "klein-hinweis", TE().vorschauLeer));
        } else {
          inhalt.innerHTML = paar[1].html;   // eigener, geschützter Aufbau
        }
        vorschau.appendChild(inhalt);
        rechts.appendChild(vorschau);
      });
    return rechts;
  }

  function neu() {
    var wurzel = document.getElementById("inhalt");
    zeichne(wurzel);
  }

  return { zeichne: zeichne };
})();
