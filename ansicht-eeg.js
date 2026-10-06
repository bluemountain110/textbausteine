// Datei: ansicht-eeg.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die EEG-Ansicht als SCHNELL-BEFUND (Umbau 16.1): Die
//        häufigen Kategorien stehen offen und vorausgefüllt, Seltenes
//        (Vor-EEG, Anfallsmuster, ACNS-Muster, Salzburg, Normvarianten,
//        Knochenlücke, Ereignisse …) ist eingeklappt und erscheint nur
//        auf Aufklappen. Verlangsamungsherde und Entladungen sind
//        Zeilen: Häufigkeit · Band/Form · bis 4 Lokalisations-Kästchen
//        als Kette (frontal+temporal → fronto-temporal; auch
//        generalisiert und hemisphärisch) · Ausbreitung · Seite, dazu
//        „+ Herd"/„+ Entladung" für weitere Zeilen. Die BEURTEILUNG
//        entsteht automatisch aus dem Befund (Regeln in
//        eeg-grundlage.js) und lässt sich Satz für Satz überschreiben
//        — Überschriebenes wird NICHT hervorgehoben. NICHTS aus dieser
//        Ansicht wird gespeichert; nur „Als eigene Vorlage speichern"
//        legt Ankreuz-Muster, Auswahl-Vorwahlen und Zeilen-Muster ab,
//        nie Feld-Werte (Grundsatz 1). 16.2: Der Normalbefund ist beim
//        Öffnen VORANGEWÄHLT (nichts anklicken, nur die Frequenz
//        tippen), Ableitung und Vigilanz sind Dreiknopf-Zeilen
//        (Standard/Notfall/IPS bzw. wach→schläfrig/wach/schläfrig),
//        die Artefakte drei Kästchen ohne Mengenangabe, und zwei
//        Herd- sowie eine Entladungs-Zeile stehen vorbereitet da —
//        sie zählen erst, sobald sie angefasst werden.

"use strict";
window.TB = window.TB || {};

