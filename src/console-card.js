/**
 * console-card / console-mini-card: a game console, illustrated. The TV and the console in their corner of the living
 * room, the game being played with its cover, the account's trophies or Gamerscore, a Switch's screen time, and the
 * power, home and bonus-time controls.
 * https://github.com/juju35/ha-console-card
 */

// The colour of each platform: on the badge, the pill, the TV's light and the console's LED while it plays.
const CC_ACCENTS = { playstation: "#2f6fe0", xbox: "#2ea043", switch: "#e5383b" };
const CC_ICONS = { playstation: "mdi:sony-playstation", xbox: "mdi:microsoft-xbox", switch: "mdi:nintendo-switch" };
// One loop of the illustration's animations (s): the TV's light breathes once, a gleam crosses its screen once. The
// GIFs record one loop.
const CC_LOOP = 3;
// The states drawn in colour: the others are grey (standby, offline) or an alert (time's up).
const CC_ACTIVE = ["playing", "online"];

// ── Banner ───────────────────────────────────────────────────────────────────
// The illustrated header's room: a corner of the living room, 200 × 80, drawn to the banner's right edge. The wall,
// a TV stand, the TV, the console beside it (each model drawn: PS5, PS4, Xbox Series X, Series S, One, Switch in its
// dock). While it plays, the TV shows the game's cover (or a picture in the platform's colour), its light breathes on
// the wall and a gleam crosses its screen; online, the home screen's tiles; in standby, a dark screen. By night, darker.
// The status pill's place, decided by measurement after each render and each new width (the same rule on every
// card): on the title row, right after the title, only when the whole title and the pill's whole label fit there;
// otherwise on its own line under the subtitle (clamped to one line), the title whole on its row (cut only when it
// does not fit alone). When the label is still cut there, or the text block leaves the banner or runs over its ground
// strip, the pill keeps its dot alone, on the title row (its label stays in title and aria-label). A card of 200 px
// or less shows the dot alone anyway (CSS), beside the title.
const ccPlacePill = (head, row, ground) => {
  if (!head) return;
  head.removeAttribute("data-wrap");
  head.removeAttribute("data-dot");
  const pill = row.querySelector(":scope > .bpill, :scope > .pill");
  const text = pill?.querySelector(".bpt, .pt");
  if (!text?.getBoundingClientRect || text.getBoundingClientRect().width <= 1) return;
  const name = row.querySelector(".title");
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const title = name ? (name.scrollWidth > name.clientWidth ? name.scrollWidth : name.getBoundingClientRect().width) + gap : 0;
  if (title + pill.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5) return;
  head.setAttribute("data-wrap", "");
  const box = row.parentElement.getBoundingClientRect();
  const frame = head.getBoundingClientRect();
  const out = ground && (box.bottom > ground.getBoundingClientRect().top + 0.5 || box.top < frame.top - 0.5);
  if (text.scrollWidth > text.clientWidth + 0.5 || out) {
    head.removeAttribute("data-wrap");
    head.setAttribute("data-dot", "");
  }
};

// The consoles, each standing on the TV stand (its top at y = 66) with its right edge at x = 0, as SVG groups.
// `acc`: the LED's colour, lit while the console is on; `on`: whether it is.
const ccConsole = (model, { acc, on, uid, night }) => {
  const led = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="${on ? acc : night ? "#3a3f4b" : "#9aa3ae"}"/>`;
  const shadow = (cx, rx) => `<ellipse cx="${cx}" cy="66" rx="${rx}" ry="1.8" fill="#000" opacity="${night ? 0.5 : 0.22}"/>`;
  switch (model) {
    case "ps4":
      return `${shadow(-24, 26)}<path d="M-46 66 L-44 56 H-3 L-1 66 Z" fill="url(#cd${uid})"/><path d="M-44 56 H-3 L-3.6 59 H-43.4 Z" fill="#2a2e38"/>${led(-30, 60.6, 13, 1.4)}<rect x="-45" y="62" width="43" height=".8" fill="#000" opacity=".5"/>`;
    case "xss":
      return `${shadow(-14, 16)}<rect x="-28" y="34" width="26" height="32" rx="2.5" fill="url(#cw${uid})" stroke="${night ? "#7b828e" : "#c3c8d0"}" stroke-width=".6"/><circle cx="-15" cy="44" r="7" fill="#15171c"/><g fill="#2a2e36">${[0, 1, 2]
        .map((k) => `<circle cx="${-19 + k * 4}" cy="44" r=".9"/>`)
        .join("")}</g>${led(-24.5, 37.5, 2.2, 2.2)}`;
    case "xone":
      return `${shadow(-25, 27)}<rect x="-50" y="54" width="48" height="12" rx="1.5" fill="url(#cd${uid})"/><rect x="-50" y="54" width="22" height="12" rx="1.5" fill="#24272e"/><path d="M-27 55 H-3" stroke="#fff" stroke-opacity=".08"/>${led(-44, 58.5, 3, 3)}`;
    case "switch":
    case "switch2": {
      const k = model === "switch2" ? 1.08 : 1;
      return `<g transform="translate(0 66) scale(${k}) translate(0 -66)">${shadow(-24, 26)}
        <rect x="-44" y="42" width="7" height="18" rx="3.5" fill="#e9474d"/><rect x="-11" y="42" width="7" height="18" rx="3.5" fill="#2e9be6"/>
        <rect x="-37.5" y="40" width="26" height="20" rx="1.4" fill="#24262c"/>
        <rect x="-35.8" y="41.6" width="22.6" height="14.4" rx=".8" fill="${on ? acc : "#0b0e16"}" opacity="${on ? 0.55 : 1}"/>
        <path d="M-47 52 H-1 V64.6 Q-1 66 -2.4 66 H-45.6 Q-47 66 -47 64.6 Z" fill="url(#cd${uid})"/><path d="M-47 52 H-1 V53.4 H-47 Z" fill="#33363e"/>
        ${led(-27, 63, 4, 1)}</g>`;
    }
    case "xsx":
      return `${shadow(-15, 17)}<rect x="-30" y="10" width="28" height="56" rx="2.5" fill="url(#cx${uid})"/><rect x="-29.5" y="10.5" width="27" height="55" rx="2.2" fill="none" stroke="#fff" stroke-opacity=".07"/>
        <ellipse cx="-16" cy="12.2" rx="11.5" ry="1.6" fill="#08090b"/><ellipse cx="-16" cy="12.2" rx="9" ry="1" fill="${on ? acc : "#1b1d22"}" opacity=".8"/>
        <circle cx="-6.5" cy="17.5" r="1.3" fill="${on ? "#f2f4f8" : "#5a606b"}"/><rect x="-25" y="57" width="18" height="1.1" rx=".55" fill="#08090b"/>`;
    default:
      // PS5: the two white shells flaring at the top, the black core and its light bar, on its round stand.
      return `${shadow(-14, 16)}<g transform="translate(-28 4)"><rect x="6" y="58" width="15" height="4" rx="2" fill="#1a1c22"/>
        <path d="M4.5 58 C3.2 41 1.6 19 0 2.5 C2.5 .6 6.5 .4 10 2 L10 58 Z" fill="url(#cl${uid})"/>
        <path d="M17 2 C20.5 .4 24.5 .6 27 2.5 C25.4 19 23.8 41 22.5 58 L17 58 Z" fill="url(#cr${uid})"/>
        <rect x="10" y="2.6" width="7" height="55.4" fill="url(#cc${uid})"/>${led(12.9, 3.6, 1.2, 12)}</g>`;
  }
};

