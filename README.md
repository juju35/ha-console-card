# ha-console-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-console-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-console-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-console-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-console-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-console-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-console-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-console-card)](https://github.com/juju35/ha-console-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-console-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/images/icon.svg" alt="Console Card" width="120"></p>

<p align="center">
  <a href="https://www.playstation.com/"><img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/images/playstation.svg" alt="PlayStation" height="28"></a>&nbsp;&nbsp;
  <a href="https://www.xbox.com/"><img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/images/xbox.svg" alt="Xbox" height="28"></a>&nbsp;&nbsp;
  <a href="https://www.nintendo.com/"><img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/images/nintendo-switch.svg" alt="Nintendo Switch" height="28"></a>
</p>

An illustrated Lovelace card for Home Assistant's **game consoles**: the TV and the console in their corner of the living room, the game being played with its cover and how long it has been on, the account's trophies or Gamerscore, a Nintendo Switch's screen time, and the power, home and bonus-time controls. It works with the PlayStation Network, PS5-MQTT, Xbox and Nintendo Switch Parental Controls integrations.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-console-card&category=plugin)

| Card | Type | What it shows |
|---|---|---|
| [Console](#console) | `custom:console-card` | The console illustrated, the game being played or the screen time, up to four tiles, and its controls. |
| [Console mini](#console-mini) | `custom:console-mini-card` | The same console on its banner: the state, the game and the session as chips, a zoom to the full card. |

| PlayStation | Xbox | Nintendo Switch | Mini |
|---|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-ps-playing.gif" alt="PlayStation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-xbox-playing-dark.png" alt="Xbox" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-switch-online.png" alt="Nintendo Switch" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-mini-playing.png" alt="Mini" width="400"> |

The cards share the look of the other ha-* cards (illustrated header with a status pill, tinted tiles), a visual editor covering every option (`entities` as YAML in its folded **Advanced** section), labels in 22 languages following the Home Assistant language, light and dark themes, and come in a single Marketplace install with no dependency.

## Features

### Console

`custom:console-card` — The console of `entity` (the one playing, else the first one of the home, when none is set).

- **Illustrated header**: a 90 px banner, the TV and the console on a wooden TV stand, each model drawn (PS5, PS4, Xbox Series X, Series S, One, Switch and Switch 2 in their dock), on a floor strip; the name and the state on the wall at the left, beside a round badge with the platform's icon in the state's colour (PlayStation blue, Xbox green, Nintendo red while on; grey in standby; amber suspended, red when the time is up). While it plays, the TV shows the game's cover, its light breathes on the wall and a gleam crosses the screen; online, the home screen; in standby, a dark screen and the console's LED off. By night (with a dark Home Assistant theme; `illustration_theme: day | night` forces it) the room is dark. `illustration: false` brings back the classic header (name, model and room, a state pill)
- **What is on screen**: the game's cover, its title and how long it has been played (*For 1 h 12 min*), the genre and the achievements' progress on Xbox (*34 / 50 achievements*); the app in use; *Home screen*; or when the console was last seen. On a Switch: a ring of the day's screen time (*1 h 20 min of 2 h*, *40 min left*, *No limit*, *Time's up*)
- **States**: **playing**, **online** (on, on the home screen or in an app), **standby**, *offline* when the console cannot report; on a Switch, **suspended** (the software is suspended) and **time's up** (no time left today)
- **Play time today** (*Played today*, the first tile): counted from Home Assistant's history since midnight (PlayStation, Xbox, PS5-MQTT), or read from a sensor of yours with `play_time` (a `history_stats` sensor, for instance, on any platform); `show_play_time: false` hides it
- **Up to four tiles**, what the platform reports: the trophy level and the progress to the next one, PlayStation Plus (PlayStation); the Gamerscore, the party, the friends, the free storage, Game Pass (Xbox); the bedtime, the restriction mode, the software allowed or suspended, today's bonus time (Switch)
- **Trophies** by grade (platinum, gold, silver, bronze) for a PlayStation account (`show_trophies: false` hides them)
- **Controls**: **Turn on** / **Turn off** (the PS5-MQTT power switch, the Xbox remote, or `power`), **Home** on an Xbox that is on, **+15 min** of bonus time (`bonus_minutes`, 5 to 30) and **Suspend** / **Resume** on a Switch
- A tap on what is on screen opens the console's dialog
- `animations: false` stops the TV's light and gleam (also when the system asks for reduced motion); `show_controls: false` leaves the card read-only

### Console mini

`custom:console-mini-card` — The console on the same 90 px illustrated banner (two lines with `illustration: false`): the name, the state as the pill (*Playing*, *Standby*, *40 min left*), then the game and the session (or the Switch's screen time) as chips. The **zoom** button (top right) opens the full card in place, a click anywhere else folds it back (`zoom: false` removes the button).

## Supported integrations

| Integration | Consoles | What the card reads |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/images/playstation.svg" alt="" width="16"> [PlayStation Network](https://www.home-assistant.io/integrations/playstation_network/) (built in) | PS5, PS4, PS3, PS Vita, PC | The console's media player (game, cover), the account's trophy level, trophies, PlayStation Plus and last online. Read-only: no power control |
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/images/mqtt.png" alt="" width="16"> [PS5-MQTT](https://github.com/FunkeyFlo/ps5-mqtt) (add-on, over MQTT) | PS5, PS4 | The power switch (turn on, rest mode) and the activity sensor (game, cover); alone, or beside the PlayStation Network console |
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/images/xbox.svg" alt="" width="16"> [Xbox](https://www.home-assistant.io/integrations/xbox/) (built in) | Xbox Series X, Series S, One | The media player (game or app, cover), the remote (power, home), the storage, the account's Gamerscore, now playing (achievements), party, friends and Game Pass |
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/images/nintendo-switch.svg" alt="" width="16"> [Nintendo Switch Parental Controls](https://www.home-assistant.io/integrations/nintendo_parental_controls/) (built in) | Nintendo Switch, Switch 2 | The screen time used and left, today's limit, the bonus time, the bedtime, the restriction mode, the software suspension; the `add_bonus_time` action |

The roles are found by the integrations' translation keys (else by entity ID and name): on the console's device, its PlayStation account's device (the console's parent device), and, for Xbox, the account playing what the console shows. When the card picks the wrong entity for a role, or misses one, set it in `entities` (see [Configuration](#configuration)) and open an issue with the console's entities so that the discovery learns it.

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-console-card&category=plugin)

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-console-card` — Type: **Dashboard**
3. Open **Console Card** and click **Install**
4. Clear your browser cache and refresh

The Marketplace registers the dashboard resource for you (`/local/community/ha-console-card/ha-console-card.js`).

### Manual

1. Download `ha-console-card.js` and the `ha-console-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-console-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → Resources** → Add resource:
   - URL: `/local/ha-console-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

Every option is in the visual editor. In YAML:

```yaml
type: custom:console-card
entity: media_player.playstation_5

# A PS5 seen by PS5-MQTT alone
type: custom:console-card
entity: switch.ps5_power

# An Xbox
type: custom:console-card
entity: media_player.xbox_series_x

# A Nintendo Switch, 30 minutes per bonus
type: custom:console-card
entity: sensor.kids_switch_used_screen_time
bonus_minutes: 30

# On the banner alone
type: custom:console-mini-card
entity: media_player.playstation_5

# A role the discovery missed
type: custom:console-card
entity: media_player.playstation_5
entities:
  power: switch.ps5_power
  activity: sensor.ps5_activity
```

| Option | Type | Default | Description |
|---|---|---|---|
| `entity` | string | the console playing, else the first one | A PlayStation Network or Xbox media player, a PS5-MQTT power switch, or any entity of a Nintendo Switch (parental controls) |
| `title` | string | the console's name | Card title |
| `show_title` | boolean | `true` | Show the title |
| `navigation_path` | string | | A tap on the header opens this dashboard path |
| `power` | string | found | A switch or remote turning the console on and off (PS5-MQTT), when the card does not find it |
| `play_time` | string | | A sensor of today's play time (e.g. `history_stats`, in `h`, `min` or `s`; no unit: hours), over the count from the history |
| `show_play_time` | boolean | `true` | Both: the *Played today* tile |
| `bonus_minutes` | number | `15` | Both: the minutes added by a Switch's bonus button (5 to 30) |
| `illustration` | boolean | `true` | Both: the illustrated header (`false`: the classic header) |
| `illustration_theme` | string | `auto` | Both: `auto` (follows the Home Assistant theme: night with a dark theme, day with a light theme), `day` or `night` |
| `animations` | boolean | `true` | Both: the TV's light and the gleam on its screen |
| `show_trophies` | boolean | `true` | Both: the trophies by grade (PlayStation) |
| `show_controls` | boolean | `true` | Both: power, home, bonus time, suspend |
| `zoom` | boolean | `true` | Mini card: the zoom button |
| `entities` | map | | Advanced (YAML only): the entity of a role, over the discovery — `media`, `power`, `activity`; PlayStation: `trophy_level`, `level_progress`, `platinum`, `gold`, `silver`, `bronze`, `online_status`, `last_online`, `now_playing`, `now_playing_image`, `plus`; Xbox: `gamerscore`, `status`, `last_online`, `now_playing`, `friends`, `in_party`, `in_game`, `game_pass`, `total_storage`, `free_storage`; Switch: `playing_time`, `time_remaining`, `time_extended`, `max_screentime`, `suspend`, `timer_mode`, `bedtime_alarm`, `bedtime_end` |
| `language` | string | Home Assistant's | Advanced: one of the [languages](#translations) |

## Screenshots

| PlayStation, playing | In standby | PS5-MQTT alone |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-ps-playing.png" alt="PlayStation, playing" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-ps-standby.png" alt="PlayStation, standby" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-ps5-mqtt.png" alt="PS5-MQTT alone" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-ps-playing-dark.png" alt="PlayStation, playing, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-ps-standby-dark.png" alt="PlayStation, standby, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-ps5-mqtt-dark.png" alt="PS5-MQTT alone, dark" width="400"> |

The *Played today* tile: counted from the history on the PlayStation and on the Xbox's home screen, read from a `play_time` sensor on the Xbox playing.

| Xbox, playing | Xbox, home screen | Classic header (`illustration: false`) |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-xbox-playing.png" alt="Xbox, playing" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-xbox-online.png" alt="Xbox, home screen" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-classic.png" alt="Classic header" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-xbox-playing-dark.png" alt="Xbox, playing, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-xbox-online-dark.png" alt="Xbox, home screen, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-classic-dark.png" alt="Classic header, dark" width="400"> |

| Switch, time left | Time's up | Suspended |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-switch-online.png" alt="Switch, time left" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-switch-time-up.png" alt="Switch, time's up" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-switch-suspended.png" alt="Switch, suspended" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-switch-online-dark.png" alt="Switch, time left, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-switch-time-up-dark.png" alt="Switch, time's up, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-switch-suspended-dark.png" alt="Switch, suspended, dark" width="400"> |

**Playing animation (PlayStation)**: the TV shows the game's cover, its blue light breathes on the wall and a gleam crosses the screen (still with `animations: false`, or when the system asks for reduced motion).

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-ps-playing.gif" alt="PlayStation playing animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-ps-playing-dark.gif" alt="PlayStation playing animation, dark" width="400"> |

**Playing animation (Xbox)**: the same in green, the console's top vent lit.

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-xbox-playing.gif" alt="Xbox playing animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-xbox-playing-dark.gif" alt="Xbox playing animation, dark" width="400"> |

### Console mini

| Playing | Switch | Zoomed in |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-mini-playing.png" alt="Mini, playing" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-mini-switch.png" alt="Mini, Switch" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-mini-zoom.png" alt="Mini, zoomed in" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-mini-playing-dark.png" alt="Mini, playing, dark" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-mini-switch-dark.png" alt="Mini, Switch, dark" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-console-card/main/screenshots/cc-mini-zoom-dark.png" alt="Mini, zoomed in, dark" width="400"> |

## How it works

- **Console**: `entity`, else the consoles of the home, the one playing first: the PlayStation Network and Xbox media players, a PS5-MQTT console when no PlayStation Network console stands for it, then the Nintendo Switches (one per device)
- **Playing**: the media player playing or paused (on Xbox, a game rather than an app), or the PS5-MQTT activity *playing*; the session runs from the moment it started playing
- **Play time today**: the time spent *playing* (the rule above) since midnight, from the recorder's history (`history/history_during_period`, asked again every 5 minutes or when the state changes, the minutes since then added while it plays); the media player and the PS5-MQTT activity of one console are counted once. None of the integrations reports a daily play time, except the Switch's screen time (on its ring); a `play_time` sensor replaces the count
- **PS5-MQTT**: an MQTT switch or sensor named, or on a device named, like a PlayStation (*PS5*, *PS4*, *PlayStation*, *Sony*); beside a PlayStation Network console, the one of the same model
- **Actions**: `turn_on` / `turn_off` on the power switch or the Xbox remote, `media_player.play_media` (`Home`) on an Xbox, `nintendo_parental_controls.add_bonus_time` and the suspend switch on a Switch; nothing else

## Development

```bash
npm install
npm run build        # stamps the version of package.json into dist/ha-console-card.js
npm run check        # builds and checks the bundle (run in CI)
npm test             # unit tests
npm run screenshots  # renders the cards with a mock home into screenshots/ (and the playing GIFs, needs ffmpeg)
```

`dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built files to the release, which is where the Marketplace installs them from.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](https://github.com/juju35/ha-console-card/blob/main/CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the card, creates the tag and the GitHub release with the changelog section as notes, and attaches `ha-console-card.js` and its translation files

## Translations

The card auto-detects the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |
| Deutsch | `de` |
| Español | `es` |
| Српски | `sr` |
| Srpski (latinica) | `sr-Latn` |
| Italiano | `it` |
| Nederlands | `nl` |
| Português (Portugal) | `pt` |
| Polski | `pl` |
| Română | `ro` |
| Dansk | `da` |
| Svenska | `sv` |
| Български | `bg` |
| Русский | `ru` |
| Українська | `uk` |
| Magyar | `hu` |
| Slovenčina | `sk` |
| Čeština | `cs` |
| Slovenščina | `sl` |
| Latviešu | `lv` |
| Ελληνικά | `el` |

Contributions for additional languages are welcome!

## Credits

Idea: [#20 of ha-media-card](https://github.com/juju35/ha-media-card/issues/20).

## License

[MIT](https://github.com/juju35/ha-console-card/blob/main/LICENSE)