TB.ansichtEeg = (function () {
  var TE = function () { return TB.eegTexte; };
  var R = function () { return TB.eegGrundlage.REGELN; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };
  var melde = function (t, w) { TB.ui.melde(t, w); };

  // Sitzungszustand — lebt nur im Speicher des Browsers, nie im Lager.
  var aktiveVorlagen = {};     // vorlagen-id -> true
  var manuellAn = {}, manuellAb = {};
  var fensterModus = false;    // URL-Fenster: schlanke Ansicht
  function setzeFensterModus(w) { fensterModus = !!w; }
  var werte = {};              // punkt-id -> { Label: Wert }
  var abweichungen = {};       // punkt-/auto-/zeilen-id -> überschrieben
  var angeheftet = {};         // punkt-id -> true (☆)
  var zeilen = { herde: [], entladungen: [], transienten: [], medis: [] };
  var initialisiert = false;   // einmalige Voranwahl beim Öffnen
  var offeneSelten = {};       // kategorie-id -> true (Punkt-Ebene)
  var offeneKat = {};          // kategorie-id -> true (eingeklappte Kat.)
  var suchbegriff = "";
  var nurGewaehlte = false;
  var bearbeiteId = null;      // punkt-id ODER auto_/z_-Kennung
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
  // „keine."-Kopplung: Zeilen ersetzen den keine.-Punkt und bringen
  // ihn zurück, sobald die letzte Zeile weg ist.
  function koppleAnamnese() {
    var aktiv = zeilen.medis.some(function (z) { return z.aktiv; });
    schalte("ana_med", aktiv);
  }
  function koppleKeine() {
    // Transienten sind KEINE Herde: sie ersetzen nur die Befundzeile
    // "keine.", die Beurteilung behält "Keine Verlangsamungsherde."
    var a = aktiveZeilen();
    schalte("vl_keine", a.herde.length === 0);
    schalte("ent_keine", a.entladungen.length === 0);
  }
  function aktiveZeilen() {
    var nurAktive = function (z) { return z.aktiv; };
    return { herde: zeilen.herde.filter(nurAktive),
             entladungen: zeilen.entladungen.filter(nurAktive),
             transienten: zeilen.transienten.filter(nurAktive),
             medis: zeilen.medis.filter(nurAktive) };
  }
  function bereiteZeilenVor() {
    zeilen = { herde: [], entladungen: [], transienten: [], medis: [] };
    var i;
    for (i = 0; i < R().herdeVorbereitet; i++)
      zeilen.herde.push(neueZeile("herde"));
    for (i = 0; i < R().entladungenVorbereitet; i++)
      zeilen.entladungen.push(neueZeile("entladungen"));
    for (i = 0; i < R().medisVorbereitet; i++)
      zeilen.medis.push(neueZeile("medis"));
  }
  function initZustand() {
    aktiveVorlagen = {}; manuellAn = {}; manuellAb = {};
    werte = {}; abweichungen = {}; angeheftet = {};
    bearbeiteId = null;
    bereiteZeilenVor();
    // Der Normalbefund ist immer vorangewählt (Näd 2.10.): nichts
    // anklicken müssen, nur die Frequenz tippen.
    var normal = TB.eeg.vorlagen().find(function (v) {
      return v.id === "v_eeg" ||
        String(v.kuerzel || "").toLowerCase() === "eeg"; });
    if (normal) vorlageAktivieren(normal, true);
  }
  function allesLeeren() { initZustand(); }
  function passtZurSuche(p) {
    if (!suchbegriff) return true;
    return p.text.toLowerCase().indexOf(suchbegriff.toLowerCase()) !== -1;
  }
  function neueZeile(art) {
    if (art === "herde") {
      var hv = R().herdVorwahl;
      return { aktiv: false, haeufigkeit: hv.haeufigkeit, band: hv.band,
               lok: hv.lok.slice(), ausbreitung: hv.ausbreitung,
               seite: hv.seite };
    }
    if (art === "medis") {
      return { aktiv: false, name: R().antikonvulsiva[0], dosis: "" };
    }
    if (art === "transienten") {
      return { aktiv: false, haeufigkeit: R().transHaeufigkeiten[0],
               lok: ["temporal", "", "", ""], ausbreitung: "", seite: "",
               eingelagert: false };
    }
    var ev = R().entVorwahl;
    return { aktiv: false, haeufigkeit: ev.haeufigkeit,
             form: R().entFormen[0], lok: ev.lok.slice(),
             ausbreitung: ev.ausbreitung, seite: ev.seite };
  }

  // ---- Zeichnen --------------------------------------------------------
  function zeichne(wurzel) {
    wurzel.textContent = "";
    var m = TB.eeg.master();
    if (!m) { zeichneLeer(wurzel); return; }
    if (!initialisiert) { initialisiert = true; initZustand(); }

    var klebt = el("div", "status-sticky");
    var kopf = el("div", "status-kopf");
    kopf.appendChild(el("h2", "", TE().eegTitel));
    if (!fensterModus) {
      var pflege = el("button", "", TE().pflegeKnopf);
      pflege.addEventListener("click", function () {
        TB.ansichtEegPflege.oeffne(); });
      kopf.appendChild(pflege);
    }
    klebt.appendChild(kopf);

    if (!fensterModus) zeichneVorlagen(klebt);

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
    TB.eeg.jeKategorie(m, "indikation").forEach(function (block) {
      zeichneKategorie(links, block); });
    TB.eeg.jeKategorie(m, "anamnese").forEach(function (block) {
      zeichneKategorie(links, block); });
    var schnelle = [], seltene = [];
    TB.eeg.jeKategorie(m, "befund").forEach(function (block) {
      (block.kategorie.schnell ? schnelle : seltene).push(block); });
    schnelle.forEach(function (block) { zeichneKategorie(links, block); });
    if (seltene.length) {
      links.appendChild(el("h3", "eeg-selten-titel", TE().seltenTitel));
      seltene.forEach(function (block) {
        zeichneEingeklappt(links, block); });
    }
    links.appendChild(el("h3", "eeg-beurteilung-titel", TE().beurteilungTitel));
    zeichneAutoBeurteilung(links, m);
    TB.eeg.jeKategorie(m, "beurteilung").forEach(function (block) {
      zeichneKategorie(links, block); });
    linksSpalte.appendChild(links);
    flaeche.appendChild(linksSpalte);
    var rechts = zeichneRechts(m);
    if (fensterModus) {
      var gross = el("button", "fenster-knopf-gross",
        TB.statusTexte.fensterKnopf);
      gross.addEventListener("click", function () {
        TB.fensterModus.uebergeben(gross); });
      rechts.appendChild(gross);
    }
    flaeche.appendChild(rechts);
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

  function vorlageAktivieren(v, still) {
    aktiveVorlagen = {}; manuellAn = {}; manuellAb = {};
    angeheftet = {};
    aktiveVorlagen[v.id] = true;
    (v.zusatz || []).forEach(function (id) { angeheftet[id] = true; });
    // Auswahl-Vorwahlen der Vorlage anwenden (nie Feld-Werte).
    Object.keys(v.werte || {}).forEach(function (pid) {
      var je = werte[pid] || (werte[pid] = {});
      Object.keys(v.werte[pid]).forEach(function (label) {
        je[label] = v.werte[pid][label]; });
    });
    // Zeilen-Muster der Vorlage übernehmen (als AKTIVE Zeilen), die
    // vorbereiteten leeren Zeilen bleiben dahinter bestehen.
    bereiteZeilenVor();
    (v.herde || []).forEach(function (z, i) {
      var kopie = JSON.parse(JSON.stringify(z)); kopie.aktiv = true;
      zeilen.herde.splice(i, 0, kopie); });
    (v.entladungen || []).forEach(function (z, i) {
      var kopie = JSON.parse(JSON.stringify(z)); kopie.aktiv = true;
      zeilen.entladungen.splice(i, 0, kopie); });
    (v.transienten || []).forEach(function (z) {
      var kopie = JSON.parse(JSON.stringify(z)); kopie.aktiv = true;
      zeilen.transienten.push(kopie); });
    koppleKeine();
    if (!still) nurGewaehlte = false;
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
          (v.zusatz || []).forEach(function (id) { delete angeheftet[id]; });
        } else {
          vorlageAktivieren(v, false);
        }
        neu();
      });
      zeile.appendChild(k);
    });
    wurzel.appendChild(zeile);
  }

  function hatInhalt(block) {
    return block.punkte.some(function (p) {
      return istGewaehlt(p.id) || angeheftet[p.id]; });
  }

  function zeichneEingeklappt(ziel, block) {
    var sichtbare = block.punkte.filter(passtZurSuche);
    if (!sichtbare.length) return;
    if (nurGewaehlte && !hatInhalt(block)) return;
    var offen = !!offeneKat[block.kategorie.id] || !!suchbegriff ||
                hatInhalt(block);
    var kasten = el("details", "eeg-kat-zu");
    kasten.open = offen;
    var griff = el("summary", "", block.kategorie.name);
    kasten.appendChild(griff);
    kasten.addEventListener("toggle", function () {
      if (kasten.open) offeneKat[block.kategorie.id] = true;
      else delete offeneKat[block.kategorie.id];
    });
    fuelleKategorie(kasten, block);
    ziel.appendChild(kasten);
  }

  function zeichneKategorie(ziel, block) {
    var kasten = el("section", "status-kategorie");
    kasten.appendChild(el("h3", "", block.kategorie.name));
    fuelleKategorie(kasten, block);
    if (kasten.children.length > 1) ziel.appendChild(kasten);
  }

  function fuelleKategorie(kasten, block) {
    var chipPunkte = {};
    if (block.kategorie.id === "indikation") {
      kasten.appendChild(indikationsChips());
      R().indikationKnoepfe.forEach(function (kn) {
        chipPunkte[kn.id] = true; });
    }
    if (block.kategorie.id === "anamnese") {
      kasten.appendChild(anamneseBlock());
      chipPunkte["ana_med"] = true;
    }
    if (block.kategorie.id === "ableitung") {
      kasten.appendChild(ableitungsChips());
    }
    if (block.kategorie.id === "vigilanz") {
      kasten.appendChild(vigilanzChips());
      chipPunkte["vig_haupt"] = true;   // der Satz läuft über die Knöpfe
    }
    if (block.kategorie.id === "verlangsamung") {
      kasten.appendChild(erzeugerChips(R().herdChips, function (c) {
        var frisch = neueZeile("herde");
        frisch.aktiv = true; frisch.band = c.band;
        zeilen.herde.push(frisch);
      }));
    }
    if (block.kategorie.id === "transienten") {
      kasten.appendChild(erzeugerChips(R().transChips, function (c) {
        var frisch = neueZeile("transienten");
        frisch.aktiv = true;
        frisch.lok = [c.lok, "", "", ""]; frisch.seite = c.seite;
        zeilen.transienten.push(frisch);
      }));
    }
    if (block.kategorie.id === "entladungen") {
      kasten.appendChild(erzeugerChips(R().entChips.map(function (f) {
        return { name: f, form: f }; }), function (c) {
        var frisch = neueZeile("entladungen");
        frisch.aktiv = true; frisch.form = c.form;
        zeilen.entladungen.push(frisch);
      }));
    }
    if (block.kategorie.id === "artefakte") {
      kasten.appendChild(artefaktChips());
      R().artefaktKaestchen.forEach(function (id) {
        chipPunkte[id] = true; });
    }
    var a = aktiveZeilen();
    var eigeneZeilen = block.kategorie.zeilen &&
      block.kategorie.zeilen !== "medis";
    var mitZeilen = eigeneZeilen &&
      a[block.kategorie.zeilen].length > 0;
    var sichtbar = function (p) {
      if (chipPunkte[p.id]) return false;   // laufen über die Knopfzeile
      if (mitZeilen && (p.id === "vl_keine" || p.id === "ent_keine"))
        return false;
      if (nurGewaehlte && !istGewaehlt(p.id) && !angeheftet[p.id]) return false;
      return passtZurSuche(p);
    };
    var hinten = {};
    (R().hinterPfeil || []).forEach(function (id) { hinten[id] = true; });
    var vorne = function (p) {
      if (hinten[p.id]) return false;
      return p.haeufig || istGewaehlt(p.id) || !!angeheftet[p.id]; };
    var haeufige = block.punkte.filter(function (p) {
      return vorne(p) && sichtbar(p); });
    var seltene = block.punkte.filter(function (p) {
      return !vorne(p) && sichtbar(p); });
    // Nur „keine." steht VOR den Zeilen; alles Übrige (z. B. FIRDA)
    // folgt UNTER den Zeilen (Näd 2.10. Abend).
    var istKeine = function (p) {
      return p.id === "vl_keine" || p.id === "ent_keine"; };
    haeufige.filter(istKeine).forEach(function (p) {
      kasten.appendChild(zeile(p)); });
    var nachZeilen = haeufige.filter(function (p) { return !istKeine(p); });
    if (!eigeneZeilen) {
      nachZeilen.forEach(function (p) { kasten.appendChild(zeile(p)); });
      nachZeilen = [];
    }
    if (eigeneZeilen) {
      zeichneZeilen(kasten, block.kategorie.zeilen);
      nachZeilen.forEach(function (p) { kasten.appendChild(zeile(p)); });
    }
    if (seltene.length) {
      var offen = !!offeneSelten[block.kategorie.id] || !!suchbegriff ||
                  nurGewaehlte;
      // hinterPfeil-Punkte zeigt erst das AUSDRUECKLICHE Aufklappen
      // (oder die Suche) — nicht schon der Nur-Gewaehlte-Modus.
      var offenHart = !!offeneSelten[block.kategorie.id] || !!suchbegriff;
      if (offen) {
        var stadien = {};
        R().schlafElemente.forEach(function (e) {
          stadien[e.id] = e.stadium; });
        var letzterTitel = null;
        seltene.forEach(function (p) {
          if (hinten[p.id] && !offenHart) return;
          if (block.kategorie.id === "vigilanz" && stadien[p.id] &&
              stadien[p.id] !== letzterTitel) {
            letzterTitel = stadien[p.id];
            kasten.appendChild(el("div", "eeg-stadium-titel",
              letzterTitel + ":"));
          }
          var z = zeile(p); z.classList.add("selten");
          kasten.appendChild(z); });
      }
      if (!suchbegriff && seltene.length &&
          (!nurGewaehlte || seltene.some(function (p) {
             return hinten[p.id]; }))) {
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
  }

  // 17.4: Erzeuger-Chips — jeder Klick erzeugt eine vorgefüllte Zeile
  // (Naed: zwei Herde in Sekunden; loeschbar ueber das Kreuz der Zeile).
  function erzeugerChips(liste, fuelle) {
    var reihe = el("div", "status-chips");
    (liste || []).forEach(function (c) {
      var k = el("button", "status-chip", c.name);
      k.addEventListener("click", function () {
        fuelle(c); koppleKeine(); neu(); });
      reihe.appendChild(k);
    });
    return reihe;
  }

  // ---- Dreiknopf-Zeilen und Artefakt-Kästchen --------------------------
  function chip(beschriftung, aktivZustand, tuDies) {
    var k = el("button", "status-chip" + (aktivZustand ? " aktiv" : ""),
      beschriftung);
    k.addEventListener("click", function () { tuDies(); neu(); });
    return k;
  }
  function wertAktuell(pid, label) {
    var p = TB.eeg.punkt(TB.eeg.master(), pid);
    if (!p) return "";
    var stueck = TB.eeg.zerlege(p.text).find(function (st) {
      return st.art === "auswahl" && st.label === label; });
    if (!stueck) return "";
    return TB.eeg.wertVon(stueck, werte, pid);
  }
  function ableitungsChips() {
    var zeile = el("div", "eeg-wahl-chips");
    var montage = wertAktuell("abl_satz", "Montage");
    var bedingungen = wertAktuell("abl_satz", "Bedingungen");
    R().ableitungKnoepfe.forEach(function (kn) {
      var aktivZ = montage === kn.werte["Montage"] &&
                   bedingungen === kn.werte["Bedingungen"];
      zeile.appendChild(chip(kn.name, aktivZ, function () {
        var je = werte["abl_satz"] || (werte["abl_satz"] = {});
        Object.keys(kn.werte).forEach(function (label) {
          je[label] = kn.werte[label]; });
        schalte("abl_satz", true);
        schalte("art_50hz", !!kn.artefakt50);
      }));
    });
    return zeile;
  }
  function vigilanzChips() {
    var zeile = el("div", "eeg-wahl-chips");
    var jetzt = wertAktuell("vig_haupt", "Zustand");
    R().vigilanzKnoepfe.forEach(function (kn) {
      zeile.appendChild(chip(kn.name, istGewaehlt("vig_haupt") &&
        jetzt === kn.wert, function () {
          var je = werte["vig_haupt"] || (werte["vig_haupt"] = {});
          je["Zustand"] = kn.wert;
          schalte("vig_haupt", true);
        }));
    });
    return zeile;
  }
  function artefaktChips() {
    var zeile = el("div", "eeg-wahl-chips");
    var m = TB.eeg.master();
    R().artefaktKaestchen.forEach(function (pid) {
      var p = TB.eeg.punkt(m, pid);
      if (!p) return;
      var kurz = TB.eeg.aufgeloest(p, werte).replace(/\.$/, "")
        .replace(" bds. frontal", "");
      zeile.appendChild(chip(kurz, istGewaehlt(pid), function () {
        schalte(pid, !istGewaehlt(pid));
      }));
    });
    return zeile;
  }

  function indikationsChips() {
    var zeile = el("div", "eeg-wahl-chips");
    R().indikationKnoepfe.forEach(function (kn) {
      zeile.appendChild(chip(kn.name, istGewaehlt(kn.id), function () {
        schalte(kn.id, !istGewaehlt(kn.id));
      }));
    });
    return zeile;
  }
  function anamneseBlock() {
    var huelle = el("div", "eeg-anamnese");
    var kopf = el("label", "eeg-anamnese-kopf");
    var kreuz = el("input");
    kreuz.type = "checkbox";
    kreuz.checked = istGewaehlt("ana_med");
    kreuz.addEventListener("change", function () {
      if (kreuz.checked) {
        if (!zeilen.medis.length) zeilen.medis.push(neueZeile("medis"));
        zeilen.medis[0].aktiv = true;
      } else {
        zeilen.medis.forEach(function (z) { z.aktiv = false; });
      }
      koppleAnamnese();
      neu();
    });
    kopf.appendChild(kreuz);
    kopf.appendChild(document.createTextNode(" aktuelle Medikamente"));
    huelle.appendChild(kopf);
    if (istGewaehlt("ana_med")) {
      zeilen.medis.forEach(function (z, idx) {
        huelle.appendChild(mediZeile(z, idx)); });
      var dazu = el("button", "eeg-zeile-dazu", TE().mediDazu);
      dazu.addEventListener("click", function () {
        var frisch = neueZeile("medis");
        frisch.aktiv = true;
        zeilen.medis.push(frisch);
        neu();
      });
      huelle.appendChild(dazu);
    }
    return huelle;
  }
  function mediZeile(z, idx) {
    var rahmen = el("div", "eeg-herdzeile" + (z.aktiv ? " aktiv" : ""));
    var kreuz = el("input", "eeg-zeile-aktiv");
    kreuz.type = "checkbox";
    kreuz.checked = !!z.aktiv;
    kreuz.title = TE().zeileZaehlt;
    kreuz.addEventListener("change", function () {
      z.aktiv = kreuz.checked; koppleAnamnese(); neu(); });
    rahmen.appendChild(kreuz);
    var namen = auswahl(R().antikonvulsiva.concat([R().mediFreitext]),
      z.name);
    namen.title = "Antikonvulsivum";
    namen.addEventListener("change", function () {
      z.name = namen.value;
      if (!z.aktiv) { z.aktiv = true; koppleAnamnese(); }
      neu();
    });
    rahmen.appendChild(namen);
    if (z.name === R().mediFreitext) {
      var frei = el("input", "eeg-feld eeg-feld-mittel");
      frei.type = "text";
      frei.placeholder = "Medikament";
      frei.title = "Medikament (Freitext)";
      frei.value = z.frei || "";
      frei.addEventListener("change", function () {
        z.frei = frei.value;
        if (!z.aktiv) { z.aktiv = true; koppleAnamnese(); }
        neu();
      });
      rahmen.appendChild(frei);
    }
    var dosis = el("input", "eeg-feld");
    dosis.type = "text";
    dosis.placeholder = "Tagesdosis";
    dosis.title = "Tagesdosis in mg";
    dosis.value = z.dosis || "";
    dosis.addEventListener("change", function () {
      z.dosis = dosis.value;
      if (!z.aktiv) { z.aktiv = true; koppleAnamnese(); }
      neu();
    });
    rahmen.appendChild(dosis);
    rahmen.appendChild(el("span", "eeg-mg", "mg"));
    var weg = el("button", "eeg-zeile-weg", "✕");
    weg.title = TE().zeileWeg;
    weg.addEventListener("click", function () {
      if (zeilen.medis.length > R().medisVorbereitet) {
        zeilen.medis.splice(idx, 1);
      } else {
        zeilen.medis[idx] = neueZeile("medis");
      }
      koppleAnamnese();
      neu();
    });
    rahmen.appendChild(weg);
    return rahmen;
  }

  // ---- Herd- und Entladungs-Zeilen -------------------------------------
  function auswahl(optionen, wert, leerZeichen, wandel) {
    var ddl = el("select", "eeg-auswahl");
    optionen.forEach(function (o) {
      var anzeige = (o === "") ? (leerZeichen || "—")
        : (wandel ? wandel(o) : o);
      var opt = el("option", "", anzeige);
      opt.value = o;
      ddl.appendChild(opt);
    });
    ddl.value = wert;
    return ddl;
  }

  function zeichneZeilen(kasten, art) {
    var liste = zeilen[art];
    liste.forEach(function (z, idx) {
      kasten.appendChild(zeilenEditor(art, z, idx));
    });
    var dazu = el("button", "eeg-zeile-dazu",
      art === "herde" ? TE().herdDazu
        : (art === "transienten" ? TE().transDazu : TE().entDazu));
    dazu.addEventListener("click", function () {
      var frisch = neueZeile(art);
      frisch.aktiv = true;
      liste.push(frisch);
      koppleKeine();
      neu();
    });
    kasten.appendChild(dazu);
  }

  function zeilenEditor(art, z, idx) {
    var rahmen = el("div", "eeg-herdzeile" + (z.aktiv ? " aktiv" : ""));
    var istHerd = (art === "herde");
    var istTrans = (art === "transienten");
    function fasseAn() {
      if (!z.aktiv) { z.aktiv = true; koppleKeine(); }
    }

    var kreuz = el("input", "eeg-zeile-aktiv");
    kreuz.type = "checkbox";
    kreuz.checked = !!z.aktiv;
    kreuz.title = TE().zeileZaehlt;
    kreuz.addEventListener("change", function () {
      z.aktiv = kreuz.checked; koppleKeine(); neu(); });
    rahmen.appendChild(kreuz);

    var h = auswahl(istTrans ? R().transHaeufigkeiten
      : (istHerd ? R().herdHaeufigkeiten : R().entHaeufigkeiten),
      z.haeufigkeit);
    h.title = "Häufigkeit";
    h.addEventListener("change", function () {
      z.haeufigkeit = h.value; fasseAn(); neu(); });
    rahmen.appendChild(h);

    if (istTrans) {
      rahmen.appendChild(el("span", "eeg-trans-wort", R().transWort));
    } else if (istHerd) {
      var baender = R().baender.map(function (b) { return b.id; });
      var b = auswahl(baender, z.band, "", function (id) {
        return R().baender.find(function (x) {
          return x.id === id; }).wort; });
      b.title = "Band";
      b.addEventListener("change", function () {
        z.band = b.value; fasseAn(); neu(); });
      rahmen.appendChild(b);
    } else {
      var f = auswahl(R().entFormen, z.form);
      f.title = "Form";
      f.addEventListener("change", function () {
        z.form = f.value; fasseAn(); neu(); });
      rahmen.appendChild(f);
    }

    // Lokalisations-Kette: bis 4 Kästchen; das nächste erscheint erst,
    // wenn das vorige gefüllt ist. generalisiert/hemisphärisch nur im
    // ersten Kästchen — generalisiert blendet Kette, Seite und
    // Ausbreitung aus, hemisphärisch die restliche Kette.
    var regionen = R().regionen.map(function (r) { return r.id; });
    var spezial = z.lok[0] === "generalisiert" ||
                  z.lok[0] === "hemisphärisch";
    var anzahl = spezial ? 1 : 4;
    for (var i = 0; i < anzahl; i++) {
      if (i > 0 && !z.lok[i - 1]) break;
      (function (i) {
        var optionen = (i === 0)
          ? regionen.concat(R().spezialLok)
          : [""].concat(regionen);
        var l = auswahl(optionen, z.lok[i] || "");
        l.title = "Lokalisation " + (i + 1);
        l.classList.add("eeg-lok");
        l.addEventListener("change", function () {
          z.lok[i] = l.value; fasseAn();
          if (i === 0 && (l.value === "generalisiert" ||
                          l.value === "hemisphärisch")) {
            z.lok[1] = ""; z.lok[2] = ""; z.lok[3] = "";
          }
          for (var j = i + 1; j < 4; j++) {
            if (!z.lok[j - 1]) z.lok[j] = "";
          }
          neu();
        });
        rahmen.appendChild(l);
      })(i);
    }

    // 17.4 (Naed): Ausbreitung/Seite als eigene, eingerueckte zweite
    // Zeile; Ausbreitungs-Platzhalter ist ein schlichtes "?".
    var zwei = el("div", "eeg-zeile-zwei");
    if (z.lok[0] !== "generalisiert") {
      var a = auswahl(R().ausbreitungen, z.ausbreitung || "", "?");
      a.title = "Ausbreitung";
      a.addEventListener("change", function () {
        z.ausbreitung = a.value; fasseAn(); neu(); });
      zwei.appendChild(a);

      var s = auswahl(R().seiten, z.seite || "", "— Seite");
      s.title = "Seite";
      s.addEventListener("change", function () {
        z.seite = s.value; fasseAn(); neu(); });
      zwei.appendChild(s);
    }
    if (istTrans) {
      var einLabel = el("label", "eeg-einge");
      var ein = el("input");
      ein.type = "checkbox";
      ein.checked = !!z.eingelagert;
      ein.addEventListener("change", function () {
        z.eingelagert = ein.checked; fasseAn(); neu(); });
      einLabel.appendChild(ein);
      einLabel.appendChild(document.createTextNode(
        " " + TE().transEingelagert));
      zwei.appendChild(einLabel);
    }
    if (zwei.children.length) rahmen.appendChild(zwei);

    var weg = el("button", "eeg-zeile-weg", "✕");
    weg.title = TE().zeileWeg;
    weg.addEventListener("click", function () {
      var vorbereitet = istTrans ? 0
        : (istHerd ? R().herdeVorbereitet : R().entladungenVorbereitet);
      if (zeilen[art].length > vorbereitet) {
        zeilen[art].splice(idx, 1);       // zusätzliche Zeile: weg
      } else {
        zeilen[art][idx] = neueZeile(art); // vorbereitete: zurücksetzen
      }
      koppleKeine();
      neu();
    });
    rahmen.appendChild(weg);
    return rahmen;
  }

  // ---- Automatische Beurteilung in der Maske ---------------------------
  function zeichneAutoBeurteilung(ziel, m) {
    var menge = gewaehltAlsMenge(m);
    var saetze = TB.eeg.autoBeurteilung(menge, werte, aktiveZeilen());
    if (!saetze.length) return;
    var kasten = el("section", "status-kategorie eeg-auto");
    saetze.forEach(function (a) {
      kasten.appendChild(autoZeile(a.id, a.text));
    });
    ziel.appendChild(kasten);
  }

  function autoZeile(id, soll) {
    var z = el("div", "status-zeile eeg-zeile eeg-auto-zeile");
    var inhalt = el("div", "status-zeile-inhalt");
    if (bearbeiteId === id) {
      inhalt.appendChild(abweichFeld(id, soll));
    } else {
      var fertig = (abweichungen[id] !== undefined)
        ? abweichungen[id] : soll;
      var text = el("span", "status-befund", fertig);
      text.title = TE().befundKlickHinweis;
      text.addEventListener("click", function () {
        bearbeiteId = id; neu(); });
      inhalt.appendChild(text);
      if (abweichungen[id] !== undefined) {
        var zurueck = el("button", "status-zurueck", "↺");
        zurueck.title = TE().abweichungZurueck;
        zurueck.addEventListener("click", function () {
          delete abweichungen[id]; neu(); });
        inhalt.appendChild(zurueck);
      }
    }
    z.appendChild(inhalt);
    return z;
  }

  function abweichFeld(id, soll, nachher) {
    var feld = el("textarea", "status-abweichfeld");
    feld.rows = 2;
    feld.value = (abweichungen[id] !== undefined) ? abweichungen[id] : soll;
    function wachse() {
      feld.style.height = "auto";
      feld.style.height = (feld.scrollHeight + 4) + "px";
    }
    feld.addEventListener("input", wachse);
    setTimeout(wachse, 0);
    function schliesse() {
      var wert = feld.value.trim();
      if (!wert || wert === String(soll).trim()) delete abweichungen[id];
      else {
        abweichungen[id] = wert;
        if (nachher) nachher();
      }
      bearbeiteId = null; neu();
    }
    feld.addEventListener("blur", schliesse);
    feld.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { bearbeiteId = null; neu(); }
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault(); feld.blur(); }
    });
    setTimeout(function () { feld.focus(); feld.select(); }, 0);
    return feld;
  }

  // ---- Punkt-Zeilen ----------------------------------------------------
  function zeile(p) {
    var z = el("div", "status-zeile eeg-zeile" +
      (angeheftet[p.id] && !istGewaehlt(p.id) ? " ist-zusatz" : ""));
    var kreuz = el("input");
    kreuz.type = "checkbox";
    kreuz.checked = istGewaehlt(p.id);
    kreuz.addEventListener("change", function () {
      schalte(p.id, kreuz.checked);
      // Grundrhythmus-Satz und "nicht beurteilbar." schliessen sich aus.
      if (p.id === "ga_nb" && kreuz.checked) {
        schalte("ga_grundrhythmus", false);
        schalte("ga_blockade", false);   // auch sie ist nicht beurteilbar
      }
      if (p.id === "ga_grundrhythmus" && kreuz.checked) {
        schalte("ga_nb", false);
        schalte("ga_blockade", true);
      }
      neu(); });
    z.appendChild(kreuz);

    var inhalt = el("div", "status-zeile-inhalt");
    var soll = TB.eeg.aufgeloest(p, werte);
    if (bearbeiteId === p.id) {
      inhalt.appendChild(abweichFeld(p.id, soll, function () {
        schalte(p.id, true); }));
    } else if (abweichungen[p.id] !== undefined) {
      var text = el("span", "status-befund");
      var d = TB.eeg.wortUnterschied(soll, abweichungen[p.id]);
      text.appendChild(document.createTextNode(d.vor));
      text.appendChild(el("span", "abweichend-teil", d.mitte));
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
      // 17.4 (Naed): der Grundrhythmus-Satz steht links als EINE
      // kompakte Zeile ("gut ausgeprägt, moduliert, 9 Hz"); der
      // Befundtext selbst bleibt unverändert.
      var kompakt = (p.id === "ga_grundrhythmus");
      var kurz = { " ausgeprägter ": " ausgeprägt, ",
                   " okzipitaler Grundrhythmus um ": ", ",
                   " Hz.": " Hz" };
      if (kompakt) huelle.classList.add("ga-kompakt");
      TB.eeg.zerlege(p.text).forEach(function (s) {
        if (s.art === "text") {
          var st = el("span", "status-befund",
            (kompakt && kurz[s.wert] !== undefined) ? kurz[s.wert] : s.wert);
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
          var breite = "";
          if (["Klinik", "Beschreibung", "Kurzbefund"].indexOf(s.label) !== -1)
            breite = " eeg-feld-breit";
          else if (["Schwerpunkt", "Substanz", "Sedation", "Quelle",
                    "Elektrode"].indexOf(s.label) !== -1)
            breite = " eeg-feld-mittel";
          var ein = el("input", "eeg-feld" + breite);
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

  function istLeer(m) {
    var a = aktiveZeilen();
    return !Object.keys(gewaehltAlsMenge(m)).length &&
           !a.herde.length && !a.entladungen.length;
  }

  function kopierKnopf(beschriftung, nimm) {
    var k = el("button", "status-kopieren", beschriftung);
    k.addEventListener("click", function () {
      var m = TB.eeg.master();
      if (istLeer(m)) { melde(TE().nichtsGewaehlt, true); return; }
      var menge = gewaehltAlsMenge(m);
      var f = TB.eeg.fliesstext(m, menge, werte, abweichungen,
        aktiveZeilen());
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
    var a = aktiveZeilen();
    var anzahl = Object.keys(menge).length +
                 a.herde.length + a.entladungen.length;
    var ueberschrieben = Object.keys(abweichungen).length;

    var knoepfe = el("div", "status-knoepfe");
    if (!fensterModus) {
      knoepfe.appendChild(kopierKnopf(TE().kopierenIndikation,
        function (f) { return f.indikation; }));
      knoepfe.appendChild(kopierKnopf(TE().kopierenAnamnese,
        function (f) { return f.anamnese; }));
      knoepfe.appendChild(kopierKnopf(TE().kopierenBefund,
        function (f) { return f.befund; }));
      knoepfe.appendChild(kopierKnopf(TE().kopierenBeurteilung,
        function (f) { return f.beurteilung; }));
      knoepfe.appendChild(kopierKnopf(TE().kopierenBeides,
        function (f) { return TB.eeg.block(f); }));
    }

    var leeren = el("button", "", TE().zuruecksetzenKnopf);
    leeren.addEventListener("click", function () {
      allesLeeren(); melde(TE().zurueckgesetzt); neu(); });
    knoepfe.appendChild(leeren);

    if (!fensterModus) {
      var speichern = el("button", "", TE().alsVorlageKnopf);
      speichern.addEventListener("click", function () {
        if (istLeer(m)) { melde(TE().nichtsGewaehlt, true); return; }
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
        TB.eeg.vorlageSpeichern(name, kuerzel, punkte, zusatz, w,
          aktiveZeilen());
        melde(TE().vorlageFertig.replace("%s", name));
        neu();
      });
    knoepfe.appendChild(speichern);
    }
    rechts.appendChild(knoepfe);

    rechts.appendChild(el("div", "sammel-zaehler",
      TE().zaehlerZeile.replace("%s", String(anzahl))
        .replace("%s", String(ueberschrieben))));

    var f = istLeer(m) ? null
      : TB.eeg.fliesstext(m, menge, werte, abweichungen, aktiveZeilen());
    [[TE().indikationTitel, f && f.indikation],
     [TE().anamneseTitel, f && f.anamnese],
     [TE().befundTitel, f && f.befund],
     [TE().beurteilungTitel, f && f.beurteilung]]
      .forEach(function (paar) {
        if ((paar[0] === TE().indikationTitel ||
             paar[0] === TE().anamneseTitel) &&
            (!paar[1] || !paar[1].html)) return;   // leere kleine Felder
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

  // E11-Nachbesserung: aktueller Stand für den Fenster-Modus (URL-Weg
  // des Skripts) — dieselben Quellen wie die Vorschau.
  function aktuelleFelder() {
    var m = TB.eeg.master();
    if (!m) return null;
    return TB.eeg.fliesstext(m, gewaehltAlsMenge(m), werte, abweichungen,
                             aktiveZeilen());
  }
  return { zeichne: zeichne, aktuelleFelder: aktuelleFelder,
           setzeFensterModus: setzeFensterModus };
})();
