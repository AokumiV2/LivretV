import { compatibiliteQos } from "@/lib/graph/validate";
import type { Qos } from "@/lib/graph/types";
import type { Endpoint, StatTopic } from "./types";

/* ══════════════════════════════════════════════════════════════
   Le middleware simulé.

   Il tient le rôle de DDS : il met en relation les publishers et
   les subscribers, et il applique la règle de compatibilité QoS —
   celle du Node Graph, la vraie, importée telle quelle depuis
   `lib/graph/validate.ts`.

   La conséquence est volontairement cruelle : un abonnement
   incompatible ne reçoit rien, et rien ne le signale. C'est ce
   silence qui coûte des heures aux débutants sur un vrai robot ;
   autant le rencontrer ici, où la console peut l'expliquer après
   coup.
   ══════════════════════════════════════════════════════════════ */

type Pub = {
  id: number;
  node: string;
  topic: string;
  msgType: string;
  qos: Qos;
  publies: number;
};

type Sub = {
  id: number;
  node: string;
  topic: string;
  msgType: string;
  qos: Qos;
  /** Identifiant du callback Python correspondant. */
  cb: number;
  recus: number;
  /** Refus constatés, avec leur explication. */
  rejets: { pub: string; raison: string }[];
};

export type Livraison = {
  cb: number;
  topic: string;
  msgType: string;
  msg: Record<string, unknown>;
};

export class Bus {
  private pubs: Pub[] = [];
  private subs: Sub[] = [];
  private seq = 1;
  private file: Livraison[] = [];
  private derniers = new Map<string, Record<string, unknown>>();
  private compte = new Map<string, number>();
  private remis = new Map<string, number>();
  private duree = 0;

  /* ---------- Déclarations ---------- */

  publisher(node: string, topic: string, msgType: string, qos: Qos): number {
    const id = this.seq++;
    this.pubs.push({ id, node, topic, msgType, qos, publies: 0 });
    return id;
  }

  /**
   * Enregistre un abonnement et évalue immédiatement sa compatibilité
   * avec les publishers déjà connus. Un publisher déclaré plus tard
   * sera confronté au moment de sa première publication.
   */
  subscription(
    node: string,
    topic: string,
    msgType: string,
    qos: Qos,
    cb: number
  ): number {
    const id = this.seq++;
    const s: Sub = { id, node, topic, msgType, qos, cb, recus: 0, rejets: [] };
    this.subs.push(s);
    for (const p of this.pubs) {
      if (p.topic === topic) this.verifier(p, s);
    }
    return id;
  }

  private verifier(p: Pub, s: Sub): boolean {
    if (p.msgType !== s.msgType) {
      this.noter(s, p.node, `Types incompatibles : ${p.msgType} publié, ${s.msgType} attendu.`);
      return false;
    }
    const q = compatibiliteQos(p.qos, s.qos);
    if (!q.ok) {
      this.noter(s, p.node, q.raison ?? "QoS incompatibles.");
      return false;
    }
    return true;
  }

  private noter(s: Sub, pub: string, raison: string) {
    if (s.rejets.some((r) => r.pub === pub && r.raison === raison)) return;
    s.rejets.push({ pub, raison });
  }

  /* ---------- Trafic ---------- */

  publier(pubId: number, msg: Record<string, unknown>): void {
    const p = this.pubs.find((x) => x.id === pubId);
    if (!p) return;

    p.publies += 1;
    this.compte.set(p.topic, (this.compte.get(p.topic) ?? 0) + 1);
    this.derniers.set(p.topic, msg);

    let livre = false;
    for (const s of this.subs) {
      if (s.topic !== p.topic) continue;
      if (!this.verifier(p, s)) continue;
      this.file.push({ cb: s.cb, topic: p.topic, msgType: p.msgType, msg });
      s.recus += 1;
      livre = true;
    }
    if (livre) this.remis.set(p.topic, (this.remis.get(p.topic) ?? 0) + 1);
  }

  /** Vide la file de livraison. L'exécuteur l'appelle une fois par pas. */
  recolter(): Livraison[] {
    if (this.file.length === 0) return [];
    const out = this.file;
    this.file = [];
    return out;
  }

  /** Remet une livraison dans la file, quand elle n'était pas pour nous. */
  remettre(l: Livraison): void {
    this.file.push(l);
  }

  dernier(topic: string): Record<string, unknown> | null {
    return this.derniers.get(topic) ?? null;
  }

  horloge(t: number) {
    this.duree = t;
  }

  /* ---------- Introspection ---------- */

  topics(): StatTopic[] {
    const noms = new Set<string>();
    for (const p of this.pubs) noms.add(p.topic);
    for (const s of this.subs) noms.add(s.topic);

    const out: StatTopic[] = [];
    for (const topic of Array.from(noms).sort()) {
      const ps = this.pubs.filter((p) => p.topic === topic);
      const ss = this.subs.filter((s) => s.topic === topic);
      const n = this.compte.get(topic) ?? 0;
      out.push({
        topic,
        msgType: ps[0]?.msgType ?? ss[0]?.msgType ?? "?",
        publishers: Array.from(new Set(ps.map((p) => p.node))),
        subscribers: Array.from(new Set(ss.map((s) => s.node))),
        publies: n,
        remis: this.remis.get(topic) ?? 0,
        hz: this.duree > 0.2 ? Math.round((n / this.duree) * 10) / 10 : 0,
        dernier: this.derniers.get(topic) ?? null,
        rejets: ss.flatMap((s) => s.rejets.map((r) => ({ node: s.node, raison: r.raison })))
      });
    }
    return out;
  }

  /** Nombre de messages reçus par topic, tous abonnés confondus. */
  callbacks(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const s of this.subs) out[s.topic] = (out[s.topic] ?? 0) + s.recus;
    return out;
  }

  endpoints(node: string): { pubs: Endpoint[]; subs: Endpoint[] } {
    const mk = (e: Pub | Sub): Endpoint => ({
      node: e.node,
      topic: e.topic,
      msgType: e.msgType,
      qos: e.qos
    });
    return {
      pubs: this.pubs.filter((p) => p.node === node).map(mk),
      subs: this.subs.filter((s) => s.node === node).map(mk)
    };
  }

  noms(): string[] {
    return Array.from(new Set([...this.pubs, ...this.subs].map((e) => e.node)));
  }
}
