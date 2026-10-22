# Icônes

Toutes les icônes de l'interface viennent d'un seul jeu : `src/components/icons/iconSet.js`,
rendu par `src/components/icons/AppIcon.vue`.

- **Dessin** : grille 24 × 24, trait 1.5, extrémités et angles arrondis, couleur `currentColor`.
- **Taille** : `1em` par défaut — l'icône suit la `font-size` de son conteneur (ou prop `size`).
- **Accessibilité** : décorative par défaut (`aria-hidden`) ; prop `label` pour une icône porteuse de sens.
- **Un nom = un sens** : ne pas réutiliser une icône pour un autre concept.

Les menus (`src/constants/menus.js`) référencent les icônes par leur nom.
Les composants spécialisés (`LabInstrumentIcon`, `ObservationTypeIcon`, `SignalTypeIcon`)
traduisent une donnée métier en nom d'icône et délèguent à `AppIcon`.

Ne pas utiliser de caractères Unicode (◈ ⌬ ⚙ ×…) comme icônes : les polices de l'app ne les contiennent pas,
ils s'affichent dans une police système différente selon l'OS (voire en emoji).
