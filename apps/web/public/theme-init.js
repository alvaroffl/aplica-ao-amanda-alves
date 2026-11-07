// Aplica o tema antes da renderização (evita "piscar" claro/escuro).
// Arquivo externo para permitir CSP sem 'unsafe-inline'.
(function () {
  try {
    var t = localStorage.getItem('agendae-theme') || 'system';
    var dark =
      t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {
    /* armazenamento indisponível */
  }
})();
