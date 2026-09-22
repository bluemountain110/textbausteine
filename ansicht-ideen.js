// Datei: ansicht-ideen.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Der Ideen-Speicher (Etappe 6): Wünsche und Ideen für die
//        WEITERENTWICKLUNG dieser App, damit sie nicht verloren gehen.
//        Eine Idee ist ein Eintrag in derselben Baustein-Tabelle
//        (art = "idee") — darum ist sie automatisch auf allen Geräten,
//        hat den Papierkorb und braucht KEINE Schema-Änderung.
//        Ideen erscheinen NIE in der Bausteinliste, in der Suche oder
//        bei den Kürzeln. „Verwerfen" legt sie in den Papierkorb;
//        „eingeplant" ist ein Haken (im Feld kategorie), damit die
//        offene Liste kurz bleibt.
//        Der Export-Knopf erzeugt ein md-Dokument für den Bau-Chat —
//        Dateiname mit Gerät, Datum und Uhrzeit mit Sekunden (Regel
//        vom 3.9.). GRUNDSATZ: Auch hier nie Patientendaten.

"use strict";
window.TB = window.TB || {};

TB.ansichtIdeen = (function () {
  var el = TB.ui.el, melde = TB.ui.melde;
  var T = function () { return TB.T; };
  var S = function () { return TB.speicher; };

  function offene() {
    return TB.bausteine.alleIdeen().filter(function (b) {
      return b.kategorie !== "eingeplant"; });
  }
  function eingeplante() {
    return TB.bausteine.alleIdeen().filter(function (b) {
      return b.kategorie === "eingeplant"; });
  }
  function nachDatum(liste) {
    return liste.slice().sort(function (a, b) {
      return Date.parse(b.erstelltAm || 0) - Date.parse(a.erstelltAm || 0); });
  }

  function zeichne(wurzel) {
    // Erfassen zuoberst — der Grund, warum man hier ist.
    var k = el("div", "karte");
    k.appendChild(el("h2", "", T().ideenTitel));
    k.appendChild(el("p", "erklaerung", T().ideenText));
    var fTitel = el("input"); fTitel.type = "text";
    fTitel.placeholder = T().ideenNeuTitel;
    var zT = el("div", "feldzeile"); zT.appendChild(fTitel); k.appendChild(zT);
    var fText = el("textarea", "idee-feld");
    fText.placeholder = T().ideenNeuText;
    var zX = el("div", "feldzeile"); zX.appendChild(fText); k.appendChild(zX);
    var okKnopf = el("button", "haupt", T().ideenFesthalten);
    okKnopf.addEventListener("click", function () {
      var titel = fTitel.value.trim();
      var text = fText.value.trim();
      if (!titel && !text) { melde(T().sammelLeer, true); return; }
      S().speichern({ art: "idee", entwurf: false,
        titel: titel || text.split("\n")[0].slice(0, 60),
        text: String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                          .replace(/\n/g, "<br>"),
        kategorie: "" });
      TB.statistik.zaehle("ideeFestgehalten");
      TB.abgleich.anstossen();
      melde(T().ideenGesichert);
      TB.oberflaeche.zeichne();
    });
    fTitel.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); fText.focus(); } });
    fText.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault(); okKnopf.click(); } });
    k.appendChild(okKnopf);
    wurzel.appendChild(k);

    function haengeListe(titel, liste, eingeplant) {
      if (!liste.length) return;
      var karte = el("div", "karte");
      karte.appendChild(el("h2", "", titel));
      var ul = el("ul", "liste");
      nachDatum(liste).forEach(function (b) {
        var li = el("li");
        var textTeil = el("div", "zeile-text");
        textTeil.appendChild(el("div", "zeile-titel", b.titel || "(ohne Titel)"));
        var neben = [];
        neben.push(new Date(b.erstelltAm).toLocaleDateString("de-CH"));
        var erste = TB.auszeichnung.reinerText(b.text || "");
        if (erste) neben.push(erste);
        textTeil.appendChild(el("div", "zeile-neben", neben.join(" · ")));
        li.appendChild(textTeil);
        var haken = el("button", "leise",
          eingeplant ? T().ideenWiederOffen : T().ideenEinplanen);
        haken.addEventListener("click", function (ev) {
          ev.stopPropagation();
          S().speichern({ id: b.id, kategorie: eingeplant ? "" : "eingeplant" });
          TB.abgleich.anstossen();
          TB.oberflaeche.zeichne();
        });
        li.appendChild(haken);
        var weg = el("button", "leise", T().ideenVerwerfen);
        weg.addEventListener("click", function (ev) {
          ev.stopPropagation();
          S().inPapierkorb(b.id);
          TB.abgleich.anstossen();
          melde(T().ideenVerworfen);
          TB.oberflaeche.zeichne();
        });
        li.appendChild(weg);
        li.style.cursor = "default";
        ul.appendChild(li);
      });
      karte.appendChild(ul);
      wurzel.appendChild(karte);
    }
    if (!TB.bausteine.alleIdeen().length) {
      wurzel.appendChild(el("div", "leer", T().ideenLeer));
    } else {
      haengeListe(T().ideenOffen, offene(), false);
      haengeListe(T().ideenEingeplant, eingeplante(), true);
    }

    // Export für den Bau-Chat: md-Datei + der übliche Berichtsweg.
    var kE = el("div", "karte");
    var exportKnopf = el("button", "neben", T().ideenExport);
    exportKnopf.addEventListener("click", function () {
      var inhalt = dokumentText();
      var blob = new Blob([inhalt], { type: "text/markdown" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = dokumentName();
      document.body.appendChild(a); a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href); a.remove(); }, 500);
      TB.statistik.zaehle("ideenExport");
      melde(T().ideenExportiert);
    });
    kE.appendChild(exportKnopf);
    var berichtKnopf = el("button", "neben", T().berichtPdf);
    berichtKnopf.style.marginLeft = "8px";
    berichtKnopf.addEventListener("click", function () {
      TB.ui.berichtAusgeben(T().ideenStandTitel, dokumentText());
    });
    kE.appendChild(berichtKnopf);
    wurzel.appendChild(kE);
  }

  function zwei(n) { return (n < 10 ? "0" : "") + n; }
  function dokumentName(jetzt) {
    var d = jetzt || new Date();
    return "Textbausteine-Ideen-" + S().geraet() + "-" + d.getFullYear() +
      "-" + zwei(d.getMonth() + 1) + "-" + zwei(d.getDate()) + "-" +
      zwei(d.getHours()) + zwei(d.getMinutes()) + zwei(d.getSeconds()) + ".md";
  }
  function dokumentText(jetzt) {
    var d = jetzt || new Date();
    var zeilen = [];
    zeilen.push("# Textbausteine — Ideen-Speicher aus der App");
    zeilen.push("");
    zeilen.push("Stand: " + zwei(d.getDate()) + "." + zwei(d.getMonth() + 1) +
      "." + d.getFullYear() + ", " + zwei(d.getHours()) + ":" +
      zwei(d.getMinutes()) + ":" + zwei(d.getSeconds()) +
      " · Gerät: " + S().geraet() + " · Welt: " + S().WELT +
      " · Fassung " + TB.FASSUNG.split(" · ")[0]);
    zeilen.push("");
    function abschnitt(titel, liste) {
      zeilen.push("## " + titel + " (" + liste.length + ")");
      zeilen.push("");
      if (!liste.length) { zeilen.push("(keine)"); zeilen.push(""); return; }
      nachDatum(liste).forEach(function (b) {
        var datum = new Date(b.erstelltAm).toLocaleDateString("de-CH");
        zeilen.push("- **" + (b.titel || "(ohne Titel)") + "** (" + datum + ")");
        var text = TB.auszeichnung.reinerText(b.text || "").trim();
        if (text) text.split("\n").forEach(function (z) {
          if (z.trim()) zeilen.push("  " + z.trim()); });
      });
      zeilen.push("");
    }
    abschnitt("Offene Ideen", offene());
    abschnitt("Eingeplant", eingeplante());
    return zeilen.join("\n");
  }

  return { zeichne: zeichne };
})();
