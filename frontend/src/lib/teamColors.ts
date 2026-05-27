/**
 * Canonical team colour map used everywhere except the live timing
 * tower (where OpenF1's `team_colour` is authoritative for active
 * sessions). Lookups are case- and whitespace-insensitive and include
 * common aliases between OpenF1 / Ergast / FIA naming.
 *
 * Source: Each team's primary livery accent for the 2024+ era,
 * matching what OpenF1 reports for current entries.
 */

export const TEAM_COLORS: Record<string, string> = {
  // Ferrari red — matches the F1 PIT WALL accent / logo red so the
  // brand reads as one across the whole UI.
  "ferrari": "#DC0000",
  "scuderia ferrari": "#DC0000",

  // Mercedes petronas turquoise
  "mercedes": "#00D7B6",
  "mercedes-amg": "#00D7B6",
  "mercedes amg": "#00D7B6",
  "mercedes-amg petronas": "#00D7B6",

  // Red Bull navy
  "red bull": "#4781D7",
  "red bull racing": "#4781D7",
  "oracle red bull racing": "#4781D7",

  // McLaren papaya orange
  "mclaren": "#F47600",
  "mclaren formula 1 team": "#F47600",

  // Aston Martin British racing green
  "aston martin": "#229971",
  "aston martin aramco": "#229971",

  // Alpine blue
  "alpine": "#00A1E8",
  "alpine f1 team": "#00A1E8",
  "bwt alpine": "#00A1E8",

  // Williams Atlassian blue
  "williams": "#1868DB",
  "atlassian williams racing": "#1868DB",

  // Racing Bulls / RB
  "rb": "#6C98FF",
  "rb f1 team": "#6C98FF",
  "racing bulls": "#6C98FF",
  "visa cash app rb": "#6C98FF",
  "visa cash app racing bulls": "#6C98FF",
  "alphatauri": "#6C98FF",
  "scuderia alphatauri": "#6C98FF",
  "toro rosso": "#6C98FF",

  // Audi / Sauber 2026
  "audi": "#F50537",
  "audi f1 team": "#F50537",
  // Sauber pre-Audi keeps Kick Sauber green
  "sauber": "#52E252",
  "kick sauber": "#52E252",
  "stake f1 team kick sauber": "#52E252",
  "alfa romeo": "#900000",
  "alfa romeo racing": "#900000",

  // Haas
  "haas": "#9C9FA2",
  "haas f1 team": "#9C9FA2",
  "moneygram haas f1 team": "#9C9FA2",

  // Cadillac (new for 2026)
  "cadillac": "#909090",
  "cadillac f1 team": "#909090",

  // Historic teams (won't break older seasons)
  "renault": "#FFF500",
  "lotus": "#FFB800",
  "lotus f1": "#FFB800",
  "force india": "#FF80C7",
  "racing point": "#FF80C7",
  "manor": "#323230",
  "marussia": "#6E0000",
  "caterham": "#016d30",
  "hrt": "#a0a0a0",
  "virgin": "#cc0000",
  "brawn": "#80FF00",
  "honda": "#cccccc",
  "bmw sauber": "#0066CC",
  "toyota": "#cc0000",
};

const FALLBACK_PALETTE = [
  "#DC0000",
  "#00D7B6",
  "#F47600",
  "#4781D7",
  "#FFD15C",
  "#3FB364",
  "#B36BFF",
  "#FF6868",
  "#3FA9F5",
  "#52E252",
];

function normalize(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export function teamColor(name: string | null | undefined, fallbackIndex = 0): string {
  if (!name) return "#888";
  const k = normalize(name);
  if (TEAM_COLORS[k]) return TEAM_COLORS[k];
  // try removing common suffixes
  const stripped = k.replace(/( f1 team| racing| formula 1 team)$/g, "").trim();
  if (TEAM_COLORS[stripped]) return TEAM_COLORS[stripped];
  return FALLBACK_PALETTE[fallbackIndex % FALLBACK_PALETTE.length];
}

export function teamColorOrLive(
  name: string | null | undefined,
  liveColour: string | null | undefined,
  fallbackIndex = 0,
): string {
  // Prefer hardcoded canonical colour for predictable cross-page consistency
  // (OpenF1 sometimes uses a slightly different team_colour mid-season).
  const canonical = teamColor(name, fallbackIndex);
  // If lookup hit a real palette mapping, use it; otherwise fall back to live.
  if (name && TEAM_COLORS[normalize(name)]) return canonical;
  if (liveColour) {
    return liveColour.startsWith("#") ? liveColour : `#${liveColour}`;
  }
  return canonical;
}
