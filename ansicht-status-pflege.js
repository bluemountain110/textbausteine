// Datei: ansicht-status-pflege.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Die Status-Pflege: Kategorien anlegen, umbenennen und ordnen;
//        Untersuchungen ordnen (▲▼), zwischen Kategorien verschieben,
//        häufig/selten umschalten, Name, Normalbefund und
//        Tardoc-Etiketten bearbeiten, neue Untersuchungen anlegen;
//        eigene Status (Ankreuz-Muster) umbenennen und löschen;
//        Grundausstattung neu laden. Jede Änderung wird sofort
//        gespeichert und synct über die Einstellungen auf alle Geräte.

"use strict";
window.TB = window.TB || {};

TB.ansichtStatusPflege = (function () {
  var TS = function () { return TB.statusTexte; };
  var el = function (a, k, t) { return TB.ui.el(a, k, t); };
  var melde = function (t, w) { TB.ui.melde(t, w); };

  function wurzel() { return document.getElementById("inhalt"); }
  function speichere(m) { TB.status.speichereMaster(m); }
  function neu() { zeichne(wurzel()); }
  function zurueck() { TB.ansichtStatus.zeichne(wurzel()); }

  // ---- Ordnen und Verschieben -----------------------------------------
  function tauscheInListe(liste, a, b) {
    var t = liste[a]; liste[a] = liste[b]; liste[b] = t;
  }
  function verschiebeUntersuchung(m, id, richtung) {
    var u = TB.status.untersuchung(m, id);
    var eigene = m.untersuchungen.filter(function (x) {
      return x.kategorie === u.kategorie; });
    var stelle = eigene.indexOf(u);
    var nachbar = eigene[stelle + richtung];
    if (!nachbar) return;
    tauscheInListe(m.untersuchungen,
      m.untersuchungen.indexOf(u), m.untersuchungen.indexOf(nachbar));
    speichere(m); neu();
  }
  // Ziehen und Ablegen (Näd 30.9.): eine Untersuchung mit der Maus an
  // jede beliebige Stelle ziehen — auch in eine andere Kategorie. Sie
  // landet vor bzw. hinter der Zeile, über der sie losgelassen wird
  // (obere/untere Hälfte). Reine Hilfe, ohne Bildschirm testbar.
  function zieheNach(m, id, zielId, dahinter) {
    if (id === zielId) return false;
    var u = TB.status.untersuchung(m, id);
    var ziel = TB.status.untersuchung(m, zielId);
    if (!u || !ziel) return false;
    m.untersuchungen.splice(m.untersuchungen.indexOf(u), 1);
    u.kategorie = ziel.kategorie;
    var stelle = m.untersuchungen.indexOf(ziel) + (dahinter ? 1 : 0);
    m.untersuchungen.splice(stelle, 0, u);
    return true;
  }
  var gezogenId = null;
  function ziehbar(m, z, u) {
    z.draggable = true;
    z.addEventListener("dragstart", function (ev) {
      gezogenId = u.id;
      z.classList.add("wird-gezogen");
      try { ev.dataTransfer.setData("text/plain", u.id); } catch (e) { }
      ev.dataTransfer.effectAllowed = "move";
    });
    z.addEventListener("dragend", function () {
      gezogenId = null; z.classList.remove("wird-gezogen");
    });
    function haelfte(ev) {
      var r = z.getBoundingClientRect();
      return (ev.clientY - r.top) > r.height / 2;
    }
    z.addEventListener("dragover", function (ev) {
      if (!gezogenId || gezogenId === u.id) return;
      ev.preventDefault();
      var unten = haelfte(ev);
      z.classList.toggle("ablage-oben", !unten);
      z.classList.toggle("ablage-unten", unten);
    });
    z.addEventListener("dragleave", function () {
      z.classList.remove("ablage-oben", "ablage-unten");
    });
    z.addEventListener("drop", function (ev) {
      ev.preventDefault();
      z.classList.remove("ablage-oben", "ablage-unten");
      if (zieheNach(m, gezogenId, u.id, haelfte(ev))) { speichere(m); neu(); }
      gezogenId = null;
    });
  }
  function inKategorie(m, u, katId) {
    // Ans Ende der Ziel-Kategorie stellen, damit die Reihenfolge
    // vorhersehbar bleibt.
    m.untersuchungen.splice(m.untersuchungen.indexOf(u), 1);
    u.kategorie = katId;
    var letzte = -1;
    m.untersuchungen.forEach(function (x, i) {
      if (x.kategorie === katId) letzte = i; });
    m.untersuchungen.splice(letzte + 1, 0, u);
  }

  // ---- Zeichnen --------------------------------------------------------
  function zeichne(ziel) {
    ziel.textContent = "";
    var m = TB.status.master();
    if (!m) { zurueck(); return; }

    var kopf = el("div", "status-kopf");
    kopf.appendChild(el("h2", "", TS().pflegeTitel));
    var rk = el("button", "", TS().zurueckZumAusfuellen);
    rk.addEventListener("click", zurueck);
    kopf.appendChild(rk);
    ziel.appendChild(kopf);
    ziel.appendChild(el("p", "klein-hinweis", TS().pflegeHinweis));

    // Sammelrunde 27.9.: Der ganze Status-Stand als Datei — zum
    // Aufheben oder um ihn Claude zu schicken (Grundausstattungs-Pflege).
    var exportK = el("button", "", TS().exportKnopf);
    exportK.title = TS().exportHinweis;
    exportK.addEventListener("click", function () {
      var name = TB.status.exportDatei();
      melde(TS().exportFertig.replace("%s", name));
    });
    ziel.appendChild(el("div", "status-exportzeile")).appendChild(exportK);

    TB.status.jeKategorie(m).forEach(function (block, nr, alle) {
      ziel.appendChild(zeichneKategorie(m, block, nr, alle.length));
    });

    var kneu = el("button", "", TS().kategorieNeu);
    kneu.addEventListener("click", function () {
      var name = prompt(TS().kategorieName, "");
      if (!name || !name.trim()) return;
      var id = TB.status.neueUntersuchungsId(
        { untersuchungen: m.kategorien }, name.trim());
      m.kategorien.push({ id: "k" + id, name: name.trim() });
      speichere(m); neu();
    });
    ziel.appendChild(kneu);

    zeichneTeilmengen(ziel);

    var laden = el("button", "status-grundneu",
      TS().grundausstattungNeuKnopf);
    laden.addEventListener("click", function () {
      if (!confirm(TS().grundausstattungWarnung)) return;
      TB.status.grundausstattung(true);
      melde(TS().grundausstattungFertig); neu();
    });
    ziel.appendChild(laden);
  }

  function zeichneKategorie(m, block, nr, anzahl) {
    var kasten = el("section", "status-kategorie");
    var kzeile = el("div", "status-pflege-katzeile");
    kzeile.appendChild(pfeil(TS().hoch, nr === 0, function () {
      tauscheInListe(m.kategorien, nr, nr - 1); speichere(m); neu(); }));
    kzeile.appendChild(pfeil(TS().runter, nr === anzahl - 1, function () {
      tauscheInListe(m.kategorien, nr, nr + 1); speichere(m); neu(); }));
    var name = el("h3", "", block.kategorie.name);
    name.title = TS().kategorieName;
    name.addEventListener("click", function () {
      var frisch = prompt(TS().kategorieName, block.kategorie.name);
      if (!frisch || !frisch.trim()) return;
      block.kategorie.name = frisch.trim(); speichere(m); neu();
    });
    kzeile.appendChild(name);
    if (!block.untersuchungen.length) {
      var weg = el("button", "status-klein", TS().loeschenKnopf);
      weg.addEventListener("click", function () {
        m.kategorien.splice(m.kategorien.indexOf(block.kategorie), 1);
        speichere(m); neu();
      });
      kzeile.appendChild(weg);
    }
    kasten.appendChild(kzeile);

    block.untersuchungen.forEach(function (u, i) {
      kasten.appendChild(zeichneUntersuchung(m, u, i,
        block.untersuchungen.length));
    });

    var uneu = el("button", "status-klein", TS().untersuchungNeu);
    uneu.addEventListener("click", function () {
      var u = { id: "", kategorie: block.kategorie.id, name: "",
                normal: "", haeufig: true, tardoc: [] };
      bearbeiten(m, u, true);
    });
    kasten.appendChild(uneu);
    return kasten;
  }

  function pfeil(zeichen, aus, tun) {
    var k = el("button", "status-pfeil", zeichen);
    if (aus) k.disabled = true;
    k.addEventListener("click", tun);
    return k;
  }

  function zeichneUntersuchung(m, u, i, anzahl) {
    var z = el("div", "status-pflege-zeile");
    var griff = el("span", "status-griff", "\u2807");
    griff.title = TS().ziehenHinweis;
    z.appendChild(griff);
    ziehbar(m, z, u);
    z.appendChild(pfeil(TS().hoch, i === 0, function () {
      verschiebeUntersuchung(m, u.id, -1); }));
    z.appendChild(pfeil(TS().runter, i === anzahl - 1, function () {
      verschiebeUntersuchung(m, u.id, 1); }));

    var marke = el("button", "status-marke" + (u.haeufig ? " haeufig" : ""),
      u.haeufig ? TS().haeufigMarke : TS().seltenMarke);
    marke.title = TS().feldHaeufig;
    marke.addEventListener("click", function () {
      u.haeufig = !u.haeufig; speichere(m); neu(); });
    z.appendChild(marke);

    var name = el("span", "status-name", u.name);
    name.addEventListener("click", function () { bearbeiten(m, u, false); });
    z.appendChild(name);
    var text = el("span", "status-befund status-pflege-befund", u.normal);
    text.addEventListener("click", function () { bearbeiten(m, u, false); });
    z.appendChild(text);

    var wahl = el("select", "status-katwahl");
    m.kategorien.forEach(function (k) {
      var o = el("option", "", k.name);
      o.value = k.id;
      if (k.id === u.kategorie) o.selected = true;
      wahl.appendChild(o);
    });
    wahl.addEventListener("change", function () {
      inKategorie(m, u, wahl.value); speichere(m); neu(); });
    z.appendChild(wahl);
    return z;
  }

  // ---- Bearbeiten-Fenster ----------------------------------------------
  function bearbeiten(m, u, istNeu) {
    var d = el("dialog", "status-dialog");
    d.appendChild(el("h3", "", istNeu ? TS().untersuchungNeu : u.name));

    function feldzeile(beschriftung, feld) {
      var z = el("div", "feldzeile");
      z.appendChild(el("label", "", beschriftung));
      z.appendChild(feld);
      d.appendChild(z);
      return feld;
    }
    var fName = feldzeile(TS().feldName, el("input"));
    fName.value = u.name;
    var fNormal = feldzeile(TS().feldNormal, el("textarea"));
    fNormal.rows = 3; fNormal.value = u.normal;
    var fHaeufig = el("input"); fHaeufig.type = "checkbox";
    fHaeufig.checked = !!u.haeufig;
    feldzeile(TS().feldHaeufig, fHaeufig);
    var fKat = el("select");
    m.kategorien.forEach(function (k) {
      var o = el("option", "", k.name); o.value = k.id;
      if (k.id === u.kategorie) o.selected = true;
      fKat.appendChild(o);
    });
    feldzeile(TS().feldKategorie, fKat);

    // Tardoc-Etiketten: bestehende zeigen und entfernen, neue anlegen.
    var etiketten = (u.tardoc || []).slice();
    var eKasten = el("div", "status-etiketten");
    d.appendChild(el("div", "klein-hinweis", TS().feldTardoc));
    d.appendChild(eKasten);
    function zeichneEtiketten() {
      eKasten.textContent = "";
      if (!etiketten.length) {
        eKasten.appendChild(el("span", "klein-hinweis",
          TS().tardocKeineEtiketten));
      }
      etiketten.forEach(function (e, nr) {
        var art = TB.tardocDaten.arten[e.a];
        var g = art && art.gruppen[e.g];
        var text = (art ? art.name : e.a) + " · G" + e.g +
          (g ? " " + g.name : "") +
          (e.muskeln ? " · " + e.muskeln + " " + (g && g.einheit || "Muskeln")
                     : (e.m && e.m.length ? " · " + e.m.join(", ") : ""));
        var zeile = el("div", "status-etikett", text);
        var weg = el("button", "status-klein", "×");
        weg.addEventListener("click", function () {
          etiketten.splice(nr, 1); zeichneEtiketten(); });
        zeile.appendChild(weg);
        eKasten.appendChild(zeile);
      });
    }
    zeichneEtiketten();

    var eNeu = el("div", "status-etikett-neu");
    var wArt = el("select");
    Object.keys(TB.tardocDaten.arten).forEach(function (a) {
      var o = el("option", "", TB.tardocDaten.arten[a].name);
      o.value = a; wArt.appendChild(o);
    });
    var wGruppe = el("select");
    function fuelleGruppen() {
      wGruppe.textContent = "";
      var art = TB.tardocDaten.arten[wArt.value];
      Object.keys(art.gruppen).forEach(function (g) {
        var o = el("option", "", "G" + g + " " + art.gruppen[g].name);
        o.value = g; wGruppe.appendChild(o);
      });
    }
    wArt.addEventListener("change", fuelleGruppen);
    fuelleGruppen();
    var wMerkmale = el("input");
    wMerkmale.placeholder = TS().tardocMerkmale;
    var wMuskeln = el("input");
    wMuskeln.type = "number"; wMuskeln.min = "0";
    wMuskeln.placeholder = TS().tardocMuskeln;
    wMuskeln.className = "status-muskeln";
    var wDazu = el("button", "status-klein", TS().tardocNeu);
    wDazu.addEventListener("click", function () {
      var e = { a: wArt.value, g: Number(wGruppe.value) };
      var namen = wMerkmale.value.split(",").map(function (t) {
        return t.trim(); }).filter(Boolean);
      if (namen.length) e.m = namen;
      var mus = parseInt(wMuskeln.value, 10);
      if (mus > 0) e.muskeln = mus;
      if (!e.m && !e.muskeln) return;
      etiketten.push(e);
      wMerkmale.value = ""; wMuskeln.value = "";
      zeichneEtiketten();
    });
    [wArt, wGruppe, wMerkmale, wMuskeln, wDazu].forEach(function (x) {
      eNeu.appendChild(x); });
    d.appendChild(eNeu);

    var knoepfe = el("div", "dialog-knoepfe");
    if (!istNeu) {
      var weg = el("button", "", TS().loeschenKnopf);
      weg.addEventListener("click", function () {
        if (!confirm(TS().untersuchungLoeschenFrage
              .replace("%s", u.name))) return;
        m.untersuchungen.splice(m.untersuchungen.indexOf(u), 1);
        // Aus allen Ankreuz-Mustern austragen, damit nichts ins Leere zeigt.
        var liste = TB.status.teilmengen();
        liste.forEach(function (t) {
          t.punkte = t.punkte.filter(function (p) { return p !== u.id; });
        });
        TB.status.speichereTeilmengen(liste);
        speichere(m); d.close(); neu();
      });
      knoepfe.appendChild(weg);
    }
    var ab = el("button", "", TS().abbrechen);
    ab.addEventListener("click", function () { d.close(); });
    knoepfe.appendChild(ab);
    var ok = el("button", "knopf-fett", TS().speichern);
    ok.addEventListener("click", function () {
      if (!fName.value.trim() || !fNormal.value.trim()) return;
      u.name = fName.value.trim();
      u.normal = fNormal.value.trim();
      u.haeufig = fHaeufig.checked;
      u.tardoc = etiketten;
      if (istNeu) {
        u.id = TB.status.neueUntersuchungsId(m, u.name);
        u.kategorie = fKat.value;
        m.untersuchungen.push(u);   // steht damit am Ende seiner Kategorie
      } else if (fKat.value !== u.kategorie) {
        inKategorie(m, u, fKat.value);
      }
      speichere(m); d.close(); melde(TS().gespeichert); neu();
    });
    knoepfe.appendChild(ok);
    d.appendChild(knoepfe);
    TB.ui.dialogOeffnen(d);
  }

  // ---- Eigene Status (Teilmengen) --------------------------------------
  function zeichneTeilmengen(ziel) {
    var kasten = el("section", "status-kategorie");
    kasten.appendChild(el("h3", "", TS().teilmengePflegeTitel));
    var liste = TB.status.teilmengen();
    if (!liste.length) {
      kasten.appendChild(el("p", "klein-hinweis", TS().tardocKeineEtiketten));
    }
    liste.forEach(function (t, nr) {
      var z = el("div", "status-pflege-zeile");
      z.appendChild(pfeil(TS().hoch, nr === 0, function () {
        tauscheInListe(liste, nr, nr - 1);
        TB.status.speichereTeilmengen(liste); neu(); }));
      z.appendChild(pfeil(TS().runter, nr === liste.length - 1, function () {
        tauscheInListe(liste, nr, nr + 1);
        TB.status.speichereTeilmengen(liste); neu(); }));
      z.appendChild(el("span", "status-name",
        t.name + " (" + t.punkte.length + ")"));
      if (t.kuerzel) z.appendChild(
        el("span", "klein-hinweis status-pflege-kuerzel", ";;" + t.kuerzel));
      // E11: „selten“ — der Status verschwindet aus der Chip-Zeile und
      // erscheint erst nach „Seltene anzeigen“ (analog Untersuchungen).
      var sl = el("label", "status-pflege-selten");
      var sk = el("input");
      sk.type = "checkbox";
      sk.checked = !!t.selten;
      sk.addEventListener("change", function () {
        if (sk.checked) t.selten = true; else delete t.selten;
        TB.status.speichereTeilmengen(liste);
      });
      sl.appendChild(sk);
      sl.appendChild(document.createTextNode(" " + TS().seltenHaekchen));
      z.appendChild(sl);
      var kk = el("button", "status-klein", TS().kuerzelKnopf);
      kk.addEventListener("click", function () {
        var frisch = prompt(TS().kuerzelFrage, t.kuerzel || "");
        if (frisch === null) return;
        frisch = frisch.trim().toLowerCase().replace(/^;;/, "");
        if (!frisch) frisch = TB.status.kuerzelFuerStatus(t.name, liste, t.id);
        var anderer = liste.find(function (x) {
          return x.id !== t.id &&
            String(x.kuerzel || "").toLowerCase() === frisch; });
        if (anderer) {
          TB.ui.melde(TS().kuerzelDoppelt.replace("%s", frisch)
            .replace("%s", anderer.name), true);
          return;
        }
        if (TB.speicher.holenPerKuerzel && TB.speicher.holenPerKuerzel(frisch))
          TB.ui.melde(TS().kuerzelBelegt.replace("%s", frisch), true);
        t.kuerzel = frisch;
        TB.status.speichereTeilmengen(liste); neu();
      });
      z.appendChild(kk);
      var um = el("button", "status-klein", TS().teilmengeUmbenennen);
      um.addEventListener("click", function () {
        var frisch = prompt(TS().alsStatusFrage, t.name);
        if (!frisch || !frisch.trim()) return;
        t.name = frisch.trim();
        TB.status.speichereTeilmengen(liste); neu();
      });
      z.appendChild(um);
      var weg = el("button", "status-klein", TS().teilmengeLoeschen);
      weg.addEventListener("click", function () {
        if (!confirm(TS().teilmengeLoeschenFrage.replace("%s", t.name)))
          return;
        liste.splice(nr, 1);
        TB.status.speichereTeilmengen(liste); neu();
      });
      z.appendChild(weg);
      kasten.appendChild(z);
    });
    ziel.appendChild(kasten);
  }

  function oeffne() { zeichne(wurzel()); }
  return { oeffne: oeffne, zeichne: zeichne, zieheNach: zieheNach };
})();
