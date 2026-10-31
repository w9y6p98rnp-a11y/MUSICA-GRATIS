# Musica Gratis V29

PWA per GitHub Pages.

## V29
- Service worker corretto e versionato v22.
- Aggiornamento del service worker con `updateViaCache: none` e `registration.update()`.
- Eliminazione automatica delle vecchie cache in `activate`.
- Il service worker non intercetta richieste verso domini esterni, quindi il catalogo online e le sorgenti musicali restano freschi.
- Libreria locale, playlist, preferiti e cronologia restano nel browser.
- Ricerca nel catalogo libero con fallback alla ricerca ufficiale su YouTube quando non trova risultati.

Il catalogo online contiene solo contenuti compatibili con i filtri di licenza impostati nell'app. La ricerca YouTube apre il servizio ufficiale e non scarica né copia i brani.


V29: redesigned online search field for iPhone, 16px input sizing to avoid Safari focus zoom, and updated service-worker cache version.


## V29
V29 integra due cataloghi musicali online: Jamendo e Internet Archive. La prima apertura carica automaticamente una selezione, la ricerca interroga entrambe le fonti e “Carica altri” continua la paginazione. Jamendo richiede un Client ID: questa build usa temporaneamente il Client ID pubblico di test documentato da Jamendo; prima di una pubblicazione stabile va sostituito con un Client ID proprio.
