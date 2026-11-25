# Changelog

## 1.2.0 - 2026-11-25

### Features

- Switch: tapping the screen time ring opens a panel to set today's limit (− / + in 15-minute steps, *No limit*), on the `max_screentime` number found by the discovery or set in `entities` (#17)
- Switch: `bonus_minutes` takes a list, offered as bonus choices in that panel, the first one on the bonus button (#16)

## 1.1.4 - 2026-11-24

### Maintenance
- The card source is split into ES modules: `src/console-card/` (entry `src/console-card/index.js`), `src/shared/` (entry `src/shared/index.js`), cut at its sections, with the translations in one file per language (`i18n/<lang>.js`). `scripts/bundle.mjs` concatenates them back, in their original order, into the same single file and per-language files as before; the tests evaluate that bundle.

## 1.1.3 - 2026-11-22

### Performance
- Card picker: the previews are back (`preview: true`), and light. Each card's preview is drawn only once it scrolls into view of Home Assistant's card picker, which otherwise builds the preview of every card at once: until then it holds Home Assistant's state (no render, no history request, no animation). On a dashboard or in the card editor the card is drawn as before.

## 1.1.2 - 2026-11-22

### Performance
- Card picker: the cards no longer ask Home Assistant for a live preview (`preview: false` in `window.customCards`). The picker drew every card at once (history requests, animations), which made the list slow to open; it now shows each card's description instead.

## 1.1.1 - 2026-11-20

### Fixes
- The mini card's detail button keeps its frosted glass on older Safari / iOS (`-webkit-backdrop-filter`).

### Performance
- The PS5-MQTT console is looked for among the MQTT entities only, not every entity of Home Assistant, on each state change.
- The console's entities (and its PSN / Xbox account) are found again only when what that search reads of the states changes (an entity of its device, integration or MQTT appearing or going, the title an Xbox plays), not on every state change of Home Assistant.
- About 425 lines of the shared base that this card never used are gone: the bundle shrinks from 229 KB to 207 KB (139 KB to 118 KB with the translations split).

## 1.1.0 - 2026-11-18

### Features
- **Play time today**: a *Played today* tile, counted from Home Assistant's history since midnight for PlayStation (PSN and PS5-MQTT, counted once) and Xbox, or read from a sensor with the new `play_time` option (a `history_stats` sensor, in its unit); `show_play_time: false` hides it ([#4](https://github.com/juju35/ha-console-card/issues/4)).

## 1.0.0 - 2026-11-18

### Features
- **Console card** (`custom:console-card`) for the PlayStation Network, PS5-MQTT, Xbox and Nintendo Switch Parental Controls integrations ([ha-media-card#20](https://github.com/juju35/ha-media-card/issues/20)).
- **Illustrated header**: the TV and the console on a TV stand, each model drawn (PS5, PS4, Xbox Series X, Series S, One, Switch, Switch 2); the game's cover on the TV while it plays, its light breathing on the wall and a gleam crossing the screen; the home screen when online, a dark screen in standby; day and night following the Home Assistant theme (`illustration_theme` forces it).
- **What is on screen**: the cover, the game, the session's length, the Xbox genre and achievements; the app in use; the last time the console was seen; a Switch's ring of screen time (used of today's limit, time left, no limit, time's up).
- **Tiles**: trophy level and PlayStation Plus; Gamerscore, party, friends, storage and Game Pass; bedtime, restriction mode, software and bonus time. **Trophies** by grade for a PlayStation account.
- **Controls**: power (PS5-MQTT switch, Xbox remote or `power`), Home on Xbox, bonus time (`bonus_minutes`) and suspend / resume on a Switch.
- **Mini card** (`custom:console-mini-card`): the banner with the state as the pill and the game and the session (or the screen time) as chips, a zoom to the full card.
- Discovery by the integrations' translation keys (else by entity ID and name), across the console's device, its PlayStation account's device and the Xbox account playing what it shows; `entities` overrides any role.
- Visual editor for every option; 22 languages, loaded on demand.
