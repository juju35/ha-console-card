import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass, st } from "./hass.mjs";
import { fakeNode, load } from "./load.mjs";

const cc = load();
const { cards } = cc;
const json = (v) => JSON.parse(JSON.stringify(v));

// A card whose shadow root answers every selector with nodes recording their click listeners.
const make = (tag, config, hass = makeHass()) => {
  const card = new cards[tag]();
  card.attachShadow();
  const nodes = {};
  card.shadowRoot.querySelector = (s) => (nodes[s] ||= fakeNode());
  card._nodes = nodes;
  card.setConfig({ type: `custom:${tag}`, ...config });
  card.hass = hass;
  return card;
};
const click = (card, sel) => card._nodes[sel].listeners.click({ stopPropagation() {} });
const PS = { entity: "media_player.playstation_5" };
const XBOX = { entity: "media_player.xbox_series_x" };
const NS = { entity: "sensor.kids_switch_used_screen_time" };

test("both cards are registered, with their editors and a picker entry", () => {
  for (const tag of ["console-card", "console-mini-card"]) {
    assert.ok(cc.customElements.get(tag), tag);
    assert.ok(cc.customElements.get(`${tag}-editor`), `${tag}-editor`);
  }
  assert.deepEqual(json(cc.window.customCards.map((c) => c.type)), ["console-card", "console-mini-card"]);
});

test("discovery: media players playing first, PS5-MQTT only without a PSN console, one entity per Switch", () => {
  const h = makeHass({ ps: "off" });
  assert.deepEqual(json(cc.ccConsoles(h)), ["media_player.xbox_series_x", "media_player.playstation_5", "sensor.kids_switch_used_screen_time"]);
  assert.deepEqual(json(cc.ccConsoles(makeHass({ psn: false, xbox: "off" }))), ["media_player.xbox_series_x", "switch.ps5_power", "sensor.kids_switch_used_screen_time"]);
  assert.deepEqual(json(cards["console-card"].getStubConfig(makeHass())), PS);
});

test("discovery: the PSN account through the console's parent device, the PS5-MQTT power switch beside it", () => {
  const r = cc.ccFind(makeHass(), "media_player.playstation_5");
  assert.equal(r.platform, "playstation");
  assert.equal(r.trophy_level, "sensor.player_trophy_level");
  assert.equal(r.level_progress, "sensor.player_trophy_level_progress");
  assert.equal(r.gold, "sensor.player_earned_trophies_gold");
  assert.equal(r.plus, "binary_sensor.player_playstation_plus");
  assert.equal(r.power, "switch.ps5_power");
  assert.equal(r.activity, "sensor.ps5_activity");
  assert.equal(cc.ccFind(makeHass(), "media_player.playstation_5", { power: "switch.other" }).power, "switch.other");
});

test("discovery: the Xbox account playing what the console shows, not a friend's; the console's storage and remote", () => {
  const r = cc.ccFind(makeHass(), "media_player.xbox_series_x");
  assert.equal(r.gamerscore, "sensor.gamer_gamer_score");
  assert.equal(r.now_playing, "sensor.gamer_now_playing");
  assert.equal(r.free_storage, "sensor.xbox_series_x_free_storage");
  assert.equal(r.power, "remote.xbox_series_x");
  assert.equal(r.game_pass, "binary_sensor.gamer_game_pass");
});

test("discovery without translation keys: by entity ID and name", () => {
  const h = makeHass();
  for (const e of Object.values(h.entities)) delete e.translation_key;
  const r = cc.ccFind(h, "sensor.kids_switch_used_screen_time");
  assert.equal(r.time_remaining, "sensor.kids_switch_time_remaining");
  assert.equal(r.suspend, "switch.kids_switch_suspend_software");
  assert.equal(r.max_screentime, "number.kids_switch_max_screentime_today");
  assert.equal(r.bedtime_end, "time.kids_switch_bedtime_end_time");
});

test("models drawn, from the device", () => {
  assert.equal(cc.ccModel("playstation", "PlayStation 5"), "ps5");
  assert.equal(cc.ccModel("playstation", "PlayStation 4"), "ps4");
  assert.equal(cc.ccModel("xbox", "Xbox Series S"), "xss");
  assert.equal(cc.ccModel("xbox", "Xbox One X"), "xone");
  assert.equal(cc.ccModel("xbox", "Xbox Series X"), "xsx");
  assert.equal(cc.ccModel("switch", "Nintendo Switch 2"), "switch2");
  assert.equal(cc.ccModel("switch", "Nintendo Switch OLED"), "switch");
});

