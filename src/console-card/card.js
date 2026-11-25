// ── Card ─────────────────────────────────────────────────────────────────────
import { CC_ACTIVE, CC_ICONS } from "./core.js";
import { CC_LIMIT_STEP, CC_PLAYED_TTL, CC_SVG, ccIcon, ccLimitStep, ccPlacePill, ccRange, ccRoom } from "./banner.js";

export class ConsoleCard extends RcCard {
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
      maxId: ok(st("max_screentime")) ? e.max_screentime : null,
      maxRange: ok(st("max_screentime")) ? ccRange(st("max_screentime").attributes) : null,
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
    // Off the page: the panel closes, and a limit not sent yet is dropped.
    clearTimeout(this._stTimer);
    this._stVal = this._stId = null;
    if (this._stOpen) {
      this._stOpen = false;
      document.removeEventListener("pointerdown", this._stAway, true);
    }
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
  }

  // What is on screen: the game and its cover (PlayStation, Xbox), or the screen time of the day (Switch).
  _now(m) {
    if (m.platform === "switch") {
      if (this._stOpen && this._stCan(m)) return this._stPanel(m);
      if (m.used == null && m.left == null) return "";
      const unlimited = m.max != null && m.max < 0;
      const limit = !unlimited && m.max != null ? m.max : m.used != null && m.left != null ? m.used + m.left : null;
      const share = limit ? Math.min(1, Math.max(0, (m.used ?? 0) / limit)) : 0;
      const L = 2 * Math.PI * 30;
      const ring = `<svg class="ring" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="30" fill="none" stroke="var(--cc-track)" stroke-width="7"/>${limit ? `<circle cx="36" cy="36" r="30" fill="none" stroke="var(--c)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(L * share).toFixed(1)} 999" transform="rotate(-90 36 36)"/>` : ""}</svg>`;
      const big = m.state === "time_up" ? this._t("st_time_up") : unlimited ? this._t("no_limit") : m.left != null ? this._t("left", { t: this._dur(m.left) }) : "";
      const used = m.used != null ? `${this._dur(m.used)}${limit ? ` ${this._t("of_limit", { t: this._dur(limit) })}` : ""}` : "";
      return `<button class="np sw" data-k="now" title="${rcEsc(this._t("screen_today"))}"${this._stCan(m) ? ' aria-expanded="false"' : ""}>${ring}<span class="nt"><span class="nl">${rcEsc(this._t("screen_today"))}</span><span class="nn">${rcEsc(used || "—")}</span><span class="ns">${rcEsc(big)}</span></span></button>`;
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
    const parts = [m.none, m.raw, m.name, m.sub, status, now, tiles, this._trophies(m), m.state, m.model, m.cover, m.powerId, m.powerOn, m.mediaId, m.suspendId, m.suspended, dark, banner, night, this._stOpen, this._stVal, m.maxRange, this._bonusList()];
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

  // The bonus choices (`bonus_minutes`: a number or a list), each 5 to 30 as the integration accepts; the first one is
  // the bonus button's.
  _bonusList() {
    const v = this._config.bonus_minutes;
    const list = (Array.isArray(v) ? v : [v]).map((n) => Math.min(30, Math.max(5, Math.round(Number(n) || 15))));
    return [...new Set(list)];
  }

  _bonus() {
    return this._bonusList()[0];
  }

  // The screen time panel (the ring tapped): today's limit, when the Switch has its number, and the bonus choices
  // when there are several. Nothing to set: the ring opens the details, as before.
  _stCan(m) {
    return m.platform === "switch" && !!(m.maxId || (m.device && this._bonusList().length > 1));
  }

  _stPanel(m) {
    const ib = (k, icon, label) => `<button class="ib st-${k}" data-k="st-${k}" aria-label="${rcEsc(label)}" title="${rcEsc(label)}">${ccIcon(icon)}</button>`;
    const head = `<div class="sth"><span class="nl">${rcEsc(this._t(m.maxId ? "limit_today" : "t_bonus"))}</span><span class="sta">${ib("info", CC_SVG.info, this._t("details"))}${ib("close", CC_SVG.close, this._t("close"))}</span></div>`;
    let limit = "";
    if (m.maxId) {
      const v = this._stVal ?? m.max;
      const r = m.maxRange;
      const free = v != null && v < 0;
      const step = (d) => `<button class="stb st-${d > 0 ? "plus" : "minus"}" data-k="st-${d > 0 ? "plus" : "minus"}" aria-label="${rcEsc(`${d > 0 ? "+" : "−"}${this._dur(CC_LIMIT_STEP)}`)}"${ccLimitStep(v, d, r) == null ? ' aria-disabled="true"' : ""}>${ccIcon(d > 0 ? CC_SVG.plus : CC_SVG.minus)}</button>`;
      const none = !free && r.min < 0 ? `<button class="stn st-none" data-k="st-none">${rcEsc(this._t("no_limit"))}</button>` : "";
      limit = `<div class="sts">${step(-1)}<span class="stv" aria-live="polite">${rcEsc(free ? this._t("no_limit") : v == null ? "—" : this._dur(v))}</span>${step(1)}</div>${none}`;
    }
    const list = m.device ? this._bonusList() : [];
    const bonus = list.length && (m.maxId ? list.length > 1 || this._config.show_controls === false : true)
      ? `${m.maxId ? `<span class="nl">${rcEsc(this._t("t_bonus"))}</span>` : ""}<div class="stc">${list.map((n) => `<button class="chip st-bonus" data-k="st-b${n}" data-n="${n}">${rcEsc(this._t("bonus", { n }))}</button>`).join("")}</div>`
      : "";
    return `<div class="np stp" role="group" aria-label="${rcEsc(this._t("screen_today"))}">${head}${limit}${bonus}</div>`;
  }

  // Opens or closes the panel; open, a press outside the card closes it.
  _stToggle(open) {
    if (!!this._stOpen === open) return;
    this._stOpen = open;
    if (open) {
      this._stAway ??= (ev) => {
        if (!ev.composedPath().includes(this)) this._stToggle(false);
      };
      document.addEventListener("pointerdown", this._stAway, true);
    } else {
      document.removeEventListener("pointerdown", this._stAway, true);
      this._stFlush();
    }
    this._render();
  }

  // Today's limit, stepped: the taps add up and the value goes out once they stop.
  _stStep(m, d) {
    const v = ccLimitStep(this._stVal ?? m.max, d, m.maxRange);
    if (v == null) return;
    this._stSet(m, v, 700);
  }

  _stSet(m, v, wait) {
    this._stVal = v;
    this._stId = m.maxId;
    clearTimeout(this._stTimer);
    this._stTimer = setTimeout(() => this._stFlush(), wait);
    this._render();
  }

  _stFlush() {
    clearTimeout(this._stTimer);
    if (this._stVal == null || !this._stId) return;
    const value = this._stVal;
    rcCall(this._hass, "number", "set_value", { entity_id: this._stId, value });
    // Shown until the Switch reports it (or a few seconds, should it refuse).
    clearTimeout(this._stHold);
    this._stHold = setTimeout(() => {
      this._stVal = null;
      this._render();
    }, 5000);
    this._stId = null;
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
    const info = () => rcMoreInfo(this, m.mediaId || m.ids.activity || m.ids.time_remaining || m.id);
    on(".np", () => (this._stCan(m) ? this._stToggle(true) : info()));
    on(".st-info", () => {
      this._stToggle(false);
      info();
    });
    on(".st-close", () => this._stToggle(false));
    on(".st-minus", () => this._stStep(m, -1));
    on(".st-plus", () => this._stStep(m, 1));
    on(".st-none", () => this._stSet(m, -1, 0));
    for (const el of root.querySelectorAll(".st-bonus"))
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        rcCall(h, "nintendo_parental_controls", "add_bonus_time", { device_id: m.device, bonus_time: Number(el.dataset.n) });
      });
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
    /* The screen time panel: today's limit, stepped, and the bonus choices. */
    .np.stp { cursor: default; flex-direction: column; align-items: stretch; gap: 10px; padding: 10px 12px 12px; }
    .sth { display: flex; align-items: center; justify-content: space-between; min-height: 28px; }
    .sta { display: flex; gap: 2px; margin-right: -4px; }
    .ib, .stb, .stn, .chip { all: unset; box-sizing: border-box; cursor: pointer; }
    .ib { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; color: var(--secondary-text-color); }
    .ib:hover { background: var(--cc-track); }
    .ib svg { width: 16px; height: 16px; }
    .sts { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .stb { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; color: color-mix(in srgb, var(--c) 70%, var(--primary-text-color, #212121));
           background: color-mix(in srgb, var(--c) 14%, transparent); }
    .stb:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
    .stb[aria-disabled="true"] { opacity: .35; cursor: default; background: color-mix(in srgb, var(--c) 14%, transparent); }
    .stb svg { width: 18px; height: 18px; }
    .stv { font-size: 22px; font-weight: 600; color: var(--primary-text-color); font-variant-numeric: tabular-nums; }
    .stn { align-self: center; margin-top: -4px; font-size: 12px; color: var(--secondary-text-color); text-decoration: underline; text-underline-offset: 2px; }
    .stc { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { display: inline-flex; align-items: center; min-height: 34px; padding: 0 14px; border-radius: 999px; font-size: 13px; font-weight: 600;
            color: color-mix(in srgb, var(--c) 70%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--c) 14%, transparent); }
    .chip:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
    .ib:focus-visible, .stb:focus-visible, .stn:focus-visible, .chip:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
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
