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

Só CSS, o produto escreve a marcação: três colunas sob uma linha de borda —
Instagram à esquerda, "nossos produtos" ao meio e, à direita, LGPD, Ajuda,
Política de Privacidade e Termos de Uso. Até 720px as colunas empilham.

```html
<footer class="ds-rodape-publico">
  <div class="ds-rodape-publico-conteudo">
    <div class="ds-rodape-publico-social">
      <h2 class="ds-rodape-publico-titulo">Redes sociais</h2>
      <p class="ds-rodape-publico-texto">Siga a Kyvvo no <a href="…">Instagram</a></p>
    </div>
    <nav class="ds-rodape-publico-produtos" aria-label="Nossos produtos">
      <h2 class="ds-rodape-publico-titulo">Nossos produtos</h2>
      <ul class="ds-rodape-publico-lista"><li><a href="…">Studio</a></li>…</ul>
    </nav>
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

Os endereços de Instagram, produtos, LGPD e Ajuda são de cada produto — não
deixe `href="#"` em produção. Em área logada use o `data-ds-rodape`.

### Menu lateral — `.ds-menu` + `data-ds-menu`

`<nav class="ds-menu" data-ds-menu>` com itens (`.ds-menu-link`), grupos que
expandem em submenus (`.ds-menu-grupo` > `.ds-menu-grupo-botao` +
`.ds-menu-sub`) e o botão ‹ (`.ds-menu-toggle`) que recolhe o menu pra só os
ícones (72px; 248px aberto). Todo item leva o rótulo em `.ds-menu-rotulo`
(vira o nome acessível no modo recolhido). Item atual: `.ds-menu-link-ativo` +
`aria-current="page"`. Recolhido por padrão: `data-ds-menu-recolhido`; por
código: `KyvvoDS.menuAlternar(nav, true)`. Evento: `ds-menu-alternar`
(`detail.recolhido`). O pacote não traz ícones — o produto fornece os SVGs.

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
  hoje é destacado; a hora atual tem `.agenda-rail-agora`.
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
  Semana/Mês, rodapé público, botão, formulário, pesquisa, filtros, máscaras)
- **patch** — valor corrigido sem mudança de intenção visual
