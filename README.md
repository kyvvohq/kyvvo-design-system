# @kyvvohq/design-system

Tokens, assets de marca e **componentes** compartilhados entre os produtos
Kyvvo (Studio, People, CRM). A ideia: o que é comum vive aqui, mudança num lugar
só vale nos dois produtos no próximo deploy.

## O que tem aqui

- **`tokens.css`** — o set canônico completo: cor, superfície, texto, marca,
  semânticos, overlay/sombra, escala de espaçamento (8pt), raio e tipografia.
  `:root` é o **tema claro** (default); o escuro é override em
  `:root[data-theme="dark"]`.
  - `--sunken` — superfície **mais recuada** que `--card`, pra elementos que
    devem parecer "afundados" na página (a régua de hora da agenda, cabeçalho
    fixo de tabela, poço de um input). No claro coincide com `--border`; no
    escuro é o tom mais escuro do pacote (mais escuro que `--bg`), de
    propósito — uso pontual, não vira fundo de página (isso é `--bg`).
- **`tokens.foundations.css`** — só reexporta `tokens.css` (compat da v1, que
  publicava apenas espaçamento + raio).
- **`components.css`** + **`components.js`** — componentes prontos (marcação +
  estilo), prefixo `.ds-`. Ao contrário dos tokens, aqui a mudança já vale em
  todo produto sem tocar em código de tela. Ver "Componentes" abaixo.
- **`favicon.svg`** — o mark do Kyvvo (quadrado `--accent` + "vv"). Único pros
  produtos; o que varia é o **nome do produto**, não o ícone.
- **`logo.svg`** / **`logo-dark.svg`** — o wordmark "Kyvvo", um arquivo por
  tema. Cor é gravada no próprio SVG (não é `currentColor`/token) — um `<img>`
  carregado por `src` não herda `color` nem variável CSS da página, então o
  jeito de themear é trocar o arquivo inteiro, não recolorir. O nome do
  produto ("Studio", "People") acompanha à parte, não é assado no logo.