// The TV's picture: the game's cover (an <image>, cropped to the screen) over a picture in the platform's colour while
// it plays; the home screen's tiles when online; a dark screen with its reflection otherwise.
const ccScreen = ({ state, acc, cover, uid, moving, x, y, w, h }) => {
  const clip = `clip-path="url(#sc${uid})"`;
  if (state === "playing") {
    const art = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sa${uid})"/><circle cx="${x + w / 2}" cy="${y + h * 0.62}" r="${h * 0.32}" fill="#ffe08a" opacity=".85"/>
      <path d="M${x} ${y + h * 0.78} L${x + w * 0.3} ${y + h * 0.55} L${x + w * 0.5} ${y + h * 0.7} L${x + w * 0.72} ${y + h * 0.5} L${x + w} ${y + h * 0.74} V${y + h} H${x} Z" fill="#000" opacity=".35"/>`;
    const img = cover ? `<image href="${rcEsc(cover)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>` : "";
    const gleam = moving
      ? `<rect x="${x - 24}" y="${y}" width="14" height="${h}" fill="#fff" opacity=".14" transform="skewX(-18)"><animate attributeName="x" from="${x - 30}" to="${x + w + 30}" dur="${CC_LOOP}s" repeatCount="indefinite"/></rect>`
      : "";
    return `<g ${clip}>${art}${img}${gleam}</g>`;
  }
  if (state === "online") {
    const tiles = [0, 1, 2, 3].map((k) => `<rect x="${x + 6 + k * ((w - 12) / 4)}" y="${y + h * 0.48}" width="${(w - 12) / 4 - 3}" height="${h * 0.26}" rx="1.5" fill="#fff" opacity="${k ? 0.22 : 0.55}"/>`).join("");
    return `<g ${clip}><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${acc}" opacity=".85"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000" opacity=".35"/>${tiles}<rect x="${x + 6}" y="${y + 6}" width="${w * 0.3}" height="3" rx="1.5" fill="#fff" opacity=".6"/></g>`;
  }
  return `<g ${clip}><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0b0d12"/><path d="M${x} ${y} H${x + w * 0.45} L${x} ${y + h * 0.7} Z" fill="#fff" opacity=".04"/></g>`;
};

const ccRoom = ({ night, state, model, platform, cover, uid, animate, dx = 0 }) => {
  const acc = CC_ACCENTS[platform] || CC_ACCENTS.playstation;
  const lit = CC_ACTIVE.includes(state);
  const moving = animate && state === "playing";
  const [wood, wood2, edge] = night ? ["#4a3a2e", "#33281f", "#5c4838"] : ["#a37b5c", "#7d5b42", "#bf9677"];
  // The TV: 92 × 52 on the stand, its picture inset.
  const [tx, ty, tw, th] = [58 - dx, 10, 92, 52];
  const [sx, sy, sw, sh] = [tx + 2.5, ty + 2.5, tw - 5, th - 5];
  const breathe = moving ? `<animate attributeName="opacity" values=".55;1;.55" dur="${CC_LOOP}s" repeatCount="indefinite"/>` : "";
  return `
    <defs>
      <linearGradient id="cw${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9dce3"/><stop offset=".5" stop-color="#fbfcfe"/><stop offset="1" stop-color="#e3e6ec"/></linearGradient>
      <linearGradient id="cl${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9cdd6"/><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#e6e8ee"/></linearGradient>
      <linearGradient id="cr${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eef0f4"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#c3c7d0"/></linearGradient>
      <linearGradient id="cc${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0c0d11"/><stop offset=".5" stop-color="#262a33"/><stop offset="1" stop-color="#0c0d11"/></linearGradient>
      <linearGradient id="cx${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#121418"/><stop offset=".3" stop-color="#2a2d34"/><stop offset="1" stop-color="#16181d"/></linearGradient>
      <linearGradient id="cd${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2c33"/><stop offset="1" stop-color="#121317"/></linearGradient>
      <linearGradient id="cs${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wood}"/><stop offset="1" stop-color="${wood2}"/></linearGradient>
      <linearGradient id="sa${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1240"/><stop offset=".6" stop-color="${acc}"/><stop offset="1" stop-color="#ff8a5c"/></linearGradient>
      <radialGradient id="cg${uid}"><stop offset="0" stop-color="${acc}" stop-opacity="${night ? 0.45 : 0.28}"/><stop offset="1" stop-color="${acc}" stop-opacity="0"/></radialGradient>
      <clipPath id="sc${uid}"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="1"/></clipPath>
    </defs>
    ${lit ? `<ellipse cx="${tx + tw / 2}" cy="${ty + th / 2}" rx="${tw * 0.85}" ry="${th * 0.75}" fill="url(#cg${uid})">${breathe}</ellipse>` : ""}
    <rect x="${tx + tw / 2 - 9}" y="62" width="18" height="4" rx="1" fill="${night ? "#15171c" : "#2c2f36"}"/>
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="2.5" fill="#0a0b0e"/>
    ${ccScreen({ state, acc, cover, uid, moving, x: sx, y: sy, w: sw, h: sh })}
    <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="1" fill="none" stroke="#fff" stroke-opacity=".06"/>
    <rect x="${32 - dx}" y="66" width="${170 + dx}" height="14" fill="url(#cs${uid})"/><rect x="${32 - dx}" y="66" width="${170 + dx}" height="1.2" fill="${edge}"/>
    <rect x="${40 - dx}" y="70" width="60" height="6" rx="1" fill="#000" opacity=".18"/>
    <g transform="translate(${197 - dx} 0)">${ccConsole(model, { acc, on: lit, uid, night })}</g>`;
};

