/* ══════════════════════════════════════════════════════════════
   Types du contenu pédagogique et du catalogue matériel
   ══════════════════════════════════════════════════════════════ */

/* ─────────────── Blocs de leçon ─────────────── */

export type Block =
  | { t: "para"; text: string }
  | { t: "h"; text: string }
  | { t: "list"; ordered?: boolean; items: string[] }
  | { t: "code"; lang: "python" | "cpp" | "bash" | "xml" | "yaml" | "text"; file?: string; code: string }
  | { t: "tabs"; tabs: { label: string; lang: "python" | "cpp" | "bash" | "xml" | "yaml" | "text"; file?: string; code: string }[] }
  | { t: "callout"; tone: "info" | "warn" | "danger" | "tip"; title: string; text: string }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "terminal"; lines: { cmd?: string; out?: string }[] }
  | { t: "diagram"; kind: DiagramKind; caption?: string }
  | { t: "components"; ids: string[]; caption?: string };

export type DiagramKind =
  | "pub-sub"
  | "service"
  | "action"
  | "tf-tree"
  | "nav2-stack"
  | "control-loop"
  | "dds-discovery"
  | "power-chain";

/* ─────────────── Leçons et parcours ─────────────── */

export type Lesson = {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  level: "Débutant" | "Intermédiaire" | "Avancé";
  objectives: string[];
  blocks: Block[];
  /** Identifiants de questions dans content/quiz.ts */
  quiz: string[];
};

export type Track = {
  slug: string;
  index: number;
  title: string;
  tagline: string;
  description: string;
  color: string;
  lessons: Lesson[];
};

/* ─────────────── Catalogue de composants ─────────────── */

export type Category =
  | "calculateur"
  | "microcontroleur"
  | "moteur"
  | "driver"
  | "capteur"
  | "camera"
  | "alimentation"
  | "chassis"
  | "communication";

export type BusKind =
  | "I2C"
  | "SPI"
  | "UART"
  | "USB"
  | "CAN"
  | "PWM"
  | "GPIO"
  | "Analogique"
  | "Ethernet"
  | "Quadrature";

/** Rôle électrique d'une broche : sert aux règles de validation du Wiring Lab. */
export type PinKind =
  | "VIN"
  | "5V"
  | "3V3"
  | "GND"
  | "GPIO"
  | "SDA"
  | "SCL"
  | "TX"
  | "RX"
  | "MOSI"
  | "MISO"
  | "SCK"
  | "CS"
  | "PWM"
  | "ANALOG"
  | "CAN_H"
  | "CAN_L"
  | "USB"
  | "ENC_A"
  | "ENC_B"
  | "MOTOR"
  | "ETH";

export type Pin = {
  id: string;
  label: string;
  kind: PinKind;
  /** Tension nominale du signal ou de l'alimentation, en volts. */
  volts?: number;
  /** true si l'entrée supporte 5 V malgré une logique 3,3 V. */
  tolerant5v?: boolean;
  /** Sens : "in" consomme, "out" fournit, "io" les deux. */
  dir?: "in" | "out" | "io";
  note?: string;
};

export type Component = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  tagline: string;
  description: string;
  /** Prix indicatif en euros. */
  price: number;
  level: "Débutant" | "Intermédiaire" | "Avancé";
  buses: BusKind[];
  /** Tension d'alimentation acceptée, en volts. */
  voltage: { min: number; max: number; nominal: number };
  /** Consommation typique et pic, en milliampères. */
  currentMa: { typ: number; peak: number };
  /** Courant que le composant peut FOURNIR à d'autres (régulateurs, BEC, batteries). */
  suppliesMa?: number;
  logicVolts?: number;
  /** Adresse I2C par défaut, format 0x68. */
  i2cAddress?: string;
  i2cAlternates?: string[];
  specs: { k: string; v: string }[];
  pins: Pin[];
  /** Paquets ROS 2 utilisables avec ce composant. */
  rosPackages: { name: string; note: string }[];
  pros: string[];
  cons: string[];
  /** Pièges classiques — c'est là que les débutants perdent des week-ends. */
  gotchas: string[];
  /** Identifiants d'autres composants qui vont bien avec. */
  worksWith: string[];
  weightG?: number;
};

/* ─────────────── Messages ROS 2 ─────────────── */

export type MsgField = {
  name: string;
  type: string;
  note?: string;
  /** Générateur de valeur plausible pour le simulateur. */
  sample: (tick: number) => string;
};

export type MsgType = {
  name: string;
  pkg: string;
  purpose: string;
  fields: MsgField[];
  /** Fréquence typique de publication, en Hz. */
  typicalHz: number;
};

/* ─────────────── Quiz ─────────────── */

export type Question = {
  id: string;
  lesson: string;
  prompt: string;
  choices: string[];
  answer: number;
  explain: string;
};

/* ─────────────── Glossaire ─────────────── */

export type GlossaryEntry = {
  term: string;
  short: string;
  long: string;
  category: "Concept" | "Outil" | "Matériel" | "Réseau" | "Maths";
  see?: string[];
};

/* ─────────────── Commandes CLI ─────────────── */

export type CliCommand = {
  cmd: string;
  group: string;
  what: string;
  example: string;
  output?: string;
};

/* ─────────────── Dépannage ─────────────── */

export type TroubleNode = {
  id: string;
  question: string;
  hint?: string;
  options: { label: string; next: string }[];
};

export type TroubleLeaf = {
  id: string;
  verdict: string;
  cause: string;
  fix: string[];
  commands?: string[];
};

/* ─────────────── Archétypes de robots ─────────────── */

export type Archetype = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  difficulty: "Débutant" | "Intermédiaire" | "Avancé";
  budget: [number, number];
  buildDays: number;
  /** Composants recommandés par rôle. */
  stack: { role: string; componentIds: string[]; why: string }[];
  /** Nœuds ROS 2 du bringup généré. */
  nodes: { name: string; pkg: string; pubs: string[]; subs: string[]; note: string }[];
  skills: string[];
};
