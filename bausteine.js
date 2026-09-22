// Datei: bausteine.js
// Projekt: Textbausteine — Teil: App (Browser)
// Zweck: Die Verwaltung der Bausteine oberhalb des Speichers: prüfen
//        vor dem Speichern (Titel da? Kürzel eindeutig?), suchen und
//        filtern, „zuletzt benutzt“, Kategorien-Liste und die zwei
//        Beispiel-Bausteine für den Anfang.
//        Entwürfe sind Bausteine wie alle anderen, nur eben noch nicht
//        fertig: Sie tauchen in der Arbeitsliste NICHT auf und haben
//        darum hier ihren eigenen Filter.
//        REGEL: Ein Kürzel gibt es höchstens einmal — die Prüfung
//        gilt für jeden Weg, auch fürs Einfügen der Beispiele.

"use strict";
window.TB = window.TB || {};

TB.bausteine = (function () {
  var S = function () { return TB.speicher; };

  // Die fertigen Bausteine — das, was die Arbeitsliste zeigt.
  function alleFertigen() {
    return S().alleAktiven().filter(function (b) {
      return !b.entwurf && b.art !== "idee"; });
  }
  function alleEntwuerfe() {
    return S().alleAktiven().filter(function (b) {
      return !!b.entwurf && b.art !== "idee"; });
  }
  // Etappe 6: Ideen für die WEITERENTWICKLUNG der App — eigene Art,
  // dieselbe Tabelle (darum synchron auf allen Geräten, mit Papierkorb).
  function alleIdeen() {
    return S().alleAktiven().filter(function (b) { return b.art === "idee"; });
  }

  // Etappe 6: Welche Fassung gilt auf DIESEM Gerät? Hat der Baustein
  // für den eingestellten Standort eine eigene Fassung mit Text, kommt
  // sie — sonst IMMER die Standardfassung. Nichts scheitert still.
  function fassungFuer(b, standortName) {
    var ort = (standortName !== undefined) ? standortName : S().standort();
    var v = b && b.varianten;
    if (ort && v && typeof v === "object" && v[ort] &&
        typeof v[ort] === "object" && String(v[ort].text || "").trim()) {
      return { text: v[ort].text, textRtf: v[ort].textRtf || null, variante: ort };
    }
    return { text: (b && b.text) || "", textRtf: (b && b.textRtf) || null,
             variante: null };
  }
  function hatVarianten(b) {
    var v = b && b.varianten;
    if (!v || typeof v !== "object") return false;
    return Object.keys(v).some(function (ort) {
      return v[ort] && String(v[ort].text || "").trim(); });
  }

  // Prüfen VOR dem Speichern. Liefert eine Liste von Beanstandungen —
  // leer heisst: darf gespeichert werden.
  function pruefe(eintrag) {
    var fehler = [];
    if (!eintrag.entwurf && (!eintrag.titel || !eintrag.titel.trim())) {
      fehler.push(TB.T.fehlerTitelFehlt);
    }
    var k = (eintrag.kuerzel || "").trim();
    if (k) {
      if (/[;\s]/.test(k)) fehler.push(TB.T.fehlerKuerzelZeichen);
      var anderer = S().holenPerKuerzel(k);
      if (anderer && anderer.id !== eintrag.id) {
        fehler.push(TB.T.fehlerKuerzelDoppelt.replace("%s", anderer.titel || "?"));
      }
    }
    return fehler;
  }

  function suche(begriff, kategorie) {
    var b = (begriff || "").toLowerCase().trim();
    return alleFertigen().filter(function (x) {
      if (kategorie && (x.kategorie || "") !== kategorie) return false;
      if (!b) return true;
      var felder = [x.titel, x.kuerzel, x.kategorie,
                    TB.auszeichnung.reinerText(x.text), x.notiz];
      if (x.varianten && typeof x.varianten === "object") {
        Object.keys(x.varianten).forEach(function (ort) {
          var v = x.varianten[ort];
          if (v && v.text) felder.push(TB.auszeichnung.reinerText(v.text));
        });
      }
      return felder.some(function (f) {
        return (f || "").toLowerCase().indexOf(b) !== -1; });
    }).sort(function (a2, b2) {
      return (a2.titel || "").localeCompare(b2.titel || "", "de");
    });
  }

  function kategorien() {
    var m = {};
    alleFertigen().forEach(function (x) {
      if (x.kategorie) m[x.kategorie] = true; });
    return Object.keys(m).sort(function (a, b) { return a.localeCompare(b, "de"); });
  }

  function zuletztBenutzt(anzahl) {
    return alleFertigen()
      .filter(function (x) { return !!x.zuletztBenutztAm; })
      .sort(function (a, b) {
        return Date.parse(b.zuletztBenutztAm) - Date.parse(a.zuletztBenutztAm); })
      .slice(0, anzahl || 5);
  }

  // Ein Kürzel darf es nur EINMAL geben — auch dieser Knopf hält sich
  // daran: Ist das Kürzel schon vergeben (fertig ODER Entwurf), wird
  // dieses Beispiel übersprungen statt doppelt angelegt (Näd 17.9.).
  function kuerzelFrei(k) {
    var kl = String(k).toLowerCase();
    return !S().alleAktiven().some(function (b) {
      return (b.kuerzel || "").toLowerCase() === kl; });
  }

  function beispieleEinfuegen() {
    if (kuerzelFrei("vk")) S().speichern({
      titel: "Beispiel: Verlaufskontrolle",
      kuerzel: "vk",
      kategorie: "Beispiele",
      text: "<b>Verlaufskontrolle</b> vom {{Datum}}: Beschwerden " +
            "{{Auswahl:Verlauf:gebessert|unverändert|verschlechtert}}. " +
            "Nächste Kontrolle in {{Feld:Wochen=6}} Wochen vereinbart.<br>" +
            "Untersucher: <i>{{Untersucher}}</i>.",
      notiz: "Zeigt Datum, Auswahl, Feld mit Vorgabe, eine Konstante und Auszeichnungen."
    });
    if (kuerzelFrei("mfg")) S().speichern({
      titel: "Beispiel: Kurzer Gruss",
      kuerzel: "mfg",
      kategorie: "Beispiele",
      text: "Mit freundlichen Grüssen<br><b>{{Untersucher}}</b>",
      notiz: "Ein Baustein ganz ohne Lücken — ein Klick, kopiert."
    });
  }

  return { alleFertigen: alleFertigen, alleEntwuerfe: alleEntwuerfe,
           alleIdeen: alleIdeen, fassungFuer: fassungFuer,
           hatVarianten: hatVarianten,
           pruefe: pruefe, suche: suche, kategorien: kategorien,
           zuletztBenutzt: zuletztBenutzt, beispieleEinfuegen: beispieleEinfuegen };
})();
