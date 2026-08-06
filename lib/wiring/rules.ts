import { getComponent } from "@/content/components";
import type { PinKind } from "@/content/types";
import {
  pinOf,
  type Diagnostic,
  type PowerBudget,
  type WiringDoc
} from "./types";

/* ══════════════════════════════════════════════════════════════
   Règles de validation du câblage.
   Chaque règle renvoie des diagnostics ; aucune n'interrompt les autres.
   ══════════════════════════════════════════════════════════════ */

const ALIM: PinKind[] = ["VIN", "5V", "3V3"];
const SIGNAUX_LOGIQUES: PinKind[] = [
  "GPIO",
  "SDA",
  "SCL",
  "TX",
  "RX",
  "PWM",
  "MOSI",
  "MISO",
  "SCK",
  "CS",
  "ANALOG",
  "ENC_A",
  "ENC_B"
];

function nomDe(doc: WiringDoc, uid: string) {
  const p = doc.placed.find((x) => x.uid === uid);
  const c = p ? getComponent(p.componentId) : undefined;
  return c?.name ?? "?";
}

/* ─────────────── Règle 1 : tension incompatible ─────────────── */

function regleTension(doc: WiringDoc): Diagnostic[] {
  const out: Diagnostic[] = [];

  for (const link of doc.links) {
    const pa = doc.placed.find((p) => p.uid === link.from.uid);
    const pb = doc.placed.find((p) => p.uid === link.to.uid);
    if (!pa || !pb) continue;
    const a = pinOf(pa, link.from.pinId);
    const b = pinOf(pb, link.to.pinId);
    if (!a || !b) continue;

    for (const [src, dst, srcP, dstP] of [
      [a, b, pa, pb],
      [b, a, pb, pa]
    ] as const) {
      if (src.volts === undefined || dst.volts === undefined) continue;
      if (src.kind === "GND" || dst.kind === "GND") continue;

      // Un signal 5 V vers une entrée 3,3 V non tolérante détruit la broche.
      if (
        src.volts >= 4.5 &&
        dst.volts <= 3.6 &&
        dst.tolerant5v !== true &&
        SIGNAUX_LOGIQUES.includes(dst.kind)
      ) {
        out.push({
          id: `tension-${link.id}`,
          level: "erreur",
          title: "Tension incompatible",
          detail: `${src.label} de « ${nomDe(doc, srcP.uid)} » sort en ${src.volts} V et attaque ${dst.label} de « ${nomDe(doc, dstP.uid)} », qui est en ${dst.volts} V sans tolérance 5 V. Cette broche sera détruite. Il faut un adaptateur de niveau.`,
          uids: [srcP.uid, dstP.uid]
        });
        break;
      }

      // Alimentation trop élevée pour l'entrée
      if (
        ALIM.includes(src.kind) &&
        dst.kind === "VIN" &&
        src.dir === "out" &&
        dst.dir === "in"
      ) {
        const cDst = getComponent(dstP.componentId);
        if (cDst && cDst.voltage.max > 0 && src.volts > cDst.voltage.max + 0.2) {
          out.push({
            id: `alim-${link.id}`,
            level: "erreur",
            title: "Tension d'alimentation trop élevée",
            detail: `« ${nomDe(doc, srcP.uid)} » fournit ${src.volts} V à « ${nomDe(doc, dstP.uid)} », dont le maximum est ${cDst.voltage.max} V. Ajoute un abaisseur.`,
            uids: [srcP.uid, dstP.uid]
          });
        }
      }
    }
  }

  return out;
}

/* ─────────────── Règle 2 : masse commune ─────────────── */

function regleMasse(doc: WiringDoc): Diagnostic[] {
  if (doc.placed.length < 2) return [];

  const relies = new Set<string>();
  for (const link of doc.links) {
    const pa = doc.placed.find((p) => p.uid === link.from.uid);
    const pb = doc.placed.find((p) => p.uid === link.to.uid);
    if (!pa || !pb) continue;
    const a = pinOf(pa, link.from.pinId);
    const b = pinOf(pb, link.to.pinId);
    if (a?.kind === "GND" && b?.kind === "GND") {
      relies.add(pa.uid);
      relies.add(pb.uid);
    }
  }

  const sansMasse = doc.placed.filter(
    (p) => !relies.has(p.uid) && (getComponent(p.componentId)?.pins.some((x) => x.kind === "GND") ?? false)
  );

  if (sansMasse.length === 0) return [];

  return [
    {
      id: "masse",
      level: "erreur",
      title: "Masse commune absente",
      detail: `${sansMasse.length} composant(s) n'ont pas leur GND relié : ${sansMasse.map((p) => nomDe(doc, p.uid)).join(", ")}. Sans référence de masse commune, aucun signal logique n'a de sens et les bus I2C ou série ne fonctionnent pas.`,
      uids: sansMasse.map((p) => p.uid)
    }
  ];
}