test("PlayStation playing: the game, its cover and session on the TV and under the banner, trophies, power", () => {
  const h = makeHass();
  const card = make("console-card", PS, h);
  const m = card._items;
  assert.equal(m.state, "playing");
  assert.equal(m.title, "Neon Drift");
  assert.ok(Math.abs(m.since - 72) < 1);
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /class="banner"/);
  assert.match(html, /<image href="data:image\/svg\+xml/, "the cover on the TV");
  assert.match(html, /class="cv" src="data:image/, "the cover under the banner");
  assert.match(html, /Neon Drift/);
  assert.match(html, /For 1 h 12 min/);
  assert.match(html, /Trophy level/);
  assert.match(html, /1,902/);
  assert.match(html, /act-power[^>]*>.*Turn off/s);
  assert.match(html, /ha-icon icon="mdi:sony-playstation"/);
  assert.match(html, /<animate attributeName="x"/, "the gleam crosses the screen while playing");
  click(card, ".act-power");
  assert.deepEqual(json(h.calls.at(-1)), ["switch", "turn_off", { entity_id: "switch.ps5_power" }]);
});

test("PlayStation in standby: a dark screen, last seen, turn on", () => {
  const h = makeHass({ ps: "off" });
  const card = make("console-card", PS, h);
  assert.equal(card._items.state, "standby");
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /Not playing/);
  assert.match(html, /Last seen 3 hours ago/);
  assert.doesNotMatch(html, /<image /);
  assert.doesNotMatch(html, /<animate/);
  click(card, ".act-power");
  assert.deepEqual(json(h.calls.at(-1)), ["switch", "turn_on", { entity_id: "switch.ps5_power" }]);
  // Unavailable: offline, no controls.
  const off = make("console-card", PS, makeHass({ ps: "unavailable", mqtt: false }));
  assert.equal(off._items.state, "offline");
  assert.doesNotMatch(off.shadowRoot.innerHTML, /act-power/);
});

test("PS5-MQTT alone: the activity's game and the power switch", () => {
  const card = make("console-card", { entity: "switch.ps5_power" }, makeHass({ psn: false }));
  const m = card._items;
  assert.equal(m.platform, "playstation");
  assert.equal(m.state, "playing");
  assert.equal(m.title, "Neon Drift");
  assert.equal(m.powerId, "switch.ps5_power");
  assert.doesNotMatch(card.shadowRoot.innerHTML, /class="tro"/, "no account, no trophies");
});

test("Xbox: achievements, Gamerscore, party, storage in base 1024; home and power through the remote", () => {
  const h = makeHass();
  const card = make("console-card", XBOX, h);
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /Ember Crown/);
  assert.match(html, /34 \/ 50 achievements/);
  assert.match(html, /48,215/);
  assert.match(html, /388 GiB/);
  assert.match(html, /of 1\.0 TiB/);
  assert.match(html, /mdi:microsoft-xbox/);
  click(card, ".act-home");
  assert.deepEqual(json(h.calls.at(-1)), ["media_player", "play_media", { entity_id: "media_player.xbox_series_x", media_content_id: "Home", media_content_type: "" }]);
  click(card, ".act-power");
  assert.deepEqual(json(h.calls.at(-1)), ["remote", "turn_off", { entity_id: "remote.xbox_series_x" }]);
  // On its home screen: online, no game; in an app: the app's name.
  const home = make("console-card", XBOX, makeHass({ xbox: "on" }));
  assert.equal(home._items.state, "online");
  assert.match(home.shadowRoot.innerHTML, /Home screen/);
  const app = make("console-card", XBOX, makeHass({ xbox: "app" }));
  assert.equal(app._items.state, "online");
  assert.match(app.shadowRoot.innerHTML, /Video app/);
});

