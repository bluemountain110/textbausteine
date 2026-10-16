// Datei: enmg-befund.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Der Befund-VORSCHLAG des ENMG-Werks (18.13, Näds Wunsch 13.10.):
//        Aus der gefärbten Tabelle entstehen (1) eine Zusammenfassung je
//        Nerv und Seite ohne Zahlen („N. medianus links: Neuropathie
//        über dem Carpaltunnel …", „N. suralis rechts: unauffällig") und
//        (2) eine Beurteilung, die die gewählten Fragestellungen
//        beantwortet und alles weitere Pathologische nennt.
//        Grundlage ist NUR die Färbung nach Näds Grenzwerten; wo kein
//        Normwert besteht, wird nichts behauptet. Das CTS wird nach
//        Bland eingestuft (Näds Gewohnheit). Alles ist ein Vorschlag:
//        Näd liest, ändert im Fenster und kopiert selbst.
//        18.18: motorische Amplitude (Chen) zählt mit; „demyelinisierend"
//        nach den AAN-Forschungskriterien 1991 (Neurology 41:617–618) JE
//        NERV: Amplitude normal (≥ 80 % der Untergrenze) → NLG < 80 %
//        der Untergrenze, DML > 125 %, F-Welle > 120 % der Obergrenze;
//        Amplitude vermindert oder ohne Norm → < 70 % / > 150 % / > 150 %.
//        Die BEURTEILUNG nennt eine demyelinisierende Polyneuropathie erst
//        ab ZWEI Nerven (Näd 15.10.). Myopathisches Muster im Nadel-EMG.
//        GRUNDSATZ: Rechnet nur im Fenster — nichts wird gespeichert.

"use strict";
window.TB = window.TB || {};

