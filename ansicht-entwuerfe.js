// Datei: ansicht-entwuerfe.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Der Bereich „Entwürfe" — halbfertige Bausteine und die
//        Sammel-Erfassung.
//        Ein Entwurf IST ein Baustein, nur noch nicht fertig: dieselbe
//        Kennung, dieselbe Tabelle, nur das Feld `entwurf` steht auf
//        wahr. Kein zweiter Topf. Er braucht keinen Titel, erscheint
//        nicht in der Arbeitsliste und zählt nicht in der Statistik —
//        und wird er fertig, behält er seine Kennung, damit nichts
//        verloren geht.
//        Die Sammel-Erfassung ist der Weg für Näds bestehende
//        KISIM-Bausteine: in KISIM kopieren, hier einfügen, Enter,
//        nächster. Die Formatierung kommt über den RTF-Leser mit.
//        GRUNDSATZ: Auch hier nie Patientendaten — ein Baustein ist der
//        Text OHNE Patient.

"use strict";
window.TB = window.TB || {};

TB.ansichtEntwuerfe = (function () {
  var el = TB.ui.el, melde = TB.ui.melde, dialogOeffnen = TB.ui.dialogOeffnen;
  var T = function () { return TB.T; };
  var S = function () { return TB.speicher; };

  var zuletztErfasst = [];   // für „Letzten rückgängig"

  // ---- Die Ansicht -------------------------------------------------------
  function zeichne(wurzel) {
    // Sammel-Erfassung zuoberst — sie ist der Grund, warum man hier ist.
    var k = el("div", "karte");
    k.appendChild(el("h2", "", T().sammelTitel));
    k.appendChild(el("p", "erklaerung", T().sammelText));

    var feld = el("div", "schreibfeld sammelfeld");
    feld.setAttribute("contenteditable", "true");
    feld.setAttribute("data-leer", T().sammelPlatzhalter);

    var zaehler = el("div", "erklaerung sammel-zaehler", "");
    function zaehlerAuffrischen() {
      var anzahl = TB.bausteine.alleEntwuerfe().length;
      zaehler.textContent = T().sammelStand
        .replace("%s", zuletztErfasst.length)
        .replace("%e", anzahl);
    }

    // Einfügen läuft durch dieselbe Reinigung wie das Bearbeiten-Fenster:
    // aus KISIM kommt nur RTF, das der Leser übersetzt.
    feld.addEventListener("paste", function (ev) {
      var d = ev.clipboardData;
      if (!d) return;
      ev.preventDefault();
      var html = "", text = "", rtf = "";
      try { html = d.getData("text/html") || ""; } catch (e) { }
      try { text = d.getData("text/plain") || ""; } catch (e) { }
      try { rtf = d.getData("text/rtf") || ""; } catch (e) { }
      var ausRtf = (!html && rtf) ? TB.rtfLesen.lies(rtf) : "";
      var sauber = html ? TB.auszeichnung.reinige(html).innerHTML
                : (ausRtf ? TB.auszeichnung.reinige(ausRtf).innerHTML
                : String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                              .replace(/\n/g, "<br>"));
      try { document.execCommand("insertHTML", false, sauber); }
      catch (e) { feld.innerHTML += sauber; }
    });

    function uebernehmen() {
      var inhalt = TB.auszeichnung.reinige(feld.innerHTML).innerHTML;
      if (!TB.auszeichnung.reinerText(inhalt).trim()) {
        melde(T().sammelLeer, true);
        return;
      }
      var b = S().speichern({ text: inhalt, entwurf: true });
      zuletztErfasst.push(b.id);
      feld.innerHTML = "";
      feld.focus();
      TB.statistik.zaehle("entwurf");
      TB.abgleich.anstossen();
      zaehlerAuffrischen();
      zeichneListe();
      TB.oberflaeche.zeichneNavigation();   // die Zahl im Reiter mitführen
    }

    // Enter übernimmt und macht das Feld frei für den nächsten.
    // Umschalt+Enter macht einen Absatz INNERHALB des Entwurfs.
    feld.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        uebernehmen();
      }
    });

    k.appendChild(feld);

    var knoepfe = el("div", "dialog-knoepfe sammel-knoepfe");
    var uebernehmenKnopf = el("button", "haupt", T().sammelUebernehmen);
    uebernehmenKnopf.addEventListener("click", uebernehmen);
    knoepfe.appendChild(uebernehmenKnopf);

    var zurueck = el("button", "neben", T().sammelRueckgaengig);
    zurueck.addEventListener("click", function () {
      var id = zuletztErfasst.pop();
      if (!id) { melde(T().sammelNichtsRueckgaengig, true); return; }
      S().endgueltigLoeschen([id]);
      melde(T().sammelZurueckgenommen);
      zaehlerAuffrischen();
      zeichneListe();
      TB.oberflaeche.zeichneNavigation();
    });
    knoepfe.appendChild(zurueck);
    k.appendChild(knoepfe);
    k.appendChild(zaehler);
    zaehlerAuffrischen();
    wurzel.appendChild(k);

    var platz = el("div");
    platz.id = "entwurf-listen-platz";
    wurzel.appendChild(platz);
    zeichneListe();
    setTimeout(function () { feld.focus(); }, 0);
  }

  // ---- Die Liste der Entwürfe -------------------------------------------
  function zeichneListe() {
    var platz = document.getElementById("entwurf-listen-platz");
    if (!platz) return;
    platz.textContent = "";
    var entwuerfe = TB.bausteine.alleEntwuerfe().sort(function (a, b) {
      return Date.parse(b.erstelltAm || 0) - Date.parse(a.erstelltAm || 0);
    });
    var k = el("div", "karte");
    k.appendChild(el("h2", "", T().entwurfListe.replace("%s", entwuerfe.length)));
    if (!entwuerfe.length) {
      k.appendChild(el("p", "erklaerung", T().entwurfLeer));
      platz.appendChild(k);
      return;
    }
    var ul = el("ul", "liste");
    entwuerfe.forEach(function (b) {
      var li = el("li");
      var textTeil = el("div", "zeile-text");
      var reiner = TB.auszeichnung.reinerText(b.text || "");
      textTeil.appendChild(el("div", "zeile-titel",
        b.titel || reiner.split("\n")[0].slice(0, 60) || T().entwurfOhneTitel));
      textTeil.appendChild(el("div", "zeile-neben",
        reiner.replace(/\n/g, " ").slice(0, 120)));
      li.appendChild(textTeil);

      var bearbeiten = el("button", "leise", T().bearbeitenKnopf);
      bearbeiten.addEventListener("click", function () {
        TB.oberflaeche.bearbeiteBaustein(b); });
      li.appendChild(bearbeiten);

      var fertig = el("button", "leise", T().entwurfFertig);
      fertig.addEventListener("click", function () { machFertig(b); });
      li.appendChild(fertig);

      var weg = el("button", "leise", T().loeschenKnopf);
      weg.addEventListener("click", function () {
        S().inPapierkorb(b.id); TB.abgleich.anstossen();
        melde(T().inPapierkorb); zeichneListe(); });
      li.appendChild(weg);

      li.style.cursor = "default";
      ul.appendChild(li);
    });
    k.appendChild(ul);
    platz.appendChild(k);
  }

  // ---- Aus einem Entwurf einen fertigen Baustein machen -----------------
  // Die Kennung bleibt dieselbe — der Entwurf wird nicht kopiert, er
  // wächst auf. So zeigen Verweise aus anderen Bausteinen weiterhin
  // auf dasselbe Stück.
  function machFertig(b) {
    var d = el("dialog");
    d.appendChild(el("h2", "", T().entwurfFertigTitel));
    d.appendChild(el("p", "erklaerung", T().entwurfFertigText));
    function zeile(beschriftung, feld) {
      var z = el("div", "feldzeile");
      z.appendChild(el("label", "", beschriftung));
      z.appendChild(feld); d.appendChild(z); return feld;
    }
    var reiner = TB.auszeichnung.reinerText(b.text || "");
    var fTitel = zeile(T().feldTitel, el("input"));
    fTitel.type = "text";
    fTitel.value = b.titel || reiner.split("\n")[0].slice(0, 60);
    var fKuerzel = zeile(T().feldKuerzel, el("input"));
    fKuerzel.type = "text"; fKuerzel.value = b.kuerzel || "";
    var fKategorie = zeile(T().feldKategorie, el("input"));
    fKategorie.type = "text"; fKategorie.value = b.kategorie || "";
    fKategorie.setAttribute("list", "kategorien-fertig");
    var datenListe = el("datalist"); datenListe.id = "kategorien-fertig";
    TB.bausteine.kategorien().forEach(function (kat) {
      var o = el("option"); o.value = kat; datenListe.appendChild(o); });
    d.appendChild(datenListe);

    var knoepfe = el("div", "dialog-knoepfe");
    var ab = el("button", "neben", T().abbrechen);
    ab.addEventListener("click", function () { d.close(); });
    var ok = el("button", "haupt", T().entwurfFertigKnopf);
    ok.addEventListener("click", function () {
      var eintrag = { id: b.id, titel: fTitel.value.trim(),
        kuerzel: fKuerzel.value.trim(), kategorie: fKategorie.value.trim(),
        entwurf: false };
      var fehler = TB.bausteine.pruefe(eintrag);
      if (fehler.length) { melde(T().nichtGespeichert + fehler.join(" "), true); return; }
      S().speichern(eintrag);
      TB.statistik.zaehle("entwurfFertig");
      TB.abgleich.anstossen();
      d.close();
      melde(T().entwurfIstFertig);
      TB.oberflaeche.zeichne();
    });
    knoepfe.appendChild(ab); knoepfe.appendChild(ok);
    d.appendChild(knoepfe);
    dialogOeffnen(d);
    setTimeout(function () { fTitel.focus(); fTitel.select(); }, 0);
  }

  // ---- Der Knopf „+ Idee" aus der Bausteinliste -------------------------
  // Ein einziges Textfeld, sonst nichts. Der Gedanke zwischen zwei
  // Patienten soll in fünf Sekunden gesichert sein.
  function schnellIdee() {
    var d = el("dialog");
    d.appendChild(el("h2", "", T().ideeTitel));
    d.appendChild(el("p", "erklaerung", T().ideeText));
    var feld = el("textarea", "idee-feld");
    d.appendChild(feld);
    var knoepfe = el("div", "dialog-knoepfe");
    var ab = el("button", "neben", T().abbrechen);
    ab.addEventListener("click", function () { d.close(); });
    var ok = el("button", "haupt", T().ideeSichern);
    function sichern() {
      var text = feld.value.trim();
      if (!text) { d.close(); return; }
      S().speichern({
        text: String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                          .replace(/\n/g, "<br>"),
        entwurf: true
      });
      TB.statistik.zaehle("idee");
      TB.abgleich.anstossen();
      d.close();
      melde(T().ideeGesichert);
      TB.oberflaeche.zeichne();
    }
    ok.addEventListener("click", sichern);
    d.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); sichern(); }
    });
    knoepfe.appendChild(ab); knoepfe.appendChild(ok);
    d.appendChild(knoepfe);
    dialogOeffnen(d);
    setTimeout(function () { feld.focus(); }, 0);
  }

  return { zeichne: zeichne, zeichneListe: zeichneListe,
           machFertig: machFertig, schnellIdee: schnellIdee };
})();
