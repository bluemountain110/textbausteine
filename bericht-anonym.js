// Datei: bericht-anonym.js
// Projekt: Textbausteine — Teil: App (Browser), nur App
// Zweck: Der Bericht-Anonymisierer ;;anon (18.10, Näds Wunsch 13.10.):
//        Bericht UND Zusatzuntersuchungen in EIN Feld — heraus kommt EIN
//        langer Text ohne Patientenbezug, den Näd an Claude oder
//        OpenEvidence weitergeben kann.
//        Weg:   Name + Geburtsdatum (+ Vorname)  → [Patient] / entfernt
//               Alter + Geschlecht               → bleiben (Kopfzeile)
//               Strasse, PLZ/Ort, Telefon, Mail  → [Adresse] usw.
//               Briefkopf, Anrede, Unterschrift,
//               Kopie-/Verteiler-Zeilen          → ganz weg
//               alle Ärztinnen/Ärzte             → [Arzt]
//               Angehörige mit Namen             → [Name]
//               „Spital Limmattal"               → „Untersuchungsspital"
//        Bleiben: Untersuchungs-Daten, Institute, alle Befunde.
//        Reine Logik ohne Oberfläche (das Fenster wohnt in
//        ansicht-bericht-anonym.js) — darum im Selbsttest prüfbar.
//        GRUNDSATZ: Nichts hiervon wird gespeichert oder abgeglichen.

"use strict";
window.TB = window.TB || {};

