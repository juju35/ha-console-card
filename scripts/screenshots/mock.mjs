// The mock home of the screenshots, animations and tests: a PS5 seen by the PlayStation Network integration (its
// account's trophies and PlayStation Plus) with its PS5-MQTT power switch, an Xbox Series X (its remote, storage and the
// account's Gamerscore, a friend's account beside it) and a Nintendo Switch with its parental controls. Neutral names
// and made-up games only.
export const st = (entity_id, state, attributes = {}, last_changed = new Date().toISOString()) => ({ entity_id, state, attributes, last_changed });
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();

// Covers drawn in SVG (no real game art): a data URL the cards show as the game's picture.
const cover = (a, b, sun) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="60" height="80" fill="url(#g)"/><circle cx="30" cy="44" r="14" fill="${sun}"/><path d="M0 60 L18 46 L30 54 L44 40 L60 56 V80 H0Z" fill="#000" opacity=".35"/><rect x="8" y="10" width="44" height="6" rx="2" fill="#fff" opacity=".85"/></svg>`,
  )}`;
export const COVERS = { neon: cover("#1c0f3a", "#ff8a5c", "#ffd36b"), ember: cover("#0f1a2e", "#6a3a3a", "#f6ecd0") };

// `ps`: playing, on, off or unavailable; `xbox`: playing, app, on or off; `left`, `used`, `max` (minutes), `suspend`.
export const home = ({ ps = "playing", xbox = "playing", left = 40, used = 80, max = 120, extended = 0, suspend = "off", mqtt = true, psn = true } = {}) => {
  const entities = {};
  const states = {};
  const add = (id, device, platform, translation_key, state, attributes = {}, last_changed) => {
    entities[id] = { entity_id: id, device_id: device, platform, ...(translation_key ? { translation_key } : {}) };
    states[id] = st(id, state, attributes, last_changed);
  };
  if (psn) {
    const playing = ps === "playing";
    add("media_player.playstation_5", "ps5", "playstation_network", "playstation", ps, {
      friendly_name: "PlayStation 5",
      ...(playing ? { media_title: "Neon Drift", media_content_type: "game", entity_picture: COVERS.neon } : {}),
    }, playing ? ago(72) : undefined);
    const acc = (key, state, attrs) => add(`sensor.player_${key}`, "psn", "playstation_network", key, state, attrs);
    acc("trophy_level", "412");
    acc("trophy_level_progress", "38", { unit_of_measurement: "%" });
    acc("earned_trophies_platinum", "12");
    acc("earned_trophies_gold", "148");
    acc("earned_trophies_silver", "463");
    acc("earned_trophies_bronze", "1902");
    acc("online_status", playing || ps === "on" ? "Online" : "Offline");
    acc("last_online", ago(playing ? 0 : 180), { device_class: "timestamp" });
    acc("now_playing", playing ? "Neon Drift" : "unknown");
    add("binary_sensor.player_playstation_plus", "psn", "playstation_network", "ps_plus_status", "on");
  }
  if (mqtt) {
    add("switch.ps5_power", "ps5mqtt", "mqtt", null, ps === "off" || ps === "unavailable" ? "off" : "on", { friendly_name: "PS5 Power" });
    add("sensor.ps5_activity", "ps5mqtt", "mqtt", null, ps === "playing" ? "playing" : ps === "on" ? "idle" : "none", {
      friendly_name: "PS5 Activity",
      ...(ps === "playing" ? { title_name: "Neon Drift", title_image: COVERS.neon } : {}),
    }, ps === "playing" ? ago(72) : undefined);
  }
  const xPlaying = xbox === "playing";
  add("media_player.xbox_series_x", "xsx", "xbox", "xbox", xbox === "app" ? "playing" : xbox, {
    friendly_name: "Xbox Series X",
    ...(xPlaying ? { media_title: "Ember Crown", media_content_type: "game", entity_picture: COVERS.ember } : {}),
    ...(xbox === "app" ? { media_title: "Video app", media_content_type: "app" } : {}),
    ...(xbox === "on" ? { media_title: "Home", media_content_type: "app" } : {}),
  }, xPlaying ? ago(125) : undefined);
  add("remote.xbox_series_x", "xsx", "xbox", null, xbox === "off" ? "off" : "on", { friendly_name: "Xbox Series X Remote" });
  add("sensor.xbox_series_x_total_storage", "xsx", "xbox", "total_storage", String(1024 ** 4), { unit_of_measurement: "B" });
  add("sensor.xbox_series_x_free_storage", "xsx", "xbox", "free_storage", String(388 * 1024 ** 3), { unit_of_measurement: "B" });
  const gamer = (key, state, attrs, who = "gamer") => add(`sensor.${who}_${key}`, who, "xbox", key, state, attrs);
  gamer("gamer_score", "48215");
  gamer("now_playing", xPlaying ? "Ember Crown" : "unknown", xPlaying ? { achievements: "34 / 50", progress: "68 %", genres: "Action & adventure" } : {});
  gamer("in_party", xPlaying ? "2" : "0");
  gamer("friends", "37");
  gamer("status", xPlaying ? "Playing Ember Crown" : "Online");
  add("binary_sensor.gamer_game_pass", "gamer", "xbox", "has_game_pass", "on");
  // A friend's account: the console's own account is the one playing what it shows.
  gamer("gamer_score", "9120", {}, "friend");
  gamer("now_playing", "Another game", {}, "friend");
  const sw = (domain, key, tk, state, attrs) => add(`${domain}.kids_switch_${key}`, "ns", "nintendo_parental_controls", tk, state, attrs);
  sw("sensor", "used_screen_time", "playing_time", String(used), { unit_of_measurement: "min" });
  sw("sensor", "time_remaining", "time_remaining", String(left), { unit_of_measurement: "min" });
  sw("sensor", "time_extended", "time_extended", String(extended), { unit_of_measurement: "min" });
  sw("number", "max_screentime_today", "today_max_screentime", String(max), { unit_of_measurement: "min" });
  sw("switch", "suspend_software", "suspend_software", suspend);
  sw("select", "restriction_mode", "timer_mode", "Daily");
  sw("time", "bedtime_alarm", "bedtime_alarm", "21:00:00");
  sw("time", "bedtime_end_time", "bedtime_end_time", "07:00:00");
  return {
    language: "en",
    locale: { language: "en" },
    themes: { darkMode: false },
    areas: { living: { area_id: "living", name: "Living room" }, kids: { area_id: "kids", name: "Playroom" } },
    devices: {
      psn: { name: "Player", model: "PlayStation Network" },
      ps5: { area_id: "living", name: "PlayStation 5", model: "PlayStation 5", via_device_id: "psn" },
      ps5mqtt: { area_id: "living", name: "PS5", model: "PS5", manufacturer: "Sony" },
      xsx: { area_id: "living", name: "Xbox", model: "Xbox Series X" },
      gamer: { name: "Gamer" },
      friend: { name: "Friend" },
      ns: { area_id: "kids", name: "Kids' Switch", model: "Nintendo Switch" },
    },
    entities,
    states,
  };
};

// The screenshots' scenes: the console's entity and the home's state.
const SCENES = {
  "ps-playing": ["media_player.playstation_5", { ps: "playing" }],
  "ps-standby": ["media_player.playstation_5", { ps: "off" }],
  "xbox-playing": ["media_player.xbox_series_x", { xbox: "playing" }],
  "xbox-online": ["media_player.xbox_series_x", { xbox: "on" }],
  "switch-online": ["sensor.kids_switch_used_screen_time", {}],
  "switch-time-up": ["sensor.kids_switch_used_screen_time", { left: 0, used: 120 }],
  "switch-suspended": ["sensor.kids_switch_used_screen_time", { suspend: "on", left: 0, used: 120 }],
  // A PS5 seen by PS5-MQTT alone (no PlayStation Network account).
  "ps5-mqtt": ["switch.ps5_power", { ps: "playing", psn: false }],
};

export const setup = (s) => {
  const [entity, opts] = SCENES[s.scene];
  const hass = { ...home(opts), themes: { darkMode: s.theme === "dark" } };
  return { hass, config: { entity, ...s.config }, open: s.open };
};
