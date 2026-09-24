// Datei: masken.js
// Projekt: Textbausteine — Teil: App (Browser). Byteweise Kopie in der
//          Chrome-Erweiterung (Lehre K2: geteilte Logik nie nachbauen).
// Zweck: Die Masken-Sprache der Etappe 8. Vier neue Platzhalter:
//        {{Ankreuz:Name}}            Kästchen, schreibt selbst nichts
//        {{Ankreuz:Name=Text}}       Ankreuz-Lücke: Text erscheint nur,
//                                    wenn angekreuzt — und ist im
//                                    Fenster überschreibbar (F3)
//        {{Wenn:Name}} … {{Ende}}    Abschnitt hängt am Kästchen; mit
//                                    {{Wenn:Name=Wert}} an einer Auswahl
//        {{WennNicht:Name}} … {{Ende}}  das Gegenteil
//        Dazu {{Aus Kategorie:X}} (Bausteinwahl je Abschnitt, F1/F2)
//        und {{Sprung:2}} (KISIM: 2× Strg+Tab — wirkt nur im Skript).
//        „/aus" hinter dem Namen macht ein Kästchen anfangs abgewählt:
//        {{Ankreuz:Psychiatrische Anamnese/aus}}.
//        Diese Datei ANALYSIERT eine Maske (was fragt das Fenster ab?),
//        WENDET die Antworten AN (Abschnitte fallen weg, Lücken werden
//        gefüllt, Leerraum wird geheilt) und PRÜFT das erzeugte RTF
//        (Weg A: jeder Abschnitt eine geschlossene Einheit, damit das
//        Windows-Skript gefahrlos herausschneiden kann).
//        GRUNDSATZ: Hier fliesst Bausteintext, nie Patientendaten.

"use strict";
window.TB = window.TB || {};

