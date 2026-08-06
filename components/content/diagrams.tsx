import type { DiagramKind } from "@/content/types";

/* ══════════════════════════════════════════════════════════════
   Schémas SVG intégrés — lisibles, cohérents avec la palette,
   et aucun rendu externe à charger.
   ══════════════════════════════════════════════════════════════ */

const INK = "#e8eaf2";
const MUTED = "#767d92";
const LINE = "#2b2d3d";
const ACCENT = "#5ee0ff";
const BLUE = "#1a2fff";

function Box({
  x,
  y,
  w = 130,
  h = 46,
  label,
  sub,
  tone = "neutral"
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  sub?: string;
  tone?: "neutral" | "accent" | "blue";
}) {
  const stroke = tone === "accent" ? ACCENT : tone === "blue" ? BLUE : LINE;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="#0e0e15"
        stroke={stroke}
        strokeWidth="1"
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 4 : y + h / 2 + 4}
        textAnchor="middle"
        fill={INK}
        fontSize="11"
        fontFamily="var(--font-mono), monospace"
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 11}
          textAnchor="middle"
          fill={MUTED}
          fontSize="9"
          fontFamily="var(--font-mono), monospace"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  label,
  dashed = false
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  dashed?: boolean;
}) {
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={ACCENT}
        strokeWidth="1"
        strokeOpacity="0.55"
        strokeDasharray={dashed ? "4 3" : undefined}
        markerEnd="url(#head)"
      />
      {label && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 7}
          textAnchor="middle"
          fill={MUTED}
          fontSize="9"
          fontFamily="var(--font-mono), monospace"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Frame({
  children,
  viewBox
}: {
  children: React.ReactNode;
  viewBox: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      className="h-auto w-full"
      role="img"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker
          id="head"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L7,3 L0,6 Z" fill={ACCENT} fillOpacity="0.7" />
        </marker>
      </defs>
      {children}
    </svg>
  );
}

/* ─────────────── Les schémas ─────────────── */

function PubSub() {
  return (
    <Frame viewBox="0 0 640 240">
      <Box x={20} y={95} label="rplidar_node" sub="publisher" tone="accent" />
      <Arrow x1={155} y1={118} x2={250} y2={118} />
      <rect x={250} y={100} width={130} height={36} fill="none" stroke={BLUE} strokeDasharray="3 3" />
      <text x={315} y={122} textAnchor="middle" fill={ACCENT} fontSize="11" fontFamily="var(--font-mono), monospace">
        /scan
      </text>
      <text x={315} y={152} textAnchor="middle" fill={MUTED} fontSize="9" fontFamily="var(--font-mono), monospace">
        sensor_msgs/LaserScan
      </text>
      <Arrow x1={385} y1={106} x2={475} y2={45} />
      <Arrow x1={385} y1={118} x2={475} y2={118} />
      <Arrow x1={385} y1={130} x2={475} y2={192} />
      <Box x={480} y={22} label="slam_toolbox" sub="subscriber" />
      <Box x={480} y={95} label="costmap" sub="subscriber" />
      <Box x={480} y={169} label="rviz2" sub="subscriber" />
    </Frame>
  );
}

function Service() {
  return (
    <Frame viewBox="0 0 640 180">
      <Box x={40} y={65} w={150} label="client" sub="ton node" />
      <Box x={450} y={65} w={150} label="serveur" sub="/reset_odom" tone="accent" />
      <Arrow x1={195} y1={78} x2={445} y2={78} label="requête" />
      <Arrow x1={445} y1={110} x2={195} y2={110} label="réponse" dashed />
      <text x={320} y={155} textAnchor="middle" fill={MUTED} fontSize="9" fontFamily="var(--font-mono), monospace">
        le client attend — d&apos;où l&apos;usage obligatoire de call_async
      </text>
    </Frame>
  );
}

function Action() {
  return (
    <Frame viewBox="0 0 640 240">
      <Box x={30} y={95} w={150} label="client" sub="mission" />
      <Box x={460} y={95} w={150} label="serveur" sub="navigate_to_pose" tone="accent" />
      <Arrow x1={185} y1={62} x2={455} y2={62} label="objectif" />
      <Arrow x1={455} y1={112} x2={185} y2={112} label="retour ×n" dashed />
      <Arrow x1={455} y1={150} x2={185} y2={150} label="résultat" />
      <Arrow x1={185} y1={196} x2={455} y2={196} label="annulation possible à tout moment" />
    </Frame>
  );
}

function TfTree() {
  const node = (x: number, y: number, l: string, tone?: "accent" | "blue") => (
    <Box x={x} y={y} w={120} h={34} label={l} tone={tone} />
  );
  return (
    <Frame viewBox="0 0 640 320">
      {node(260, 10, "map", "blue")}
      <Arrow x1={320} y1={44} x2={320} y2={72} label="SLAM" />
      {node(260, 76, "odom", "blue")}
      <Arrow x1={320} y1={110} x2={320} y2={138} label="odométrie" />
      {node(260, 142, "base_link", "accent")}

      <line x1={320} y1={176} x2={320} y2={204} stroke={LINE} />
      <line x1={110} y1={204} x2={530} y2={204} stroke={LINE} />
      <line x1={110} y1={204} x2={110} y2={226} stroke={LINE} />
      <line x1={320} y1={204} x2={320} y2={226} stroke={LINE} />
      <line x1={530} y1={204} x2={530} y2={226} stroke={LINE} />

      {node(50, 230, "laser_frame")}
      {node(260, 230, "imu_link")}
      {node(470, 230, "camera_link")}

      <text x={320} y={300} textAnchor="middle" fill={MUTED} fontSize="9" fontFamily="var(--font-mono), monospace">
        statique · défini dans l&apos;URDF, publié une seule fois
      </text>
    </Frame>
  );
}

function Nav2Stack() {
  return (
    <Frame viewBox="0 0 640 300">
      <Box x={240} y={10} w={160} h={40} label="bt_navigator" sub="arbre de comportement" tone="blue" />
      <Arrow x1={280} y1={52} x2={150} y2={88} />
      <Arrow x1={360} y1={52} x2={490} y2={88} />
      <Box x={70} y={92} w={160} h={40} label="planner_server" sub="chemin global" tone="accent" />
      <Box x={410} y={92} w={160} h={40} label="behavior_server" sub="récupération" />
      <Arrow x1={150} y1={134} x2={280} y2={172} />
      <Box x={200} y={176} w={200} h={40} label="controller_server" sub="suit le chemin" tone="accent" />
      <Arrow x1={300} y1={218} x2={300} y2={248} label="/cmd_vel" />
      <Box x={220} y={252} w={160} h={38} label="base du robot" />
      <text x={70} y={175} fill={MUTED} fontSize="9" fontFamily="var(--font-mono), monospace">
        costmap globale
      </text>
      <text x={455} y={175} fill={MUTED} fontSize="9" fontFamily="var(--font-mono), monospace">
        costmap locale
      </text>
    </Frame>
  );
}

function ControlLoop() {
  return (
    <Frame viewBox="0 0 640 240">
      <Box x={20} y={30} w={160} h={44} label="/cmd_vel" sub="Twist" tone="blue" />
      <Arrow x1={185} y1={52} x2={235} y2={52} />
      <Box x={240} y={30} w={170} h={44} label="diff_drive_controller" sub="→ vitesses de roues" tone="accent" />
      <Arrow x1={415} y1={52} x2={465} y2={52} />
      <Box x={470} y={30} w={150} h={44} label="hardware write()" sub="ton code" />

      <Arrow x1={545} y1={78} x2={545} y2={128} />
      <Box x={470} y={132} w={150} h={44} label="électronique" sub="driver + moteur" />
      <Arrow x1={465} y1={154} x2={415} y2={154} />
      <Box x={240} y={132} w={170} h={44} label="hardware read()" sub="encodeurs" />
      <Arrow x1={235} y1={154} x2={185} y2={154} />
      <Box x={20} y={132} w={160} h={44} label="/odom" sub="Odometry" tone="blue" />

      <text x={320} y={215} textAnchor="middle" fill={MUTED} fontSize="9" fontFamily="var(--font-mono), monospace">
        read → update → write, à la fréquence du controller_manager
      </text>
    </Frame>
  );
}

function DdsDiscovery() {
  return (
    <Frame viewBox="0 0 640 260">
      <Box x={40} y={40} w={170} h={50} label="publisher" sub="BEST_EFFORT" tone="accent" />
      <Box x={430} y={40} w={170} h={50} label="subscriber" sub="RELIABLE" />
      <line x1={215} y1={65} x2={425} y2={65} stroke="#ff4d5e" strokeWidth="1" strokeDasharray="4 4" />
      <text x={320} y={58} textAnchor="middle" fill="#ff4d5e" fontSize="10" fontFamily="var(--font-mono), monospace">
        ✕ aucune connexion
      </text>

      <Box x={40} y={150} w={170} h={50} label="publisher" sub="RELIABLE" tone="accent" />
      <Box x={430} y={150} w={170} h={50} label="subscriber" sub="BEST_EFFORT" />
      <Arrow x1={215} y1={175} x2={425} y2={175} label="✓ compatible" />

      <text x={320} y={238} textAnchor="middle" fill={MUTED} fontSize="9" fontFamily="var(--font-mono), monospace">
        le subscriber ne peut pas exiger plus que ce que le publisher offre
      </text>
    </Frame>
  );
}

function PowerChain() {
  return (
    <Frame viewBox="0 0 640 260">
      <Box x={20} y={100} w={130} h={50} label="LiPo 3S" sub="11,1 V" tone="blue" />
      <Arrow x1={155} y1={125} x2={205} y2={125} />
      <Box x={210} y={100} w={120} h={50} label="fusible" sub="+ interrupteur" />
      <Arrow x1={335} y1={112} x2={385} y2={55} />
      <Arrow x1={335} y1={125} x2={385} y2={125} />
      <Arrow x1={335} y1={138} x2={385} y2={195} />
      <Box x={390} y={30} w={140} h={48} label="BEC 5 V" sub="calculateur" tone="accent" />
      <Box x={390} y={100} w={140} h={48} label="BEC 5 V" sub="servos" tone="accent" />
      <Box x={390} y={170} w={140} h={48} label="12 V direct" sub="drivers moteur" />
      <text x={320} y={245} textAnchor="middle" fill={MUTED} fontSize="9" fontFamily="var(--font-mono), monospace">
        deux BEC séparés : le pic des servos ne doit jamais atteindre le calculateur
      </text>
    </Frame>
  );
}

const DIAGRAMS: Record<DiagramKind, () => JSX.Element> = {
  "pub-sub": PubSub,
  service: Service,
  action: Action,
  "tf-tree": TfTree,
  "nav2-stack": Nav2Stack,
  "control-loop": ControlLoop,
  "dds-discovery": DdsDiscovery,
  "power-chain": PowerChain
};

export function Diagram({
  kind,
  caption
}: {
  kind: DiagramKind;
  caption?: string;
}) {
  const D = DIAGRAMS[kind];
  if (!D) return null;
  return (
    <figure className="border border-line bg-panel/40 p-5">
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <D />
        </div>
      </div>
      {caption && (
        <figcaption className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
