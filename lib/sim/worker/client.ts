import type { DepuisWorker, Monde, RobotSim, VersWorker } from "../types";

/* ══════════════════════════════════════════════════════════════
   Le côté page du worker.

   Un point mérite d'être souligné : `arreter()` ne demande pas
   poliment au worker de s'interrompre, il le **termine**. C'est ce
   qui rend un « while True: pass » inoffensif — le fil est tué,
   pas raisonné. Le prochain démarrage en recrée un, et Python est
   rechargé depuis le cache du navigateur.
   ══════════════════════════════════════════════════════════════ */

export class Simulateur {
  private w: Worker | null = null;
  private ecouteur: (m: DepuisWorker) => void;

  constructor(ecouteur: (m: DepuisWorker) => void) {
    this.ecouteur = ecouteur;
  }

  private assurer(): Worker {
    if (this.w) return this.w;
    const w = new Worker(new URL("./worker.ts", import.meta.url));
    w.onmessage = (ev: MessageEvent<DepuisWorker>) => this.ecouteur(ev.data);
    w.onerror = (ev) =>
      this.ecouteur({
        type: "erreur",
        message: ev.message || "Le worker de simulation a échoué."
      });
    this.w = w;
    return w;
  }

  private envoyer(m: VersWorker) {
    this.assurer().postMessage(m);
  }

  demarrer(o: {
    code: string;
    robot: RobotSim;
    monde: Monde;
    graine?: number;
    dureeMax?: number;
    evenements?: { t: number; service: string }[];
  }) {
    /* Le worker est réutilisé d'un run à l'autre : recharger Pyodide
       à chaque « Lancer » coûterait plusieurs secondes, et l'intérêt
       de l'atelier tient justement à la vitesse de la boucle
       écrire → lancer → corriger. Python repart d'un module neuf. */
    this.envoyer({
      type: "demarrer",
      code: o.code,
      robot: o.robot,
      monde: o.monde,
      graine: o.graine ?? 20240607,
      dureeMax: o.dureeMax ?? 60,
      evenements: o.evenements
    });
  }

  pause(valeur: boolean) {
    if (this.w) this.envoyer({ type: "pause", valeur });
  }

  vitesse(facteur: number) {
    if (this.w) this.envoyer({ type: "vitesse", facteur });
  }

  teleop(v: number, w: number) {
    if (this.w) this.envoyer({ type: "teleop", v, w });
  }

  service(nom: string) {
    if (this.w) this.envoyer({ type: "service", nom });
  }

  /** Arrêt propre : le worker rend sa trace avant de se taire. */
  arreter() {
    if (this.w) this.envoyer({ type: "arreter" });
  }

  /** Arrêt brutal, pour reprendre la main sur du code bloqué. */
  tuer() {
    if (!this.w) return;
    this.w.terminate();
    this.w = null;
  }
}