TB.enmgBefund = (function () {

  // ---- Die Fragestellungen (Näd 13.10.: „im Verlauf ergänzen wir") ------
  var FRAGEN = [
    { id: "pnp", text: "Polyneuropathie?", erkennen: /polyneuro|\bpnp\b/i },
    { id: "cts", text: "Karpaltunnelsyndrom?", erkennen: /karpal|carpal|\bcts\b/i },
    { id: "sus", text: "Sulcus-ulnaris-Syndrom?", erkennen: /sulcus|ulnaris|cubital|kubital/i },
    { id: "peron", text: "Peroneusläsion am Fibulaköpfchen?", erkennen: /peron|fibul/i },
    { id: "radik", text: "Radikulopathie?", erkennen: /radikul|radicul|wurzel/i },
    { id: "plexus", text: "Plexusläsion?", erkennen: /plexus/i },
    { id: "mnd", text: "Motoneuronerkrankung?", erkennen: /[Mm]otoneuron|\bALS\b|\bMND\b|[Aa]myotroph/ },
    { id: "myo", text: "Myopathie?", erkennen: /myopath|myositis/i },
    { id: "nmt", text: "Störung der neuromuskulären Übertragung?", erkennen: /myasth|übertragung|repetitiv|lambert/i },
    { id: "verlauf", text: "Verlaufskontrolle?", erkennen: /verlauf|kontrolle|vergleich/i }
  ];
  function fragenAusText(t) {
    var s = String(t || ""), aus = [];
    FRAGEN.forEach(function (f) {
      // „ALS“ nur in Grossbuchstaben (das Wort „als“ ist keine Frage)
      var re = f.id === "mnd" ? f.erkennen : new RegExp(f.erkennen.source, "i");
      if (re.test(s)) aus.push(f.id);
    });
    // „Kompressionsneuropathie der Armnerven?" = CTS + Sulcus ulnaris
    if (/kompression/i.test(s) && /arm/i.test(s)) {
      if (aus.indexOf("cts") === -1) aus.push("cts");
      if (aus.indexOf("sus") === -1) aus.push("sus");
    }
    return aus;
  }

  var BLAND = ["", "sehr leicht", "leicht", "moderat", "schwer", "sehr schwer",
               "extrem schwer"];
  // Was eine rote NLG je Normzeile bedeutet (Ort in Alltagsworten)
  var ORT = { va: "am Vorderarm", oa: "am Oberarm",
              sulcus: "über dem Sulcus (Ellbogen)", mus: "am Unterschenkel",
              mknie: "im Segment Fibulaköpfchen–Kniekehle" };

  function rot(b) { return !!(b && b.farbe === "rot"); }
  // 18.17: „grenzwertig" (bis 5 % ausserhalb) zählt NICHT als
  // pathologisch (rot bleibt falsch), wird in der Zusammenfassung aber
  // beim Namen genannt — Näds Entscheid 14.10.
  function gw(b) { return !!(b && b.farbe === "grenzwertig"); }
  function gefaerbt(b) { return !!(b && b.farbe); }

  // ---- Gruppen: je Nerv und Seite alle Blöcke zusammen -------------------
  function gruppen(erg) {
    var liste = [], index = {};
    (erg.bloecke || []).forEach(function (b) {
      var nerv = TB.enmg.erkenneNerv(b.nervText);
      var name = b.nervName || (nerv ? nerv.name : b.nervText);
      var schl = (nerv ? nerv.id : name) + "|" + (b.seite || "");
      if (!index[schl]) {
        index[schl] = { id: nerv ? nerv.id : null, name: name, seite: b.seite || "",
                        motor: [], sens: [] };
        liste.push(index[schl]);
      }
      index[schl][b.art === "motor" ? "motor" : "sens"].push(b);
    });
    liste.forEach(analysiere);
    return liste;
  }

  function analysiere(g) {
    var a = { dmlRot: false, dml: null, msap: null, mnlgRot: [], mnlgOk: [],
              mampRot: false, demyel: [], demyelOrt: {},
              fRot: false, sampRot: false, snlgRot: false, sensDa: false,
              sensAmpDa: false, gefaerbt: false, unplausibel: [],
              grenzwertig: [],
              ring: { median: null, ulnar: null } };
    g.motor.forEach(function (b) {
      // AAN 1991: Ist die distale Amplitude normal (≥ 80 % der Grenze)?
      // Ohne Amplitude oder ohne Norm gilt die strengere Schwelle.
      var z0 = b.zeilen[0] || { werte: {}, bew: {} };
      var ab = (z0.bew || {}).amp, aw = (z0.werte || {}).amp;
      var ampNormal = !!(ab && ab.grenze > 0 && typeof aw === "number" &&
                         aw >= 0.8 * ab.grenze);
      function demyelPruef(bew, wert, art, ort) {
        if (!bew || !(bew.grenze > 0) || typeof wert !== "number") return;
        var ja;
        if (art === "nlg") ja = wert < (ampNormal ? 0.8 : 0.7) * bew.grenze;
        else if (art === "dml") ja = wert > (ampNormal ? 1.25 : 1.5) * bew.grenze;
        else ja = wert > (ampNormal ? 1.2 : 1.5) * bew.grenze;
        if (ja) { a.demyel.push(art + (ort ? ":" + ort : "")); a.demyelOrt[art + (ort || "")] = true; }
      }
      b.zeilen.forEach(function (z, i) {
        var be = z.bew || {}, w = z.werte;
        if (i === 0) { a.dml = w.lat; a.msap = w.amp; }
        if (i === 0) {
          if (gefaerbt(be.amp)) a.gefaerbt = true;
          if (rot(be.amp)) a.mampRot = true;
          if (gw(be.amp)) a.grenzwertig.push("motorische Amplitude");
          if (rot(be.lat)) demyelPruef(be.lat, w.lat, "dml", "");
        }
        if (rot(be.nlg)) demyelPruef(be.nlg, w.nlg, "nlg", zielVon(be.nlg));
        if (rot(be.fLat)) demyelPruef(be.fLat, w.fLat, "f", "");
        if (gefaerbt(be.lat) || gefaerbt(be.nlg) || gefaerbt(be.fLat)) a.gefaerbt = true;
        if (rot(be.lat)) a.dmlRot = true;
        if (gw(be.lat)) a.grenzwertig.push("distale motorische Latenz");
        if (be.nlg) {
          var ort = zielVon(be.nlg);
          (rot(be.nlg) ? a.mnlgRot : a.mnlgOk).push(ort);
          if (gw(be.nlg))
            a.grenzwertig.push("motorische NLG" + (ORT[ort] ? " " + ORT[ort] : ""));
        }
        if (rot(be.fLat)) a.fRot = true;
        if (gw(be.fLat)) a.grenzwertig.push("F-Wellen-Latenz");
        if (z.unplausibel) a.unplausibel.push(w.nlg);
      });
    });
    g.sens.forEach(function (b) {
      b.zeilen.forEach(function (z) {
        var be = z.bew || {}, w = z.werte;
        if (z.vergleich === "ringfinger") {
          var art = /ulnar/i.test(b.nervText) ? "ulnar" : "median";
          a.ring[art] = w.peak !== undefined && w.peak !== null ? w.peak : w.lat;
          return;
        }
        if (z.unplausibel) { a.unplausibel.push(w.nlg); return; }
        if (z.ohneNorm) return;
        a.sensDa = true;
        // 18.14: Ein Potential ist da, sobald Amplitude ODER NLG ODER
        // Latenz gemessen wurde — „kein SNAP“ nur, wenn alles fehlt.
        if ((w.amp !== null && w.amp !== undefined && w.amp > 0) ||
            (w.nlg !== null && w.nlg !== undefined) ||
            (w.lat !== null && w.lat !== undefined)) a.sensAmpDa = true;
        if (gefaerbt(be.amp) || gefaerbt(be.nlg)) a.gefaerbt = true;
        if (rot(be.amp)) a.sampRot = true;
        if (rot(be.nlg)) a.snlgRot = true;
        if (gw(be.amp)) a.grenzwertig.push("sensible Amplitude");
        if (gw(be.nlg)) a.grenzwertig.push("sensible NLG");
      });
    });
    g.a = a;
    g.muster = muster(g);
    g.rot = a.dmlRot || a.mnlgRot.length > 0 || a.fRot || a.sampRot ||
            a.mampRot || a.snlgRot || (a.sensDa && !a.sensAmpDa);
  }
  function zielVon(bew) { return String(bew.zeileId || ""); }

  // ---- Fokale Muster -------------------------------------------------------
  function muster(g) {
    var a = g.a;
    if (g.id === "medianus") {
      var vaRot = a.mnlgRot.indexOf("va") !== -1;
      var sensAbs = a.sensDa && !a.sensAmpDa;
      if ((a.dmlRot || a.snlgRot || sensAbs) && !vaRot) {
        var grad;
        if (sensAbs && a.msap !== null && a.msap < 0.2) grad = 6;
        else if (a.dml !== null && a.dml > 6.5) grad = 5;
        else if (sensAbs) grad = 4;
        else if (a.dmlRot) grad = 3;
        else grad = 2;
        return { art: "cts", grad: grad };
      }
    }
    if (g.id === "ulnaris" && a.mnlgRot.indexOf("sulcus") !== -1 &&
        a.mnlgRot.indexOf("va") === -1) return { art: "sus" };
    if (g.id === "peronaeus" && a.mnlgRot.indexOf("mknie") !== -1 &&
        a.mnlgRot.indexOf("mus") === -1) return { art: "peron" };
    return null;
  }
  function seiteText(s) { return s ? " " + s : ""; }
  function musterSatz(g) {
    var m = g.muster;
    if (!m) return "";
    if (m.art === "cts") return "Neuropathie über dem Carpaltunnel (Grad " + m.grad +
      " nach Bland – " + BLAND[m.grad] + ")";
    if (m.art === "sus") return "Neuropathie über dem Sulcus nervi ulnaris (Ellbogen)";
    return "Leitungsverzögerung über dem Fibulaköpfchen";
  }
  var DEMYEL = " (im demyelinisierenden Bereich)";
  function einzelheiten(g, ohneMuster) {
    var a = g.a, t = [];
    if (a.dmlRot && !(ohneMuster && g.muster))
      t.push("verlängerte distale motorische Latenz" + (a.demyelOrt.dml ? DEMYEL : ""));
    if (a.mampRot && !(ohneMuster && g.muster && g.muster.art === "cts"))
      t.push("reduzierte motorische Amplitude");
    a.mnlgRot.forEach(function (o) {
      if (ohneMuster && g.muster && (o === "sulcus" || o === "mknie")) return;
      t.push("verlangsamte motorische NLG" + (ORT[o] ? " " + ORT[o] : "") +
        (a.demyelOrt["nlg" + o] ? DEMYEL : ""));
    });
    if (a.fRot) t.push("verlängerte F-Wellen-Latenz" + (a.demyelOrt.f ? DEMYEL : ""));
    if (a.sensDa && !a.sensAmpDa) {
      if (!(ohneMuster && g.muster)) t.push("kein sensibles Potential ableitbar");
    } else {
      if (a.sampRot && !(ohneMuster && g.muster && g.muster.art === "cts"))
        t.push("reduzierte sensible Amplitude");
      if (a.snlgRot && !(ohneMuster && g.muster)) t.push("verlangsamte sensible NLG");
    }
    return t;
  }

  // ---- (1) Zusammenfassung je Nerv und Seite ---------------------------------
  function zusammenfassung(erg) {
    var gs = gruppen(erg), zeilen = [];
    // Ringfinger-Vergleich: Medianus- und Ulnaris-Zeile derselben Seite
    var ring = {};
    gs.forEach(function (g) {
      var r = ring[g.seite] = ring[g.seite] || { median: null, ulnar: null };
      if (g.a.ring.median !== null) r.median = g.a.ring.median;
      if (g.a.ring.ulnar !== null) r.ulnar = g.a.ring.ulnar;
    });
    gs.forEach(function (g) {
      var a = g.a, teile = [];
      // Eine Gruppe nur aus Vergleichszeilen (z. B. Ulnaris-Ringfinger)
      // bekommt keine eigene Zeile — sie steht beim Medianus.
      if (!g.motor.length && !a.sensDa && !a.unplausibel.length) return;
      var ms = musterSatz(g);
      if (ms) teile.push(ms);
      teile = teile.concat(einzelheiten(g, true));
      // 18.17: Grenzwertiges wird beim Namen genannt, bleibt aber
      // ausdrücklich „nicht sicher pathologisch" (Näd 14.10.).
      if (a.grenzwertig.length)
        teile.push("grenzwertige " + a.grenzwertig.join(", grenzwertige ") +
          " (nicht sicher pathologisch)");
      var satz;
      if (teile.length) satz = teile.join(", ");
      else if (a.gefaerbt) satz = "unauffällig";
      else satz = "keine Normwerte hinterlegt – bitte selbst beurteilen";
      var r = ring[g.seite];
      if (g.id === "medianus" && r && r.median !== null && r.ulnar !== null) {
        var d = Math.round((r.median - r.ulnar) * 10) / 10;
        satz += "; Ringfinger-Vergleich Medianus–Ulnaris: " + (d > 0 ? "+" : "") +
          d.toFixed(1) + " ms (Peak-Latenz)";
      }
      if (a.unplausibel.length)
        satz += "; Messwert" + (a.unplausibel.length > 1 ? "e" : "") +
          " unplausibel (NLG " + a.unplausibel.join(" und ") + " m/s) – Distanz prüfen";
      // 18.19 (Näd 16.10.): jeder Nerv als echter Aufzählungspunkt —
      // eingerückt, auch wenn er über mehrere Zeilen geht.
      zeilen.push("• " + g.name + seiteText(g.seite) + ": " + satz + ".");
    });
    // 18.14: Myografie (aus dem Freitext des Viking-Berichts) in Näds Wortlaut
    // 18.22 (Näd 16.10.): je Muskel eine KURZE Zusammenfassung; die
    // Einzelwerte stehen in der Myografie-Tabelle unter den Normwerten.
    var myo = erg.myografie || [];
    if (myo.length) {
      zeilen.push("Myografie:");
      myo.forEach(function (m) {
        zeilen.push("• " + m.muskel + ": " + (m.tabelle ? kurz(m) : m.befund) + ".");
      });
    }
    (erg.freitext || []).forEach(function (t) { zeilen.push(t); });
    return zeilen.join("\n");
  }

  // 18.22: Kurzbefund eines Muskels — die Interpretation des Geräts, wenn
  // es eine gibt, sonst aus den Merkmalen.
  function kurz(m) {
    var i = String(m.interp || "").trim();
    if (i && !/^(normal|unauffällig)$/i.test(i)) {
      var t = i.charAt(0).toLowerCase() + i.slice(1);
      return t + (m.fasz && !/fasz/i.test(t) ? " mit Faszikulationen" : "");
    }
    if (m.myopath) return "myopathisches Muster";
    if (m.spont && m.neurogen) return "pathologische Spontanaktivität und chronisch neurogene Veränderungen";
    if (m.spont) return "pathologische Spontanaktivität" + (m.fasz ? " und Faszikulationen" : "");
    if (m.neurogen) return "chronisch neurogene Veränderungen";
    if (m.fasz) return "Faszikulationen, sonst unauffällig";
    return "unauffällig";
  }
  // Distale Beinmuskeln: Spontanaktivität dort passt zu einer axonalen
  // Polyneuropathie (Näd 16.10.: „pathologische Spontanaktivität in
  // Gastrocnemius und Tibialis anterior passt zu axonaler PNP").
  var DISTAL_BEIN = /gastroc|soleus|tib(ialis)?\.?\s*ant|ext(ensor)?\.?\s*dig|ext(ensor)?\.?\s*hal|\bedb\b|abd(uctor)?\.?\s*hal|peron|fibular|interosse\w*\s+ped|\bfuss|\bfoot/i;

  // ---- (2) Beurteilung ------------------------------------------------------
  function beidseits(liste, satzFn) {
    // gleiche Aussage links und rechts → „beidseits"
    var nachText = {}, reihe = [];
    liste.forEach(function (x) {
      var k = satzFn(x, "");
      if (!nachText[k]) { nachText[k] = []; reihe.push(k); }
      nachText[k].push(x);
    });
    return reihe.map(function (k) {
      var xs = nachText[k];
      if (xs.length === 2 && xs[0].seite && xs[1].seite && xs[0].seite !== xs[1].seite)
        return satzFn(xs[0], " beidseits");
      return xs.map(function (x) { return satzFn(x, seiteText(x.seite)); }).join(" ");
    });
  }

  function beurteilung(erg, fragen) {
    var gs = gruppen(erg), saetze = [], erklaert = {};
    fragen = fragen || [];
    (erg.myografie || []).forEach(function (m) { delete m.erklaert; });
    function nerv(id) { return gs.filter(function (g) { return g.id === id; }); }

    if (fragen.indexOf("pnp") !== -1) {
      var nichtFokal = gs.filter(function (g) {
        if (!g.rot) return false;
        if (!g.muster) return true;
        return einzelheiten(g, true).length > 0;
      });
      var beine = nichtFokal.filter(function (g) {
        return g.id === "suralis" || g.id === "peronaeus" || g.id === "tibialis"; });
      var arme = nichtFokal.length - beine.length;
      var suralGemessen = nerv("suralis").length > 0;
      if (nichtFokal.length >= 2 && beine.length >= 1) {
        var nurSens = nichtFokal.every(function (g) {
          var a = g.a;
          return !a.dmlRot && !a.mnlgRot.length && !a.fRot && !a.mampRot; });
        // 18.18: „demyelinisierend" nur nach AAN-Schwellen, und für die
        // Polyneuropathie erst ab ZWEI Nerven (Näd 15.10.). Leichte
        // Leitungsverzögerungen allein machen keine Demyelinisierung.
        var amp = 0, leitung = 0, demyelNerven = [];
        nichtFokal.forEach(function (g) {
          var a = g.a;
          if (a.sampRot || a.mampRot || (a.sensDa && !a.sensAmpDa)) amp++;
          if (a.snlgRot || a.dmlRot || a.mnlgRot.length || a.fRot) leitung++;
          if (a.demyel.length) demyelNerven.push(g);
        });
        var demyel = demyelNerven.length >= 2;
        var typ = (demyel && amp) ? "gemischt axonal-demyelinisierenden"
          : demyel ? "überwiegend demyelinisierenden"
          : amp ? "am ehesten axonalen" : "";
        var eig = [nurSens ? "sensiblen" : "sensomotorischen"];
        if (beine.length >= arme) eig.push("distal betonten");
        if (typ) eig.push(typ);
        saetze.push("Befundkonstellation passend zu einer " + eig.join(", ") +
          " Polyneuropathie" + (!typ && leitung
            ? " (Leitungsverzögerungen ohne Erreichen der Demyelinisierungskriterien)" : "") + ".");
        // 18.22: Denervation distal am Bein gehört zum PNP-Bild
        var distal = (erg.myografie || []).filter(function (m) {
          return m.spont && DISTAL_BEIN.test(m.muskel); });
        if (distal.length) {
          saetze.push("Die pathologische Spontanaktivität in " +
            distal.map(function (m) { return m.muskel; }).join(", ") +
            (/axonal/.test(typ) ? " passt zur axonalen Schädigung."
                                : " spricht für eine (zusätzliche) axonale Komponente."));
          distal.forEach(function (m) { m.erklaert = true; });
        }
        if (demyelNerven.length === 1)
          saetze.push("Demyelinisierungskriterien nur im " + demyelNerven[0].name +
            seiteText(demyelNerven[0].seite) +
            " erfüllt – für eine demyelinisierende Polyneuropathie nicht ausreichend.");
        nichtFokal.forEach(function (g) { erklaert[g.id + g.seite] = true; });
      } else if (nichtFokal.length === 1 && beine.length === 1) {
        var g1 = beine[0];
        saetze.push("Isoliert auffälliger " + g1.name + seiteText(g1.seite) +
          " – für eine Polyneuropathie allein nicht ausreichend.");
        erklaert[g1.id + g1.seite] = true;
      } else if (nichtFokal.length === 0) {
        saetze.push(suralGemessen ? "Keine Hinweise auf eine Polyneuropathie."
          : "Keine neurographischen Hinweise auf eine Polyneuropathie (N. suralis nicht gemessen).");
      } else {
        saetze.push("Auffällige Befunde ohne Beteiligung der unteren Extremität – kein typisches Polyneuropathie-Muster.");
      }
    }

    // Welches Segment muss gemessen sein, damit „kein Hinweis" stimmt?
    var PFLICHT = { sus: "sulcus", peron: "mknie" };
    function gemessen(g, art) {
      if (!g.motor.length && !g.a.sensDa) return false;   // nur Vergleichszeilen
      var seg = PFLICHT[art];
      if (!seg) return true;
      return g.a.mnlgRot.indexOf(seg) !== -1 || g.a.mnlgOk.indexOf(seg) !== -1;
    }
    function fokal(id, art, ja, nein, fehlt, segmentFehlt) {
      if (fragen.indexOf(art) === -1) return;
      var liste = nerv(id).filter(function (g) { return g.motor.length || g.a.sensDa; });
      if (!liste.length) { saetze.push(fehlt); return; }
      beidseits(liste, function (g, seite) {
        if (g.muster && g.muster.art === art) {
          erklaert[g.id + g.seite] = true;
          return ja(g, seite);
        }
        if (!gemessen(g, art)) return segmentFehlt.replace("%s", seite) ;
        return nein + seite + ".";
      }).forEach(function (s) { saetze.push(s); });
    }
    fokal("medianus", "cts", function (g, s) {
      return "Karpaltunnelsyndrom" + s + " (Grad " + g.muster.grad + " nach Bland – " +
        BLAND[g.muster.grad] + ")."; },
      "Kein Hinweis auf ein Karpaltunnelsyndrom",
      "Karpaltunnelsyndrom: N. medianus nicht gemessen.", "");
    fokal("ulnaris", "sus", function (g, s) {
      return "Hinweise auf eine Ulnarisneuropathie am Ellbogen" + s + "."; },
      "Kein Hinweis auf ein Sulcus-ulnaris-Syndrom",
      "Sulcus-ulnaris-Syndrom: N. ulnaris nicht gemessen.",
      "Sulcus-ulnaris-Syndrom%s: Ellbogensegment nicht gemessen – nicht beurteilbar.");
    fokal("peronaeus", "peron", function (g, s) {
      return "Hinweise auf eine Peroneusläsion am Fibulaköpfchen" + s + "."; },
      "Kein Hinweis auf eine Peroneusläsion am Fibulaköpfchen",
      "Peroneusläsion: N. peroneus nicht gemessen.",
      "Peroneusläsion am Fibulaköpfchen%s: Segment über dem Fibulaköpfchen nicht gemessen – nicht beurteilbar.");

    // 18.14: Fragen, die die Myografie beantwortet
    var myo = erg.myografie || [], myoErklaert = false;
    function namen(liste) { return liste.map(function (m) { return m.muskel; }).join(", "); }
    var spont = myo.filter(function (m) { return m.spont; });
    var spontRest = myo.filter(function (m) { return m.spont && !m.erklaert; });
    var neuro = myo.filter(function (m) { return m.neurogen; });
    var fasz = myo.filter(function (m) { return m.fasz; });
    var myopath = myo.filter(function (m) { return m.myopath; });
    function zusatzMyopath(t) {
      return myopath.length ? t + (t ? "; " : "") + "myopathisches Muster in " + namen(myopath) : t;
    }
    ["radik", "plexus", "mnd", "myo", "nmt"].forEach(function (id) {
      if (fragen.indexOf(id) === -1) return;
      var f = FRAGEN.filter(function (x) { return x.id === id; })[0];
      var frage = "Zur Frage „" + f.text.replace("?", "") + "“: ";
      if (!myo.length || id === "nmt") {
        saetze.push(frage + "neurographisch allein nicht zu beantworten – bitte " +
          (id === "nmt" ? "repetitive Stimulation" : "Myografie") + " ergänzen.");
        return;
      }
      myoErklaert = true;
      if (id === "mnd") {
        if (!spont.length && !neuro.length) {
          saetze.push("Keine elektrophysiologischen Hinweise auf eine Motoneuronerkrankung " +
            "(keine pathologische Spontanaktivität, keine neurogenen Veränderungen in den " +
            "untersuchten Muskeln).");
          if (fasz.length) saetze.push("Vereinzelte Faszikulationen (" + namen(fasz) +
            ") ohne Denervierungszeichen – vereinbar mit benignen Faszikulationen.");
          var unsp = myo.filter(function (m) { return m.unspez && m.unspez.length; });
          if (unsp.length) saetze.push("Unspezifisch: " + unsp.map(function (m) {
            return m.unspez.join(", ") + " (" + m.muskel + ")"; }).join("; ") + ".");
        } else {
          saetze.push(frage + (spont.length ? "pathologische Spontanaktivität in " + namen(spont) : "") +
            (spont.length && neuro.length ? "; " : "") +
            (neuro.length ? "neurogene Veränderungen in " + namen(neuro) : "") +
            " – Verteilung bitte beurteilen.");
        }
        return;
      }
      if (!spont.length && !neuro.length && !myopath.length)
        saetze.push(frage + "Myografie ohne pathologische Spontanaktivität, ohne neurogene " +
          "und ohne myopathische Veränderungen in den untersuchten Muskeln.");
      else
        saetze.push(frage + zusatzMyopath((spont.length ? "pathologische Spontanaktivität in " + namen(spont) : "") +
          (spont.length && neuro.length ? "; " : "") +
          (neuro.length ? "neurogene Veränderungen in " + namen(neuro) : "")) +
          " – Verteilung bitte beurteilen.");
    });
    if (!myoErklaert && (spontRest.length || neuro.length || myopath.length))
      saetze.push("Zusätzlich in der Myografie: " +
        zusatzMyopath((spontRest.length ? "pathologische Spontanaktivität in " + namen(spontRest) : "") +
        (spontRest.length && neuro.length ? "; " : "") +
        (neuro.length ? "neurogene Veränderungen in " + namen(neuro) : "")) + ".");
    if (fragen.indexOf("verlauf") !== -1)
      saetze.push("Vergleich mit der Voruntersuchung: bitte ergänzen.");

    // Zusätzlich Pathologisches, das keine Antwort erklärt hat.
    // 18.19: „Zusätzlich" nur, wenn davor schon etwas steht; die
    // Einzelheiten nach einem Gedankenstrich statt in einer zweiten
    // Klammer (Näds Bild 16.10.: „(… (im demyelinisierenden Bereich))").
    gs.forEach(function (g) {
      if (!g.rot || erklaert[g.id + g.seite]) return;
      var vor = saetze.length ? "Zusätzlich: " : "";
      if (g.muster && g.muster.art === "cts")
        saetze.push(vor + "Karpaltunnelsyndrom" + seiteText(g.seite) +
          " (Grad " + g.muster.grad + " nach Bland – " + BLAND[g.muster.grad] + ").");
      else if (g.muster)
        saetze.push(vor + musterSatz(g) + seiteText(g.seite) + ".");
      else
        saetze.push((saetze.length ? "Zusätzlich auffällig: " : "Auffällig: ") +
          g.name + seiteText(g.seite) + " – " + einzelheiten(g, false).join(", ") + ".");
    });
    if (!saetze.length) {
      var gefaerbtIrgendwo = gs.some(function (g) { return g.a.gefaerbt; });
      saetze.push(gefaerbtIrgendwo ? "Unauffällige Neurographie der untersuchten Nerven."
        : "Keine Normwerte für die gemessenen Nerven – bitte selbst beurteilen.");
    }
    return saetze.length > 1
      ? saetze.map(function (s) { return "• " + s; }).join("\n") : saetze[0];
  }

  // ---- Text → HTML (für das Kopieren) ----------------------------------------
  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function alsHtml(text) {
    var P = '<p style="font-family:Arial;font-size:10pt;margin:0">';
    var zeilen = String(text || "").split("\n"), html = [], liste = [];
    function listeZu() {
      if (!liste.length) return;
      html.push('<ul style="font-family:Arial;font-size:10pt;margin:0">' +
        liste.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>");
      liste = [];
    }
    zeilen.forEach(function (z) {
      if (/^\s*[•\-]\s+/.test(z)) { liste.push(z.replace(/^\s*[•\-]\s+/, "")); return; }
      listeZu();
      html.push(z.trim() ? P + esc(z) + "</p>" : P + "<br></p>");
    });
    listeZu();
    return html.join("");
  }

  return { FRAGEN: FRAGEN, fragenAusText: fragenAusText, gruppen: gruppen,
           zusammenfassung: zusammenfassung, beurteilung: beurteilung,
           alsHtml: alsHtml, BLAND: BLAND };
})();
