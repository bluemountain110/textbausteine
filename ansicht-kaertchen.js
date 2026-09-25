// Datei: ansicht-kaertchen.js
// Projekt: Textbausteine — Teil: Web-App (nur App, keine Kopie)
// Zweck: Die Klartext-Kärtchen im Bearbeiten-Fenster (Kärtchen-Runde,
//        nach Etappe 8). Platzhalter wie {{Feld:…}} erscheinen im
//        Schreibfeld als farbige, nicht editierbare Kärtchen in
//        Alltagssprache; ein Klick öffnet ein kleines Fenster zum
//        Ändern oder Löschen. GESPEICHERT wird unverändert das alte
//        Klammern-Format — Erweiterung, Skript und alle bestehenden
//        Bausteine bleiben unberührt. Wenn/Ende erscheinen als
//        Klammer-Paar in gleicher Farbe (K1); die Knöpfe fragen erst
//        und setzen dann das fertige Kärtchen (K2); ein Schalter
//        zeigt bei Bedarf den Rohtext (K3); von Hand getippte
//        Klammern werden beim Verlassen des Felds zu Kärtchen (K4).
"use strict";
window.TB = window.TB || {};
TB.kaertchen = (function () {
  // Eigene Beschriftungen (NUR App): texte.js bleibt unverändert und
  // damit weiterhin byteweise gleich mit der Kopie in der Erweiterung.
  var W = {
    rohSchalter: "Rohtext anzeigen (für Notfälle — normal brauchst Du das nie)",
    uebernehmen: "Übernehmen",
    kTitel: "Klick zum Ändern —",
    kDatum: "Datum (heute)",
    kDatumSchub: "Datum (heute %s Tage)",
    kZeit: "Uhrzeit",
    kCursor: "Schreibmarke landet hier",
    kFeld: "Lücke: %s",
    kAuswahl: "Auswahl: %s",
    kBaustein: "Baustein: ;;%s",
    kAnkreuz: "Kästchen %s",
    kAnkreuzAus: "(anfangs leer)",
    kWenn: "Wenn %s",
    kWennNicht: "Wenn NICHT %s",
    kEnde: "Ende",
    kKategorie: "Abschnitt aus Kategorie: %s",
    kSprung: "KISIM-Sprung: %s Felder weiter",
    kKonstante: "Fester Wert: %s",
    kRoh: "Platzhalter:",
    kWennFueller: "…",
    kFensterTitel: "Kärtchen ändern",
    kFensterNeu: "Neu einfügen",
    kLoeschen: "Kärtchen löschen",
    kLoeschenPaar: "Beide Marken löschen (Text bleibt)",
    kArt_feld: "Lücke zum Ausfüllen",
    kArt_auswahl: "Auswahl",
    kArt_ankreuz: "Ankreuz-Lücke",
    kArt_wenn: "Wenn-Abschnitt",
    kArt_wennnicht: "Wenn-NICHT-Abschnitt",
    kArt_kategorie: "Aus Kategorie",
    kArt_sprung: "Sprung (KISIM)",
    kArt_baustein: "Anderer Baustein",
    kArt_konstante: "Fester Wert",
    kArt_datum: "Datum",
    kArt_roh: "Platzhalter (Rohform)",
    kHilf_feld: "Beim Benutzen fragt ein Fenster nach diesem Wert.",
    kHilf_auswahl: "Beim Benutzen wählst Du aus dieser Liste — eine Möglichkeit je Zeile.",
    kHilf_ankreuz: "Angekreuzt kommt der Satz (im Fenster noch anpassbar), abgewählt fällt er weg.",
    kHilf_wenn: "Der Text zwischen den beiden Marken kommt nur, wenn das gleichnamige Kästchen angekreuzt ist. Mit Wert: nur bei dieser Auswahl.",
    kHilf_wennnicht: "Der Text zwischen den Marken kommt nur, wenn das Kästchen NICHT angekreuzt ist.",
    kHilf_kategorie: "Beim Benutzen zeigt das Fenster alle Bausteine dieser Kategorie zum Ankreuzen.",
    kHilf_sprung: "Nur fürs Spital: springt in KISIM so viele Felder weiter (Strg+Tab).",
    kHilf_baustein: "Fügt den Baustein mit diesem Kürzel an dieser Stelle ein.",
    kHilf_konstante: "Ein fester Wert aus den Einstellungen.",
    kHilf_datum: "0 = heute, 3 = in drei Tagen, -1 = gestern.",
    kHilf_roh: "Die Rohform mit Klammern — nur ändern, wenn Du weisst, was Du tust.",
    kfBeschriftung: "Beschriftung",
    kfVorgabe: "Vorgabe (darf leer sein)",
    kfWerte: "Möglichkeiten (eine je Zeile, mindestens zwei)",
    kfName: "Name des Kästchens",
    kfSatz: "Satz, der eingefügt wird (darf leer sein)",
    kfAus: "anfangs abgewählt",
    kfWert: "Nur bei dieser Auswahl (darf leer sein)",
    kfKategorie: "Name der Kategorie",
    kfSprung: "Anzahl Felder (1–20)",
    kfKuerzel: "Kürzel (ohne ;;)",
    kfKonstante: "Welcher Wert?",
    kfSchub: "Verschiebung in Tagen",
    kfRoh: "Rohform"
  };
  var T = W;
  var MUSTER = /\{\{([^{}]*)\}\}/g;

  function kurz(t, n) {
    t = String(t || "");
    return t.length > n ? t.slice(0, n - 1) + "…" : t;
  }

  // ---- Einen Platzhalter deuten (fürs Kärtchen-Label) -----------------
  function deute(innen) {
    var roh = "{{" + innen + "}}";
    var m;
    if (innen === "Ende") return { art: "ende", roh: roh };
    if (/^Datum([+-]\d+)?$/.test(innen)) {
      m = /^Datum([+-]\d+)?$/.exec(innen);
      return { art: "datum", schub: m[1] ? Number(m[1]) : 0, roh: roh };
    }
    if (innen === "Zeit") return { art: "zeit", roh: roh };
    if (innen === "Cursor") return { art: "cursor", roh: roh };
    if ((m = /^Feld:([^:=]+?)(?:=(.*))?$/.exec(innen)))
      return { art: "feld", name: m[1], vorgabe: m[2] || "", roh: roh };
    if ((m = /^Auswahl:([^:]+):(.+)$/.exec(innen)))
      return { art: "auswahl", name: m[1],
               werte: m[2].split(/[|\/]/), roh: roh };
    if ((m = /^Baustein:(.+)$/.exec(innen)))
      return { art: "baustein", kuerzel: m[1], roh: roh };
    if ((m = /^Ankreuz:([^=\/]+?)(\/aus)?(?:=(.*))?$/.exec(innen)))
      return { art: "ankreuz", name: m[1], aus: !!m[2],
               text: m[3] || "", roh: roh };
    if ((m = /^WennNicht:([^=]+)$/.exec(innen)))
      return { art: "wennnicht", name: m[1], roh: roh };
    if ((m = /^Wenn:([^=]+?)(?:=(.*))?$/.exec(innen)))
      return { art: "wenn", name: m[1], wert: m[2] || "", roh: roh };
    if ((m = /^Aus Kategorie:(.+)$/.exec(innen)))
      return { art: "kategorie", name: m[1], roh: roh };
    if ((m = /^Sprung:(\d+)$/.exec(innen)))
      return { art: "sprung", n: Number(m[1]), roh: roh };
    var kk = Object.keys(TB.einstellungen.konstanten());
    if (kk.indexOf(innen) !== -1)
      return { art: "konstante", name: innen, roh: roh };
    return { art: "roh", roh: roh };
  }

  function beschriftung(d) {
    switch (d.art) {
      case "datum": return d.schub ? T.kDatumSchub.replace("%s",
        (d.schub > 0 ? "+" : "") + d.schub) : T.kDatum;
      case "zeit": return T.kZeit;
      case "cursor": return T.kCursor;
      case "feld": return T.kFeld.replace("%s", d.name) +
        (d.vorgabe ? " (" + kurz(d.vorgabe, 18) + ")" : "");
      case "auswahl": return T.kAuswahl.replace("%s", d.name);
      case "baustein": return T.kBaustein.replace("%s", d.kuerzel);
      case "ankreuz": return T.kAnkreuz.replace("%s", d.name) +
        (d.text ? ": „" + kurz(d.text, 30) + "“" : "") +
        (d.aus ? " " + T.kAnkreuzAus : "");
      case "wenn": return T.kWenn.replace("%s",
        d.name + (d.wert ? " = " + d.wert : "")) + " ▸";
      case "wennnicht": return T.kWennNicht.replace("%s", d.name) + " ▸";
      case "ende": return "◂ " + T.kEnde;
      case "kategorie": return T.kKategorie.replace("%s", d.name);
      case "sprung": return T.kSprung.replace("%s", String(d.n));
      case "konstante": return T.kKonstante.replace("%s", d.name);
      default: return T.kRoh + " " + kurz(d.roh.slice(2, -2), 26);
    }
  }

  // ---- Schmücken: {{…}} im Feld durch Kärtchen ersetzen ---------------
  function schmueckeElement(wurzel) {
    var doc = wurzel.ownerDocument;
    var laeufer = doc.createTreeWalker(wurzel, 4 /* NodeFilter.SHOW_TEXT */);
    var knoten = [], k;
    while ((k = laeufer.nextNode())) {
      if (k.parentNode && k.parentNode.closest &&
          k.parentNode.closest("[data-tb-roh]")) continue;
      if (k.nodeValue.indexOf("{{") !== -1) knoten.push(k);
    }
    knoten.forEach(function (tk) {
      var text = tk.nodeValue, rest = doc.createDocumentFragment();
      var pos = 0, treffer; MUSTER.lastIndex = 0;
      while ((treffer = MUSTER.exec(text))) {
        if (treffer.index > pos)
          rest.appendChild(doc.createTextNode(text.slice(pos, treffer.index)));
        var d = deute(treffer[1]);
        var chip = doc.createElement("span");
        chip.className = "tb-chip tb-chip-" + d.art;
        chip.setAttribute("contenteditable", "false");
        chip.setAttribute("data-tb-roh", d.roh);
        chip.textContent = beschriftung(d);
        chip.title = T.kTitel + " " + d.roh;
        rest.appendChild(chip);
        pos = treffer.index + treffer[0].length;
      }
      if (pos < text.length)
        rest.appendChild(doc.createTextNode(text.slice(pos)));
      tk.parentNode.replaceChild(rest, tk);
    });
    paareFaerben(wurzel);
  }

  // Wenn/WennNicht und ihr Ende bekommen dieselbe Farbe (K1); ein
  // Kärtchen ohne Partner wird rot gestrichelt markiert.
  function paareFaerben(wurzel) {
    var chips = wurzel.querySelectorAll("[data-tb-roh]");
    var stapel = [];
    Array.prototype.forEach.call(chips, function (c) {
      c.classList.remove("tb-paar-0", "tb-paar-1", "tb-paar-2",
        "tb-paar-3", "tb-paar-fehl");
      var roh = c.getAttribute("data-tb-roh");
      if (/^\{\{Wenn(Nicht)?:/.test(roh)) {
        c.classList.add("tb-paar-" + (stapel.length % 4));
        stapel.push(c);
      } else if (roh === "{{Ende}}") {
        var partner = stapel.pop();
        if (partner) {
          c.classList.add("tb-paar-" +
            Array.prototype.filter.call(partner.classList, function (x) {
              return x.indexOf("tb-paar-") === 0; })[0].slice(8));
          c.tbPartner = partner; partner.tbPartner = c;
        } else c.classList.add("tb-paar-fehl");
      }
    });
    stapel.forEach(function (c) { c.classList.add("tb-paar-fehl"); });
  }

  // ---- Entschmücken: Kärtchen zurück in {{…}}-Text --------------------
  function entHtml(wurzel) {
    var klon = wurzel.cloneNode(true);
    var chips = klon.querySelectorAll("[data-tb-roh]");
    Array.prototype.forEach.call(chips, function (c) {
      c.parentNode.replaceChild(
        klon.ownerDocument.createTextNode(c.getAttribute("data-tb-roh")), c);
    });
    return klon.innerHTML;
  }

  function entschmueckeElement(wurzel) {
    wurzel.innerHTML = entHtml(wurzel);
  }

  // ---- Das kleine Fenster zu einem Kärtchen ---------------------------
  function feldzeile(d, label, wert, mehrzeilig) {
    var z = TB.ui.el("div", "feldzeile");
    z.appendChild(TB.ui.el("label", "", label));
    var f = TB.ui.el(mehrzeilig ? "textarea" : "input");
    f.value = wert || "";
    z.appendChild(f);
    d.appendChild(z);
    return f;
  }

  function fenster(art, d, beiFertig, beiLoeschen) {
    var dialog = TB.ui.el("dialog");
    dialog.appendChild(TB.ui.el("div", "dialog-titel",
      (beiLoeschen ? T.kFensterTitel : T.kFensterNeu) + " — " + T["kArt_" + art]));
    dialog.appendChild(TB.ui.el("div", "hinweis", T["kHilf_" + art] || ""));
    var f = {};
    if (art === "feld") {
      f.name = feldzeile(dialog, T.kfBeschriftung, d.name);
      f.vorgabe = feldzeile(dialog, T.kfVorgabe, d.vorgabe);
    } else if (art === "auswahl") {
      f.name = feldzeile(dialog, T.kfBeschriftung, d.name);
      f.werte = feldzeile(dialog, T.kfWerte, (d.werte || []).join("\n"), true);
    } else if (art === "ankreuz") {
      f.name = feldzeile(dialog, T.kfName, d.name);
      f.text = feldzeile(dialog, T.kfSatz, d.text, true);
      var az = TB.ui.el("div", "feldzeile zeile-kasten");
      f.aus = TB.ui.el("input"); f.aus.type = "checkbox"; f.aus.checked = !!d.aus;
      az.appendChild(f.aus); az.appendChild(TB.ui.el("label", "", T.kfAus));
      dialog.appendChild(az);
    } else if (art === "wenn" || art === "wennnicht") {
      f.name = feldzeile(dialog, T.kfName, d.name);
      if (art === "wenn") f.wert = feldzeile(dialog, T.kfWert, d.wert);
    } else if (art === "kategorie") {
      f.name = feldzeile(dialog, T.kfKategorie, d.name);
    } else if (art === "sprung") {
      f.n = feldzeile(dialog, T.kfSprung, d.n || 2);
    } else if (art === "baustein") {
      f.k = feldzeile(dialog, T.kfKuerzel, d.kuerzel);
    } else if (art === "konstante") {
      var kz = TB.ui.el("div", "feldzeile");
      kz.appendChild(TB.ui.el("label", "", T.kfKonstante));
      f.k = TB.ui.el("select");
      Object.keys(TB.einstellungen.konstanten()).forEach(function (n) {
        var o = TB.ui.el("option", "", n); o.value = n;
        if (n === d.name) o.selected = true; f.k.appendChild(o);
      });
      kz.appendChild(f.k); dialog.appendChild(kz);
    } else if (art === "datum") {
      f.schub = feldzeile(dialog, T.kfSchub, d.schub || 0);
    } else { // roh
      f.roh = feldzeile(dialog, T.kfRoh, d.roh, true);
    }
    var kn = TB.ui.el("div", "dialog-knoepfe");
    if (beiLoeschen) {
      var l = TB.ui.el("button", "leise", art === "wenn" ||
        art === "wennnicht" || art === "ende" ? T.kLoeschenPaar : T.kLoeschen);
      l.type = "button";
      l.addEventListener("click", function () { dialog.close(); beiLoeschen(); });
      kn.appendChild(l);
    }
    var ab = TB.ui.el("button", "leise", TB.T.abbrechen); ab.type = "button";
    ab.addEventListener("click", function () { dialog.close(); });
    var ok = TB.ui.el("button", "", T.uebernehmen); ok.type = "button";
    ok.addEventListener("click", function () {
      var neu = baueRoh(art, f, d);
      if (neu === null) return;
      dialog.close(); beiFertig(neu);
    });
    kn.appendChild(ab); kn.appendChild(ok);
    dialog.appendChild(kn);
    TB.ui.dialogOeffnen(dialog);
    var erst = dialog.querySelector("input,textarea,select");
    if (erst) erst.focus();
  }

  function putzName(s) { return String(s || "").replace(/[{}:=|]/g, "").trim(); }

  function baueRoh(art, f, alt) {
    switch (art) {
      case "feld": {
        var n = putzName(f.name.value); if (!n) return null;
        return "{{Feld:" + n + (f.vorgabe.value.trim()
          ? "=" + f.vorgabe.value.trim() : "") + "}}"; }
      case "auswahl": {
        var n2 = putzName(f.name.value);
        var w = f.werte.value.split("\n").map(function (x) {
          return x.replace(/[{}|]/g, "").trim(); }).filter(Boolean);
        if (!n2 || w.length < 2) return null;
        return "{{Auswahl:" + n2 + ":" + w.join("|") + "}}"; }
      case "ankreuz": {
        var n3 = putzName(f.name.value); if (!n3) return null;
        return "{{Ankreuz:" + n3 + (f.aus.checked ? "/aus" : "") +
          (f.text.value.trim() ? "=" + f.text.value.trim()
            .replace(/[{}]/g, "") : "") + "}}"; }
      case "wenn": {
        var n4 = putzName(f.name.value); if (!n4) return null;
        return "{{Wenn:" + n4 + (f.wert.value.trim()
          ? "=" + f.wert.value.trim().replace(/[{}]/g, "") : "") + "}}"; }
      case "wennnicht": {
        var n5 = putzName(f.name.value); if (!n5) return null;
        return "{{WennNicht:" + n5 + "}}"; }
      case "kategorie": {
        var n6 = String(f.name.value || "").replace(/[{}]/g, "").trim();
        if (!n6) return null;
        return "{{Aus Kategorie:" + n6 + "}}"; }
      case "sprung": {
        var z = Number(f.n.value);
        if (!(z >= 1 && z <= 20)) return null;
        return "{{Sprung:" + Math.round(z) + "}}"; }
      case "baustein": {
        var k = String(f.k.value || "").replace(/^;+/, "").trim();
        if (!k) return null;
        return "{{Baustein:" + k + "}}"; }
      case "konstante": return "{{" + f.k.value + "}}";
      case "datum": {
        var s = Math.round(Number(f.schub.value) || 0);
        return "{{Datum" + (s ? (s > 0 ? "+" + s : String(s)) : "") + "}}"; }
      default: {
        var r = f.roh.value.trim();
        return /^\{\{[^{}]+\}\}$/.test(r) ? r : (alt ? alt.roh : null); }
    }
  }

  // ---- Anbinden an ein Schreibfeld ------------------------------------
  function anbinden(schreiber) {
    var feld = schreiber.feld;
    var roh = { an: false };
    schmueckeElement(feld);
    schreiber.wert = function () {
      return TB.auszeichnung.reinige(entHtml(feld)).innerHTML;
    };
    var altSetze = schreiber.setzeWert;
    schreiber.setzeWert = function (html) {
      altSetze(html);
      if (!roh.an) schmueckeElement(feld);
    };
    feld.addEventListener("blur", function () {
      if (!roh.an) schmueckeElement(feld); // K4
    });
    feld.addEventListener("click", function (ev) {
      if (roh.an) return;
      var chip = ev.target.closest ? ev.target.closest("[data-tb-roh]") : null;
      if (!chip || !feld.contains(chip)) return;
      ev.preventDefault();
      var d = deute(chip.getAttribute("data-tb-roh").slice(2, -2));
      var art = d.art === "ende" ? (chip.tbPartner
        ? deute(chip.tbPartner.getAttribute("data-tb-roh").slice(2, -2)).art
        : "roh") : d.art;
      var ziel = (d.art === "ende" && chip.tbPartner) ? chip.tbPartner : chip;
      if (d.art === "ende" && chip.tbPartner)
        d = deute(ziel.getAttribute("data-tb-roh").slice(2, -2));
      fenster(art, d, function (neuRoh) {
        ziel.setAttribute("data-tb-roh", neuRoh);
        var nd = deute(neuRoh.slice(2, -2));
        ziel.textContent = beschriftung(nd);
        ziel.title = T.kTitel + " " + neuRoh;
        paareFaerben(feld);
        schreiber.fokus();
      }, function () { // Löschen
        if ((art === "wenn" || art === "wennnicht") && ziel.tbPartner &&
            ziel.tbPartner.parentNode)
          ziel.tbPartner.parentNode.removeChild(ziel.tbPartner);
        if (ziel.parentNode) ziel.parentNode.removeChild(ziel);
        paareFaerben(feld);
        schreiber.fokus();
      });
    });
    // Neu einsetzen (K2): erst fragen, dann fertiges Kärtchen setzen.
    schreiber.kaertchenNeu = function (art) {
      if (roh.an) { schreiber.fokus(); return; }
      if (art === "zeit") { setzeNeu("{{Zeit}}"); return; }
      if (art === "datum") { setzeNeu("{{Datum}}"); return; }
      if (art === "konstante") {
        var kk = Object.keys(TB.einstellungen.konstanten());
        if (kk.length === 1) { setzeNeu("{{" + kk[0] + "}}"); return; }
      }
      fenster(art, {}, function (neuRoh) {
        if (art === "wenn" || art === "wennnicht")
          setzeNeu(neuRoh + T.kWennFueller + "{{Ende}}");
        else setzeNeu(neuRoh);
      }, null);
    };
    function setzeNeu(rohText) {
      schreiber.platzhalterEinsetzen(rohText);
      schmueckeElement(feld);
    }
    schreiber.rohModus = function (an) {
      roh.an = !!an;
      if (an) entschmueckeElement(feld); else schmueckeElement(feld);
    };
  }

  return { W: W, anbinden: anbinden,
           schmueckeElement: schmueckeElement, entHtml: entHtml,
           deute: deute };
})();
