/**
 * Jeu d'icônes LACUNA — rendu par AppIcon.vue
 *
 * Règles de dessin (toutes les icônes) :
 * - grille 24 × 24, marge de 2 px environ ;
 * - trait 1.5, extrémités et angles arrondis (posés par AppIcon) ;
 * - couleur héritée (currentColor) ; fill="currentColor" seulement pour les petits points pleins.
 *
 * Un nom = un sens : ne pas réutiliser une icône pour un autre concept.
 */
export const ICONS = {
  // ── Interface ──
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  'arrow-down': '<path d="M12 5v14M6 13l6 6 6-6"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/>',
  panels: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M8.5 4v16M15.5 4v16"/>',
  dot: '<circle cx="12" cy="12" r="4" fill="currentColor"/>',
  'dot-outline': '<circle cx="12" cy="12" r="4"/>',
  warning: '<path d="M12 3.5L21.5 20h-19z"/><path d="M12 10v4.5M12 17.25v.25"/>',

  // ── Modules (barre d'instruments) ──
  observatory: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>',
  'star-map': '<circle cx="5" cy="17" r="1.75"/><circle cx="12" cy="6.5" r="1.75"/><circle cx="19" cy="14" r="1.75"/><path d="M6 15.5l5-7.5M13.3 7.8l4.5 4.9"/>',
  laboratory: '<path d="M9 3h6M10 3v6l-5.4 9.4A1.7 1.7 0 0 0 6.1 21h11.8a1.7 1.7 0 0 0 1.5-2.6L14 9V3"/><path d="M7.4 15h9.2"/>',
  artifact: '<path d="M12 2.5l9.5 9.5-9.5 9.5L2.5 12z"/><path d="M12 8l4 4-4 4-4-4z"/>',
  journal: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8.5 3v18M11.5 8h4.5M11.5 11.5h4.5"/>',
  galaxy: '<circle cx="12" cy="12" r="1.5"/><path d="M10.6 11.4C8 9.5 4.5 10.5 3.5 14M12.6 10.6C14.5 8 13.5 4.5 10 3.5M13.4 12.6c2.6 1.9 6.1.9 7.1-2.6M11.4 13.4C9.5 16 10.5 19.5 14 20.5"/>',
  population: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9" r="2.5"/><path d="M16.5 14a4.5 4.5 0 0 1 4.5 6"/>',
  gauge: '<path d="M3.5 17a8.5 8.5 0 1 1 17 0"/><path d="M12 15l4-5"/><circle cx="12" cy="15.5" r="1.25" fill="currentColor"/><path d="M5.5 17h3M15.5 17h3"/>',
  sparkle: '<path d="M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8z"/>',

  // ── Vaisseau (menu Systèmes) ──
  identity: '<rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 16.5a3.5 3.5 0 0 1 7 0M14.5 10h4M14.5 13.5h4"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/><path d="M8.5 11.5a4.5 4.5 0 0 1 7 0"/>',
  bumper: '<path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/><path d="M12 7l4.3 2.5v5L12 17l-4.3-2.5v-5z"/>',
  habitat: '<ellipse cx="12" cy="12" rx="9.5" ry="4"/><ellipse cx="12" cy="12" rx="5" ry="2"/><path d="M12 3v6M12 15v6"/>',
  reactor: '<circle cx="12" cy="12" r="1.5" fill="currentColor"/><ellipse cx="12" cy="12" rx="9.5" ry="3.75"/><ellipse cx="12" cy="12" rx="9.5" ry="3.75" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="3.75" transform="rotate(-60 12 12)"/>',
  radiator: '<path d="M7 5h10v14H7z"/><path d="M10.3 5v14M13.7 5v14M3 12h4M17 12h4"/>',
  tank: '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M7 9.5h10M7 14.5h10"/>',
  thruster: '<path d="M9 3h6v5l2.5 5h-11L9 8z"/><path d="M9.5 16c0 2 1 3.5 2.5 5 1.5-1.5 2.5-3 2.5-5"/>',
  laser: '<circle cx="6" cy="18" r="2"/><path d="M7.5 16.5l2.5-2.5M12 12l2.5-2.5M16.5 7.5L20 4M15.5 4H20v4.5"/>',
  pulsar: '<circle cx="12" cy="12" r="2.5"/><path d="M12 2v6M12 16v6M7.5 4.5c2 1.5 7 1.5 9 0M7.5 19.5c2-1.5 7-1.5 9 0"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3 4v4.5h4.5"/><path d="M12 7.5V12l3 2"/>',

  // ── Population ──
  generations: '<path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20.5a7 7 0 0 1 14 0"/>',
  register: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5V20"/>',
  account: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5a6 6 0 0 1 11 0"/>',

  // ── Types de traces (Artefacts) ──
  radio: '<circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.5 5.5a9.2 9.2 0 0 0 0 13M18.5 5.5a9.2 9.2 0 0 1 0 13"/>',
  interstellar: '<ellipse cx="14.5" cy="9.5" rx="6.5" ry="2.5" transform="rotate(-35 14.5 9.5)"/><path d="M3 21l1.5-1.5M6.5 17.5L8 16"/>',
  molecule: '<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="9" r="2.5"/><circle cx="10" cy="17.5" r="2.5"/><path d="M9.5 7.5l5 1M7.6 9.4l1.6 5.7M15.4 10.9l-3.8 4.7"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  orbit: '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/><circle cx="12" cy="12" r="1.5"/><circle cx="18.5" cy="6.5" r="1.5" fill="currentColor"/>',
  sequence: '<path d="M4 6v12M8 6v3M8 15v3M12 6v12M16 6v3M16 15v3M20 6v12"/>',
  marker: '<path d="M6 21V4h11l-2.5 4 2.5 4H6"/>',

  // ── Types d'observation ──
  'obs-system': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
  'obs-planet': '<circle cx="12" cy="13" r="8"/><circle cx="12" cy="5" r="3" fill="currentColor"/>',
  specimen: '<path d="M7.5 16.5v-9L12 4.5l4.5 3v9L12 19.5z"/><path d="M7.5 7.5l4.5 3 4.5-3M12 10.5v9"/>',

  // ── Structure des signaux ──
  'signal-burst': '<path d="M2 14c6.5 0 5-6 10-6s3.5 6 10 6"/>',
  'signal-pulse': '<path d="M2 15c3.3 0 2-6 6.7-6s3.3 6 6.6 6 2-6 6.7-6"/>',
  'signal-irregular': '<path d="M4.5 7v10M9.5 9v6M14.5 6v12M19.5 10.5v3"/>',
  'signal-square': '<path d="M2 15h3V9h7v6h7V9h3"/>',

  // ── Radar ──
  'noise-filter': '<path d="M3 14l2-5 2 6 2-7 2 8 2-6 2 4 2-3 2 2 2-1"/><path d="M4 4l16 16"/>',

  // ── Instruments du Laboratoire ──
  spectrum: '<path d="M4 12v2M8 8v8M12 5v14M16 10v4M20 11v2"/>',
  pulse: '<path d="M3 12h4l2-5 3 10 2-5h7"/>',
  polarization: '<ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-25 12 12)"/><path d="M12 3v18" stroke-dasharray="1.5 2.5"/>',
  energy: '<path d="M13 2.5L5.5 13.5H11l-1 8 8.5-11H13z"/>',
  gravity: '<circle cx="12" cy="7" r="3"/><path d="M12 12v8M8.5 16.5L12 20l3.5-3.5"/>',
  star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5l-5.4 3 1.2-6-4.5-4.2 6.1-.7z"/>',
  atmosphere: '<path d="M2.5 20h19"/><path d="M4 20a8 8 0 0 1 16 0"/><path d="M8 20a4 4 0 0 1 8 0"/>',
  volume: '<path d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5z"/><path d="M3.5 7.25L12 12l8.5-4.75M12 12v9.5"/>',
  'grid-scan': '<path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5"/><path d="M7 12h10M12 7v10"/>',
  magnet: '<path d="M7 3v8a5 5 0 0 0 10 0V3"/><path d="M7 7h3.5M13.5 7H17"/><path d="M10.5 3v8a1.5 1.5 0 0 0 3 0V3"/>',
  probe: '<path d="M9 3h6M12 3v10"/><path d="M9.5 13h5L12 17z"/><path d="M3 20.5h18"/>',
  'test-tube': '<path d="M9 3h6M10 3v14.5a2 2 0 0 0 4 0V3"/><path d="M10 11h4"/>',
}