const ccIcon = (d) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const CC_SVG = {
  power: '<path d="M12 3v8"/><path d="M6.3 7.3a8 8 0 1 0 11.4 0"/>',
  home: '<path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  status: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  friends: '<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 19a6 6 0 0 1 12 0M14 19a4 4 0 0 1 7 0"/>',
  storage: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M7 15h4M16 15h1"/>',
  score: '<circle cx="12" cy="12" r="8"/><path d="M15 9.5a3.5 3.5 0 1 0 0 5h-2.5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  play: '<path d="M7 5v14l11-7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  bonus: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M10 2h4"/>',
  hourglass: '<path d="M6 3h12M6 21h12"/><path d="M7 3c0 4 5 6 5 9s-5 5-5 9M17 3c0 4-5 6-5 9s5 5 5 9"/>',
};
// How long the history-counted play time is kept before it is asked again (ms): sooner when the state changes.
const CC_PLAYED_TTL = 300000;

// ── Card ─────────────────────────────────────────────────────────────────────
class ConsoleCard extends RcCard {
  static tag = "console-card";
  static i18n = CC_I18N;
  static defaults = { illustration: true, illustration_theme: "auto", animations: true, show_trophies: true, show_controls: true, show_play_time: true, bonus_minutes: 15 };

  // The console most likely to be looked at: the one playing, else the first one of the home.
  static getStubConfig(hass) {
    const entity = hass ? ccConsoles(hass)[0] : undefined;
    return entity ? { entity } : {};
  }

  getCardSize() {
    return 6;
  }

  _cols() {
    return 2;
  }

  // The console: `entity`, else the first one of the home.
  _entityId() {
    const c = this._config;
    if (c.entity) return c.entity;
    const h = this._hass;
    // The consoles of the home are scanned again only when the registry changes (or none was found yet).
    const memo = (this._memo ||= {});
    let found = rcMemo(memo, "consoles", [h.entities], () => ccConsoles(h));
    if (!found.length) found = memo.consoles.value = ccConsoles(h);
    return found[0];
  }

