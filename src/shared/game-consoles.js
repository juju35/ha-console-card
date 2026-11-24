// ── Game consoles ────────────────────────────────────────────────────────────
// A console is the media player of the PlayStation Network or Xbox integration, the power switch or activity sensor of
// a PS5-MQTT console, or a Nintendo Switch of the Nintendo Switch Parental Controls integration. The other entities
// that complete it (the account's trophies or Gamerscore, the storage, the screen time…) are found by their
// translation key, on the console's device, its account's device or the integration's other devices; when the
// registry has no translation key, by their entity ID and name. `entities` overrides any role.
// The state is brought down to: playing, online, standby, suspended, time_up; `offline` when the console cannot report.
import { rcPerRegistry } from "./core.js";
import { rcUnavailable } from "./helpers.js";

// The integrations, by registry platform.
export const CC_PLATFORMS = { playstation_network: "playstation", xbox: "xbox", nintendo_parental_controls: "switch" };
// PS5-MQTT (an add-on publishing over MQTT): a console by its name, model or manufacturer.
export const CC_PS_NAME = /ps5|ps4|playstation|sony/i;

export const ccNorm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_");
export const ccText = (hass, id) => `${id} ${hass.states[id]?.attributes.friendly_name || ""}`;
export const ccNum = (st) => {
  if (!st || rcUnavailable(st)) return null;
  const n = Number.parseFloat(st.state);
  return Number.isFinite(n) ? n : null;
};

// Every entity of each device, in registry order; and each integration's entities.
export const ccDeviceEntities = rcPerRegistry((hass) => {
  const out = {};
  for (const [id, e] of Object.entries(hass.entities || {})) if (e.device_id) (out[e.device_id] ||= []).push(id);
  return out;
});
export const ccPlatformEntities = rcPerRegistry((hass) => {
  const out = {};
  for (const [id, e] of Object.entries(hass.entities || {})) (out[e.platform] ||= []).push(id);
  return out;
});
export const ccDeviceOf = (hass, id) => hass.entities?.[id]?.device_id;

// The platform of an entity: playstation, xbox or switch, from its integration (PS5-MQTT: mqtt, named like a console).
export const ccPlatformOf = (hass, id) => {
  const e = hass.entities?.[id];
  if (!e) return undefined;
  if (CC_PLATFORMS[e.platform]) return CC_PLATFORMS[e.platform];
  if (e.platform !== "mqtt") return undefined;
  const dev = hass.devices?.[e.device_id];
  return CC_PS_NAME.test(`${ccText(hass, id)} ${dev?.name || ""} ${dev?.model || ""} ${dev?.manufacturer || ""}`) ? "playstation" : undefined;
};

// A PS5-MQTT entity: the console's power switch, or its activity sensor.
export const ccMqttRole = (hass, id) => {
  if (ccPlatformOf(hass, id) !== "playstation" || hass.entities?.[id]?.platform !== "mqtt") return undefined;
  if (id.startsWith("switch.")) return "power";
  if (id.startsWith("sensor.") && /activit/i.test(ccText(hass, id))) return "activity";
  return undefined;
};

// The consoles of the home, one entity each, playing first: the PlayStation and Xbox media players, the PS5-MQTT
// consoles that no media player stands for, then the Nintendo Switches (one per device).
export const ccConsoles = (hass) => {
  const players = Object.keys(hass.entities || {}).filter((id) => id.startsWith("media_player.") && ["playstation", "xbox"].includes(ccPlatformOf(hass, id)));
  const mqtt = (ccPlatformEntities(hass).mqtt || []).filter((id) => ccMqttRole(hass, id) === "power");
  const switches = [];
  const seen = new Set();
  for (const id of ccPlatformEntities(hass).nintendo_parental_controls || []) {
    const dev = ccDeviceOf(hass, id);
    if (!dev || seen.has(dev) || !id.startsWith("sensor.")) continue;
    seen.add(dev);
    switches.push(id);
  }
  const all = [...players, ...(players.some((id) => ccPlatformOf(hass, id) === "playstation") ? [] : mqtt), ...switches].filter((id) => hass.states[id]);
  const playing = (id) => (hass.states[id]?.state === "playing" ? 0 : 1);
  return all.map((id, i) => [id, i]).sort((a, b) => playing(a[0]) - playing(b[0]) || a[1] - b[1]).map(([id]) => id);
};