TB.masken = (function () {

  var MUSTER = /\{\{([^{}]+)\}\}/g;

  // ---- Einen Platzhalter-Inhalt deuten --------------------------------
  // Liefert null, wenn es KEIN Masken-Platzhalter ist (also Feld,
  // Auswahl, Datum, Konstante … — die gehören makros.js).
  function deuteToken(inhalt) {
    var roh = String(inhalt);
    var doppelpunkt = roh.indexOf(":");
    var name = (doppelpunkt === -1 ? roh : roh.slice(0, doppelpunkt)).trim();
    var rest = doppelpunkt === -1 ? "" : roh.slice(doppelpunkt + 1);
    if (name === "Ende") return { typ: "ende" };
    if (name === "Ankreuz") {
      var gleich = rest.indexOf("=");
      var kopf = (gleich === -1 ? rest : rest.slice(0, gleich)).trim();
      var text = gleich === -1 ? null : rest.slice(gleich + 1);
      var an = true;
      var schalter = /\/(aus|an)\s*$/i.exec(kopf);
      if (schalter) {
        an = schalter[1].toLowerCase() !== "aus";
        kopf = kopf.slice(0, schalter.index).trim();
      }
      if (!kopf) return { typ: "fehler", meldung: "{{Ankreuz:…}}: Beschriftung fehlt" };
      return { typ: "ankreuz", name: kopf, text: text, an: an };
    }
    if (name === "Wenn" || name === "WennNicht") {
      var g2 = rest.indexOf("=");
      var n2 = (g2 === -1 ? rest : rest.slice(0, g2)).trim();
      var wert = g2 === -1 ? null : rest.slice(g2 + 1).trim();
      if (!n2) return { typ: "fehler", meldung: "{{" + name + ":…}}: Beschriftung fehlt" };
      return { typ: name === "Wenn" ? "wenn" : "wennnicht", name: n2, wert: wert };
    }
    if (name === "Aus Kategorie") {
      var k = rest.trim();
      if (!k) return { typ: "fehler", meldung: "{{Aus Kategorie:…}}: Kategoriename fehlt" };
      return { typ: "kategorie", kategorie: k };
    }
    if (name === "Sprung") {
      var z = parseInt(rest.trim(), 10);
      if (!(z >= 1 && z <= 20)) return { typ: "fehler", meldung: "{{Sprung:…}}: braucht eine Zahl von 1 bis 20" };
      return { typ: "sprung", n: z };
    }
    return null;
  }

  // Ist dieser Text (reiner Text ODER HTML) eine Maske?
  function istMaske(text) {
    return /\{\{\s*(Ankreuz|Wenn|WennNicht|Aus Kategorie)\s*:/i
      .test(String(text || ""));
  }
  function hatSprung(text) {
    return /\{\{\s*Sprung\s*:/i.test(String(text || ""));
  }

  // ---- Textknoten sammeln (wie reichtext.js) --------------------------
  function baum(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html || "");
    return d;
  }
  function textknoten(wurzel) {
    var liste = [];
    (function gehe(k) {
      while (k) {
        if (k.nodeType === 3) liste.push(k);
        else if (k.nodeType === 1) gehe(k.firstChild);
        k = k.nextSibling;
      }
    })(wurzel.firstChild);
    return liste;
  }

  // Alle Platzhalter im Baum, in Lesereihenfolge, mit Fundstelle.
  // Auch Feld und Auswahl werden erfasst — das Fenster zeigt alles in
  // der Reihenfolge des Textes, und für das Ausgrauen muss bekannt
  // sein, in welchem Wenn-Abschnitt eine Lücke steckt.
  function sammleTokens(wurzel) {
    var tokens = [];
    textknoten(wurzel).forEach(function (k) {
      var t = k.nodeValue, m;
      MUSTER.lastIndex = 0;
      while ((m = MUSTER.exec(t)) !== null) {
        var tok = deuteToken(m[1]);
        if (!tok) {
          // Kein Masken-Token — aber Feld/Auswahl für die Zeilenliste.
          var dp = m[1].indexOf(":");
          var nm = (dp === -1 ? m[1] : m[1].slice(0, dp)).trim();
          if (nm === "Feld") {
            var rest = dp === -1 ? "" : m[1].slice(dp + 1);
            var gl = rest.indexOf("=");
            tok = { typ: "feld",
                    name: (gl === -1 ? rest : rest.slice(0, gl)).trim(),
                    vorgabe: gl === -1 ? "" : rest.slice(gl + 1) };
          } else if (nm === "Auswahl") {
            var teile = (dp === -1 ? "" : m[1].slice(dp + 1)).split(":");
            tok = { typ: "auswahl", name: (teile[0] || "").trim(),
                    optionen: (teile[1] || "").split(/[|\/]/)
                      .map(function (s) { return s.trim(); })
                      .filter(function (s) { return s !== ""; }) };
          } else {
            tok = { typ: "fremd" }; // Datum, Konstante, Baustein …
          }
        }
        tokens.push({ knoten: k, start: m.index, ende: m.index + m[0].length,
                      tok: tok });
      }
    });
    return tokens;
  }

  // ---- Analyse: Was fragt das Fenster ab? -----------------------------
  // Liefert { istMaske, zeilen, kaestchen, kategorien, fehler }.
  // zeilen: in Lesereihenfolge, jede mit sichtbarWenn (Liste von
  // Bedingungen fürs Ausgrauen: {name, wert, negiert}).
  function analysiere(html) {
    var wurzel = baum(html);
    var tokens = sammleTokens(wurzel);
    var zeilen = [], fehler = [];
    var kaestchen = {}, kaestchenReihe = [];
    var auswahlNamen = {}, gesehen = {};
    var stapel = [], katNr = 0;

    function kaestchenAnlegen(name, an, implizit) {
      if (!kaestchen[name]) {
        kaestchen[name] = { name: name, an: an, text: null, implizit: !!implizit };
        kaestchenReihe.push(kaestchen[name]);
        zeilen.push({ typ: "ankreuz", name: name,
                      sichtbarWenn: stapel.slice() });
      } else if (!implizit && kaestchen[name].implizit) {
        kaestchen[name].an = an;
        kaestchen[name].implizit = false;
      }
      return kaestchen[name];
    }

    tokens.forEach(function (e) {
      var tok = e.tok;
      if (tok.typ === "fehler") { fehler.push(tok.meldung); return; }
      if (tok.typ === "fremd") return;
      if (tok.typ === "ankreuz") {
        var kx = kaestchenAnlegen(tok.name, tok.an, false);
        if (tok.text !== null && kx.text === null) kx.text = tok.text;
        return;
      }
      if (tok.typ === "wenn" || tok.typ === "wennnicht") {
        if (tok.wert === null) kaestchenAnlegen(tok.name, true, true);
        stapel.push({ name: tok.name, wert: tok.wert,
                      negiert: tok.typ === "wennnicht" });
        return;
      }
      if (tok.typ === "ende") {
        if (!stapel.length) { fehler.push("{{Ende}} ohne zugehöriges {{Wenn:…}}"); return; }
        stapel.pop();
        return;
      }
      if (tok.typ === "kategorie") {
        zeilen.push({ typ: "kategorie", kategorie: tok.kategorie,
                      nummer: katNr++, sichtbarWenn: stapel.slice() });
        return;
      }
      if (tok.typ === "sprung") return;
      if (tok.typ === "feld" || tok.typ === "auswahl") {
        if (!tok.name) return; // meldet makros.analysiere
        if (tok.typ === "auswahl") auswahlNamen[tok.name] = true;
        if (gesehen[tok.name]) return;
        gesehen[tok.name] = true;
        zeilen.push({ typ: tok.typ, name: tok.name,
                      vorgabe: tok.vorgabe, optionen: tok.optionen,
                      sichtbarWenn: stapel.slice() });
      }
    });
    if (stapel.length) {
      fehler.push(stapel.length + "× {{Wenn:…}} ohne {{Ende}}");
    }
    // Ein {{Wenn:Name=Wert}} braucht eine Auswahl dieses Namens.
    tokens.forEach(function (e) {
      var t = e.tok;
      if ((t.typ === "wenn" || t.typ === "wennnicht") && t.wert !== null &&
          !auswahlNamen[t.name]) {
        var meldung = "{{Wenn:" + t.name + "=" + t.wert +
          "}}: es gibt keine Auswahl „" + t.name + "“ im Baustein";
        if (fehler.indexOf(meldung) === -1) fehler.push(meldung);
      }
    });
    return { istMaske: kaestchenReihe.length > 0 || katNr > 0 ||
                       hatSprung(wurzel.textContent),
             zeilen: zeilen, kaestchen: kaestchenReihe,
             kategorien: zeilen.filter(function (z) { return z.typ === "kategorie"; }),
             fehler: fehler };
  }

  // Gilt eine Bedingung? zustand = { kaestchen: {Name:true/false},
  // antworten: {Name:Wert} } — Auswahl-Werte stehen in antworten.
  function bedingungGilt(b, zustand) {
    var wahr;
    if (b.wert !== null && b.wert !== undefined) {
      wahr = String((zustand.antworten || {})[b.name] || "") === b.wert;
    } else {
      var k = (zustand.kaestchen || {});
      wahr = (b.name in k) ? !!k[b.name] : true;
    }
    return b.negiert ? !wahr : wahr;
  }

  // ---- Anwenden: aus Maske + Antworten wird der fertige Text ----------
  // zustand: { kaestchen, antworten, texte } — texte[Name] ist der
  //          (allenfalls überschriebene) Text einer Ankreuz-Lücke.
  // kategorieInhalte: HTML je Kategorie-Fundstelle (Reihenfolge wie in
  //          analysiere().kategorien), schon fertig aufgelöst.
  // Feld/Auswahl/Datum werden hier NICHT ersetzt — das macht danach
  // wie bisher TB.reichtext.auswerte.
  function wendeAn(html, zustand, kategorieInhalte) {
    var wurzel = baum(html);
    var tokens = sammleTokens(wurzel);
    var fehler = [];

    // Blöcke merken, die vorher Inhalt hatten — nur die dürfen nachher
    // als leer entfernt werden (Heilung, ohne gewollte Leerzeilen zu
    // fressen).
    var bloecke = wurzel.querySelectorAll("p,div,li");
    Array.prototype.forEach.call(bloecke, function (bl) {
      if (bl.textContent.replace(/\u00a0/g, " ").trim() !== "") {
        bl.setAttribute("data-tb-voll", "1");
      }
    });

    // 1. Entscheiden, was mit jedem Token geschieht.
    var plan = [], stapel = [], fallTiefe = 0, katNr = 0;
    tokens.forEach(function (e) {
      var t = e.tok;
      if (fallTiefe > 0) {
        // Wir stehen in einem Abschnitt, der wegfällt — nur die
        // Klammerung mitzählen, alles andere fällt mit.
        if (t.typ === "wenn" || t.typ === "wennnicht") fallTiefe++;
        else if (t.typ === "ende") {
          fallTiefe--;
          if (fallTiefe === 0) {
            plan.push({ op: "bereich", von: stapel.pop(), bis: e });
          }
        } else if (t.typ === "kategorie") katNr++;
        return;
      }
      if (t.typ === "wenn" || t.typ === "wennnicht") {
        var gilt = bedingungGilt({ name: t.name, wert: t.wert,
                                   negiert: t.typ === "wennnicht" }, zustand);
        if (gilt) { stapel.push(null); plan.push({ op: "token", e: e }); }
        else { stapel.push(e); fallTiefe = 1; }
        return;
      }
      if (t.typ === "ende") {
        if (stapel.length) stapel.pop();
        plan.push({ op: "token", e: e });
        return;
      }
      if (t.typ === "ankreuz") {
        var an = (zustand.kaestchen && t.name in zustand.kaestchen)
          ? !!zustand.kaestchen[t.name] : t.an;
        var text = "";
        if (an && t.text !== null) {
          text = (zustand.texte && zustand.texte[t.name] !== undefined)
            ? zustand.texte[t.name] : t.text;
        }
        plan.push({ op: "ersetze", e: e, text: text });
        return;
      }
      if (t.typ === "kategorie") {
        plan.push({ op: "kategorie", e: e, nummer: katNr++ });
        return;
      }
      if (t.typ === "sprung") {
        plan.push({ op: "umbruch", e: e });
        return;
      }
      if (t.typ === "fehler") { plan.push({ op: "token", e: e }); }
      // feld/auswahl/fremd bleiben stehen — reichtext übernimmt sie.
    });

    // 2. Anwenden, von hinten nach vorn (Fundstellen bleiben gültig).
    for (var i = plan.length - 1; i >= 0; i--) {
      var p = plan[i];
      if (p.op === "bereich") {
        var r = wurzel.ownerDocument.createRange();
        r.setStart(p.von.knoten, p.von.start);
        r.setEnd(p.bis.knoten, p.bis.ende);
        r.deleteContents();
        continue;
      }
      var k = p.e.knoten, wert = "";
      if (p.op === "ersetze") wert = p.text;
      if (p.op === "umbruch" || p.op === "kategorie") {
        // Token durch ein Element ersetzen: Knoten teilen.
        var nach = k.splitText(p.e.ende);
        k.splitText(p.e.start); // Mittelteil = das Token
        var mitte = k.nextSibling;
        var el;
        if (p.op === "umbruch") { el = wurzel.ownerDocument.createElement("br"); }
        else {
          el = wurzel.ownerDocument.createElement("span");
          el.setAttribute("data-tb-kat", String(p.nummer));
        }
        mitte.parentNode.replaceChild(el, mitte);
        void nach;
        continue;
      }
      k.nodeValue = k.nodeValue.slice(0, p.e.start) + wert +
                    k.nodeValue.slice(p.e.ende);
    }

    // 3. Gewählte Bausteine an ihre Plätze setzen.
    var traeger = wurzel.querySelectorAll("span[data-tb-kat]");
    Array.prototype.forEach.call(traeger, function (sp) {
      var nr = parseInt(sp.getAttribute("data-tb-kat"), 10);
      var inhalt = (kategorieInhalte || [])[nr] || "";
      var d = wurzel.ownerDocument.createElement("div");
      d.innerHTML = inhalt;
      while (d.firstChild) sp.parentNode.insertBefore(d.firstChild, sp);
      sp.parentNode.removeChild(sp);
    });

    heile(wurzel);
    return { html: wurzel.innerHTML, fehler: fehler };
  }

  // ---- Heilung: keine Spuren, wo etwas wegfiel ------------------------
  function heile(wurzel) {
    textknoten(wurzel).forEach(function (k) {
      k.nodeValue = k.nodeValue
        .replace(/[ \t]{2,}/g, " ")
        .replace(/ ([.,;:!?])/g, "$1");
    });
    // Blöcke, die vorher Inhalt hatten und jetzt leer sind, entfernen.
    var voll = wurzel.querySelectorAll("[data-tb-voll]");
    Array.prototype.forEach.call(voll, function (bl) {
      var leer = bl.textContent.replace(/\u00a0/g, " ").trim() === "" &&
                 !bl.querySelector("table,img,br");
      if (leer && bl.parentNode) bl.parentNode.removeChild(bl);
      else bl.removeAttribute("data-tb-voll");
    });
    // Mehr als zwei Umbrüche hintereinander: auf zwei kürzen.
    var brs = wurzel.querySelectorAll("br");
    Array.prototype.forEach.call(brs, function (br) {
      var n = br.nextSibling, reihe = [];
      while (n && (n.nodeName === "BR" ||
             (n.nodeType === 3 && n.nodeValue.trim() === ""))) {
        if (n.nodeName === "BR") reihe.push(n);
        n = n.nextSibling;
      }
      for (var i = 1; i < reihe.length; i++) {
        if (reihe[i].parentNode) reihe[i].parentNode.removeChild(reihe[i]);
      }
    });
  }

  // ---- Dasselbe auf reinem Text (Spiegel fürs Windows-Skript) ---------
  // Das AutoHotkey-Skript kann kein HTML — es arbeitet auf Text und
  // RTF. Diese Funktion ist die REFERENZ dafür: dieselben Regeln,
  // dieselbe Reihenfolge. Die Prüfsuite lässt beide Fassungen über
  // dieselben Fälle laufen.
  function textAnwenden(text, zustand, kategorieTexte) {
    var t = String(text || "");
    var aus = "", pos = 0, m, fallTiefe = 0, katNr = 0;
    MUSTER.lastIndex = 0;
    while ((m = MUSTER.exec(t)) !== null) {
      var tok = deuteToken(m[1]);
      if (fallTiefe > 0) {
        if (tok && (tok.typ === "wenn" || tok.typ === "wennnicht")) fallTiefe++;
        else if (tok && tok.typ === "ende") { fallTiefe--; if (fallTiefe === 0) pos = m.index + m[0].length; }
        else if (tok && tok.typ === "kategorie") katNr++;
        continue;
      }
      aus += t.slice(pos, m.index);
      pos = m.index + m[0].length;
      if (!tok) { aus += m[0]; continue; } // Feld, Auswahl, Datum …
      if (tok.typ === "wenn" || tok.typ === "wennnicht") {
        var gilt = bedingungGilt({ name: tok.name, wert: tok.wert,
                                   negiert: tok.typ === "wennnicht" }, zustand);
        if (!gilt) fallTiefe = 1;
        continue;
      }
      if (tok.typ === "ende") continue;
      if (tok.typ === "ankreuz") {
        var an = (zustand.kaestchen && tok.name in zustand.kaestchen)
          ? !!zustand.kaestchen[tok.name] : tok.an;
        if (an && tok.text !== null) {
          aus += (zustand.texte && zustand.texte[tok.name] !== undefined)
            ? zustand.texte[tok.name] : tok.text;
        }
        continue;
      }
      if (tok.typ === "kategorie") { aus += (kategorieTexte || [])[katNr++] || ""; continue; }
      if (tok.typ === "sprung") { aus += "\n"; continue; }
    }
    aus += t.slice(pos);
    return heileText(aus);
  }
  function heileText(t) {
    return String(t)
      .replace(/[ \t]{2,}/g, " ")
      .replace(/ ([.,;:!?])/g, "$1")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n");
  }

  // ---- RTF-Tauglichkeit (Weg A, Prüfung beim Speichern) ---------------
  // Im gespeicherten RTF stehen die Platzhalter als \{\{…\}\}. Das
  // Skript schneidet abgewählte Abschnitte als Zeichenkette heraus und
  // zerlegt den Bericht an Kategorie- und Sprung-Marken in Stücke.
  // Beides ist nur sicher, wenn dabei keine RTF-Gruppe zerschnitten
  // wird. Diese Prüfung stellt das VOR dem Speichern sicher.
  var RTF_KOPF_ENDE = "\\viewkind4\\uc1 \\pard\\f0\\fs20 ";

  function rtfInhaltNachText(stueck) {
    var aus = "", i = 0, s = String(stueck);
    while (i < s.length) {
      var z = s[i];
      if (z === "\\") {
        var f = s[i + 1];
        if (f === "u") {
          var m = /^\\u(-?\d+)\?/.exec(s.slice(i));
          if (m) { var n = Number(m[1]); if (n < 0) n += 65536;
                   aus += String.fromCharCode(n); i += m[0].length; continue; }
        }
        if (f === "~") { aus += "\u00a0"; i += 2; continue; }
        if (f === "\\" || f === "{" || f === "}") { aus += f; i += 2; continue; }
        i += 1; continue;
      }
      aus += z; i += 1;
    }
    return aus;
  }
  function rtfTokens(rtf) {
    var liste = [], re = /\\\{\\\{([\s\S]*?)\\\}\\\}/g, m;
    while ((m = re.exec(String(rtf || ""))) !== null) {
      liste.push({ start: m.index, ende: m.index + m[0].length,
                   tok: deuteToken(rtfInhaltNachText(m[1])) });
    }
    return liste;
  }
  // Zählt { und } (unescaped) in einem RTF-Stück.
  function klammerBilanz(stueck) {
    var s = String(stueck), bilanz = 0;
    for (var i = 0; i < s.length; i++) {
      var z = s[i];
      if (z === "\\") { i++; continue; }
      if (z === "{") bilanz++;
      else if (z === "}") bilanz--;
    }
    return bilanz;
  }
  function rtfTauglich(rtf) {
    var fehler = [];
    var r = String(rtf || "");
    if (!r) return { ok: true, fehler: [] };
    var toks = rtfTokens(r);
    var stapel = [];
    toks.forEach(function (e) {
      var t = e.tok;
      if (!t) return;
      if (t.typ === "wenn" || t.typ === "wennnicht") stapel.push(e);
      else if (t.typ === "ende") {
        var auf = stapel.pop();
        if (!auf) return; // Paarigkeit meldet die Text-Prüfung
        var innen = r.slice(auf.start, e.ende);
        if (klammerBilanz(innen) !== 0) {
          fehler.push("Der Abschnitt „" + auf.tok.name + "“ zerschneidet " +
            "eine Formatierung — Fett/Kursiv ganz innerhalb oder ganz " +
            "ausserhalb des Wenn-Abschnitts setzen");
        }
        if (/\\trowd/.test(innen)) {
          fehler.push("Im Abschnitt „" + auf.tok.name + "“ steckt eine " +
            "Tabelle — Tabellen gehören ausserhalb von Wenn-Abschnitten");
        }
      }
    });
    // Stücke zwischen Kategorie-/Sprung-Marken müssen ganz sein.
    var kopfEnde = r.indexOf(RTF_KOPF_ENDE);
    if (kopfEnde !== -1) {
      var von = kopfEnde + RTF_KOPF_ENDE.length;
      var schnitte = toks.filter(function (e) {
        return e.tok && (e.tok.typ === "kategorie" || e.tok.typ === "sprung"); });
      var lauf = von;
      schnitte.forEach(function (e) {
        if (klammerBilanz(r.slice(lauf, e.start)) !== 0) {
          fehler.push("Eine Formatierung reicht über eine Abschnitts-Marke " +
            "({{Aus Kategorie:…}} oder {{Sprung:…}}) hinweg — sie vor der " +
            "Marke beenden");
        }
        lauf = e.ende;
      });
    }
    return { ok: fehler.length === 0,
             fehler: fehler.filter(function (f, i, a) { return a.indexOf(f) === i; }) };
  }

  return { istMaske: istMaske, hatSprung: hatSprung, deuteToken: deuteToken,
           analysiere: analysiere, wendeAn: wendeAn,
           textAnwenden: textAnwenden, heileText: heileText,
           bedingungGilt: bedingungGilt,
           rtfTokens: rtfTokens, rtfTauglich: rtfTauglich,
           rtfInhaltNachText: rtfInhaltNachText,
           RTF_KOPF_ENDE: RTF_KOPF_ENDE };
})();
