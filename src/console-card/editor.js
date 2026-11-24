// ── Editor ───────────────────────────────────────────────────────────────────
import { ConsoleCard } from "./card.js";

export const ccSchema = (booleans) => (lang) => [
  { name: "entity", selector: { entity: { filter: [{ integration: "playstation_network", domain: "media_player" }, { integration: "xbox", domain: "media_player" }, { integration: "nintendo_parental_controls" }, { integration: "mqtt", domain: ["switch", "sensor"] }] } } },
  { name: "title", selector: { text: {} } },
  { name: "navigation_path", selector: { navigation: {} } },
  { name: "power", selector: { entity: { domain: ["switch", "remote", "input_boolean"] } } },
  { name: "play_time", selector: { entity: { domain: ["sensor", "input_number"] } } },
  { name: "bonus_minutes", selector: { number: { min: 5, max: 30, step: 5, mode: "box", unit_of_measurement: "min" } } },
  ...rcBooleans(...booleans),
  {
    name: "illustration_theme",
    selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((value) => ({ value, label: rcT(CC_I18N, lang, `ed_theme_${value}`) })) } },
  },
  ...rcAdvanced(CC_I18N, lang, "entities", "language"),
];

export const CC_HELPERS = ["entity", "title", "power", "play_time", "bonus_minutes", "zoom", "entities", "language"];

export const ConsoleCardEditor = rcEditor({
  card: ConsoleCard,
  helpers: CC_HELPERS,
  schema: ccSchema(["show_title", "illustration", "animations", "show_trophies", "show_play_time", "show_controls"]),
});

rcRegister(
  ConsoleCard,
  ConsoleCardEditor,
  "Console Card",
  "A game console, illustrated: the game being played and its cover, trophies or Gamerscore, a Switch's screen time, power and bonus time",
);
