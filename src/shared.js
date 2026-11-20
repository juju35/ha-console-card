/**
 * Shared by the console cards (its names are used by the other src/ files): the consoles' entities and states, i18n helpers,
 * the base card (header, tiles, tap / hold), the mini card, the visual editor and the common styles. Same base as ha-room-card.
 * https://github.com/juju35/ha-console-card
 */
const RC_VERSION = "__VERSION__";

const RC_HOLD_MS = 500;
const RC_MOVE_PX = 8;
// A held arrow key repeats some 30 times a second: one brightness step every RC_REPEAT_MS at most.
const RC_REPEAT_MS = 150;

// `fn(hass)` computed once per entity registry: HA replaces hass.entities only when the registry changes,
// whereas a new hass (and hass.states) comes with every state change of the whole instance.
const rcPerRegistry = (fn) => {
  const cache = new WeakMap();
  const none = {};
  return (hass) => {
    const reg = hass.entities || none;
    if (!cache.has(reg)) cache.set(reg, fn(hass));
    return cache.get(reg);
  };
};

// ── Overviews ────────────────────────────────────────────────────────────────
// Shared by room-overview-card and room-environment-overview-card.

// The zoom / detail button: the same icons on the overviews and the mini cards.
const rcZoomIcon = (card) => (card._zoomed ? "mdi:arrow-collapse" : "mdi:arrow-expand");

// Back to the compact view (mini card, or overview showing the rooms needing a look), when zoomed in.
const rcUnzoom = (card) => {
  if (!card._zoomed) return;
  card._zoomed = false;
  card._sig = null;
  card._render();
};

