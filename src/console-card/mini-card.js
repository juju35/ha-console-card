// ── Mini card ────────────────────────────────────────────────────────────────
// The console on two lines: the platform's badge, the title and the state, then the game and the session (or the
// Switch's time left) as chips; the zoom button opens the full card in place.
import { CC_ICONS } from "./core.js";
import { ConsoleCard } from "./card.js";
import { CC_HELPERS, ccSchema } from "./editor.js";

export class ConsoleMiniCard extends rcMini(
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

export const ConsoleMiniCardEditor = rcEditor({
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