/* ─────────────── Règle 3 : bus I2C ─────────────── */

function regleI2C(doc: WiringDoc): Diagnostic[] {
  const out: Diagnostic[] = [];

  // Croisement SDA / SCL
  for (const link of doc.links) {
    const pa = doc.placed.find((p) => p.uid === link.from.uid);
    const pb = doc.placed.find((p) => p.uid === link.to.uid);
    if (!pa || !pb) continue;
    const a = pinOf(pa, link.from.pinId);
    const b = pinOf(pb, link.to.pinId);
    if (!a || !b) continue;

    const paireI2C =
      (a.kind === "SDA" && b.kind === "SCL") ||
      (a.kind === "SCL" && b.kind === "SDA");

    if (paireI2C) {
      out.push({
        id: `i2c-croise-${link.id}`,
        level: "erreur",
        title: "SDA relié à SCL",
        detail: `Sur un bus I2C, SDA va sur SDA et SCL sur SCL. Ici « ${nomDe(doc, pa.uid)} » et « ${nomDe(doc, pb.uid)} » sont croisés : le bus ne répondra jamais.`,
        uids: [pa.uid, pb.uid]
      });
    }
  }

  // Adresses dupliquées parmi les composants reliés au bus
  const surBus = doc.placed.filter((p) => {
    const c = getComponent(p.componentId);
    if (!c?.i2cAddress) return false;
    return doc.links.some((l) => {
      const impliques = [l.from, l.to];
      return impliques.some((r) => {
        if (r.uid !== p.uid) return false;
        const pin = pinOf(p, r.pinId);
        return pin?.kind === "SDA" || pin?.kind === "SCL";
      });
    });
  });

  const parAdresse = new Map<string, string[]>();
  for (const p of surBus) {
    const c = getComponent(p.componentId);
    if (!c?.i2cAddress) continue;
    const liste = parAdresse.get(c.i2cAddress) || [];
    liste.push(p.uid);
    parAdresse.set(c.i2cAddress, liste);
  }

  for (const [adresse, uids] of parAdresse) {
    if (uids.length < 2) continue;
    const noms = uids.map((u) => nomDe(doc, u));
    const modifiables = uids.filter((u) => {
      const p = doc.placed.find((x) => x.uid === u);
      const c = p ? getComponent(p.componentId) : undefined;
      return (c?.i2cAlternates?.length ?? 0) > 0;
    });

    out.push({
      id: `i2c-addr-${adresse}`,
      level: "erreur",
      title: `Conflit d'adresse I2C ${adresse}`,
      detail:
        `${noms.join(" et ")} partagent l'adresse ${adresse} sur le même bus. Aucun des deux ne répondra correctement. ` +
        (modifiables.length > 0
          ? `Change l'adresse de ${nomDe(doc, modifiables[0])} par cavalier.`
          : `Aucun des deux n'a d'adresse alternative : il faut un multiplexeur TCA9548A.`),
      uids
    });
  }

  return out;
}

/* ─────────────── Règle 4 : liaison série ─────────────── */

function regleUart(doc: WiringDoc): Diagnostic[] {
  const out: Diagnostic[] = [];

  for (const link of doc.links) {
    const pa = doc.placed.find((p) => p.uid === link.from.uid);
    const pb = doc.placed.find((p) => p.uid === link.to.uid);
    if (!pa || !pb) continue;
    const a = pinOf(pa, link.from.pinId);
    const b = pinOf(pb, link.to.pinId);
    if (!a || !b) continue;

    if ((a.kind === "TX" && b.kind === "TX") || (a.kind === "RX" && b.kind === "RX")) {
      out.push({
        id: `uart-${link.id}`,
        level: "erreur",
        title: `Liaison série non croisée (${a.kind} ↔ ${b.kind})`,
        detail: `Sur une liaison série, TX va sur RX et RX sur TX. Ici « ${nomDe(doc, pa.uid)} » et « ${nomDe(doc, pb.uid)} » relient deux ${a.kind} : aucune donnée ne passera.`,
        uids: [pa.uid, pb.uid]
      });
    }
  }

  return out;
}

/* ─────────────── Règle 5 : moteur sans driver ─────────────── */