TB.berichtAnonym = (function () {
  var B = "A-ZÄÖÜ", K = "a-zäöüßéèêàâçëïîôûñ";
  // Ein Namens-Wort: gross beginnend, danach klein, Bindestrich-Namen
  // (Müller-Meier) und O'Brien-Formen inbegriffen.
  var NW = "[" + B + "][" + K + "]+(?:['’][" + B + "][" + K + "]+)?(?:-[" + B + "][" + K + "]+)?";
  var PART = "(?:von|van|de|der|den|del|della|di|da|dos|du|le|la|zu|ten|ter)";
  var NAME = "(?:(?:[" + B + "]\\.\\s?)?" + NW + "|[" + B + "]\\.)(?:[ \\t]+(?:" + PART + "[ \\t]+)?(?:" + NW + "|[" + B + "]\\.))*";
  var KEIN_BUCHST = "(?<![A-Za-zÄÖÜäöüßéèêàâçëïîôûñ])";
  var KEIN_BUCHST_N = "(?![A-Za-zÄÖÜäöüßéèêàâçëïîôûñ])";

  var MONATE = { januar: 1, februar: 2, "märz": 3, maerz: 3, april: 4, mai: 5,
    juni: 6, juli: 7, august: 8, september: 9, oktober: 10, november: 11,
    dezember: 12 };
  var DATUM_ZAHL = "\\d{1,2}\\.\\s?\\d{1,2}\\.\\s?(?:\\d{4}|\\d{2})(?!\\d)";
  var DATUM_WORT = "\\d{1,2}\\.\\s?(?:Januar|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\\s+\\d{4}";
  var DATUM = "(?:" + DATUM_WORT + "|" + DATUM_ZAHL + ")";

  // Wörter, die NIE Namen sind (klein geschrieben verglichen).
  var KEINE_NAMEN = ("herr herrn frau fräulein kollege kollegin kollegen " +
    "doktor dr prof professor pd patient patientin patienten pat med " +
    "arzt ärztin ärzte oberarzt oberärztin chefarzt chefärztin leitender " +
    "leitende assistenzarzt assistenzärztin facharzt fachärztin hausarzt " +
    "hausärztin spitalarzt spitalärztin konsiliararzt neurologe neurologin " +
    "radiologe radiologin neuroradiologe neuroradiologin psychiater " +
    "psychiaterin kardiologe kardiologin internist internistin " +
    "neurochirurg neurochirurgin geriater geriaterin neuropsychologe " +
    "neuropsychologin psychologe psychologin pflege pflegefachfrau " +
    "neurologie radiologie neuroradiologie klinik praxis institut spital " +
    "untersuchungsspital abteilung zentrum innere medizin kardiologie " +
    "psychiatrie neurochirurgie chirurgie notfall station sprechstunde " +
    "fmh msc phd md team sekretariat ambulatorium departement universität " +
    "universitätsspital kantonsspital klinikum nuklearmedizin geriatrie " +
    "memory clinic dank vielen besten freundlichen grüsse grüße gruss " +
    "liebe lieber sehr geehrte geehrter betreff betrifft januar februar " +
    "märz april mai juni juli august september oktober november dezember " +
    "montag dienstag mittwoch donnerstag freitag samstag sonntag heute " +
    "morgen gestern bitte und oder sowie mit ohne bei nach vom von der die " +
    "das dem den des ein eine einer im in am an auf zur zum für " +
    // Abschnitts-Überschriften (stehen oft allein auf einer Zeile)
    "diagnose diagnosen anamnese befund befunde beurteilung procedere " +
    "prozedere therapie therapien medikation medikamente verlauf " +
    "zusammenfassung fragestellung indikation technik methode untersuchung " +
    "untersuchungen status neurostatus labor liquor epikrise empfehlung " +
    "empfehlungen einschätzung vorgeschichte sozialanamnese systemanamnese " +
    "familienanamnese fremdanamnese noxen allergien austritt eintritt " +
    "kontrolle termin bericht kurzbericht austrittsbericht konsilium " +
    "procedere beilage beilagen").split(" ");
  var KEIN_NAME = {};
  KEINE_NAMEN.forEach(function (w) { KEIN_NAME[w] = true; });
  // Hauptwörter, die hinter „Mutter/Vater …" stehen können (Familien-
  // anamnese) und darum NIE als Angehörigen-Name gelten.
  // Endung + Mindestlänge (damit Lorenz, Marion, Tom, Dominik Namen bleiben)
  var FACH_ENDUNG = [["ung", 5], ["heit", 6], ["keit", 6], ["ion", 7],
    ["ose", 6], ["osis", 6], ["itis", 6], ["om", 6], ["ie", 8], ["ik", 9],
    ["ismus", 6], ["ität", 6], ["enz", 7], ["anz", 6], ["farkt", 6],
    ["anfall", 6], ["leiden", 6], ["krankheit", 6], ["erkrankung", 6],
    ["schwäche", 6], ["störung", 6], ["schmerz", 6], ["schmerzen", 6],
    ["syndrom", 6], ["tumor", 5], ["krebs", 5], ["insult", 6],
    ["schlag", 6], ["parese", 6], ["plegie", 6], ["pathie", 6],
    ["ämie", 5], ["urie", 5], ["algie", 6], ["logie", 6], ["zyt", 6],
    ["zyten", 6]];
  var VORNAMEN_IE = { stephanie: 1, stefanie: 1, nathalie: 1, jacqueline: 1,
    rosemarie: 1, annemarie: 1, hannelore: 1 };
  function hatFachEndung(k) {
    if (VORNAMEN_IE[k]) return false;
    return FACH_ENDUNG.some(function (e) {
      return k.length >= e[1] && k.slice(-e[0].length) === e[0]; });
  }
  var FACH_WORT = ("diabetes morbus parkinson alzheimer huntington " +
    "hypertonus asthma herz lunge lungen brust darm niere nieren leber " +
    "hirnschlag stroke status verdacht vd st epilepsie migräne demenz " +
    "depression angst alkohol nikotin keine kein unauffällig gesund " +
    "verstorben lebt ca bekannt befund befunde angaben aussage aussagen " +
    "symptome beschwerden verlauf zustand situation fall familie " +
    "angehörige ehefrau ehemann tochter sohn kinder eltern multiple " +
    "amyotrophe progressive primär sekundär essentieller idiopathische").split(" ");
  var FACH = {};
  FACH_WORT.forEach(function (w) { FACH[w] = true; });

  var ROLLEN = "(?:Haus(?:arzt|ärztin)|Ober(?:arzt|ärztin)|Chef(?:arzt|ärztin)|Assistenz(?:arzt|ärztin)|Fach(?:arzt|ärztin)|Spital(?:arzt|ärztin)|Konsiliar(?:arzt|ärztin)|Leitende[rn]?\\s+(?:Arzt|Ärztin)|Kolleg(?:e|in|en)|Neurolog(?:e|in)|Neuroradiolog(?:e|in)|Radiolog(?:e|in)|Psychiater(?:in)?|Kardiolog(?:e|in)|Internist(?:in)?|Neurochirurg(?:in)?|Geriater(?:in)?|Neuropsycholog(?:e|in)|Psycholog(?:e|in)|Physiotherapeut(?:in)?|Ergotherapeut(?:in)?|Logopäd(?:e|in))";
  var ANGEHOERIGE = "(?:Ehefrau|Ehemann(?:e?s)?|Ehegatte|Ehegattin|Gattin|Gatte|Lebenspartner(?:in|s)?|Partner(?:in|s)?|Freund(?:in|es)?|Tochter|Töchter|Sohn(?:e?s)?|Söhne|Bruders?|Schwester|Mutter|Vaters?|Enkel(?:in|s)?|Nichte|Neffe|Schwiegertochter|Schwiegersohn|Schwägerin|Schwager|Cousine|Cousin|Beistand|Beiständin|Nachbar(?:in)?|Bezugsperson|Betreuer(?:in)?)";
  var TITEL_EIN = "(?<![A-Za-z])(?:Prof\\.|Professor(?:in)?|PD(?![A-Za-z])|Priv\\.-?\\s?Doz\\.|Dr\\.|Dres\\.|Dipl\\.|dipl\\.|lic\\.|pract\\.)";
  var TITEL_ALLE = "(?:(?:Prof\\.|Professor(?:in)?|PD|Priv\\.-?\\s?Doz\\.|Dr\\.|Dres\\.|med\\.|pract\\.|dent\\.|phil\\.|rer\\.|nat\\.|sc\\.|univ\\.|habil\\.|Dipl\\.|dipl\\.|lic\\.|em\\.|psych\\.|Psych\\.|Ing\\.|oec\\.|iur\\.|biol\\.|MSc|BSc|MAS|MBA|PhD|MD)[ \\t]*)";
  var RE_ARZT = new RegExp("(?:(Herrn?|Frau|Hr\\.|Fr\\.)[ \\t]+)?" + TITEL_EIN +
    "[ \\t]*" + TITEL_ALLE + "*(" + NAME + ")", "g");

  var PLATZ = /\[(?:Patient|Arzt|Name|Adresse|PLZ Ort|Ort|Telefon|E-Mail|Nr|Geburtsdatum|Kürzel)\]/g;
  var PLATZ1 = new RegExp(PLATZ.source);
  var ANKER = /(diagnose|anamnese|befund|beurteilung|procedere|prozedere|therapie|medikation|medikament|verlauf|zusammenfassung|fragestellung|indikation|technik|methode|untersuchung|neurostatus|labor|liquor|\bmri\b|\bmrt\b|\bct\b|\bpet\b|spect|\beeg\b|enmg|\bemg\b|\bnlg\b|duplex|doppler|sonograph|sonograf|röntgen|bericht|epikrise|empfehlung|einschätzung|klinische angaben|vorgeschichte|neuropsycholog|\bekg\b|echokardiograph|angiograph|schädel|neurokranium|kopf-?mri|szintigraph|biopsie|punktion|histolog|konsil|assessment|testung|scores?\b|moca|mmse?\b)/i;

  // ---- Datum ----------------------------------------------------------
  function leseDatum(s) {
    s = String(s || "").trim();
    var m = /^(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4}|\d{2})$/.exec(s);
    var t, mo, j;
    if (m) { t = +m[1]; mo = +m[2]; j = +m[3]; }
    else {
      m = /^(\d{1,2})\.\s?([A-Za-zäÄ]+)\s+(\d{4})$/.exec(s);
      if (!m) return null;
      t = +m[1]; mo = MONATE[m[2].toLowerCase()]; j = +m[3];
      if (!mo) return null;
    }
    if (j < 100) {
      var jetztJ = new Date().getFullYear() % 100;
      j += (j > jetztJ ? 1900 : 2000);
    }
    if (t < 1 || t > 31 || mo < 1 || mo > 12 || j < 1880 || j > 2100) return null;
    return { t: t, m: mo, j: j };
  }
  function gleichesDatum(a, b) {
    return !!a && !!b && a.t === b.t && a.m === b.m && a.j === b.j;
  }
  function alterAm(geb, ref) {
    var a = ref.j - geb.j;
    if (ref.m < geb.m || (ref.m === geb.m && ref.t < geb.t)) a -= 1;
    return a;
  }
  function zweistellig(n) { return (n < 10 ? "0" : "") + n; }
  function datumText(d) { return zweistellig(d.t) + "." + zweistellig(d.m) + "." + d.j; }

  // ---- Bausteine der Erkennung ----------------------------------------
  function istNamensWort(w) {
    if (!w || w.length < 2) return false;
    if (!new RegExp("^" + NW + "$").test(w)) return false;
    return !KEIN_NAME[w.toLowerCase()];
  }
  function namensStuecke(text) {
    // „Herr Peter Müller-Meier" → Peter, Müller-Meier, Müller, Meier
    var aus = [];
    String(text || "").split(/[\s,;\/()]+/).forEach(function (w) {
      w = w.replace(/^[^A-Za-zÄÖÜäöü]+|[^A-Za-zÄÖÜäöüßéèêàâçëïîôûñ]+$/g, "");
      if (!istNamensWort(w)) return;
      aus.push(w);
      if (w.indexOf("-") > 0) w.split("-").forEach(function (t) {
        if (istNamensWort(t)) aus.push(t); });
    });
    return aus;
  }
  // Vom Anfang eines Treffers höchstens 3 Namens-Wörter (plus Initialen
  // und von/van/de …) nehmen — „Dr. med. Hans Muster Befund: …" darf
  // nicht das Wort „Befund" mitreissen. → { name, rest }
  function nameAbschneiden(s, bekannt) {
    var re = /\S+/g, x, ende = 0, n = 0, letzterPartikel = false, nameEnde = 0;
    var vorher = "";
    while ((x = re.exec(s))) {
      var tok = x[0].replace(/[,;:.]+$/, function (p) {
        return /^[A-ZÄÖÜ]$/.test(x[0].slice(0, -1)) ? p : ""; });
      var istInit = /^[A-ZÄÖÜ]\.$/.test(x[0]);
      var istPart = new RegExp("^" + PART + "$").test(tok);
      var weiterOk = istNamensWort(tok) && n < 3 && !(n > 0 && fachwort(tok));
      // Genitiv („Herrn Müllers Befund"): nach „Müllers" ist Schluss
      if (n > 0 && /s$/.test(vorher) && bekannt &&
          bekannt.indexOf(vorher.slice(0, -1)) !== -1) weiterOk = false;
      if (istInit || istPart || weiterOk) {
        if (!istInit && !istPart) { n++; vorher = tok; }
        letzterPartikel = istPart;
        ende = x.index + (istInit ? x[0].length : tok.length);
        if (!istPart) nameEnde = ende;
        if (tok.length !== x[0].length && !istInit) break;   // Satzzeichen beendet
      } else break;
    }
    if (letzterPartikel || !n) ende = nameEnde;
    return { name: s.slice(0, ende), rest: s.slice(ende) };
  }

  // „Schwester Multiple Sklerose": steht direkt danach ein Fachwort,
  // war das vermeintliche Namens-Wort Teil einer Krankheit.
  function folgtFachwort(text, pos) {
    var m = /^\s+([A-ZÄÖÜ][\wäöüß-]*)/.exec(String(text).slice(pos));
    return !!m && fachwort(m[1]);
  }

  function eindeutig(liste) {
    var s = {}, aus = [];
    liste.forEach(function (x) { if (!s[x]) { s[x] = true; aus.push(x); } });
    return aus;
  }
  function fachwort(w) {
    var k = String(w || "").toLowerCase();
    if (FACH[k] || KEIN_NAME[k]) return true;
    var letzt = k.split("-").pop();
    return hatFachEndung(k) || hatFachEndung(letzt) || !!FACH[letzt];
  }

  // Aus „Herr Peter Müller, geb. 03.04.1955, Dorfstrasse 5, 8953 Dietikon"
  // bzw. „Müller, Peter (M), 03.04.1955" die Namens-Stücke.
  function kopfNamen(rest) {
    rest = String(rest || "").replace(/^\s*(?:Herrn?|Frau|Hr\.|Fr\.|Pat\.|Patient(?:in)?)\s+/i, "");
    var aus = [];
    var teile = rest.split(/\s*[,;]\s*|\s+\/\s+|\s+[–-]\s+/);
    for (var i = 0; i < teile.length && i < 3; i++) {
      var t = teile[i];
      if (/\d|geb|gebor|\*/i.test(t)) break;
      if (/(strasse|straße|gasse|weg|platz)\b/i.test(t)) break;
      var st = namensStuecke(t.replace(/\([^)]*\)/g, " "));
      if (!st.length) { if (aus.length) break; else continue; }
      aus = aus.concat(st);
      if (aus.length >= 4) break;
    }
    return aus;
  }

  // Pre-Pass über den GANZEN Text: Patient, Geburtsdatum, Geschlecht,
  // Berichtsdaten — und die Namen von Ärzten und Angehörigen, damit
  // sie auch dort verschwinden, wo sie ohne Titel stehen.
  function erkenne(text) {
    var e = { name: [], geburt: null, geburtRoh: "", geschlecht: "",
              arzt: [], weitere: [], berichtsdaten: [] };
    var zeilen = text.split("\n");
    zeilen.forEach(function (z) {
      var t = z.trim(), m;
      if ((m = /^(?:Betrifft|Betreff|Betr\.)\s*:?\s*(.+)$/i.exec(t)) ||
          (m = /^(?:Patient(?:in)?|Pat\.|Patientenname)\s*:\s*(.+)$/i.exec(t))) {
        if (!e.geschlecht) {
          if (/^\s*(Herrn?|Hr\.)\s/i.test(m[1])) e.geschlecht = "männlich";
          else if (/^\s*(Frau|Fr\.)\s/i.test(m[1])) e.geschlecht = "weiblich";
        }
        e.name = e.name.concat(kopfNamen(m[1]));
      }
      if ((m = /^(?:Name|Nachname|Familienname|Vorname|Vornamen?)\s*:\s*([^:]+?)(?:\s{2,}\S+\s*:.*)?$/i.exec(t)))
        e.name = e.name.concat(namensStuecke(m[1]));
      var bd = berichtsDatum(t);
      if (bd) e.berichtsdaten.push(bd.datum);
      if ((m = /^(?:Geschlecht|Sex)\s*:\s*(\S+)/i.exec(t)) && !e.geschlecht) {
        if (/^(m|männlich|maennlich|male)\b/i.test(m[1])) e.geschlecht = "männlich";
        if (/^(w|f|weiblich|female)\b/i.test(m[1])) e.geschlecht = "weiblich";
      }
    });
    // Geburtsdatum: hinter geb./geboren/*/Geburtsdatum/DOB
    var gm = new RegExp("(?:geb\\.?(?:oren)?(?:\\s+am)?|Geburtsdatum|Geb\\.-?\\s?Datum|DOB|\\*)\\s*:?\\s*(" + DATUM + ")", "i").exec(text);
    if (gm) { e.geburt = leseDatum(gm[1]); e.geburtRoh = gm[1]; }
    // Kopfzeile ohne Beschriftung („Müller Peter, 03.04.1955 (71 J.)“)
    // in den ersten Zeilen: Name + ein Datum, das als Geburtsdatum
    // taugt (mindestens 10 Jahre zurück).
    if (!e.geburt) {
      var jetztJ = new Date().getFullYear();
      zeilen.filter(function (z) { return z.trim(); }).slice(0, 20).some(function (z) {
        var k = new RegExp("^\\s*(?:(?:Herrn?|Frau)\\s+)?(" + NW + "(?:[ ,]+" + NW + "){0,3})\\s*,\\s*(" + DATUM + ")").exec(z);
        if (!k) return false;
        var dd = leseDatum(k[2]);
        if (!dd || dd.j > jetztJ - 10) return false;
        var st = namensStuecke(k[1]).filter(function (w) { return !fachwort(w); });
        if (!st.length) return false;
        e.geburt = dd; e.geburtRoh = k[2];
        e.name = e.name.concat(st);
        return true;
      });
    }
    // „Herr/Frau NAME, geb. …" mitten im Text
    var hm = new RegExp("(Herrn?|Frau)[ \\t]+(" + NAME + ")\\s*,?\\s*(?:\\(|geb|\\*)", "g");
    var x;
    while ((x = hm.exec(text))) {
      e.name = e.name.concat(namensStuecke(x[2]));
      if (!e.geschlecht) e.geschlecht = /^Herr/.test(x[1]) ? "männlich" : "weiblich";
    }
    e.name = eindeutig(e.name);
    if (!e.geschlecht) {
      var w = (text.match(/\b(Patientin|Frau)\b/g) || []).length;
      var mm = (text.match(/\b(Patient|Herrn?)\b/g) || []).length;
      if (w > mm) e.geschlecht = "weiblich";
      else if (mm > w) e.geschlecht = "männlich";
    }
    // Ärzte (mit Titel): Namens-Stücke sammeln
    var re = new RegExp(RE_ARZT.source, "g");
    while ((x = re.exec(text)))
      e.arzt = e.arzt.concat(namensStuecke(nameAbschneiden(x[2]).name));
    // Rolle + Name („Hausärztin Meier")
    re = new RegExp("\\b" + ROLLEN + "[ \\t]+(?:(?:Herrn?|Frau)[ \\t]+)?(" + NW + ")", "g");
    while ((x = re.exec(text))) if (!fachwort(x[1])) e.arzt.push(x[1]);
    // Angehörige + Name („Ehefrau Anna", „Tochter Frau Sandra Meier")
    re = new RegExp("\\b" + ANGEHOERIGE + "[ \\t]+(?:(?:Herrn?|Frau)[ \\t]+)?(" + NW + "(?:[ \\t]+" + NW + ")?)(?=[\\s,;.)!?:]|$)", "g");
    while ((x = re.exec(text))) {
      if (folgtFachwort(text, re.lastIndex)) continue;
      var st = namensStuecke(x[1]).filter(function (w) { return !fachwort(w); });
      // Zweites Wort nur, wenn das erste schon ein Name war
      if (st.length && !fachwort(x[1].split(/\s+/)[0])) e.weitere = e.weitere.concat(st);
    }
    // Herr/Frau + Name, wo es nicht der Patient ist (Ärzte ohne Titel,
    // Angehörige, Pflege) — ausser „Herr Kollege", „Frau Doktor" …
    re = new RegExp("\\b(?:Herrn?|Frau|Hr\\.|Fr\\.)[ \\t]+(" + NAME + ")", "g");
    while ((x = re.exec(text))) {
      var st2 = namensStuecke(nameAbschneiden(x[1], e.name).name);
      e.weitere = e.weitere.concat(st2.filter(function (w) {
        return e.name.indexOf(w) === -1 && e.name.indexOf(w.replace(/s$/, "")) === -1; }));
    }
    e.arzt = eindeutig(e.arzt).filter(function (w) { return e.name.indexOf(w) === -1; });
    e.weitere = eindeutig(e.weitere).filter(function (w) {
      return e.name.indexOf(w) === -1 && e.arzt.indexOf(w) === -1; });
    return e;
  }

  // „Schlieren, 12.10.2026 / ab" → Berichtsdatum 12.10.2026
  function berichtsDatum(t) {
    var m = new RegExp("^([" + B + "][A-Za-z" + K + ".\\- ]{1,30}),\\s*(?:den\\s+)?(" + DATUM + ")\\s*(?:\\/\\s*[A-Za-zäöü0-9]{1,10}(?:\\s*\\/\\s*[A-Za-zäöü0-9]{1,10})*)?\\s*$").exec(t);
    if (!m) return null;
    // Nur ein Ortsname (1–3 Wörter), nie „MRI Schädel, 01.10.2026"
    if (woerter(m[1]).length > 3 || ANKER.test(m[1])) return null;
    m = [m[0], m[2]];
    var d = leseDatum(m[1]);
    return d ? { datum: d, roh: m[1] } : null;
  }

  // ---- Zeilen-Arten ---------------------------------------------------
  // Nur echte Grussformeln — „Vielen Dank für die Zuweisung" am
  // Briefanfang ist Inhalt, kein Schluss.
  var RE_GRUSS = /^(mit\s+)?((freundlich|kollegial|herzlich|best|lieb)\w*\s+)?(grü(ss|ß)\w*|gruss|gruß)\b|^hochachtungsvoll/i;
  var RE_ANREDE = /^(sehr\s+geehrte[rs]?|liebe[rs]?|geschätzte[rs]?|hallo|guten\s+tag)\b/i;
  var RE_KOPF = /^(betrifft|betreff|betr\.|patient(?:in)?\s*:|pat\.\s*:|patientenname|name\s*:|nachname|familienname|vornamen?\s*:|geburtsdatum|geb\.?\s*-?datum|geboren\s*:|geb\.\s|adresse\s*:|wohnadresse|wohnort|strasse\s*:|plz\b|telefon\s*:|tel\.\s*:|mobile?\s*:|natel|e-?mail\s*:|ahv|sozialversicherung|versicherten|versicherung\s*:|krankenkasse|kasse\s*:|police\b|fall-?\s?nr|fallnummer|fall\s*:|pid\b|pat\.?-?\s?nr|patienten-?\s?(nr|nummer|id)|auftrags-?\s?(nr|nummer)|zuweiser\s*:|zuweisende[rn]?\s+(arzt|ärztin|stelle)|überweisende[rn]?\s+(arzt|ärztin)|zugewiesen\s+(von|durch)|kopie\s*(an\b|z\.?\s?k\.?)?\s*:|kopie\s+an\b|cc\s*:|z\.\s?k\.|verteiler|elektronisch\s+(visiert|unterschrieben|signiert)|visiert|diktiert|geschrieben\s*:|signiert|i\.\s?a\.|i\.\s?v\.|im\s+auftrag)/i;
  var VOR = "(?<![A-Za-zÄÖÜäöüß])";   // \b kennt keine Umlaute
  var RE_ROLLE_ZEILE = new RegExp(ROLLEN + "|" + VOR + "(Leitende[rn]?\\s+Ärzt|Ärztliche[rns]?\\b|Arzt\\b|Ärztin\\b|Ärzte\\b|Sekretariat|Assistenz|Klinikdirektor|Klinikleiter|Direktor|Chefärzt)", "i");
  var RE_KONTAKT = /(\btel\b|\btel\.|telefon|\bfax\b|e-?mail|@|www\.|https?:|\.ch\b|\.com\b|postfach|\b0\d{2}\s?\d{3}\s?\d{2}\s?\d{2}\b|\+41)/i;
  var RE_STRASSE = new RegExp("(?:" + VOR + "(?:" + NW + "[\\s-])?[" + B + "]?[" + K + "-]*(?:strasse|straße|str\\.|gasse|weg|platz|allee|rain|halde|matte|graben|quai|steig|ring|acker|park|hof)\\s+\\d+\\s?[a-zA-Z]?\\b|\\b(?:Rue|Route|Chemin|Avenue|Via|Viale|Piazza|Place)\\s+[^,\\n]{2,30}?\\s+\\d+[a-z]?\\b)", "g");
  var KANTONE = "(?:ZH|AG|BE|LU|UR|SZ|OW|NW|GL|ZG|FR|SO|BS|BL|SH|AR|AI|SG|GR|TG|TI|VD|VS|NE|GE|JU)";
  var RE_PLZ_ORT = new RegExp("(?:CH-\\s?)?\\b[1-9]\\d{3}\\s+" + NW + "(?:[\\s-](?:" + NW + "|am|an|im|bei|b\\.)){0,3}(?:\\s+" + KANTONE + "\\b)?", "g");
  var RE_TITEL_ZEILE = /\b(Prof\.|PD\b|Dr\.|med\.|pract\.|lic\.|dipl\.|Dipl\.|FMH\b|MSc\b|PhD\b)/;
  var RE_INSTITUTION = new RegExp(VOR + "(Spital|Klinik|Institut|Praxis|Zentrum|Abteilung|Departement|Limmattal|Ambulatorium|Universität|Gruppenpraxis|Ärztezentrum|AG|GmbH)(?![A-Za-zäöü])");

  function woerter(t) { return String(t).split(/\s+/).filter(Boolean); }
  // Zeile nur aus Namen („Anna Beispiel", „- H. Muster")?
  function nurNamen(t) {
    var w = woerter(t.replace(/^[-–•·*\s]+/, "").replace(/[,;]/g, " "));
    if (!w.length || w.length > 4) return false;
    return w.every(function (x) {
      return /^[A-ZÄÖÜ]\.$/.test(x) || (istNamensWort(x.replace(/\.$/, "")) && !fachwort(x)); });
  }
  // Gehört die Zeile zu Briefkopf oder Unterschrift?
  function kopfOderUnterschrift(t, modus) {
    // Titel-Zeilen der Unterschrift zuerst („Dr. med. R. Röntgenberg"
    // enthält sonst den Anker „Röntgen")
    if (RE_TITEL_ZEILE.test(t) && woerter(t).length <= 8 && !/:/.test(t)) return true;
    if (ANKER.test(t)) return false;
    if (new RegExp(DATUM).test(t) && !RE_KONTAKT.test(t)) return false;
    if (/^(Herrn?|Frau|Familie|An|z\.\s?H\.?|zu\s+Handen)$/i.test(t)) return true;
    if (RE_TITEL_ZEILE.test(t) || RE_ROLLE_ZEILE.test(t) || RE_KONTAKT.test(t)) return woerter(t).length <= 30;
    if (RE_KOPF.test(t)) return true;
    if (new RegExp(RE_STRASSE.source).test(t) || /^(CH-\s?)?[1-9]\d{3}\s/.test(t)) return true;
    if (RE_INSTITUTION.test(t)) return woerter(t).length <= 10;
    // Nach dem Gruss: kurze Rest-Zeilen („- Patient", „z.d.A.")
    if (modus === "unterschrift" && woerter(t).length <= 3) return true;
    return nurNamen(t);
  }

  // ---- Ersetzen innerhalb einer Zeile ---------------------------------
  function esc(w) { return String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function wortRe(w, flags) {
    var e = esc(w);
    return new RegExp(KEIN_BUCHST + "(?:" + e + "|" + e.toUpperCase() + ")s?" + KEIN_BUCHST_N, flags || "g");
  }

  function ersetzeZeile(z, ctx) {
    var t = z;
    // 1. Das untersuchende Spital
    t = t.replace(/\b(?:Spitals?|Spitäler)\s+Limmattal\b/gi, "Untersuchungsspital")
         .replace(/\bLimmattalspital\b/gi, "Untersuchungsspital")
         .replace(/\bLimmi\b/g, "Untersuchungsspital");
    // 2. Kontakt und Nummern
    t = t.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[E-Mail]")
         .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "")
         .replace(/\b[\w-]+\.(?:ch|com|de|org|net|swiss)\b(?:\/\S*)?/gi, "");
    t = t.replace(/\b756[.\s]?\d{4}[.\s]?\d{4}[.\s]?\d{2}\b/g, "[Nr]");
    t = t.replace(/\b((?:Fall|PID|Pat(?:ienten)?|Auftrags|Untersuchungs|Versicherten|Versicherungs|Policen|Kunden|Akten|Kassen|AHV)[-.\s]?(?:Nr\.?|Nummer|ID|Id)\s*[:#]?\s*)\d[\d.\-\/]*/gi, "$1[Nr]")
         .replace(/\b(PID|ID)(\s*:\s*)\d[\d\s-]*\d/g, "$1$2[Nr]");
    t = t.replace(/(?:\+41|0041)\s?\(?0?\)?\s?\d{2}[\s.\/-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b|\b0\d{2}[\s.\/-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/g, "[Telefon]");
    // 3. Geburtsdatum (in jeder Schreibweise)
    if (ctx.geburt) {
      t = t.replace(new RegExp(DATUM, "g"), function (d) {
        return gleichesDatum(leseDatum(d), ctx.geburt) ? "[Geburtsdatum]" : d;
      });
    }
    // 4. Ärzte mit Titel (Titel + höchstens 3 Namens-Wörter)
    t = t.replace(new RegExp(RE_ARZT.source, "g"), function (ganz, anrede, name) {
      var teil = nameAbschneiden(name);
      if (!teil.name) return ganz;
      return (anrede ? anrede + " " : "") + "[Arzt]" + teil.rest;
    });
    // 5. Rolle + Name, Angehörige + Name
    t = t.replace(new RegExp("\\b(" + ROLLEN + ")[ \\t]+(?:(Herrn?|Frau)[ \\t]+)?(" + NW + ")", "g"),
      function (ganz, rolle, anrede, name) {
        if (fachwort(name) || ctx.behalten[name] || !istNamensWort(name)) return ganz;
        return rolle + " " + (anrede ? anrede + " " : "") + "[Arzt]";
      });
    t = t.replace(new RegExp("\\b(" + ANGEHOERIGE + ")[ \\t]+(?:(Herrn?|Frau)[ \\t]+)?(" + NW + ")(?=[\\s,;.)!?:]|$)", "g"),
      function (ganz, rel, anrede, name, pos, alles) {
        if (fachwort(name) || ctx.behalten[name] || !istNamensWort(name)) return ganz;
        if (folgtFachwort(alles, pos + ganz.length)) return ganz;
        var ist = ctx.patient.indexOf(name) !== -1 ? "[Patient]" : "[Name]";
        return rel + " " + (anrede ? anrede + " " : "") + ist;
      });
    // 6. Herr/Frau + Name
    t = t.replace(new RegExp("\\b(Herrn?|Frau|Hr\\.|Fr\\.)[ \\t]+(" + NAME + ")", "g"),
      function (ganz, anrede, name) {
        var teil = nameAbschneiden(name, ctx.patient);
        var st = namensStuecke(teil.name);
        if (!st.length) return ganz;
        if (st.every(function (w) { return ctx.behalten[w]; })) return ganz;
        // [Patient] nur, wenn ALLE Stücke zum Patienten gehören — „Frau
        // Ruth Müller" (Ehefrau, gleicher Nachname) ist [Name].
        var pat = st.every(function (w) {
          return ctx.patient.indexOf(w) !== -1 || ctx.patient.indexOf(w.replace(/s$/, "")) !== -1; });
        var gen = pat && /s$/.test(teil.name) && st.length === 1 &&
          ctx.patient.indexOf(st[0]) === -1 ? "s" : "";
        return anrede + " " + (pat ? "[Patient]" + gen : "[Name]") + teil.rest;
      });
    // 7. Adressen (VOR den Namen: „8903 Birmensdorf ZH“ muss als Adresse fallen)
    var hatteStrasse = false;
    t = t.replace(new RegExp(RE_STRASSE.source, "g"), function () { hatteStrasse = true; return "[Adresse]"; });
    t = t.replace(/\bPostfach(?:\s+\d+)?\b/g, "");
    var kurz = woerter(t).length <= 6;
    t = t.replace(new RegExp(RE_PLZ_ORT.source, "g"), function (ganz, pos, alles) {
      var zahl = +(/\d{4}/.exec(ganz)[0]);
      var vorher = alles.slice(0, pos);
      var amAnfang = /^\s*[-–•·*]?\s*$/.test(vorher);
      var nachKomma = /,\s*$/.test(vorher) || /\[Adresse\]\s*,?\s*$/.test(vorher);
      var nachWohn = /\b(in|aus|nach|wohnhaft)\s*$/i.test(vorher);
      var istJahr = zahl >= 1900 && zahl <= 2099;
      if (/^CH-/.test(ganz) || hatteStrasse || (amAnfang && kurz) ||
          ((nachKomma || nachWohn) && !istJahr) || (nachKomma && kurz))
        return "[PLZ Ort]";
      return ganz;
    });
    t = t.replace(new RegExp("\\b([Ww]ohnhaft|[Ww]ohnt|[Ll]ebt|[Ww]ohnend|[Zz]uhause|[Zz]u Hause)([ \\t]+(?:in|im|bei|allein in|alleine in)[ \\t]+)(" + NW + ")", "g"),
      function (ganz, a, b, ort) { return fachwort(ort) ? ganz : a + b + "[Ort]"; });
    // 8. Gesammelte Namen überall
    ctx.patient.forEach(function (w) { t = t.replace(wortRe(w), "[Patient]"); });
    ctx.zusatz.forEach(function (w) { t = t.replace(wortRe(w, "gi"), "[Name]"); });
    ctx.arzt.forEach(function (w) { if (!ctx.behalten[w]) t = t.replace(wortRe(w), "[Arzt]"); });
    ctx.weitere.forEach(function (w) { if (!ctx.behalten[w]) t = t.replace(wortRe(w), "[Name]"); });
    // 9. Benutzer- und Diktatkürzel (KISIM: „/ NADTIS01“ verrät den Arzt)
    t = t.replace(/\s*\/\s*[A-Z]{3,8}\d{1,3}\s*$/, "")
         .replace(/\b(?!COVID)[A-Z]{5,8}\d{1,3}\b/g, "[Kürzel]");
    // 10. Lange Nummern
    t = t.replace(/\b\d{7,}\b/g, "[Nr]");
    return t;
  }

  // Bleibt nach dem Ersetzen nur Kontakt/Adresse/Anrede übrig? Dann weg.
  function nurPlatzhalter(t) {
    if (!t.trim()) return true;
    if (!PLATZ1.test(t)) return false;
    var rest = t.replace(PLATZ, " ")
      .replace(new RegExp(ROLLEN, "g"), " ")
      .replace(new RegExp(VOR + "(Herrn?|Frau|Hr\\.|Fr\\.|und|sowie|Tel\\.?|Telefon|Fax|E-Mail|Mail|Web|Postfach|CH|Leitende[rn]?|Arzt|Ärztin|Ärzte|Neurologie|FMH|für|z\\.\\s?H\\.|zu\\s+Handen|Direktwahl|Zentrale|Sekretariat|" + KANTONE + ")(?![A-Za-zäöü])", "gi"), " ")
      .replace(/[\s\d.,;:\/|•·\-–()+]+/g, "");
    return rest.length === 0;
  }

  // ---- Hauptweg -------------------------------------------------------
  // angaben: { name, geburt (Datum ODER Alter in Jahren), geschlecht
  //            ("männlich"/"weiblich"), fragestellung, zusatz [Wörter],
  //            behalten [Wörter], heute (Date, nur für Tests) }
  function anonymisiere(eingabe, angaben) {
    angaben = angaben || {};
    var text = String(eingabe || "").replace(/\r\n?/g, "\n")
      .replace(/[   ]/g, " ").replace(/[ \t]+$/gm, "")
      // „ED 06.10.2026Ätiologie“: beim Kopieren aus KISIM verlorener Umbruch
      .replace(/(\d{1,2}\.\d{1,2}\.\d{4})(?=[A-ZÄÖÜ][a-zäöü])/g, "$1\n");
    var er = erkenne(text);
    var prot = [];   // nur fürs Fenster (Kontrolle), NIE in die Ausgabe

    // Angaben von Hand gehen vor (und ergänzen die Erkennung)
    var patient = er.name.slice();
    if (angaben.name) patient = eindeutig(namensStuecke(angaben.name).concat(patient));
    var geburt = er.geburt, alterDirekt = null;
    var hg = String(angaben.geburt || "").trim();
    if (hg) {
      var d = leseDatum(hg);
      if (d) geburt = d;
      else if (/^\d{1,3}$/.test(hg)) alterDirekt = +hg;
    }
    var geschlecht = angaben.geschlecht || er.geschlecht || "";

    var ref = null;
    er.berichtsdaten.forEach(function (d) {
      if (!ref || d.j * 400 + d.m * 32 + d.t > ref.j * 400 + ref.m * 32 + ref.t) ref = d;
    });
    var heute = angaben.heute || new Date();
    if (!ref) ref = { t: heute.getDate(), m: heute.getMonth() + 1, j: heute.getFullYear() };
    var alter = alterDirekt !== null ? alterDirekt : (geburt ? alterAm(geburt, ref) : null);

    var behalten = {};
    (angaben.behalten || []).forEach(function (w) { behalten[w] = true; });
    var ctx = { patient: patient, geburt: geburt, arzt: er.arzt,
      weitere: er.weitere, behalten: behalten,
      zusatz: eindeutig((angaben.zusatz || []).filter(function (w) {
        return String(w).trim().length >= 2; })) };

    // Zeilen
    var aus = [], modus = "kopf", dokumente = 1, trenner = false;
    function behalte(zeile) {
      if (trenner) { aus.push("", "--- nächstes Dokument ---", ""); dokumente++; trenner = false; }
      aus.push(zeile);
    }
    text.split("\n").forEach(function (z) {
      var t = z.trim();
      if (!t) { if (!modus) aus.push(""); return; }
      var bd = berichtsDatum(t);
      if (bd) {
        if (modus === "unterschrift") trenner = true;
        modus = "kopf";
        behalte("Berichtsdatum: " + datumText(bd.datum));
        if (t.replace(bd.roh, "").replace(/[,\s\/]/g, "").length) prot.push({ art: "Ort beim Datum", text: t });
        return;
      }
      if (RE_GRUSS.test(t)) { modus = "unterschrift"; prot.push({ art: "Gruss/Unterschrift", text: t }); return; }
      if (RE_ANREDE.test(t)) { prot.push({ art: "Anrede", text: t }); return; }
      if (RE_KOPF.test(t)) { prot.push({ art: "Patienten-/Kopfangaben", text: t }); return; }
      if (geburt && woerter(t).length <= 14 && new RegExp(DATUM).test(t)) {
        var hatGeb = false;
        (t.match(new RegExp(DATUM, "g")) || []).forEach(function (x) {
          if (gleichesDatum(leseDatum(x), geburt)) hatGeb = true; });
        if (hatGeb) { prot.push({ art: "Zeile mit Geburtsdatum", text: t }); return; }
      }
      if (modus) {
        if (kopfOderUnterschrift(t, modus)) {
          prot.push({ art: modus === "kopf" ? "Briefkopf" : "Unterschrift/Verteiler", text: t });
          return;
        }
        if (modus === "unterschrift") trenner = true;
        modus = "";
      }
      var neu = ersetzeZeile(z.replace(/\s+$/, ""), ctx);
      if (nurPlatzhalter(neu)) { prot.push({ art: "nur Kontakt/Adresse", text: t }); return; }
      if (neu !== z.replace(/\s+$/, "")) prot.push({ art: "ersetzt", text: t, neu: neu });
      behalte(neu);
    });
    var koerper = aus.join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\n+|\n+$/g, "");

    // Kopf der Ausgabe
    var kopf = ["=== ANONYMISIERTER BERICHT ===",
      "Patient: " + (alter !== null ? alter + " Jahre" : "Alter unbekannt") + ", " +
        (geschlecht || "Geschlecht unbekannt"),
      "Hinweis: [Patient] = der Patient/die Patientin, [Arzt] = behandelnde Ärztin/behandelnder Arzt, " +
        "[Name] = weitere Person; [Adresse], [PLZ Ort], [Telefon], [Nr], [Kürzel] = entfernte Angaben. " +
        "„Untersuchungsspital“ = das untersuchende Spital. Untersuchungsdaten sind echt."];
    if (angaben.fragestellung && String(angaben.fragestellung).trim())
      kopf.push("Fragestellung: " + String(angaben.fragestellung).trim());
    var ausgabe = kopf.join("\n") + "\n\n" + koerper + "\n";

    // Schlussprüfung: kein Namens-Stück, kein Geburtsdatum mehr
    var warnungen = [], reste = [];
    patient.concat(ctx.zusatz).forEach(function (w) {
      if (new RegExp(KEIN_BUCHST + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + KEIN_BUCHST_N, "i").test(koerper)) reste.push(w);
    });
    if (geburt) (koerper.match(new RegExp(DATUM, "g")) || []).forEach(function (x) {
      if (gleichesDatum(leseDatum(x), geburt)) reste.push(x); });
    if (reste.length) {
      // Sicherheitsnetz: dann eben grob schwärzen
      reste.forEach(function (w) {
        ausgabe = ausgabe.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "[entfernt]");
      });
      warnungen.push("Nachgeschwärzt: " + reste.length + " Rest-Fund(e) — bitte die Vorschau ansehen.");
    }
    if (!patient.length) warnungen.push("Name nicht erkannt — bitte oben eingeben (sonst bleibt er evtl. stehen, wo er ohne „Herr/Frau“ steht).");
    if (alter === null) warnungen.push("Geburtsdatum nicht erkannt — bitte Geburtsdatum oder Alter eingeben.");
    if (!geschlecht) warnungen.push("Geschlecht nicht erkannt — bitte männlich/weiblich wählen.");

    var erg = { text: ausgabe, alter: alter, geschlecht: geschlecht,
      erkannt: { name: er.name, geburt: er.geburt ? datumText(er.geburt) : "",
                 geschlecht: er.geschlecht },
      namenArzt: er.arzt, namenWeitere: er.weitere, protokoll: prot,
      dokumente: dokumente, warnungen: warnungen };
    // Nur im Arbeitsspeicher, für das Nachschwärzen (nicht aufzählbar)
    Object.defineProperty(erg, "schutz", { value: {
      patient: patient.concat(ctx.zusatz), geburt: geburt } });
    return erg;
  }

  // ---- Fürs Fenster: Verdachtswörter, Nachschwärzen -------------------
  // Gelb markiert werden gross geschriebene Wörter, die ein Name sein
  // KÖNNTEN: nicht am Satzanfang, nicht hinter Artikel oder gebeugtem
  // Eigenschaftswort („der Sprechstunde", „linken Bein"), keine typische
  // Hauptwort-Endung, kein bekanntes Fach-/Abschnittswort. Ein Wort,
  // das irgendwo im Text als Hauptwort erkennbar ist, gilt überall als
  // Hauptwort. Das ist eine Lese-HILFE — es entfernt nichts.
  var ARTIKEL = /^(der|die|das|den|dem|des|ein|eine|einer|eines|einem|einen|kein|keine|keiner|keinen|keinem|keines|zur|zum|im|am|vom|beim|ins|ans|aufs|seine[mnrs]?|sein|ihre[mnrs]?|ihr|unsere[mnrs]?|unser|diese[mnrs]?|jede[mnrs]?|alle[mnrs]?|beide[n]?|mehrere|einige|viele|wenige|welche[mnrs]?|deren|dessen|etwas|viel|wenig|mehr|kein|keinerlei|bei|seit|ohne|für|gegen|unter|über|wegen|trotz)$/i;
  var NOMEN_ENDUNG = /(ung|ungen|heit|heiten|keit|keiten|schaft|ion|ionen|tät|ik|ie|ien|ismus|nis|nisse|tum|ling|ment|ur|ei|enz|anz|ose|itis|om|ome|al|ar|är|iv|in|innen|ten|tor|tion|ität|ese|yse|ase|in)$/;
  var HAEUFIG = {};
  ("jahr jahre jahren monat monate monaten woche wochen tag tage tagen " +
   "stunde stunden minute minuten ort hause haus tel kopf schädel bein " +
   "beine arm arme hand hände fuss füsse auge augen mund gesicht rücken " +
   "nacken knie hüfte schulter finger zehen links rechts seite seiten " +
   "mal hinweis hinweise zeit punkte punkt grad dosis mg").split(" ")
    .forEach(function (w) { HAEUFIG[w] = true; });
  function verdachtsWoerter(text) {
    var re = new RegExp(NW, "g"), x, hauptwort = {}, kandidat = {};
    var t = String(text || "");
    while ((x = re.exec(t))) {
      var w = x[0], vor = t.slice(Math.max(0, x.index - 40), x.index);
      var vorWort = (/([A-Za-zÄÖÜäöüß]+)[ \t]+$/.exec(vor) || [])[1] || "";
      var satzAnfang = /(^|[\n.!?:;•·\-–]|\d\.)\s*$/.test(vor) || /\[$/.test(vor);
      if (vorWort && (ARTIKEL.test(vorWort) ||
          (/^[a-zäöüß]/.test(vorWort) && /(e|en|er|es|em)$/.test(vorWort) && vorWort.length > 3))) {
        hauptwort[w] = true; continue;
      }
      if (satzAnfang) continue;
      kandidat[w] = true;
    }
    var aus = {};
    Object.keys(kandidat).forEach(function (w) {
      var k = w.toLowerCase();
      if (hauptwort[w] || KEIN_NAME[k] || FACH[k] || fachwort(w)) return;
      if (w.length < 3 || NOMEN_ENDUNG.test(k)) return;
      if (/^(Untersuchungsspital|Patient|Patientin)$/.test(w)) return;
      if (new RegExp("^" + ANGEHOERIGE + "$").test(w) || HAEUFIG[k]) return;
      aus[w] = true;
    });
    return aus;
  }

  // Letzte Sicherung vor Kopieren/Sichern (auch nach eigenen Änderungen
  // rechts): Namens-Stücke des Patienten und das Geburtsdatum.
  function nachschwaerzen(text, ergebnis) {
    var s = ergebnis && ergebnis.schutz, n = 0, t = String(text || "");
    if (!s) return { text: t, anzahl: 0 };
    (s.patient || []).forEach(function (w) {
      t = t.replace(new RegExp(KEIN_BUCHST + esc(w) + "s?" + KEIN_BUCHST_N, "gi"),
        function () { n++; return "[Patient]"; });
    });
    if (s.geburt) t = t.replace(new RegExp(DATUM, "g"), function (d) {
      if (gleichesDatum(leseDatum(d), s.geburt)) { n++; return "[Geburtsdatum]"; }
      return d;
    });
    return { text: t, anzahl: n };
  }

  // Ein markiertes Wort überall schwärzen (Gross/klein egal).
  function schwaerzeWort(text, wort) {
    wort = String(wort || "").trim();
    if (wort.length < 2) return String(text || "");
    return String(text || "").replace(
      new RegExp(KEIN_BUCHST + esc(wort) + KEIN_BUCHST_N, "gi"), "[Name]");
  }

  function dateiname(jetzt) {
    var d = jetzt || new Date();
    return "Bericht-anonym-" + d.getFullYear() + "-" + zweistellig(d.getMonth() + 1) + "-" +
      zweistellig(d.getDate()) + "-" + zweistellig(d.getHours()) +
      zweistellig(d.getMinutes()) + zweistellig(d.getSeconds()) + ".txt";
  }

  return { anonymisiere: anonymisiere, dateiname: dateiname,
           verdachtsWoerter: verdachtsWoerter, nachschwaerzen: nachschwaerzen,
           schwaerzeWort: schwaerzeWort,
           leseDatum: leseDatum, namensStuecke: namensStuecke };
})();