  _fmt(v, digits = 0) {
    try {
      return new Intl.NumberFormat(this._lang(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
    } catch {
      return Number(v).toFixed(digits);
    }
  }

  // A duration in minutes: *1 h 12 min*, *45 min*, *2 h*.
  _dur(mins) {
    const { h, m } = ccHm(mins);
    if (!h) return this._t("dur_m", { m });
    return m ? this._t("dur_hm", { h, m }) : this._t("dur_h", { h });
  }

  // A moment, relative to now: *5 minutes ago*, *yesterday*.
  _ago(date) {
    const s = (date.getTime() - Date.now()) / 1000;
    const [v, u] = Math.abs(s) < 3600 ? [s / 60, "minute"] : Math.abs(s) < 86400 ? [s / 3600, "hour"] : [s / 86400, "day"];
    try {
      return new Intl.RelativeTimeFormat(this._lang(), { numeric: "auto" }).format(Math.round(v), u);
    } catch {
      return date.toLocaleString();
    }
  }

  // A size in bytes (or in the sensor's unit) in base 1024: KiB, MiB, GiB with 2, 1 and 0 decimals, TiB with 1.
  _bytes(v, unit) {
    const k = { B: 1, kB: 1e3, KB: 1e3, KiB: 1024, MB: 1e6, MiB: 1024 ** 2, GB: 1e9, GiB: 1024 ** 3, TB: 1e12, TiB: 1024 ** 4 }[unit || "B"] ?? 1;
    const b = v * k;
    const [d, u, p] = b >= 1024 ** 4 ? [1, "TiB", 4] : b >= 1024 ** 3 ? [0, "GiB", 3] : b >= 1024 ** 2 ? [1, "MiB", 2] : [2, "KiB", 1];
    return `${this._fmt(b / 1024 ** p, d)} ${u}`;
  }

  // The console's state and readings.
  _collect() {
    const h = this._hass;
    const c = this._config;
    const id = this._entityId();
    const anchor = id ? h.states[id] : undefined;
    // The roles read the states too (an entity without a state yet is skipped): found again when what they read of
    // them changes (ccFindKey), not on every state change.
    const e = rcMemo((this._memo ||= {}), "find", [id, c.entities, c.power, h.entities, h.devices, ccFindKey(h, id)], () => ccFind(h, id, { ...(c.power ? { power: c.power } : {}), ...(c.entities || {}) }));
    const st = (role) => (e[role] ? h.states[e[role]] : undefined);
    const ok = (s) => s && !rcUnavailable(s);
    const platform = e.platform;
    const dev = h.devices?.[e.device];
    const media = st("media");
    const power = st("power");
    const act = st("activity");
    const pa = media?.attributes || {};
    const fmt = (s) => (ok(s) ? h.formatEntityState?.(s) || s.state : null);
    const num = (s) => ccNum(s);
    let state;
    let title = null;
    let cover = null;
    let since = null;
    let app = false;
    if (platform === "switch") {
      const max = num(st("max_screentime"));
      const left = num(st("time_remaining"));
      if (!ok(anchor) && !ok(st("time_remaining"))) state = "offline";
      else if (st("suspend")?.state === "on") state = "suspended";
      else if (left != null && left <= 0 && max != null && max >= 0) state = "time_up";
      else state = "online";
    } else {
      const mediaOn = ok(media) ? media.state : null;
      const actState = ok(act) ? ccNorm(act.state) : null;
      const playing = (mediaOn === "playing" || mediaOn === "paused") && (platform !== "xbox" || pa.media_content_type !== "app");
      app = platform === "xbox" && (mediaOn === "playing" || mediaOn === "paused" || mediaOn === "on") && pa.media_content_type === "app" && !!pa.media_title && pa.media_title !== "Home";
      if (playing || actState === "playing") state = "playing";
      else if (mediaOn === "on" || power?.state === "on" || actState === "idle") state = "online";
      else if (mediaOn === "off" || mediaOn === "idle" || mediaOn === "standby" || power?.state === "off" || actState === "none" || actState === "standby") state = "standby";
      else state = "offline";
      const np = st("now_playing");
      title = state === "playing" || app ? pa.media_title || act?.attributes.title_name || (ok(np) ? np.state : null) : null;
      if (title === "Home") title = null;
      const img = st("now_playing_image");
      cover = state === "playing" ? pa.entity_picture || act?.attributes.title_image || (ok(img) ? img.attributes.entity_picture : null) || null : null;
      const from = state === "playing" ? (media?.state === "playing" || media?.state === "paused" ? media : actState === "playing" ? act : null) : null;
      const t = from ? new Date(from.last_changed) : null;
      since = t && !Number.isNaN(t.getTime()) ? Math.max(0, (Date.now() - t.getTime()) / 60000) : null;
    }
    const last = st("last_online");
    const lastAt = ok(last) ? new Date(last.state) : null;
    const np = st("now_playing");
    const npa = ok(np) ? np.attributes : {};
    const powerId = ok(power) && /^(switch|remote|input_boolean)\./.test(power.entity_id) ? power.entity_id : null;
    const playTime = c.show_play_time === false ? null : c.play_time ? ccMinutes(h.states[c.play_time]) : platform === "switch" ? null : this._playedToday(e, platform, state);
    const total = num(st("total_storage"));
    const free = num(st("free_storage"));
    return {
      id,
      none: !id || !platform,
      platform,
      ids: e,
      state,
      app,
      raw: anchor ? h.formatEntityState?.(anchor) || anchor.state : "",
      name: c.title || dev?.name_by_user || dev?.name || anchor?.attributes.friendly_name || this._t("title"),
      sub: [dev?.model && dev.model !== dev.name ? dev.model : null, h.areas?.[dev?.area_id]?.name].filter(Boolean).join(" · "),
      model: ccModel(platform, `${dev?.model || ""} ${dev?.name || ""} ${id || ""}`),
      title,
      cover,
      since,
      lastAt: lastAt && !Number.isNaN(lastAt.getTime()) ? lastAt : null,
      playTime,
      // PlayStation Network
      level: num(st("trophy_level")),
      levelProgress: num(st("level_progress")),
      trophies: ["platinum", "gold", "silver", "bronze"].map((k) => [k, num(st(k))]),
      plus: ok(st("plus")) ? st("plus").state === "on" : null,
      status: fmt(st("online_status")) || fmt(st("status")),
      // Xbox
      gamerscore: num(st("gamerscore")),
      party: num(st("in_party")),
      friends: num(st("friends")),
      gamePass: ok(st("game_pass")) ? st("game_pass").state === "on" : null,
      achievements: state === "playing" ? npa.achievements || null : null,
      progress: state === "playing" && npa.progress ? Number.parseFloat(npa.progress) : null,
      genre: state === "playing" ? npa.genres || null : null,
      storage: total != null && free != null && total > 0 ? { free, total, unit: st("total_storage").attributes.unit_of_measurement } : null,
      // Nintendo Switch
      used: num(st("playing_time")),
      left: num(st("time_remaining")),
      max: num(st("max_screentime")),
      extended: num(st("time_extended")),
      suspendId: ok(st("suspend")) ? e.suspend : null,
      suspended: st("suspend")?.state === "on",
      mode: fmt(st("timer_mode")),
      bedtime: ok(st("bedtime_alarm")) ? [st("bedtime_alarm").state, ok(st("bedtime_end")) ? st("bedtime_end").state : null] : null,
      // Controls
      powerId,
      powerOn: power?.state === "on",
      mediaId: ok(media) ? media.entity_id : null,
      device: e.device,
    };
  }

  // Today's play time (minutes), counted from the history since midnight (PlayStation, Xbox): asked again when the
  // day, the entities or the state change, or after CC_PLAYED_TTL; while it plays, the minutes since then are added.
  _playedToday(e, platform, state) {
    const h = this._hass;
    if (typeof h.callWS !== "function") return null;
    const ids = Object.fromEntries(["media", "activity"].filter((r) => e[r]).map((r) => [r, e[r]]));
    if (!Object.keys(ids).length) return null;
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    const key = `${Object.values(ids).join(",")}|${day.getTime()}`;
    const now = Date.now();
    const p = this._played;
    if (!p || p.key !== key || p.state !== state || now - p.at > CC_PLAYED_TTL) this._askPlayed(ids, platform, key, state, day.getTime(), now);
    const q = this._played;
    if (q.mins == null) return null;
    return q.mins + (state === "playing" && q.done ? Math.max(0, now - q.at) / 60000 : 0);
  }

  _askPlayed(ids, platform, key, state, from, now) {
    const prev = this._played?.key === key ? this._played.mins : null;
    const ask = (this._played = { key, state, at: now, mins: prev, done: false });
    this._hass
      .callWS({
        type: "history/history_during_period",
        start_time: new Date(from).toISOString(),
        end_time: new Date(now).toISOString(),
        entity_ids: Object.values(ids),
        include_start_time_state: true,
        significant_changes_only: false,
        minimal_response: false,
        // The Xbox tells a game from an app by its attributes.
        no_attributes: platform !== "xbox",
      })
      .then((hist) => {
        if (this._played !== ask) return;
        ask.mins = ccPlayedMinutes(hist, ids, platform, from, now);
        ask.done = true;
        this._render();
      })
      .catch(() => {});
  }

  _dark() {
    return !!this._hass.themes?.darkMode;
  }

  // The banner's night: forced by `illustration_theme`, else Home Assistant's dark theme alone (a light theme keeps the
  // day picture after sunset).
  _night() {
    const theme = this._config.illustration_theme;
    if (theme === "night" || theme === "day") return theme === "night";
    return this._dark();
  }

  // Unique per card: the SVG ids of several cards on one page never clash.
  _id() {
    this._uid ||= Math.random().toString(36).slice(2, 8);
    return this._uid;
  }

  _animate() {
    if (this._config.animations === false) return false;
    try {
      return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return true;
    }
  }

  // The status: the state's name; a Switch online says how much time is left.
  _status(m) {
    if (m.platform === "switch" && m.state === "online") return m.max != null && m.max < 0 ? this._t("no_limit") : m.left != null ? this._t("left", { t: this._dur(m.left) }) : this._t("st_online");
    return this._t(`st_${m.state}`);
  }

  // The illustrated header: the badge (the platform's icon, in the state's colour), the title and `sub` on the wall at
  // the left, the TV and the console at the right, a 10 px floor strip edge to edge.
  _banner(m, sub, night, pill = "") {
    const c = this._config;
    const nav = c.navigation_path;
    // The mini card's expand / collapse button sits at the banner's top right corner: the console steps aside.
    const dx = this._addZoom && c.zoom ? 22 : 0;
    const room = m.none ? ccRoom({ night, state: "standby", model: "ps5", platform: "playstation", uid: this._id(), dx }) : ccRoom({ night, state: m.state, model: m.model, platform: m.platform, cover: m.cover, uid: this._id(), animate: this._animate(), dx });
    const chip = pill ? `<span class="bpill" title="${rcEsc(m.raw || pill)}" aria-label="${rcEsc(pill)}"><span class="bdot"></span><span class="bpt">${rcEsc(pill)}</span></span>` : "";
    return `
      <div class="banner${night ? " night" : ""}">
        <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}${m.sub ? ` title="${rcEsc(m.sub)}"` : ""}>
          <div class="badge"><ha-icon icon="${CC_ICONS[m.platform] || "mdi:gamepad-variant"}"></ha-icon></div>
          <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div>${chip}</div>${sub}</div>
        </div>
        <svg class="room" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax slice" role="img" aria-label="${rcEsc([m.name, pill, m.title].filter(Boolean).join(" · "))}">${room}</svg>
        <div class="ground"></div>
      </div>`;
  }

  // The status pill's place, on the banner and on the classic header (see ccPlacePill).
  _fitPill() {
    for (const row of this.shadowRoot?.querySelectorAll?.(".trow") || []) {
      const banner = row.closest(".banner");
      ccPlacePill(banner || row.closest(".head"), row, banner?.querySelector(".ground"));
    }
  }

  connectedCallback() {
    super.connectedCallback?.();
    // A new width: the status pill is fitted again (in the next frame, and only for a new width).
    if (typeof ResizeObserver !== "function") return;
    this._resize ??= new ResizeObserver((entries) => {
      const w = Math.round(entries.at(-1).contentRect.width);
      if (w === this._fitWidth) return;
      this._fitWidth = w;
      cancelAnimationFrame(this._fitFrame);
      this._fitFrame = requestAnimationFrame(() => this._fitPill());
    });
    this._resize.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this._resize?.disconnect();
    this._fitWidth = undefined;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
  }

  // What is on screen: the game and its cover (PlayStation, Xbox), or the screen time of the day (Switch).
  _now(m) {
    if (m.platform === "switch") {
      if (m.used == null && m.left == null) return "";
      const unlimited = m.max != null && m.max < 0;
      const limit = !unlimited && m.max != null ? m.max : m.used != null && m.left != null ? m.used + m.left : null;
      const share = limit ? Math.min(1, Math.max(0, (m.used ?? 0) / limit)) : 0;
      const L = 2 * Math.PI * 30;
      const ring = `<svg class="ring" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="30" fill="none" stroke="var(--cc-track)" stroke-width="7"/>${limit ? `<circle cx="36" cy="36" r="30" fill="none" stroke="var(--c)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(L * share).toFixed(1)} 999" transform="rotate(-90 36 36)"/>` : ""}</svg>`;
      const big = m.state === "time_up" ? this._t("st_time_up") : unlimited ? this._t("no_limit") : m.left != null ? this._t("left", { t: this._dur(m.left) }) : "";
      const used = m.used != null ? `${this._dur(m.used)}${limit ? ` ${this._t("of_limit", { t: this._dur(limit) })}` : ""}` : "";
      return `<button class="np sw" data-k="now" title="${rcEsc(this._t("screen_today"))}">${ring}<span class="nt"><span class="nl">${rcEsc(this._t("screen_today"))}</span><span class="nn">${rcEsc(used || "—")}</span><span class="ns">${rcEsc(big)}</span></span></button>`;
    }
    if (m.state !== "playing" && !m.app) {
      const line = m.state === "offline" || m.state === "standby" ? (m.lastAt ? this._t("last_seen", { d: this._ago(m.lastAt) }) : "") : this._t("home_screen");
      return `<button class="np idle" data-k="now"><span class="nt"><span class="nl">${rcEsc(this._t("not_playing"))}</span>${line ? `<span class="ns">${rcEsc(line)}</span>` : ""}</span></button>`;
    }
    const meta = m.app ? this._t("in_app") : [m.since != null ? this._t("since", { d: this._dur(m.since) }) : null, m.genre].filter(Boolean).join(" · ");
    const art = m.cover
      ? `<img class="cv" src="${rcEsc(m.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer"/>`
      : `<span class="cv art" aria-hidden="true"><ha-icon icon="${CC_ICONS[m.platform]}"></ha-icon></span>`;
    const bar =
      m.progress != null
        ? `<span class="pr"><span class="pbar"><span style="width:${Math.min(100, Math.max(0, m.progress))}%"></span></span><span class="pv">${rcEsc(m.achievements ? this._t("achievements", { n: m.achievements }) : `${this._fmt(m.progress)} %`)}</span></span>`
        : "";
    return `<button class="np" data-k="now" title="${rcEsc(m.title || "")}">${art}<span class="nt"><span class="nl">${rcEsc(this._t(m.app ? "in_app" : "now_playing"))}</span><span class="nn">${rcEsc(m.title || this._t("st_playing"))}</span>${meta && !m.app ? `<span class="ns">${rcEsc(meta)}</span>` : ""}${bar}</span></button>`;
  }

  // Up to four tiles, the ones this platform reports.
  _tileList(m) {
    const yes = (v) => (v == null ? null : [this._t(v ? "sub_on" : "sub_off"), "", null, v]);
    const played = ["hourglass", "t_play_time", m.playTime != null ? [this._dur(m.playTime), ""] : null];
    const all = {
      playstation: [
        ["trophy", "t_level", m.level != null ? [this._fmt(m.level), "", m.levelProgress != null ? this._t("next_level", { n: this._fmt(m.levelProgress) }) : null] : null],
        ["plus", "t_plus", yes(m.plus)],
      ],
      xbox: [
        ["score", "t_gamerscore", m.gamerscore != null ? [this._fmt(m.gamerscore), ""] : null],
        ["friends", "t_party", m.party != null && m.party > 0 ? [this._fmt(m.party), ""] : null],
        ["friends", "t_friends", m.friends != null ? [this._fmt(m.friends), ""] : null],
        ["storage", "t_storage", m.storage ? [this._bytes(m.storage.free, m.storage.unit), "", this._t("of_limit", { t: this._bytes(m.storage.total, m.storage.unit) })] : null],
        ["plus", "t_game_pass", yes(m.gamePass)],
        ["status", "t_status", m.status ? [m.status, ""] : null],
      ],
      switch: [
        ["moon", "t_bedtime", m.bedtime ? [m.bedtime.map((t) => (t ? String(t).slice(0, 5) : "")).filter(Boolean).join(" → "), ""] : null],
        ["status", "t_restriction", m.mode ? [m.mode, ""] : null],
        ["lock", "t_software", m.suspendId ? [this._t(m.suspended ? "sw_suspended" : "sw_allowed"), "", null, !m.suspended] : null],
        ["bonus", "t_bonus", m.extended != null && m.extended > 0 ? [`+${this._dur(m.extended)}`, ""] : null],
      ],
    }[m.platform];
    return (all ? [played, ...all] : []).filter((t) => t[2]).slice(0, 4);
  }

  _tile([icon, label, [value, unit, sub, good]]) {
    const cls = good === false ? " bad" : good === true ? " good" : "";
    return `<div class="xt${cls}"><span class="xh">${ccIcon(CC_SVG[icon])}<span class="xl">${rcEsc(this._t(label))}</span></span><span class="xv">${rcEsc(value)}${unit ? `<small>${rcEsc(unit)}</small>` : ""}</span>${sub ? `<span class="xs">${rcEsc(sub)}</span>` : ""}</div>`;
  }

  // The account's trophies, by grade (PlayStation).
  _trophies(m) {
    if (this._config.show_trophies === false || m.platform !== "playstation" || !m.trophies.some(([, n]) => n != null)) return "";
    return `<div class="tro">${m.trophies
      .map(([k, n]) => `<span class="tg tg-${k}" title="${rcEsc(this._t(k))}">${ccIcon(CC_SVG.trophy)}<b>${n == null ? "—" : rcEsc(this._fmt(n))}</b><small>${rcEsc(this._t(k))}</small></span>`)
      .join("")}</div>`;
  }

  _draw(m) {
    const c = this._config;
    const dark = this._dark();
    const status = m.none ? "" : this._status(m);
    const tiles = m.none ? [] : this._tileList(m);
    const banner = c.illustration !== false;
    const night = banner && this._night();
    const now = m.none ? "" : this._now(m);
    // Redrawn only when something shown changes (the session's minutes included): a reading that is the same on
    // screen must not rebuild the card (and restart the TV's light).
    const parts = [m.none, m.raw, m.name, m.sub, status, now, tiles, this._trophies(m), m.state, m.model, m.cover, m.powerId, m.powerOn, m.mediaId, m.suspendId, m.suspended, dark, banner, night];
    if (!this._changed(parts)) return;
    const head = banner
      ? this._banner(m, m.sub ? `<div class="subt">${rcEsc(m.sub)}</div>` : "", night, status)
      : `
      <div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
        <div class="badge"><ha-icon icon="${CC_ICONS[m.platform] || "mdi:gamepad-variant"}"></ha-icon></div>
        <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div>${m.none ? "" : `<span class="pill" title="${rcEsc(m.raw || status)}" aria-label="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`}</div>${m.sub ? `<div class="subt" title="${rcEsc(m.sub)}">${rcEsc(m.sub)}</div>` : ""}</div>
      </div>`;
    // No console: say so, rather than draw one.
    if (m.none) {
      this._paint("standby", `${head}<div class="none">${rcEsc(this._t("no_console"))}</div>`, "");
      this._fitPill();
      return;
    }
    this._paint(`${m.state} pf-${m.platform}`, head + now, tiles.map((t) => this._tile(t)).join(""));
    this._fitPill();
  }

  _afterGrid() {
    const m = this._items;
    if (!m || m.none) return "";
    const tro = this._trophies(m);
    if (this._config.show_controls === false || m.state === "offline") return tro;
    const btn = (k, icon, label, primary = false, pressed = null) =>
      `<button class="${primary ? "pb" : "gb"} act-${k}" data-k="${k}"${pressed == null ? "" : ` aria-pressed="${pressed}"`}>${ccIcon(CC_SVG[icon])}<span>${rcEsc(label)}</span></button>`;
    const on = CC_ACTIVE.includes(m.state);
    const out = [];
    if (m.platform === "switch") {
      if (m.device) out.push(btn("bonus", "bonus", this._t("bonus", { n: this._bonus() }), true));
      if (m.suspendId) out.push(btn("suspend", m.suspended ? "play" : "pause", this._t(m.suspended ? "resume" : "suspend"), false, m.suspended));
    } else {
      if (m.powerId) out.push(btn("power", "power", this._t(m.powerOn || on ? "turn_off" : "turn_on"), true));
      if (m.platform === "xbox" && m.mediaId && on) out.push(btn("home", "home", this._t("home")));
    }
    return `${tro}${out.length ? `<div class="ctl">${out.join("")}</div>` : ""}`;
  }

  // The bonus button's minutes: 5 to 30, as the integration accepts.
  _bonus() {
    return Math.min(30, Math.max(5, Math.round(Number(this._config.bonus_minutes) || 15)));
  }

  _bindAfter(root) {
    const m = this._items;
    const h = this._hass;
    if (!m || m.none) return;
    const on = (sel, fn) =>
      root.querySelector(sel)?.addEventListener("click", (ev) => {
        ev.stopPropagation();
        fn(ev);
      });
    on(".np", () => rcMoreInfo(this, m.mediaId || m.ids.activity || m.ids.time_remaining || m.id));
    on(".act-power", () => {
      const domain = m.powerId.split(".")[0];
      const off = m.powerOn || CC_ACTIVE.includes(m.state);
      rcCall(h, domain, off ? "turn_off" : "turn_on", { entity_id: m.powerId });
    });
    on(".act-home", () => rcCall(h, "media_player", "play_media", { entity_id: m.mediaId, media_content_id: "Home", media_content_type: "" }));
    on(".act-bonus", () => rcCall(h, "nintendo_parental_controls", "add_bonus_time", { device_id: m.device, bonus_time: this._bonus() }));
    on(".act-suspend", () => rcCall(h, "switch", m.suspended ? "turn_off" : "turn_on", { entity_id: m.suspendId }));
  }

  static styles = `
    :host { --cc-ps: #2f6fe0; --cc-xbox: #2ea043; --cc-switch: #e5383b; --cc-track: rgba(127,127,127,.18); }
    ha-card.pf-playstation { --p: var(--cc-ps); }
    ha-card.pf-xbox { --p: var(--cc-xbox); }
    ha-card.pf-switch { --p: var(--cc-switch); }
    ha-card.lvl-playing, ha-card.lvl-online { --c: var(--p, var(--cc-ps)); }
    ha-card.lvl-standby, ha-card.lvl-offline { --c: var(--rc-idle); }
    ha-card.lvl-suspended { --c: var(--rc-warn); }
    ha-card.lvl-time_up { --c: var(--rc-alert); }
    .tt { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; }
    .tt .title { flex: none; }
    .subt { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    :host([hide-title]) .head .tt { visibility: hidden; }
    /* What is on screen: the cover, the game and the session; the Switch's ring of screen time. */
    .np { all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; gap: 12px; width: 100%; margin-top: 12px; padding: 10px;
          border-radius: 14px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .np:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .np.idle { padding: 10px 12px; }
    .cv { flex: none; width: 56px; height: 74px; border-radius: 8px; object-fit: cover; background: color-mix(in srgb, var(--c) 18%, #1c1f26);
          box-shadow: 0 4px 12px rgba(0,0,0,.25); }
    .cv.art { display: grid; place-items: center; color: #fff; background: color-mix(in srgb, var(--c) 70%, #101420); }
    .cv.art ha-icon { --mdc-icon-size: 28px; opacity: .9; }
    .nt { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
    .nl { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--secondary-text-color); }
    .nn { font-size: 17px; font-weight: 600; line-height: 1.2; color: var(--primary-text-color); overflow: hidden; text-overflow: ellipsis;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .ns { font-size: 13px; color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .idle .ns { color: var(--secondary-text-color); }
    .pr { display: flex; align-items: center; gap: 8px; margin-top: 4px; min-width: 0; }
    .pbar { flex: 1; height: 4px; border-radius: 2px; background: var(--cc-track); overflow: hidden; }
    .pbar span { display: block; height: 100%; border-radius: 2px; background: var(--c); }
    .pv { flex: none; font-size: 12px; font-weight: 500; color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
    .np.sw { gap: 14px; }
    .ring { flex: none; width: 72px; height: 72px; }
    .sw .nn { font-size: 20px; }
    .grid { margin-top: 10px; gap: 8px; }
    .xt { min-width: 0; border-radius: 12px; padding: 9px 11px; display: flex; flex-direction: column; gap: 5px;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .xh { display: flex; align-items: center; gap: 6px; min-width: 0; color: var(--c); }
    .xh svg { flex: none; width: 15px; height: 15px; }
    .xl { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .xv { font-size: 17px; font-weight: 500; line-height: 1.15; color: var(--primary-text-color); overflow-wrap: anywhere; }
    .xv small { font-size: 12px; font-weight: 400; color: var(--secondary-text-color); margin-left: 3px; }
    .xs { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .xt.good .xv { color: color-mix(in srgb, var(--rc-ok) 55%, var(--primary-text-color, #212121)); }
    .xt.bad .xv { color: color-mix(in srgb, var(--rc-warn) 55%, var(--primary-text-color, #212121)); }
    /* The trophies by grade: four columns, a hairline between them. */
    .tro { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 8px; padding: 8px 0; border-radius: 12px;
           background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .tg { display: flex; flex-direction: column; align-items: center; gap: 1px; min-width: 0; }
    .tg + .tg { border-left: 1px solid var(--divider-color, rgba(127,127,127,.2)); }
    .tg svg { width: 16px; height: 16px; }
    .tg b { font-size: 15px; font-weight: 600; color: var(--primary-text-color); }
    .tg small { font-size: 11px; color: var(--secondary-text-color); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tg-platinum svg { color: #8ea3c8; } .tg-gold svg { color: #d9a21b; } .tg-silver svg { color: #9aa1ad; } .tg-bronze svg { color: #c07a45; }
    .ctl { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 10px; }
    .pb, .gb { all: unset; box-sizing: border-box; cursor: pointer; }
    .pb { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font-size: 14px; font-weight: 500;
          color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--c) 15%, transparent); }
    .pb:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
    .gb { display: inline-flex; align-items: center; gap: 7px; min-height: 40px; padding: 0 14px; border-radius: 999px; font-size: 13px; font-weight: 500;
          color: var(--primary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.1)); }
    .gb[aria-pressed="true"] { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--c) 16%, transparent); }
    .pb svg, .gb svg { width: 17px; height: 17px; }
    .pb:focus-visible, .gb:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .none { margin-top: 10px; padding: 12px; border-radius: 12px; font-size: 13px; color: var(--secondary-text-color);
            background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    @container (max-width: 300px) {
      .grid { grid-template-columns: minmax(0, 1fr); }
      .tg small { display: none; }
      .cv { width: 44px; height: 58px; }
    }
    /* Illustrated header (banner): 90 px, edge to edge, the title on the living room's wall, the TV and the console at
       the right, a 10 px floor strip at the bottom. The badge's icon is in the state's colour, grey when idle. */
    .banner { position: relative; display: flex; height: 90px; margin: -12px -12px 0; overflow: hidden; background: linear-gradient(#eef2f8, #dfe6f0 80px);
              --bt: #0d2a45; --bs: #3b5b78; --ic: color-mix(in srgb, var(--c) 85%, #10283f); --sw: min(200px, 56%); }
    .banner.night { background: linear-gradient(#262b38, #1d212b 80px); --bt: #fff; --bs: rgba(255,255,255,.78); --ic: color-mix(in srgb, var(--c) 72%, #fff); }
    .lvl-standby .banner, .lvl-offline .banner { --ic: #6b7680; }
    .lvl-standby .banner.night, .lvl-offline .banner.night { --ic: #a7b0b8; }
    .banner .head { position: relative; z-index: 1; flex: 1; min-width: 0; height: 80px; box-sizing: border-box;
                    padding: 0 calc(var(--sw) + 4px) 0 14px; }
    .banner .badge { position: relative; color: var(--ic); background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px rgba(13,42,69,.12); }
    .banner.night .badge { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
    .banner .title { color: var(--bt); }
    .banner .subt { color: var(--bs); font-size: 13px; }
    .banner .room { position: absolute; right: 0; bottom: 10px; width: var(--sw); height: calc(80px * var(--sk, 1)); }
    .banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: #b49a82; box-shadow: inset 0 2px 0 #c9b29c; }
    .banner.night .ground { background: #2a2420; box-shadow: inset 0 2px 0 #3d342d; }
    /* The mini card's expand / collapse button: 24 px, frosted, 5 px from the banner's top right corner. */
    .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; width: 24px; height: 24px; margin: 0; color: #33506b;
                    background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
    .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
    .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
    .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
    .banner .head { flex-wrap: nowrap; }
    .banner .head::after { content: none; }
    .banner .tt { min-width: 0; flex: 1 1 auto; }
    /* Status pill right after the title, in the state's colour on a frosted tint, only when the whole title and its
       whole label fit there (measured by the card, see ccPlacePill); otherwise on its own line under the subtitle;
       when even that cuts it or leaves the banner, and on a card of 200 px or less, its dot alone. */
    .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .trow > .title { flex: 0 1 auto; min-width: 0; }
    .trow > .bpill, .trow > .pill { flex: none; max-width: none; }
    :host([hide-title]) .trow .title { visibility: hidden; }
    .head:has(.trow) { flex-wrap: nowrap; }
    .head:has(.trow)::after { content: none; }
    .bpill { display: inline-flex; align-items: center; gap: 4px; min-width: 0; box-sizing: border-box; overflow: hidden;
             white-space: nowrap; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; line-height: 16px;
             background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
    .banner.night .bpill { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
    .bdot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex: none; }
    .bpt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    [data-wrap] .trow { display: contents; }
    [data-wrap] .trow > .bpill, [data-wrap] .trow > .pill { order: 9; align-self: flex-start; max-width: 100%; margin-top: 3px; }
    .banner[data-wrap] .trow > .bpill { max-width: calc(100cqw - 80px); }
    [data-wrap] .subt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    [data-dot] .bpill { padding: 0; background: none; }
    [data-dot] .bpt, [data-dot] .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    [data-dot] .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    [data-dot] .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    @container (max-width: 200px) {
      .bpill { padding: 0; background: none; }
      .bpt, .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
      .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
      .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    }
    /* The mini card: the banner alone, its readings as chips on the wall. */
    ha-card.bn { padding: 0; }
    ha-card.bn > .banner { margin: 0; --sw: min(200px, 46%); }
    /* Narrower cards: the living room corner is drawn smaller (75 %, 62 %, then 50 % of its height, its left part
       cropped), so that the text keeps room for the whole title and the pill's label; the console stays whole. */
    @container (max-width: 420px) { .banner, ha-card.bn > .banner { --sw: 150px; --sk: .75; } }
    @container (max-width: 340px) { .banner, ha-card.bn > .banner { --sw: 112px; --sk: .62; } }
    @container (max-width: 260px) { .banner, ha-card.bn > .banner { --sw: 70px; --sk: .5; } }
    /* The chips that do not fit wrap to a second line, hidden: never a chip cut to "R…". */
    .banner .rs { display: flex; flex-wrap: wrap; gap: 4px; height: 20px; margin: 3px 0 0 -2px; min-width: 0; overflow: hidden; }
    .banner .r { flex: none; line-height: 20px; padding: 0 7px; color: var(--bt); background: rgba(255,255,255,.62); }
    .banner .r.pill { color: color-mix(in srgb, var(--c) 60%, #10283f); background: rgba(255,255,255,.78); }
    .banner.night .r { background: rgba(10,20,40,.4); }
    .banner.night .r.pill { color: color-mix(in srgb, var(--c) 45%, #fff); background: rgba(10,20,40,.55); }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const ccSchema = (booleans) => (lang) => [
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

const CC_HELPERS = ["entity", "title", "power", "play_time", "bonus_minutes", "zoom", "entities", "language"];

const ConsoleCardEditor = rcEditor({
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

// ── Mini card ────────────────────────────────────────────────────────────────
// The console on two lines: the platform's badge, the title and the state, then the game and the session (or the
// Switch's time left) as chips; the zoom button opens the full card in place.
class ConsoleMiniCard extends rcMini(
  ConsoleCard,
  "console-mini-card",
  `
    .r { --t: var(--c); }
    .r.dim { --t: var(--rc-idle); }
  `,
) {
  getCardSize() {
    return this._zoomed ? super.getCardSize() : 1;
  }

  // The chips: the game and how long it has been played (PlayStation, Xbox), the screen time (Switch).
  _chips(m) {
    if (m.platform === "switch") return [m.used != null ? this._dur(m.used) : null, m.extended ? `+${this._dur(m.extended)}` : null];
    if (m.state === "playing") return [m.title, m.since != null ? this._dur(m.since) : null];
    if (m.app) return [m.title];
    return [m.state === "standby" || m.state === "offline" ? (m.lastAt ? this._t("last_seen", { d: this._ago(m.lastAt) }) : null) : this._t("home_screen")];
  }

  _drawMini(m) {
    const banner = this._config.illustration !== false;
    const night = banner && this._night();
    const status = m.none ? "" : this._status(m);
    const chips = m.none ? [] : this._chips(m).filter(Boolean);
    if (!this._changed(["mini", m.none, m.state, m.name, m.model, m.cover, status, chips, banner, night])) return;
    const chip = (text, dim) => `<button class="r pill${dim ? " dim" : ""}" data-id="${rcEsc(m.mediaId || m.id || "")}" title="${rcEsc(text)}"><span>${rcEsc(text)}</span></button>`;
    const level = m.none ? "standby" : `${m.state} pf-${m.platform}`;
    if (banner) {
      const c = this._config;
      const rest = chips.map((t, i) => chip(t, i > 0)).join("");
      this.shadowRoot.innerHTML = `<style>${RC_BASE_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level} bn">${this._banner(m, rest ? `<div class="rs">${rest}</div>` : "", night, status)}</ha-card>`;
      const root = this.shadowRoot;
      if (c.navigation_path) rcBindNav(root.querySelector(".head"), c.navigation_path);
      for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
      this._fitPill();
      return;
    }
    this._paintMini({ level, icon: CC_ICONS[m.platform] || "mdi:gamepad-variant", status, chips: chips.map((t, i) => chip(t, i > 0)).join("") });
    const title = this.shadowRoot.querySelector(".mini .title");
    if (title) title.textContent = m.name;
  }
}

const ConsoleMiniCardEditor = rcEditor({
  card: ConsoleMiniCard,
  helpers: CC_HELPERS,
  schema: ccSchema(["show_title", "illustration", "animations", "show_trophies", "show_play_time", "show_controls", "zoom"]),
});

rcRegister(
  ConsoleMiniCard,
  ConsoleMiniCardEditor,
  "Console Mini Card",
  "The game console on two lines: its state, the game and the session or the Switch's screen time, with a zoom to the full card",
);
