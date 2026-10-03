/* @kyvvohq/design-system — hidratação dos componentes que precisam de
 * marcação ou comportamento (não só CSS). Script clássico, sem
 * módulo/bundler — expõe `window.KyvvoDS` e auto-hidrata elementos
 * `data-ds-*` no load.
 *
 * Uso:
 *   <link rel="stylesheet" href="/ds/components.css">
 *   <script src="/ds/components.js">
 *   ...
 *   <footer data-ds-rodape data-ds-produto="Studio"></footer>   (vira o rodapé completo)
 *   <nav data-ds-menu>...</nav>                                 (liga o recolher e os submenus)
 *   <header class="ds-topbar">...</header>                      (só CSS; sem data-ds-*)
 *   <div class="ds-conversas" role="table">...</div>            (lista; abre o modal "na mão")
 *   KyvvoDS.modalAbrir(htmlDaConversa, {classeExtra: 'ds-modal-card-conversa'})
 *   <div class="ds-login">...</div>                             (só CSS; sem data-ds-*)
 *
 * Carregue depois de tokens.css/components.css. A ordem em relação ao JS
 * do produto (app.js/shell.js) não importa — a hidratação é no
 * DOMContentLoaded.
 *
 * Acréscimos da v2.6.0: o nome do produto
 * no rodapé ("Kyvvo powered by" + logo), o Menu lateral, o menu de ações
 * ("..."), o filtro dropdown, a barra de pesquisa, a barra de filtros e as
 * máscaras de campo (data-ds-mascara).
 * Acréscimo da v2.7.0: as abas (data-ds-abas).
 * Acréscimo da v2.8.0: o carrossel (data-ds-carrossel).
 * Acréscimo da v2.9.0: o modal (KyvvoDS.modalAbrir/modalFechar) e a barra de
 * seleção (KyvvoDS.selecaoBarraAtualizar) — ao contrário dos outros
 * componentes, esses dois não hidratam marcação `data-ds-*` existente no
 * load; são chamados diretamente pelo JS do produto (não há nada pra
 * `iniciar()` fazer com eles).
 * Acréscimo da v2.11.0: o balão de notificações (`.ds-notificacoes`,
 * KyvvoDS.notificacoesAtualizar) — mesmo princípio de posicionamento/
 * fechamento do menu de ações (.ds-acoes), mas sem `data-ds-*` pra hidratar:
 * o produto monta a marcação e chama a função diretamente, igual ao modal.
 * Revisão da v2.12.0: Menu lateral sem logo/marca (produto não deve mais
 * montar `.ds-menu-topo`/`.ds-menu-marca`), botão de recolher flutuante na
 * borda direita e seta de grupo girando 90° (não 180°) ao abrir — só CSS,
 * a lógica de hidratação abaixo não mudou.
 * Acréscimo da v2.16.0: o topbar (`.ds-topbar`) — marca do produto (letras
 * em acento + sublinhado) à esquerda, sino de notificações (ícone em
 * acento aqui) + avatar + nome à direita. Só CSS, sem `data-ds-*` e sem
 * função nova: reaproveita o `.ds-notificacoes` que já existe.
 * Acréscimo da v2.17.0: a lista de conversas (`.ds-conversas`, marcação
 * `role="table"/"row"/"cell"` — não `<table>`, pra virar cartão no mobile
 * sem as regras de tabela atrapalhar) e o modal de conversa
 * (`.ds-conversa-modal`). Nenhuma função nova: a linha é clicável por
 * convenção (o produto escuta o clique e chama `KyvvoDS.modalAbrir` com o
 * conteúdo de `.ds-conversa-modal`, passando `classeExtra:
 * 'ds-modal-card-conversa'` pra só a lista de mensagens rolar). Reaproveita
 * o Botão (`.ds-btn-secundario.ds-btn-bloco`) pro "Assumir atendimento".
 * Acréscimo da v2.18.0: a tela de login (`.ds-login`) — sem função nova e
 * sem `data-ds-*`: reaproveita a marca do Topbar (`.ds-topbar-marca`) e o
 * Botão (`.ds-btn-primario.ds-btn-bloco.ds-btn-lg`) como já existiam.
 */
