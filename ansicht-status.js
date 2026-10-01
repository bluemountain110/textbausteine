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
  var merkmalWahl = {};        // uid -> { merkmal-id: true = ABgewählt }
  var offeneMerkmale = {};     // uid -> true (Muskel-Auswahl aufgeklappt)
  var sucheFokus = false;
  // Zusätze (Näd 30.9.): sichtbar, aber nicht angewählt — kommen aus
  // geladenen eigenen Status oder werden mit dem ☆ vorgemerkt.
  var angeheftet = {};         // uid -> true
  var merkmalZusatz = {};      // uid -> { merkmal-id: true } (1.10.: Muskel-Sterne)

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

    // Nachbesserung 27.9.: Der klebende Kopf lebt in der LINKEN Spalte,
    // damit die rechte Spalte (Vorschau, Kopieren) ihr eigenes Kleben
    // behält und nicht darunter verschwindet.
    var flaeche = el("div", "status-flaeche");
    var linksSpalte = el("div", "status-linksspalte");
    linksSpalte.appendChild(klebt);
    var links = el("div", "status-maske");
    TB.status.jeKategorie(m).forEach(function (block) {
      zeichneKategorie(links, m, block); });
    linksSpalte.appendChild(links);
    flaeche.appendChild(linksSpalte);
    flaeche.appendChild(zeichneRechts(m));
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

  function zeichneTeilmengen(wurzel) {
    var liste = TB.status.teilmengen();
    if (!liste.length) return;
    var zeile = el("div", "status-teilmengen");
    zeile.appendChild(el("span", "klein-hinweis", TS().teilmengenTitel));
    liste.forEach(function (t) {
      var k = el("button",
        "status-chip" + (aktiveTeilmengen[t.id] ? " aktiv" : ""), t.name);
      k.addEventListener("click", function () {
        if (aktiveTeilmengen[t.id]) {
          delete aktiveTeilmengen[t.id];
          (t.zusatz || []).forEach(function (id) {
            var nochAndersWo = liste.some(function (x) {
              return x.id !== t.id && aktiveTeilmengen[x.id] &&
                (x.zusatz || []).indexOf(id) !== -1; });
            if (!nochAndersWo) delete angeheftet[id];
          });
        }
        else {
          aktiveTeilmengen[t.id] = true;
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
        neu();
      });
      zeile.appendChild(k);
    });
    wurzel.appendChild(zeile);
  }

  function zeichneTardoc(wurzel, m) {
    var stand = TB.status.tardoc(m, gewaehltAlsMenge(m), merkmalWahl);
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
      var hinweisText = TB.status.tardocFehltText(a);
      var hinweis = el("span", "klein-hinweis status-tardoc-hinweis",
        hinweisText);
      hinweis.title = hinweisText;
      zeile.appendChild(hinweis);
      kasten.appendChild(zeile);
    });
    var fuss = el("div", "status-tardoc-fuss",
      TS().tardocHinweis.replace("%s", TB.tardocDaten.fassung));
    var lesen = el("button", "status-tardoc-lesen", TS().tardocLesenKnopf);
    lesen.addEventListener("click", zeigeKriterien);
    fuss.appendChild(lesen);
    kasten.appendChild(fuss);
    wurzel.appendChild(kasten);
  }

  // Das Nachlese-Fenster (Näds Wunsch 27.9.): beide Positionen mit
  // Gruppenliste — Zusammenfassung, jeder Titel verlinkt aufs Original.
  function zeigeKriterien() {
    var schleier = el("div", "status-schleier");
    schleier.addEventListener("click", function (e) {
      if (e.target === schleier) schleier.remove(); });
    var karte = el("div", "status-lesen-karte");
    var kopf = el("div", "status-kopf");
    kopf.appendChild(el("h3", "", TS().tardocLesenTitel));
    var zu = el("button", "", TS().tardocLesenZu);
    zu.addEventListener("click", function () { schleier.remove(); });
    kopf.appendChild(zu);
    karte.appendChild(kopf);
    karte.appendChild(el("p", "klein-hinweis", TS().tardocLesenEinleitung));
    TB.status.tardocKriterien().forEach(function (art) {
      karte.appendChild(el("h4", "", art.name));
      // Näd 28.9.: Tabelle — jede Zeile eine Gruppe, Spalten
      // Exploration B und A, in jeder Zelle die Anforderung. Die Zellen
      // sind laut Tarif in beiden Spalten identisch; der Unterschied
      // steht in der Kopfzeile (Anzahl Gruppen, Minuten).
      karte.appendChild(el("p", "klein-hinweis", TS().tardocLesenGleich));
      var huelle = el("div", "status-lesen-tabelle-huelle");
      var tab = el("table", "status-lesen-tabelle");
      var kopfzeile = el("tr");
      kopfzeile.appendChild(el("th", "", TS().tardocLesenGruppeKopf));
      [["halb", art.zeileB, art.linkB], ["gut", art.zeileA, art.linkA]]
        .forEach(function (p) {
          var th = el("th", p[0]);
          var link = el("a", "", p[1]);
          link.href = p[2]; link.target = "_blank"; link.rel = "noopener";
          th.appendChild(link);
          kopfzeile.appendChild(th);
        });
      tab.appendChild(kopfzeile);
      art.gruppen.forEach(function (g) {
        var tr = el("tr");
        tr.appendChild(el("td", "status-lesen-gruppenname", g.kopf));
        ["halb", "gut"].forEach(function (k) {
          tr.appendChild(el("td", k, g.merkmale)); });
        tab.appendChild(tr);
      });
      huelle.appendChild(tab);
      karte.appendChild(huelle);
    });
    karte.appendChild(el("p", "klein-hinweis", TS().tardocLesenStand));
    schleier.appendChild(karte);
    document.body.appendChild(schleier);
  }

  function zeichneKategorie(ziel, m, block) {
    var sichtbar = function (u) {
      if (nurGewaehlte && !istGewaehlt(u.id) && !angeheftet[u.id]) return false;
      return passtZurSuche(u);
    };
    // Gewählte und Zusätze stehen immer offen da, auch wenn sie „selten“
    // sind — sonst müsste man sie erst aufklappen und heraussuchen.
    var vorne = function (u) {
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

    var soll = TB.status.normalVon(u, merkmalWahl);
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
    var kopieren = el("button", "status-kopieren", TS().kopierenKnopf);
    kopieren.addEventListener("click", function () {
      if (!anzahl) { melde(TS().nichtsGewaehlt, true); return; }
      var f = TB.status.fliesstext(m, menge, abweichungen, merkmalWahl);
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
      TB.status.teilmengeSpeichern(name, punkte, merkmalAb, zusatz, mZusatz);
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
      var f = TB.status.fliesstext(m, menge, abweichungen, merkmalWahl);
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
