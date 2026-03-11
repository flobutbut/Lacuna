/**
 * Données stellaires scientifiquement plausibles — sources : NASA Exoplanet Archive, Wikipedia
 * Systèmes existants exclus : SOL, PROXIMA, BARNARD, ROSS128, EPSILON_ERIDANI, TAU_CETI, GLIESE667, HD44594, PSR_B1919
 */

export const extendedSystems = [
  // < 15 ly
  { id: 'LALANDE21185', name: 'Lalande 21185', spec: 'M2V', dist: 8.3, age: 5, pnum: 2, hz: true, anom: 0, ra: 168.5, dec: 35.2, starMass: 0.46, planets: [
    { des: 'b', name: 'Lalande 21185 b', period: 12.94, mass: 2.69, hz: false },
    { des: 'c', name: 'Lalande 21185 c', period: 2946, mass: 13.6, hz: false }
  ]},
  { id: 'GLIESE887', name: 'Gliese 887', spec: 'M1.5V', dist: 10.7, age: 4, pnum: 4, hz: true, anom: 0, ra: 350.9, dec: -35.3, starMass: 0.49, planets: [
    { des: 'b', name: 'Gliese 887 b', period: 9.26, mass: 3.9, hz: false },
    { des: 'c', name: 'Gliese 887 c', period: 21.78, mass: 6.5, hz: false },
    { des: 'd', name: 'Gliese 887 d', period: 50.77, mass: 6.1, hz: true }
  ]},
  { id: 'GJ1061', name: 'GJ 1061', spec: 'M5.5V', dist: 12.0, age: 7, pnum: 3, hz: true, anom: 0, ra: 53.2, dec: -44.5, starMass: 0.11, planets: [
    { des: 'b', name: 'GJ 1061 b', period: 3.2, mass: 1.37, hz: false },
    { des: 'c', name: 'GJ 1061 c', period: 6.69, mass: 1.74, hz: true },
    { des: 'd', name: 'GJ 1061 d', period: 13.03, mass: 1.64, hz: true }
  ]},
  { id: 'GROOMBRIDGE34', name: 'Groombridge 34', spec: 'M1.5V', dist: 11.6, age: 3, pnum: 2, hz: false, anom: 0, ra: 9.2, dec: 43.9, starMass: 0.38, planets: [
    { des: 'b', name: 'Groombridge 34 b', period: 11.44, mass: 3.03, hz: false },
    { des: 'c', name: 'Groombridge 34 c', period: 7600, mass: 36, hz: false }
  ]},
  { id: 'EPSILON_INDI', name: 'Epsilon Indi', spec: 'K5V', dist: 11.9, age: 1.3, pnum: 1, hz: false, anom: 0, ra: 330.9, dec: -56.9, starMass: 0.76, planets: [
    { des: 'b', name: 'Epsilon Indi b', period: 63400, mass: 2005, hz: false }
  ]},
  { id: 'YZ_CETI', name: 'YZ Ceti', spec: 'M4V', dist: 12.1, age: 3, pnum: 3, hz: false, anom: 0, ra: 18.1, dec: -16.0, starMass: 0.13, planets: [
    { des: 'b', name: 'YZ Ceti b', period: 2.02, mass: 0.7, hz: false },
    { des: 'c', name: 'YZ Ceti c', period: 3.06, mass: 1.14, hz: false },
    { des: 'd', name: 'YZ Ceti d', period: 4.66, mass: 1.09, hz: false }
  ]},
  { id: 'LUYTEN_STAR', name: 'Étoile de Luyten', spec: 'M3.5V', dist: 12.3, age: 8, pnum: 2, hz: true, anom: 0, ra: 110.0, dec: 5.2, starMass: 0.29, planets: [
    { des: 'b', name: 'Luyten b', period: 18.65, mass: 2.89, hz: true },
    { des: 'c', name: 'Luyten c', period: 4.72, mass: 1.18, hz: false }
  ]},
  { id: 'TEEGARDEN', name: 'Étoile de Teegarden', spec: 'M7V', dist: 12.5, age: 8, pnum: 3, hz: true, anom: 0, ra: 43.3, dec: 16.9, starMass: 0.08, planets: [
    { des: 'b', name: 'Teegarden b', period: 4.91, mass: 1.16, hz: true },
    { des: 'c', name: 'Teegarden c', period: 11.42, mass: 1.05, hz: true },
    { des: 'd', name: 'Teegarden d', period: 26.13, mass: 0.82, hz: false }
  ]},
  { id: 'WOLF1061', name: 'Wolf 1061', spec: 'M3V', dist: 14.0, age: 5, pnum: 3, hz: true, anom: 0, ra: 247.5, dec: -12.7, starMass: 0.25, planets: [
    { des: 'b', name: 'Wolf 1061 b', period: 4.89, mass: 1.91, hz: false },
    { des: 'c', name: 'Wolf 1061 c', period: 17.87, mass: 3.41, hz: true },
    { des: 'd', name: 'Wolf 1061 d', period: 217, mass: 7.7, hz: false }
  ]},
  { id: 'GLIESE876', name: 'Gliese 876', spec: 'M4V', dist: 15.2, age: 10, pnum: 4, hz: false, anom: 0, ra: 340.1, dec: -14.2, starMass: 0.33, planets: [
    { des: 'b', name: 'Gliese 876 b', period: 61.1, mass: 749, hz: false },
    { des: 'c', name: 'Gliese 876 c', period: 30.1, mass: 235, hz: false },
    { des: 'd', name: 'Gliese 876 d', period: 1.94, mass: 6.68, hz: false },
    { des: 'e', name: 'Gliese 876 e', period: 123.6, mass: 16, hz: false }
  ]},
  { id: 'GJ1002', name: 'GJ 1002', spec: 'M5.5V', dist: 15.8, age: 5, pnum: 2, hz: true, anom: 0, ra: 1.5, dec: -7.5, starMass: 0.12, planets: [
    { des: 'b', name: 'GJ 1002 b', period: 10.35, mass: 1.08, hz: true },
    { des: 'c', name: 'GJ 1002 c', period: 21.2, mass: 1.36, hz: true }
  ]},
  { id: 'GLIESE832', name: 'Gliese 832', spec: 'M2V', dist: 16.2, age: 9, pnum: 1, hz: false, anom: 0, ra: 259.2, dec: -49.0, starMass: 0.45, planets: [
    { des: 'b', name: 'Gliese 832 b', period: 3853, mass: 315, hz: false }
  ]},
  { id: 'GLIESE674', name: 'Gliese 674', spec: 'M3V', dist: 14.8, age: 5, pnum: 1, hz: false, anom: 0, ra: 262.4, dec: -51.1, starMass: 0.35, planets: [
    { des: 'b', name: 'Gliese 674 b', period: 4.69, mass: 11.1, hz: false }
  ]},
  { id: 'GLIESE687', name: 'Gliese 687', spec: 'M3V', dist: 14.8, age: 7, pnum: 2, hz: false, anom: 0, ra: 264.4, dec: 68.6, starMass: 0.41, planets: [
    { des: 'b', name: 'Gliese 687 b', period: 38.14, mass: 17.2, hz: false },
    { des: 'c', name: 'Gliese 687 c', period: 728, mass: 16, hz: false }
  ]},
  // 15–25 ly
  { id: 'GJ3323', name: 'GJ 3323', spec: 'M4V', dist: 17.5, age: 5, pnum: 2, hz: false, anom: 0, ra: 73.2, dec: -6.7, starMass: 0.16, planets: [
    { des: 'b', name: 'GJ 3323 b', period: 5.36, mass: 2, hz: false },
    { des: 'c', name: 'GJ 3323 c', period: 40.5, mass: 2.3, hz: false }
  ]},
  { id: 'GLIESE251', name: 'Gliese 251', spec: 'M3V', dist: 18.2, age: 5, pnum: 2, hz: false, anom: 0, ra: 104.1, dec: 33.4, starMass: 0.37, planets: [
    { des: 'b', name: 'Gliese 251 b', period: 14.24, mass: 3.85, hz: false },
    { des: 'c', name: 'Gliese 251 c', period: 53.65, mass: 3.84, hz: false }
  ]},
  { id: '82_ERIDANI', name: '82 G. Eridani', spec: 'G6V', dist: 19.7, age: 6, pnum: 3, hz: true, anom: 0, ra: 46.0, dec: -43.4, starMass: 0.79, planets: [
    { des: 'b', name: '82 Eridani b', period: 18.3, mass: 2.15, hz: false },
    { des: 'c', name: '82 Eridani c', period: 89.7, mass: 2.98, hz: false },
    { des: 'd', name: '82 Eridani d', period: 648, mass: 5.82, hz: true }
  ]},
  { id: 'GLIESE581', name: 'Gliese 581', spec: 'M3V', dist: 20.5, age: 7, pnum: 4, hz: true, anom: 1, ra: 229.9, dec: -7.7, starMass: 0.30, planets: [
    { des: 'b', name: 'Gliese 581 b', period: 5.37, mass: 20.5, hz: false },
    { des: 'c', name: 'Gliese 581 c', period: 12.9, mass: 6.8, hz: false },
    { des: 'e', name: 'Gliese 581 e', period: 3.15, mass: 2.5, hz: false }
  ]},
  { id: 'HD219134', name: 'HD 219134', spec: 'K3V', dist: 21.3, age: 11, pnum: 5, hz: false, anom: 0, ra: 348.3, dec: 57.2, starMass: 0.78, planets: [
    { des: 'b', name: 'HD 219134 b', period: 3.09, mass: 4.7, hz: false },
    { des: 'c', name: 'HD 219134 c', period: 6.77, mass: 4.4, hz: false },
    { des: 'f', name: 'HD 219134 f', period: 22.7, mass: 7.3, hz: false },
    { des: 'd', name: 'HD 219134 d', period: 46.9, mass: 16, hz: false }
  ]},
  { id: 'GLIESE625', name: 'Gliese 625', spec: 'M2V', dist: 21.1, age: 3, pnum: 1, hz: false, anom: 0, ra: 247.5, dec: 54.3, starMass: 0.30, planets: [
    { des: 'b', name: 'Gliese 625 b', period: 14.6, mass: 2.8, hz: false }
  ]},
  { id: 'LTT1445', name: 'LTT 1445', spec: 'M3V', dist: 22.4, age: 5, pnum: 2, hz: false, anom: 0, ra: 79.4, dec: -16.6, starMass: 0.26, planets: [
    { des: 'b', name: 'LTT 1445 b', period: 5.36, mass: 2.87, hz: false },
    { des: 'c', name: 'LTT 1445 c', period: 3.12, mass: 1.54, hz: false }
  ]},
  { id: 'GLIESE393', name: 'Gliese 393', spec: 'M2.5V', dist: 23.0, age: 4, pnum: 1, hz: false, anom: 0, ra: 158.5, dec: 0.9, starMass: 0.41, planets: [
    { des: 'b', name: 'Gliese 393 b', period: 7.03, mass: 1.71, hz: false }
  ]},
  // 25–35 ly
  { id: '61_VIRGINIS', name: '61 Virginis', spec: 'G5V', dist: 27.8, age: 6, pnum: 3, hz: false, anom: 0, ra: 199.0, dec: -18.3, starMass: 0.95, planets: [
    { des: 'b', name: '61 Virginis b', period: 4.22, mass: 6.1, hz: false },
    { des: 'c', name: '61 Virginis c', period: 38.1, mass: 17.9, hz: false },
    { des: 'd', name: '61 Virginis d', period: 123, mass: 10.5, hz: false }
  ]},
  { id: 'GLIESE785', name: 'Gliese 785', spec: 'K2V', dist: 28.7, age: 5, pnum: 2, hz: false, anom: 0, ra: 308.4, dec: -21.1, starMass: 0.78, planets: [
    { des: 'b', name: 'Gliese 785 b', period: 75, mass: 17, hz: false },
    { des: 'c', name: 'Gliese 785 c', period: 530, mass: 24, hz: false }
  ]},
  { id: 'GLIESE433', name: 'Gliese 433', spec: 'M2V', dist: 29.6, age: 5, pnum: 3, hz: false, anom: 0, ra: 173.1, dec: -32.4, starMass: 0.48, planets: [
    { des: 'b', name: 'Gliese 433 b', period: 7.37, mass: 6, hz: false },
    { des: 'd', name: 'Gliese 433 d', period: 36.1, mass: 5.2, hz: false },
    { des: 'c', name: 'Gliese 433 c', period: 5090, mass: 32, hz: false }
  ]},
  { id: 'GLIESE357', name: 'Gliese 357', spec: 'M2.5V', dist: 30.8, age: 5, pnum: 3, hz: true, anom: 0, ra: 152.2, dec: -21.5, starMass: 0.34, planets: [
    { des: 'b', name: 'Gliese 357 b', period: 3.93, mass: 6.1, hz: false },
    { des: 'c', name: 'Gliese 357 c', period: 9.13, mass: 3.6, hz: false },
    { des: 'd', name: 'Gliese 357 d', period: 55.7, mass: 7.7, hz: true }
  ]},
  { id: 'GLIESE367', name: 'Gliese 367', spec: 'M1V', dist: 30.7, age: 5, pnum: 3, hz: false, anom: 0, ra: 146.1, dec: -45.8, starMass: 0.45, planets: [
    { des: 'b', name: 'Gliese 367 b', period: 0.32, mass: 0.63, hz: false },
    { des: 'c', name: 'Gliese 367 c', period: 11.5, mass: 4.1, hz: false },
    { des: 'd', name: 'Gliese 367 d', period: 34.4, mass: 6, hz: false }
  ]},
  { id: 'WOLF1069', name: 'Wolf 1069', spec: 'M5V', dist: 31.2, age: 5, pnum: 1, hz: true, anom: 0, ra: 270.5, dec: 58.4, starMass: 0.17, planets: [
    { des: 'b', name: 'Wolf 1069 b', period: 15.56, mass: 1.26, hz: true }
  ]},
  { id: 'AU_MICROSCOPII', name: 'AU Microscopii', spec: 'M1V', dist: 31.7, age: 0.02, pnum: 2, hz: false, anom: 1, ra: 311.3, dec: -31.3, starMass: 0.50, planets: [
    { des: 'b', name: 'AU Mic b', period: 8.46, mass: 6.3, hz: false },
    { des: 'c', name: 'AU Mic c', period: 18.86, mass: 11.3, hz: false }
  ]},
  { id: 'GLIESE436', name: 'Gliese 436', spec: 'M2.5V', dist: 31.9, age: 6, pnum: 1, hz: false, anom: 0, ra: 176.5, dec: 26.7, starMass: 0.41, planets: [
    { des: 'b', name: 'Gliese 436 b', period: 2.64, mass: 21.4, hz: false }
  ]},
  { id: 'HD260655', name: 'HD 260655', spec: 'M0V', dist: 32.6, age: 4, pnum: 2, hz: false, anom: 0, ra: 97.2, dec: 8.4, starMass: 0.44, planets: [
    { des: 'b', name: 'HD 260655 b', period: 2.78, mass: 2.14, hz: false },
    { des: 'c', name: 'HD 260655 c', period: 5.71, mass: 3.09, hz: false }
  ]},
  // 35–50 ly — systèmes célèbres
  { id: 'TRAPPIST1', name: 'TRAPPIST-1', spec: 'M8V', dist: 40.7, age: 7.6, pnum: 7, hz: true, anom: 2, ra: 346.6, dec: -5.0, starMass: 0.09, planets: [
    { des: 'b', name: 'TRAPPIST-1 b', period: 1.51, mass: 1.02, hz: false },
    { des: 'c', name: 'TRAPPIST-1 c', period: 2.42, mass: 1.16, hz: false },
    { des: 'd', name: 'TRAPPIST-1 d', period: 4.05, mass: 0.30, hz: true },
    { des: 'e', name: 'TRAPPIST-1 e', period: 6.10, mass: 0.62, hz: true },
    { des: 'f', name: 'TRAPPIST-1 f', period: 9.21, mass: 0.68, hz: true },
    { des: 'g', name: 'TRAPPIST-1 g', period: 12.35, mass: 1.34, hz: true },
    { des: 'h', name: 'TRAPPIST-1 h', period: 18.77, mass: 0.33, hz: false }
  ]},
  { id: '55_CANCRI', name: '55 Cancri', spec: 'G8V', dist: 40.9, age: 10, pnum: 5, hz: true, anom: 0, ra: 133.2, dec: 28.4, starMass: 0.91, planets: [
    { des: 'e', name: '55 Cancri e', period: 0.74, mass: 8.6, hz: false },
    { des: 'b', name: '55 Cancri b', period: 14.7, mass: 265, hz: false },
    { des: 'c', name: '55 Cancri c', period: 44.4, mass: 54, hz: false },
    { des: 'f', name: '55 Cancri f', period: 260, mass: 46, hz: false },
    { des: 'd', name: '55 Cancri d', period: 5218, mass: 1140, hz: false }
  ]},
  { id: 'HD40307', name: 'HD 40307', spec: 'K2.5V', dist: 41.8, age: 5, pnum: 6, hz: true, anom: 1, ra: 88.5, dec: -60.0, starMass: 0.77, planets: [
    { des: 'b', name: 'HD 40307 b', period: 4.31, mass: 4.2, hz: false },
    { des: 'c', name: 'HD 40307 c', period: 9.62, mass: 6.9, hz: false },
    { des: 'd', name: 'HD 40307 d', period: 20.4, mass: 9.2, hz: false },
    { des: 'e', name: 'HD 40307 e', period: 34.6, mass: 4.6, hz: false },
    { des: 'f', name: 'HD 40307 f', period: 51.6, mass: 6.9, hz: true },
    { des: 'g', name: 'HD 40307 g', period: 197.8, mass: 7.1, hz: true }
  ]},
  { id: 'HD189733', name: 'HD 189733', spec: 'K2V', dist: 64.5, age: 5, pnum: 1, hz: false, anom: 0, ra: 300.2, dec: 22.7, starMass: 0.82, planets: [
    { des: 'b', name: 'HD 189733 b', period: 2.22, mass: 356, hz: false }
  ]},
  { id: 'KEPLER90', name: 'Kepler-90', spec: 'G0V', dist: 2845, age: 2, pnum: 8, hz: false, anom: 0, ra: 289.0, dec: 49.0, starMass: 1.13, planets: [
    { des: 'b', name: 'Kepler-90 b', period: 7.05, mass: 2.2, hz: false },
    { des: 'c', name: 'Kepler-90 c', period: 8.72, mass: 1.7, hz: false },
    { des: 'i', name: 'Kepler-90 i', period: 14.45, mass: 2.5, hz: false },
    { des: 'd', name: 'Kepler-90 d', period: 59.7, mass: 3.0, hz: false },
    { des: 'e', name: 'Kepler-90 e', period: 91.9, mass: 2.7, hz: false },
    { des: 'f', name: 'Kepler-90 f', period: 124.9, mass: 2.9, hz: false },
    { des: 'g', name: 'Kepler-90 g', period: 210.6, mass: 254, hz: false },
    { des: 'h', name: 'Kepler-90 h', period: 331.6, mass: 330, hz: false }
  ]},
  { id: 'KEPLER452', name: 'Kepler-452', spec: 'G2V', dist: 1850, age: 6, pnum: 1, hz: true, anom: 0, ra: 290.0, dec: 44.5, starMass: 1.04, planets: [
    { des: 'b', name: 'Kepler-452 b', period: 384.8, mass: 5.0, hz: true }
  ]},
  // Suite 35–80 ly — pour atteindre ~100 systèmes
  { id: 'GLIESE176', name: 'Gliese 176', spec: 'M2.5V', dist: 30.9, age: 5, pnum: 1, hz: false, anom: 0, ra: 67.4, dec: 18.9, starMass: 0.45, planets: [
    { des: 'b', name: 'Gliese 176 b', period: 8.77, mass: 8, hz: false }
  ]},
  { id: 'GLIESE514', name: 'Gliese 514', spec: 'M1V', dist: 24.9, age: 5, pnum: 1, hz: false, anom: 0, ra: 202.5, dec: -12.3, starMass: 0.53, planets: [
    { des: 'b', name: 'Gliese 514 b', period: 140, mass: 5.2, hz: false }
  ]},
  { id: 'GLIESE486', name: 'Gliese 486', spec: 'M3.5V', dist: 26.4, age: 2, pnum: 1, hz: false, anom: 0, ra: 258.1, dec: 9.4, starMass: 0.32, planets: [
    { des: 'b', name: 'Gliese 486 b', period: 1.47, mass: 2.8, hz: false }
  ]},
  { id: 'GLIESE686', name: 'Gliese 686', spec: 'M1.5V', dist: 26.6, age: 5, pnum: 1, hz: false, anom: 0, ra: 264.1, dec: 18.6, starMass: 0.42, planets: [
    { des: 'b', name: 'Gliese 686 b', period: 15.5, mass: 7.1, hz: false }
  ]},
  { id: 'HN_LIBRAE', name: 'HN Librae', spec: 'M3V', dist: 20.4, age: 5, pnum: 1, hz: false, anom: 0, ra: 227.5, dec: -4.0, starMass: 0.29, planets: [
    { des: 'b', name: 'HN Librae b', period: 36.1, mass: 5.5, hz: false }
  ]},
  { id: 'GLIESE849', name: 'Gliese 849', spec: 'M3.5V', dist: 28.8, age: 5, pnum: 2, hz: false, anom: 0, ra: 332.5, dec: -4.7, starMass: 0.49, planets: [
    { des: 'b', name: 'Gliese 849 b', period: 1910, mass: 270, hz: false },
    { des: 'c', name: 'Gliese 849 c', period: 5520, mass: 300, hz: false }
  ]},
  { id: 'GLIESE752', name: 'Gliese 752 A', spec: 'M2.5V', dist: 19.3, age: 5, pnum: 1, hz: false, anom: 0, ra: 289.5, dec: 5.2, starMass: 0.46, planets: [
    { des: 'b', name: 'Gliese 752 b', period: 106, mass: 12.2, hz: false }
  ]},
  { id: 'GJ3988', name: 'GJ 3988', spec: 'M5V', dist: 32.3, age: 5, pnum: 1, hz: false, anom: 0, ra: 126.5, dec: 26.9, starMass: 0.18, planets: [
    { des: 'b', name: 'GJ 3988 b', period: 6.94, mass: 3.7, hz: false }
  ]},
  { id: 'GLIESE49', name: 'Gliese 49', spec: 'K7V', dist: 32.2, age: 5, pnum: 1, hz: false, anom: 0, ra: 13.5, dec: 61.2, starMass: 0.57, planets: [
    { des: 'b', name: 'Gliese 49 b', period: 17.3, mass: 16.4, hz: false }
  ]},
  { id: 'GJ1151', name: 'GJ 1151', spec: 'M4.5V', dist: 26.2, age: 5, pnum: 1, hz: false, anom: 0, ra: 179.5, dec: 48.2, starMass: 0.16, planets: [
    { des: 'c', name: 'GJ 1151 c', period: 390, mass: 10.6, hz: false }
  ]},
  { id: 'GJ1289', name: 'GJ 1289', spec: 'M4V', dist: 27.3, age: 5, pnum: 1, hz: false, anom: 0, ra: 289.0, dec: -12.5, starMass: 0.21, planets: [
    { des: 'b', name: 'GJ 1289 b', period: 112, mass: 6.3, hz: false }
  ]},
  { id: 'TZ_ARietis', name: 'TZ Arietis', spec: 'M4.5V', dist: 14.6, age: 5, pnum: 1, hz: false, anom: 0, ra: 27.5, dec: 17.0, starMass: 0.14, planets: [
    { des: 'b', name: 'TZ Arietis b', period: 771, mass: 67, hz: false }
  ]},
  { id: 'EQ_PEGASI', name: 'EQ Pegasi A', spec: 'M3.5V', dist: 20.4, age: 5, pnum: 1, hz: false, anom: 0, ra: 351.5, dec: 20.0, starMass: 0.44, planets: [
    { des: 'b', name: 'EQ Pegasi b', period: 284, mass: 718, hz: false }
  ]},
  { id: 'GLIESE338', name: 'Gliese 338 B', spec: 'M0V', dist: 20.7, age: 5, pnum: 1, hz: false, anom: 0, ra: 137.5, dec: 52.6, starMass: 0.64, planets: [
    { des: 'b', name: 'Gliese 338 B b', period: 24.5, mass: 10.3, hz: false }
  ]},
  { id: 'GLIESE725A', name: 'Gliese 725 A', spec: 'M3V', dist: 11.5, age: 5, pnum: 1, hz: false, anom: 0, ra: 280.5, dec: 59.0, starMass: 0.33, planets: [
    { des: 'b', name: 'Gliese 725 A b', period: 11.22, mass: 2.78, hz: false }
  ]},
  { id: 'GJ3512', name: 'GJ 3512', spec: 'M5.5V', dist: 31.0, age: 5, pnum: 2, hz: false, anom: 2, ra: 141.5, dec: 59.0, starMass: 0.12, planets: [
    { des: 'b', name: 'GJ 3512 b', period: 204, mass: 147, hz: false },
    { des: 'c', name: 'GJ 3512 c', period: 2350, mass: 143, hz: false }
  ]},
  // Ajout pour atteindre ~100 (systèmes sans planètes confirmées mais connus)
  { id: 'WOLF359', name: 'Wolf 359', spec: 'M6V', dist: 7.9, age: 5, pnum: 0, hz: false, anom: 0, ra: 164.1, dec: 7.0, starMass: 0.09, planets: [] },
  { id: 'LACAILLE9352', name: 'Lacaille 9352', spec: 'M0.5V', dist: 10.7, age: 5, pnum: 2, hz: false, anom: 0, ra: 344.4, dec: -35.8, starMass: 0.50, planets: [
    { des: 'b', name: 'Lacaille 9352 b', period: 9.26, mass: 4.2, hz: false },
    { des: 'c', name: 'Lacaille 9352 c', period: 21.8, mass: 7.6, hz: false }
  ]},
  { id: 'LHS288', name: 'LHS 288', spec: 'M5V', dist: 15.8, age: 5, pnum: 0, hz: false, anom: 0, ra: 78.5, dec: -68.3, starMass: 0.11, planets: [] },
  { id: 'GLIESE205', name: 'Gliese 205', spec: 'M1.5V', dist: 18.5, age: 5, pnum: 0, hz: false, anom: 0, ra: 81.5, dec: -7.6, starMass: 0.63, planets: [] },
  { id: 'GLIESE229', name: 'Gliese 229', spec: 'M1V', dist: 18.8, age: 5, pnum: 0, hz: false, anom: 0, ra: 91.5, dec: -21.9, starMass: 0.58, planets: [] },
  { id: '40_ERIDANI', name: '40 Eridani', spec: 'K1V', dist: 16.3, age: 5, pnum: 0, hz: false, anom: 0, ra: 63.8, dec: -7.6, starMass: 0.78, planets: [] },
  { id: 'VAN_MAANEN2', name: 'Van Maanen 2', spec: 'DZ7', dist: 14.1, age: 10, pnum: 0, hz: false, anom: 0, ra: 15.5, dec: 5.5, starMass: 0.68, planets: [] },
  { id: 'GJ4026', name: 'GJ 4026', spec: 'M4V', dist: 28.5, age: 5, pnum: 0, hz: false, anom: 0, ra: 178.5, dec: 44.2, starMass: 0.22, planets: [] },
  { id: 'GLIESE526', name: 'Gliese 526', spec: 'M1V', dist: 18.3, age: 5, pnum: 0, hz: false, anom: 0, ra: 209.5, dec: 48.6, starMass: 0.48, planets: [] },
  { id: 'GLIESE754', name: 'Gliese 754', spec: 'M4.5V', dist: 19.3, age: 5, pnum: 0, hz: false, anom: 0, ra: 289.2, dec: -23.8, starMass: 0.18, planets: [] },
  // Complément pour ~100 systèmes
  { id: 'K2_18', name: 'K2-18', spec: 'M2.5V', dist: 124, age: 5, pnum: 1, hz: true, anom: 0, ra: 172.5, dec: 7.6, starMass: 0.36, planets: [{ des: 'b', name: 'K2-18 b', period: 32.9, mass: 8.6, hz: true }]},
  { id: 'TOI700', name: 'TOI-700', spec: 'M2V', dist: 101, age: 1.5, pnum: 4, hz: true, anom: 0, ra: 97.5, dec: -65.5, starMass: 0.42, planets: [
    { des: 'b', name: 'TOI-700 b', period: 9.98, mass: 1.0, hz: false },
    { des: 'c', name: 'TOI-700 c', period: 16.05, mass: 2.6, hz: false },
    { des: 'd', name: 'TOI-700 d', period: 37.4, mass: 1.7, hz: true },
    { des: 'e', name: 'TOI-700 e', period: 27.8, mass: 0.95, hz: true }
  ]},
  { id: 'GJ1214', name: 'Gliese 1214', spec: 'M4.5V', dist: 48, age: 6, pnum: 1, hz: false, anom: 0, ra: 258.5, dec: 5.0, starMass: 0.16, planets: [{ des: 'b', name: 'GJ 1214 b', period: 1.58, mass: 6.3, hz: false }]},
  { id: 'GJ1132', name: 'Gliese 1132', spec: 'M4V', dist: 41, age: 5, pnum: 2, hz: false, anom: 0, ra: 153.5, dec: -47.1, starMass: 0.18, planets: [
    { des: 'b', name: 'GJ 1132 b', period: 1.63, mass: 1.66, hz: false },
    { des: 'c', name: 'GJ 1132 c', period: 8.93, mass: 2.6, hz: false }
  ]},
  { id: 'K2_72', name: 'K2-72', spec: 'M2V', dist: 217, age: 5, pnum: 4, hz: true, anom: 0, ra: 336.5, dec: 9.6, starMass: 0.27, planets: [
    { des: 'b', name: 'K2-72 b', period: 5.58, mass: 2.2, hz: false },
    { des: 'c', name: 'K2-72 c', period: 15.2, mass: 1.8, hz: false },
    { des: 'd', name: 'K2-72 d', period: 24.2, mass: 2.1, hz: true },
    { des: 'e', name: 'K2-72 e', period: 7.0, mass: 2.0, hz: false }
  ]},
  { id: 'LHS3844', name: 'LHS 3844', spec: 'M5V', dist: 48.6, age: 5, pnum: 1, hz: false, anom: 0, ra: 337.5, dec: -69.3, starMass: 0.15, planets: [{ des: 'b', name: 'LHS 3844 b', period: 0.46, mass: 2.3, hz: false }]},
  { id: 'HD97658', name: 'HD 97658', spec: 'K1V', dist: 69, age: 5, pnum: 1, hz: false, anom: 0, ra: 169.5, dec: 25.7, starMass: 0.85, planets: [{ des: 'b', name: 'HD 97658 b', period: 9.5, mass: 7.6, hz: false }]},
  { id: 'HD85512', name: 'HD 85512', spec: 'K5V', dist: 36, age: 5.6, pnum: 1, hz: true, anom: 0, ra: 147.5, dec: -43.5, starMass: 0.69, planets: [{ des: 'b', name: 'HD 85512 b', period: 58.4, mass: 3.6, hz: true }]},
  { id: 'LHS1140', name: 'LHS 1140', spec: 'M4.5V', dist: 49, age: 5, pnum: 2, hz: true, anom: 0, ra: 9.5, dec: -15.3, starMass: 0.18, planets: [
    { des: 'b', name: 'LHS 1140 b', period: 24.7, mass: 6.4, hz: true },
    { des: 'c', name: 'LHS 1140 c', period: 3.78, mass: 1.8, hz: false }
  ]},
  { id: 'WOLF424', name: 'Wolf 424', spec: 'M5.5V', dist: 14.3, age: 5, pnum: 0, hz: false, anom: 0, ra: 195.5, dec: 9.2, starMass: 0.14, planets: [] },
  { id: 'GJ412', name: 'GJ 412', spec: 'M1V', dist: 15.8, age: 5, pnum: 0, hz: false, anom: 0, ra: 174.5, dec: 43.5, starMass: 0.48, planets: [] },
  { id: 'GLIESE445', name: 'Gliese 445', spec: 'M3.5V', dist: 17.6, age: 5, pnum: 0, hz: false, anom: 0, ra: 176.5, dec: 78.7, starMass: 0.27, planets: [] },
  { id: 'GLIESE83', name: 'Gliese 83.1', spec: 'M4.5V', dist: 19.8, age: 5, pnum: 0, hz: false, anom: 0, ra: 26.5, dec: -18.2, starMass: 0.18, planets: [] },
  { id: 'GJ1245', name: 'GJ 1245', spec: 'M5.5V', dist: 15.2, age: 5, pnum: 0, hz: false, anom: 0, ra: 299.5, dec: 44.0, starMass: 0.12, planets: [] },
  { id: 'GJ1068', name: 'GJ 1068', spec: 'M4V', dist: 25.5, age: 5, pnum: 0, hz: false, anom: 0, ra: 45.5, dec: -12.5, starMass: 0.20, planets: [] },
  { id: 'GJ1128', name: 'GJ 1128', spec: 'M4V', dist: 34.2, age: 5, pnum: 0, hz: false, anom: 0, ra: 278.5, dec: 35.2, starMass: 0.21, planets: [] },
  { id: 'GLIESE392', name: 'Gliese 392', spec: 'M2V', dist: 22.5, age: 5, pnum: 0, hz: false, anom: 0, ra: 152.5, dec: 3.5, starMass: 0.42, planets: [] },
  { id: 'GJ3021', name: 'GJ 3021', spec: 'G6V', dist: 57, age: 5, pnum: 1, hz: false, anom: 0, ra: 12.5, dec: -79.6, starMass: 0.90, planets: [{ des: 'b', name: 'GJ 3021 b', period: 133.7, mass: 1100, hz: false }]},
  { id: 'HD69830', name: 'HD 69830', spec: 'K0V', dist: 41, age: 7, pnum: 3, hz: true, anom: 0, ra: 125.5, dec: -12.6, starMass: 0.86, planets: [
    { des: 'b', name: 'HD 69830 b', period: 8.67, mass: 10.2, hz: false },
    { des: 'c', name: 'HD 69830 c', period: 31.6, mass: 11.8, hz: false },
    { des: 'd', name: 'HD 69830 d', period: 197, mass: 18.1, hz: true }
  ]},
  { id: 'UPSILON_ANDROMEDAE', name: 'Upsilon Andromedae', spec: 'F8V', dist: 44, age: 3, pnum: 4, hz: true, anom: 0, ra: 24.2, dec: 41.4, starMass: 1.27, planets: [
    { des: 'b', name: 'Upsilon And b', period: 4.62, mass: 240, hz: false },
    { des: 'c', name: 'Upsilon And c', period: 241.3, mass: 600, hz: false },
    { des: 'd', name: 'Upsilon And d', period: 1284, mass: 1055, hz: false },
    { des: 'e', name: 'Upsilon And e', period: 3848, mass: 1320, hz: false }
  ]},
  { id: 'TAU_BOOTIS', name: 'Tau Boötis', spec: 'F7V', dist: 51, age: 2, pnum: 1, hz: false, anom: 0, ra: 218.0, dec: 17.5, starMass: 1.34, planets: [{ des: 'b', name: 'Tau Boötis b', period: 3.31, mass: 1160, hz: false }]},
  { id: 'HD209458', name: 'HD 209458', spec: 'G0V', dist: 159, age: 4, pnum: 1, hz: false, anom: 0, ra: 331.5, dec: 18.9, starMass: 1.15, planets: [{ des: 'b', name: 'HD 209458 b', period: 3.52, mass: 220, hz: false }]},
  { id: 'HD147506', name: 'HAT-P-2', spec: 'F8V', dist: 419, age: 2, pnum: 1, hz: false, anom: 0, ra: 242.5, dec: 41.0, starMass: 1.36, planets: [{ des: 'b', name: 'HAT-P-2 b', period: 5.63, mass: 2700, hz: false }]},
  { id: 'KEPLER186', name: 'Kepler-186', spec: 'M1V', dist: 582, age: 4, pnum: 5, hz: true, anom: 0, ra: 299.5, dec: 43.9, starMass: 0.48, planets: [
    { des: 'b', name: 'Kepler-186 b', period: 3.89, mass: 1.9, hz: false },
    { des: 'c', name: 'Kepler-186 c', period: 7.27, mass: 2.4, hz: false },
    { des: 'd', name: 'Kepler-186 d', period: 13.3, mass: 2.1, hz: false },
    { des: 'e', name: 'Kepler-186 e', period: 22.4, mass: 1.5, hz: false },
    { des: 'f', name: 'Kepler-186 f', period: 129.9, mass: 1.4, hz: true }
  ]},
  { id: 'KEPLER442', name: 'Kepler-442', spec: 'K5V', dist: 1206, age: 3, pnum: 1, hz: true, anom: 0, ra: 290.5, dec: 39.9, starMass: 0.61, planets: [{ des: 'b', name: 'Kepler-442 b', period: 112.3, mass: 2.3, hz: true }]},
  { id: 'KEPLER438', name: 'Kepler-438', spec: 'M1V', dist: 640, age: 4, pnum: 1, hz: true, anom: 0, ra: 278.5, dec: 41.9, starMass: 0.54, planets: [{ des: 'b', name: 'Kepler-438 b', period: 35.2, mass: 1.5, hz: true }]}
];

