/* Chargé tout de suite dans <head> (fichier externe : la politique de sécurité interdit le code écrit dans la page). */
(function () {
  document.documentElement.classList.add('js');
  // Anciennes adresses du site sur une seule page : on renvoie vers la bonne page.
  var path = location.pathname;
  if (path === '/' || /\/index\.html$/.test(path)) {
    var map = { '#offres': 'offres.html', '#projet': 'offres.html#projet', '#questions': 'offres.html#questions',
      '#contact': 'contact.html', '#approche': 'studio.html#approche', '#methode': 'studio.html#methode',
      '#apropos': 'studio.html', '#votre-nom': 'atelier.html' };
    var to = path.indexOf('/en/') === -1 && map[location.hash];
    if (to) location.replace(to);
  }
})();