// True for a click outside `card` that is not in a dialog opened from it (more-info, say): it folds the card back.
const rcOutside = (card, ev) => !ev.composedPath().includes(card) && !rcInDialog(ev);

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count), and a scroll does not count (the browser cancels the pointer); keyboard clicks still go
// through the click event. The handler keeps its own checks (outside of the card, not in a dialog).
const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = !ev.composedPath().includes(card);
  };
  const onUp = (ev) => {
    if (downOutside) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// A click on the detail button: every room, or back to the rooms needing a look. True when handled.
const rcZoomClick = (card, ev) => {
  if (!ev.target.closest?.(".zoom")) return false;
  ev.stopPropagation();
  card._zoomed = !card._zoomed;
  card._sig = null;
  card._render();
  if (ev.detail === 0) card.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  return true;
};

// ── i18n ─────────────────────────────────────────────────────────────────────
// Strings shared by the cards; a card's own dictionary wins over these.
const RC_I18N = {
  en: {
    all_closed: "All closed",
    all_quiet: "All quiet",
    open_one: "{n} open",
    open_many: "{n} open",
    unavail_one: "{n} unavailable",
    unavail_many: "{n} unavailable",
    leak: "Water leak",
    smoke: "Smoke detected",
    gas: "Gas detected",
    co: "Carbon monoxide",
    detected: "Detected",
    clear: "Clear",
    unavailable: "Unavailable",
    on: "On",
    off: "Off",
    turn_all_off: "Turn everything off",
    ed_area: "Area",
    ed_title: "Title",
    ed_show_title: "Show title",
    ed_title_helper: "Leave empty for the area name",
    ed_columns: "Columns",
    ed_layout: "Layout",
    ed_layout_helper: "Tiles: one large tile per entity, like the Tile card, easier to tap on a phone",
    ed_layout_compact: "Compact",
    ed_layout_tiles: "Tiles",
    ed_advanced: "Advanced",
    ed_language: "Language",
    ed_language_helper: "Empty: the Home Assistant language",
    ed_language_auto: "Automatic",
    ed_entities: "Explicit entities (YAML)",
    ed_entities_helper: "Replaces the automatic discovery: entity IDs, or {entity, name, icon}",
    ed_thresholds: "Comfort thresholds (YAML)",
    ed_thresholds_helper: "Per kind, in the sensor's unit, e.g. co2: [800, 1200] or humidity: [25, 35, 70, 80]",
    ed_rooms: "Rooms (YAML)",
    ed_rooms_helper: "Order and overrides: a list of {area, name, icon, navigation_path}",
    ed_navigation_path: "Navigation path",
    ed_all_off_button: "“Turn everything off” button",
    err_config: "Set `area` or `entities`",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    ed_zoom: "Zoom button",
    ed_zoom_helper: "Switches the mini card to the full card and back",
    rooms_all: "Show every room",
    rooms_check: "Only the rooms needing a look",
    ed_sort: "Sort",
    ed_sort_name: "By name",
    ed_exclude_areas: "Rooms to exclude",
  },
  fr: {
    all_closed: "Tout est fermé",
    all_quiet: "Tout est calme",
    open_one: "{n} ouverture",
    open_many: "{n} ouvertures",
    unavail_one: "{n} indisponible",
    unavail_many: "{n} indisponibles",
    leak: "Fuite d'eau",
    smoke: "Fumée détectée",
    gas: "Gaz détecté",
    co: "Monoxyde de carbone",
    detected: "Détecté",
    clear: "Non détecté",
    unavailable: "Indisponible",
    on: "Allumée",
    off: "Éteinte",
    turn_all_off: "Tout éteindre",
    ed_area: "Pièce",
    ed_title: "Titre",
    ed_show_title: "Afficher le titre",
    ed_title_helper: "Laisser vide pour le nom de la pièce",
    ed_columns: "Colonnes",
    ed_layout: "Disposition",
    ed_layout_helper: "Tuiles : une grande tuile par entité, comme la carte Tuile, plus facile à toucher sur téléphone",
    ed_layout_compact: "Compacte",
    ed_layout_tiles: "Tuiles",
    ed_advanced: "Avancé",
    ed_language: "Langue",
    ed_language_helper: "Vide : la langue de Home Assistant",
    ed_language_auto: "Automatique",
    ed_entities: "Entités explicites (YAML)",
    ed_entities_helper: "Remplace la découverte automatique : des identifiants d'entités, ou {entity, name, icon}",
    ed_thresholds: "Seuils de confort (YAML)",
    ed_thresholds_helper: "Par type, dans l'unité du capteur, par exemple co2: [800, 1200] ou humidity: [25, 35, 70, 80]",
    ed_rooms: "Pièces (YAML)",
    ed_rooms_helper: "Ordre et personnalisation : une liste de {area, name, icon, navigation_path}",
    ed_navigation_path: "Chemin de navigation",
    ed_all_off_button: "Bouton « Tout éteindre »",
    err_config: "Définis `area` ou `entities`",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    ed_zoom: "Bouton zoom",
    ed_zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
    rooms_all: "Afficher toutes les pièces",
    rooms_check: "Seulement les pièces à surveiller",
    ed_sort: "Tri",
    ed_sort_name: "Par nom",
    ed_exclude_areas: "Pièces à exclure",
  },
  de: {
    all_closed: "Alles geschlossen",
    all_quiet: "Alles ruhig",
    open_one: "{n} offen",
    open_many: "{n} offen",
    unavail_one: "{n} nicht verfügbar",
    unavail_many: "{n} nicht verfügbar",
    leak: "Wasserleck",
    smoke: "Rauch erkannt",
    gas: "Gas erkannt",
    co: "Kohlenmonoxid",
    detected: "Erkannt",
    clear: "Nicht erkannt",
    unavailable: "Nicht verfügbar",
    on: "An",
    off: "Aus",
    turn_all_off: "Alles ausschalten",
    ed_area: "Bereich",
    ed_title: "Titel",
    ed_show_title: "Titel anzeigen",
    ed_title_helper: "Leer lassen für den Namen des Bereichs",
    ed_columns: "Spalten",
    ed_layout: "Layout",
    ed_layout_helper: "Kacheln: eine große Kachel pro Entität wie die Kachel-Karte, auf dem Handy leichter anzutippen",
    ed_layout_compact: "Kompakt",
    ed_layout_tiles: "Kacheln",
    ed_advanced: "Erweitert",
    ed_language: "Sprache",
    ed_language_helper: "Leer: die Sprache von Home Assistant",
    ed_language_auto: "Automatisch",
    ed_entities: "Explizite Entitäten (YAML)",
    ed_entities_helper: "Ersetzt die automatische Erkennung: Entitäts-IDs oder {entity, name, icon}",
    ed_thresholds: "Komfortschwellen (YAML)",
    ed_thresholds_helper: "Pro Art, in der Einheit des Sensors, z. B. co2: [800, 1200] oder humidity: [25, 35, 70, 80]",
    ed_rooms: "Räume (YAML)",
    ed_rooms_helper: "Reihenfolge und Anpassungen: eine Liste von {area, name, icon, navigation_path}",
    ed_navigation_path: "Navigationspfad",
    ed_all_off_button: "Schaltfläche „Alles ausschalten“",
    err_config: "Lege `area` oder `entities` fest",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    ed_zoom: "Zoom-Schaltfläche",
    ed_zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
    rooms_all: "Alle Räume anzeigen",
    rooms_check: "Nur die Räume, die Aufmerksamkeit brauchen",
    ed_sort: "Sortierung",
    ed_sort_name: "Nach Name",
    ed_exclude_areas: "Auszuschließende Räume",
  },
  es: {
    all_closed: "Todo cerrado",
    all_quiet: "Todo tranquilo",
    open_one: "{n} abierto",
    open_many: "{n} abiertos",
    unavail_one: "{n} no disponible",
    unavail_many: "{n} no disponibles",
    leak: "Fuga de agua",
    smoke: "Humo detectado",
    gas: "Gas detectado",
    co: "Monóxido de carbono",
    detected: "Detectado",
    clear: "No detectado",
    unavailable: "No disponible",
    on: "Encendido",
    off: "Apagado",
    turn_all_off: "Apagar todo",
    ed_area: "Área",
    ed_title: "Título",
    ed_show_title: "Mostrar el título",
    ed_title_helper: "Déjalo vacío para usar el nombre del área",
    ed_columns: "Columnas",
    ed_layout: "Diseño",
    ed_layout_helper: "Mosaicos: un mosaico grande por entidad, como la tarjeta Mosaico, más fácil de tocar en el móvil",
    ed_layout_compact: "Compacto",
    ed_layout_tiles: "Mosaicos",
    ed_advanced: "Avanzado",
    ed_language: "Idioma",
    ed_language_helper: "Vacío: el idioma de Home Assistant",
    ed_language_auto: "Automático",
    ed_entities: "Entidades explícitas (YAML)",
    ed_entities_helper: "Sustituye la detección automática: IDs de entidad, o {entity, name, icon}",
    ed_thresholds: "Umbrales de confort (YAML)",
    ed_thresholds_helper: "Por tipo, en la unidad del sensor, p. ej. co2: [800, 1200] o humidity: [25, 35, 70, 80]",
    ed_rooms: "Habitaciones (YAML)",
    ed_rooms_helper: "Orden y personalización: una lista de {area, name, icon, navigation_path}",
    ed_navigation_path: "Ruta de navegación",
    ed_all_off_button: "Botón «Apagar todo»",
    err_config: "Define `area` o `entities`",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    ed_zoom: "Botón de zoom",
    ed_zoom_helper: "Cambia de la minitarjeta a la tarjeta completa y viceversa",
    rooms_all: "Mostrar todas las habitaciones",
    rooms_check: "Solo las habitaciones que requieren atención",
    ed_sort: "Orden",
    ed_sort_name: "Por nombre",
    ed_exclude_areas: "Habitaciones a excluir",
  },
  sr: {
    all_closed: "Све је затворено",
    all_quiet: "Све је мирно",
    open_one: "{n} отворено",
    open_few: "{n} отворена",
    open_many: "{n} отворених",
    unavail_one: "Недоступно: {n}",
    unavail_many: "Недоступно: {n}",
    leak: "Цурење воде",
    smoke: "Откривен дим",
    gas: "Откривен гас",
    co: "Угљен-моноксид",
    detected: "Откривено",
    clear: "Није откривено",
    unavailable: "Недоступно",
    on: "Укључено",
    off: "Искључено",
    turn_all_off: "Искључи све",
    ed_area: "Просторија",
    ed_title: "Наслов",
    ed_show_title: "Прикажи наслов",
    ed_title_helper: "Остави празно за назив просторије",
    ed_columns: "Колоне",
    ed_layout: "Распоред",
    ed_layout_helper: "Плочице: једна велика плочица по ентитету, као картица Плочица, лакше за додир на телефону",
    ed_layout_compact: "Збијено",
    ed_layout_tiles: "Плочице",
    ed_advanced: "Напредно",
    ed_language: "Језик",
    ed_language_helper: "Празно: језик Home Assistant-а",
    ed_language_auto: "Аутоматски",
    ed_entities: "Експлицитни ентитети (YAML)",
    ed_entities_helper: "Замењује аутоматско проналажење: ID-ови ентитета или {entity, name, icon}",
    ed_thresholds: "Прагови комфора (YAML)",
    ed_thresholds_helper: "По врсти, у јединици сензора, нпр. co2: [800, 1200] или humidity: [25, 35, 70, 80]",
    ed_rooms: "Собе/Просторије (YAML)",
    ed_rooms_helper: "Редослед и измене: листа са {area, name, icon, navigation_path}",
    ed_navigation_path: "Путања за навигацију",
    ed_all_off_button: "Дугме „Искључи све“",
    err_config: "Подесите `area` или `entities`",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    ed_zoom: "Дугме за увећање",
    ed_zoom_helper: "Пребацује мини картицу на пун приказ и назад",
    rooms_all: "Прикажи сваку собу",
    rooms_check: "Само собе које захтевају пажњу",
    ed_sort: "Сортирање",
    ed_sort_name: "По имену",
    ed_exclude_areas: "Изостави собе",
  },
  "sr-Latn": {
    all_closed: "Sve je zatvoreno",
    all_quiet: "Sve je mirno",
    open_one: "{n} otvoreno",
    open_few: "{n} otvorena",
    open_many: "{n} otvorenih",
    unavail_one: "Nedostupno: {n}",
    unavail_many: "Nedostupno: {n}",
    leak: "Curenje vode",
    smoke: "Otkriven dim",
    gas: "Otkriven gas",
    co: "Ugljen-monoksid",
    detected: "Otkriveno",
    clear: "Nije otkriveno",
    unavailable: "Nedostupno",
    on: "Uključeno",
    off: "Isključeno",
    turn_all_off: "Isključi sve",
    ed_area: "Prostorija",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_title_helper: "Ostavi prazno za naziv prostorije",
    ed_columns: "Kolone",
    ed_layout: "Raspored",
    ed_layout_helper: "Pločice: jedna velika pločica po entitetu, kao kartica Pločica, lakše za dodir na telefonu",
    ed_layout_compact: "Zbijeno",
    ed_layout_tiles: "Pločice",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistant-a",
    ed_language_auto: "Automatski",
    ed_entities: "Eksplicitni entiteti (YAML)",
    ed_entities_helper: "Zamenjuje automatsko pronalaženje: ID-ovi entiteta ili {entity, name, icon}",
    ed_thresholds: "Pragovi komfora (YAML)",
    ed_thresholds_helper: "Po vrsti, u jedinici senzora, npr. co2: [800, 1200] ili humidity: [25, 35, 70, 80]",
    ed_rooms: "Sobe/Prostorije (YAML)",
    ed_rooms_helper: "Redosled i izmene: lista sa {area, name, icon, navigation_path}",
    ed_navigation_path: "Putanja za navigaciju",
    ed_all_off_button: "Dugme „Isključi sve“",
    err_config: "Podesite `area` ili `entities`",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    ed_zoom: "Dugme za uvećanje",
    ed_zoom_helper: "Prebacuje mini karticu na pun prikaz i nazad",
    rooms_all: "Prikaži svaku sobu",
    rooms_check: "Samo sobe koje zahtevaju pažnju",
    ed_sort: "Sortiranje",
    ed_sort_name: "Po imenu",
    ed_exclude_areas: "Izostavi sobe",
  },
  it: {
    all_closed: "Tutto chiuso",
    all_quiet: "Tutto calmo",
    open_one: "{n} apertura",
    open_many: "{n} aperture",
    unavail_one: "{n} non disponibile",
    unavail_many: "{n} non disponibili",
    leak: "Perdita d'acqua",
    smoke: "Fumo rilevato",
    gas: "Gas rilevato",
    co: "Monossido di carbonio",
    detected: "Rilevato",
    clear: "Non rilevato",
    unavailable: "Non disponibile",
    on: "Accesa",
    off: "Spenta",
    turn_all_off: "Spegni tutto",
    ed_area: "Area",
    ed_title: "Titolo",
    ed_show_title: "Mostra il titolo",
    ed_title_helper: "Lascia vuoto per usare il nome dell'area",
    ed_columns: "Colonne",
    ed_layout: "Layout",
    ed_layout_helper: "Riquadri: un riquadro grande per entità, come la scheda Riquadro, più facile da toccare sul telefono",
    ed_layout_compact: "Compatto",
    ed_layout_tiles: "Riquadri",
    ed_advanced: "Avanzate",
    ed_language: "Lingua",
    ed_language_helper: "Vuoto: la lingua di Home Assistant",
    ed_language_auto: "Automatica",
    ed_entities: "Entità esplicite (YAML)",
    ed_entities_helper: "Sostituisce il rilevamento automatico: ID entità o {entity, name, icon}",
    ed_thresholds: "Soglie di comfort (YAML)",
    ed_thresholds_helper: "Per tipo, nell'unità del sensore, ad es. co2: [800, 1200] o humidity: [25, 35, 70, 80]",
    ed_rooms: "Stanze (YAML)",
    ed_rooms_helper: "Ordine e personalizzazioni: un elenco di {area, name, icon, navigation_path}",
    ed_navigation_path: "Percorso di navigazione",
    ed_all_off_button: "Pulsante «Spegni tutto»",
    err_config: "Imposta `area` o `entities`",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    ed_zoom: "Pulsante zoom",
    ed_zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
    rooms_all: "Mostra tutte le stanze",
    rooms_check: "Solo le stanze da controllare",
    ed_sort: "Ordinamento",
    ed_sort_name: "Per nome",
    ed_exclude_areas: "Stanze da escludere",
  },
  nl: {
    all_closed: "Alles dicht",
    all_quiet: "Alles rustig",
    open_one: "{n} open",
    open_many: "{n} open",
    unavail_one: "{n} niet beschikbaar",
    unavail_many: "{n} niet beschikbaar",
    leak: "Waterlek",
    smoke: "Rook gedetecteerd",
    gas: "Gas gedetecteerd",
    co: "Koolmonoxide",
    detected: "Gedetecteerd",
    clear: "Niet gedetecteerd",
    unavailable: "Niet beschikbaar",
    on: "Aan",
    off: "Uit",
    turn_all_off: "Alles uitschakelen",
    ed_area: "Ruimte",
    ed_title: "Titel",
    ed_show_title: "Titel tonen",
    ed_title_helper: "Leeg laten voor de naam van de ruimte",
    ed_columns: "Kolommen",
    ed_layout: "Indeling",
    ed_layout_helper: "Tegels: één grote tegel per entiteit, zoals de Tegel-kaart, makkelijker aan te tikken op een telefoon",
    ed_layout_compact: "Compact",
    ed_layout_tiles: "Tegels",
    ed_advanced: "Geavanceerd",
    ed_language: "Taal",
    ed_language_helper: "Leeg: de taal van Home Assistant",
    ed_language_auto: "Automatisch",
    ed_entities: "Expliciete entiteiten (YAML)",
    ed_entities_helper: "Vervangt de automatische detectie: entiteit-ID's of {entity, name, icon}",
    ed_thresholds: "Comfortdrempels (YAML)",
    ed_thresholds_helper: "Per soort, in de eenheid van de sensor, bijv. co2: [800, 1200] of humidity: [25, 35, 70, 80]",
    ed_rooms: "Ruimtes (YAML)",
    ed_rooms_helper: "Volgorde en aanpassingen: een lijst van {area, name, icon, navigation_path}",
    ed_navigation_path: "Navigatiepad",
    ed_all_off_button: "Knop “Alles uitschakelen”",
    err_config: "Stel `area` of `entities` in",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    ed_zoom: "Zoomknop",
    ed_zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
    rooms_all: "Alle ruimtes tonen",
    rooms_check: "Alleen de ruimtes die aandacht nodig hebben",
    ed_sort: "Sortering",
    ed_sort_name: "Op naam",
    ed_exclude_areas: "Uit te sluiten ruimtes",
  },
  pt: {
    all_closed: "Tudo fechado",
    all_quiet: "Tudo calmo",
    open_one: "{n} abertura",
    open_many: "{n} aberturas",
    unavail_one: "{n} indisponível",
    unavail_many: "{n} indisponíveis",
    leak: "Fuga de água",
    smoke: "Fumo detetado",
    gas: "Gás detetado",
    co: "Monóxido de carbono",
    detected: "Detetado",
    clear: "Não detetado",
    unavailable: "Indisponível",
    on: "Ligada",
    off: "Desligada",
    turn_all_off: "Desligar tudo",
    ed_area: "Área",
    ed_title: "Título",
    ed_show_title: "Mostrar o título",
    ed_title_helper: "Deixe vazio para usar o nome da área",
    ed_columns: "Colunas",
    ed_layout: "Disposição",
    ed_layout_helper: "Mosaicos: um mosaico grande por entidade, como o cartão Mosaico, mais fácil de tocar no telemóvel",
    ed_layout_compact: "Compacta",
    ed_layout_tiles: "Mosaicos",
    ed_advanced: "Avançado",
    ed_language: "Idioma",
    ed_language_helper: "Vazio: o idioma do Home Assistant",
    ed_language_auto: "Automático",
    ed_entities: "Entidades explícitas (YAML)",
    ed_entities_helper: "Substitui a deteção automática: IDs de entidade, ou {entity, name, icon}",
    ed_thresholds: "Limiares de conforto (YAML)",
    ed_thresholds_helper: "Por tipo, na unidade do sensor, p. ex. co2: [800, 1200] ou humidity: [25, 35, 70, 80]",
    ed_rooms: "Divisões (YAML)",
    ed_rooms_helper: "Ordem e personalização: uma lista de {area, name, icon, navigation_path}",
    ed_navigation_path: "Caminho de navegação",
    ed_all_off_button: "Botão «Desligar tudo»",
    err_config: "Defina `area` ou `entities`",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    ed_zoom: "Botão de zoom",
    ed_zoom_helper: "Alterna entre o minicartão e o cartão completo",
    rooms_all: "Mostrar todas as divisões",
    rooms_check: "Só as divisões que precisam de atenção",
    ed_sort: "Ordenação",
    ed_sort_name: "Por nome",
    ed_exclude_areas: "Divisões a excluir",
  },
  pl: {
    all_closed: "Zamknięte",
    all_quiet: "Spokojnie",
    open_one: "Otwarte: {n}",
    open_many: "Otwarte: {n}",
    unavail_one: "Niedostępne: {n}",
    unavail_many: "Niedostępne: {n}",
    leak: "Wyciek wody",
    smoke: "Wykryto dym",
    gas: "Wykryto gaz",
    co: "Tlenek węgla",
    detected: "Wykryto",
    clear: "Nie wykryto",
    unavailable: "Niedostępne",
    on: "Włączone",
    off: "Wyłączone",
    turn_all_off: "Wyłącz wszystko",
    ed_area: "Obszar",
    ed_title: "Tytuł",
    ed_show_title: "Pokaż tytuł",
    ed_title_helper: "Pozostaw puste, aby użyć nazwy obszaru",
    ed_columns: "Kolumny",
    ed_layout: "Układ",
    ed_layout_helper: "Kafelki: jeden duży kafelek na encję, jak karta Kafelek, łatwiejszy do dotknięcia na telefonie",
    ed_layout_compact: "Kompaktowy",
    ed_layout_tiles: "Kafelki",
    ed_advanced: "Zaawansowane",
    ed_language: "Język",
    ed_language_helper: "Puste: język Home Assistanta",
    ed_language_auto: "Automatyczny",
    ed_entities: "Jawnie podane encje (YAML)",
    ed_entities_helper: "Zastępuje automatyczne wykrywanie: identyfikatory encji lub {entity, name, icon}",
    ed_thresholds: "Progi komfortu (YAML)",
    ed_thresholds_helper: "Dla każdego rodzaju, w jednostce czujnika, np. co2: [800, 1200] lub humidity: [25, 35, 70, 80]",
    ed_rooms: "Pomieszczenia (YAML)",
    ed_rooms_helper: "Kolejność i nadpisania: lista {area, name, icon, navigation_path}",
    ed_navigation_path: "Ścieżka nawigacji",
    ed_all_off_button: "Przycisk „Wyłącz wszystko”",
    err_config: "Ustaw `area` lub `entities`",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    ed_zoom: "Przycisk powiększenia",
    ed_zoom_helper: "Przełącza minikartę na pełną kartę i z powrotem",
    rooms_all: "Pokaż wszystkie pomieszczenia",
    rooms_check: "Tylko pomieszczenia wymagające uwagi",
    ed_sort: "Sortowanie",
    ed_sort_name: "Według nazwy",
    ed_exclude_areas: "Pomieszczenia do wykluczenia",
  },
  ro: {
    all_closed: "Totul închis",
    all_quiet: "Totul liniștit",
    open_one: "Deschise: {n}",
    open_many: "Deschise: {n}",
    unavail_one: "Indisponibile: {n}",
    unavail_many: "Indisponibile: {n}",
    leak: "Scurgere",
    smoke: "Fum detectat",
    gas: "Gaz detectat",
    co: "Monoxid de carbon",
    detected: "Detectat",
    clear: "Nedetectat",
    unavailable: "Indisponibil",
    on: "Pornită",
    off: "Oprită",
    turn_all_off: "Oprește tot",
    ed_area: "Zonă",
    ed_title: "Titlu",
    ed_show_title: "Afișează titlul",
    ed_title_helper: "Lasă gol pentru numele zonei",
    ed_columns: "Coloane",
    ed_layout: "Aspect",
    ed_layout_helper: "Plăci: o placă mare pentru fiecare entitate, ca fișa Placă, mai ușor de atins pe telefon",
    ed_layout_compact: "Compact",
    ed_layout_tiles: "Plăci",
    ed_advanced: "Avansat",
    ed_language: "Limbă",
    ed_language_helper: "Gol: limba Home Assistant",
    ed_language_auto: "Automată",
    ed_entities: "Entități explicite (YAML)",
    ed_entities_helper: "Înlocuiește detectarea automată: ID-uri de entitate sau {entity, name, icon}",
    ed_thresholds: "Praguri de confort (YAML)",
    ed_thresholds_helper: "Pe tip, în unitatea senzorului, de ex. co2: [800, 1200] sau humidity: [25, 35, 70, 80]",
    ed_rooms: "Camere (YAML)",
    ed_rooms_helper: "Ordine și personalizări: o listă de {area, name, icon, navigation_path}",
    ed_navigation_path: "Cale de navigare",
    ed_all_off_button: "Butonul „Oprește tot”",
    err_config: "Setează `area` sau `entities`",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    ed_zoom: "Buton de zoom",
    ed_zoom_helper: "Comută între mini-card și cardul complet",
    rooms_all: "Afișează toate camerele",
    rooms_check: "Doar camerele care necesită atenție",
    ed_sort: "Sortare",
    ed_sort_name: "După nume",
    ed_exclude_areas: "Camere excluse",
  },
  da: {
    all_closed: "Alt lukket",
    all_quiet: "Alt roligt",
    open_one: "{n} åben",
    open_many: "{n} åbne",
    unavail_one: "{n} utilgængelig",
    unavail_many: "{n} utilgængelige",
    leak: "Vandlækage",
    smoke: "Røg registreret",
    gas: "Gas registreret",
    co: "Kulilte",
    detected: "Registreret",
    clear: "Ikke registreret",
    unavailable: "Utilgængelig",
    on: "Tændt",
    off: "Slukket",
    turn_all_off: "Sluk alt",
    ed_area: "Område",
    ed_title: "Titel",
    ed_show_title: "Vis titel",
    ed_title_helper: "Lad stå tomt for at bruge områdets navn",
    ed_columns: "Kolonner",
    ed_layout: "Layout",
    ed_layout_helper: "Fliser: én stor flise pr. entitet som Flise-kortet, nemmere at trykke på en telefon",
    ed_layout_compact: "Kompakt",
    ed_layout_tiles: "Fliser",
    ed_advanced: "Avanceret",
    ed_language: "Sprog",
    ed_language_helper: "Tomt: Home Assistants sprog",
    ed_language_auto: "Automatisk",
    ed_entities: "Eksplicitte enheder (YAML)",
    ed_entities_helper: "Erstatter den automatiske registrering: enheds-id'er eller {entity, name, icon}",
    ed_thresholds: "Komforttærskler (YAML)",
    ed_thresholds_helper: "Pr. type, i sensorens enhed, f.eks. co2: [800, 1200] eller humidity: [25, 35, 70, 80]",
    ed_rooms: "Rum (YAML)",
    ed_rooms_helper: "Rækkefølge og tilpasninger: en liste med {area, name, icon, navigation_path}",
    ed_navigation_path: "Navigationssti",
    ed_all_off_button: "Knappen »Sluk alt«",
    err_config: "Angiv `area` eller `entities`",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til den kompakte visning",
    ed_zoom: "Zoomknap",
    ed_zoom_helper: "Skifter fra minikortet til hele kortet og tilbage",
    rooms_all: "Vis alle rum",
    rooms_check: "Kun rum, der kræver opmærksomhed",
    ed_sort: "Sortering",
    ed_sort_name: "Efter navn",
    ed_exclude_areas: "Rum, der udelades",
  },
  sv: {
    all_closed: "Allt stängt",
    all_quiet: "Allt lugnt",
    open_one: "{n} öppen",
    open_many: "{n} öppna",
    unavail_one: "{n} ej tillgänglig",
    unavail_many: "{n} ej tillgängliga",
    leak: "Vattenläcka",
    smoke: "Rök upptäckt",
    gas: "Gas upptäckt",
    co: "Kolmonoxid",
    detected: "Upptäckt",
    clear: "Inte upptäckt",
    unavailable: "Ej tillgänglig",
    on: "På",
    off: "Av",
    turn_all_off: "Stäng av allt",
    ed_area: "Område",
    ed_title: "Titel",
    ed_show_title: "Visa rubrik",
    ed_title_helper: "Lämna tomt för områdets namn",
    ed_columns: "Kolumner",
    ed_layout: "Layout",
    ed_layout_helper: "Rutor: en stor ruta per entitet, som Ruta-kortet, lättare att trycka på i mobilen",
    ed_layout_compact: "Kompakt",
    ed_layout_tiles: "Rutor",
    ed_advanced: "Avancerat",
    ed_language: "Språk",
    ed_language_helper: "Tomt: Home Assistants språk",
    ed_language_auto: "Automatiskt",
    ed_entities: "Explicita entiteter (YAML)",
    ed_entities_helper: "Ersätter den automatiska identifieringen: entitets-ID:n eller {entity, name, icon}",
    ed_thresholds: "Komfortgränser (YAML)",
    ed_thresholds_helper: "Per typ, i sensorns enhet, t.ex. co2: [800, 1200] eller humidity: [25, 35, 70, 80]",
    ed_rooms: "Rum (YAML)",
    ed_rooms_helper: "Ordning och anpassningar: en lista med {area, name, icon, navigation_path}",
    ed_navigation_path: "Navigeringssökväg",
    ed_all_off_button: "Knappen ”Stäng av allt”",
    err_config: "Ange `area` eller `entities`",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    ed_zoom: "Zoomknapp",
    ed_zoom_helper: "Växlar mellan minikortet och hela kortet",
    rooms_all: "Visa alla rum",
    rooms_check: "Bara rum som behöver ses över",
    ed_sort: "Sortering",
    ed_sort_name: "Efter namn",
    ed_exclude_areas: "Rum att utesluta",
  },
  bg: {
    all_closed: "Всичко е затворено",
    all_quiet: "Всичко е спокойно",
    open_one: "Отворени: {n}",
    open_many: "Отворени: {n}",
    unavail_one: "Недостъпни: {n}",
    unavail_many: "Недостъпни: {n}",
    leak: "Теч на вода",
    smoke: "Открит дим",
    gas: "Открит газ",
    co: "Въглероден оксид",
    detected: "Открито",
    clear: "Не е открито",
    unavailable: "Недостъпно",
    on: "Включен",
    off: "Изключен",
    turn_all_off: "Изключи всичко",
    ed_area: "Зона",
    ed_title: "Заглавие",
    ed_show_title: "Показване на заглавието",
    ed_title_helper: "Оставете празно за името на зоната",
    ed_columns: "Колони",
    ed_layout: "Оформление",
    ed_layout_helper: "Плочки: по една голяма плочка за обект, като картата Плочка, по-лесна за докосване на телефон",
    ed_layout_compact: "Компактно",
    ed_layout_tiles: "Плочки",
    ed_advanced: "Разширени",
    ed_language: "Език",
    ed_language_helper: "Празно: езикът на Home Assistant",
    ed_language_auto: "Автоматично",
    ed_entities: "Изрично зададени обекти (YAML)",
    ed_entities_helper: "Заменя автоматичното откриване: ID на обекти или {entity, name, icon}",
    ed_thresholds: "Прагове на комфорт (YAML)",
    ed_thresholds_helper: "По вид, в мерната единица на сензора, напр. co2: [800, 1200] или humidity: [25, 35, 70, 80]",
    ed_rooms: "Стаи (YAML)",
    ed_rooms_helper: "Ред и персонализиране: списък от {area, name, icon, navigation_path}",
    ed_navigation_path: "Път за навигация",
    ed_all_off_button: "Бутон „Изключи всичко“",
    err_config: "Задайте `area` или `entities`",
    zoom_in: "Покажи пълната карта",
    zoom_out: "Обратно към компактния изглед",
    ed_zoom: "Бутон за увеличение",
    ed_zoom_helper: "Превключва от мини картата към пълната карта и обратно",
    rooms_all: "Покажи всички стаи",
    rooms_check: "Само стаите, които изискват внимание",
    ed_sort: "Сортиране",
    ed_sort_name: "По име",
    ed_exclude_areas: "Стаи за пропускане",
  },
  ru: {
    all_closed: "Всё закрыто",
    all_quiet: "Всё спокойно",
    open_one: "Открыто: {n}",
    open_many: "Открыто: {n}",
    unavail_one: "Недоступно: {n}",
    unavail_many: "Недоступно: {n}",
    leak: "Протечка",
    smoke: "Обнаружен дым",
    gas: "Обнаружен газ",
    co: "Угарный газ",
    detected: "Обнаружено",
    clear: "Не обнаружено",
    unavailable: "Недоступно",
    on: "Включено",
    off: "Выключено",
    turn_all_off: "Выключить всё",
    ed_area: "Пространство",
    ed_title: "Заголовок",
    ed_show_title: "Показывать заголовок",
    ed_title_helper: "Оставьте пустым, чтобы использовать название пространства",
    ed_columns: "Столбцы",
    ed_layout: "Макет",
    ed_layout_helper: "Плитки: одна большая плитка на объект, как карточка «Плитка», удобнее нажимать на телефоне",
    ed_layout_compact: "Компактный",
    ed_layout_tiles: "Плитки",
    ed_advanced: "Дополнительно",
    ed_language: "Язык",
    ed_language_helper: "Пусто: язык Home Assistant",
    ed_language_auto: "Автоматически",
    ed_entities: "Явно заданные объекты (YAML)",
    ed_entities_helper: "Заменяет автоматическое обнаружение: ID объектов или {entity, name, icon}",
    ed_thresholds: "Пороги комфорта (YAML)",
    ed_thresholds_helper: "Для каждого типа, в единицах датчика, например co2: [800, 1200] или humidity: [25, 35, 70, 80]",
    ed_rooms: "Комнаты (YAML)",
    ed_rooms_helper: "Порядок и настройки: список {area, name, icon, navigation_path}",
    ed_navigation_path: "Путь навигации",
    ed_all_off_button: "Кнопка «Выключить всё»",
    err_config: "Укажите `area` или `entities`",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    ed_zoom: "Кнопка масштаба",
    ed_zoom_helper: "Переключает мини-карточку на полную карточку и обратно",
    rooms_all: "Показать все комнаты",
    rooms_check: "Только комнаты, требующие внимания",
    ed_sort: "Сортировка",
    ed_sort_name: "По названию",
    ed_exclude_areas: "Исключить комнаты",
  },
  uk: {
    all_closed: "Усе зачинено",
    all_quiet: "Усе спокійно",
    open_one: "Відчинено: {n}",
    open_many: "Відчинено: {n}",
    unavail_one: "Недоступно: {n}",
    unavail_many: "Недоступно: {n}",
    leak: "Витік води",
    smoke: "Виявлено дим",
    gas: "Виявлено газ",
    co: "Чадний газ",
    detected: "Виявлено",
    clear: "Не виявлено",
    unavailable: "Недоступно",
    on: "Увімкнено",
    off: "Вимкнено",
    turn_all_off: "Вимкнути все",
    ed_area: "Простір",
    ed_title: "Заголовок",
    ed_show_title: "Показувати заголовок",
    ed_title_helper: "Залиште порожнім, щоб використати назву простору",
    ed_columns: "Стовпці",
    ed_layout: "Макет",
    ed_layout_helper: "Плитки: одна велика плитка на сутність, як картка «Плитка», зручніше торкатися на телефоні",
    ed_layout_compact: "Компактний",
    ed_layout_tiles: "Плитки",
    ed_advanced: "Додатково",
    ed_language: "Мова",
    ed_language_helper: "Порожньо: мова Home Assistant",
    ed_language_auto: "Автоматично",
    ed_entities: "Явно задані сутності (YAML)",
    ed_entities_helper: "Замінює автоматичне виявлення: ID сутностей або {entity, name, icon}",
    ed_thresholds: "Пороги комфорту (YAML)",
    ed_thresholds_helper: "Для кожного типу, в одиницях датчика, наприклад co2: [800, 1200] або humidity: [25, 35, 70, 80]",
    ed_rooms: "Кімнати (YAML)",
    ed_rooms_helper: "Порядок і налаштування: список {area, name, icon, navigation_path}",
    ed_navigation_path: "Шлях навігації",
    ed_all_off_button: "Кнопка «Вимкнути все»",
    err_config: "Вкажіть `area` або `entities`",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    ed_zoom: "Кнопка масштабу",
    ed_zoom_helper: "Перемикає міні-картку на повну картку й назад",
    rooms_all: "Показати всі кімнати",
    rooms_check: "Лише кімнати, що потребують уваги",
    ed_sort: "Сортування",
    ed_sort_name: "За назвою",
    ed_exclude_areas: "Виключити кімнати",
  },
  hu: {
    all_closed: "Minden zárva",
    all_quiet: "Minden nyugodt",
    open_one: "{n} nyitva",
    open_many: "{n} nyitva",
    unavail_one: "{n} nem elérhető",
    unavail_many: "{n} nem elérhető",
    leak: "Vízszivárgás",
    smoke: "Füst észlelve",
    gas: "Gáz észlelve",
    co: "Szén-monoxid",
    detected: "Észlelve",
    clear: "Nincs észlelés",
    unavailable: "Nem elérhető",
    on: "Be",
    off: "Ki",
    turn_all_off: "Minden kikapcsolása",
    ed_area: "Terület",
    ed_title: "Cím",
    ed_show_title: "Cím megjelenítése",
    ed_title_helper: "Hagyd üresen a terület nevéhez",
    ed_columns: "Oszlopok",
    ed_layout: "Elrendezés",
    ed_layout_helper: "Csempék: entitásonként egy nagy csempe, mint a Csempe kártya, telefonon könnyebb megérinteni",
    ed_layout_compact: "Tömör",
    ed_layout_tiles: "Csempék",
    ed_advanced: "Speciális",
    ed_language: "Nyelv",
    ed_language_helper: "Üres: a Home Assistant nyelve",
    ed_language_auto: "Automatikus",
    ed_entities: "Kifejezetten megadott entitások (YAML)",
    ed_entities_helper: "Felülírja az automatikus felismerést: entitásazonosítók vagy {entity, name, icon}",
    ed_thresholds: "Komfortküszöbök (YAML)",
    ed_thresholds_helper: "Típusonként, az érzékelő mértékegységében, pl. co2: [800, 1200] vagy humidity: [25, 35, 70, 80]",
    ed_rooms: "Helyiségek (YAML)",
    ed_rooms_helper: "Sorrend és testreszabás: {area, name, icon, navigation_path} elemek listája",
    ed_navigation_path: "Navigációs útvonal",
    ed_all_off_button: "„Minden kikapcsolása” gomb",
    err_config: "Állítsd be az `area` vagy az `entities` értékét",
    zoom_in: "A teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    ed_zoom: "Nagyítás gomb",
    ed_zoom_helper: "Vált a mini kártya és a teljes kártya között",
    rooms_all: "Minden helyiség megjelenítése",
    rooms_check: "Csak a figyelmet igénylő helyiségek",
    ed_sort: "Rendezés",
    ed_sort_name: "Név szerint",
    ed_exclude_areas: "Kihagyott helyiségek",
  },
  sk: {
    all_closed: "Všetko zatvorené",
    all_quiet: "Všetko pokojné",
    open_one: "Otvorené: {n}",
    open_many: "Otvorené: {n}",
    unavail_one: "Nedostupné: {n}",
    unavail_many: "Nedostupné: {n}",
    leak: "Únik vody",
    smoke: "Zistený dym",
    gas: "Zistený plyn",
    co: "Oxid uhoľnatý",
    detected: "Zistené",
    clear: "Nezistené",
    unavailable: "Nedostupné",
    on: "Zapnuté",
    off: "Vypnuté",
    turn_all_off: "Vypnúť všetko",
    ed_area: "Oblasť",
    ed_title: "Názov",
    ed_show_title: "Zobraziť názov",
    ed_title_helper: "Nechajte prázdne pre názov oblasti",
    ed_columns: "Stĺpce",
    ed_layout: "Rozloženie",
    ed_layout_helper: "Dlaždice: jedna veľká dlaždica na entitu ako karta Dlaždica, na telefóne sa ľahšie ťuká",
    ed_layout_compact: "Kompaktné",
    ed_layout_tiles: "Dlaždice",
    ed_advanced: "Rozšírené",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdne: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_entities: "Explicitné entity (YAML)",
    ed_entities_helper: "Nahrádza automatické vyhľadávanie: ID entít alebo {entity, name, icon}",
    ed_thresholds: "Prahy komfortu (YAML)",
    ed_thresholds_helper: "Podľa druhu, v jednotke senzora, napr. co2: [800, 1200] alebo humidity: [25, 35, 70, 80]",
    ed_rooms: "Miestnosti (YAML)",
    ed_rooms_helper: "Poradie a úpravy: zoznam {area, name, icon, navigation_path}",
    ed_navigation_path: "Navigačná cesta",
    ed_all_off_button: "Tlačidlo „Vypnúť všetko“",
    err_config: "Nastavte `area` alebo `entities`",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    ed_zoom: "Tlačidlo priblíženia",
    ed_zoom_helper: "Prepína minikartu na celú kartu a späť",
    rooms_all: "Zobraziť všetky miestnosti",
    rooms_check: "Len miestnosti vyžadujúce pozornosť",
    ed_sort: "Zoradenie",
    ed_sort_name: "Podľa názvu",
    ed_exclude_areas: "Vynechané miestnosti",
  },
  cs: {
    all_closed: "Vše zavřeno",
    all_quiet: "Vše v klidu",
    open_one: "Otevřeno: {n}",
    open_many: "Otevřeno: {n}",
    unavail_one: "Nedostupné: {n}",
    unavail_many: "Nedostupné: {n}",
    leak: "Únik vody",
    smoke: "Zjištěn kouř",
    gas: "Zjištěn plyn",
    co: "Oxid uhelnatý",
    detected: "Zjištěno",
    clear: "Nezjištěno",
    unavailable: "Nedostupné",
    on: "Zapnuto",
    off: "Vypnuto",
    turn_all_off: "Vypnout vše",
    ed_area: "Oblast",
    ed_title: "Název",
    ed_show_title: "Zobrazit název",
    ed_title_helper: "Ponechte prázdné pro název oblasti",
    ed_columns: "Sloupce",
    ed_layout: "Rozložení",
    ed_layout_helper: "Dlaždice: jedna velká dlaždice na entitu jako karta Dlaždice, na telefonu se snáz ťuká",
    ed_layout_compact: "Kompaktní",
    ed_layout_tiles: "Dlaždice",
    ed_advanced: "Pokročilé",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdné: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_entities: "Explicitní entity (YAML)",
    ed_entities_helper: "Nahrazuje automatické vyhledávání: ID entit nebo {entity, name, icon}",
    ed_thresholds: "Prahy komfortu (YAML)",
    ed_thresholds_helper: "Podle druhu, v jednotce senzoru, např. co2: [800, 1200] nebo humidity: [25, 35, 70, 80]",
    ed_rooms: "Místnosti (YAML)",
    ed_rooms_helper: "Pořadí a úpravy: seznam {area, name, icon, navigation_path}",
    ed_navigation_path: "Navigační cesta",
    ed_all_off_button: "Tlačítko „Vypnout vše“",
    err_config: "Nastavte `area` nebo `entities`",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    ed_zoom: "Tlačítko přiblížení",
    ed_zoom_helper: "Přepíná minikartu na celou kartu a zpět",
    rooms_all: "Zobrazit všechny místnosti",
    rooms_check: "Jen místnosti vyžadující pozornost",
    ed_sort: "Řazení",
    ed_sort_name: "Podle názvu",
    ed_exclude_areas: "Vynechané místnosti",
  },
  sl: {
    all_closed: "Vse zaprto",
    all_quiet: "Vse mirno",
    open_one: "Odprto: {n}",
    open_many: "Odprto: {n}",
    unavail_one: "Ni na voljo: {n}",
    unavail_many: "Ni na voljo: {n}",
    leak: "Puščanje vode",
    smoke: "Zaznan dim",
    gas: "Zaznan plin",
    co: "Ogljikov monoksid",
    detected: "Zaznano",
    clear: "Ni zaznano",
    unavailable: "Ni na voljo",
    on: "Vklopljeno",
    off: "Izklopljeno",
    turn_all_off: "Izklopi vse",
    ed_area: "Območje",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_title_helper: "Pustite prazno za ime območja",
    ed_columns: "Stolpci",
    ed_layout: "Postavitev",
    ed_layout_helper: "Ploščice: ena velika ploščica na entiteto, kot kartica Ploščica, lažje za dotik na telefonu",
    ed_layout_compact: "Strnjena",
    ed_layout_tiles: "Ploščice",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistanta",
    ed_language_auto: "Samodejno",
    ed_entities: "Izrecno navedene entitete (YAML)",
    ed_entities_helper: "Nadomesti samodejno zaznavanje: ID-ji entitet ali {entity, name, icon}",
    ed_thresholds: "Pragovi udobja (YAML)",
    ed_thresholds_helper: "Po vrsti, v enoti senzorja, npr. co2: [800, 1200] ali humidity: [25, 35, 70, 80]",
    ed_rooms: "Prostori (YAML)",
    ed_rooms_helper: "Vrstni red in prilagoditve: seznam {area, name, icon, navigation_path}",
    ed_navigation_path: "Navigacijska pot",
    ed_all_off_button: "Gumb »Izklopi vse«",
    err_config: "Nastavite `area` ali `entities`",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    ed_zoom: "Gumb za povečavo",
    ed_zoom_helper: "Preklopi mini kartico v celotno kartico in nazaj",
    rooms_all: "Prikaži vse prostore",
    rooms_check: "Samo prostori, ki potrebujejo pozornost",
    ed_sort: "Razvrščanje",
    ed_sort_name: "Po imenu",
    ed_exclude_areas: "Izpuščeni prostori",
  },
  lv: {
    all_closed: "Viss aizvērts",
    all_quiet: "Viss mierīgi",
    open_one: "Atvērti: {n}",
    open_many: "Atvērti: {n}",
    unavail_one: "Nav pieejami: {n}",
    unavail_many: "Nav pieejami: {n}",
    leak: "Ūdens noplūde",
    smoke: "Konstatēti dūmi",
    gas: "Konstatēta gāze",
    co: "Tvana gāze",
    detected: "Konstatēts",
    clear: "Nav konstatēts",
    unavailable: "Nav pieejams",
    on: "Ieslēgts",
    off: "Izslēgts",
    turn_all_off: "Izslēgt visu",
    ed_area: "Zona",
    ed_title: "Virsraksts",
    ed_show_title: "Rādīt virsrakstu",
    ed_title_helper: "Atstājiet tukšu, lai izmantotu zonas nosaukumu",
    ed_columns: "Kolonnas",
    ed_layout: "Izkārtojums",
    ed_layout_helper: "Flīzes: viena liela flīze katrai entītijai kā kartītē Flīze, tālrunī vieglāk pieskarties",
    ed_layout_compact: "Kompakts",
    ed_layout_tiles: "Flīzes",
    ed_advanced: "Papildu",
    ed_language: "Valoda",
    ed_language_helper: "Tukšs: Home Assistant valoda",
    ed_language_auto: "Automātiski",
    ed_entities: "Tieši norādītas vienības (YAML)",
    ed_entities_helper: "Aizstāj automātisko noteikšanu: vienību ID vai {entity, name, icon}",
    ed_thresholds: "Komforta sliekšņi (YAML)",
    ed_thresholds_helper: "Pēc veida, sensora mērvienībā, piem., co2: [800, 1200] vai humidity: [25, 35, 70, 80]",
    ed_rooms: "Telpas (YAML)",
    ed_rooms_helper: "Secība un pielāgojumi: saraksts ar {area, name, icon, navigation_path}",
    ed_navigation_path: "Navigācijas ceļš",
    ed_all_off_button: "Poga “Izslēgt visu”",
    err_config: "Iestatiet `area` vai `entities`",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    ed_zoom: "Tālummaiņas poga",
    ed_zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
    rooms_all: "Rādīt visas telpas",
    rooms_check: "Tikai telpas, kurām jāpievērš uzmanība",
    ed_sort: "Kārtošana",
    ed_sort_name: "Pēc nosaukuma",
    ed_exclude_areas: "Izslēdzamās telpas",
  },
  el: {
    all_closed: "Όλα κλειστά",
    all_quiet: "Όλα ήσυχα",
    open_one: "{n} ανοιχτό",
    open_many: "{n} ανοιχτά",
    unavail_one: "Μη διαθέσιμα: {n}",
    unavail_many: "Μη διαθέσιμα: {n}",
    leak: "Διαρροή νερού",
    smoke: "Ανιχνεύθηκε καπνός",
    gas: "Ανιχνεύθηκε αέριο",
    co: "Μονοξείδιο του άνθρακα",
    detected: "Ανιχνεύθηκε",
    clear: "Δεν ανιχνεύθηκε",
    unavailable: "Μη διαθέσιμο",
    on: "Ενεργή",
    off: "Ανενεργή",
    turn_all_off: "Απενεργοποίηση όλων",
    ed_area: "Περιοχή",
    ed_title: "Τίτλος",
    ed_show_title: "Εμφάνιση τίτλου",
    ed_title_helper: "Αφήστε το κενό για το όνομα της περιοχής",
    ed_columns: "Στήλες",
    ed_layout: "Διάταξη",
    ed_layout_helper: "Πλακίδια: ένα μεγάλο πλακίδιο ανά οντότητα, όπως η κάρτα Πλακίδιο, πιο εύκολο στο πάτημα στο κινητό",
    ed_layout_compact: "Συμπαγής",
    ed_layout_tiles: "Πλακίδια",
    ed_advanced: "Για προχωρημένους",
    ed_language: "Γλώσσα",
    ed_language_helper: "Κενό: η γλώσσα του Home Assistant",
    ed_language_auto: "Αυτόματα",
    ed_entities: "Ρητές οντότητες (YAML)",
    ed_entities_helper: "Αντικαθιστά τον αυτόματο εντοπισμό: αναγνωριστικά οντοτήτων ή {entity, name, icon}",
    ed_thresholds: "Όρια άνεσης (YAML)",
    ed_thresholds_helper: "Ανά είδος, στη μονάδα του αισθητήρα, π.χ. co2: [800, 1200] ή humidity: [25, 35, 70, 80]",
    ed_rooms: "Δωμάτια (YAML)",
    ed_rooms_helper: "Σειρά και προσαρμογές: μια λίστα με {area, name, icon, navigation_path}",
    ed_navigation_path: "Διαδρομή πλοήγησης",
    ed_all_off_button: "Κουμπί «Απενεργοποίηση όλων»",
    err_config: "Ορίστε `area` ή `entities`",
    zoom_in: "Εμφάνιση της πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    ed_zoom: "Κουμπί ζουμ",
    ed_zoom_helper: "Εναλλάσσει τη μίνι κάρτα με την πλήρη κάρτα",
    rooms_all: "Εμφάνιση όλων των δωματίων",
    rooms_check: "Μόνο τα δωμάτια που χρειάζονται έλεγχο",
    ed_sort: "Ταξινόμηση",
    ed_sort_name: "Κατά όνομα",
    ed_exclude_areas: "Δωμάτια προς εξαίρεση",
  },
};

// ── Game consoles ────────────────────────────────────────────────────────────
// A console is the media player of the PlayStation Network or Xbox integration, the power switch or activity sensor of
// a PS5-MQTT console, or a Nintendo Switch of the Nintendo Switch Parental Controls integration. The other entities
// that complete it (the account's trophies or Gamerscore, the storage, the screen time…) are found by their
// translation key, on the console's device, its account's device or the integration's other devices; when the
// registry has no translation key, by their entity ID and name. `entities` overrides any role.
// The state is brought down to: playing, online, standby, suspended, time_up; `offline` when the console cannot report.

// The integrations, by registry platform.
const CC_PLATFORMS = { playstation_network: "playstation", xbox: "xbox", nintendo_parental_controls: "switch" };
// PS5-MQTT (an add-on publishing over MQTT): a console by its name, model or manufacturer.
const CC_PS_NAME = /ps5|ps4|playstation|sony/i;

const ccNorm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_");
const ccText = (hass, id) => `${id} ${hass.states[id]?.attributes.friendly_name || ""}`;
const ccNum = (st) => {
  if (!st || rcUnavailable(st)) return null;
  const n = Number.parseFloat(st.state);
  return Number.isFinite(n) ? n : null;
};

// Every entity of each device, in registry order; and each integration's entities.
const ccDeviceEntities = rcPerRegistry((hass) => {
  const out = {};
  for (const [id, e] of Object.entries(hass.entities || {})) if (e.device_id) (out[e.device_id] ||= []).push(id);
  return out;
});
const ccPlatformEntities = rcPerRegistry((hass) => {
  const out = {};
  for (const [id, e] of Object.entries(hass.entities || {})) (out[e.platform] ||= []).push(id);
  return out;
});
const ccDeviceOf = (hass, id) => hass.entities?.[id]?.device_id;

// The platform of an entity: playstation, xbox or switch, from its integration (PS5-MQTT: mqtt, named like a console).
const ccPlatformOf = (hass, id) => {
  const e = hass.entities?.[id];
  if (!e) return undefined;
  if (CC_PLATFORMS[e.platform]) return CC_PLATFORMS[e.platform];
  if (e.platform !== "mqtt") return undefined;
  const dev = hass.devices?.[e.device_id];
  return CC_PS_NAME.test(`${ccText(hass, id)} ${dev?.name || ""} ${dev?.model || ""} ${dev?.manufacturer || ""}`) ? "playstation" : undefined;
};

// A PS5-MQTT entity: the console's power switch, or its activity sensor.
const ccMqttRole = (hass, id) => {
  if (ccPlatformOf(hass, id) !== "playstation" || hass.entities?.[id]?.platform !== "mqtt") return undefined;
  if (id.startsWith("switch.")) return "power";
  if (id.startsWith("sensor.") && /activit/i.test(ccText(hass, id))) return "activity";
  return undefined;
};

// The consoles of the home, one entity each, playing first: the PlayStation and Xbox media players, the PS5-MQTT
// consoles that no media player stands for, then the Nintendo Switches (one per device).
const ccConsoles = (hass) => {
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
const CC_ROLES = {
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
const CC_DOMAINS = {
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
const ccPick = (hass, ids, role, [key, re]) => {
  const domains = CC_DOMAINS[role] || ["sensor"];
  const ok = ids.filter((id) => domains.includes(id.split(".")[0]) && hass.states[id]);
  return ok.find((id) => hass.entities?.[id]?.translation_key === key) || ok.find((id) => !hass.entities?.[id]?.translation_key && re.test(ccNorm(ccText(hass, id))));
};

// The account's device: the PlayStation console's parent device (via_device_id), else the integration's device with a
// trophy level; for Xbox, the device with a Gamerscore that plays what the console shows, else the first one.
const ccAccount = (hass, id, platform) => {
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
const ccFind = (hass, id, overrides = {}) => {
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

// The model drawn: ps5, ps4, xsx, xss, xone or switch, from the device's model and name.
const ccModel = (platform, text) => {
  const t = ccNorm(text);
  if (platform === "xbox") return /series_?s/.test(t) ? "xss" : /one/.test(t) ? "xone" : "xsx";
  if (platform === "switch") return /switch_?2|_2$|bee/.test(t) ? "switch2" : "switch";
  return /ps4|playstation_4|ps3|playstation_3|vita/.test(t) ? "ps4" : "ps5";
};

// A duration in minutes, cut into hours and minutes.
const ccHm = (mins) => ({ h: Math.floor(Math.max(0, mins) / 60), m: Math.round(Math.max(0, mins) % 60) });

// A duration sensor in minutes, in its unit (d, h, min, s, ms); no unit: hours, history_stats' default.
const ccMinutes = (st) => {
  const n = ccNum(st);
  if (n == null) return null;
  const k = { d: 1440, h: 60, min: 1, s: 1 / 60, ms: 1 / 60000 }[st.attributes?.unit_of_measurement || "h"];
  return k == null ? null : Math.max(0, n * k);
};

// Whether a state of the history plays: the media player playing or paused (on Xbox, a game, not an app), the PS5-MQTT
// activity *playing* — the card's own rule for the playing state.
const ccPlays = (role, state, attrs, platform) =>
  role === "activity" ? ccNorm(state) === "playing" : (state === "playing" || state === "paused") && !(platform === "xbox" && attrs?.media_content_type === "app");

// The minutes played between `from` and `to` (ms), from the compressed answer of history/history_during_period
// ({ entity_id: [{ s, a, lu, lc }] }, times in seconds) for `ids` ({ role: entity_id }): the spans of every role,
// overlapping ones counted once (the PSN media player and the PS5-MQTT activity both see the same game).
const ccPlayedMinutes = (hist, ids, platform, from, to) => {
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

// Strings of the console cards; the shared ones above (unavailable, editor basics) complete them.
const CC_I18N = {
  en: {
    title: "Game console",
    st_playing: "Playing",
    st_online: "Online",
    st_standby: "Standby",
    st_suspended: "Suspended",
    st_time_up: "Time's up",
    st_offline: "Offline",
    now_playing: "Now playing",
    in_app: "App",
    home_screen: "Home screen",
    not_playing: "Not playing",
    since: "For {d}",
    last_seen: "Last seen {d}",
    t_level: "Trophy level",
    level: "Level {n}",
    next_level: "{n}% to next level",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Active",
    sub_off: "Inactive",
    t_status: "Status",
    t_gamerscore: "Gamerscore",
    t_party: "Party",
    t_friends: "Friends",
    t_storage: "Storage",
    storage_free: "{f} free",
    achievements: "{n} achievements",
    t_bedtime: "Bedtime",
    t_restriction: "Restrictions",
    t_software: "Software",
    sw_allowed: "Allowed",
    sw_suspended: "Suspended",
    t_bonus: "Bonus time",
    t_play_time: "Played today",
    platinum: "Platinum",
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze",
    screen_today: "Screen time today",
    of_limit: "of {t}",
    left: "{t} left",
    no_limit: "No limit",
    bonus: "+{n} min",
    suspend: "Suspend",
    resume: "Resume",
    turn_on: "Turn on",
    turn_off: "Turn off",
    home: "Home",
    dur_hm: "{h} h {m} min",
    dur_h: "{h} h",
    dur_m: "{m} min",
    no_console: "No game console found",
    ed_entity: "Console",
    ed_entity_helper: "A PlayStation Network or Xbox media player, a PS5-MQTT power switch, or an entity of a Nintendo Switch (parental controls)",
    ed_power: "Power switch",
    ed_power_helper: "Turns the console on and off (PS5-MQTT), when the card does not find it",
    ed_bonus_minutes: "Bonus time",
    ed_bonus_minutes_helper: "Minutes added by the Switch's bonus button (5 to 30)",
    ed_play_time: "Play time sensor",
    ed_play_time_helper: "Today's play time from a sensor (e.g. history_stats); empty: counted from the history",
    ed_show_play_time: "Play time today",
    ed_show_trophies: "Trophies",
    ed_show_controls: "Controls",
    ed_animations: "Animations",
    ed_illustration: "Illustrated header",
    ed_illustration_theme: "Header theme",
    ed_theme_auto: "Automatic (follows the theme)",
    ed_theme_day: "Day",
    ed_theme_night: "Night",
    ed_title_helper: "Empty: the console's name",
    ed_entities: "Entities (YAML)",
    ed_entities_helper: "Overrides of the found entities, by role: media, power, activity, trophy_level, gamerscore, time_remaining… (see the README)",
  },
  fr: {
    title: "Console de jeu",
    st_playing: "En jeu",
    st_online: "En ligne",
    st_standby: "En veille",
    st_suspended: "Suspendue",
    st_time_up: "Temps écoulé",
    st_offline: "Hors ligne",
    now_playing: "En cours",
    in_app: "Application",
    home_screen: "Écran d'accueil",
    not_playing: "Aucun jeu en cours",
    since: "Depuis {d}",
    last_seen: "Vue {d}",
    t_level: "Niveau de trophées",
    level: "Niveau {n}",
    next_level: "{n} % vers le niveau suivant",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Actif",
    sub_off: "Inactif",
    t_status: "Statut",
    t_gamerscore: "Gamerscore",
    t_party: "Groupe",
    t_friends: "Amis",
    t_storage: "Stockage",
    storage_free: "{f} libres",
    achievements: "{n} succès",
    t_bedtime: "Coucher",
    t_restriction: "Restrictions",
    t_software: "Logiciel",
    sw_allowed: "Autorisé",
    sw_suspended: "Suspendu",
    t_bonus: "Temps bonus",
    t_play_time: "Joué aujourd'hui",
    platinum: "Platine",
    gold: "Or",
    silver: "Argent",
    bronze: "Bronze",
    screen_today: "Temps d'écran aujourd'hui",
    of_limit: "sur {t}",
    left: "{t} restantes",
    no_limit: "Sans limite",
    bonus: "+{n} min",
    suspend: "Suspendre",
    resume: "Reprendre",
    turn_on: "Allumer",
    turn_off: "Éteindre",
    home: "Accueil",
    dur_hm: "{h} h {m} min",
    dur_h: "{h} h",
    dur_m: "{m} min",
    no_console: "Aucune console de jeu trouvée",
    ed_entity: "Console",
    ed_entity_helper: "Un lecteur multimédia PlayStation Network ou Xbox, l'interrupteur d'une console PS5-MQTT, ou une entité d'une Nintendo Switch (contrôle parental)",
    ed_power: "Interrupteur d'alimentation",
    ed_power_helper: "Allume et éteint la console (PS5-MQTT), quand la carte ne le trouve pas",
    ed_bonus_minutes: "Temps bonus",
    ed_bonus_minutes_helper: "Minutes ajoutées par le bouton bonus de la Switch (5 à 30)",
    ed_play_time: "Capteur de temps de jeu",
    ed_play_time_helper: "Temps de jeu du jour lu dans un capteur (ex. history_stats) ; vide : compté depuis l'historique",
    ed_show_play_time: "Temps de jeu du jour",
    ed_show_trophies: "Trophées",
    ed_show_controls: "Commandes",
    ed_animations: "Animations",
    ed_illustration: "En-tête illustré",
    ed_illustration_theme: "Thème de l'en-tête",
    ed_theme_auto: "Automatique (suit le thème)",
    ed_theme_day: "Jour",
    ed_theme_night: "Nuit",
    ed_title_helper: "Vide : le nom de la console",
    ed_entities: "Entités (YAML)",
    ed_entities_helper: "Remplace les entités trouvées, par rôle : media, power, activity, trophy_level, gamerscore, time_remaining… (voir le README)",
  },
  de: {
    title: "Spielkonsole",
    st_playing: "Im Spiel",
    st_online: "Online",
    st_standby: "Standby",
    st_suspended: "Angehalten",
    st_time_up: "Zeit abgelaufen",
    st_offline: "Offline",
    now_playing: "Läuft gerade",
    in_app: "App",
    home_screen: "Startbildschirm",
    not_playing: "Kein Spiel aktiv",
    since: "Seit {d}",
    last_seen: "Zuletzt gesehen {d}",
    t_level: "Trophäen-Stufe",
    level: "Stufe {n}",
    next_level: "{n} % bis zur nächsten Stufe",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Aktiv",
    sub_off: "Inaktiv",
    t_status: "Status",
    t_gamerscore: "Gamerscore",
    t_party: "Party",
    t_friends: "Freunde",
    t_storage: "Speicher",
    storage_free: "{f} frei",
    achievements: "{n} Erfolge",
    t_bedtime: "Schlafenszeit",
    t_restriction: "Einschränkungen",
    t_software: "Software",
    sw_allowed: "Erlaubt",
    sw_suspended: "Angehalten",
    t_bonus: "Bonuszeit",
    t_play_time: "Heute gespielt",
    platinum: "Platin",
    gold: "Gold",
    silver: "Silber",
    bronze: "Bronze",
    screen_today: "Bildschirmzeit heute",
    of_limit: "von {t}",
    left: "noch {t}",
    no_limit: "Kein Limit",
    bonus: "+{n} Min.",
    suspend: "Anhalten",
    resume: "Fortsetzen",
    turn_on: "Einschalten",
    turn_off: "Ausschalten",
    home: "Start",
    dur_hm: "{h} Std. {m} Min.",
    dur_h: "{h} Std.",
    dur_m: "{m} Min.",
    no_console: "Keine Spielkonsole gefunden",
    ed_entity: "Konsole",
    ed_entity_helper: "Ein Mediaplayer von PlayStation Network oder Xbox, der Netzschalter einer PS5-MQTT-Konsole oder eine Entität einer Nintendo Switch (Jugendschutz)",
    ed_power: "Netzschalter",
    ed_power_helper: "Schaltet die Konsole ein und aus (PS5-MQTT), wenn die Karte ihn nicht findet",
    ed_bonus_minutes: "Bonuszeit",
    ed_bonus_minutes_helper: "Minuten, die die Bonus-Taste der Switch hinzufügt (5 bis 30)",
    ed_play_time: "Spielzeit-Sensor",
    ed_play_time_helper: "Heutige Spielzeit aus einem Sensor (z. B. history_stats); leer: aus dem Verlauf gezählt",
    ed_show_play_time: "Spielzeit heute",
    ed_show_trophies: "Trophäen",
    ed_show_controls: "Bedienelemente",
    ed_animations: "Animationen",
    ed_illustration: "Illustrierter Kopfbereich",
    ed_illustration_theme: "Design des Kopfbereichs",
    ed_theme_auto: "Automatisch (folgt dem Design)",
    ed_theme_day: "Tag",
    ed_theme_night: "Nacht",
    ed_title_helper: "Leer: der Name der Konsole",
    ed_entities: "Entitäten (YAML)",
    ed_entities_helper: "Ersetzt die gefundenen Entitäten, nach Rolle: media, power, activity, trophy_level, gamerscore, time_remaining… (siehe README)",
  },
  es: {
    title: "Consola",
    st_playing: "Jugando",
    st_online: "En línea",
    st_standby: "En reposo",
    st_suspended: "Suspendida",
    st_time_up: "Se acabó el tiempo",
    st_offline: "Desconectada",
    now_playing: "Jugando ahora",
    in_app: "Aplicación",
    home_screen: "Pantalla de inicio",
    not_playing: "Sin juego",
    since: "Desde hace {d}",
    last_seen: "Vista {d}",
    t_level: "Nivel de trofeos",
    level: "Nivel {n}",
    next_level: "{n} % hasta el siguiente nivel",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Activa",
    sub_off: "Inactiva",
    t_status: "Estado",
    t_gamerscore: "Gamerscore",
    t_party: "Grupo",
    t_friends: "Amigos",
    t_storage: "Almacenamiento",
    storage_free: "{f} libres",
    achievements: "{n} logros",
    t_bedtime: "Hora de dormir",
    t_restriction: "Restricciones",
    t_software: "Software",
    sw_allowed: "Permitido",
    sw_suspended: "Suspendido",
    t_bonus: "Tiempo extra",
    t_play_time: "Jugado hoy",
    platinum: "Platino",
    gold: "Oro",
    silver: "Plata",
    bronze: "Bronce",
    screen_today: "Tiempo de pantalla hoy",
    of_limit: "de {t}",
    left: "quedan {t}",
    no_limit: "Sin límite",
    bonus: "+{n} min",
    suspend: "Suspender",
    resume: "Reanudar",
    turn_on: "Encender",
    turn_off: "Apagar",
    home: "Inicio",
    dur_hm: "{h} h {m} min",
    dur_h: "{h} h",
    dur_m: "{m} min",
    no_console: "No se ha encontrado ninguna consola",
    ed_entity: "Consola",
    ed_entity_helper: "Un reproductor de PlayStation Network o Xbox, el interruptor de una consola PS5-MQTT o una entidad de una Nintendo Switch (control parental)",
    ed_power: "Interruptor de encendido",
    ed_power_helper: "Enciende y apaga la consola (PS5-MQTT) cuando la tarjeta no lo encuentra",
    ed_bonus_minutes: "Tiempo extra",
    ed_bonus_minutes_helper: "Minutos que añade el botón de tiempo extra de la Switch (de 5 a 30)",
    ed_play_time: "Sensor de tiempo de juego",
    ed_play_time_helper: "Tiempo de juego de hoy desde un sensor (p. ej. history_stats); vacío: contado desde el historial",
    ed_show_play_time: "Tiempo de juego de hoy",
    ed_show_trophies: "Trofeos",
    ed_show_controls: "Controles",
    ed_animations: "Animaciones",
    ed_illustration: "Encabezado ilustrado",
    ed_illustration_theme: "Tema del encabezado",
    ed_theme_auto: "Automático (sigue el tema)",
    ed_theme_day: "Día",
    ed_theme_night: "Noche",
    ed_title_helper: "Vacío: el nombre de la consola",
    ed_entities: "Entidades (YAML)",
    ed_entities_helper: "Sustituye las entidades encontradas, por función: media, power, activity, trophy_level, gamerscore, time_remaining… (ver el README)",
  },
  sr: {
    title: "Конзола за игре",
    st_playing: "Игра",
    st_online: "На мрежи",
    st_standby: "У мировању",
    st_suspended: "Паузирано",
    st_time_up: "Време је истекло",
    st_offline: "Ван мреже",
    now_playing: "Тренутно се игра",
    in_app: "Апликација",
    home_screen: "Почетни екран",
    not_playing: "Ниједна игра",
    since: "Већ {d}",
    last_seen: "Последњи пут виђена {d}",
    t_level: "Ниво трофеја",
    level: "Ниво {n}",
    next_level: "{n}% до следећег нивоа",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Активна",
    sub_off: "Неактивна",
    t_status: "Статус",
    t_gamerscore: "Gamerscore",
    t_party: "Група",
    t_friends: "Пријатељи",
    t_storage: "Складиште",
    storage_free: "{f} слободно",
    achievements: "Достигнућа: {n}",
    t_bedtime: "Време за спавање",
    t_restriction: "Ограничења",
    t_software: "Софтвер",
    sw_allowed: "Дозвољен",
    sw_suspended: "Паузиран",
    t_bonus: "Додатно време",
    t_play_time: "Играно данас",
    platinum: "Платина",
    gold: "Злато",
    silver: "Сребро",
    bronze: "Бронза",
    screen_today: "Време пред екраном данас",
    of_limit: "од {t}",
    left: "Преостало {t}",
    no_limit: "Без ограничења",
    bonus: "+{n} мин",
    suspend: "Паузирај",
    resume: "Настави",
    turn_on: "Укључи",
    turn_off: "Искључи",
    home: "Почетна",
    dur_hm: "{h} ч {m} мин",
    dur_h: "{h} ч",
    dur_m: "{m} мин",
    no_console: "Није пронађена ниједна конзола",
    ed_entity: "Конзола",
    ed_entity_helper: "Медијски плејер PlayStation Network или Xbox, прекидач PS5-MQTT конзоле или ентитет Nintendo Switch-а (родитељски надзор)",
    ed_power: "Прекидач напајања",
    ed_power_helper: "Укључује и искључује конзолу (PS5-MQTT) када га картица не пронађе",
    ed_bonus_minutes: "Додатно време",
    ed_bonus_minutes_helper: "Минути које додаје дугме за додатно време на Switch-у (од 5 до 30)",
    ed_play_time: "Сензор времена играња",
    ed_play_time_helper: "Данашње време играња из сензора (нпр. history_stats); празно: рачуна се из историје",
    ed_show_play_time: "Време играња данас",
    ed_show_trophies: "Трофеји",
    ed_show_controls: "Контроле",
    ed_animations: "Анимације",
    ed_illustration: "Илустровано заглавље",
    ed_illustration_theme: "Тема заглавља",
    ed_theme_auto: "Аутоматски (прати тему)",
    ed_theme_day: "Дан",
    ed_theme_night: "Ноћ",
    ed_title_helper: "Празно: назив конзоле",
    ed_entities: "Ентитети (YAML)",
    ed_entities_helper: "Замењује пронађене ентитете, по улози: media, power, activity, trophy_level, gamerscore, time_remaining… (погледајте README)",
  },
  "sr-Latn": {
    title: "Konzola za igre",
    st_playing: "Igra",
    st_online: "Na mreži",
    st_standby: "U mirovanju",
    st_suspended: "Pauzirano",
    st_time_up: "Vreme je isteklo",
    st_offline: "Van mreže",
    now_playing: "Trenutno se igra",
    in_app: "Aplikacija",
    home_screen: "Početni ekran",
    not_playing: "Nijedna igra",
    since: "Već {d}",
    last_seen: "Poslednji put viđena {d}",
    t_level: "Nivo trofeja",
    level: "Nivo {n}",
    next_level: "{n}% do sledećeg nivoa",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Aktivna",
    sub_off: "Neaktivna",
    t_status: "Status",
    t_gamerscore: "Gamerscore",
    t_party: "Grupa",
    t_friends: "Prijatelji",
    t_storage: "Skladište",
    storage_free: "{f} slobodno",
    achievements: "Dostignuća: {n}",
    t_bedtime: "Vreme za spavanje",
    t_restriction: "Ograničenja",
    t_software: "Softver",
    sw_allowed: "Dozvoljen",
    sw_suspended: "Pauziran",
    t_bonus: "Dodatno vreme",
    t_play_time: "Igrano danas",
    platinum: "Platina",
    gold: "Zlato",
    silver: "Srebro",
    bronze: "Bronza",
    screen_today: "Vreme pred ekranom danas",
    of_limit: "od {t}",
    left: "Preostalo {t}",
    no_limit: "Bez ograničenja",
    bonus: "+{n} min",
    suspend: "Pauziraj",
    resume: "Nastavi",
    turn_on: "Uključi",
    turn_off: "Isključi",
    home: "Početna",
    dur_hm: "{h} č {m} min",
    dur_h: "{h} č",
    dur_m: "{m} min",
    no_console: "Nije pronađena nijedna konzola",
    ed_entity: "Konzola",
    ed_entity_helper: "Medijski plejer PlayStation Network ili Xbox, prekidač PS5-MQTT konzole ili entitet Nintendo Switch-a (roditeljski nadzor)",
    ed_power: "Prekidač napajanja",
    ed_power_helper: "Uključuje i isključuje konzolu (PS5-MQTT) kada ga kartica ne pronađe",
    ed_bonus_minutes: "Dodatno vreme",
    ed_bonus_minutes_helper: "Minuti koje dodaje dugme za dodatno vreme na Switch-u (od 5 do 30)",
    ed_play_time: "Senzor vremena igranja",
    ed_play_time_helper: "Današnje vreme igranja iz senzora (npr. history_stats); prazno: računa se iz istorije",
    ed_show_play_time: "Vreme igranja danas",
    ed_show_trophies: "Trofeji",
    ed_show_controls: "Kontrole",
    ed_animations: "Animacije",
    ed_illustration: "Ilustrovano zaglavlje",
    ed_illustration_theme: "Tema zaglavlja",
    ed_theme_auto: "Automatski (prati temu)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noć",
    ed_title_helper: "Prazno: naziv konzole",
    ed_entities: "Entiteti (YAML)",
    ed_entities_helper: "Zamenjuje pronađene entitete, po ulozi: media, power, activity, trophy_level, gamerscore, time_remaining… (pogledajte README)",
  },
  it: {
    title: "Console",
    st_playing: "In gioco",
    st_online: "Online",
    st_standby: "In standby",
    st_suspended: "Sospesa",
    st_time_up: "Tempo scaduto",
    st_offline: "Offline",
    now_playing: "In corso",
    in_app: "App",
    home_screen: "Schermata Home",
    not_playing: "Nessun gioco",
    since: "Da {d}",
    last_seen: "Vista {d}",
    t_level: "Livello trofei",
    level: "Livello {n}",
    next_level: "{n}% al livello successivo",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Attivo",
    sub_off: "Non attivo",
    t_status: "Stato",
    t_gamerscore: "Gamerscore",
    t_party: "Party",
    t_friends: "Amici",
    t_storage: "Archiviazione",
    storage_free: "{f} liberi",
    achievements: "{n} obiettivi",
    t_bedtime: "Ora di dormire",
    t_restriction: "Restrizioni",
    t_software: "Software",
    sw_allowed: "Consentito",
    sw_suspended: "Sospeso",
    t_bonus: "Tempo extra",
    t_play_time: "Giocato oggi",
    platinum: "Platino",
    gold: "Oro",
    silver: "Argento",
    bronze: "Bronzo",
    screen_today: "Tempo davanti allo schermo oggi",
    of_limit: "su {t}",
    left: "{t} rimanenti",
    no_limit: "Nessun limite",
    bonus: "+{n} min",
    suspend: "Sospendi",
    resume: "Riprendi",
    turn_on: "Accendi",
    turn_off: "Spegni",
    home: "Home",
    dur_hm: "{h} h {m} min",
    dur_h: "{h} h",
    dur_m: "{m} min",
    no_console: "Nessuna console trovata",
    ed_entity: "Console",
    ed_entity_helper: "Un lettore multimediale PlayStation Network o Xbox, l'interruttore di una console PS5-MQTT o un'entità di una Nintendo Switch (controllo parentale)",
    ed_power: "Interruttore di alimentazione",
    ed_power_helper: "Accende e spegne la console (PS5-MQTT) quando la scheda non lo trova",
    ed_bonus_minutes: "Tempo extra",
    ed_bonus_minutes_helper: "Minuti aggiunti dal pulsante tempo extra della Switch (da 5 a 30)",
    ed_play_time: "Sensore del tempo di gioco",
    ed_play_time_helper: "Tempo di gioco di oggi da un sensore (es. history_stats); vuoto: calcolato dalla cronologia",
    ed_show_play_time: "Tempo di gioco di oggi",
    ed_show_trophies: "Trofei",
    ed_show_controls: "Comandi",
    ed_animations: "Animazioni",
    ed_illustration: "Intestazione illustrata",
    ed_illustration_theme: "Tema dell'intestazione",
    ed_theme_auto: "Automatico (segue il tema)",
    ed_theme_day: "Giorno",
    ed_theme_night: "Notte",
    ed_title_helper: "Vuoto: il nome della console",
    ed_entities: "Entità (YAML)",
    ed_entities_helper: "Sostituisce le entità trovate, per ruolo: media, power, activity, trophy_level, gamerscore, time_remaining… (vedi il README)",
  },
  nl: {
    title: "Gameconsole",
    st_playing: "Aan het spelen",
    st_online: "Online",
    st_standby: "Stand-by",
    st_suspended: "Gepauzeerd",
    st_time_up: "Tijd is op",
    st_offline: "Offline",
    now_playing: "Speelt nu",
    in_app: "App",
    home_screen: "Startscherm",
    not_playing: "Geen game actief",
    since: "Al {d}",
    last_seen: "Laatst gezien {d}",
    t_level: "Trofeeniveau",
    level: "Niveau {n}",
    next_level: "{n}% tot het volgende niveau",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Actief",
    sub_off: "Niet actief",
    t_status: "Status",
    t_gamerscore: "Gamerscore",
    t_party: "Party",
    t_friends: "Vrienden",
    t_storage: "Opslag",
    storage_free: "{f} vrij",
    achievements: "{n} prestaties",
    t_bedtime: "Bedtijd",
    t_restriction: "Beperkingen",
    t_software: "Software",
    sw_allowed: "Toegestaan",
    sw_suspended: "Gepauzeerd",
    t_bonus: "Extra tijd",
    t_play_time: "Vandaag gespeeld",
    platinum: "Platina",
    gold: "Goud",
    silver: "Zilver",
    bronze: "Brons",
    screen_today: "Schermtijd vandaag",
    of_limit: "van {t}",
    left: "nog {t}",
    no_limit: "Geen limiet",
    bonus: "+{n} min",
    suspend: "Pauzeren",
    resume: "Hervatten",
    turn_on: "Aanzetten",
    turn_off: "Uitzetten",
    home: "Start",
    dur_hm: "{h} u {m} min",
    dur_h: "{h} u",
    dur_m: "{m} min",
    no_console: "Geen gameconsole gevonden",
    ed_entity: "Console",
    ed_entity_helper: "Een mediaspeler van PlayStation Network of Xbox, de aan/uit-schakelaar van een PS5-MQTT-console of een entiteit van een Nintendo Switch (ouderlijk toezicht)",
    ed_power: "Aan/uit-schakelaar",
    ed_power_helper: "Zet de console aan en uit (PS5-MQTT) als de kaart hem niet vindt",
    ed_bonus_minutes: "Extra tijd",
    ed_bonus_minutes_helper: "Minuten die de extra-tijdknop van de Switch toevoegt (5 tot 30)",
    ed_play_time: "Speeltijdsensor",
    ed_play_time_helper: "Speeltijd van vandaag uit een sensor (bijv. history_stats); leeg: geteld uit de geschiedenis",
    ed_show_play_time: "Speeltijd vandaag",
    ed_show_trophies: "Trofeeën",
    ed_show_controls: "Bediening",
    ed_animations: "Animaties",
    ed_illustration: "Geïllustreerde koptekst",
    ed_illustration_theme: "Thema van de koptekst",
    ed_theme_auto: "Automatisch (volgt het thema)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nacht",
    ed_title_helper: "Leeg: de naam van de console",
    ed_entities: "Entiteiten (YAML)",
    ed_entities_helper: "Vervangt de gevonden entiteiten, per rol: media, power, activity, trophy_level, gamerscore, time_remaining… (zie de README)",
  },
  pt: {
    title: "Consola",
    st_playing: "A jogar",
    st_online: "Online",
    st_standby: "Em repouso",
    st_suspended: "Suspensa",
    st_time_up: "Tempo esgotado",
    st_offline: "Offline",
    now_playing: "A jogar agora",
    in_app: "Aplicação",
    home_screen: "Ecrã inicial",
    not_playing: "Nenhum jogo",
    since: "Há {d}",
    last_seen: "Vista {d}",
    t_level: "Nível de troféus",
    level: "Nível {n}",
    next_level: "{n}% até ao próximo nível",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Ativa",
    sub_off: "Inativa",
    t_status: "Estado",
    t_gamerscore: "Gamerscore",
    t_party: "Grupo",
    t_friends: "Amigos",
    t_storage: "Armazenamento",
    storage_free: "{f} livres",
    achievements: "{n} conquistas",
    t_bedtime: "Hora de dormir",
    t_restriction: "Restrições",
    t_software: "Software",
    sw_allowed: "Permitido",
    sw_suspended: "Suspenso",
    t_bonus: "Tempo extra",
    t_play_time: "Jogado hoje",
    platinum: "Platina",
    gold: "Ouro",
    silver: "Prata",
    bronze: "Bronze",
    screen_today: "Tempo de ecrã hoje",
    of_limit: "de {t}",
    left: "faltam {t}",
    no_limit: "Sem limite",
    bonus: "+{n} min",
    suspend: "Suspender",
    resume: "Retomar",
    turn_on: "Ligar",
    turn_off: "Desligar",
    home: "Início",
    dur_hm: "{h} h {m} min",
    dur_h: "{h} h",
    dur_m: "{m} min",
    no_console: "Nenhuma consola encontrada",
    ed_entity: "Consola",
    ed_entity_helper: "Um leitor multimédia PlayStation Network ou Xbox, o interruptor de uma consola PS5-MQTT ou uma entidade de uma Nintendo Switch (controlo parental)",
    ed_power: "Interruptor de alimentação",
    ed_power_helper: "Liga e desliga a consola (PS5-MQTT) quando o cartão não o encontra",
    ed_bonus_minutes: "Tempo extra",
    ed_bonus_minutes_helper: "Minutos acrescentados pelo botão de tempo extra da Switch (de 5 a 30)",
    ed_play_time: "Sensor de tempo de jogo",
    ed_play_time_helper: "Tempo de jogo de hoje a partir de um sensor (p. ex. history_stats); vazio: contado a partir do histórico",
    ed_show_play_time: "Tempo de jogo de hoje",
    ed_show_trophies: "Troféus",
    ed_show_controls: "Controlos",
    ed_animations: "Animações",
    ed_illustration: "Cabeçalho ilustrado",
    ed_illustration_theme: "Tema do cabeçalho",
    ed_theme_auto: "Automático (segue o tema)",
    ed_theme_day: "Dia",
    ed_theme_night: "Noite",
    ed_title_helper: "Vazio: o nome da consola",
    ed_entities: "Entidades (YAML)",
    ed_entities_helper: "Substitui as entidades encontradas, por função: media, power, activity, trophy_level, gamerscore, time_remaining… (ver o README)",
  },
  pl: {
    title: "Konsola do gier",
    st_playing: "W grze",
    st_online: "Online",
    st_standby: "W trybie czuwania",
    st_suspended: "Wstrzymana",
    st_time_up: "Czas minął",
    st_offline: "Offline",
    now_playing: "Teraz gra",
    in_app: "Aplikacja",
    home_screen: "Ekran główny",
    not_playing: "Brak gry",
    since: "Od {d}",
    last_seen: "Ostatnio widziana {d}",
    t_level: "Poziom trofeów",
    level: "Poziom {n}",
    next_level: "{n}% do następnego poziomu",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Aktywna",
    sub_off: "Nieaktywna",
    t_status: "Status",
    t_gamerscore: "Gamerscore",
    t_party: "Grupa",
    t_friends: "Znajomi",
    t_storage: "Pamięć",
    storage_free: "{f} wolne",
    achievements: "Osiągnięcia: {n}",
    t_bedtime: "Pora snu",
    t_restriction: "Ograniczenia",
    t_software: "Oprogramowanie",
    sw_allowed: "Dozwolone",
    sw_suspended: "Wstrzymane",
    t_bonus: "Dodatkowy czas",
    t_play_time: "Grano dziś",
    platinum: "Platyna",
    gold: "Złoto",
    silver: "Srebro",
    bronze: "Brąz",
    screen_today: "Czas przed ekranem dziś",
    of_limit: "z {t}",
    left: "Zostało {t}",
    no_limit: "Bez limitu",
    bonus: "+{n} min",
    suspend: "Wstrzymaj",
    resume: "Wznów",
    turn_on: "Włącz",
    turn_off: "Wyłącz",
    home: "Start",
    dur_hm: "{h} godz. {m} min",
    dur_h: "{h} godz.",
    dur_m: "{m} min",
    no_console: "Nie znaleziono konsoli do gier",
    ed_entity: "Konsola",
    ed_entity_helper: "Odtwarzacz multimediów PlayStation Network lub Xbox, przełącznik konsoli PS5-MQTT albo encja konsoli Nintendo Switch (kontrola rodzicielska)",
    ed_power: "Przełącznik zasilania",
    ed_power_helper: "Włącza i wyłącza konsolę (PS5-MQTT), gdy karta go nie znajdzie",
    ed_bonus_minutes: "Dodatkowy czas",
    ed_bonus_minutes_helper: "Minuty dodawane przyciskiem dodatkowego czasu na Switchu (od 5 do 30)",
    ed_play_time: "Czujnik czasu gry",
    ed_play_time_helper: "Dzisiejszy czas gry z czujnika (np. history_stats); puste: liczony z historii",
    ed_show_play_time: "Czas gry dzisiaj",
    ed_show_trophies: "Trofea",
    ed_show_controls: "Sterowanie",
    ed_animations: "Animacje",
    ed_illustration: "Ilustrowany nagłówek",
    ed_illustration_theme: "Motyw nagłówka",
    ed_theme_auto: "Automatyczny (zgodny z motywem)",
    ed_theme_day: "Dzień",
    ed_theme_night: "Noc",
    ed_title_helper: "Puste: nazwa konsoli",
    ed_entities: "Encje (YAML)",
    ed_entities_helper: "Zastępuje znalezione encje, według roli: media, power, activity, trophy_level, gamerscore, time_remaining… (zob. README)",
  },
  ro: {
    title: "Consolă de jocuri",
    st_playing: "În joc",
    st_online: "Online",
    st_standby: "În așteptare",
    st_suspended: "Suspendată",
    st_time_up: "Timpul a expirat",
    st_offline: "Offline",
    now_playing: "Se joacă acum",
    in_app: "Aplicație",
    home_screen: "Ecranul de pornire",
    not_playing: "Niciun joc",
    since: "De {d}",
    last_seen: "Văzută ultima dată {d}",
    t_level: "Nivel de trofee",
    level: "Nivelul {n}",
    next_level: "{n}% până la nivelul următor",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Activ",
    sub_off: "Inactiv",
    t_status: "Stare",
    t_gamerscore: "Gamerscore",
    t_party: "Grup",
    t_friends: "Prieteni",
    t_storage: "Stocare",
    storage_free: "{f} liber",
    achievements: "{n} realizări",
    t_bedtime: "Ora de culcare",
    t_restriction: "Restricții",
    t_software: "Software",
    sw_allowed: "Permis",
    sw_suspended: "Suspendat",
    t_bonus: "Timp suplimentar",
    t_play_time: "Jucat azi",
    platinum: "Platină",
    gold: "Aur",
    silver: "Argint",
    bronze: "Bronz",
    screen_today: "Timp petrecut azi pe ecran",
    of_limit: "din {t}",
    left: "Au mai rămas {t}",
    no_limit: "Fără limită",
    bonus: "+{n} min",
    suspend: "Suspendă",
    resume: "Reia",
    turn_on: "Pornește",
    turn_off: "Oprește",
    home: "Acasă",
    dur_hm: "{h} h {m} min",
    dur_h: "{h} h",
    dur_m: "{m} min",
    no_console: "Nu s-a găsit nicio consolă de jocuri",
    ed_entity: "Consolă",
    ed_entity_helper: "Un player media PlayStation Network sau Xbox, comutatorul unei console PS5-MQTT sau o entitate a unei Nintendo Switch (control parental)",
    ed_power: "Comutator de alimentare",
    ed_power_helper: "Pornește și oprește consola (PS5-MQTT) când cardul nu îl găsește",
    ed_bonus_minutes: "Timp suplimentar",
    ed_bonus_minutes_helper: "Minutele adăugate de butonul de timp suplimentar al Switch (între 5 și 30)",
    ed_play_time: "Senzor de timp de joc",
    ed_play_time_helper: "Timpul de joc de azi dintr-un senzor (ex. history_stats); gol: calculat din istoric",
    ed_show_play_time: "Timp de joc azi",
    ed_show_trophies: "Trofee",
    ed_show_controls: "Comenzi",
    ed_animations: "Animații",
    ed_illustration: "Antet ilustrat",
    ed_illustration_theme: "Tema antetului",
    ed_theme_auto: "Automat (urmează tema)",
    ed_theme_day: "Zi",
    ed_theme_night: "Noapte",
    ed_title_helper: "Gol: numele consolei",
    ed_entities: "Entități (YAML)",
    ed_entities_helper: "Înlocuiește entitățile găsite, după rol: media, power, activity, trophy_level, gamerscore, time_remaining… (vezi README)",
  },
  da: {
    title: "Spillekonsol",
    st_playing: "Spiller",
    st_online: "Online",
    st_standby: "Standby",
    st_suspended: "Sat på pause",
    st_time_up: "Tiden er gået",
    st_offline: "Offline",
    now_playing: "Spiller nu",
    in_app: "App",
    home_screen: "Startskærm",
    not_playing: "Intet spil",
    since: "I {d}",
    last_seen: "Sidst set {d}",
    t_level: "Trofæniveau",
    level: "Niveau {n}",
    next_level: "{n} % til næste niveau",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Aktiv",
    sub_off: "Inaktiv",
    t_status: "Status",
    t_gamerscore: "Gamerscore",
    t_party: "Party",
    t_friends: "Venner",
    t_storage: "Lagerplads",
    storage_free: "{f} ledig",
    achievements: "{n} præstationer",
    t_bedtime: "Sengetid",
    t_restriction: "Begrænsninger",
    t_software: "Software",
    sw_allowed: "Tilladt",
    sw_suspended: "Sat på pause",
    t_bonus: "Ekstra tid",
    t_play_time: "Spillet i dag",
    platinum: "Platin",
    gold: "Guld",
    silver: "Sølv",
    bronze: "Bronze",
    screen_today: "Skærmtid i dag",
    of_limit: "af {t}",
    left: "{t} tilbage",
    no_limit: "Ingen grænse",
    bonus: "+{n} min",
    suspend: "Sæt på pause",
    resume: "Genoptag",
    turn_on: "Tænd",
    turn_off: "Sluk",
    home: "Start",
    dur_hm: "{h} t {m} min",
    dur_h: "{h} t",
    dur_m: "{m} min",
    no_console: "Ingen spillekonsol fundet",
    ed_entity: "Konsol",
    ed_entity_helper: "En medieafspiller fra PlayStation Network eller Xbox, tænd/sluk-kontakten på en PS5-MQTT-konsol eller en enhed fra en Nintendo Switch (forældrekontrol)",
    ed_power: "Tænd/sluk-kontakt",
    ed_power_helper: "Tænder og slukker konsollen (PS5-MQTT), når kortet ikke finder den",
    ed_bonus_minutes: "Ekstra tid",
    ed_bonus_minutes_helper: "Minutter, som Switchens knap for ekstra tid tilføjer (5 til 30)",
    ed_play_time: "Spilletidssensor",
    ed_play_time_helper: "Dagens spilletid fra en sensor (f.eks. history_stats); tom: talt fra historikken",
    ed_show_play_time: "Spilletid i dag",
    ed_show_trophies: "Trofæer",
    ed_show_controls: "Betjening",
    ed_animations: "Animationer",
    ed_illustration: "Illustreret overskrift",
    ed_illustration_theme: "Overskriftens tema",
    ed_theme_auto: "Automatisk (følger temaet)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nat",
    ed_title_helper: "Tom: konsollens navn",
    ed_entities: "Enheder (YAML)",
    ed_entities_helper: "Erstatter de fundne enheder efter rolle: media, power, activity, trophy_level, gamerscore, time_remaining… (se README)",
  },
  sv: {
    title: "Spelkonsol",
    st_playing: "Spelar",
    st_online: "Online",
    st_standby: "Viloläge",
    st_suspended: "Pausad",
    st_time_up: "Tiden är slut",
    st_offline: "Offline",
    now_playing: "Spelar nu",
    in_app: "App",
    home_screen: "Startskärm",
    not_playing: "Inget spel",
    since: "I {d}",
    last_seen: "Senast sedd {d}",
    t_level: "Trofénivå",
    level: "Nivå {n}",
    next_level: "{n} % till nästa nivå",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Aktiv",
    sub_off: "Inaktiv",
    t_status: "Status",
    t_gamerscore: "Gamerscore",
    t_party: "Party",
    t_friends: "Vänner",
    t_storage: "Lagring",
    storage_free: "{f} ledigt",
    achievements: "{n} prestationer",
    t_bedtime: "Läggdags",
    t_restriction: "Begränsningar",
    t_software: "Programvara",
    sw_allowed: "Tillåten",
    sw_suspended: "Pausad",
    t_bonus: "Extra tid",
    t_play_time: "Spelat i dag",
    platinum: "Platina",
    gold: "Guld",
    silver: "Silver",
    bronze: "Brons",
    screen_today: "Skärmtid i dag",
    of_limit: "av {t}",
    left: "{t} kvar",
    no_limit: "Ingen gräns",
    bonus: "+{n} min",
    suspend: "Pausa",
    resume: "Återuppta",
    turn_on: "Slå på",
    turn_off: "Stäng av",
    home: "Start",
    dur_hm: "{h} tim {m} min",
    dur_h: "{h} tim",
    dur_m: "{m} min",
    no_console: "Ingen spelkonsol hittades",
    ed_entity: "Konsol",
    ed_entity_helper: "En mediaspelare från PlayStation Network eller Xbox, strömbrytaren för en PS5-MQTT-konsol eller en entitet från en Nintendo Switch (föräldrakontroll)",
    ed_power: "Strömbrytare",
    ed_power_helper: "Slår på och stänger av konsolen (PS5-MQTT) när kortet inte hittar den",
    ed_bonus_minutes: "Extra tid",
    ed_bonus_minutes_helper: "Minuter som Switchens knapp för extra tid lägger till (5 till 30)",
    ed_play_time: "Speltidssensor",
    ed_play_time_helper: "Dagens speltid från en sensor (t.ex. history_stats); tom: räknad från historiken",
    ed_show_play_time: "Speltid i dag",
    ed_show_trophies: "Troféer",
    ed_show_controls: "Kontroller",
    ed_animations: "Animationer",
    ed_illustration: "Illustrerad rubrik",
    ed_illustration_theme: "Rubrikens tema",
    ed_theme_auto: "Automatiskt (följer temat)",
    ed_theme_day: "Dag",
    ed_theme_night: "Natt",
    ed_title_helper: "Tomt: konsolens namn",
    ed_entities: "Entiteter (YAML)",
    ed_entities_helper: "Ersätter de hittade entiteterna, per roll: media, power, activity, trophy_level, gamerscore, time_remaining… (se README)",
  },
  bg: {
    title: "Игрова конзола",
    st_playing: "В игра",
    st_online: "На линия",
    st_standby: "В режим на готовност",
    st_suspended: "Спряна",
    st_time_up: "Времето изтече",
    st_offline: "Извън линия",
    now_playing: "Играе се в момента",
    in_app: "Приложение",
    home_screen: "Начален екран",
    not_playing: "Няма игра",
    since: "От {d}",
    last_seen: "Последно видяна {d}",
    t_level: "Ниво на трофеите",
    level: "Ниво {n}",
    next_level: "{n}% до следващото ниво",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Активен",
    sub_off: "Неактивен",
    t_status: "Състояние",
    t_gamerscore: "Gamerscore",
    t_party: "Група",
    t_friends: "Приятели",
    t_storage: "Хранилище",
    storage_free: "{f} свободни",
    achievements: "Постижения: {n}",
    t_bedtime: "Време за сън",
    t_restriction: "Ограничения",
    t_software: "Софтуер",
    sw_allowed: "Разрешен",
    sw_suspended: "Спрян",
    t_bonus: "Допълнително време",
    t_play_time: "Играно днес",
    platinum: "Платина",
    gold: "Злато",
    silver: "Сребро",
    bronze: "Бронз",
    screen_today: "Време пред екрана днес",
    of_limit: "от {t}",
    left: "Остават {t}",
    no_limit: "Без ограничение",
    bonus: "+{n} мин",
    suspend: "Спри",
    resume: "Продължи",
    turn_on: "Включи",
    turn_off: "Изключи",
    home: "Начало",
    dur_hm: "{h} ч {m} мин",
    dur_h: "{h} ч",
    dur_m: "{m} мин",
    no_console: "Не е намерена игрова конзола",
    ed_entity: "Конзола",
    ed_entity_helper: "Медиен плейър на PlayStation Network или Xbox, прекъсвачът на конзола PS5-MQTT или обект на Nintendo Switch (родителски контрол)",
    ed_power: "Прекъсвач за захранване",
    ed_power_helper: "Включва и изключва конзолата (PS5-MQTT), когато картата не го намира",
    ed_bonus_minutes: "Допълнително време",
    ed_bonus_minutes_helper: "Минути, добавяни от бутона за допълнително време на Switch (от 5 до 30)",
    ed_play_time: "Сензор за време за игра",
    ed_play_time_helper: "Днешното време за игра от сензор (напр. history_stats); празно: изчислено от историята",
    ed_show_play_time: "Време за игра днес",
    ed_show_trophies: "Трофеи",
    ed_show_controls: "Управление",
    ed_animations: "Анимации",
    ed_illustration: "Илюстриран горен край",
    ed_illustration_theme: "Тема на горния край",
    ed_theme_auto: "Автоматично (следва темата)",
    ed_theme_day: "Ден",
    ed_theme_night: "Нощ",
    ed_title_helper: "Празно: името на конзолата",
    ed_entities: "Обекти (YAML)",
    ed_entities_helper: "Заменя намерените обекти по роля: media, power, activity, trophy_level, gamerscore, time_remaining… (вижте README)",
  },
  ru: {
    title: "Игровая консоль",
    st_playing: "В игре",
    st_online: "В сети",
    st_standby: "В режиме ожидания",
    st_suspended: "Приостановлена",
    st_time_up: "Время вышло",
    st_offline: "Не в сети",
    now_playing: "Сейчас играет",
    in_app: "Приложение",
    home_screen: "Главный экран",
    not_playing: "Нет игры",
    since: "Уже {d}",
    last_seen: "Была в сети {d}",
    t_level: "Уровень трофеев",
    level: "Уровень {n}",
    next_level: "{n}% до следующего уровня",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Активна",
    sub_off: "Неактивна",
    t_status: "Статус",
    t_gamerscore: "Gamerscore",
    t_party: "Группа",
    t_friends: "Друзья",
    t_storage: "Хранилище",
    storage_free: "Свободно {f}",
    achievements: "Достижения: {n}",
    t_bedtime: "Время сна",
    t_restriction: "Ограничения",
    t_software: "Программы",
    sw_allowed: "Разрешены",
    sw_suspended: "Приостановлены",
    t_bonus: "Дополнительное время",
    t_play_time: "Сыграно сегодня",
    platinum: "Платина",
    gold: "Золото",
    silver: "Серебро",
    bronze: "Бронза",
    screen_today: "Экранное время сегодня",
    of_limit: "из {t}",
    left: "Осталось {t}",
    no_limit: "Без ограничений",
    bonus: "+{n} мин",
    suspend: "Приостановить",
    resume: "Возобновить",
    turn_on: "Включить",
    turn_off: "Выключить",
    home: "Главная",
    dur_hm: "{h} ч {m} мин",
    dur_h: "{h} ч",
    dur_m: "{m} мин",
    no_console: "Игровая консоль не найдена",
    ed_entity: "Консоль",
    ed_entity_helper: "Медиаплеер PlayStation Network или Xbox, выключатель консоли PS5-MQTT или объект Nintendo Switch (родительский контроль)",
    ed_power: "Выключатель питания",
    ed_power_helper: "Включает и выключает консоль (PS5-MQTT), если карточка его не находит",
    ed_bonus_minutes: "Дополнительное время",
    ed_bonus_minutes_helper: "Минуты, добавляемые кнопкой дополнительного времени Switch (от 5 до 30)",
    ed_play_time: "Датчик времени игры",
    ed_play_time_helper: "Сегодняшнее время игры из датчика (например, history_stats); пусто: считается по истории",
    ed_show_play_time: "Время игры сегодня",
    ed_show_trophies: "Трофеи",
    ed_show_controls: "Управление",
    ed_animations: "Анимация",
    ed_illustration: "Иллюстрированный заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматически (по теме)",
    ed_theme_day: "День",
    ed_theme_night: "Ночь",
    ed_title_helper: "Пусто: название консоли",
    ed_entities: "Объекты (YAML)",
    ed_entities_helper: "Заменяет найденные объекты по роли: media, power, activity, trophy_level, gamerscore, time_remaining… (см. README)",
  },
  uk: {
    title: "Ігрова консоль",
    st_playing: "У грі",
    st_online: "У мережі",
    st_standby: "У режимі очікування",
    st_suspended: "Призупинено",
    st_time_up: "Час вичерпано",
    st_offline: "Не в мережі",
    now_playing: "Зараз грає",
    in_app: "Застосунок",
    home_screen: "Головний екран",
    not_playing: "Немає гри",
    since: "Уже {d}",
    last_seen: "Була в мережі {d}",
    t_level: "Рівень трофеїв",
    level: "Рівень {n}",
    next_level: "{n}% до наступного рівня",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Активна",
    sub_off: "Неактивна",
    t_status: "Статус",
    t_gamerscore: "Gamerscore",
    t_party: "Група",
    t_friends: "Друзі",
    t_storage: "Сховище",
    storage_free: "Вільно {f}",
    achievements: "Досягнення: {n}",
    t_bedtime: "Час сну",
    t_restriction: "Обмеження",
    t_software: "Програми",
    sw_allowed: "Дозволено",
    sw_suspended: "Призупинено",
    t_bonus: "Додатковий час",
    t_play_time: "Зіграно сьогодні",
    platinum: "Платина",
    gold: "Золото",
    silver: "Срібло",
    bronze: "Бронза",
    screen_today: "Екранний час сьогодні",
    of_limit: "з {t}",
    left: "Залишилося {t}",
    no_limit: "Без обмежень",
    bonus: "+{n} хв",
    suspend: "Призупинити",
    resume: "Відновити",
    turn_on: "Увімкнути",
    turn_off: "Вимкнути",
    home: "Головна",
    dur_hm: "{h} год {m} хв",
    dur_h: "{h} год",
    dur_m: "{m} хв",
    no_console: "Ігрову консоль не знайдено",
    ed_entity: "Консоль",
    ed_entity_helper: "Медіапрогравач PlayStation Network або Xbox, вимикач консолі PS5-MQTT або об'єкт Nintendo Switch (батьківський контроль)",
    ed_power: "Вимикач живлення",
    ed_power_helper: "Вмикає й вимикає консоль (PS5-MQTT), якщо картка його не знаходить",
    ed_bonus_minutes: "Додатковий час",
    ed_bonus_minutes_helper: "Хвилини, які додає кнопка додаткового часу Switch (від 5 до 30)",
    ed_play_time: "Датчик часу гри",
    ed_play_time_helper: "Сьогоднішній час гри з датчика (наприклад, history_stats); порожньо: рахується з історії",
    ed_show_play_time: "Час гри сьогодні",
    ed_show_trophies: "Трофеї",
    ed_show_controls: "Керування",
    ed_animations: "Анімація",
    ed_illustration: "Ілюстрований заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматично (за темою)",
    ed_theme_day: "День",
    ed_theme_night: "Ніч",
    ed_title_helper: "Порожньо: назва консолі",
    ed_entities: "Об'єкти (YAML)",
    ed_entities_helper: "Замінює знайдені об'єкти за роллю: media, power, activity, trophy_level, gamerscore, time_remaining… (див. README)",
  },
  hu: {
    title: "Játékkonzol",
    st_playing: "Játékban",
    st_online: "Online",
    st_standby: "Készenlétben",
    st_suspended: "Felfüggesztve",
    st_time_up: "Lejárt az idő",
    st_offline: "Offline",
    now_playing: "Most fut",
    in_app: "Alkalmazás",
    home_screen: "Kezdőképernyő",
    not_playing: "Nincs játék",
    since: "{d} óta",
    last_seen: "Utoljára látva: {d}",
    t_level: "Trófeaszint",
    level: "{n}. szint",
    next_level: "{n}% a következő szintig",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Aktív",
    sub_off: "Inaktív",
    t_status: "Állapot",
    t_gamerscore: "Gamerscore",
    t_party: "Csapat",
    t_friends: "Barátok",
    t_storage: "Tárhely",
    storage_free: "{f} szabad",
    achievements: "{n} teljesítmény",
    t_bedtime: "Lefekvés",
    t_restriction: "Korlátozások",
    t_software: "Szoftver",
    sw_allowed: "Engedélyezve",
    sw_suspended: "Felfüggesztve",
    t_bonus: "Extra idő",
    t_play_time: "Ma játszva",
    platinum: "Platina",
    gold: "Arany",
    silver: "Ezüst",
    bronze: "Bronz",
    screen_today: "Mai képernyőidő",
    of_limit: "/ {t}",
    left: "Még {t}",
    no_limit: "Nincs korlát",
    bonus: "+{n} perc",
    suspend: "Felfüggesztés",
    resume: "Folytatás",
    turn_on: "Bekapcsolás",
    turn_off: "Kikapcsolás",
    home: "Kezdőlap",
    dur_hm: "{h} ó {m} perc",
    dur_h: "{h} ó",
    dur_m: "{m} perc",
    no_console: "Nem található játékkonzol",
    ed_entity: "Konzol",
    ed_entity_helper: "PlayStation Network vagy Xbox médialejátszó, egy PS5-MQTT konzol kapcsolója vagy egy Nintendo Switch entitása (szülői felügyelet)",
    ed_power: "Főkapcsoló",
    ed_power_helper: "Be- és kikapcsolja a konzolt (PS5-MQTT), ha a kártya nem találja",
    ed_bonus_minutes: "Extra idő",
    ed_bonus_minutes_helper: "A Switch extra idő gombja által hozzáadott percek (5–30)",
    ed_play_time: "Játékidő-érzékelő",
    ed_play_time_helper: "A mai játékidő egy érzékelőből (pl. history_stats); üres: az előzményekből számolva",
    ed_show_play_time: "Mai játékidő",
    ed_show_trophies: "Trófeák",
    ed_show_controls: "Vezérlők",
    ed_animations: "Animációk",
    ed_illustration: "Illusztrált fejléc",
    ed_illustration_theme: "Fejléc témája",
    ed_theme_auto: "Automatikus (követi a témát)",
    ed_theme_day: "Nappal",
    ed_theme_night: "Éjszaka",
    ed_title_helper: "Üres: a konzol neve",
    ed_entities: "Entitások (YAML)",
    ed_entities_helper: "Felülírja a talált entitásokat szerepkör szerint: media, power, activity, trophy_level, gamerscore, time_remaining… (lásd a README-t)",
  },
  sk: {
    title: "Herná konzola",
    st_playing: "V hre",
    st_online: "Online",
    st_standby: "V pohotovosti",
    st_suspended: "Pozastavená",
    st_time_up: "Čas vypršal",
    st_offline: "Offline",
    now_playing: "Práve sa hrá",
    in_app: "Aplikácia",
    home_screen: "Domovská obrazovka",
    not_playing: "Žiadna hra",
    since: "Už {d}",
    last_seen: "Naposledy videná {d}",
    t_level: "Úroveň trofejí",
    level: "Úroveň {n}",
    next_level: "{n} % do ďalšej úrovne",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Aktívne",
    sub_off: "Neaktívne",
    t_status: "Stav",
    t_gamerscore: "Gamerscore",
    t_party: "Skupina",
    t_friends: "Priatelia",
    t_storage: "Úložisko",
    storage_free: "Voľné: {f}",
    achievements: "Úspechy: {n}",
    t_bedtime: "Čas spánku",
    t_restriction: "Obmedzenia",
    t_software: "Softvér",
    sw_allowed: "Povolený",
    sw_suspended: "Pozastavený",
    t_bonus: "Čas navyše",
    t_play_time: "Hrané dnes",
    platinum: "Platina",
    gold: "Zlato",
    silver: "Striebro",
    bronze: "Bronz",
    screen_today: "Čas pred obrazovkou dnes",
    of_limit: "z {t}",
    left: "Zostáva {t}",
    no_limit: "Bez limitu",
    bonus: "+{n} min",
    suspend: "Pozastaviť",
    resume: "Pokračovať",
    turn_on: "Zapnúť",
    turn_off: "Vypnúť",
    home: "Domov",
    dur_hm: "{h} h {m} min",
    dur_h: "{h} h",
    dur_m: "{m} min",
    no_console: "Nenašla sa žiadna herná konzola",
    ed_entity: "Konzola",
    ed_entity_helper: "Prehrávač médií PlayStation Network alebo Xbox, vypínač konzoly PS5-MQTT alebo entita konzoly Nintendo Switch (rodičovská kontrola)",
    ed_power: "Vypínač",
    ed_power_helper: "Zapína a vypína konzolu (PS5-MQTT), keď ho karta nenájde",
    ed_bonus_minutes: "Čas navyše",
    ed_bonus_minutes_helper: "Minúty, ktoré pridá tlačidlo času navyše na Switchi (5 až 30)",
    ed_play_time: "Senzor času hrania",
    ed_play_time_helper: "Dnešný čas hrania zo senzora (napr. history_stats); prázdne: počíta sa z histórie",
    ed_show_play_time: "Čas hrania dnes",
    ed_show_trophies: "Trofeje",
    ed_show_controls: "Ovládanie",
    ed_animations: "Animácie",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Téma hlavičky",
    ed_theme_auto: "Automaticky (podľa témy)",
    ed_theme_day: "Deň",
    ed_theme_night: "Noc",
    ed_title_helper: "Prázdne: názov konzoly",
    ed_entities: "Entity (YAML)",
    ed_entities_helper: "Nahrádza nájdené entity podľa roly: media, power, activity, trophy_level, gamerscore, time_remaining… (pozri README)",
  },
  cs: {
    title: "Herní konzole",
    st_playing: "Ve hře",
    st_online: "Online",
    st_standby: "V pohotovosti",
    st_suspended: "Pozastavena",
    st_time_up: "Čas vypršel",
    st_offline: "Offline",
    now_playing: "Právě se hraje",
    in_app: "Aplikace",
    home_screen: "Domovská obrazovka",
    not_playing: "Žádná hra",
    since: "Už {d}",
    last_seen: "Naposledy viděna {d}",
    t_level: "Úroveň trofejí",
    level: "Úroveň {n}",
    next_level: "{n} % do další úrovně",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Aktivní",
    sub_off: "Neaktivní",
    t_status: "Stav",
    t_gamerscore: "Gamerscore",
    t_party: "Skupina",
    t_friends: "Přátelé",
    t_storage: "Úložiště",
    storage_free: "Volné: {f}",
    achievements: "Úspěchy: {n}",
    t_bedtime: "Večerka",
    t_restriction: "Omezení",
    t_software: "Software",
    sw_allowed: "Povolen",
    sw_suspended: "Pozastaven",
    t_bonus: "Čas navíc",
    t_play_time: "Hráno dnes",
    platinum: "Platina",
    gold: "Zlato",
    silver: "Stříbro",
    bronze: "Bronz",
    screen_today: "Čas u obrazovky dnes",
    of_limit: "z {t}",
    left: "Zbývá {t}",
    no_limit: "Bez omezení",
    bonus: "+{n} min",
    suspend: "Pozastavit",
    resume: "Pokračovat",
    turn_on: "Zapnout",
    turn_off: "Vypnout",
    home: "Domů",
    dur_hm: "{h} h {m} min",
    dur_h: "{h} h",
    dur_m: "{m} min",
    no_console: "Nebyla nalezena žádná herní konzole",
    ed_entity: "Konzole",
    ed_entity_helper: "Přehrávač médií PlayStation Network nebo Xbox, vypínač konzole PS5-MQTT nebo entita konzole Nintendo Switch (rodičovská kontrola)",
    ed_power: "Vypínač",
    ed_power_helper: "Zapíná a vypíná konzoli (PS5-MQTT), když ho karta nenajde",
    ed_bonus_minutes: "Čas navíc",
    ed_bonus_minutes_helper: "Minuty, které přidá tlačítko času navíc na Switchi (5 až 30)",
    ed_play_time: "Senzor doby hraní",
    ed_play_time_helper: "Dnešní doba hraní ze senzoru (např. history_stats); prázdné: počítá se z historie",
    ed_show_play_time: "Doba hraní dnes",
    ed_show_trophies: "Trofeje",
    ed_show_controls: "Ovládání",
    ed_animations: "Animace",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Motiv hlavičky",
    ed_theme_auto: "Automaticky (podle motivu)",
    ed_theme_day: "Den",
    ed_theme_night: "Noc",
    ed_title_helper: "Prázdné: název konzole",
    ed_entities: "Entity (YAML)",
    ed_entities_helper: "Nahrazuje nalezené entity podle role: media, power, activity, trophy_level, gamerscore, time_remaining… (viz README)",
  },
  sl: {
    title: "Igralna konzola",
    st_playing: "V igri",
    st_online: "Na spletu",
    st_standby: "V pripravljenosti",
    st_suspended: "Začasno ustavljena",
    st_time_up: "Čas je potekel",
    st_offline: "Brez povezave",
    now_playing: "Trenutno se igra",
    in_app: "Aplikacija",
    home_screen: "Začetni zaslon",
    not_playing: "Ni igre",
    since: "Že {d}",
    last_seen: "Nazadnje videna {d}",
    t_level: "Raven trofej",
    level: "Raven {n}",
    next_level: "{n} % do naslednje ravni",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Aktivna",
    sub_off: "Neaktivna",
    t_status: "Stanje",
    t_gamerscore: "Gamerscore",
    t_party: "Skupina",
    t_friends: "Prijatelji",
    t_storage: "Shramba",
    storage_free: "Prosto: {f}",
    achievements: "Dosežki: {n}",
    t_bedtime: "Čas za spanje",
    t_restriction: "Omejitve",
    t_software: "Programska oprema",
    sw_allowed: "Dovoljena",
    sw_suspended: "Začasno ustavljena",
    t_bonus: "Dodatni čas",
    t_play_time: "Igrano danes",
    platinum: "Platina",
    gold: "Zlato",
    silver: "Srebro",
    bronze: "Bron",
    screen_today: "Čas pred zaslonom danes",
    of_limit: "od {t}",
    left: "Še {t}",
    no_limit: "Brez omejitve",
    bonus: "+{n} min",
    suspend: "Začasno ustavi",
    resume: "Nadaljuj",
    turn_on: "Vklopi",
    turn_off: "Izklopi",
    home: "Domov",
    dur_hm: "{h} h {m} min",
    dur_h: "{h} h",
    dur_m: "{m} min",
    no_console: "Ni najdene igralne konzole",
    ed_entity: "Konzola",
    ed_entity_helper: "Predvajalnik PlayStation Network ali Xbox, stikalo konzole PS5-MQTT ali entiteta konzole Nintendo Switch (starševski nadzor)",
    ed_power: "Stikalo za napajanje",
    ed_power_helper: "Vklopi in izklopi konzolo (PS5-MQTT), ko ga kartica ne najde",
    ed_bonus_minutes: "Dodatni čas",
    ed_bonus_minutes_helper: "Minute, ki jih doda gumb za dodatni čas na Switchu (od 5 do 30)",
    ed_play_time: "Senzor časa igranja",
    ed_play_time_helper: "Današnji čas igranja iz senzorja (npr. history_stats); prazno: šteto iz zgodovine",
    ed_show_play_time: "Čas igranja danes",
    ed_show_trophies: "Trofeje",
    ed_show_controls: "Upravljanje",
    ed_animations: "Animacije",
    ed_illustration: "Ilustrirana glava",
    ed_illustration_theme: "Tema glave",
    ed_theme_auto: "Samodejno (sledi temi)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noč",
    ed_title_helper: "Prazno: ime konzole",
    ed_entities: "Entitete (YAML)",
    ed_entities_helper: "Nadomesti najdene entitete po vlogi: media, power, activity, trophy_level, gamerscore, time_remaining… (glej README)",
  },
  lv: {
    title: "Spēļu konsole",
    st_playing: "Spēlē",
    st_online: "Tiešsaistē",
    st_standby: "Gaidstāvē",
    st_suspended: "Apturēta",
    st_time_up: "Laiks beidzies",
    st_offline: "Bezsaistē",
    now_playing: "Pašlaik spēlē",
    in_app: "Lietotne",
    home_screen: "Sākuma ekrāns",
    not_playing: "Nav spēles",
    since: "Jau {d}",
    last_seen: "Pēdējo reizi redzēta {d}",
    t_level: "Trofeju līmenis",
    level: "{n}. līmenis",
    next_level: "{n}% līdz nākamajam līmenim",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Aktīvs",
    sub_off: "Neaktīvs",
    t_status: "Statuss",
    t_gamerscore: "Gamerscore",
    t_party: "Grupa",
    t_friends: "Draugi",
    t_storage: "Krātuve",
    storage_free: "Brīvs: {f}",
    achievements: "Sasniegumi: {n}",
    t_bedtime: "Gulētiešanas laiks",
    t_restriction: "Ierobežojumi",
    t_software: "Programmatūra",
    sw_allowed: "Atļauta",
    sw_suspended: "Apturēta",
    t_bonus: "Papildu laiks",
    t_play_time: "Spēlēts šodien",
    platinum: "Platīns",
    gold: "Zelts",
    silver: "Sudrabs",
    bronze: "Bronza",
    screen_today: "Ekrāna laiks šodien",
    of_limit: "no {t}",
    left: "Atlikušas {t}",
    no_limit: "Bez ierobežojuma",
    bonus: "+{n} min",
    suspend: "Apturēt",
    resume: "Atsākt",
    turn_on: "Ieslēgt",
    turn_off: "Izslēgt",
    home: "Sākums",
    dur_hm: "{h} h {m} min",
    dur_h: "{h} h",
    dur_m: "{m} min",
    no_console: "Nav atrasta neviena spēļu konsole",
    ed_entity: "Konsole",
    ed_entity_helper: "PlayStation Network vai Xbox multivides atskaņotājs, PS5-MQTT konsoles slēdzis vai Nintendo Switch vienība (vecāku kontrole)",
    ed_power: "Barošanas slēdzis",
    ed_power_helper: "Ieslēdz un izslēdz konsoli (PS5-MQTT), ja kartīte to neatrod",
    ed_bonus_minutes: "Papildu laiks",
    ed_bonus_minutes_helper: "Minūtes, ko pievieno Switch papildu laika poga (no 5 līdz 30)",
    ed_play_time: "Spēles laika sensors",
    ed_play_time_helper: "Šodienas spēles laiks no sensora (piem., history_stats); tukšs: skaitīts no vēstures",
    ed_show_play_time: "Spēles laiks šodien",
    ed_show_trophies: "Trofejas",
    ed_show_controls: "Vadīklas",
    ed_animations: "Animācijas",
    ed_illustration: "Ilustrēta galvene",
    ed_illustration_theme: "Galvenes motīvs",
    ed_theme_auto: "Automātiski (atbilst motīvam)",
    ed_theme_day: "Diena",
    ed_theme_night: "Nakts",
    ed_title_helper: "Tukšs: konsoles nosaukums",
    ed_entities: "Vienības (YAML)",
    ed_entities_helper: "Aizstāj atrastās vienības pēc lomas: media, power, activity, trophy_level, gamerscore, time_remaining… (skatīt README)",
  },
  el: {
    title: "Κονσόλα παιχνιδιών",
    st_playing: "Σε παιχνίδι",
    st_online: "Συνδεδεμένη",
    st_standby: "Σε αναμονή",
    st_suspended: "Σε παύση",
    st_time_up: "Ο χρόνος τελείωσε",
    st_offline: "Εκτός σύνδεσης",
    now_playing: "Παίζει τώρα",
    in_app: "Εφαρμογή",
    home_screen: "Αρχική οθόνη",
    not_playing: "Κανένα παιχνίδι",
    since: "Εδώ και {d}",
    last_seen: "Εθεάθη {d}",
    t_level: "Επίπεδο τροπαίων",
    level: "Επίπεδο {n}",
    next_level: "{n}% έως το επόμενο επίπεδο",
    t_plus: "PlayStation Plus",
    t_game_pass: "Game Pass",
    sub_on: "Ενεργή",
    sub_off: "Ανενεργή",
    t_status: "Κατάσταση",
    t_gamerscore: "Gamerscore",
    t_party: "Ομάδα",
    t_friends: "Φίλοι",
    t_storage: "Αποθηκευτικός χώρος",
    storage_free: "Ελεύθερα {f}",
    achievements: "Επιτεύγματα: {n}",
    t_bedtime: "Ώρα ύπνου",
    t_restriction: "Περιορισμοί",
    t_software: "Λογισμικό",
    sw_allowed: "Επιτρέπεται",
    sw_suspended: "Σε παύση",
    t_bonus: "Επιπλέον χρόνος",
    t_play_time: "Παίχτηκε σήμερα",
    platinum: "Πλατίνα",
    gold: "Χρυσό",
    silver: "Ασημένιο",
    bronze: "Χάλκινο",
    screen_today: "Χρόνος οθόνης σήμερα",
    of_limit: "από {t}",
    left: "Απομένουν {t}",
    no_limit: "Χωρίς όριο",
    bonus: "+{n} λεπ.",
    suspend: "Παύση",
    resume: "Συνέχεια",
    turn_on: "Ενεργοποίηση",
    turn_off: "Απενεργοποίηση",
    home: "Αρχική",
    dur_hm: "{h} ώ. {m} λεπ.",
    dur_h: "{h} ώ.",
    dur_m: "{m} λεπ.",
    no_console: "Δεν βρέθηκε κονσόλα παιχνιδιών",
    ed_entity: "Κονσόλα",
    ed_entity_helper: "Ένα πρόγραμμα αναπαραγωγής PlayStation Network ή Xbox, ο διακόπτης μιας κονσόλας PS5-MQTT ή μια οντότητα ενός Nintendo Switch (γονικός έλεγχος)",
    ed_power: "Διακόπτης τροφοδοσίας",
    ed_power_helper: "Ανάβει και σβήνει την κονσόλα (PS5-MQTT), όταν η κάρτα δεν τον βρίσκει",
    ed_bonus_minutes: "Επιπλέον χρόνος",
    ed_bonus_minutes_helper: "Λεπτά που προσθέτει το κουμπί επιπλέον χρόνου του Switch (5 έως 30)",
    ed_play_time: "Αισθητήρας χρόνου παιχνιδιού",
    ed_play_time_helper: "Ο σημερινός χρόνος παιχνιδιού από αισθητήρα (π.χ. history_stats)· κενό: υπολογίζεται από το ιστορικό",
    ed_show_play_time: "Χρόνος παιχνιδιού σήμερα",
    ed_show_trophies: "Τρόπαια",
    ed_show_controls: "Χειριστήρια",
    ed_animations: "Κινούμενα σχέδια",
    ed_illustration: "Εικονογραφημένη κεφαλίδα",
    ed_illustration_theme: "Θέμα κεφαλίδας",
    ed_theme_auto: "Αυτόματο (ακολουθεί το θέμα)",
    ed_theme_day: "Ημέρα",
    ed_theme_night: "Νύχτα",
    ed_title_helper: "Κενό: το όνομα της κονσόλας",
    ed_entities: "Οντότητες (YAML)",
    ed_entities_helper: "Αντικαθιστά τις οντότητες που βρέθηκαν, ανά ρόλο: media, power, activity, trophy_level, gamerscore, time_remaining… (δείτε το README)",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rcLang = (i18n, hass, config) => {
  // The full tag when the card has it (sr-Latn), else its base language (fr-FR → fr, pt-BR → pt), else English.
  const l = config?.language || hass?.locale?.language || hass?.language || "en";
  const base = l.split("-")[0];
  return i18n[l] ? l : i18n[base] ? base : "en";
};

const rcT = (i18n, lang, key, vars = {}) => {
  const s = i18n[lang]?.[key] ?? RC_I18N[lang]?.[key] ?? i18n.en[key] ?? RC_I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
};

// Plural key for `n` items: `<base>_one`, `<base>_few` or `<base>_many` (the "other" form), from the CLDR category of
// `n` in `lang` (Serbian 1 / 2-4 / 5+, 21 / 22…). `_few` is optional: without it, `_many` is used. A `_one` text without
// {n} ("Turn this plug off?") only means exactly one.
const rcPluralKey = (i18n, lang, base, n) => {
  let cat;
  try {
    cat = new Intl.PluralRules(lang).select(n);
  } catch {
    cat = n === 1 ? "one" : "other";
  }
  const text = (k) => i18n[lang]?.[k] ?? RC_I18N[lang]?.[k];
  if (cat === "one" && (n === 1 || text(`${base}_one`)?.includes("{n}"))) return `${base}_one`;
  if (cat === "few" && text(`${base}_few`) != null) return `${base}_few`;
  return `${base}_many`;
};

const rcEsc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const rcMoreInfo = (node, entityId) => {
  const ev = new Event("hass-more-info", { bubbles: true, composed: true });
  ev.detail = { entityId };
  node.dispatchEvent(ev);
};

const rcNavigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

// Wires a card header to its `navigation_path`: click, and Enter on the header itself.
const rcBindNav = (head, path) => {
  head.addEventListener("click", () => rcNavigate(path));
  head.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && ev.target === head) rcNavigate(path);
  });
};

const rcUnavailable = (st) => ["unavailable", "unknown"].includes(st.state);

// HA's callService already shows a toast when the call fails, then rejects: the rejection is only swallowed here
// so that it does not end up as "Uncaught (in promise)".
const rcCall = (hass, domain, service, data) => Promise.resolve(hass.callService(domain, service, data)).catch(() => {});

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const rcInDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// `fn()`, computed again only when one of `deps` is no longer the same object (or value) as last time.
const rcMemo = (store, key, deps, fn) => {
  const hit = store[key];
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.value;
  const value = fn();
  store[key] = { deps, value };
  return value;
};

// ── Base card ────────────────────────────────────────────────────────────────
class RcCard extends HTMLElement {
  static getStubConfig(hass) {
    const areas = Object.keys(hass?.areas ?? {});
    return { area: areas[0] ?? "" };
  }

  // Subclasses set: static i18n, static defaults, static tag, static styles.
  static getConfigElement() {
    // biome-ignore lint/complexity/noThisInStatic: each subclass opens its own editor.
    return document.createElement(`${this.tag}-editor`);
  }

  setConfig(config) {
    if (this.constructor.needsArea && !config.area && !config.entities?.length && !config.include?.length) {
      throw new Error(rcT(this.constructor.i18n, rcLang(this.constructor.i18n, this._hass, config), "err_config"));
    }
    this._config = { ...this.constructor.defaults, ...config };
    // show_title: the header's title, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    if (!this.shadowRoot) this._attach();
    this._sig = null;
    this._render();
  }

  // The shadow root, and no rewrite of the card between a press anywhere in it and the end of the click: Home
  // Assistant updates the card several times a second, and a rewrite under the pointer replaces the element pressed,
  // so that the click lands on the card itself and does nothing (the tiles already hold it, see _bindPress; this
  // covers the rest: header button, detail button, rows, popup). The pending update is rendered once released.
  _attach() {
    const root = this.attachShadow({ mode: "open" });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      // After the click, which comes in the same task as the release.
      setTimeout(() => {
        if (this._pressing) this._released();
      }, 0);
    };
    root.addEventListener("pointerdown", (ev) => {
      this._byPointer = true;
      if (ev.button !== 0) return;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    // The focus is kept across rewrites for the keyboard only (no focus ring after a mouse click or a tap).
    root.addEventListener("keydown", () => {
      this._byPointer = false;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // A press cut short by the detach never gets its release: rendered now, and the next updates too.
    if (this._pressing) this._released();
  }

  set hass(hass) {
    this._hass = hass;
    // No re-render during a drag or a press: it would replace the tile under the finger.
    if (this._dragging || this._pressing) this._deferred = true;
    else this._render();
  }

  // The tiles actually shown (`only_on` / `only_alerts` applied), nothing when the card is hidden.
  getCardSize() {
    if (this.style.display === "none") return 0;
    const n = this._shown ?? this._items?.length ?? 0;
    if (!n || !this._config) return 1;
    // A row of large tiles (`layout: tiles`) is about one and a half rows of compact ones.
    const rows = Math.ceil(n / this._cols());
    return 1 + (this._tiles() ? Math.ceil(rows * 1.5) : rows);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _lang() {
    return rcLang(this.constructor.i18n, this._hass, this._config);
  }

  _t(key, vars) {
    return rcT(this.constructor.i18n, this._lang(), key, vars);
  }

  // `<base>_one` / `_few` / `_many` for `n`, with {n} filled in.
  _tn(base, n, vars) {
    return this._t(rcPluralKey(this.constructor.i18n, this._lang(), base, n), { ...vars, n });
  }

  _areaOf(id) {
    const e = this._hass.entities?.[id];
    if (!e) return undefined;
    return e.area_id ?? this._hass.devices?.[e.device_id]?.area_id;
  }

  _areaName() {
    const c = this._config;
    return c.area ? (this._hass.areas?.[c.area]?.name ?? c.area) : "";
  }

  // The configured `entities`; otherwise the entities of the area accepted by `_candidate`, minus `exclude`,
  // plus `include` (entities from another room or without one).
  _entries() {
    const h = this._hass;
    const c = this._config;
    const list = (l) => (l || []).map((e) => (typeof e === "string" ? { entity: e } : e)).filter((e) => h.states[e.entity]);
    if (c.entities?.length) return list(c.entities);
    this._prepare();
    const found = c.area ? this._areaIds().filter((id) => h.states[id] && this._candidate(id)).map((entity) => ({ entity })) : [];
    const ids = new Set(found.map((e) => e.entity));
    return [...found, ...list(c.include).filter((e) => !ids.has(e.entity))];
  }

  // Visible entities of the area, minus `exclude`: the registries are scanned again only when they or the config
  // change (an entity outside the entity registry has no area anyway).
  _areaIds() {
    const h = this._hass;
    const c = this._config;
    return rcMemo((this._memo ||= {}), "area", [c, h.entities, h.devices], () => {
      const exclude = new Set(c.exclude || []);
      return Object.keys(h.entities || {}).filter((id) => !exclude.has(id) && !h.entities[id].hidden && this._areaOf(id) === c.area);
    });
  }

  // Hook run before the discovery, for what `_candidate` needs.
  _prepare() {}

  // Re-render only when something visible changed.
  _changed(parts) {
    const sig = JSON.stringify([this._config, this._lang(), parts]);
    if (sig === this._sig) return false;
    this._sig = sig;
    return true;
  }

  _hide(hidden) {
    this.style.display = hidden ? "none" : "";
    return hidden;
  }

  // Status of a set of opening and safety sensors: an alarm (`leaks` active ones, the most serious being `alert`: leak,
  // smoke, co or gas), then the open ones, then the unavailable ones (`unavail`: a sensor that cannot report is no
  // all-clear), then "All closed" when there are door or window sensors (`closable`), `idle` otherwise.
  _openingStatus(leaks, open, closable, idle = "all_quiet", unavail = 0, alert = "leak") {
    if (leaks) return this._t(alert);
    if (open) return this._tn("open", open);
    if (unavail) return this._tn("unavail", unavail);
    return this._t(closable ? "all_closed" : idle);
  }

  // Subclasses implement `_collect()` (the tiles) and `_draw(items)`.
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    this._items = this._collect();
    this._draw(this._items);
  }

  _cols() {
    return Math.min(4, Math.max(1, Number(this._config.columns) || 2));
  }

  // `layout: tiles`: one large tile per entity, the size of Home Assistant's Tile card (easier to tap on a phone).
  _tiles() {
    return this._config?.layout === "tiles";
  }

  // Overviews: the grid of room tiles (`tile(room)`), its columns, the empty and idle states, then the open room's
  // details kept in step with the rooms shown.
  _roomGrid(grid, rooms, tile) {
    const cols = Number(this._config.columns);
    // A `columns` of 1 or 2 holds on a narrow card; 3 and more go down to two under 340 px, one under 260 px.
    grid.classList.toggle("fixed", cols >= 1 && cols <= 2);
    grid.style.setProperty("--cols", String(Math.min(6, Math.max(1, cols || 3))));
    // Every room idle with the "hide idle rooms" option: the header alone says it all.
    const idle = !rooms.length && this._total > 0;
    grid.hidden = idle;
    if (idle) grid.innerHTML = "";
    else grid.innerHTML = rooms.length ? rooms.map(tile).join("") : `<div class="empty">${rcEsc(this._t("no_rooms"))}</div>`;
    if (this._openArea && !rooms.some((x) => x.id === this._openArea)) this._toggle(null);
    else if (this._openArea) this._fillPanel();
  }

  _head({ icon, title, status, chips = "", allOff = false }) {
    const c = this._config;
    return `
      <div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
        <div class="badge"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
        <div class="title">${rcEsc(title)}</div>
        ${chips}
        <button class="pill${allOff ? " action" : ""}" title="${rcEsc(allOff ? this._t("turn_all_off") : status)}"${allOff ? "" : " disabled"}>
          ${allOff ? '<ha-icon icon="mdi:power"></ha-icon>' : ""}<span class="pt">${rcEsc(status)}</span>
        </button>
      </div>`;
  }

  _tile(i, { cls = "", style = "", extra = "", state = i.state, title = `${i.name} — ${i.state}` }) {
    return `
      <button class="tile ${i.unavailable ? "na" : i.on ? "on" : "off"}${cls}" data-id="${rcEsc(i.id)}"
              ${style ? `style="${rcEsc(style)}"` : ""} title="${rcEsc(title)}">
        ${extra}
        <span class="ic"><ha-icon icon="${rcEsc(i.icon)}"></ha-icon></span>
        <span class="txt">
          <span class="name">${rcEsc(i.name)}</span>
          <span class="state">${state}</span>
        </span>
      </button>`;
  }

  _paint(level, head, tiles, extraClass = "") {
    // The tile or control with the keyboard focus keeps it through the redraw (a toggle, a step or a two-tap
    // confirmation from the keyboard): tiles by their data-id, controls by their data-k.
    const active = this._byPointer ? null : this.shadowRoot.activeElement;
    const focused = active?.dataset?.id;
    const focusKey = active?.dataset?.k;
    this.shadowRoot.innerHTML = `
      <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${level}${extraClass}${this._tiles() ? " layout-tiles" : ""}">
        ${head}
        ${tiles ? `<div class="grid" style="--cols:${this._cols()}">${tiles}</div>` : ""}
        ${this._afterGrid()}
      </ha-card>`;
    const root = this.shadowRoot;
    root.querySelector(".pill.action")?.addEventListener("click", (ev) => this._allOff(ev));
    if (this._config.navigation_path) rcBindNav(root.querySelector(".head"), this._config.navigation_path);
    for (const el of root.querySelectorAll(".tile")) {
      this._bindTile(el, (this._items || []).find((i) => i.id === el.dataset.id));
      if (focused && el.dataset.id === focused) el.focus({ preventScroll: true });
    }
    this._bindAfter(root);
    if (focusKey) root.querySelector(`[data-k="${focusKey}"]`)?.focus({ preventScroll: true });
  }

  // What a card adds under its tiles (the Lights card's scenes), and its event wiring.
  _afterGrid() {
    return "";
  }

  _bindAfter() {}

  // The "turn everything off" button of the header (full card) or of the status (mini card).
  _allOff(ev) {
    ev.stopPropagation();
    const ids = (this._items || []).filter((i) => i.on).map((i) => i.id);
    if (!ids.length) return;
    // A host card may ask first (the Overview confirms before turning plugs off); otherwise off at once.
    if (this._confirmOff) this._confirmOff(ids);
    else rcCall(this._hass, "homeassistant", "turn_off", { entity_id: ids });
  }

  // Tap, hold for more-info, and an optional horizontal drag ({ move(x), end(x), step(delta), flush() }). From the
  // keyboard: Enter / Space tap, Shift+Enter or the context-menu key open the details, ←/→ step the drag by ∓/±10
  // (a held key at most every RC_REPEAT_MS), and releasing the arrow calls `flush`.
  _bindPress(el, { onTap, onHold, drag }) {
    let start = null;
    let mode = null; // null | "hold" | "drag"
    let timer = null;
    let lastStep = 0;
    el.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      start = { x: ev.clientX, y: ev.clientY };
      mode = null;
      this._pressing = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        // The card may have been detached mid-press (nothing else clears this timer): no hold on a dead node.
        if (mode || !this.isConnected) return;
        mode = "hold";
        // The press is settled (no tap): the details may open over the tile, so its pointerup may never come.
        this._released();
        onHold();
      }, RC_HOLD_MS);
    });
    el.addEventListener("pointermove", (ev) => {
      if (!start || mode === "hold") return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!mode && drag && Math.abs(dx) > RC_MOVE_PX && Math.abs(dx) > Math.abs(dy)) {
        mode = "drag";
        clearTimeout(timer);
        this._dragging = true;
        el.setPointerCapture(ev.pointerId);
        el.classList.add("dragging");
      } else if (!mode && (Math.abs(dx) > RC_MOVE_PX || Math.abs(dy) > RC_MOVE_PX)) {
        clearTimeout(timer); // scrolling, or dragging what cannot be dragged: not a tap
        start = null;
        this._released();
      }
      if (mode === "drag") drag.move(ev.clientX);
    });
    const end = (ev, cancelled) => {
      clearTimeout(timer);
      if (!start) return;
      const wasDrag = mode === "drag";
      if (wasDrag) {
        this._dragging = false;
        el.classList.remove("dragging");
        if (!cancelled) drag.end(ev.clientX);
        this._sig = null;
      } else if (!mode && !cancelled) {
        onTap();
      }
      start = null;
      mode = null;
      // After a drag, the next update redraws (the bar keeps the new level until the light reports it).
      this._released(!wasDrag);
    };
    // The mouse leaving the tile mid-press (no capture outside a drag) cancels it: neither a tap nor a hold.
    el.addEventListener("pointerleave", () => {
      if (!start || mode) return;
      clearTimeout(timer);
      start = null;
      this._released();
    });
    el.addEventListener("pointerup", (ev) => end(ev, false));
    el.addEventListener("pointercancel", (ev) => end(ev, true));
    el.addEventListener("contextmenu", (ev) => ev.preventDefault());
    el.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" && ev.shiftKey) || ev.key === "ContextMenu") {
        ev.preventDefault();
        if (!ev.repeat) onHold();
      } else if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (!ev.repeat) onTap();
      } else if (drag?.step && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
        ev.preventDefault();
        if (ev.repeat && ev.timeStamp - lastStep < RC_REPEAT_MS) return;
        lastStep = ev.timeStamp;
        drag.step(ev.key === "ArrowRight" ? 10 : -10);
      }
    });
    // The arrow released: the stepped level goes out now rather than after the pause.
    el.addEventListener("keyup", (ev) => {
      if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") drag?.flush?.();
    });
  }

  // End of a press: renders now what an update brought during it.
  _released(flush = true) {
    this._pressing = false;
    if (!this._deferred || this._dragging) return;
    this._deferred = false;
    if (flush) this._render();
  }

  // Default tile: tap toggles, hold opens the details.
  _bindTile(el, item) {
    this._bindPress(el, {
      onTap: () => !item?.unavailable && rcCall(this._hass, "homeassistant", "toggle", { entity_id: el.dataset.id }),
      onHold: () => rcMoreInfo(this, el.dataset.id),
    });
  }
}

