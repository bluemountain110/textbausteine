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
  var fensterModus = false;    // URL-Fenster: NUR der gerufene Status
  function setzeFensterModus(w) { fensterModus = !!w; }
  function fensterTitel() {
    var namen = TB.status.teilmengen().filter(function (t) {
      return aktiveTeilmengen[t.id]; }).map(function (t) { return t.name; });
    return namen.length ? "Status \u2014 " + namen.join(" + ")
                        : TS().statusTitel;
  }
  var aktiveTeilmengen = {};   // teilmengen-id -> true
  var normalUeber = {};        // untersuchung-id -> eigener Standardtext
                               // (aus den Teilmengen, normalAb)
  var manuellAn = {}, manuellAb = {};   // untersuchungs-id -> true
  var abweichungen = {};       // untersuchungs-id -> überschriebener Befund
  var offeneSelten = {};       // kategorie-id -> true
  var suchbegriff = "";
  var nurGewaehlte = false;   // Schalter „Nur Gewählte" (Sammelrunde 27.9.)
  var bearbeiteId = null;      // Untersuchung, deren Befund gerade offen ist
  var merkmalWahl = {};        // uid -> { merkmal-id: true = ABgewählt }
  var offeneMerkmale = {};     // uid -> true (Muskel-Auswahl aufgeklappt)
  var sucheFokus = false;
  // Zusätze (Näd 30.9.): sichtbar, aber nicht angewählt — kommen aus
  // geladenen eigenen Status oder werden mit dem ☆ vorgemerkt.
  var angeheftet = {};         // uid -> true
  var merkmalZusatz = {};
  var seltenOffen = false;     // E11: seltene Status-Chips eingeblendet      // uid -> { merkmal-id: true } (1.10.: Muskel-Sterne)

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
    normalUeber = {};
    abweichungen = {}; bearbeiteId = null;
    merkmalWahl = {}; offeneMerkmale = {};
    angeheftet = {}; merkmalZusatz = {};
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
    kopf.appendChild(el("h2", "",
      fensterModus ? fensterTitel() : TS().statusTitel));
    if (!fensterModus) {
      var pflege = el("button", "", TS().pflegeKnopf);
      pflege.addEventListener("click", function () {
        TB.ansichtStatusPflege.oeffne(); });
      kopf.appendChild(pflege);
    }

    klebt.appendChild(kopf);

    if (!fensterModus) zeichneTeilmengen(klebt);
    TB.ansichtStatusTardoc.zeichne(klebt, m, gewaehltAlsMenge(m),
      merkmalWahl);

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
    if (!fensterModus) {
      var nurG = el("button",
        "status-nurgew" + (nurGewaehlte ? " aktiv" : ""),
        TS().nurGewaehlteKnopf);
      nurG.addEventListener("click", function () {
        nurGewaehlte = !nurGewaehlte; neu(); });
      suchzeile.appendChild(nurG);
      klebt.appendChild(suchzeile);
    }

    // Nachbesserung 27.9.: Der klebende Kopf lebt in der LINKEN Spalte,
    // damit die rechte Spalte (Vorschau, Kopieren) ihr eigenes Kleben
    // behält und nicht darunter verschwindet.
    var flaeche = el("div", "status-flaeche");
    var linksSpalte = el("div", "status-linksspalte");
    linksSpalte.appendChild(klebt);
    var links = el("div", "status-maske");
    if (fensterModus) {
      // 17.4 (Naed): oben NUR das Gewaehlte, dann die Suche, darunter
      // alles Uebrige offen zum Ergaenzen.
      TB.status.jeKategorie(m).forEach(function (block) {
        zeichneKategorie(links, m, block, "gewaehlt"); });
      links.appendChild(suchzeile);
      TB.status.jeKategorie(m).forEach(function (block) {
        zeichneKategorie(links, m, block, "rest"); });
    } else {
      TB.status.jeKategorie(m).forEach(function (block) {
        zeichneKategorie(links, m, block); });
    }
    linksSpalte.appendChild(links);
    flaeche.appendChild(linksSpalte);
    var rechts = zeichneRechts(m);
    if (fensterModus) {
      var gross = el("button", "fenster-knopf-gross", TS().fensterKnopf);
      gross.addEventListener("click", function () {
        TB.fensterModus.uebergeben(gross); });
      rechts.appendChild(gross);
    }
    flaeche.appendChild(rechts);
    wurzel.appendChild(flaeche);
    // Höhe der App-Kopfzeile als CSS-Mass, damit beide klebenden Teile
    // exakt darunter andocken (am Handy ist die Kopfzeile nicht klebend).
    function messeKopf() {
      var kz = document.querySelector("header");
      var h = kz ? Math.ceil(kz.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty("--kopf-h", h + "px");
    }
    messeKopf();
    if (!window.__statusKopfMesser) {
      window.__statusKopfMesser = true;
      window.addEventListener("resize", messeKopf);
    }

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

  function deaktiviere(t, liste) {
    delete aktiveTeilmengen[t.id];
    Object.keys(t.normalAb || {}).forEach(function (id) {
      var nochAndersWo = liste.some(function (x) {
        return x.id !== t.id && aktiveTeilmengen[x.id] &&
          x.normalAb && x.normalAb[id] !== undefined; });
      if (!nochAndersWo) delete normalUeber[id];
    });
    (t.zusatz || []).forEach(function (id) {
      var nochAndersWo = liste.some(function (x) {
        return x.id !== t.id && aktiveTeilmengen[x.id] &&
          (x.zusatz || []).indexOf(id) !== -1; });
      if (!nochAndersWo) delete angeheftet[id];
    });
  }
  function aktiviere(t) {
    aktiveTeilmengen[t.id] = true;
    // Abgeänderte Standardtexte dieses Status (2.10.): sie SIND
    // der Normalbefund — nichts davon erscheint fett.
    Object.keys(t.normalAb || {}).forEach(function (id) {
      normalUeber[id] = t.normalAb[id]; });
    // Zusätze dieses Status: sichtbar, nicht angewählt; die Ansicht
    // zeigt dann nur Standard und Zusätze (Schalter oben hebt das auf).
    (t.zusatz || []).forEach(function (id) { angeheftet[id] = true; });
    // Zusatz-Muskeln (1.10.): gelb markiert, nicht angewählt; ihre
    // Muskelliste steht gleich offen, damit man sie sofort sieht.
    Object.keys(t.merkmalZusatz || {}).forEach(function (uid) {
      var zs = {};
      t.merkmalZusatz[uid].forEach(function (mid) { zs[mid] = true; });
      merkmalZusatz[uid] = zs;
      offeneMerkmale[uid] = true;
    });
    nurGewaehlte = true;
    // Gespeicherte Muskel-Auswahl dieses Status anwenden (27.9.)
    Object.keys(t.merkmalAb || {}).forEach(function (uid) {
      var ab = {};
      t.merkmalAb[uid].forEach(function (mid) { ab[mid] = true; });
      merkmalWahl[uid] = ab;
    });
  }
  // E11, öffentlich: Status-Werk mit GENAU diesem Status öffnen — der
  // Memory-Direktknopf im MC-Bericht ruft das; kennung ist id ODER
  // Kürzel. Beginnt eine frische Sitzung (alles andere geleert).
  function aktiviereTeilmenge(kennung) {
    var k = String(kennung || "").toLowerCase();
    var t = TB.status.teilmengen().find(function (x) {
      return String(x.id).toLowerCase() === k ||
        String(x.kuerzel || "").toLowerCase() === k; });
    if (!t) return false;
    allesLeeren();
    aktiviere(t);
    if (TB.oberflaeche && TB.oberflaeche.geheZu) TB.oberflaeche.geheZu("status");
    return true;
  }

  function zeichneTeilmengen(wurzel) {
    var liste = TB.status.teilmengen();
    if (!liste.length) return;
    var zeile = el("div", "status-teilmengen");
    zeile.appendChild(el("span", "klein-hinweis", TS().teilmengenTitel));
    // E11: Status mit dem Häkchen „selten“ stehen hinter einem Schalter
    // — aktive bleiben immer sichtbar (analog seltene Untersuchungen).
    var sichtbare = liste.filter(function (t) {
      return !t.selten || aktiveTeilmengen[t.id] || seltenOffen; });
    var versteckte = liste.length - sichtbare.length;
    sichtbare.forEach(function (t) {
      var k = el("button",
        "status-chip" + (aktiveTeilmengen[t.id] ? " aktiv" : "") +
        (t.selten ? " selten" : ""), t.name);
      if (t.kuerzel) k.title = ";;" + t.kuerzel;
      k.addEventListener("click", function () {
        if (aktiveTeilmengen[t.id]) deaktiviere(t, liste);
        else aktiviere(t);
        neu();
      });
      zeile.appendChild(k);
    });
    if (versteckte > 0 || (seltenOffen && liste.some(function (t) {
          return t.selten; }))) {
      var schalter = el("button", "status-chip status-chip-schalter",
        seltenOffen ? TS().seltenVerbergen
                    : TS().seltenZeigen.replace("%s", String(versteckte)));
      schalter.addEventListener("click", function () {
        seltenOffen = !seltenOffen; neu(); });
      zeile.appendChild(schalter);
    }
    wurzel.appendChild(zeile);
    // Info-Spickzettel (3.10.): typische Befunde der aktiven Status —
    // bei den Radikulopathien die Kennmuskeln, Reflexe und Dermatome.
    var infos = liste.filter(function (t) {
      return aktiveTeilmengen[t.id] && t.info; });
    if (infos.length) {
      var kasten = el("div", "status-info");
      infos.forEach(function (t) {
        var absatz = el("div", "status-info-eintrag");
        absatz.appendChild(el("b", "", t.name + ": "));
        absatz.appendChild(document.createTextNode(t.info));
        kasten.appendChild(absatz);
      });
      wurzel.appendChild(kasten);
    }
  }

  // Tardoc-Ampeln und Nachlese wohnen seit E11 in
  // ansicht-status-tardoc.js (600-Zeilen-Regel).
  function zeichneKategorie(ziel, m, block, modus) {
    var sichtbar = function (u) {
      if (modus === "gewaehlt")
        return istGewaehlt(u.id) || !!angeheftet[u.id];
      if (modus === "rest") {
        if (istGewaehlt(u.id) || angeheftet[u.id]) return false;
        return passtZurSuche(u);
      }
      if (nurGewaehlte && !istGewaehlt(u.id) && !angeheftet[u.id]) return false;
      return passtZurSuche(u);
    };
    // Gewählte und Zusätze stehen immer offen da, auch wenn sie „selten“
    // sind — sonst müsste man sie erst aufklappen und heraussuchen.
    var vorne = function (u) {
      if (modus === "gewaehlt") return true;
      return u.haeufig || istGewaehlt(u.id) || !!angeheftet[u.id]; };
    var haeufige = block.untersuchungen.filter(function (u) {
      return vorne(u) && sichtbar(u); });
    var seltene = block.untersuchungen.filter(function (u) {
      return !vorne(u) && sichtbar(u); });
    if (!haeufige.length && !seltene.length) return;

    var kasten = el("section", "status-kategorie");
    kasten.appendChild(el("h3", "", block.kategorie.name));
    haeufige.forEach(function (u) { kasten.appendChild(zeile(u)); });

    if (seltene.length) {
      var offen = !!offeneSelten[block.kategorie.id] || !!suchbegriff ||
                  (modus !== "rest" && nurGewaehlte);
      if (offen) {
        seltene.forEach(function (u) {
          var z = zeile(u); z.classList.add("selten");
          kasten.appendChild(z); });
      }
      if (!suchbegriff && (modus === "rest" || !nurGewaehlte)) {
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
    var z = el("div", "status-zeile" +
      (angeheftet[u.id] && !istGewaehlt(u.id) ? " ist-zusatz" : ""));
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

    var soll = TB.status.normalVon(u, merkmalWahl, normalUeber);
    if (bearbeiteId === u.id) {
      var feld = el("textarea", "status-abweichfeld");
      feld.rows = 2;
      feld.value = (abweichungen[u.id] !== undefined)
        ? abweichungen[u.id] : soll;
      function wachse() {
        feld.style.height = "auto";
        feld.style.height = (feld.scrollHeight + 4) + "px";
      }
      feld.addEventListener("input", wachse);
      setTimeout(wachse, 0);
      function schliesse() {
        var wert = feld.value.trim();
        if (!wert || wert === soll.trim()) delete abweichungen[u.id];
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
      var text = el("span", "status-befund");
      if (abweichend) {
        // Teil-Hervorhebung auch hier links (27.9.): nur der veränderte
        // Bereich samt Messwort erscheint fett in Dunkelgrau.
        var d = TB.status.wortUnterschied(soll, abweichungen[u.id]);
        text.appendChild(document.createTextNode(d.vor));
        var fett = el("b", "abweichend-teil", d.mitte);
        text.appendChild(fett);
        text.appendChild(document.createTextNode(d.nach));
      } else {
        text.textContent = soll;
      }
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
    // E11: Erklärzeile (z. B. die Stufen von Hoehn & Yahr und mRS) —
    // nur in der Maske, nie im Befundtext.
    if (u.hinweis) inhalt.appendChild(
      el("div", "status-hinweiszeile", u.hinweis));
    z.appendChild(inhalt);
    if (u.merkmale) z.appendChild(merkmalBereich(u));
    var stern = el("button", "status-zusatz" + (angeheftet[u.id] ? " an" : ""),
      angeheftet[u.id] ? "\u2605" : "\u2606");
    stern.title = angeheftet[u.id] ? TS().zusatzAn : TS().zusatzAus;
    stern.addEventListener("click", function () {
      if (angeheftet[u.id]) delete angeheftet[u.id];
      else angeheftet[u.id] = true;
      neu();
    });
    z.appendChild(stern);
    return z;
  }

  // Einzelmuskeln an- und abwählen (Nachbesserung 27.9., Näd): Knopf
  // „Muskeln (x/y)" klappt die Liste mit Untergruppen-Zwischentiteln
  // auf; der Befundtext nennt nur die Gewählten.
  function merkmalBereich(u) {
    var huelle = el("div", "status-merkmale");
    var an = TB.status.gewaehlteMerkmale(u, merkmalWahl).length;
    var sterne = Object.keys(merkmalZusatz[u.id] || {}).length;
    var knopf = el("button", "status-merkmal-knopf",
      TS().muskelnKnopf.replace("%s", an).replace("%s", u.merkmale.length) +
      (sterne ? "  \u2605" + sterne : ""));
    knopf.title = TS().muskelnHinweis;
    knopf.addEventListener("click", function () {
      if (offeneMerkmale[u.id]) delete offeneMerkmale[u.id];
      else offeneMerkmale[u.id] = true;
      neu();
    });
    huelle.appendChild(knopf);
    if (!offeneMerkmale[u.id]) return huelle;
    var feld = el("div", "status-merkmal-feld");
    // Näd 30.9.: alle auf einmal an- oder abwählen — für spezielle Status
    // nur einzelne Muskeln wählen, ohne jeden einzeln abzuhaken.
    var alleZeile = el("div", "status-merkmal-alle");
    [[TS().merkmaleAlleAn, false], [TS().merkmaleAlleAb, true]].forEach(function (p) {
      var k = el("button", "status-merkmal-alleknopf", p[0]);
      k.type = "button";
      k.addEventListener("click", function () {
        var ab = {};
        if (p[1]) u.merkmale.forEach(function (mk) { ab[mk.id] = true; });
        merkmalWahl[u.id] = ab;
        delete abweichungen[u.id];
        neu();
      });
      alleZeile.appendChild(k);
    });
    feld.appendChild(alleZeile);
    var letzteGruppe = "";
    u.merkmale.forEach(function (mk) {
      if (mk.gruppe !== letzteGruppe) {
        letzteGruppe = mk.gruppe;
        feld.appendChild(el("div", "status-merkmal-titel", mk.gruppe));
      }
      var istStern = !!(merkmalZusatz[u.id] && merkmalZusatz[u.id][mk.id]);
      var zeile = el("label", "status-merkmal-zeile" +
        (istStern && !TB.status.merkmalAn(merkmalWahl, u.id, mk.id) ? " ist-zusatz" : ""));
      var kreuz = el("input");
      kreuz.type = "checkbox";
      kreuz.checked = TB.status.merkmalAn(merkmalWahl, u.id, mk.id);
      kreuz.addEventListener("change", function () {
        var ab = merkmalWahl[u.id] || (merkmalWahl[u.id] = {});
        if (kreuz.checked) delete ab[mk.id];
        else ab[mk.id] = true;
        delete abweichungen[u.id];   // Auswahl schlägt Überschriebenes
        neu();
      });
      zeile.appendChild(kreuz);
      zeile.appendChild(el("span", "", mk.name));
      var mStern = el("button", "status-zusatz" + (istStern ? " an" : ""),
        istStern ? "\u2605" : "\u2606");
      mStern.type = "button";
      mStern.title = istStern ? TS().zusatzMuskelAn : TS().zusatzMuskelAus;
      mStern.addEventListener("click", function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var zs = merkmalZusatz[u.id] || (merkmalZusatz[u.id] = {});
        if (zs[mk.id]) delete zs[mk.id]; else zs[mk.id] = true;
        if (!Object.keys(zs).length) delete merkmalZusatz[u.id];
        neu();
      });
      zeile.appendChild(mStern);
      feld.appendChild(zeile);
    });
    huelle.appendChild(feld);
    return huelle;
  }

  function zeichneRechts(m) {
    var rechts = el("div", "status-rechts");
    var menge = gewaehltAlsMenge(m);
    var anzahl = Object.keys(menge).length;
    var ueberschrieben = Object.keys(abweichungen).filter(function (id) {
      return menge[id]; }).length;

    var knoepfe = el("div", "status-knoepfe");
    if (!fensterModus) {
    var kopieren = el("button", "status-kopieren", TS().kopierenKnopf);
    kopieren.addEventListener("click", function () {
      if (!anzahl) { melde(TS().nichtsGewaehlt, true); return; }
      var f = TB.status.fliesstext(m, menge, abweichungen, merkmalWahl,
        normalUeber);
      TB.ui.kopiereFassungen(f.html, f.text, function (ok, wie) {
        if (!ok) { melde(TS().kopierenFehl, true); return; }
        TB.speicher.zaehleFunktion("statusKopiert");
        melde(wie === "alle Fassungen"
          ? TS().kopiertMeldung : TS().kopiertNurText);
      });
    });
    knoepfe.appendChild(kopieren);
    }

    var leeren = el("button", "", TS().zuruecksetzenKnopf);
    leeren.addEventListener("click", function () {
      allesLeeren(); melde(TS().zurueckgesetzt); neu(); });
    knoepfe.appendChild(leeren);

    if (!fensterModus) {
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
      var merkmalAb = {};
      punkte.forEach(function (id) {
        var ab = merkmalWahl[id];
        if (ab && Object.keys(ab).length) merkmalAb[id] = Object.keys(ab);
      });
      var zusatz = m.untersuchungen.filter(function (u) {
        return angeheftet[u.id] && !menge[u.id]; }).map(function (u) { return u.id; });
      var mZusatz = {};
      Object.keys(merkmalZusatz).forEach(function (uid) {
        if (!menge[uid] && zusatz.indexOf(uid) === -1) return;
        var ids = Object.keys(merkmalZusatz[uid]);
        if (ids.length) mZusatz[uid] = ids;
      });
      // Abgeänderte Texte (2.10., Näd): aktuelle Überschreibungen UND
      // schon geltende eigene Standards der gewählten Untersuchungen
      // werden zum STANDARD dieses Status — nach dem Speichern steht
      // nichts mehr fett.
      var normalAb = {};
      punkte.concat(zusatz).forEach(function (id) {
        if (abweichungen[id] !== undefined) normalAb[id] = abweichungen[id];
        else if (normalUeber[id] !== undefined) normalAb[id] = normalUeber[id];
      });
      TB.status.teilmengeSpeichern(name, punkte, merkmalAb, zusatz, mZusatz,
        normalAb);
      Object.keys(normalAb).forEach(function (id) {
        normalUeber[id] = normalAb[id];
        delete abweichungen[id];
      });
      melde(TS().alsStatusFertig.replace("%s", name));
      neu();
    });
    knoepfe.appendChild(speichern);
    }
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
      var f = TB.status.fliesstext(m, menge, abweichungen, merkmalWahl,
        normalUeber);
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

  // E11-Nachbesserung: aktueller Stand für den Fenster-Modus (URL-Weg).
  function aktuellerText() {
    var m = TB.status.master();
    if (!m) return null;
    return TB.status.fliesstext(m, gewaehltAlsMenge(m), abweichungen,
                                merkmalWahl, normalUeber);
  }
  return { zeichne: zeichne,
           aktiviereTeilmenge: aktiviereTeilmenge,
           aktuellerText: aktuellerText,
           setzeFensterModus: setzeFensterModus };
})();
