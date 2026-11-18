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
