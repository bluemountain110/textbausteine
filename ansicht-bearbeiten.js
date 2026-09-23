// Datei: ansicht-bearbeiten.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Das Bearbeiten-Fenster eines Bausteins: Titel, Kürzel,
//        Kategorie, das Schreibfeld mit Formatierungsleiste, die
//        Platzhalter-Knöpfe, die Ausgabeart, die Notiz — und seit
//        Etappe 6 die Standort-Fassungen (je Arbeitsort ein eigener
//        Wortlaut; ohne eigene Fassung gilt die Standardfassung).
//        Bis Etappe 5 stand dieses Fenster in oberflaeche.js; die Datei
//        war über die 600-Zeilen-Grenze gewachsen (Arbeitsweise, Abs. 3).

"use strict";
window.TB = window.TB || {};

TB.ansichtBearbeiten = (function () {
  var el = TB.ui.el, melde = TB.ui.melde, dialogOeffnen = TB.ui.dialogOeffnen;
  var T = null, S = null;

  function bearbeite(b) {
    var neu = !b;
    var d = el("dialog", "weit");
    d.appendChild(el("h2", "", neu ? T.neuTitel : T.bearbeitenTitel));
    function feldzeile(beschriftung, feld) {
      var z = el("div", "feldzeile");
      z.appendChild(el("label", "", beschriftung));
      z.appendChild(feld); d.appendChild(z); return feld;
    }
    var fTitel = feldzeile(T.feldTitel, el("input"));
    fTitel.type = "text"; fTitel.value = b ? (b.titel || "") : "";
    var fKuerzel = feldzeile(T.feldKuerzel, el("input"));
    fKuerzel.type = "text"; fKuerzel.value = b ? (b.kuerzel || "") : "";
    var fKategorie = feldzeile(T.feldKategorie, el("input"));
    fKategorie.type = "text"; fKategorie.value = b ? (b.kategorie || "") : "";
    fKategorie.setAttribute("list", "kategorien-liste");
    var datenListe = el("datalist"); datenListe.id = "kategorien-liste";
    TB.bausteine.kategorien().forEach(function (k) {
      var o = el("option"); o.value = k; datenListe.appendChild(o); });
    d.appendChild(datenListe);
    // Das Schreibfeld mit Formatierungsleiste (formatleiste.js).
    var schreibZeile = el("div", "feldzeile");
    schreibZeile.appendChild(el("label", "", T.feldText));
    d.appendChild(schreibZeile);
    // Etappe 4: Ein Entwurf aus dem Windows-Skript (;;neu) bringt die
    // KISIM-Formatierung als Huckepack mit — ein RTF, versteckt in
    // einem Kommentar am Textanfang. Beim ersten Öffnen wird es hier
    // mit dem bewiesenen RTF-Leser in echten Reichtext gewandelt; mit
    // dem Speichern ist der Huckepack Geschichte.
    function huckepackAusgepackt(text) {
      var t = String(text || "");
      var m = t.match(/^<!--TBRTFROH:([A-Za-z0-9+\/=]+)-->/);
      if (!m || typeof TB.rtfLesen === "undefined") return null;
      try {
        var gewandelt = TB.rtfLesen.lies(atob(m[1]));
        if (gewandelt && gewandelt.html) return gewandelt.html;
        if (typeof gewandelt === "string" && gewandelt) return gewandelt;
        return t.slice(m[0].length);
      } catch (e) { return t.slice(m[0].length); }
    }
    var startText = b ? (b.text || "") : "";
    var huckepack = huckepackAusgepackt(startText);
    if (huckepack !== null) startText = huckepack;
    var schreiber = TB.formatleiste.erzeuge(schreibZeile, {
      wert: startText,
      beiAenderung: function () { pruefeMakros(); }
    });
    if (huckepack !== null) melde(T.huckepackGewandelt);

    // Knopfleiste für die Platzhalter. Sie setzt IMMER unformatiert ein,
    // damit kein Platzhalter halb ausgezeichnet ist und stumm ausfällt.
    var einfuegenZeile = el("div", "feldzeile");
    einfuegenZeile.appendChild(el("label", "", T.einfuegenTitel));
    var knopfleiste = el("div", "knopfleiste");
    var ersteKonstante = Object.keys(TB.einstellungen.konstanten())[0] || "Untersucher";
    [[T.knopfDatum, "{{Datum}}", undefined, undefined],
     [T.knopfZeit, "{{Zeit}}", undefined, undefined],
     [T.knopfFeld, "{{Feld:Beschriftung}}", 7, 19],
     [T.knopfAuswahl, "{{Auswahl:Beschriftung:eins/zwei}}", 10, 22],
     [T.knopfKonstante, "{{" + ersteKonstante + "}}", undefined, undefined],
     [T.knopfBaustein, "{{Baustein:kürzel}}", 11, 17]
    ].forEach(function (k) {
      var knopf = el("button", "leise klein", k[0]);
      knopf.type = "button";
      knopf.addEventListener("mousedown", function (ev) { ev.preventDefault(); });
      knopf.addEventListener("click", function (ev) {
        ev.preventDefault();
        schreiber.platzhalterEinsetzen(k[1], k[2], k[3]);
      });
      knopfleiste.appendChild(knopf);
    });
    einfuegenZeile.appendChild(knopfleiste);
    d.appendChild(einfuegenZeile);

    // ---- Standort-Fassungen (Etappe 6) --------------------------------
    // Je Arbeitsort entweder ein Knopf „Fassung anlegen" (kopiert die
    // Standardfassung als Ausgangspunkt) oder ein eigenes Schreibfeld
    // mit „Fassung löschen". Leergeräumte Fassungen zählen als gelöscht.
    var variantenZeile = el("div", "feldzeile");
    variantenZeile.appendChild(el("label", "", T.variantenTitel));
    var variantenPlatz = el("div");
    variantenPlatz.appendChild(el("p", "erklaerung", T.variantenText));
    variantenZeile.appendChild(variantenPlatz);
    d.appendChild(variantenZeile);
    var varianteSchreiber = {};   // Ort -> Formatleisten-Schreiber
    var varianteStart = {};       // Ort -> Startwert (aus b.varianten)
    if (b && b.varianten && typeof b.varianten === "object") {
      Object.keys(b.varianten).forEach(function (ort) {
        var v = b.varianten[ort];
        if (v && String(v.text || "").trim()) varianteStart[ort] = v.text;
      });
    }
    function zeichneVarianten() {
      // Nur die eigenen Kinder unterhalb der Erklärung wegräumen.
      while (variantenPlatz.children.length > 1) {
        variantenPlatz.removeChild(variantenPlatz.lastChild);
      }
      varianteSchreiber = {};
      TB.einstellungen.standorte().forEach(function (ort) {
        if (varianteStart[ort] !== undefined) {
          var block = el("div", "variante-block");
          var kopfZeile = el("div", "feldzeile variante-kopf");
          kopfZeile.appendChild(el("label", "", T.varianteFeld.replace("%s", ort)));
          var weg = el("button", "leise klein", T.varianteLoeschen);
          weg.type = "button";
          weg.addEventListener("click", function () {
            delete varianteStart[ort];
            zeichneVarianten(); pruefeMakros();
            melde(T.varianteGeloescht);
          });
          kopfZeile.appendChild(weg);
          block.appendChild(kopfZeile);
          var feldZeile = el("div", "feldzeile");
          block.appendChild(feldZeile);
          variantenPlatz.appendChild(block);
          varianteSchreiber[ort] = TB.formatleiste.erzeuge(feldZeile, {
            wert: varianteStart[ort],
            beiAenderung: function () {
              varianteStart[ort] = varianteSchreiber[ort].wert();
              pruefeMakros();
            }
          });
        } else {
          var anlegen = el("button", "neben klein", T.varianteAnlegen.replace("%s", ort));
          anlegen.type = "button";
          anlegen.style.marginRight = "8px";
          anlegen.addEventListener("click", function () {
            varianteStart[ort] = schreiber.wert();   // Standard als Ausgangspunkt
            zeichneVarianten(); pruefeMakros();
          });
          variantenPlatz.appendChild(anlegen);
        }
      });
    }
    zeichneVarianten();

    var pruefzeile = el("div", "hinweis-gut", "");
    d.appendChild(pruefzeile);
    var pruefliste = el("ul", "fehlerliste");
    d.appendChild(pruefliste);

    // Ausgabeart: fertig einfügen oder Lücken als Marken mitliefern.
    var artZeile = el("div", "feldzeile");
    artZeile.appendChild(el("label", "", T.artTitel));
    var artWahl = el("select");
    [["fenster", T.artFenster], ["marken", T.artMarken]].forEach(function (a) {
      var o = el("option", "", a[1]); o.value = a[0]; artWahl.appendChild(o);
    });
    artWahl.value = (b && b.ausgabeart === "marken") ? "marken" : "fenster";
    var artHinweis = el("div", "erklaerung");
    function artErklaeren() {
      artHinweis.textContent = artWahl.value === "marken" ? T.artMarkenText : T.artFensterText;
      artHinweis.className = artWahl.value === "marken" ? "hinweis-warn" : "erklaerung";
    }
    artWahl.addEventListener("change", function () { artErklaeren(); pruefeMakros(); });
    artErklaeren();
    artZeile.appendChild(artWahl);
    artZeile.appendChild(artHinweis);
    d.appendChild(artZeile);

    var fNotiz = feldzeile(T.feldNotiz, el("input"));
    fNotiz.type = "text"; fNotiz.value = b ? (b.notiz || "") : "";

    function pruefeMakros() {
      var umgebung = TB.einstellungen.makroUmgebung();
      var analyse = TB.reichtext.pruefe(schreiber.wert(), umgebung);
      var fehler = analyse.fehler.slice();
      Object.keys(varianteSchreiber).forEach(function (ort) {
        var a2 = TB.reichtext.pruefe(varianteSchreiber[ort].wert(), umgebung);
        a2.fehler.forEach(function (f2) {
          fehler.push(T.fehlerVariante.replace("%s", ort).replace("%f", f2));
        });
      });
      if (artWahl.value === "marken" &&
          TB.reichtext.markenKollision(schreiber.wert(), umgebung)) {
        fehler.push(T.reichtextMarkeDoppelt);
      }
      pruefliste.textContent = "";
      if (fehler.length) {
        pruefzeile.className = "hinweis-warn";
        pruefzeile.textContent = T.makroWarnung;
        fehler.forEach(function (f) { pruefliste.appendChild(el("li", "", f)); });
        pruefliste.className = "fehlerliste warn";
      } else {
        pruefzeile.className = "hinweis-gut";
        pruefzeile.textContent = T.makroOk +
          (analyse.luecken.length ? " (" + analyse.luecken.length + " Lücke(n))" : "");
        pruefliste.className = "fehlerliste";
      }
    }
    pruefeMakros();

    var knoepfe = el("div", "dialog-knoepfe");
    var ab = el("button", "neben", T.abbrechen);
    ab.addEventListener("click", function () { d.close(); });
    var ok = el("button", "haupt", T.speichern);
    ok.addEventListener("click", function () {
      var varianten = {};
      Object.keys(varianteStart).forEach(function (ort) {
        var wert = varianteSchreiber[ort] ? varianteSchreiber[ort].wert()
                                          : varianteStart[ort];
        if (TB.auszeichnung.reinerText(wert || "").trim()) {
          var alteV = (b && b.varianten && b.varianten[ort]) || {};
          varianten[ort] = { text: wert, textRtf: alteV.textRtf || null };
        }
      });
      var eintrag = { id: b ? b.id : undefined,
        titel: fTitel.value.trim(), kuerzel: fKuerzel.value.trim(),
        kategorie: fKategorie.value.trim(), text: schreiber.wert(),
        varianten: varianten,
        ausgabeart: artWahl.value,
        notiz: fNotiz.value.trim() };
      if (b && b.entwurf) eintrag.entwurf = false;
      var fehler = TB.bausteine.pruefe(eintrag);
      if (fehler.length) { melde(T.nichtGespeichert + fehler.join(" "), true); return; }
      S.speichern(eintrag);
      TB.statistik.zaehle(neu ? "angelegt" : "geaendert");
      TB.abgleich.anstossen();
      d.close(); melde(T.gespeichert); TB.oberflaeche.zeichne();
    });
    knoepfe.appendChild(ab); knoepfe.appendChild(ok);
    d.appendChild(knoepfe);
    dialogOeffnen(d);
    setTimeout(function () { fTitel.focus(); }, 0);
  }

  return { bearbeite: function (b) {
    T = TB.T; S = TB.speicher;
    bearbeite(b);
  } };
})();
