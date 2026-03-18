/**
 * Illustrations SVG par type spectral — Vue Système Observatoire
 * Mapping spectral_type (première lettre) → URL du SVG
 */

import { getSpectralLetter } from '@/lib/starClassification'
import starO from './star-O.svg'
import starB from './star-B.svg'
import starA from './star-A.svg'
import starF from './star-F.svg'
import starG from './star-G.svg'
import starK from './star-K.svg'
import starM from './star-M.svg'
import starL from './star-L.svg'
import starT from './star-T.svg'
import starY from './star-Y.svg'
import starD from './star-D.svg'
import starPulsar from './star-pulsar.svg'

export const STAR_SVG_PATHS = {
  O: starO,
  B: starB,
  A: starA,
  F: starF,
  G: starG,
  K: starK,
  M: starM,
  L: starL,
  T: starT,
  Y: starY,
  D: starD,
  PULSAR: starPulsar,
}

/** Retourne l'URL du SVG pour un spectral_type (ex. G2V → star-G) */
export function getStarSvgPath(spectralType) {
  const letter = getSpectralLetter(spectralType)
  return STAR_SVG_PATHS[letter] ?? starM
}
