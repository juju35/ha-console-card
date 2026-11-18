// Renders the console cards with the mock home and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/console.mjs
import { pair, shoot } from "./harness.mjs";
import { setup } from "./mock.mjs";

// Stills: animations: false keeps the TV's light and gleam still, so a capture only changes when the card does.
const still = (file, s) => pair(file, { ...s, config: { animations: false, ...s.config } });
const scenes = ["ps-playing", "ps-standby", "xbox-playing", "xbox-online", "switch-online", "switch-time-up", "switch-suspended", "ps5-mqtt"].flatMap((scene) => still(scene, { scene }));
await shoot({ prefix: "cc", tag: "console-card", shots: [...scenes, ...still("classic", { scene: "ps-playing", config: { illustration: false } })], setup });
await shoot({
  prefix: "cc-mini",
  tag: "console-mini-card",
  shots: [...still("playing", { scene: "ps-playing" }), ...still("switch", { scene: "switch-online" }), ...still("zoom", { scene: "xbox-playing", open: ".zoom" })],
  setup,
});
