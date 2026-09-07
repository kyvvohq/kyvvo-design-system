/* @kyvvohq/design-system — hidratação dos componentes que precisam de
 * marcação (não só CSS). Script clássico, sem módulo/bundler — expõe
 * `window.KyvvoDS` e auto-hidrata elementos `data-ds-*` no load.
 *
 * Uso:
 *   <link rel="stylesheet" href="/ds/components.css">
 *   <script src="/ds/components.js"></script>
 *   ...
 *   <footer data-ds-rodape></footer>   <!-- vira o rodapé completo -->
 *
 * Carregue depois de tokens.css/components.css. A ordem em relação ao JS
 * do produto (app.js/shell.js) não importa — a hidratação é no
 * DOMContentLoaded.
 */
(function () {
  'use strict';

  var DS_BASE = '/ds';

  function logoSrc() {
    var escuro = document.documentElement.getAttribute('data-theme') === 'dark';
    return DS_BASE + (escuro ? '/logo-dark.svg' : '/logo.svg');
  }

  // ---------- Rodapé de área logada ----------
  function rodapeLogadoHtml() {
    var ano = new Date().getFullYear();
    return (
      '<img src="' + logoSrc() + '" alt="Kyvvo" data-ds-logo>' +
      '<span>© ' + ano + ' Kyvvo Tecnologia. Todos os direitos reservados.</span>'
    );
  }

  function hidratarRodapes() {
    var els = document.querySelectorAll('[data-ds-rodape]');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.add('ds-rodape');
      els[i].innerHTML = rodapeLogadoHtml();
    }
  }

  // Mantém o logo (rodapé e qualquer [data-ds-logo]) no arquivo certo pro
  // tema atual — o produto só precisa trocar `data-theme` no <html>.
  function sincronizarLogos() {
    var src = logoSrc();
    var imgs = document.querySelectorAll('[data-ds-logo]');
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].getAttribute('src') !== src) imgs[i].src = src;
    }
  }

  function iniciar() {
    hidratarRodapes();
    sincronizarLogos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  try {
    new MutationObserver(sincronizarLogos).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  } catch (e) {
    /* sem MutationObserver o rodapé fica no logo do tema do carregamento */
  }

  window.KyvvoDS = window.KyvvoDS || {};
  window.KyvvoDS.rodapeLogado = rodapeLogadoHtml;
})();