test("Switch: screen time ring, time left; time's up; suspended; bonus and suspend", () => {
  const h = makeHass();
  const card = make("console-card", NS, h);
  assert.equal(card._items.state, "online");
  assert.equal(card._status(card._items), "40 min left");
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /Screen time today/);
  assert.match(html, /1 h 20 min of 2 h/);
  assert.match(html, /21:00 → 07:00/);
  assert.match(html, /mdi:nintendo-switch/);
  click(card, ".act-bonus");
  assert.deepEqual(json(h.calls.at(-1)), ["nintendo_parental_controls", "add_bonus_time", { device_id: "ns", bonus_time: 15 }]);
  click(card, ".act-suspend");
  assert.deepEqual(json(h.calls.at(-1)), ["switch", "turn_on", { entity_id: "switch.kids_switch_suspend_software" }]);
  assert.equal(make("console-card", NS, makeHass({ left: 0, used: 120 }))._items.state, "time_up");
  assert.equal(make("console-card", NS, makeHass({ suspend: "on" }))._items.state, "suspended");
  // No limit; the bonus clamped to what the integration accepts.
  const free = make("console-card", { ...NS, bonus_minutes: 60 }, makeHass({ max: -1 }));
  assert.equal(free._status(free._items), "No limit");
  assert.equal(free._bonus(), 30);
});

