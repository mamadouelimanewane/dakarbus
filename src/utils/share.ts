export async function shareRoute(fromId: string, toId: string, dispatch: (a: any) => void, showToast: (p: any) => any) {
  const url = `${window.location.origin}${window.location.pathname}?from=${fromId}&to=${toId}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Itinéraire SunuBus 🚌', text: 'Voici mon itinéraire Dakar', url });
    } else {
      await navigator.clipboard.writeText(url);
      dispatch(showToast({ type: 'success', message: '🔗 Lien copié dans le presse-papier !' }));
    }
  } catch {
    dispatch(showToast({ type: 'error', message: 'Impossible de partager.' }));
  }
}

export function parseRouteFromURL(): { from: string | null; to: string | null } {
  const p = new URLSearchParams(window.location.search);
  return { from: p.get('from'), to: p.get('to') };
}