Trocar a marca = editar `favicon.svg` / `logo.svg` / `logo-dark.svg` aqui e
mergear na main — os produtos pegam em segundos (ver "Consumo em tempo
real" abaixo).

Base do vocabulário: arquivo pen.dev "Kyvvo DS" (o `shell.css` do Kyvvo People
já usava esse dialeto). Fonte da verdade: `docs/design-system.md` no repo
`kyvvo`.

## Tema

O produto controla o tema pelo atributo `data-theme` no `<html>`:

- ausente ou `data-theme="light"` → claro
- `data-theme="dark"` → escuro

Padrão: aplicar por um script síncrono no `<head>`, antes do primeiro paint,
lendo de `localStorage`:

```html
<script>
  document.documentElement.setAttribute(
    'data-theme',
    localStorage.getItem('<prefixo>_tema') || 'light'
  );
</script>
```

## Consumo em tempo real (produção)

Desde 2026-09-16, os produtos (Studio/People/Admin) **não** servem `/ds/*` a
partir do próprio `node_modules` — isso exigia `npm install` + bump de
lockfile + deploy em cada repo pra uma mudança propagar, e cada um podia
ficar numa versão diferente (foi o que aconteceu: People ficou preso na
2.4.0 enquanto os outros já estavam na 2.5.0).

Agora: todo push na `main` (`.github/workflows/deploy.yml`) copia os
arquivos direto pro EC2, num diretório único (`/opt/kyvvo/design-system/`),
e o nginx serve `/ds/` pros 3 domínios a partir **desse mesmo lugar**
(`alias`, não `proxy_pass` pro container do produto). Uma mudança aqui
mergeada na main já vale nos 3 produtos em segundos — sem tocar em código,
sem redeploy de produto nenhum, sem versão pra sincronizar.

Trade-off consciente: sem trava por versão, um erro aqui afeta os 3
produtos ao vivo imediatamente (decisão do Bruno, 2026-09-16 — antes disso
o pacote era instalado via npm com versão travada por repo).

## Instalar via npm (opcional, não é o caminho usado em produção)

O `publish.yml` (tag `v*` → `npm publish`) continua existindo pra quem
quiser instalar o pacote via npm por outro motivo (não é assim que
Studio/People/Admin consomem `/ds/*` hoje — ver seção acima).

`.npmrc` no repo consumidor apontando o escopo `@kyvvohq` pro GitHub Packages
(`NPM_PACKAGES_TOKEN` = PAT classic com `read:packages`):

```
@kyvvohq:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_PACKAGES_TOKEN}
```

```
npm install @kyvvohq/design-system
```

## Linkar nas páginas

Linke `tokens.css` **antes** do CSS próprio da página, sempre a partir de
`/ds/` (servido pelo nginx direto do diretório compartilhado, ver acima):

```html
<link rel="icon" type="image/svg+xml" href="/ds/favicon.svg">
<link rel="stylesheet" href="/ds/tokens.css">
<link rel="stylesheet" href="/style.css">
```

## Componentes

`components.css` (estilo) + `components.js` (marcação/comportamento) — o que
é igual entre as telas vive aqui, não copiado em cada uma. Mudar o
componente aqui e mergear na main = todas as telas dos produtos mudam
juntas em segundos, sem editar tela nenhuma e sem deploy de produto.

```html
<link rel="stylesheet" href="/ds/tokens.css">
<link rel="stylesheet" href="/ds/components.css">
<link rel="stylesheet" href="/style.css">
...
<script src="/ds/components.js"></script>
```

O `components.js` é script clássico (sem módulo): expõe `window.KyvvoDS` e,
no `DOMContentLoaded`, hidrata elementos marcados com `data-ds-*`. A ordem
em relação ao JS do produto (`app.js`/`shell.js`) não importa.

### Rodapé de área logada — `data-ds-rodape`

```html
<footer data-ds-rodape data-ds-produto="Studio"></footer>
```

Vira: linha de borda no topo e "© <ano corrente> {produto} Kyvvo powered by
{logo}. Todos os direitos reservados." O logo (o segundo "Kyvvo") troca com o
tema via `data-ds-logo`. O ano é dinâmico — nunca precisa bumpar. Sem
`data-ds-produto` a linha começa em "© <ano> Kyvvo powered by". Também dá pra
montar à mão: `KyvvoDS.rodapeLogado("Studio")` devolve o HTML interno.

### Rodapé de área não logada — `.ds-rodape-publico`

O produto escreve a marcação: três colunas sob uma linha de borda — prévia do
Instagram com o link embaixo, carrossel dos produtos Kyvvo (Studio, People,
CRM) ao meio e, à direita, LGPD, Ajuda, Política de Privacidade e Termos de
Uso. Uma barra em gradiente roxo→ciano sobre a linha de cima (a do
sublinhado do logo) e cartões `accent-tint` ligam ao logo. Até 960px os links
descem para uma linha própria; até 720px tudo empilha.

```html
<footer class="ds-rodape-publico">
  <div class="ds-rodape-publico-conteudo">
    <figure class="ds-rodape-publico-social">
      <a class="ds-rodape-publico-imagem" href="https://www.instagram.com/somoskyvvo" tabindex="-1" aria-hidden="true"><img src="…" alt="Última publicação da Kyvvo no Instagram"></a>
      <figcaption class="ds-rodape-publico-texto">Siga a Kyvvo no <a href="https://www.instagram.com/somoskyvvo">Instagram</a></figcaption>
    </figure>
    <div class="ds-rodape-publico-produtos">
      <h2 class="ds-rodape-publico-titulo" id="rp-produtos">Nossos produtos</h2>
      <div class="ds-carrossel" data-ds-carrossel aria-labelledby="rp-produtos">
        <div class="ds-carrossel-trilho">
          <div class="ds-carrossel-slide">
            <div class="ds-rodape-publico-produto">
              <h3 class="ds-rodape-publico-produto-nome"><a href="https://www.studio.kyvvo.com.br">Studio</a></h3>
              <p class="ds-rodape-publico-produto-texto">…uma frase…</p>
              <span class="ds-rodape-publico-produto-ir" aria-hidden="true">Conhecer &rarr;</span>
            </div>
          </div>
          …um slide por produto…
        </div>
        <div class="ds-carrossel-controles">
          <button type="button" class="ds-carrossel-btn ds-carrossel-ant"><svg aria-hidden="true">…</svg></button>
          <div class="ds-carrossel-pontos"></div>
          <button type="button" class="ds-carrossel-btn ds-carrossel-prox"><svg aria-hidden="true">…</svg></button>
        </div>
      </div>
    </div>
    <nav class="ds-rodape-publico-links" aria-label="Informações legais e ajuda">
      <ul class="ds-rodape-publico-lista">
        <li><a href="…">LGPD</a></li>
        <li><a href="…">Ajuda</a></li>
        <li><a href="https://studio.kyvvo.com.br/privacidade.html">Política de Privacidade</a></li>
        <li><a href="https://studio.kyvvo.com.br/termos.html">Termos de Uso</a></li>
      </ul>
    </nav>
  </div>
</footer>
```

A imagem do Instagram é do produto: o design system não busca publicações
(foto fixa, ou a última publicação via incorporação/API oficial do Instagram
— cada produto decide como atualizar). Endereços: Instagram
`https://www.instagram.com/somoskyvvo`; produtos `https://www.studio.kyvvo.com.br`,
`https://www.people.kyvvo.com.br`, `https://www.crm.kyvvo.com.br`; LGPD e Ajuda
ainda sem endereço definido — não deixe `href="#"` em produção. Em área logada
use o `data-ds-rodape`.

**Mudança de marcação em relação à 2.6.0/2.7.0:** o rodapé público trocou o
`<p>` + `<ul>` de produtos por `<figure>` + carrossel. A marcação antiga
segue renderizando (mesmas classes), só sem o novo visual.

### Carrossel — `.ds-carrossel` + `data-ds-carrossel`

Um slide por vez num trilho que rola na horizontal (toque + encaixe do
navegador), com botões anterior/próximo e pontos. Marcação: `.ds-carrossel`
com `.ds-carrossel-trilho` de `.ds-carrossel-slide` e `.ds-carrossel-controles`
(`.ds-carrossel-ant`, `.ds-carrossel-pontos` vazio — o script cria um ponto por
slide —, `.ds-carrossel-prox`). Nome acessível: `aria-label` ou
`aria-labelledby`; o script completa `role`, `aria-roledescription` e "1 de N"
nos slides. Sem rotação automática. Slides fora da vista ficam `inert` e
`aria-hidden`. Evento: `ds-carrossel-alterar` (`detail = { indice, slide }`).
Por código: `KyvvoDS.carrosselIr(el, indice, silencioso)` e
`KyvvoDS.carrosselIndice(el)`.

### Menu lateral — `.ds-menu` + `data-ds-menu`

`<nav class="ds-menu" data-ds-menu>` com itens (`.ds-menu-link`), grupos que
expandem em submenus (`.ds-menu-grupo` > `.ds-menu-grupo-botao` +
`.ds-menu-sub`) e o botão ‹ (`.ds-menu-toggle`) que recolhe o menu pra só os
ícones (72px; 248px aberto). Todo item leva o rótulo em `.ds-menu-rotulo`
(vira o nome acessível no modo recolhido). Item atual: `.ds-menu-link-ativo` +
`aria-current="page"`. Recolhido por padrão: `data-ds-menu-recolhido`; por
código: `KyvvoDS.menuAlternar(nav, true)`. Evento: `ds-menu-alternar`
(`detail.recolhido`). O pacote não traz ícones — o produto fornece os SVGs.

### Abas — `.ds-abas` + `data-ds-abas`

Abas para dividir o conteúdo de uma tela de submenu (Dados, Histórico,
Financeiro). `<div class="ds-abas" data-ds-abas>` com uma `.ds-abas-lista`
(`role="tablist"`) de botões `.ds-aba` (`role="tab"`, `aria-controls` =
`id` do painel) e um `.ds-abas-painel` (`role="tabpanel"`) por aba. Escreva
a marcação já no estado inicial: `aria-selected="true"` na aba ativa e
`hidden` nos outros painéis. Opcionais: ícone, contagem
(`.ds-aba-contagem`) e aba `disabled`. Clique e ← → Home End trocam a aba
(`data-ds-abas="manual"`: o foco só se move, Enter/Espaço ativam). Evento:
`ds-abas-alterar` (`detail = { aba, painel, id, indice }`). Por código:
`KyvvoDS.abasSelecionar(el, indiceOuId, silencioso)` e
`KyvvoDS.abasAtiva(el)`. Em espaço estreito a lista rola na horizontal.
Abas dividem o conteúdo de **uma** tela; para navegar entre telas use o Menu.

### Agenda — Dia, Semana e Mês

`components.css` traz o visual da agenda com **três visões no mesmo
componente**: topo comum (‹ Hoje ›, título, seletor de visão
`.agenda-visoes`) e filtros por profissional (`.agenda-chip`; "Todos" +
um por profissional, vários podem ficar ligados). Classes `.agenda-*` (ainda
sem prefixo `.ds-`, rename futuro).

- **Agendamento** (igual nas três visões): uma linha — avatar do profissional
  (`.agenda-avatar`), primeiro nome + último sobrenome do cliente/candidato,
  serviço/vaga e o menu "..." (`.ds-acoes`). Sem horário de intervalo. Tom de
  status por classe (`.agenda-tom-ok|warn|bad`); cancelado leva
  `.agendamento-cancelado`.
- **Dia** — `.agenda-grade`; profissionais diferentes no mesmo horário ficam
  lado a lado (`.agenda-multi`); a linha da hora atual (`.agenda-linha-agora`)
  é maior que as demais.
- **Semana** — `.agenda-semana`, régua de hora + uma coluna por dia. Só entram
  os dias de trabalho: o produto informa quantos em `--agenda-dias`. O dia de
  hoje é destacado; a hora atual tem `.agenda-rail-agora`. Acréscimo da
  v2.10.0: a coluna de hoje (`.agenda-semana-cab-hoje`) também fica mais larga
  que as demais — puro CSS (`:has()`), sem precisar de nada novo no app.js.
- **Mês** — `.agenda-mes`, também só com dias de trabalho; a célula de hoje
  (`.agenda-mes-celula-hoje`) é maior e destacada.

O `app.js` do painel só monta a marcação com essas classes — mexer no visual
da agenda inteira é só aqui. O mesmo componente serve o Studio (cliente +
serviço) e o People (candidato + vaga).

### Menu de ações — `.ds-acoes`

Botão "..." que abre um menu de ações de um item (usado em cada agendamento).
`components.js` liga qualquer `.ds-acoes`: abre junto do botão sem ser cortado
pela grade, teclado (↑ ↓ Home End Esc), e dispara `ds-acoes-escolher` com o
`data-acao` do item. `KyvvoDS.acoesFechar()` fecha por código.

### Modal — `KyvvoDS.modalAbrir`/`modalFechar`

Componente novo (v2.9.0), paralelo ao modal que o Studio já tem localmente
(`.modal-overlay`/`.modal-card`, não faz parte do DS) — pensado pra fluxos
novos que precisam existir em mais de um produto (ex.: disparo manual de
WhatsApp). Sem marcação `data-ds-*` pra hidratar: é só chamar por código.

```js
KyvvoDS.modalAbrir('<p>Conteúdo do modal.</p>', {
  titulo: 'Título do modal',      // opcional
  classeExtra: 'minha-variante',  // opcional, pra CSS de tamanho específico
  aoFechar: () => { /* roda quando o modal fecha, por qualquer motivo */ },
});
KyvvoDS.modalFechar();
```

Fecha em clique no X, clique fora do card (backdrop) ou Esc. Só existe um por
vez — abrir um novo fecha o anterior sem chamar o `aoFechar` dele. Eventos no
`document`: `ds-modal-abrir` (`detail.overlay`), `ds-modal-fechar`.

### Barra de seleção flutuante — `.ds-selecao-barra`

Componente novo (v2.9.0) pra fluxos de "selecionar N itens, depois agir"
(ex.: selecionar clientes numa tabela pra um disparo em lote). O produto
escreve a marcação e liga os próprios botões — o componente só mostra/esconde
e escreve a contagem:

```html
<div class="ds-selecao-barra" data-ds-selecao-barra hidden>
  <span class="ds-selecao-barra-contagem"></span> selecionado(s)
  <button class="ds-selecao-barra-limpar" type="button">Limpar seleção</button>
  <button class="ds-selecao-barra-acao" type="button">Novo disparo</button>
</div>
```

```js
KyvvoDS.selecaoBarraAtualizar(el, quantidade); // el = a .ds-selecao-barra
```

`quantidade === 0` esconde a barra (`hidden`); qualquer valor `> 0` mostra e
atualiza o número. Dispara `ds-selecao-alterar` (`detail.quantidade`) no
próprio elemento.

### Notificações (balão) — `.ds-notificacoes`

Componente novo (v2.11.0), pensado pra ficar ao lado do menu do usuário no
topo — não existe um "menu do usuário" compartilhado hoje (cada produto tem o
seu, com nomes diferentes: `.topo-perfil` no CRM/People, `.user-menu` no
Studio), então este componente é autocontido: o produto só o encaixa como
irmão do próprio menu. Mesmo posicionamento/fechamento do menu de ações
(`.ds-acoes`) acima, mas o componente não sabe o que é uma notificação — só
abre/fecha o painel e atualiza a contagem; o produto preenche o conteúdo e
liga os cliques dos itens.

```html
<div class="ds-notificacoes">
  <button class="ds-notificacoes-btn" aria-haspopup="menu" aria-expanded="false" aria-label="Notificações">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><!-- ícone de sino --></svg>
    <span class="ds-notificacoes-contagem" hidden></span>
  </button>
  <div class="ds-notificacoes-painel" role="menu" hidden>
    <div class="ds-notificacoes-lista">
      <!-- preenchido pelo produto: .ds-notificacoes-item (link) ou .ds-notificacoes-vazio -->
    </div>
  </div>
</div>
```

```js
KyvvoDS.notificacoesAtualizar(el, quantidade); // el = a .ds-notificacoes
```

`quantidade === 0` esconde a pílula; qualquer valor `> 0` mostra o número
(`99+` acima disso). Dispara `ds-notificacoes-alterar` (`detail.quantidade`)
no próprio elemento. Fecha em clique fora, Esc, scroll ou resize.

### Botão — `.ds-btn`

Só CSS. Variantes `.ds-btn-primario|secundario|ghost|perigo`, tamanhos
(`.ds-btn-sm`, padrão, `.ds-btn-lg`), `.ds-btn-icone` (só ícone, exige
`aria-label`), `disabled` e `aria-busy="true"` (carregando).

### Formulário — `.ds-form`, `.ds-campo`, `.ds-input`

Só CSS: `.ds-form` (+ `.ds-form-grade`), `.ds-campo` com `.ds-rotulo`,
`.ds-input`, `.ds-select`, `.ds-textarea`, `.ds-check`, ajuda e erro
(`.ds-campo-erro`). O rótulo visível é obrigatório (a borda do campo é
decorativa, não é o que identifica o campo).

### Pesquisa, filtro dropdown e barra de filtros

- **`<form class="ds-pesquisa" data-ds-pesquisa>`** — busca com lupa e botão
  limpar; debounce de 250 ms; eventos `ds-pesquisa-alterar` e
  `ds-pesquisa-buscar`. `KyvvoDS.pesquisaLimpar(el)`.
- **`.ds-dropdown[data-ds-dropdown="multi|unico"]`** — filtro em forma de
  botão com painel `role="listbox"`; evento `ds-dropdown-alterar`.
  `KyvvoDS.dropdownValores(el)` / `dropdownDefinir(el, valores)`.
- **`.ds-filtros[data-ds-filtros]`** — junta pesquisa + dropdowns + "Limpar
  filtros" e avisa o produto por **um** evento, `ds-filtros-alterar`
  (`detail = { pesquisa, filtros, ativos }`). `KyvvoDS.filtrosEstado(el)` /
  `filtrosLimpar(el)`.

### Máscaras — `data-ds-mascara`

Atributo no `<input class="ds-input">`: `telefone`, `email`, `cpf`, `cnpj`
(inclui o CNPJ alfanumérico), `data-completa` (dd/mm/aaaa),
`data-abreviada` (mm/aa) e `cartao` (Luhn). Formata ao digitar/colar (mantém o
cursor), valida ao sair do campo (`aria-invalid` + mensagem em
`.ds-campo-erro`; `data-ds-mensagem-erro` personaliza) e dispara
`ds-mascara-validar`. Campo `required` vazio é inválido. API:
`KyvvoDS.mascara.{tipos, formatar, limpar, validar}`. Mande ao servidor o
valor **limpo** (`mascara.limpar(tipo, valor)`), nunca o formatado.

## Logo por tema

`logo.svg` (claro) / `logo-dark.svg` (escuro) — troque o `src` inteiro no
mesmo lugar onde o produto já sincroniza o tema (junto do que lê/seta
`data-theme` no `<html>`):

```js
function aplicarLogo() {
  const escuro = document.documentElement.getAttribute('data-theme') === 'dark';
  document.querySelectorAll('.js-logo-kyvvo').forEach((img) => {
    img.src = escuro ? '/ds/logo-dark.svg' : '/ds/logo.svg';
  });
}
```

## Versionamento

Só vale pro caminho npm opcional (ver "Instalar via npm" acima) — o consumo
real em produção (`/ds/*` via nginx) não depende de tag/versão nenhuma, é o
conteúdo da `main` sempre.

SemVer por tag git. Push de tag `v*` dispara o workflow `publish`, que confere
`package.json.version == tag` e roda `npm publish`.

- **major** — token removido/renomeado, ou mudança de mecanismo (ex: v1→v2:
  atributo de tema, `:root` passou a ser claro)
- **minor** — token novo ou componente novo (ex.: 2.6.0 — Menu, Agenda
  Semana/Mês, rodapé público, botão, formulário, pesquisa, filtros, máscaras;
  2.7.0 — abas; 2.8.0 — carrossel e rodapé público refeito; 2.9.0 — modal e
  barra de seleção; 2.10.0 — coluna de hoje mais larga na visão Semana;
  2.11.0 — balão de notificações)
- **patch** — valor corrigido sem mudança de intenção visual