// The roles of each platform: its translation key, then, without one, a pattern on the entity ID and name.
export const CC_ROLES = {
  playstation: {
    trophy_level: ["trophy_level", /trophy_?level$/],
    level_progress: ["trophy_level_progress", /(next_?level|level_?progress)/],
    platinum: ["earned_trophies_platinum", /platinum/],
    gold: ["earned_trophies_gold", /gold/],
    silver: ["earned_trophies_silver", /silver/],
    bronze: ["earned_trophies_bronze", /bronze/],
    online_id: ["online_id", /online_?id/],
    online_status: ["online_status", /online_?status/],
    last_online: ["last_online", /last_?online/],
    now_playing: ["now_playing", /now_?playing$/],
    now_playing_image: ["now_playing_image", /now_?playing/],
    plus: ["ps_plus_status", /(ps_?plus|playstation_?plus)/],
  },
  xbox: {
    status: ["status", /_status$/],
    gamerscore: ["gamer_score", /gamer_?score/],
    last_online: ["last_online", /last_?online/],
    now_playing: ["now_playing", /now_?playing$/],
    friends: ["friends", /friends$/],
    in_party: ["in_party", /in_?party/],
    in_game: ["in_game", /in_?game/],
    game_pass: ["has_game_pass", /game_?pass/],
    total_storage: ["total_storage", /total_?(storage|space)/],
    free_storage: ["free_storage", /free_?(storage|space)/],
  },
  switch: {
    playing_time: ["playing_time", /(used_?screen_?time|playing_?time)$/],
    time_remaining: ["time_remaining", /(time_?remaining|remaining)/],
    time_extended: ["time_extended", /(time_?extended|extended|bonus)/],
    max_screentime: ["today_max_screentime", /max(imum)?_?screen_?time/],
    suspend: ["suspend_software", /suspend/],
    timer_mode: ["timer_mode", /(timer|restriction)_?mode/],
    bedtime_alarm: ["bedtime_alarm", /bedtime_?alarm/],
    bedtime_end: ["bedtime_end_time", /bedtime_?end/],
  },
};
// Domains a role's entity may have.
export const CC_DOMAINS = {
  now_playing_image: ["image"],
  plus: ["binary_sensor"],
  in_game: ["binary_sensor"],
  game_pass: ["binary_sensor"],
  max_screentime: ["number"],
  suspend: ["switch"],
  timer_mode: ["select"],
  bedtime_alarm: ["time"],
  bedtime_end: ["time"],
};

// The first of `ids` playing `role`: its translation key, else its ID and name (the player's own per-player sensors of
// a Switch and the friends' devices of an account excepted: those are other people).
export const ccPick = (hass, ids, role, [key, re]) => {
  const domains = CC_DOMAINS[role] || ["sensor"];
  const ok = ids.filter((id) => domains.includes(id.split(".")[0]) && hass.states[id]);
  return ok.find((id) => hass.entities?.[id]?.translation_key === key) || ok.find((id) => !hass.entities?.[id]?.translation_key && re.test(ccNorm(ccText(hass, id))));
};

// The account's device: the PlayStation console's parent device (via_device_id), else the integration's device with a
// trophy level; for Xbox, the device with a Gamerscore that plays what the console shows, else the first one.
export const ccAccount = (hass, id, platform) => {
  const integration = Object.keys(CC_PLATFORMS).find((p) => CC_PLATFORMS[p] === platform);
  const byDevice = ccDeviceEntities(hass);
  const devs = [...new Set((ccPlatformEntities(hass)[integration] || []).map((e) => ccDeviceOf(hass, e)).filter(Boolean))];
  const own = ccDeviceOf(hass, id);
  if (platform === "playstation") {
    const via = hass.devices?.[own]?.via_device_id;
    if (via && byDevice[via]) return via;
    return devs.find((d) => ccPick(hass, byDevice[d] || [], "trophy_level", CC_ROLES.playstation.trophy_level));
  }
  const withScore = devs.filter((d) => ccPick(hass, byDevice[d] || [], "gamerscore", CC_ROLES.xbox.gamerscore));
  const title = hass.states[id]?.attributes.media_title;
  return (
    withScore.find((d) => {
      const np = ccPick(hass, byDevice[d] || [], "now_playing", CC_ROLES.xbox.now_playing);
      return title && hass.states[np]?.state === title;
    }) || withScore[0]
  );
};

// The entity of each role for the console `id`: `platform`, `media` (its media player), `power` (a switch or remote
// turning it on and off), `activity` (PS5-MQTT), `device`, then the platform's roles (CC_ROLES).
export const ccFind = (hass, id, overrides = {}) => {
  const platform = id ? ccPlatformOf(hass, id) : undefined;
  const out = { platform };
  if (!id || !platform) return { ...out, ...overrides };
  const byDevice = ccDeviceEntities(hass);
  const device = ccDeviceOf(hass, id);
  out.device = device;
  const mine = byDevice[device] || [];
  if (id.startsWith("media_player.")) out.media = id;
  if (platform === "switch") {
    for (const [role, spec] of Object.entries(CC_ROLES.switch)) out[role] = ccPick(hass, mine, role, spec);
    return { ...out, ...overrides };
  }
  if (platform === "xbox") out.power = mine.find((e) => e.startsWith("remote."));
  // PS5-MQTT: its power switch and activity sensor, on its own device; with a PSN media player, the MQTT console whose
  // name matches the media player's model (PS5 or PS4), else the first one.
  // Only the MQTT entities can be PS5-MQTT ones: the registry's per-integration index spares a scan of every entity
  // (this runs again on each state change).
  const mqtt = (ccPlatformEntities(hass).mqtt || []).filter((e) => ccMqttRole(hass, e));
  const mqttDevs = [...new Set(mqtt.map((e) => ccDeviceOf(hass, e)))];
  const model = ccNorm(hass.devices?.[device]?.model || hass.devices?.[device]?.name || "").match(/ps5|ps4|playstation_5|playstation_4/)?.[0]?.replace("playstation_", "ps");
  const mdev = ccMqttRole(hass, id)
    ? device
    : platform === "playstation"
      ? mqttDevs.find((d) => model && ccNorm(`${hass.devices?.[d]?.name} ${hass.devices?.[d]?.model}`).includes(model)) || mqttDevs[0]
      : undefined;
  if (mdev) {
    const ids = mqtt.filter((e) => ccDeviceOf(hass, e) === mdev);
    out.power = ids.find((e) => ccMqttRole(hass, e) === "power");
    out.activity = ids.find((e) => ccMqttRole(hass, e) === "activity");
  }
  const acc = ccAccount(hass, id, platform);
  const pool = [...mine, ...(acc && acc !== device ? byDevice[acc] || [] : [])];
  for (const [role, spec] of Object.entries(CC_ROLES[platform])) {
    // The storage is the console's; the rest is the account's (or the console's when it has it).
    const from = role.endsWith("_storage") ? mine : pool;
    out[role] = ccPick(hass, from, role, spec);
  }
  return { ...out, ...overrides };
};

