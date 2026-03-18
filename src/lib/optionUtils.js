/**
 * Utilitaires pour options de select / listbox — LACUNA
 * Extraction valeur et libellé selon des clés configurables.
 */

/**
 * Valeur d'une option pour un select (v-model, key).
 * @param {object} opt - Option (objet ou valeur directe)
 * @param {string} [valueKey='id'] - Clé de la valeur
 * @returns {string|number}
 */
export function getValue(opt, valueKey = 'id') {
  return opt[valueKey] ?? opt
}

/**
 * Libellé d'affichage d'une option.
 * @param {object} opt - Option
 * @param {string} [labelKey='label'] - Clé du libellé
 * @returns {string}
 */
export function getLabel(opt, labelKey = 'label') {
  return opt[labelKey] ?? opt
}