test("Switch: the ring opens the screen time panel — today's limit stepped by 15 min, no limit, bonus choices", () => {
  const h = makeHass();
  const card = make("console-card", { ...NS, bonus_minutes: [10, 5, 10, 60] }, h);
  assert.deepEqual(json(card._bonusList()), [10, 5, 30]);
  assert.equal(card._bonus(), 10);
  assert.match(card.shadowRoot.innerHTML, /aria-expanded="false"/);
  click(card, ".np");
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /class="np stp"/);
  assert.match(html, /Today(&#39;|&#x27;|')s limit/);
  assert.match(html, /class="stv"[^>]*>2 h</);
  assert.match(html, /data-n="5">\+5 min</);
  assert.match(html, /data-n="30">\+30 min</);
  assert.match(html, /class="stn st-none"/);
  // The taps add up; the value goes out once they stop (or the panel closes).
  click(card, ".st-plus");
  click(card, ".st-plus");
  assert.match(card.shadowRoot.innerHTML, /class="stv"[^>]*>2 h 30 min</);
  const before = h.calls.length;
  click(card, ".st-close");
  assert.equal(card._stOpen, false);
  assert.deepEqual(json(h.calls.at(-1)), ["number", "set_value", { entity_id: "number.kids_switch_max_screentime_today", value: 150 }]);
  assert.equal(h.calls.length, before + 1);
  // The 15-minute grid and the bounds: from no limit, down starts at the highest limit; nothing past the bounds.
  const step = (max, sel) => {
    const c = make("console-card", NS, makeHass({ max }));
    click(c, ".np");
    if (sel) click(c, sel);
    return c.shadowRoot.innerHTML;
  };
  assert.match(step(100, ".st-plus"), /class="stv"[^>]*>1 h 45 min</);
  assert.match(step(100, ".st-minus"), /class="stv"[^>]*>1 h 30 min</);
  assert.match(step(-1, ".st-minus"), /class="stv"[^>]*>6 h</);
  assert.match(step(-1), /st-plus"[^>]*aria-disabled="true"/);
  assert.doesNotMatch(step(-1), /st-none/);
  assert.match(step(360), /st-plus"[^>]*aria-disabled="true"/);
  // One bonus value and no limit number: the ring opens the details, as before.
  const plain = make("console-card", NS, makeHass());
  assert.equal(plain._stCan({ ...plain._items, maxId: null }), false);
  assert.equal(plain._stCan(plain._items), true);
  // A list of bonus choices is YAML only: the editor drops the number field.
  const ed = new (cc.customElements.get("console-card-editor"))();
  ed.appendChild = () => {};
  ed.setConfig({ type: "custom:console-card", ...NS, bonus_minutes: [5, 10] });
  ed.hass = makeHass();
  assert.ok(!ed._form.schema.some((f) => f.name === "bonus_minutes"));
});

test("mini card: the state as the pill, the game and the session as chips; the zoom opens the full card", () => {
  const card = make("console-mini-card", PS);
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /class="banner"/);
  assert.match(html, /class="bpt">Playing/);
  assert.match(html, /<span>Neon Drift<\/span>/);
  assert.match(html, /<span>1 h 12 min<\/span>/);
  assert.doesNotMatch(html, /class="np/);
  const sw = make("console-mini-card", NS);
  assert.match(sw.shadowRoot.innerHTML, /class="bpt">40 min left/);
});

test("banner: night by illustration_theme, else the dark theme alone; unique ids; classic header on demand", () => {
  const h = makeHass();
  const html = (config, hass = h) => make("console-card", { ...PS, ...config }, hass).shadowRoot.innerHTML;
  assert.match(html({}), /class="banner"/);
  assert.match(html({ illustration_theme: "night" }), /class="banner night"/);
  assert.match(html({}, { ...h, themes: { darkMode: true } }), /class="banner night"/);
  assert.match(html({ illustration_theme: "day" }, { ...h, themes: { darkMode: true } }), /class="banner"/);
  const ids = (s) => s.match(/id="cs([a-z0-9]+)"/)[1];
  assert.notEqual(ids(html({})), ids(html({})));
  const classic = html({ illustration: false });
  assert.doesNotMatch(classic, /class="banner/);
  assert.match(classic, /class="pill"/);
  assert.doesNotMatch(html({ animations: false }), /<animate/);
  assert.doesNotMatch(html({ show_trophies: false }), /class="tro"/);
  assert.doesNotMatch(html({ show_controls: false }), /act-power/);
});

test("play time today: a sensor in its unit, else counted from the history, overlaps once; hidden on demand", async () => {
  assert.equal(cc.ccMinutes(st("sensor.t", "1.5", { unit_of_measurement: "h" })), 90);
  assert.equal(cc.ccMinutes(st("sensor.t", "2")), 120, "no unit: hours (history_stats)");
  assert.equal(cc.ccMinutes(st("sensor.t", "45", { unit_of_measurement: "min" })), 45);
  assert.equal(cc.ccMinutes(st("sensor.t", "600", { unit_of_measurement: "s" })), 10);
  assert.equal(cc.ccMinutes(st("sensor.t", "unavailable")), null);
  // A sensor, on any platform (the Switch too).
  const xbox = make("console-card", { ...XBOX, play_time: "sensor.xbox_play_time_today" });
  assert.equal(xbox._items.playTime, 165);
  assert.match(xbox.shadowRoot.innerHTML, /Played today.*2 h 45 min/s);
  assert.match(make("console-card", { ...NS, play_time: "sensor.xbox_play_time_today" }).shadowRoot.innerHTML, /Played today/);
  assert.doesNotMatch(make("console-card", { ...XBOX, play_time: "sensor.xbox_play_time_today", show_play_time: false }).shadowRoot.innerHTML, /Played today/);
  // The history: PSN playing 10:00–11:00, PS5-MQTT playing 10:30–11:30 → 90 min; an Xbox app is not a game.
  const T = (hh, mm = 0) => new Date(2026, 10, 18, hh, mm).getTime() / 1000;
  const from = new Date(2026, 10, 18).getTime();
  const to = new Date(2026, 10, 18, 12).getTime();
  const hist = {
    "media_player.ps": [{ s: "off", lu: T(0) }, { s: "playing", lu: T(10) }, { s: "off", lu: T(11) }],
    "sensor.act": [{ s: "none", lu: T(0) }, { s: "playing", lu: T(10, 30) }, { s: "idle", lu: T(11, 30) }],
  };
  assert.equal(cc.ccPlayedMinutes(hist, { media: "media_player.ps", activity: "sensor.act" }, "playstation", from, to), 90);
  const xh = { "media_player.x": [{ s: "playing", a: { media_content_type: "app" }, lu: T(9) }, { s: "playing", a: { media_content_type: "game" }, lu: T(10) }] };
  assert.equal(cc.ccPlayedMinutes(xh, { media: "media_player.x" }, "xbox", from, to), 120, "still playing: up to now");
  // The card asks Home Assistant's history since midnight, then shows it, the minutes since then added while it plays.
  const asked = [];
  const h = makeHass({}, { callWS: (msg) => (asked.push(msg), Promise.resolve({ "media_player.playstation_5": [{ s: "playing", lu: Date.now() / 1000 - 3600 }] })) });
  const card = make("console-card", PS, h);
  assert.equal(asked[0].type, "history/history_during_period");
  assert.deepEqual(json(asked[0].entity_ids), ["media_player.playstation_5", "sensor.ps5_activity"]);
  assert.equal(asked[0].no_attributes, true);
  await new Promise((r) => setTimeout(r, 0));
  assert.ok(Math.abs(card._items.playTime - 60) < 1);
  assert.match(card.shadowRoot.innerHTML, /Played today.*1 h/s);
  card.hass = h;
  assert.equal(asked.length, 1, "not asked again on each update");
  // The Switch's own screen time is on its ring: no history asked.
  const sw = [];
  make("console-card", NS, makeHass({}, { callWS: (m) => (sw.push(m), Promise.resolve({})) }));
  assert.equal(sw.length, 0);
});

test("no console: a message", () => {
  const h = makeHass();
  const card = make("console-card", { entity: "sensor.unknown" }, { ...h, states: { ...h.states, "sensor.unknown": st("sensor.unknown", "1") } });
  assert.match(card.shadowRoot.innerHTML, /No game console found/);
});

test("redraws only when something shown changes", () => {
  const h = makeHass();
  const card = make("console-card", PS, h);
  const before = card._sig;
  card.hass = { ...h, states: { ...h.states, "sensor.player_last_online": st("sensor.player_last_online", new Date().toISOString()) } };
  assert.equal(card._sig, before);
});

test("editors: defaults stay out of the YAML, every field has a label", () => {
  const flat = (schema) => schema.flatMap((f) => (f.schema ? flat(f.schema) : [f]));
  for (const tag of ["console-card", "console-mini-card"]) {
    const ed = new (cc.customElements.get(`${tag}-editor`))();
    ed.appendChild = () => {};
    ed.setConfig({ type: `custom:${tag}`, ...PS });
    ed.hass = makeHass();
    for (const f of flat(ed._form.schema)) {
      assert.notEqual(ed._form.computeLabel(f), `ed_${f.name}`, `${tag}: no label for ${f.name}`);
      const helper = ed._form.computeHelper(f);
      if (helper !== undefined) assert.notEqual(helper, `ed_${f.name}_helper`, `${tag}: no helper for ${f.name}`);
    }
    let out;
    ed.dispatchEvent = (e) => (out = e.detail.config);
    ed._form.listeners["value-changed"]({ detail: { value: { type: `custom:${tag}`, ...PS, animations: true, bonus_minutes: 15 } } });
    assert.deepEqual(json(out), { type: `custom:${tag}`, ...PS });
  }
});

test("translations: every language has every key of English, with the same placeholders", () => {
  const LANGS = ["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];
  const vars = (s) => s.match(/\{\w+\}/g)?.sort() ?? [];
  for (const [name, table] of [["shared", cc.RC_I18N], ["cc", cc.CC_I18N]]) {
    assert.deepEqual(json(Object.keys(table)), LANGS, name);
    const ref = json(Object.keys(table.en)).sort();
    for (const lang of LANGS) {
      const keys = json(Object.keys(table[lang])).filter((k) => !["open_f", "closed_f"].includes(k) && !k.endsWith("_few"));
      assert.deepEqual(keys.sort(), ref, `${name}.${lang}`);
      for (const k of ref) assert.deepEqual(json(vars(table[lang][k])), json(vars(table.en[k])), `${name}.${lang}.${k}`);
    }
  }
  const fr = make("console-card", { ...NS, language: "fr" });
  assert.equal(fr._status(fr._items), "40 min restantes");
});

test("discovery runs again only when what it reads of the states changes, not on every state change", () => {
  const h = makeHass();
  const id = "media_player.playstation_5";
  const key = cc.ccFindKey(h, id);
  // A state update of a found entity (same entities present): same key.
  const h2 = { ...h, states: { ...h.states, "sensor.player_trophy_level": { ...h.states["sensor.player_trophy_level"], state: "999" } } };
  assert.equal(cc.ccFindKey(h2, id), key);
  // An entity of the console's integration losing its state: new key, ccFind runs again.
  const { "sensor.player_trophy_level": _gone, ...rest } = h.states;
  assert.notEqual(cc.ccFindKey({ ...h, states: rest }, id), key);
  // Xbox: the title the console plays picks the account.
  const x = "media_player.xbox_series_x";
  const hx = { ...h, states: { ...h.states, [x]: { ...h.states[x], attributes: { ...h.states[x].attributes, media_title: "Another game" } } } };
  assert.notEqual(cc.ccFindKey(hx, x), cc.ccFindKey(h, x));
  // The card keeps its roles across an unrelated update.
  const card = make("console-card", PS, h);
  card._collect();
  const memo = card._memo.find.value;
  card._hass = h2;
  card._collect();
  assert.equal(card._memo.find.value, memo);
});