function regleMoteur(doc: WiringDoc): Diagnostic[] {
  const out: Diagnostic[] = [];

  for (const link of doc.links) {
    const pa = doc.placed.find((p) => p.uid === link.from.uid);
    const pb = doc.placed.find((p) => p.uid === link.to.uid);
    if (!pa || !pb) continue;
    const a = pinOf(pa, link.from.pinId);
    const b = pinOf(pb, link.to.pinId);
    if (!a || !b) continue;

    for (const [m, s, mp, sp] of [
      [a, b, pa, pb],
      [b, a, pb, pa]
    ] as const) {
      if (m.kind !== "MOTOR") continue;
      const cS = getComponent(sp.componentId);
      const estDriver = cS?.category === "driver";
      if (estDriver) continue;

      if (SIGNAUX_LOGIQUES.includes(s.kind)) {
        out.push({
          id: `moteur-${link.id}`,
          level: "erreur",
          title: "Moteur relié directement à une sortie logique",
          detail: `« ${nomDe(doc, mp.uid)} » est branché sur ${s.label} de « ${nomDe(doc, sp.uid)} ». Une broche logique délivre quelques milliampères : le moteur ne tournera pas et la sortie grillera. Il faut un étage de puissance entre les deux.`,
          uids: [mp.uid, sp.uid]
        });
        break;
      }
    }
  }

  return out;
}

/* ─────────────── Règle 6 : budget d'énergie ─────────────── */

export function budget(doc: WiringDoc): PowerBudget {
  let fourni = 0;
  let consommeTyp = 0;
  let consommePeak = 0;
  const lignes: PowerBudget["lignes"] = [];

  for (const p of doc.placed) {
    const c = getComponent(p.componentId);
    if (!c) continue;
    const fournit = c.suppliesMa ?? 0;
    fourni += fournit;
    consommeTyp += c.currentMa.typ;
    consommePeak += c.currentMa.peak;
    lignes.push({
      nom: c.name,
      typ: c.currentMa.typ,
      peak: c.currentMa.peak,
      fournit
    });
  }

  return { fourni, consommeTyp, consommePeak, lignes };
}

function regleBudget(doc: WiringDoc): Diagnostic[] {
  const b = budget(doc);
  if (b.fourni === 0) {
    if (doc.placed.length > 0 && b.consommeTyp > 0) {
      return [
        {
          id: "budget-source",
          level: "alerte",
          title: "Aucune source d'énergie",
          detail: `Le montage consomme ${b.consommeTyp} mA en régime établi mais aucune batterie ni régulateur n'est posé. Ajoute une source pour vérifier le budget.`
        }
      ];
    }
    return [];
  }

  const out: Diagnostic[] = [];

  if (b.consommeTyp > b.fourni) {
    out.push({
      id: "budget-typ",
      level: "erreur",
      title: "Budget de courant dépassé en régime établi",
      detail: `Le montage consomme ${b.consommeTyp} mA alors que les sources fournissent ${b.fourni} mA. La tension va s'effondrer en permanence.`
    });
  } else if (b.consommePeak > b.fourni) {
    const marge = Math.round((b.consommePeak / b.fourni) * 100);
    out.push({
      id: "budget-peak",
      level: "alerte",
      title: "Budget dépassé en pointe",
      detail: `En régime établi tout va bien (${b.consommeTyp} mA pour ${b.fourni} mA disponibles), mais les pics cumulés atteignent ${b.consommePeak} mA, soit ${marge} % de la capacité. Au démarrage des moteurs ou des servos, la tension chutera et le calculateur risque de redémarrer. Sépare les alimentations.`
    });
  } else if (b.consommeTyp > b.fourni * 0.8) {
    out.push({
      id: "budget-marge",
      level: "info",
      title: "Marge d'énergie faible",
      detail: `${b.consommeTyp} mA consommés pour ${b.fourni} mA disponibles : il reste moins de 20 % de marge. Prévois plus large.`
    });
  }

  return out;
}

/* ─────────────── Règle 7 : composants non alimentés ─────────────── */

function regleAlimentation(doc: WiringDoc): Diagnostic[] {
  const alimentes = new Set<string>();

  for (const link of doc.links) {
    for (const r of [link.from, link.to]) {
      const p = doc.placed.find((x) => x.uid === r.uid);
      if (!p) continue;
      const pin = pinOf(p, r.pinId);
      if (pin && ALIM.includes(pin.kind) && pin.dir !== "out") {
        alimentes.add(p.uid);
      }
      // Un périphérique USB tire son énergie du bus.
      if (pin?.kind === "USB") alimentes.add(p.uid);
    }
  }

  const orphelins = doc.placed.filter((p) => {
    if (alimentes.has(p.uid)) return false;
    const c = getComponent(p.componentId);
    if (!c) return false;
    if (c.currentMa.typ === 0) return false;
    if (c.suppliesMa) return false;
    return c.pins.some((x) => ALIM.includes(x.kind) && x.dir !== "out");
  });

  if (orphelins.length === 0) return [];

  return [
    {
      id: "non-alimente",
      level: "alerte",
      title: "Composants non alimentés",
      detail: `${orphelins.map((p) => nomDe(doc, p.uid)).join(", ")} : aucune entrée d'alimentation n'est reliée.`,
      uids: orphelins.map((p) => p.uid)
    }
  ];
}

