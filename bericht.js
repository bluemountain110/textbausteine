// Datei: bericht.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Der gemeinsame Ausgabe-Weg für ALLE Berichtsansichten
//        (Selbsttest, Statistik und später weitere): erzeugt aus einem
//        Titel und einem Text ein PDF über den Druckdialog und legt
//        denselben Text gleichzeitig in die Zwischenablage.
//        Der Dateiname trägt Ursprungsgerät, Kategorie, Datum und
//        Uhrzeit MIT SEKUNDEN, damit Berichte im Finder sortierbar und
//        eindeutig sind.
//        Hinweis: Ein PDF lässt sich technisch nicht in die
//        Zwischenablage legen — darum beides nebeneinander.

"use strict";
window.TB = window.TB || {};

TB.bericht = (function () {

  // Der Gerätename kommt aus dem Speicher (dort ist er benennbar) und
  // wird für Dateinamen entschärft: keine Umlaute, keine Leerzeichen,
  // damit der Name im Finder und unter Windows unverändert ankommt.
  function geraet() {
    var name = "";
    try { name = TB.speicher.geraet(); } catch (e) { name = ""; }
    if (!name) name = "Geraet";
    return name
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
      .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue")
      .replace(/ß/g, "ss")
      .replace(/[^A-Za-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "Geraet";
  }

  function zeitstempel(jetzt) {
    var d = jetzt || new Date();
    function z(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) +
      "-" + z(d.getHours()) + z(d.getMinutes()) + z(d.getSeconds());
  }

  // z. B. Textbausteine-Statistik-Mac-2026-09-13-224230
  function dateiname(kategorie, jetzt) {
    return "Textbausteine-" + kategorie + "-" + geraet() + "-" + zeitstempel(jetzt);
  }

  // Öffnet ein Druckfenster. Der Fenstertitel ist der vorgeschlagene
  // Dateiname — macOS und Windows übernehmen ihn beim Sichern als PDF.
  function alsPdf(kategorie, text) {
    var name = dateiname(kategorie);
    var fenster = window.open("", "_blank");
    if (!fenster) return null;   // Aufrufer meldet: Fenster blockiert
    var d = fenster.document;
    d.open();
    d.write("<!DOCTYPE html><html lang=\"de\"><head><meta charset=\"UTF-8\">" +
      "<title>" + name + "</title><style>" +
      "body{font:12px/1.45 ui-monospace,'SF Mono',Consolas,Menlo,monospace;" +
      "margin:18mm 16mm;color:#111}h1{font-size:13px;margin:0 0 10px}" +
      "pre{white-space:pre-wrap;margin:0}@page{margin:14mm}" +
      "</style></head><body><h1>" + name + "</h1><pre></pre></body></html>");
    d.close();
    d.querySelector("pre").textContent = text;   // Text sicher einsetzen
    fenster.focus();
    setTimeout(function () { fenster.print(); }, 250);
    return name;
  }

  return { geraet: geraet, zeitstempel: zeitstempel,
           dateiname: dateiname, alsPdf: alsPdf };
})();
