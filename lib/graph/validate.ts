import { getMsgType, shortName } from "@/content/msgs";
import type { Edge, GDiagnostic, GraphDoc, Qos } from "./types";

/* ══════════════════════════════════════════════════════════════
   Règle de compatibilité DDS : le subscriber ne peut jamais exiger
   davantage que ce que le publisher offre.
   ══════════════════════════════════════════════════════════════ */

export function compatibiliteQos(
  pub: Qos,
  sub: Qos
): { ok: boolean; raison?: string } {
  if (pub.reliability === "BEST_EFFORT" && sub.reliability === "RELIABLE") {
    return {
      ok: false,
      raison:
        "Le subscriber exige RELIABLE alors que le publisher n'offre que BEST_EFFORT. Aucune connexion n'est établie, et aucune erreur n'est affichée."
    };
  }
  if (pub.durability === "VOLATILE" && sub.durability === "TRANSIENT_LOCAL") {
    return {
      ok: false,
      raison:
        "Le subscriber demande TRANSIENT_LOCAL — recevoir le dernier message publié avant son démarrage — alors que le publisher est VOLATILE."
    };
  }
  return { ok: true };
}

/** Construit toutes les liaisons possibles, connectées ou non. */
export function edges(doc: GraphDoc): Edge[] {
  const out: Edge[] = [];

  for (const src of doc.nodes) {
    for (const pub of src.pubs) {
      for (const dst of doc.nodes) {
        if (dst.id === src.id) continue;
        for (const sub of dst.subs) {
          if (sub.topic !== pub.topic) continue;

          const typesOk = sub.msgType === pub.msgType;
          const qos = compatibiliteQos(pub.qos, sub.qos);
          const connecte = typesOk && qos.ok;

          out.push({
            id: `${src.id}:${pub.id}->${dst.id}:${sub.id}`,
            fromNode: src.id,
            fromEp: pub.id,
            toNode: dst.id,
            toEp: sub.id,
            topic: pub.topic,
            msgType: pub.msgType,
            hz: pub.hz ?? getMsgType(pub.msgType)?.typicalHz ?? 10,
            connecte,
            raison: !typesOk
              ? `Types incompatibles : le publisher émet ${shortName(pub.msgType)}, le subscriber attend ${shortName(sub.msgType)}.`
              : qos.raison
          });
        }
      }
    }
  }

  return out;
}

export function valider(doc: GraphDoc): GDiagnostic[] {
  const out: GDiagnostic[] = [];
  const liens = edges(doc);

  /* Liaisons rompues */
  for (const e of liens) {
    if (e.connecte) continue;
    const src = doc.nodes.find((n) => n.id === e.fromNode);
    const dst = doc.nodes.find((n) => n.id === e.toNode);
    out.push({
      id: `rompu-${e.id}`,
      level: "erreur",
      title: `${e.topic} ne transporte rien`,
      detail: `${src?.name} → ${dst?.name} : ${e.raison}`,
      nodeIds: [e.fromNode, e.toNode],
      topic: e.topic
    });
  }

  /* Publishers sans lecteur */
  for (const n of doc.nodes) {
    for (const pub of n.pubs) {
      const a = liens.some((e) => e.fromNode === n.id && e.fromEp === pub.id);
      if (a) continue;
      out.push({
        id: `orphelin-pub-${n.id}-${pub.id}`,
        level: "info",
        title: `${pub.topic} n'est lu par personne`,
        detail: `${n.name} publie sur ${pub.topic} mais aucun node de ce graphe ne s'y abonne. Ce n'est pas une erreur — un enregistreur ou RViz2 peut écouter — mais vérifie que ce n'est pas une faute de frappe.`,
        nodeIds: [n.id],
        topic: pub.topic
      });
    }
  }

  /* Subscribers sans source */
  for (const n of doc.nodes) {
    for (const sub of n.subs) {
      const a = liens.some((e) => e.toNode === n.id && e.toEp === sub.id);
      if (a) continue;
      out.push({
        id: `orphelin-sub-${n.id}-${sub.id}`,
        level: "alerte",
        title: `${sub.topic} n'a aucun publisher`,
        detail: `${n.name} attend des messages sur ${sub.topic} mais rien ne les produit. Son callback ne sera jamais appelé.`,
        nodeIds: [n.id],
        topic: sub.topic
      });
    }
  }

  /* Un même topic publié par plusieurs nodes */
  const parTopic = new Map<string, string[]>();
  for (const n of doc.nodes) {
    for (const pub of n.pubs) {
      const l = parTopic.get(pub.topic) || [];
      l.push(n.id);
      parTopic.set(pub.topic, l);
    }
  }
  for (const [topic, ids] of parTopic) {
    if (ids.length < 2) continue;
    const noms = ids.map((i) => doc.nodes.find((n) => n.id === i)?.name);
    const critique = topic === "/tf" || topic === "/cmd_vel";
    out.push({
      id: `multi-pub-${topic}`,
      level: critique ? "erreur" : "alerte",
      title: `${topic} publié par ${ids.length} nodes`,
      detail:
        `${noms.join(", ")} publient tous sur ${topic}. ` +
        (topic === "/tf"
          ? "Sur /tf, deux publieurs de la même transformation rendent l'arbre incohérent : le robot tremble dans RViz2."
          : topic === "/cmd_vel"
            ? "Deux sources de commande de vitesse se battent : le robot devient imprévisible. Passe par un multiplexeur type twist_mux."
            : "Vérifie que c'est intentionnel."),
      nodeIds: ids,
      topic
    });
  }

  /* Charge réseau estimée */
  const lourds = liens.filter(
    (e) => e.connecte && e.msgType.includes("Image") && e.hz >= 15
  );
  for (const e of lourds) {
    out.push({
      id: `debit-${e.id}`,
      level: "alerte",
      title: `${e.topic} : débit important`,
      detail: `Une image brute 640×480 en bgr8 pèse 921 Ko. À ${e.hz} Hz cela fait environ ${Math.round((921 * e.hz) / 1024)} Mo/s. Passe par le topic /compressed ou réduis la cadence.`,
      nodeIds: [e.fromNode, e.toNode],
      topic: e.topic
    });
  }

  const ordre = { erreur: 0, alerte: 1, info: 2 };
  return out.sort((a, b) => ordre[a.level] - ordre[b.level]);
}

/** Débit total approximatif du graphe, en Ko/s. */
export function debitTotal(doc: GraphDoc): number {
  const TAILLES: Record<string, number> = {
    "sensor_msgs/msg/Image": 921600,
    "sensor_msgs/msg/PointCloud2": 2900000,
    "sensor_msgs/msg/LaserScan": 2900,
    "nav_msgs/msg/OccupancyGrid": 147000,
    "tf2_msgs/msg/TFMessage": 200
  };

  let total = 0;
  for (const e of edges(doc)) {
    if (!e.connecte) continue;
    total += (TAILLES[e.msgType] ?? 120) * e.hz;
  }
  return Math.round(total / 1024);
}
