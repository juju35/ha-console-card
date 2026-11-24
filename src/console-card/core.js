/**
 * console-card / console-mini-card: a game console, illustrated. The TV and the console in their corner of the living
 * room, the game being played with its cover, the account's trophies or Gamerscore, a Switch's screen time, and the
 * power, home and bonus-time controls.
 * https://github.com/juju35/ha-console-card
 */

// The colour of each platform: on the badge, the pill, the TV's light and the console's LED while it plays.
export const CC_ACCENTS = { playstation: "#2f6fe0", xbox: "#2ea043", switch: "#e5383b" };
export const CC_ICONS = { playstation: "mdi:sony-playstation", xbox: "mdi:microsoft-xbox", switch: "mdi:nintendo-switch" };
// One loop of the illustration's animations (s): the TV's light breathes once, a gleam crosses its screen once. The
// GIFs record one loop.
export const CC_LOOP = 3;
// The states drawn in colour: the others are grey (standby, offline) or an alert (time's up).
export const CC_ACTIVE = ["playing", "online"];
