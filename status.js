// Datei: status.js
// Projekt: Textbausteine — Teil: App (Browser) UND Chrome-Erweiterung
//          (byteweise Kopie — Prüfsuite: cmp)
// Zweck: Das Herz des Status-Werks: liest und schreibt den
//        Gesamtstatus und die Teilmengen (sie liegen als
//        Einstellungs-Werte statusMaster/statusTeilmengen und syncen
//        damit auf alle Geräte — sie tauchen nirgends in Bausteinlisten,
//        im Kürzel-Weg oder in der Erweiterung auf), erzeugt aus einer
//        Auswahl den fertigen Fliesstext (HTML und reiner Text;
//        Kategorien unterstrichen, Überschriebenes fett in Dunkelgrau)
//        und zählt live die Tardoc-Gruppen (Kriterien: tardoc-daten.js).
//        GRUNDSATZ: Ein AUSGEFÜLLTER Status ist ein Patientenbefund
//        und wird NIE gespeichert — gespeichert werden nur die
//        Vorlagen (Untersuchungen, Normalbefunde, Ankreuz-Muster).
//        Die sichtbaren Texte stehen hier als eigenes Textobjekt
//        (TB.statusTexte), damit texte.js byteweise Erweiterungs-Kopie
//        bleibt — dasselbe Muster wie ansicht-kaertchen.js (E8).
//        E11: In der App kommt der Speicher aus TB.speicher; in der
//        Erweiterung setzt seite-status.js die Quelle TB.statusQuelle
//        (nur lesend — Migrationen laufen dort nie).

"use strict";
window.TB = window.TB || {};

// Die sichtbaren Texte wohnen seit E11 in status-texte.js
// (TB.statusTexte) — diese Datei war über die 600-Zeilen-Grenze gewachsen.


