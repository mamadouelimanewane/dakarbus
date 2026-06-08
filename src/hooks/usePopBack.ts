/**
 * usePopBack — Gestion unifiée du bouton retour (hardware Android / navigateur)
 *
 * Principe :
 *  - Une pile globale de handlers (backStack)
 *  - Un seul écouteur `popstate` global
 *  - Chaque "couche" (modal, sous-vue, onglet) empile son handler à l'ouverture
 *    et le dépile à la fermeture / au démontage
 *  - Le retour déclenche toujours le handler du DESSUS de la pile
 *  - Après chaque traitement, on re-pousse une entrée dans l'historique
 *    pour rester dans la SPA (le navigateur ne quitte jamais l'app)
 */

import { useEffect } from 'react';

const backStack: Array<() => void> = [];

if (typeof window !== 'undefined') {
  // Entrée racine — garantit qu'il y a toujours une entrée avant la nôtre
  window.history.replaceState({ depth: 0 }, '', window.location.href);
  // Entrée courante — toujours depth+1 pour pouvoir aller en arrière
  window.history.pushState({ depth: 1 }, '', window.location.href);

  window.addEventListener('popstate', () => {
    const handler = backStack[backStack.length - 1];
    if (handler) {
      handler();
    }
    // Re-pousser immédiatement pour que le prochain "back" soit capturable
    requestAnimationFrame(() => {
      window.history.pushState({ depth: 1 }, '', window.location.href);
    });
  });
}

/**
 * @param onBack   Fonction appelée quand l'utilisateur appuie sur retour
 * @param active   (optionnel) Condition booléenne — empile seulement quand true
 *                 Utile pour des états conditionnels dans un composant toujours monté
 */
export function usePopBack(onBack: () => void, active = true) {
  useEffect(() => {
    if (!active) return;

    // Pousser une entrée historique pour ce "niveau"
    window.history.pushState({ depth: 1 }, '', window.location.href);

    const handler = onBack; // capture stable
    backStack.push(handler);

    return () => {
      const idx = backStack.lastIndexOf(handler);
      if (idx >= 0) backStack.splice(idx, 1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