(function () {
  'use strict';

  var DS_BASE = '/ds';

  function logoSrc() {
    var escuro = document.documentElement.getAttribute('data-theme') === 'dark';
    return DS_BASE + (escuro ? '/logo-dark.svg' : '/logo.svg');
  }

  function escapar(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- Rodapé de área logada ----------
  // "© {ano} {produto} Kyvvo powered by {logo}. Todos os direitos reservados."
  // O segundo "Kyvvo" é o próprio logo (img com alt="Kyvvo"). Sem produto,
  // a linha começa em "© {ano} Kyvvo powered by".
  function rodapeLogadoHtml(produto) {
    var ano = new Date().getFullYear();
    var nome = produto ? escapar(produto) + ' ' : '';
    return (
      '<span>© ' + ano + ' ' + nome + 'Kyvvo powered by ' +
      '<img src="' + logoSrc() + '" alt="Kyvvo" data-ds-logo>' +
      '. Todos os direitos reservados.</span>'
    );
  }

  function hidratarRodapes() {
    var els = document.querySelectorAll('[data-ds-rodape]');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.add('ds-rodape');
      els[i].innerHTML = rodapeLogadoHtml(els[i].getAttribute('data-ds-produto'));
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

  // ---------- Menu lateral ----------
  // Estado recolhido = classe `ds-menu-recolhido` no <nav class="ds-menu">.
  // Grupo aberto = aria-expanded="true" no botão do grupo. Da v2.12.0: sem
  // `.ds-menu-topo`/`.ds-menu-marca` (removidos do componente — o produto não
  // deve mais colocar logo no menu) e o botão de recolher (`.ds-menu-toggle`)
  // é posicionado pelo CSS (flutuante, borda direita, centralizado
  // verticalmente); nada muda aqui na hidratação.
  function rotuloDe(link) {
    var rotulo = link.querySelector('.ds-menu-rotulo');
    return rotulo ? rotulo.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  // Alinha o botão de recolher (aria-label, aria-expanded) e o `title` dos
  // itens: com só os ícones visíveis, o título diz o que cada um é.
  function sincronizarMenu(menu) {
    var recolhido = menu.classList.contains('ds-menu-recolhido');
    var toggle = menu.querySelector('.ds-menu-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', recolhido ? 'false' : 'true');
      toggle.setAttribute('aria-label', recolhido ? 'Mostrar menu' : 'Ocultar menu');
    }
    var links = menu.querySelectorAll('.ds-menu-link');
    for (var i = 0; i < links.length; i++) {
      if (recolhido) links[i].setAttribute('title', rotuloDe(links[i]));
      else links[i].removeAttribute('title');
    }
  }

  // Recolhe ou mostra o menu. Sem o segundo argumento, inverte o estado.
  // Devolve o estado final (true = recolhido) e dispara `ds-menu-alternar`
  // no <nav>, com `detail.recolhido`, para o produto guardar a escolha.
  function menuAlternar(menu, recolher) {
    if (!menu) return false;
    var alvo = typeof recolher === 'boolean' ? recolher : !menu.classList.contains('ds-menu-recolhido');
    menu.classList.toggle('ds-menu-recolhido', alvo);
    sincronizarMenu(menu);
    menu.dispatchEvent(new CustomEvent('ds-menu-alternar', { bubbles: true, detail: { recolhido: alvo } }));
    return alvo;
  }

  // Abre ou fecha o submenu de um grupo. Com o menu recolhido, o ícone do
  // grupo reabre o menu já com o grupo aberto (o submenu não cabe em 72px).
  function grupoAlternar(botao) {
    var menu = botao.closest('.ds-menu');
    if (menu && menu.classList.contains('ds-menu-recolhido')) {
      botao.setAttribute('aria-expanded', 'true');
      menuAlternar(menu, false);
      return;
    }
    botao.setAttribute('aria-expanded', botao.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
  }

  function hidratarMenus() {
    var els = document.querySelectorAll('[data-ds-menu]');
    for (var i = 0; i < els.length; i++) {
      var menu = els[i];
      menu.classList.add('ds-menu');
      if (menu.hasAttribute('data-ds-menu-recolhido')) menu.classList.add('ds-menu-recolhido');
      // Grupo com subitem ativo já nasce aberto.
      var ativos = menu.querySelectorAll('.ds-menu-sublink-ativo');
      for (var j = 0; j < ativos.length; j++) {
        var grupo = ativos[j].closest('.ds-menu-grupo');
        var botao = grupo && grupo.querySelector('.ds-menu-grupo-botao');
        if (botao) botao.setAttribute('aria-expanded', 'true');
      }
      sincronizarMenu(menu);
    }
  }

  // Um só ouvinte no documento serve todo menu, também os montados depois.
  document.addEventListener('click', function (e) {
    var alvo = e.target && e.target.closest ? e.target : null;
    if (!alvo) return;
    var toggle = alvo.closest('.ds-menu-toggle');
    if (toggle) {
      menuAlternar(toggle.closest('.ds-menu'));
      return;
    }
    var grupo = alvo.closest('.ds-menu-grupo-botao');
    if (grupo) grupoAlternar(grupo);
  });

  // ---------- Menu de ações ("...") ----------
  // Marcação: <span class="ds-acoes"> <button class="ds-acoes-btn" aria-haspopup="menu"
  // aria-expanded="false"> + <div class="ds-acoes-menu" role="menu" hidden> com
  // <button role="menuitem" class="ds-acoes-item" data-acao="editar">. O menu é
  // `position: fixed`: o script o posiciona junto do botão (vira para cima se
  // faltar espaço embaixo) e o fecha ao clicar fora, rolar, redimensionar ou Esc.
  // Escolher um item dispara `ds-acoes-escolher` no `.ds-acoes` (com bubbles),
  // com `detail.acao` = data-acao do item. Os cliques dentro de `.ds-acoes` não
  // sobem até o card: clicar em "..." não abre o agendamento.
  var acoesAberto = null;

  function acoesFechar(devolverFoco) {
    if (!acoesAberto) return;
    var aberto = acoesAberto;
    acoesAberto = null;
    aberto.menu.hidden = true;
    aberto.btn.setAttribute('aria-expanded', 'false');
    if (devolverFoco) aberto.btn.focus();
  }

  function acoesItens(menu) {
    return Array.prototype.slice.call(menu.querySelectorAll('.ds-acoes-item:not(:disabled)'));
  }

  function acoesAbrir(btn) {
    var menu = btn.parentNode && btn.parentNode.querySelector('.ds-acoes-menu');
    if (!menu) return;
    acoesFechar(false);
    menu.style.visibility = 'hidden';
    menu.hidden = false;
    var r = btn.getBoundingClientRect();
    var w = menu.offsetWidth;
    var h = menu.offsetHeight;
    var esq = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
    var topo = r.bottom + 4;
    if (topo + h > window.innerHeight - 8) topo = Math.max(8, r.top - h - 4);
    menu.style.left = esq + 'px';
    menu.style.top = topo + 'px';
    menu.style.visibility = '';
    btn.setAttribute('aria-expanded', 'true');
    acoesAberto = { btn: btn, menu: menu };
    var itens = acoesItens(menu);
    if (itens.length) itens[0].focus();
  }

  document.addEventListener('click', function (e) {
    var alvo = e.target && e.target.closest ? e.target : null;
    if (!alvo) return;
    var caixa = alvo.closest('.ds-acoes');
    if (!caixa) {
      if (acoesAberto) acoesFechar(false);
      return;
    }
    e.stopPropagation();
    var item = alvo.closest('.ds-acoes-item');
    if (item) {
      var acao = item.getAttribute('data-acao');
      acoesFechar(true);
      caixa.dispatchEvent(new CustomEvent('ds-acoes-escolher', { bubbles: true, detail: { acao: acao, item: item } }));
      return;
    }
    var btn = alvo.closest('.ds-acoes-btn');
    if (btn) {
      if (acoesAberto && acoesAberto.btn === btn) acoesFechar(false);
      else acoesAbrir(btn);
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (!acoesAberto) return;
    var itens = acoesItens(acoesAberto.menu);
    var i = itens.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); acoesFechar(true); }
    else if (e.key === 'Tab') acoesFechar(false);
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (itens.length) itens[(i + 1) % itens.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (itens.length) itens[(i - 1 + itens.length) % itens.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); if (itens.length) itens[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); if (itens.length) itens[itens.length - 1].focus(); }
  });
  window.addEventListener('scroll', function () { acoesFechar(false); }, true);
  window.addEventListener('resize', function () { acoesFechar(false); });

  // ---------- Notificações (balão) ----------
  // Marcação: <div class="ds-notificacoes"> <button class="ds-notificacoes-btn"
  // aria-haspopup="menu" aria-expanded="false"> (ícone de sino próprio, o
  // componente não fornece ícone) + <span class="ds-notificacoes-contagem"
  // hidden> + <div class="ds-notificacoes-painel" role="menu" hidden> com o
  // conteúdo que o produto quiser dentro. Mesmo princípio de posicionamento
  // (`position: fixed`, vira pra cima se faltar espaço embaixo) e fechamento
  // (clique fora/Esc/scroll/resize) do menu de ações acima — só que o
  // componente não sabe o que é uma notificação, só abre/fecha o painel e
  // atualiza a contagem via KyvvoDS.notificacoesAtualizar; quem preenche o
  // conteúdo e liga os cliques dos itens é o produto.
  var notificacoesAberto = null;

  function notificacoesFechar(devolverFoco) {
    if (!notificacoesAberto) return;
    var aberto = notificacoesAberto;
    notificacoesAberto = null;
    aberto.painel.hidden = true;
    aberto.btn.setAttribute('aria-expanded', 'false');
    if (devolverFoco) aberto.btn.focus();
  }

  function notificacoesAbrir(btn) {
    var caixa = btn.closest('.ds-notificacoes');
    var painel = caixa && caixa.querySelector('.ds-notificacoes-painel');
    if (!painel) return;
    notificacoesFechar(false);
    acoesFechar(false);
    painel.style.visibility = 'hidden';
    painel.hidden = false;
    var r = btn.getBoundingClientRect();
    var w = painel.offsetWidth;
    var h = painel.offsetHeight;
    var esq = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
    var topo = r.bottom + 4;
    if (topo + h > window.innerHeight - 8) topo = Math.max(8, r.top - h - 4);
    painel.style.left = esq + 'px';
    painel.style.top = topo + 'px';
    painel.style.visibility = '';
    btn.setAttribute('aria-expanded', 'true');
    notificacoesAberto = { btn: btn, painel: painel };
  }

  document.addEventListener('click', function (e) {
    var alvo = e.target && e.target.closest ? e.target : null;
    if (!alvo) return;
    var caixa = alvo.closest('.ds-notificacoes');
    if (!caixa) {
      if (notificacoesAberto) notificacoesFechar(false);
      return;
    }
    var btn = alvo.closest('.ds-notificacoes-btn');
    if (btn) {
      e.stopPropagation();
      if (notificacoesAberto && notificacoesAberto.btn === btn) notificacoesFechar(false);
      else notificacoesAbrir(btn);
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (!notificacoesAberto) return;
    if (e.key === 'Escape') { e.preventDefault(); notificacoesFechar(true); }
  });
  window.addEventListener('scroll', function () { notificacoesFechar(false); }, true);
  window.addEventListener('resize', function () { notificacoesFechar(false); });

  // KyvvoDS.notificacoesAtualizar(el, quantidade) — `el` é o `.ds-notificacoes`
  // já presente na marcação do produto (pode haver mais de uma instância na
  // página). Só mostra/esconde e escreve o número na pílula; o conteúdo do
  // painel é preenchido pelo produto à parte.
  function notificacoesAtualizar(el, quantidade) {
    if (!el) return;
    var pilula = el.querySelector('.ds-notificacoes-contagem');
    if (pilula) {
      pilula.hidden = !quantidade;
      pilula.textContent = quantidade > 99 ? '99+' : String(quantidade);
    }
    el.dispatchEvent(new CustomEvent('ds-notificacoes-alterar', { bubbles: true, detail: { quantidade: quantidade } }));
  }

  // ---------- Filtro dropdown ----------
  // <div class="ds-dropdown" data-ds-dropdown="multi|unico" data-ds-nome="status"
  //      data-ds-dropdown-rotulo="Status"> com o botão `.ds-dropdown-btn` e o painel
  // `.ds-dropdown-painel` (`<ul role="listbox">` de `<li role="option" data-valor>`).
  // Um `data-valor=""` é a opção "Todos" (sem filtro). Dispara
  // `ds-dropdown-alterar` (bubbles) com `detail.valores` (lista de data-valor).
  function ddOpcoes(dd) {
    return Array.prototype.slice.call(dd.querySelectorAll('.ds-dropdown-opcao'));
  }

  function ddValores(dd) {
    var v = [];
    ddOpcoes(dd).forEach(function (o) {
      var valor = o.getAttribute('data-valor') || '';
      if (o.getAttribute('aria-selected') === 'true' && valor !== '') v.push(valor);
    });
    return v;
  }

  function ddAtualizar(dd) {
    var unico = dd.getAttribute('data-ds-dropdown') === 'unico';
    var marcadas = ddOpcoes(dd).filter(function (o) { return o.getAttribute('aria-selected') === 'true' && (o.getAttribute('data-valor') || '') !== ''; });
    var rotulo = dd.querySelector('.ds-dropdown-rotulo');
    var contagem = dd.querySelector('.ds-dropdown-contagem');
    var padrao = dd.getAttribute('data-ds-dropdown-rotulo') || '';
    if (rotulo) {
      if (unico && marcadas.length) {
        var t = marcadas[0].querySelector('.ds-dropdown-texto');
        rotulo.textContent = (padrao ? padrao + ': ' : '') + (t ? t.textContent : marcadas[0].textContent).trim();
      } else {
        rotulo.textContent = padrao;
      }
    }
    if (contagem) {
      contagem.hidden = unico || marcadas.length === 0;
      contagem.textContent = String(marcadas.length);
    }
    dd.classList.toggle('ds-dropdown-ativo', marcadas.length > 0);
  }

  function ddDefinir(dd, valores, silencioso) {
    var unico = dd.getAttribute('data-ds-dropdown') === 'unico';
    var lista = (valores || []).map(String);
    ddOpcoes(dd).forEach(function (o) {
      var valor = o.getAttribute('data-valor') || '';
      var on = lista.indexOf(valor) !== -1 || (unico && lista.length === 0 && valor === '');
      o.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    ddAtualizar(dd);
    if (!silencioso) dd.dispatchEvent(new CustomEvent('ds-dropdown-alterar', { bubbles: true, detail: { valores: ddValores(dd) } }));
  }

  function ddFechar(dd, devolverFoco) {
    var btn = dd.querySelector('.ds-dropdown-btn');
    var painel = dd.querySelector('.ds-dropdown-painel');
    if (!painel || painel.hidden) return;
    painel.hidden = true;
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      if (devolverFoco) btn.focus();
    }
  }

  function ddFecharOutros(exceto) {
    var todos = document.querySelectorAll('.ds-dropdown');
    for (var i = 0; i < todos.length; i++) if (todos[i] !== exceto) ddFechar(todos[i], false);
  }

  function ddAbrir(dd) {
    var btn = dd.querySelector('.ds-dropdown-btn');
    var painel = dd.querySelector('.ds-dropdown-painel');
    if (!btn || !painel) return;
    ddFecharOutros(dd);
    painel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    var opcoes = ddOpcoes(dd);
    var alvo = opcoes.filter(function (o) { return o.getAttribute('aria-selected') === 'true'; })[0] || opcoes[0];
    if (alvo) alvo.focus();
  }

  function ddEscolher(dd, opcao) {
    var unico = dd.getAttribute('data-ds-dropdown') === 'unico';
    var valor = opcao.getAttribute('data-valor') || '';
    if (unico) {
      ddDefinir(dd, valor === '' ? [] : [valor]);
      ddFechar(dd, true);
    } else if (valor === '') {
      ddDefinir(dd, []);
    } else {
      var atual = ddValores(dd);
      var i = atual.indexOf(valor);
      if (i === -1) atual.push(valor); else atual.splice(i, 1);
      ddDefinir(dd, atual);
    }
  }

  document.addEventListener('click', function (e) {
    var alvo = e.target && e.target.closest ? e.target : null;
    if (!alvo) return;
    var dd = alvo.closest('.ds-dropdown');
    if (!dd) { ddFecharOutros(null); return; }
    var opcao = alvo.closest('.ds-dropdown-opcao');
    if (opcao) { ddEscolher(dd, opcao); return; }
    if (alvo.closest('[data-ds-dropdown-limpar]')) { ddDefinir(dd, []); return; }
    if (alvo.closest('.ds-dropdown-btn')) {
      var painel = dd.querySelector('.ds-dropdown-painel');
      if (painel && !painel.hidden) ddFechar(dd, false); else ddAbrir(dd);
    }
  });

  document.addEventListener('keydown', function (e) {
    var alvo = e.target && e.target.closest ? e.target : null;
    var dd = alvo && alvo.closest('.ds-dropdown');
    if (!dd) return;
    var painel = dd.querySelector('.ds-dropdown-painel');
    var aberto = painel && !painel.hidden;
    var opcoes = ddOpcoes(dd);
    var i = opcoes.indexOf(document.activeElement);
    if (alvo.closest('.ds-dropdown-btn') && !aberto && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      ddAbrir(dd);
      return;
    }
    if (!aberto) return;
    if (e.key === 'Escape') { e.preventDefault(); ddFechar(dd, true); }
    else if (e.key === 'Tab') ddFechar(dd, false);
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (opcoes.length) opcoes[Math.min(i + 1, opcoes.length - 1)].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (opcoes.length) opcoes[Math.max(i - 1, 0)].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); if (opcoes.length) opcoes[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); if (opcoes.length) opcoes[opcoes.length - 1].focus(); }
    else if ((e.key === 'Enter' || e.key === ' ') && i !== -1) { e.preventDefault(); ddEscolher(dd, opcoes[i]); }
  });

  function hidratarDropdowns() {
    var els = document.querySelectorAll('[data-ds-dropdown]');
    for (var i = 0; i < els.length; i++) {
      var dd = els[i];
      dd.classList.add('ds-dropdown');
      ddOpcoes(dd).forEach(function (o) {
        if (!o.hasAttribute('aria-selected')) o.setAttribute('aria-selected', 'false');
        if (!o.hasAttribute('tabindex')) o.setAttribute('tabindex', '-1');
      });
      ddAtualizar(dd);
    }
  }

  // ---------- Barra de pesquisa ----------
  // <form class="ds-pesquisa" role="search" data-ds-pesquisa> com `.ds-pesquisa-input`
  // (type="search") e `.ds-pesquisa-limpar` (o "x", escondido com o campo vazio).
  // Dispara `ds-pesquisa-alterar` (bubbles, `detail.valor`) 250 ms depois da
  // última tecla e `ds-pesquisa-buscar` no Enter. Esc ou o "x" limpam o campo.
  var pesquisaTimer = null;

  function pesquisaSincronizar(caixa) {
    var input = caixa.querySelector('.ds-pesquisa-input');
    var limpar = caixa.querySelector('.ds-pesquisa-limpar');
    if (limpar && input) limpar.hidden = input.value === '';
  }

  function pesquisaAvisar(caixa, tipo) {
    var input = caixa.querySelector('.ds-pesquisa-input');
    caixa.dispatchEvent(new CustomEvent(tipo, { bubbles: true, detail: { valor: input ? input.value : '' } }));
  }

  function pesquisaLimpar(caixa, silencioso) {
    var input = caixa.querySelector('.ds-pesquisa-input');
    if (!input) return;
    input.value = '';
    pesquisaSincronizar(caixa);
    if (!silencioso) pesquisaAvisar(caixa, 'ds-pesquisa-alterar');
  }

  document.addEventListener('input', function (e) {
    var caixa = e.target && e.target.closest ? e.target.closest('[data-ds-pesquisa]') : null;
    if (!caixa || !e.target.classList.contains('ds-pesquisa-input')) return;
    pesquisaSincronizar(caixa);
    clearTimeout(pesquisaTimer);
    pesquisaTimer = setTimeout(function () { pesquisaAvisar(caixa, 'ds-pesquisa-alterar'); }, 250);
  });

  document.addEventListener('click', function (e) {
    var limpar = e.target && e.target.closest ? e.target.closest('.ds-pesquisa-limpar') : null;
    var caixa = limpar && limpar.closest('[data-ds-pesquisa]');
    if (!caixa) return;
    pesquisaLimpar(caixa, false);
    var input = caixa.querySelector('.ds-pesquisa-input');
    if (input) input.focus();
  });

  document.addEventListener('keydown', function (e) {
    var caixa = e.target && e.target.closest ? e.target.closest('[data-ds-pesquisa]') : null;
    if (!caixa || !e.target.classList.contains('ds-pesquisa-input')) return;
    if (e.key === 'Escape' && e.target.value !== '') { e.preventDefault(); pesquisaLimpar(caixa, false); }
    else if (e.key === 'Enter') { e.preventDefault(); clearTimeout(pesquisaTimer); pesquisaAvisar(caixa, 'ds-pesquisa-buscar'); }
  });

  document.addEventListener('submit', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-ds-pesquisa')) e.preventDefault();
  });

  function hidratarPesquisas() {
    var els = document.querySelectorAll('[data-ds-pesquisa]');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.add('ds-pesquisa');
      pesquisaSincronizar(els[i]);
    }
  }

  // ---------- Barra de filtros ----------
  // <div class="ds-filtros" data-ds-filtros> com uma pesquisa e dropdowns
  // (`data-ds-nome` em cada um) e, opcionalmente, `.ds-filtros-limpar` e
  // `.ds-filtros-resumo`. Junta tudo num só evento, `ds-filtros-alterar`
  // (bubbles), com `detail = { pesquisa, filtros: { nome: [valores] }, ativos }`.
  // O botão "Limpar filtros" só aparece com algum filtro ativo.
  function filtrosEstado(barra) {
    var caixa = barra.querySelector('.ds-pesquisa-input');
    var estado = { pesquisa: caixa ? caixa.value.trim() : '', filtros: {}, ativos: 0 };
    if (estado.pesquisa) estado.ativos++;
    var dds = barra.querySelectorAll('.ds-dropdown');
    for (var i = 0; i < dds.length; i++) {
      var valores = ddValores(dds[i]);
      var nome = dds[i].getAttribute('data-ds-nome') || 'filtro' + (i + 1);
      estado.filtros[nome] = valores;
      if (valores.length) estado.ativos++;
    }
    return estado;
  }

  function filtrosAtualizar(barra, avisar) {
    var estado = filtrosEstado(barra);
    var limpar = barra.querySelector('.ds-filtros-limpar');
    var resumo = barra.querySelector('.ds-filtros-resumo');
    if (limpar) limpar.hidden = estado.ativos === 0;
    if (resumo) resumo.textContent = estado.ativos === 0 ? '' : estado.ativos + (estado.ativos === 1 ? ' filtro ativo' : ' filtros ativos');
    if (avisar) barra.dispatchEvent(new CustomEvent('ds-filtros-alterar', { bubbles: true, detail: estado }));
    return estado;
  }

  function filtrosLimpar(barra) {
    var caixa = barra.querySelector('[data-ds-pesquisa]');
    if (caixa) pesquisaLimpar(caixa, true);
    var dds = barra.querySelectorAll('.ds-dropdown');
    for (var i = 0; i < dds.length; i++) ddDefinir(dds[i], [], true);
    filtrosAtualizar(barra, true);
  }

  ['ds-pesquisa-alterar', 'ds-dropdown-alterar'].forEach(function (nome) {
    document.addEventListener(nome, function (e) {
      var barra = e.target && e.target.closest ? e.target.closest('[data-ds-filtros]') : null;
      if (barra) filtrosAtualizar(barra, true);
    });
  });

  document.addEventListener('click', function (e) {
    var limpar = e.target && e.target.closest ? e.target.closest('.ds-filtros-limpar') : null;
    var barra = limpar && limpar.closest('[data-ds-filtros]');
    if (barra) filtrosLimpar(barra);
  });

  function hidratarFiltros() {
    var els = document.querySelectorAll('[data-ds-filtros]');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.add('ds-filtros');
      filtrosAtualizar(els[i], false);
    }
  }

  // ---------- Máscaras ----------
  // <input data-ds-mascara="telefone|email|cpf|cnpj|data-completa|data-abreviada|cartao">
  // Formata enquanto digita (mantendo o cursor), valida ao sair do campo e
  // marca `aria-invalid` com a mensagem em `.ds-campo-erro`. O valor do campo
  // fica formatado; `KyvvoDS.mascara.limpar(tipo, valor)` devolve o valor
  // cru (só dígitos; no CNPJ, letras e dígitos) para enviar ao servidor.
  function soDigitos(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }

  function dvCpf(digs, n) {
    var soma = 0;
    for (var i = 0; i < n; i++) soma += Number(digs.charAt(i)) * (n + 1 - i);
    var r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  }

  function dvCnpj(base) {
    var pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    var soma = 0;
    var off = pesos.length - base.length;
    for (var i = 0; i < base.length; i++) soma += (base.charCodeAt(i) - 48) * pesos[i + off];
    var r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  }

  function limparCnpj(v) {
    var s = String(v == null ? '' : v).toUpperCase().replace(/[^0-9A-Z]/g, '');
    var out = '';
    for (var i = 0; i < s.length && out.length < 14; i++) {
      // Os dois últimos caracteres (dígitos verificadores) são sempre números.
      if (out.length >= 12 && !/[0-9]/.test(s.charAt(i))) continue;
      out += s.charAt(i);
    }
    return out;
  }

  function luhn(digs) {
    var soma = 0;
    var dobrar = false;
    for (var i = digs.length - 1; i >= 0; i--) {
      var n = Number(digs.charAt(i));
      if (dobrar) { n *= 2; if (n > 9) n -= 9; }
      soma += n;
      dobrar = !dobrar;
    }
    return soma % 10 === 0;
  }

  function marcaCartao(v) {
    var d = soDigitos(v);
    if (/^3[47]/.test(d)) return 'amex';
    if (/^4/.test(d)) return 'visa';
    if (/^(5[1-5]|2(2[2-9][1-9]|2[3-9]|[3-6]|7[01]|720))/.test(d)) return 'mastercard';
    return '';
  }

  function diaValido(dia, mes, ano) {
    if (mes < 1 || mes > 12 || dia < 1) return false;
    var dias = [31, (ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return dia <= dias[mes - 1];
  }

  function anoDeDoisDigitos(aa) {
    var atual = new Date().getFullYear();
    var ano = 2000 + aa;
    return ano > atual + 10 ? ano - 100 : ano;
  }

  function formatarData(v, tamanhoAno) {
    var d = soDigitos(v).slice(0, 4 + tamanhoAno);
    if (d.length <= 2) return d;
    if (d.length <= 4) return d.slice(0, 2) + '/' + d.slice(2);
    return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
  }

  var MASCARAS = {
    telefone: {
      mensagem: 'Telefone inválido',
      exemplo: '(11) 91234-5678',
      autocomplete: 'tel-national',
      inputmode: 'tel',
      formatar: function (v) {
        var d = soDigitos(v);
        if (!d) return '';
        var celular = d.length >= 11 || d.charAt(2) === '9';
        d = d.slice(0, celular ? 11 : 10);
        if (d.length <= 2) return '(' + d;
        var corte = celular ? 5 : 4;
        var corpo = d.slice(2);
        return '(' + d.slice(0, 2) + ') ' + (corpo.length <= corte ? corpo : corpo.slice(0, corte) + '-' + corpo.slice(corte));
      },
      limpar: soDigitos,
      validar: function (v) {
        var d = soDigitos(v);
        if (d.length !== 10 && d.length !== 11) return false;
        if (d.charAt(0) === '0' || d.charAt(1) === '0') return false;
        return d.length === 11 ? d.charAt(2) === '9' : /[2-9]/.test(d.charAt(2));
      }
    },
    email: {
      mensagem: 'E-mail inválido',
      exemplo: 'nome@exemplo.com',
      autocomplete: 'email',
      inputmode: 'email',
      formatar: function (v) { return String(v == null ? '' : v).replace(/\s+/g, '').toLowerCase(); },
      limpar: function (v) { return String(v == null ? '' : v).replace(/\s+/g, '').toLowerCase(); },
      validar: function (v) {
        var s = String(v == null ? '' : v).trim();
        return s.length <= 254 && /^[^\s@.][^\s@]*@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(s) && s.indexOf('..') === -1 && /^[^@]{1,64}@/.test(s);
      }
    },
    cpf: {
      mensagem: 'CPF inválido',
      exemplo: '000.000.000-00',
      autocomplete: 'off',
      inputmode: 'numeric',
      formatar: function (v) {
        var d = soDigitos(v).slice(0, 11);
        var s = d.slice(0, 3);
        if (d.length > 3) s += '.' + d.slice(3, 6);
        if (d.length > 6) s += '.' + d.slice(6, 9);
        if (d.length > 9) s += '-' + d.slice(9);
        return s;
      },
      limpar: soDigitos,
      validar: function (v) {
        var d = soDigitos(v);
        if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
        return dvCpf(d, 9) === Number(d.charAt(9)) && dvCpf(d, 10) === Number(d.charAt(10));
      }
    },
    cnpj: {
      mensagem: 'CNPJ inválido',
      exemplo: '00.000.000/0000-00',
      autocomplete: 'off',
      inputmode: 'text',
      formatar: function (v) {
        var c = limparCnpj(v);
        var s = c.slice(0, 2);
        if (c.length > 2) s += '.' + c.slice(2, 5);
        if (c.length > 5) s += '.' + c.slice(5, 8);
        if (c.length > 8) s += '/' + c.slice(8, 12);
        if (c.length > 12) s += '-' + c.slice(12);
        return s;
      },
      limpar: limparCnpj,
      validar: function (v) {
        var c = limparCnpj(v);
        if (c.length !== 14 || /^(.)\1{13}$/.test(c)) return false;
        var d1 = dvCnpj(c.slice(0, 12));
        return d1 === Number(c.charAt(12)) && dvCnpj(c.slice(0, 12) + d1) === Number(c.charAt(13));
      }
    },
    'data-completa': {
      mensagem: 'Data inválida',
      exemplo: 'DD/MM/AAAA',
      autocomplete: 'off',
      inputmode: 'numeric',
      formatar: function (v) { return formatarData(v, 4); },
      limpar: soDigitos,
      validar: function (v) {
        var d = soDigitos(v);
        if (d.length !== 8) return false;
        var ano = Number(d.slice(4));
        return ano >= 1900 && ano <= 2100 && diaValido(Number(d.slice(0, 2)), Number(d.slice(2, 4)), ano);
      }
    },
    'data-abreviada': {
      mensagem: 'Data inválida',
      exemplo: 'DD/MM/AA',
      autocomplete: 'off',
      inputmode: 'numeric',
      formatar: function (v) { return formatarData(v, 2); },
      limpar: soDigitos,
      validar: function (v) {
        var d = soDigitos(v);
        if (d.length !== 6) return false;
        return diaValido(Number(d.slice(0, 2)), Number(d.slice(2, 4)), anoDeDoisDigitos(Number(d.slice(4))));
      }
    },
    cartao: {
      mensagem: 'Número de cartão inválido',
      exemplo: '0000 0000 0000 0000',
      autocomplete: 'cc-number',
      inputmode: 'numeric',
      formatar: function (v) {
        var d = soDigitos(v).slice(0, 19);
        if (marcaCartao(d) === 'amex') {
          d = d.slice(0, 15);
          var a = d.slice(0, 4);
          if (d.length > 4) a += ' ' + d.slice(4, 10);
          if (d.length > 10) a += ' ' + d.slice(10);
          return a;
        }
        return d.replace(/(\d{4})(?=\d)/g, '$1 ');
      },
      limpar: soDigitos,
      validar: function (v) {
        var d = soDigitos(v);
        var tam = marcaCartao(d) === 'amex' ? [15] : [13, 14, 15, 16, 17, 18, 19];
        return tam.indexOf(d.length) !== -1 && luhn(d);
      }
    }
  };

  function significativo(tipo, ch) {
    return tipo === 'cnpj' ? /[0-9A-Za-z]/.test(ch) : /\d/.test(ch);
  }

  function prepararMascara(el) {
    if (el.getAttribute('data-ds-preparado')) return;
    var tipo = el.getAttribute('data-ds-mascara');
    var m = MASCARAS[tipo];
    if (!m) return;
    el.setAttribute('data-ds-preparado', '1');
    if (!el.hasAttribute('inputmode')) el.setAttribute('inputmode', m.inputmode);
    if (!el.hasAttribute('autocomplete')) el.setAttribute('autocomplete', m.autocomplete);
    if (!el.hasAttribute('placeholder')) el.setAttribute('placeholder', m.exemplo);
    if (tipo === 'cnpj' || tipo === 'email') el.setAttribute('autocapitalize', tipo === 'cnpj' ? 'characters' : 'none');
    el.setAttribute('spellcheck', 'false');
  }

  function erroDoCampo(el, criar) {
    var campo = el.closest('.ds-campo') || el.parentNode;
    var erro = campo && campo.querySelector('.ds-campo-erro');
    if (!erro && criar && campo) {
      erro = document.createElement('p');
      erro.className = 'ds-campo-erro';
      erro.hidden = true;
      campo.appendChild(erro);
    }
    if (erro && !erro.id) erro.id = 'ds-erro-' + Math.random().toString(36).slice(2, 8);
    return erro;
  }

  // Valida o campo, marca aria-invalid e mostra ou esconde a mensagem.
  // Vazio e sem `required` conta como válido. Devolve true/false.
  function validarCampo(el) {
    var tipo = el.getAttribute('data-ds-mascara');
    var m = MASCARAS[tipo];
    if (!m) return true;
    var vazio = el.value === '';
    var valido = vazio ? !el.required : m.validar(el.value);
    var msg = vazio ? 'Campo obrigatório' : (el.getAttribute('data-ds-mensagem-erro') || m.mensagem);
    var erro = erroDoCampo(el, !valido);
    if (valido) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', 'true');
    if (erro) {
      erro.hidden = valido;
      if (!valido) erro.textContent = msg;
      var ids = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
      if (!valido && ids.indexOf(erro.id) === -1) ids.push(erro.id);
      if (valido) ids = ids.filter(function (x) { return x !== erro.id; });
      if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
    }
    el.dispatchEvent(new CustomEvent('ds-mascara-validar', { bubbles: true, detail: { tipo: tipo, valido: valido, valor: el.value, bruto: m.limpar(el.value) } }));
    return valido;
  }

  function aplicarMascara(el) {
    var tipo = el.getAttribute('data-ds-mascara');
    var m = MASCARAS[tipo];
    if (!m) return;
    var ant = el.value;
    var novo = m.formatar(ant);
    if (novo === ant) return;
    var comCursor = tipo !== 'email' && document.activeElement === el && typeof el.selectionStart === 'number';
    var antes = 0;
    if (comCursor) {
      var pos = el.selectionStart;
      for (var i = 0; i < pos; i++) if (significativo(tipo, ant.charAt(i))) antes++;
    }
    el.value = novo;
    if (comCursor) {
      var cont = 0;
      var p = 0;
      while (p < novo.length && cont < antes) { if (significativo(tipo, novo.charAt(p))) cont++; p++; }
      try { el.setSelectionRange(p, p); } catch (err) { /* tipos sem seleção */ }
    }
  }

  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.getAttribute && e.target.getAttribute('data-ds-mascara')) prepararMascara(e.target);
  });

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute || !el.getAttribute('data-ds-mascara')) return;
    prepararMascara(el);
    aplicarMascara(el);
    // Depois de um erro, revalida a cada tecla para o aviso sumir assim que o valor estiver certo.
    if (el.getAttribute('aria-invalid') === 'true') validarCampo(el);
  });

  document.addEventListener('focusout', function (e) {
    var el = e.target;
    if (!el || !el.getAttribute || !el.getAttribute('data-ds-mascara')) return;
    validarCampo(el);
  });

  // Valida todos os campos com máscara de um formulário; foca o primeiro inválido.
  function validarFormulario(form) {
    var campos = form.querySelectorAll('[data-ds-mascara]');
    var primeiro = null;
    for (var i = 0; i < campos.length; i++) {
      if (!validarCampo(campos[i]) && !primeiro) primeiro = campos[i];
    }
    if (primeiro) primeiro.focus();
    return !primeiro;
  }

  function hidratarMascaras() {
    var els = document.querySelectorAll('[data-ds-mascara]');
    for (var i = 0; i < els.length; i++) {
      prepararMascara(els[i]);
      if (els[i].value) els[i].value = MASCARAS[els[i].getAttribute('data-ds-mascara')].formatar(els[i].value);
    }
  }

  var mascara = {
    tipos: Object.keys(MASCARAS),
    formatar: function (tipo, valor) { return MASCARAS[tipo] ? MASCARAS[tipo].formatar(valor) : String(valor); },
    limpar: function (tipo, valor) { return MASCARAS[tipo] ? MASCARAS[tipo].limpar(valor) : String(valor); },
    validar: function (tipo, valor) { return MASCARAS[tipo] ? MASCARAS[tipo].validar(valor) : true; },
    marca: marcaCartao,
    campo: validarCampo,
    formulario: validarFormulario
  };

  // ---- Abas ----
  // <div class="ds-abas" data-ds-abas> com uma .ds-abas-lista (filha direta,
  // role="tablist") de botões .ds-aba (role="tab", aria-controls = id do
  // painel) e um .ds-abas-painel (role="tabpanel") por aba. A marcação já
  // nasce no estado inicial (aria-selected na aba ativa, hidden nos outros
  // painéis); o script mantém isso e liga clique e teclado.

  function abasFilhos(pai, classe) {
    var lista = [];
    if (!pai) return lista;
    for (var i = 0; i < pai.children.length; i++) {
      if (pai.children[i].classList.contains(classe)) lista.push(pai.children[i]);
    }
    return lista;
  }

  function abasLista(el) { return abasFilhos(el, 'ds-abas-lista')[0] || null; }
  function abasTabs(el) { return abasFilhos(abasLista(el), 'ds-aba'); }

  function abaPainel(aba) {
    var id = aba.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  }

  function abasHabilitadas(el) {
    return abasTabs(el).filter(function (t) { return !t.disabled && t.getAttribute('aria-disabled') !== 'true'; });
  }

  function abasAtivar(el, aba, foco, silencioso) {
    var tabs = abasTabs(el);
    var anterior = null;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('aria-selected') === 'true') anterior = tabs[i];
    }
    var indice = -1;
    for (var j = 0; j < tabs.length; j++) {
      var sel = tabs[j] === aba;
      if (sel) indice = j;
      tabs[j].setAttribute('aria-selected', sel ? 'true' : 'false');
      tabs[j].tabIndex = sel ? 0 : -1;
      var painel = abaPainel(tabs[j]);
      if (painel) painel.hidden = !sel;
    }
    var lista = aba.parentNode;
    var esq = aba.offsetLeft;
    var dir = esq + aba.offsetWidth;
    if (esq < lista.scrollLeft) lista.scrollLeft = Math.max(0, esq - 8);
    else if (dir > lista.scrollLeft + lista.clientWidth) lista.scrollLeft = dir - lista.clientWidth + 8;
    if (foco) aba.focus();
    if (anterior !== aba && !silencioso) {
      var p = abaPainel(aba);
      el.dispatchEvent(new CustomEvent('ds-abas-alterar', {
        bubbles: true,
        detail: { aba: aba, painel: p, id: aba.getAttribute('aria-controls'), indice: indice }
      }));
    }
  }

  function prepararAbas(el) {
    if (el.getAttribute('data-ds-preparado') === 'abas') return;
    el.setAttribute('data-ds-preparado', 'abas');
    el.classList.add('ds-abas');
    var lista = abasLista(el);
    if (lista && !lista.getAttribute('role')) lista.setAttribute('role', 'tablist');
    var tabs = abasTabs(el);
    var inicial = null;
    for (var i = 0; i < tabs.length; i++) {
      if (!tabs[i].getAttribute('role')) tabs[i].setAttribute('role', 'tab');
      if (!tabs[i].getAttribute('type')) tabs[i].setAttribute('type', 'button');
      var p = abaPainel(tabs[i]);
      if (p && !p.getAttribute('role')) p.setAttribute('role', 'tabpanel');
      if (p && !p.getAttribute('aria-labelledby') && tabs[i].id) p.setAttribute('aria-labelledby', tabs[i].id);
      if (p && !p.hasAttribute('tabindex')) p.tabIndex = 0;
      if (!inicial && tabs[i].getAttribute('aria-selected') === 'true' && !tabs[i].disabled) inicial = tabs[i];
    }
    if (!inicial) inicial = abasHabilitadas(el)[0] || null;
    if (inicial) abasAtivar(el, inicial, false, true);
  }

  function abasSelecionar(el, alvo, silencioso) {
    prepararAbas(el);
    var tabs = abasTabs(el);
    var aba = null;
    if (typeof alvo === 'number') aba = tabs[alvo] || null;
    else {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].id === alvo || tabs[i].getAttribute('aria-controls') === alvo) aba = tabs[i];
      }
    }
    if (!aba || aba.disabled || aba.getAttribute('aria-disabled') === 'true') return false;
    abasAtivar(el, aba, false, !!silencioso);
    return true;
  }

  function abasAtiva(el) {
    prepararAbas(el);
    var tabs = abasTabs(el);
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('aria-selected') === 'true') return tabs[i];
    }
    return null;
  }

  function abasDoAlvo(alvo) {
    var aba = alvo && alvo.closest ? alvo.closest('.ds-aba') : null;
    var el = aba ? aba.closest('.ds-abas') : null;
    if (!aba || !el || !el.hasAttribute('data-ds-abas') || aba.parentNode !== abasLista(el)) return null;
    prepararAbas(el);
    return { el: el, aba: aba };
  }

  document.addEventListener('click', function (e) {
    var r = abasDoAlvo(e.target);
    if (!r || r.aba.disabled || r.aba.getAttribute('aria-disabled') === 'true') return;
    abasAtivar(r.el, r.aba, false, false);
  });

  document.addEventListener('keydown', function (e) {
    var r = abasDoAlvo(e.target);
    if (!r) return;
    var tecla = e.key;
    if (tecla !== 'ArrowLeft' && tecla !== 'ArrowRight' && tecla !== 'Home' && tecla !== 'End') return;
    var lista = abasHabilitadas(r.el);
    if (!lista.length) return;
    var pos = lista.indexOf(r.aba);
    var novo;
    if (tecla === 'Home') novo = 0;
    else if (tecla === 'End') novo = lista.length - 1;
    else if (tecla === 'ArrowRight') novo = (pos + 1) % lista.length;
    else novo = (pos - 1 + lista.length) % lista.length;
    e.preventDefault();
    if (r.el.getAttribute('data-ds-abas') === 'manual') lista[novo].focus();
    else abasAtivar(r.el, lista[novo], true, false);
  });

  function hidratarAbas() {
    var els = document.querySelectorAll('[data-ds-abas]');
    for (var i = 0; i < els.length; i++) prepararAbas(els[i]);
  }

  // ---- Carrossel ----
  // <div class="ds-carrossel" data-ds-carrossel aria-label="..."> com um
  // .ds-carrossel-trilho (filho direto; rola na horizontal com snap) de
  // .ds-carrossel-slide e, opcionalmente, .ds-carrossel-controles com os
  // botões .ds-carrossel-ant / .ds-carrossel-prox e .ds-carrossel-pontos
  // (vazio: o script cria um ponto por slide). Um slide por vez, sem
  // rotação automática.

  function carrosselFilho(el, classe) {
    for (var i = 0; i < el.children.length; i++) {
      if (el.children[i].classList.contains(classe)) return el.children[i];
    }
    return null;
  }

  function carrosselSlides(el) {
    var trilho = carrosselFilho(el, 'ds-carrossel-trilho');
    var lista = [];
    if (!trilho) return lista;
    for (var i = 0; i < trilho.children.length; i++) {
      if (trilho.children[i].classList.contains('ds-carrossel-slide')) lista.push(trilho.children[i]);
    }
    return lista;
  }

  function carrosselIndice(el) {
    var i = parseInt(el.getAttribute('data-ds-indice'), 10);
    return isNaN(i) ? 0 : i;
  }

  function carrosselAtualizar(el, indice, disparar) {
    var slides = carrosselSlides(el);
    if (!slides.length) return;
    if (indice < 0) indice = 0;
    if (indice > slides.length - 1) indice = slides.length - 1;
    var mudou = el.getAttribute('data-ds-indice') !== String(indice);
    el.setAttribute('data-ds-indice', String(indice));
    for (var i = 0; i < slides.length; i++) {
      var ativo = i === indice;
      if (ativo) { slides[i].removeAttribute('aria-hidden'); slides[i].removeAttribute('inert'); }
      else { slides[i].setAttribute('aria-hidden', 'true'); slides[i].setAttribute('inert', ''); }
    }
    var ctl = carrosselFilho(el, 'ds-carrossel-controles');
    if (ctl) {
      var pontos = ctl.querySelectorAll('.ds-carrossel-ponto');
      for (var j = 0; j < pontos.length; j++) {
        if (j === indice) pontos[j].setAttribute('aria-current', 'true');
        else pontos[j].removeAttribute('aria-current');
      }
      var ant = ctl.querySelector('.ds-carrossel-ant');
      var prox = ctl.querySelector('.ds-carrossel-prox');
      if (ant) ant.disabled = indice === 0;
      if (prox) prox.disabled = indice === slides.length - 1;
    }
    if (mudou && disparar) {
      el.dispatchEvent(new CustomEvent('ds-carrossel-alterar', {
        bubbles: true,
        detail: { indice: indice, slide: slides[indice] }
      }));
    }
  }

  function prepararCarrossel(el) {
    if (el.getAttribute('data-ds-preparado') === 'carrossel') return;
    el.setAttribute('data-ds-preparado', 'carrossel');
    el.classList.add('ds-carrossel');
    if (!el.getAttribute('role')) el.setAttribute('role', 'region');
    if (!el.getAttribute('aria-roledescription')) el.setAttribute('aria-roledescription', 'carrossel');
    var trilho = carrosselFilho(el, 'ds-carrossel-trilho');
    var slides = carrosselSlides(el);
    for (var i = 0; i < slides.length; i++) {
      if (!slides[i].getAttribute('role')) slides[i].setAttribute('role', 'group');
      if (!slides[i].getAttribute('aria-roledescription')) slides[i].setAttribute('aria-roledescription', 'slide');
      if (!slides[i].getAttribute('aria-label')) slides[i].setAttribute('aria-label', (i + 1) + ' de ' + slides.length);
    }
    var ctl = carrosselFilho(el, 'ds-carrossel-controles');
    if (ctl) {
      var ant = ctl.querySelector('.ds-carrossel-ant');
      var prox = ctl.querySelector('.ds-carrossel-prox');
      if (ant) { ant.type = 'button'; if (!ant.getAttribute('aria-label')) ant.setAttribute('aria-label', 'Slide anterior'); }
      if (prox) { prox.type = 'button'; if (!prox.getAttribute('aria-label')) prox.setAttribute('aria-label', 'Próximo slide'); }
      var pontos = ctl.querySelector('.ds-carrossel-pontos');
      if (pontos && !pontos.children.length) {
        for (var k = 0; k < slides.length; k++) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'ds-carrossel-ponto';
          b.setAttribute('aria-label', 'Ir para o slide ' + (k + 1) + ' de ' + slides.length);
          pontos.appendChild(b);
        }
      }
      ctl.hidden = slides.length < 2;
    }
    if (trilho) {
      var espera = null;
      trilho.addEventListener('scroll', function () {
        if (espera) return;
        espera = window.requestAnimationFrame(function () {
          espera = null;
          var largura = slides[0] ? slides[0].offsetWidth : 0;
          if (largura) carrosselAtualizar(el, Math.round(trilho.scrollLeft / largura), true);
        });
      }, { passive: true });
    }
    carrosselAtualizar(el, 0, false);
  }

  function carrosselIr(el, indice, silencioso) {
    prepararCarrossel(el);
    var trilho = carrosselFilho(el, 'ds-carrossel-trilho');
    var slides = carrosselSlides(el);
    if (!trilho || indice < 0 || indice > slides.length - 1) return false;
    var reduzir = false;
    try { reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (err) { /* sem matchMedia */ }
    carrosselAtualizar(el, indice, !silencioso);
    trilho.scrollTo({ left: indice * slides[0].offsetWidth, behavior: reduzir ? 'auto' : 'smooth' });
    return true;
  }

  document.addEventListener('click', function (e) {
    var alvo = e.target && e.target.closest ? e.target.closest('.ds-carrossel-ant, .ds-carrossel-prox, .ds-carrossel-ponto') : null;
    var el = alvo ? alvo.closest('.ds-carrossel') : null;
    if (!alvo || !el || !el.hasAttribute('data-ds-carrossel') || alvo.disabled) return;
    prepararCarrossel(el);
    var atual = carrosselIndice(el);
    if (alvo.classList.contains('ds-carrossel-ant')) carrosselIr(el, atual - 1, false);
    else if (alvo.classList.contains('ds-carrossel-prox')) carrosselIr(el, atual + 1, false);
    else {
      var pontos = alvo.parentNode.querySelectorAll('.ds-carrossel-ponto');
      for (var i = 0; i < pontos.length; i++) if (pontos[i] === alvo) carrosselIr(el, i, false);
    }
  });

  function hidratarCarrosseis() {
    var els = document.querySelectorAll('[data-ds-carrossel]');
    for (var i = 0; i < els.length; i++) prepararCarrossel(els[i]);
  }

  // ---------- Modal ----------
  // KyvvoDS.modalAbrir(conteudoHtml, opts) — opts: {titulo, classeExtra,
  // aoFechar}. Cria `.ds-modal-overlay` > `.ds-modal-card` (com `.ds-modal-close`
  // e, se `opts.titulo`, um `.ds-modal-titulo`) e anexa no fim do `<body>`.
  // Fecha em clique no X, clique fora do card (backdrop) ou Esc — chama
  // `opts.aoFechar` (se vier) e dispara `ds-modal-fechar` (bubbles) no
  // document. Só existe um modal por vez: abrir um novo fecha o anterior sem
  // chamar o `aoFechar` dele (mesma regra do `abrirModal` que o Studio já
  // tem localmente). Retorna o elemento overlay, caso o chamador precise de
  // uma referência (ex.: pra fazer querySelector do conteúdo).
  var modalAtual = null;

  function modalFechar() {
    if (!modalAtual) return;
    var overlay = modalAtual.overlay;
    var aoFechar = modalAtual.aoFechar;
    modalAtual = null;
    overlay.remove();
    document.removeEventListener('keydown', modalEsc);
    if (typeof aoFechar === 'function') aoFechar();
    document.dispatchEvent(new CustomEvent('ds-modal-fechar', { bubbles: true }));
  }

  function modalEsc(e) {
    if (e.key === 'Escape') modalFechar();
  }

  function modalAbrir(conteudoHtml, opts) {
    if (modalAtual) { var o = modalAtual.overlay; modalAtual = null; o.remove(); document.removeEventListener('keydown', modalEsc); }
    opts = opts || {};
    var overlay = document.createElement('div');
    overlay.className = 'ds-modal-overlay';
    overlay.innerHTML =
      '<div class="ds-modal-card' + (opts.classeExtra ? ' ' + opts.classeExtra : '') + '" role="dialog" aria-modal="true">' +
        '<button type="button" class="ds-modal-close" aria-label="Fechar">✕</button>' +
        (opts.titulo ? '<h3 class="ds-modal-titulo">' + opts.titulo + '</h3>' : '') +
        '<div class="ds-modal-corpo">' + conteudoHtml + '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.ds-modal-close').addEventListener('click', modalFechar);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) modalFechar(); });
    document.addEventListener('keydown', modalEsc);
    modalAtual = { overlay: overlay, aoFechar: opts.aoFechar };
    document.dispatchEvent(new CustomEvent('ds-modal-abrir', { bubbles: true, detail: { overlay: overlay } }));
    return overlay;
  }

  // ---------- Barra de seleção flutuante ----------
  // KyvvoDS.selecaoBarraAtualizar(el, quantidade) — el é o `.ds-selecao-barra`
  // já presente na marcação do produto (com um `.ds-selecao-barra-contagem`
  // dentro). Só mostra/esconde e escreve o número; os botões de ação/limpar
  // são ligados pelo produto, o componente não sabe o que eles fazem.
  function selecaoBarraAtualizar(el, quantidade) {
    if (!el) return;
    el.hidden = !quantidade;
    var contagem = el.querySelector('.ds-selecao-barra-contagem');
    if (contagem) contagem.textContent = String(quantidade);
    el.dispatchEvent(new CustomEvent('ds-selecao-alterar', { bubbles: true, detail: { quantidade: quantidade } }));
  }

  function iniciar() {
    hidratarRodapes();
    hidratarMenus();
    hidratarDropdowns();
    hidratarPesquisas();
    hidratarFiltros();
    hidratarMascaras();
    hidratarAbas();
    hidratarCarrosseis();
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
  window.KyvvoDS.menuAlternar = menuAlternar;
  window.KyvvoDS.acoesFechar = acoesFechar;
  window.KyvvoDS.dropdownValores = ddValores;
  window.KyvvoDS.dropdownDefinir = ddDefinir;
  window.KyvvoDS.pesquisaLimpar = pesquisaLimpar;
  window.KyvvoDS.filtrosEstado = filtrosEstado;
  window.KyvvoDS.filtrosLimpar = filtrosLimpar;
  window.KyvvoDS.mascara = mascara;
  window.KyvvoDS.abasSelecionar = abasSelecionar;
  window.KyvvoDS.abasAtiva = abasAtiva;
  window.KyvvoDS.carrosselIr = carrosselIr;
  window.KyvvoDS.carrosselIndice = function (el) { prepararCarrossel(el); return carrosselIndice(el); };
  window.KyvvoDS.modalAbrir = modalAbrir;
  window.KyvvoDS.modalFechar = modalFechar;
  window.KyvvoDS.selecaoBarraAtualizar = selecaoBarraAtualizar;
  window.KyvvoDS.notificacoesAtualizar = notificacoesAtualizar;
})();