TB.status = (function () {
  var S = function () { return TB.speicher || TB.statusQuelle; };

  // ---- Ablage: Einstellungs-Werte, sie syncen wie alle Einstellungen --
  function master() {
    var m = S().einstellung("statusMaster", null);
    // Nachzieh-Migration (28.9.): Neuerungen der Grundausstattung —
    // aktuell die Einzelmuskel-Merkmale — werden in einen früher
    // gespeicherten Katalog sanft nachgezogen. Näds eigene Texte
    // bleiben unberührt: Nur wenn der Normalbefund noch dem der
    // Grundausstattung entspricht, kommen die Merkmale dazu.
    if (m && TB.speicher && m.stand !== TB.statusGrundlage.KATALOG_STAND) {
      m = umstellen();
    }
    if (m && TB.speicher) {
      var a = migriereMerkmale(m);
      var b = migriereNeue(m);
      var c = migriereHinweise(m);
      if (a || b || c) speichereMaster(m);
    }
    return m;
  }
  // Einmalige Umstellung (Sammelrunde 30.9.): Die neue Grundausstattung
  // wurde AUS Näds eigenem Status-Export gebaut (seine Texte, häufig/
  // selten, Reihenfolge) und enthält zusätzlich seine Aufteilungen und
  // die geprüften Tardoc-Etiketten. Darum ersetzt sie den gespeicherten
  // Katalog einmal ganz. Seine eigenen Status-Muster bleiben erhalten;
  // ihre Verweise auf aufgeteilte Untersuchungen werden umgeschlüsselt
  // (z. B. „Weber und Rinne" -> „Weber" + „Rinne").
  function umstellen() {
    var neu = TB.statusGrundlage.master();
    speichereMaster(neu);
    var liste = teilmengen();
    if (umschluessle(liste)) speichereTeilmengen(liste);
    return neu;
  }
  // Reine Hilfe (auch für den Selbsttest, ohne Speicher): Verweise der
  // Status-Muster auf aufgeteilte Untersuchungen umschlüsseln.
  function umschluessle(liste) {
    var umschl = TB.statusGrundlage.UMSCHLUESSEL || {};
    var geaendert = false;
    liste.forEach(function (t) {
      var aus = [];
      (t.punkte || []).forEach(function (p) {
        var ziel = umschl[p] || [p];
        if (umschl[p]) geaendert = true;
        ziel.forEach(function (x) { if (aus.indexOf(x) === -1) aus.push(x); });
      });
      t.punkte = aus;
      if (t.zusatz) {
        var auz = [];
        t.zusatz.forEach(function (p) {
          (umschl[p] || [p]).forEach(function (x) {
            if (auz.indexOf(x) === -1 && aus.indexOf(x) === -1) auz.push(x); });
        });
        t.zusatz = auz;
      }
      if (t.merkmalAb) {
        Object.keys(t.merkmalAb).forEach(function (uid) {
          if (umschl[uid]) { delete t.merkmalAb[uid]; geaendert = true; }
        });
      }
    });
    return geaendert;
  }
  // Nachziehen (28.9., Katalog-Ausbau): Untersuchungen, die die
  // Grundausstattung neu bekommt, werden in einen gespeicherten Katalog
  // eingefügt — an derselben Stelle, hinter dem jeweiligen Vorgänger.
  // Bestehende Einträge (auch umformulierte) bleiben unberührt.
  function migriereNeue(m) {
    var frisch = TB.statusGrundlage.master();
    var geaendert = false;
    var liste = m.untersuchungen || (m.untersuchungen = []);
    function posVon(id) {
      for (var i = 0; i < liste.length; i++)
        if (liste[i].id === id) return i;
      return -1;
    }
    frisch.untersuchungen.forEach(function (g, idx) {
      if (posVon(g.id) !== -1) return;
      var ziel = liste.length;
      if (idx > 0) {
        var vorher = posVon(frisch.untersuchungen[idx - 1].id);
        if (vorher !== -1) ziel = vorher + 1;
      }
      liste.splice(ziel, 0, JSON.parse(JSON.stringify(g)));
      geaendert = true;
    });
    return geaendert;
  }
  function migriereMerkmale(m) {
    var frisch = TB.statusGrundlage.master();
    var geaendert = false;
    (m.untersuchungen || []).forEach(function (u) {
      if (u.merkmale) return;
      var g = frisch.untersuchungen.find(function (x) {
        return x.id === u.id; });
      if (g && g.merkmale &&
          (u.normal === g.normal ||
           u.normal === "keine Defizite; im Einzelnen: " + g.normal)) {
        u.merkmale = g.merkmale;
        u.normal = g.normal;
        geaendert = true;
      }
    });
    // Zweiter Nachzieh-Schritt (28.9.): Wo die Merkmale schon da sind,
    // aber noch der alte Vorspann-Text steht, wird er auf die reine
    // Liste gehoben.
    (m.untersuchungen || []).forEach(function (u) {
      if (!u.merkmale) return;
      var g = frisch.untersuchungen.find(function (x) {
        return x.id === u.id; });
      if (g && u.normal === "keine Defizite; im Einzelnen: " + g.normal) {
        u.normal = g.normal;
        geaendert = true;
      }
    });
    return geaendert;
  }
  // Nachziehen (E11): Die Erklärzeilen (hinweis) der Grundausstattung —
  // Hoehn & Yahr und mRS — werden id-gleich ergänzt, wo sie fehlen.
  // Ein eigener hinweis-Text bleibt unberührt (analog migriereNeue).
  function migriereHinweise(m) {
    var frisch = TB.statusGrundlage.master();
    var geaendert = false;
    (m.untersuchungen || []).forEach(function (u) {
      if (u.hinweis) return;
      var g = frisch.untersuchungen.find(function (x) {
        return x.id === u.id; });
      if (g && g.hinweis) { u.hinweis = g.hinweis; geaendert = true; }
    });
    return geaendert;
  }
  function speichereMaster(m) {
    S().setzeEinstellung("statusMaster", m);
    if (TB.abgleich) TB.abgleich.anstossen();
  }
  // Das Kürzel eines Status (E11): status + Name-Kleinbuchstaben; bei
  // Kollision hängt eine Zahl an. Mit ;;kürzel öffnet der Arbeitsplatz
  // das Status-Fenster direkt in KISIM bzw. Axenita.
  function kuerzelFuerStatus(name, liste, eigenesId) {
    var basis = "stat" + String(name || "").toLowerCase()
      .replace(/\u00e4/g, "ae").replace(/\u00f6/g, "oe").replace(/\u00fc/g, "ue")
      .replace(/[^a-z0-9]/g, "").slice(0, 24);
    if (basis === "stat") basis = "statneu";
    var k = basis, nr = 1;
    function belegt(x) {
      return (liste || []).some(function (t) {
        return t.id !== eigenesId &&
          String(t.kuerzel || "").toLowerCase() === x; });
    }
    while (belegt(k)) { nr += 1; k = basis + nr; }
    return k;
  }
  function teilmengeMitKuerzel(kuerzel) {
    var k = String(kuerzel || "").toLowerCase();
    if (!k) return null;
    var liste = teilmengen();
    var finde = function (x) {
      return liste.find(function (t) {
        return String(t.kuerzel || "").toLowerCase() === x; }) || null;
    };
    var t = finde(k);
    // 17.4c: Alt-Kuerzel aus der Zeit vor dem Umzug (;;statuscts)
    // finden ihren Status weiterhin (;;statcts).
    if (!t && k.indexOf("status") === 0) t = finde("stat" + k.slice(6));
    return t;
  }
  // Die PROD-HEBUNG (E11, rein — auch Selbsttest und Probelauf rufen sie):
  // namensgleiche Teilmengen werden durch die Grundausstattung ERSETZT,
  // wenn sie weder normalAb noch zusatz noch merkmalAb tragen (das sind
  // die unberührten Chat-9-Startfassungen). Alles andere bleibt
  // unangetastet; dort werden nur fehlender Spickzettel, ☆-Zusätze und
  // das Kürzel ergänzt — und der Stroke-Status bekommt einmalig den
  // mRS nachgereicht (Näds Auftrag, 3.10.).
  function hatEigenes(t) {
    return !!((t.normalAb && Object.keys(t.normalAb).length) ||
              (t.zusatz && t.zusatz.length) ||
              (t.merkmalAb && Object.keys(t.merkmalAb).length));
  }
  function hebeTeilmengen(liste) {
    var geaendert = false;
    var da = {};
    liste.forEach(function (t, i) {
      da[String(t.name).toLowerCase()] = i; });
    TB.statusGrundlage.teilmengen().forEach(function (g) {
      var pos = da[String(g.name).toLowerCase()];
      if (pos === undefined) {
        liste.push(JSON.parse(JSON.stringify(g)));
        geaendert = true;
        return;
      }
      var bekannt = liste[pos];
      if (!hatEigenes(bekannt)) {
        liste[pos] = JSON.parse(JSON.stringify(g));
        geaendert = true;
        return;
      }
      if (!bekannt.info && g.info) { bekannt.info = g.info; geaendert = true; }
      (g.zusatz || []).forEach(function (id) {
        if ((bekannt.punkte || []).indexOf(id) !== -1) return;
        if (!bekannt.zusatz) bekannt.zusatz = [];
        if (bekannt.zusatz.indexOf(id) === -1) {
          bekannt.zusatz.push(id); geaendert = true; }
      });
      if (!bekannt.kuerzel && g.kuerzel) {
        bekannt.kuerzel = g.kuerzel; geaendert = true; }
      if (String(bekannt.name).toLowerCase() === "stroke" &&
          (bekannt.punkte || []).indexOf("mrs") === -1) {
        var beiN = bekannt.punkte.indexOf("nihss");
        if (beiN === -1) bekannt.punkte.push("mrs");
        else bekannt.punkte.splice(beiN + 1, 0, "mrs");
        geaendert = true;
      }
    });
    // Eigene Status ohne Kürzel bekommen eines aus ihrem Namen.
    liste.forEach(function (t) {
      if (t.kuerzel) return;
      t.kuerzel = kuerzelFuerStatus(t.name, liste, t.id);
      geaendert = true;
    });
    return geaendert;
  }
  // 17.4: der Kuerzel-Umzug ;;status* -> ;;stat* als eigene, auch im
  // Selbsttest pruefbare Funktion. Gibt zurueck, ob etwas geaendert wurde.
  function migriereKuerzel(liste) {
    var geaendert = false;
    (liste || []).forEach(function (t) {
      var k = String(t.kuerzel || "");
      if (k.toLowerCase().indexOf("status") !== 0) return;
      var basisNeu = "stat" + k.slice(6);
      if (basisNeu.toLowerCase() === "stat") basisNeu = "statneu";
      var fertig = basisNeu, nr = 1;
      while (liste.some(function (x) { return x !== t &&
        String(x.kuerzel || "").toLowerCase() === fertig.toLowerCase(); })) {
        nr += 1; fertig = basisNeu + nr; }
      t.kuerzel = fertig; geaendert = true;
    });
    return geaendert;
  }
  var teilmengenGeprueft = false;
  function migriereTeilmengen() {
    if (teilmengenGeprueft || !TB.speicher) return;
    teilmengenGeprueft = true;
    // 17.4 (GROSSE MIGRATION, Naed 5.10.): ;;status* wird ;;stat*.
    // Laeuft einmal ueber den Bestand, unabhaengig vom Stand-Gate.
    var kliste = S().einstellung("statusTeilmengen", []) || [];
    if (migriereKuerzel(kliste))
      S().setzeEinstellung("statusTeilmengen", kliste);
    var soll = TB.statusGrundlage.TEILMENGEN_STAND;
    if (S().einstellung("statusTeilmengenStand", "") === soll) return;
    var liste = S().einstellung("statusTeilmengen", []) || [];
    var vorher = JSON.stringify(liste);
    // Die drei Probe-Status vom 2.10. räumen (Näd, 3.10.).
    var weg = { tmujo0aw3: 1, tmulcjtyu: 1, tmupyrmig: 1 };
    liste = liste.filter(function (t) { return !weg[t.id]; });
    hebeTeilmengen(liste);
    if (JSON.stringify(liste) !== vorher) speichereTeilmengen(liste);
    S().setzeEinstellung("statusTeilmengenStand", soll);
  }
  function teilmengen() {
    migriereTeilmengen();
    var liste = S().einstellung("statusTeilmengen", []) || [];
    // 17.4c: Der Kuerzel-Umzug ;;status* -> ;;stat* prueft bei JEDEM
    // Zugriff. Grund (Naed, Spital 6.10.): im frischen Fenster ist der
    // Bestand beim allerersten Lauf oft noch leer und trifft erst
    // danach per Abgleich ein — ein einmaliger Lauf verpasst ihn.
    if (liste.some(function (t) {
          return /^status/i.test(String(t.kuerzel || "")); }) &&
        migriereKuerzel(liste)) {
      S().setzeEinstellung("statusTeilmengen", liste);
      if (TB.abgleich) TB.abgleich.anstossen();
    }
    return liste;
  }
  function speichereTeilmengen(liste) {
    S().setzeEinstellung("statusTeilmengen", liste);
    if (TB.abgleich) TB.abgleich.anstossen();
  }
  function grundausstattung(nurLeereTeilmengen) {
    speichereMaster(TB.statusGrundlage.master());
    if (!nurLeereTeilmengen || !teilmengen().length) {
      speichereTeilmengen(TB.statusGrundlage.teilmengen());
    }
  }

  // ---- Zugriffe auf den Master ----------------------------------------
  function untersuchung(m, id) {
    return m.untersuchungen.find(function (x) { return x.id === id; }) || null;
  }
  function jeKategorie(m) {
    // Liefert die Kategorien in ihrer Reihenfolge, jede mit ihren
    // Untersuchungen in Listen-Reihenfolge (die Liste IST die Ordnung).
    return m.kategorien.map(function (k) {
      return { kategorie: k, untersuchungen: m.untersuchungen.filter(
        function (x) { return x.kategorie === k.id; }) };
    });
  }
  function neueUntersuchungsId(m, wunsch) {
    var basis = String(wunsch || "u").toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
      .replace(/[^a-z0-9]/g, "").slice(0, 24) || "u";
    var id = basis, nr = 1;
    while (untersuchung(m, id)) { nr += 1; id = basis + nr; }
    return id;
  }

  // ---- Fliesstext (HTML und reiner Text) ------------------------------
  // Kategorien unterstrichen, jede auf neuer Zeile; Untersuchungen als
  // „Name: Befund.“; Überschriebenes fett in Dunkelgrau (Näd 26.9.).
  var ABWEICHFARBE = "#000000";
  function schuetze(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function mitPunkt(t) {
    var s = String(t || "").trim();
    if (!s) return s;
    return /[.!?…]$/.test(s) ? s : s + ".";
  }
  // Motorik-Merkmale (Nachbesserung 27.9.): Bei Untersuchungen mit
  // Einzelmerkmalen (Einzelkraftprüfung Arme/Beine) wird der
  // Normalbefund aus den GEWÄHLTEN Merkmalen zusammengesetzt.
  // merkmalWahl[uid] ist eine Menge ABGEWÄHLTER Merkmal-Kennungen;
  // fehlt sie, sind alle Merkmale an (Standard).
  function merkmalAn(merkmalWahl, uid, mid) {
    return !(merkmalWahl && merkmalWahl[uid] && merkmalWahl[uid][mid]);
  }
  function gewaehlteMerkmale(u, merkmalWahl) {
    if (!u.merkmale) return null;
    return u.merkmale.filter(function (mk) {
      return merkmalAn(merkmalWahl, u.id, mk.id); });
  }
  // Näd 28.9.: ohne "keine Defizite"-Vorspann — sonst müsste man bei
  // einem Defizit zwei Stellen ändern. Der Befund ist die reine Liste.
  // normalUeber (2.10., Näd): je Teilmenge ABGEÄNDERTE Standardtexte —
  // sie ERSETZEN den Normalbefund dieser Untersuchung und erscheinen
  // darum nirgends fett. Gespeichert in der Teilmenge als normalAb.
  function normalVon(u, merkmalWahl, normalUeber) {
    if (normalUeber && normalUeber[u.id] !== undefined)
      return normalUeber[u.id];
    if (!u.merkmale) return u.normal;
    var an = gewaehlteMerkmale(u, merkmalWahl);
    if (!an.length) return "xx.";
    return an.map(function (mk) {
      return mk.name + " " + (mk.wert || "M5/M5"); }).join(", ") + ".";
  }

  function befundVon(u, abweichungen, merkmalWahl, normalUeber) {
    var soll = normalVon(u, merkmalWahl, normalUeber);
    var a = abweichungen && abweichungen[u.id];
    if (a !== undefined && a !== null && String(a).trim() !== "" &&
        String(a).trim() !== String(soll).trim()) {
      return { text: mitPunkt(a), abweichend: true, normal: soll };
    }
    return { text: mitPunkt(soll), abweichend: false, normal: soll };
  }
  function fliesstext(m, gewaehlt, abweichungen, merkmalWahl, normalUeber) {
    var html = [], text = [];
    jeKategorie(m).forEach(function (block) {
      var teile = block.untersuchungen.filter(function (u) {
        return !!gewaehlt[u.id]; });
      if (!teile.length) return;
      var zeileHtml = "<u>" + schuetze(block.kategorie.name) + ":</u> ";
      var zeileText = block.kategorie.name + ": ";
      var stueckeH = [], stueckeT = [];
      teile.forEach(function (u) {
        var b = befundVon(u, abweichungen, merkmalWahl, normalUeber);
        var satzT = u.name + ": " + b.text;
        stueckeT.push(satzT);
        var satzH;
        if (b.abweichend) {
          // 5.10. (Näd, am Beispiel Sulcus n. ulnaris): Bei einer
          // Überschreibung wird die GANZE Angabe fett — Name UND
          // kompletter Befund —, nicht nur der veränderte Wortbereich.
          satzH = "<b><span style=\"color:" + ABWEICHFARBE + "\">" +
                  schuetze(u.name + ": " + b.text) + "</span></b>";
        } else {
          satzH = schuetze(u.name) + ": " + schuetze(b.text);
        }
        stueckeH.push(satzH);
      });
      html.push("<p>" + zeileHtml + stueckeH.join(" ") + "</p>");
      text.push(zeileText + stueckeT.join(" "));
    });
    return { html: html.join(""), text: text.join("\n") };
  }

  // Wort-Unterschied zwischen Normalbefund und überschriebenem Befund:
  // gemeinsamer Anfang und gemeinsames Ende (auf Wortgrenzen gerundet)
  // bleiben normal, der Bereich vom ersten bis zum letzten veränderten
  // Wort wird hervorgehoben. Ist alles anders, ist alles hervorgehoben.
  function wortUnterschied(normal, abw) {
    var a = String(normal), b = String(abw);
    var vorn = 0, hinten = 0;
    while (vorn < a.length && vorn < b.length &&
           a.charAt(vorn) === b.charAt(vorn)) vorn++;
    while (hinten < a.length - vorn && hinten < b.length - vorn &&
           a.charAt(a.length - 1 - hinten) === b.charAt(b.length - 1 - hinten))
      hinten++;
    // Auf Wortgrenzen zurückrunden, damit nie ein halbes Wort
    // hervorgehoben wird ("8/8" → "4/6" hebt das ganze Stück hervor).
    while (vorn > 0 && b.charAt(vorn - 1) !== " ") vorn--;
    while (hinten > 0 && b.charAt(b.length - hinten) !== " ") hinten--;
    var mitte = b.slice(vorn, b.length - hinten);
    // Messwort mitnehmen (Näd 27.9.): Beginnt der veränderte Bereich
    // mit einem Wert (Ziffern, /, +, −), wird das Wort davor — die
    // Bezeichnung der Messstelle — mit hervorgehoben:
    // „malleolär 4/6" statt nur „4/6".
    if (mitte && vorn > 0) {
      var erstes = mitte.split(" ")[0];
      if (/[0-9\/+−-]/.test(erstes)) {
        var davor = b.lastIndexOf(" ", vorn - 2);
        if (davor >= 0 && /[A-Za-zÄÖÜäöü]/.test(b.charAt(davor + 1))) {
          vorn = davor + 1;
          mitte = b.slice(vorn, b.length - hinten);
        }
      }
    }
    if (!mitte) { vorn = 0; hinten = 0; mitte = b; }
    return { vor: b.slice(0, vorn), mitte: mitte,
             nach: b.slice(b.length - hinten) };
  }

  // ---- Tardoc-Zählung --------------------------------------------------
  // Je Statusart und Gruppe wird die MENGE der Merkmal-Namen der
  // angekreuzten Untersuchungen gezählt (Muskeln als Anzahl). Eine
  // Gruppe ist erfüllt, wenn ihre Mindestzahl erreicht ist; A verlangt
  // mindestens 4 erfüllte Gruppen.
  function tardoc(m, gewaehlt, merkmalWahl) {
    var daten = TB.tardocDaten.arten;
    var stand = {};
    Object.keys(daten).forEach(function (art) { stand[art] = {}; });
    m.untersuchungen.forEach(function (u) {
      if (!gewaehlt[u.id] || !u.tardoc) return;
      u.tardoc.forEach(function (e) {
        if (!daten[e.a] || !daten[e.a].gruppen[e.g]) return;
        var z = stand[e.a][e.g] ||
                (stand[e.a][e.g] = { namen: {}, muskeln: 0 });
        (e.m || []).forEach(function (name) { z.namen[name] = true; });
        if (e.muskeln) {
          var anzahl = u.merkmale
            ? gewaehlteMerkmale(u, merkmalWahl).length : e.muskeln;
          z.muskeln += anzahl;
        }
      });
    });
    var ergebnis = {};
    Object.keys(daten).forEach(function (art) {
      var d = daten[art];
      var gruppen = [], erfuellte = 0;
      Object.keys(d.gruppen).forEach(function (g) {
        var soll = d.gruppen[g].min;
        var z = stand[art][g];
        var ist = z ? Object.keys(z.namen).length + z.muskeln : 0;
        // Tarif (Gruppen 4/5): EINE Muskelausdauerbelastung erfüllt die
        // Gruppe allein — als Alternative zu den Einzelmuskeln (30.9.).
        if (z && d.gruppen[g].einheit && z.namen["Muskelausdauerbelastung"]) ist = soll;
        if (ist > soll) ist = soll;   // Anzeige nie über dem Soll
        var voll = ist >= soll;
        if (voll) erfuellte += 1;
        gruppen.push({ nummer: Number(g), name: d.gruppen[g].name,
                       ist: ist, soll: soll, erfuellt: voll });
      });
      var stufe = erfuellte >= d.minGruppenA ? "A" : (erfuellte > 0 ? "B" : "–");
      // „Am nächsten“: begonnene, unerfüllte Gruppen zuerst (nach
      // Fortschritt), dann die mit dem kleinsten Soll.
      var offene = gruppen.filter(function (g) { return !g.erfuellt; });
      offene.sort(function (a, b) {
        var fa = a.ist / a.soll, fb = b.ist / b.soll;
        if (fb !== fa) return fb - fa;
        return a.soll - b.soll;
      });
      ergebnis[art] = { name: d.name, stufe: stufe, erfuellte: erfuellte,
                        noetig: d.minGruppenA, gruppen: gruppen,
                        naechste: offene.slice(0, 3) };
    });
    return ergebnis;
  }
  function tardocFehltText(a) {
    var TS = TB.statusTexte;
    if (a.stufe === "A") {
      return TS.tardocErfuellt.replace("%s", a.name)
        .replace("%s", String(a.erfuellte));
    }
    var fehlen = a.noetig - a.erfuellte;
    var naechste = a.naechste.map(function (g) {
      return g.name + " (" + g.ist + " von " + g.soll + ")"; }).join(", ");
    if (!naechste) naechste = TS.tardocKeine;
    var vorlage = fehlen === 1 ? TS.tardocFuerAFehlt1 : TS.tardocFuerAFehlt;
    var t = vorlage.replace("%s", a.name);
    if (fehlen !== 1) t = t.replace("%s", String(fehlen));
    return t.replace("%s", naechste);
  }

  // ---- Teilmengen ------------------------------------------------------
  // zusatz (30.9.): Untersuchungen, die bei diesem Status manchmal
  // dazukommen — sie erscheinen beim Laden sichtbar, aber NICHT angewählt.
  // merkmalZusatz (1.10.): je Untersuchung die Muskeln mit Stern —
  // sichtbar markiert, aber nicht angewählt.
  function teilmengeSpeichern(name, punkte, merkmalAb, zusatz, merkmalZusatz, normalAb) {
    var mz = (merkmalZusatz && Object.keys(merkmalZusatz).length) ? merkmalZusatz : null;
    var na = (normalAb && Object.keys(normalAb).length) ? normalAb : null;
    var liste = teilmengen();
    var da = liste.find(function (t) {
      return t.name.toLowerCase() === String(name).toLowerCase(); });
    var zu = (zusatz || []).filter(function (id) {
      return punkte.indexOf(id) === -1; });
    if (da) { da.punkte = punkte.slice();
              if (merkmalAb) da.merkmalAb = merkmalAb;
              if (zu.length) da.zusatz = zu; else delete da.zusatz;
              if (mz) da.merkmalZusatz = mz; else delete da.merkmalZusatz;
              if (na) da.normalAb = na; else delete da.normalAb; }
    else {
      var eintrag = { id: "t" + Date.now().toString(36),
                      name: String(name), punkte: punkte.slice() };
      eintrag.kuerzel = kuerzelFuerStatus(name, liste, eintrag.id);
      if (merkmalAb) eintrag.merkmalAb = merkmalAb;
      if (zu.length) eintrag.zusatz = zu;
      if (mz) eintrag.merkmalZusatz = mz;
      if (na) eintrag.normalAb = na;
      liste.push(eintrag);
    }
    speichereTeilmengen(liste);
    return !da;
  }

  // ---- Tardoc-Nachlese (Näds Wunsch 27.9.): Die Kriterien beider
  // Statusarten als lesbare Struktur — Zusammenfassung aus
  // tardoc-daten.js, mit Original-Links zum Prüfen.
  function tardocKriterien() {
    var T = TB.statusTexte;
    var daten = TB.tardocDaten.arten;
    return Object.keys(daten).map(function (art) {
      var d = daten[art];
      var minB = d.dauerB ? T.tardocLesenMin.replace("%s", d.dauerB) : "";
      var minA = d.dauerA ? T.tardocLesenMin.replace("%s", d.dauerA) : "";
      var gruppen = Object.keys(d.gruppen).map(function (nr) {
        var g = d.gruppen[nr];
        var vorlage = g.einheit === "Muskeln"
          ? T.tardocLesenGruppeMuskeln : T.tardocLesenGruppe;
        return { nr: nr,
          kopf: vorlage.replace("%s", nr).replace("%s", g.name)
                       .replace("%s", g.min),
          merkmale: g.merkmale || "" };
      });
      return { art: art, name: d.name,
        zeileB: T.tardocLesenB.replace("%s", d.titelB)
          .replace("%s", d.positionB).replace("%s", minB),
        zeileA: T.tardocLesenA.replace("%s", d.titelA)
          .replace("%s", d.positionA).replace("%s", minA),
        linkA: d.linkA, linkB: d.linkB, gruppen: gruppen };
    });
  }

  // ---- Export (Sammelrunde 27.9.): Gesamtstatus + eigene Status als
  // Datei, Dateiname nach der Berichts-Regel (Gerät, Datum, Zeit mit
  // Sekunden). Enthält NUR Vorlagen — nie einen ausgefüllten Befund.
  function exportDatei() {
    var jetzt = new Date();
    function zwei(n) { return (n < 10 ? "0" : "") + n; }
    var stempel = jetzt.getFullYear() + "-" + zwei(jetzt.getMonth() + 1) +
      "-" + zwei(jetzt.getDate()) + "-" + zwei(jetzt.getHours()) +
      "-" + zwei(jetzt.getMinutes()) + "-" + zwei(jetzt.getSeconds());
    var name = "Status-Export-" + S().geraet() + "-" + stempel + ".json";
    var inhalt = JSON.stringify({ art: "textbausteine-status-export",
      fassung: TB.FASSUNG, erstellt: jetzt.toISOString(),
      kiAnleitung: {
        zweck: "Status-Werk der Textbausteine-App (Näd, Neurologe). master = Gesamtkatalog der Untersuchungen (id, kategorie, name, normal, haeufig, tardoc-Etiketten, bei Einzelkraftprüfungen merkmale mit Untergruppen). teilmengen = Näds eigene Status-Vorlagen (punkte = Untersuchungs-ids, merkmalAb = je Untersuchung abgewählte Merkmal-ids).",
        fuerDich: "Vergleiche diesen Stand mit der von Claude gelieferten Grundausstattung (status-grundlage.js der genannten App-Fassung): Abweichungen in master sind Näds bewusste Anpassungen — übernehmen statt überschreiben. Neue Untersuchungen brauchen eindeutige id, Kategorie aus KATEGORIEN, Normalbefund mit Punkt am Ende und wo passend Tardoc-Etiketten n(gruppe,[merkmale]) bzw. h(...).",
        geliefertMit: "App " + TB.FASSUNG
      },
      master: master(), teilmengen: teilmengen() }, null, 2);
    var blob = new Blob([inhalt], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return name;
  }

  return { master: master, speichereMaster: speichereMaster,
           teilmengen: teilmengen, speichereTeilmengen: speichereTeilmengen,
           teilmengeSpeichern: teilmengeSpeichern,
           grundausstattung: grundausstattung,
           untersuchung: untersuchung, jeKategorie: jeKategorie,
           neueUntersuchungsId: neueUntersuchungsId,
           fliesstext: fliesstext, tardoc: tardoc,
           tardocFehltText: tardocFehltText,
           wortUnterschied: wortUnterschied,
           normalVon: normalVon, gewaehlteMerkmale: gewaehlteMerkmale,
           migriereMerkmale: migriereMerkmale,
           migriereNeue: migriereNeue,
           migriereHinweise: migriereHinweise,
           hebeTeilmengen: hebeTeilmengen,
           migriereKuerzel: migriereKuerzel, hatEigenes: hatEigenes,
           kuerzelFuerStatus: kuerzelFuerStatus,
           teilmengeMitKuerzel: teilmengeMitKuerzel,
           merkmalAn: merkmalAn,
           tardocKriterien: tardocKriterien,
           umschluessle: umschluessle,
           exportDatei: exportDatei };
})();