// What ccFind reads from the states, as a string: which of its candidate entities have a state (the console's device,
// its integration's entities — the account's among them —, the MQTT ones) and, for an Xbox, the title the console
// plays and its integration's sensors (the account playing it). The card finds the roles again only when it changes,
// not on every state change of Home Assistant.
export const ccFindKey = (hass, id) => {
  if (!id) return "";
  const platform = ccPlatformOf(hass, id);
  if (!platform) return "";
  const integration = Object.keys(CC_PLATFORMS).find((p) => CC_PLATFORMS[p] === platform);
  const index = ccPlatformEntities(hass);
  const own = ccDeviceEntities(hass)[ccDeviceOf(hass, id)] || [];
  const ids = [...own, ...(index[integration] || []), ...(platform === "switch" ? [] : index.mqtt || [])];
  let key = platform;
  for (const e of ids) key += hass.states[e] ? "1" : "0";
  if (platform === "xbox") {
    key += `|${hass.states[id]?.attributes.media_title ?? ""}`;
    for (const e of index[integration] || []) if (e.startsWith("sensor.")) key += `|${hass.states[e]?.state ?? ""}`;
  }
  return key;
};

// The model drawn: ps5, ps4, xsx, xss, xone or switch, from the device's model and name.
export const ccModel = (platform, text) => {
  const t = ccNorm(text);
  if (platform === "xbox") return /series_?s/.test(t) ? "xss" : /one/.test(t) ? "xone" : "xsx";
  if (platform === "switch") return /switch_?2|_2$|bee/.test(t) ? "switch2" : "switch";
  return /ps4|playstation_4|ps3|playstation_3|vita/.test(t) ? "ps4" : "ps5";
};

// A duration in minutes, cut into hours and minutes.
export const ccHm = (mins) => ({ h: Math.floor(Math.max(0, mins) / 60), m: Math.round(Math.max(0, mins) % 60) });

// A duration sensor in minutes, in its unit (d, h, min, s, ms); no unit: hours, history_stats' default.
export const ccMinutes = (st) => {
  const n = ccNum(st);
  if (n == null) return null;
  const k = { d: 1440, h: 60, min: 1, s: 1 / 60, ms: 1 / 60000 }[st.attributes?.unit_of_measurement || "h"];
  return k == null ? null : Math.max(0, n * k);
};

// Whether a state of the history plays: the media player playing or paused (on Xbox, a game, not an app), the PS5-MQTT
// activity *playing* — the card's own rule for the playing state.
export const ccPlays = (role, state, attrs, platform) =>
  role === "activity" ? ccNorm(state) === "playing" : (state === "playing" || state === "paused") && !(platform === "xbox" && attrs?.media_content_type === "app");

// The minutes played between `from` and `to` (ms), from the compressed answer of history/history_during_period
// ({ entity_id: [{ s, a, lu, lc }] }, times in seconds) for `ids` ({ role: entity_id }): the spans of every role,
// overlapping ones counted once (the PSN media player and the PS5-MQTT activity both see the same game).
export const ccPlayedMinutes = (hist, ids, platform, from, to) => {
  const spans = [];
  for (const [role, id] of Object.entries(ids)) {
    let attrs = {};
    let start = null;
    for (const r of hist?.[id] || []) {
      if (r.a) attrs = r.a;
      const t = Math.min(to, Math.max(from, ((r.lc ?? r.lu) || 0) * 1000));
      const on = ccPlays(role, r.s, attrs, platform);
      if (on && start == null) start = t;
      else if (!on && start != null) {
        spans.push([start, t]);
        start = null;
      }
    }
    if (start != null) spans.push([start, to]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let end = -Infinity;
  for (const [a, b] of spans) {
    const s = Math.max(a, end);
    if (b > s) total += b - s;
    end = Math.max(end, b);
  }
  return total / 60000;
};