/* ─────────────── Règle 8 : broche utilisée deux fois ─────────────── */

function regleBrocheOccupee(doc: WiringDoc): Diagnostic[] {
  const compte = new Map<string, number>();

  for (const link of doc.links) {
    for (const r of [link.from, link.to]) {
      const p = doc.placed.find((x) => x.uid === r.uid);
      if (!p) continue;
      const pin = pinOf(p, r.pinId);
      // Les bus et les rails d'alimentation acceptent plusieurs connexions.
      if (!pin || ["GND", "SDA", "SCL", "CAN_H", "CAN_L", "5V", "3V3", "VIN", "USB"].includes(pin.kind))
        continue;
      const cle = `${r.uid}|${r.pinId}`;
      compte.set(cle, (compte.get(cle) || 0) + 1);
    }
  }

  const doubles = [...compte.entries()].filter(([, n]) => n > 1);
  if (doubles.length === 0) return [];

  return doubles.map(([cle, n]) => {
    const [uid, pinId] = cle.split("|");
    const p = doc.placed.find((x) => x.uid === uid)!;
    const pin = pinOf(p, pinId);
    return {
      id: `occupee-${cle}`,
      level: "alerte" as const,
      title: `Broche ${pin?.label} utilisée ${n} fois`,
      detail: `Sur « ${nomDe(doc, uid)} », la broche ${pin?.label} porte ${n} liaisons. Hors bus partagé, une broche ne pilote qu'un seul signal.`,
      uids: [uid]
    };
  });
}

/* ─────────────── Règle 9 : broche d'activation ─────────────── */

function regleActivation(doc: WiringDoc): Diagnostic[] {
  const out: Diagnostic[] = [];

  for (const p of doc.placed) {
    const c = getComponent(p.componentId);
    if (c?.category !== "driver") continue;
    const stby = c.pins.find((x) =>
      ["stby", "en", "r_en", "l_en"].includes(x.id.toLowerCase())
    );
    if (!stby) continue;

    const relie = doc.links.some((l) =>
      [l.from, l.to].some((r) => r.uid === p.uid && r.pinId === stby.id)
    );
    if (relie) continue;

    out.push({
      id: `stby-${p.uid}`,
      level: "info",
      title: `Broche ${stby.label} non reliée sur ${c.name}`,
      detail: `Ce driver reste inhibé tant que ${stby.label} n'est pas pilotée. C'est la cause numéro un de « le driver est alimenté mais rien ne sort ».`,
      uids: [p.uid]
    });
  }

  return out;
}

/* ─────────────── Point d'entrée ─────────────── */

export function valider(doc: WiringDoc): Diagnostic[] {
  const tous = [
    ...regleTension(doc),
    ...regleMasse(doc),
    ...regleI2C(doc),
    ...regleUart(doc),
    ...regleMoteur(doc),
    ...regleBudget(doc),
    ...regleAlimentation(doc),
    ...regleBrocheOccupee(doc),
    ...regleActivation(doc)
  ];

  const ordre = { erreur: 0, alerte: 1, info: 2 };
  return tous.sort((a, b) => ordre[a.level] - ordre[b.level]);
}

/* ─────────────── Nomenclature ─────────────── */

export function bom(doc: WiringDoc) {
  const compte = new Map<string, number>();
  for (const p of doc.placed) {
    compte.set(p.componentId, (compte.get(p.componentId) || 0) + 1);
  }

  const lignes = [...compte.entries()]
    .map(([id, n]) => {
      const c = getComponent(id);
      if (!c) return null;
      return {
        id,
        nom: c.name,
        marque: c.brand,
        categorie: c.category,
        quantite: n,
        prixUnitaire: c.price,
        total: c.price * n,
        masse: (c.weightG ?? 0) * n
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.total - a.total);

  return {
    lignes,
    total: lignes.reduce((n, l) => n + l.total, 0),
    masse: lignes.reduce((n, l) => n + l.masse, 0)
  };
}

export function bomCsv(doc: WiringDoc): string {
  const { lignes, total } = bom(doc);
  const head = "Composant;Marque;Categorie;Quantite;PrixUnitaire;Total";
  const rows = lignes.map(
    (l) =>
      `${l.nom};${l.marque};${l.categorie};${l.quantite};${l.prixUnitaire};${l.total}`
  );
  return [head, ...rows, `;;;;TOTAL;${total}`].join("\n");
}