// ── Mini cards ───────────────────────────────────────────────────────────────
// A mini card shows what its full card (`Base`) shows on two lines: the room badge, title and status, then one chip
// per entity. Its zoom button (top right, `zoom: false` removes it) switches it to the full card and back; a click
// anywhere else brings it back too.
// The subclass implements `_drawMini(items)`, which builds the chips and calls `_paintMini`.
// Zoomed in, everything is shown (`only_alerts` and `hide_when_clear` only apply to the compact view). With
// `alertsOnly`, the compact view always shows only what needs a look (no `only_alerts` option then): quiet entities
// show once zoomed in.
const rcMini = (Base, tag, styles, { alertsOnly = false } = {}) =>
  class extends Base {
    static tag = tag;
    static defaults = (({ only_alerts, ...rest }) => ({ ...rest, ...(alertsOnly ? {} : { only_alerts }), zoom: true }))(
      Base.defaults,
    );
    static styles = `${Base.styles}${RC_MINI_STYLES}${styles}`;

    constructor() {
      super();
      // A click anywhere else brings the card back to its compact view.
      this._onUnzoom = (ev) => {
        if (rcOutside(this, ev)) rcUnzoom(this);
      };
    }

    connectedCallback() {
      super.connectedCallback?.();
      this._unzoom ??= watchOutside(this, this._onUnzoom);
      this._unzoom.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this._unzoom?.off();
      // Left (another dashboard view, a conditional card hidden): back to the compact view.
      rcUnzoom(this);
    }

    getCardSize() {
      if (this._zoomed) return super.getCardSize();
      return this.style.display === "none" ? 0 : 1;
    }

    getGridOptions() {
      return { columns: 12, min_columns: 6, rows: "auto" };
    }

    _draw(items) {
      const config = this._config;
      // The base card's own filter does the work: off zoomed in, always on in an `alertsOnly` compact view.
      if (this._zoomed) this._config = { ...config, only_alerts: false, hide_when_clear: false };
      else if (alertsOnly) this._config = { ...config, only_alerts: true };
      try {
        if (this._zoomed) super._draw(items);
        else this._drawMini(items);
      } finally {
        this._config = config;
      }
      this._addZoom();
    }

    _paintMini({ level, icon, status, chips, cls = "", allOff = false }) {
      const c = this._config;
      const nav = c.navigation_path;
      // With `allOff` the status is the "turn everything off" button, like the full card's pill.
      const st = allOff
        ? `<button class="st action" title="${rcEsc(this._t("turn_all_off"))}"><ha-icon icon="mdi:power"></ha-icon><span class="pt">${rcEsc(status)}</span></button>`
        : `<span class="st" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`;
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          <div class="mini">
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="body">
              <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
                <div class="title">${rcEsc(c.title || this._areaName() || this._t("title"))}</div>
                ${st}
              </div>
              <div class="rs">${chips}</div>
            </div>
          </div>
        </ha-card>`;
      const root = this.shadowRoot;
      if (nav) rcBindNav(root.querySelector(".head"), nav);
      root.querySelector(".st.action")?.addEventListener("click", (ev) => this._allOff(ev));
      for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    }

    // Zoom button at the end of the header, top right in both views, added once per render.
    // Its click is the overviews' (rcZoomClick): stop the tap on the title (navigation_path), toggle, keep the
    // keyboard focus (Enter / Space: no click count) on the button that replaced this one.
    _addZoom() {
      const head = this._config.zoom && this.shadowRoot.querySelector(".head");
      if (!head || head.querySelector(".zoom")) return;
      const button = document.createElement("button");
      button.className = "zoom";
      button.title = this._t(this._zoomed ? "zoom_out" : "zoom_in");
      button.innerHTML = `<ha-icon icon="${rcZoomIcon(this)}"></ha-icon>`;
      button.addEventListener("click", (ev) => rcZoomClick(this, ev));
      head.appendChild(button);
    }
  };

const rcBooleans = (...names) => names.map((name) => ({ name, selector: { boolean: {} } }));

const rcAdvanced = (i18n, lang, ...names) => [
  {
    name: "advanced",
    type: "expandable",
    flatten: true,
    schema: names.map((name) =>
      name === "language"
        ? {
            name,
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "", label: rcT(i18n, lang, "ed_language_auto") },
                  { value: "en", label: "English" },
                  { value: "fr", label: "Français" },
                  { value: "de", label: "Deutsch" },
                  { value: "es", label: "Español" },
                  { value: "sr", label: "Српски" },
                  { value: "sr-Latn", label: "Srpski (latinica)" },
                  { value: "it", label: "Italiano" },
                  { value: "nl", label: "Nederlands" },
                  { value: "pt", label: "Português (Portugal)" },
                  { value: "pl", label: "Polski" },
                  { value: "ro", label: "Română" },
                  { value: "da", label: "Dansk" },
                  { value: "sv", label: "Svenska" },
                  { value: "bg", label: "Български" },
                  { value: "ru", label: "Русский" },
                  { value: "uk", label: "Українська" },
                  { value: "hu", label: "Magyar" },
                  { value: "sk", label: "Slovenčina" },
                  { value: "cs", label: "Čeština" },
                  { value: "sl", label: "Slovenščina" },
                  { value: "lv", label: "Latviešu" },
                  { value: "el", label: "Ελληνικά" },
                ],
              },
            },
          }
        : { name, selector: { object: {} } },
    ),
  },
];

// `schema(lang, hass, config)` lists the fields; options left at the card's default are not written to the YAML
// (list defaults such as `exclude: []` are not shown in the form: an empty list is never written anyway).
// `autos` maps an option to its default worked out from the config (`(hass, config) => value`): shown in the form
// while unset, and kept out of the YAML when left at it.
// Entity lists the form edits with an entity picker (ids only): an item written `{ entity, name, icon }` in YAML shows as its entity,
// and gets its name and icon back when the form changes the list (ha-room-card#77).
const RC_ENTITY_LISTS = ["include"];
const rcListIds = (list) => (Array.isArray(list) ? list.map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean) : list);
const rcListKeep = (ids, before) =>
  Array.isArray(ids) ? ids.map((id) => (Array.isArray(before) ? before.find((e) => typeof e === "object" && e?.entity === id) : undefined) ?? id) : ids;

const rcEditor = ({ card, helpers, schema, autos = {} }) => {
  const i18n = card.i18n;
  const defaults = { show_title: true, ...Object.fromEntries(Object.entries(card.defaults).filter(([, v]) => !Array.isArray(v))) };
  return class extends HTMLElement {
    setConfig(config) {
      this._config = config;
      this._update();
    }

    set hass(hass) {
      this._hass = hass;
      this._update();
    }

    _update() {
      if (!this._hass || !this._config) return;
      const lang = rcLang(i18n, this._hass, this._config);
      // Read by the label and helper callbacks, set once on the form: a language change must reach them too.
      this._lang = lang;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (s) => rcT(i18n, this._lang, `ed_${s.name}`);
        this._form.computeHelper = (s) =>
          helpers.includes(s.name) ? rcT(i18n, this._lang, `ed_${s.name}_helper`) : undefined;
        this._form.addEventListener("value-changed", (ev) => {
          const config = { ...ev.detail.value };
          for (const k of RC_ENTITY_LISTS) if (k in config) config[k] = rcListKeep(config[k], this._config[k]);
          for (const k of Object.keys(config)) {
            const v = config[k];
            if (v === "" || v == null || (Array.isArray(v) && !v.length) || defaults[k] === v) delete config[k];
          }
          for (const [k, auto] of Object.entries(autos)) {
            const untouched = this._config[k] === undefined && config[k] === auto(this._hass, this._config);
            if (untouched || config[k] === auto(this._hass, config)) delete config[k];
          }
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      // A new data or schema object re-renders the whole form, and the schema runs the card's discovery:
      // both only change with the config, the language or the registries.
      const memo = (this._memo ||= {});
      const h = this._hass;
      this._form.data = rcMemo(memo, "data", [this._config, h.areas], () => {
        const data = { ...defaults, ...this._config };
        for (const k of RC_ENTITY_LISTS) if (k in data) data[k] = rcListIds(data[k]);
        for (const [k, auto] of Object.entries(autos)) data[k] ??= auto(h, this._config);
        return data;
      });
      this._form.schema = rcMemo(memo, "schema", [lang, this._config, h.entities, h.devices, h.areas], () =>
        schema(lang, h, this._config),
      );
    }
  };
};

const rcRegister = (card, editor, name, description) => {
  if (customElements.get(card.tag)) return;
  customElements.define(card.tag, card);
  customElements.define(`${card.tag}-editor`, editor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: card.tag,
    name,
    description,
    preview: true,
    documentationURL: "https://github.com/juju35/ha-console-card",
  });
};

if (!customElements.get("console-card")) {
  console.info(`%c HA-CONSOLE-CARD %c v${RC_VERSION} `, "background:#5b5bd6;color:#fff;font-weight:700", "");
}

// ── Common styles ────────────────────────────────────────────────────────────
const RC_BASE_STYLES = `
  :host {
    --rc-ok: var(--success-color, #43a047);
    --rc-warn: var(--warning-color, #ffa600);
    --rc-alert: var(--error-color, #db4437);
    --rc-info: var(--info-color, #039be5);
    --rc-light: var(--state-light-active-color, #ffb300);
    --rc-plug: var(--state-switch-on-color, var(--primary-color, #03a9f4));
    --rc-idle: var(--secondary-text-color, #9e9e9e);
    --rc-na: var(--disabled-color, #9e9e9e);
    display: block;
    min-width: 0;
  }
  /* The card answers its own width (container queries). That containment drops its content from its natural width: in
     a wrapper sized by its content (inline-block, a grid's auto column, a flex row: layout-card, button-card…) it would
     shrink to its padding. The empty grid below (no height) gives the host a natural width of 344 px there, as a
     preferred width only: its column is minmax(0, …), so the card still shrinks to its column in a grid card, a
     horizontal stack or a 1fr column, even wrapped in a <div> (hui-card in layout-card). contain-intrinsic-inline-size
     or a min-width in px would be a minimum there, and the card would overflow. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 344px); height: 0; }
  ha-card { padding: 12px; overflow: hidden; container-type: inline-size; }
  ha-card.lvl-alert { box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc-alert) 45%, transparent), var(--ha-card-box-shadow, none); }

  .head { display: flex; align-items: center; gap: 10px; }
  .head.nav { cursor: pointer; }
  .head.nav:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
  .badge { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge ha-icon { --mdc-icon-size: 24px; }
  .lvl-alert .badge { animation: rc-pulse 1.6s ease-in-out infinite; }
  /* Narrow header: the title keeps a few letters (never 0 px), the status pill shrinks and ellipsises, the icon buttons
     (zoom, power) never shrink; under 200 px the pill is only its coloured dot, its text kept for screen readers. */
  .title { flex: 1 1 0; min-width: 5ch; font-size: 16px; font-weight: 500; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
           /* show_title: false keeps the title's room (the pill and buttons stay in place) */
  :host([hide-title]) .head > .title { visibility: hidden; }
  .pill { all: unset; flex: 0 1 auto; min-width: 0; box-sizing: border-box; position: relative;
          display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500;
          padding: 1px 8px; border-radius: 999px; background: color-mix(in srgb, var(--c) 14%, transparent);
          /* Coloured text is half the accent, half the text colour: 4.5:1 on its tint in light and dark themes, where
             the bare accent (amber above all) is not. */
          color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
  .pt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pill ha-icon { flex: none; }
  /* A card this narrow (6 columns of the Sections view on a phone): the title is at its few letters already, so the
     status pill goes to a line of its own under it, where its whole label fits, rather than end with "…". */
  @container (max-width: 260px) {
    .head { flex-wrap: wrap; row-gap: 4px; }
    .head::after { content: ""; order: 1; flex: 1 0 100%; }
    .head > .pill { order: 2; margin-left: 50px; max-width: calc(100% - 50px); }
  }
  @container (max-width: 200px) {
    /* Under 200 px the pill is only its dot again: back on the title's line. */
    .head { flex-wrap: nowrap; }
    .head::after { content: none; }
    .head > .pill { order: 0; margin-left: 0; max-width: none; }
    .head > .pill .pt, .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .head > .pill:not(.action), .st { flex: none; padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    .head > .pill:not(.action)::before, .st::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    .head > .pill.action { padding: 1px 4px; }
    /* A full card this narrow (6 columns of the Sections view on a phone): a smaller badge, no side chip in the header. */
    .head { gap: 6px; }
    .head > .badge { width: 32px; height: 32px; }
    .head > .badge ha-icon { --mdc-icon-size: 20px; }
    .head > .chip { display: none; }
  }
  .pill.action { cursor: pointer; }
  .pill.action:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
  .pill.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .pill ha-icon { --mdc-icon-size: 12px; margin-left: -2px; }

  .grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  .tile { all: unset; position: relative; overflow: hidden; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: flex; align-items: center; gap: 8px; padding: 5px 8px 5px 5px; border-radius: 10px;
          touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
          background: color-mix(in srgb, var(--t) 9%, var(--secondary-background-color, transparent));
          border: 1px solid color-mix(in srgb, var(--t) 22%, transparent); transition: background .2s, border-color .2s; }
  .tile.off, .tile.na { background: var(--secondary-background-color, transparent); border-color: transparent; }
  .tile.na { --t: var(--rc-na); opacity: .7; }
  .tile:hover { background: color-mix(in srgb, var(--t) 15%, var(--secondary-background-color, transparent)); }
  .tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .ic, .txt { position: relative; }
  .ic { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
        color: var(--t); background: color-mix(in srgb, var(--t) 20%, transparent); }
  .ic ha-icon { --mdc-icon-size: 16px; }
  .txt { display: flex; flex-direction: column; min-width: 0; }
  .name { font-size: 13px; font-weight: 500; line-height: 1.2; color: var(--primary-text-color);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* A reading is never cut: on a narrow tile it goes on to a second line (the name, a label, keeps its ellipsis). */
  .state { font-size: 11px; line-height: 1.2; color: var(--secondary-text-color); overflow-wrap: break-word; }
  /* A card this narrow (a phone, 6 columns of the Sections view): one tile per row, whatever the columns option. */
  @container (max-width: 260px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  /* layout: tiles — the size of Home Assistant's Tile card — 56 px high, a 40 px icon, the name over the state. */
  .layout-tiles .grid { gap: 8px; }
  .layout-tiles .tile { min-height: 56px; gap: 10px; padding: 8px 10px 8px 8px; border-radius: 12px; }
  .layout-tiles .ic { width: 40px; height: 40px; }
  .layout-tiles .ic ha-icon { --mdc-icon-size: 24px; }
  .layout-tiles .txt { gap: 2px; }
  .layout-tiles .name { font-size: 14px; line-height: 1.25; }
  .layout-tiles .state { font-size: 12px; line-height: 1.25; }

  @keyframes rc-blink { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
  @keyframes rc-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 45%, transparent) }
                        50% { box-shadow: 0 0 0 7px transparent } }
  @media (prefers-reduced-motion: reduce) { .tile, .lvl-alert .badge { animation: none; transition: none; } }
`;

// Mini cards: layout, chips and zoom button. A chip is plain (icon and text) until it needs a look: then a tinted pill.
// The zoom / detail button of the mini cards and the overviews.
const RC_ZOOM_STYLES = `
  /* 40 px to tap, laid out as the 24 px it looks (the negative margins). */
  .zoom { all: unset; flex: none; cursor: pointer; width: 40px; height: 40px; margin: -12px -12px -12px -8px; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom ha-icon { --mdc-icon-size: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--rc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
`;

const RC_MINI_STYLES = `${RC_ZOOM_STYLES}
  /* The badge sits 12px from the card's top-left corner, like the other ha-* cards, beside the title and the readings. */
  ha-card:has(.mini) { padding: 12px; }
  .mini { display: flex; align-items: flex-start; gap: 10px; }
  /* The badge keeps the full card's size (40 px, icon 24 px): the body is at least as tall, a lone title line centred
     beside it. */
  .body { flex: 1; min-width: 0; min-height: 40px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .mini .head { gap: 8px; }
  .mini .title { line-height: 1.25; }
  .st { flex: 0 1 auto; min-width: 0; position: relative; display: inline-flex; align-items: center;
        margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c); }
  .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
  .rs:empty { display: none; }
  /* A chip never runs past the card: a long name ends with an ellipsis. */
  .r { all: unset; cursor: pointer; display: inline-flex; align-items: baseline; gap: 1px; padding: 0 5px 0 4px;
       box-sizing: border-box; min-width: 0; max-width: 100%; overflow: hidden;
       border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 24px; white-space: nowrap; --t: var(--rc-ok);
       color: var(--primary-text-color); }
  .r ha-icon { --mdc-icon-size: 13px; flex: none; color: var(--t); align-self: center; margin-right: 2px; }
  .r > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .r.pill { color: color-mix(in srgb, var(--t) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--t) 14%, transparent); }
  .r:hover { background: color-mix(in srgb, var(--t) 20%, var(--secondary-background-color, transparent)); }
  .r:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
`;
