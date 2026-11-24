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
import { CC_ACCENTS, CC_ACTIVE, CC_LOOP } from "./core.js";

export const ccPlacePill = (head, row, ground) => {
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
export const ccConsole = (model, { acc, on, uid, night }) => {
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
export const ccScreen = ({ state, acc, cover, uid, moving, x, y, w, h }) => {
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

export const ccRoom = ({ night, state, model, platform, cover, uid, animate, dx = 0 }) => {
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

export const ccIcon = (d) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const CC_SVG = {
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
export const CC_PLAYED_TTL = 300000;
