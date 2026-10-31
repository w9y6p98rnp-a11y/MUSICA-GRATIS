# Musica Gratis V18

Versione gratuita PWA per GitHub Pages.

Novità V18:
- se il catalogo libero non trova un brano/artista, compare automaticamente un pulsante per cercarlo su YouTube;
- corretto il messaggio HTML con apostrofi (es. Gigi d'Alessio);
- service worker aggiornato a V18 per evitare che Safari continui a usare la vecchia V16/V17.

Il catalogo Internet Archive cerca solo contenuti compatibili con le licenze ammesse. La ricerca YouTube apre il servizio ufficiale e non scarica né copia i brani.


## V19
- Cache/service worker version bumped to v19.
- app.js uses ?v=19 to bust old browser caches.
- Service worker registration uses updateViaCache:none and forces update().
- Online search validates the query and provides an explicit YouTube fallback when no free tracks are found.
