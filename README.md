# @kyvvohq/design-system

Tokens, assets de marca e **componentes** compartilhados entre os produtos
Kyvvo (Studio, People). A ideia: o que é comum vive aqui, mudança num lugar
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

Trocar a marca = editar `favicon.svg` / `logo.svg` / `logo-dark.svg` aqui,
bump de versão, e os produtos pegam no próximo `npm install` (todos já em
`^2.x`).

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

## Instalar

`.npmrc` no repo consumidor apontando o escopo `@kyvvohq` pro GitHub Packages
(`NPM_PACKAGES_TOKEN` = PAT classic com `read:packages`):

```
@kyvvohq:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_PACKAGES_TOKEN}
```

```
npm install @kyvvohq/design-system
```

## Servir e usar

Não há bundler nos produtos — o CSS é servido cru de `public/`. Sirva
`node_modules/@kyvvohq/design-system/` numa rota estática (ex: `/ds/`) e linke
`tokens.css` **antes** do CSS próprio da página:

```html
<link rel="icon" type="image/svg+xml" href="/ds/favicon.svg">
<link rel="stylesheet" href="/ds/tokens.css">
<link rel="stylesheet" href="/style.css">
```

## Componentes

`components.css` (estilo) + `components.js` (marcação/comportamento) — o que
é igual entre as telas vive aqui, não copiado em cada uma. Mudar o
componente aqui + bump de versão = todas as telas dos dois produtos pegam
no próximo deploy, sem editar tela nenhuma.

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

### `data-ds-rodape` — rodapé de área logada

```html
<footer data-ds-rodape></footer>
```

Vira: linha de borda no topo, logo (troca com o tema via `data-ds-logo`) +
"© <ano corrente> Kyvvo Tecnologia. Todos os direitos reservados." O ano é
dinâmico — nunca precisa bumpar. Também dá pra montar à mão:
`KyvvoDS.rodapeLogado()` devolve o HTML interno.

Mudou o texto/logo/estilo do rodapé? Edita `components.css`/`.js` aqui, bump
de versão — todas as telas logadas de Studio e People mudam juntas.

### Agenda (Studio)

`components.css` também traz o visual da **view Dia da agenda** — grade,
cards (horizontal e compactos lado a lado), chips de filtro por
profissional, régua de hora, rodapé de resumo, tons por status. Classes
`.agenda-*` / `.grade-resumo` (ainda sem prefixo `.ds-`, rename futuro). O
`app.js` do painel só monta a marcação com essas classes — mexer no visual
da agenda inteira é aqui + bump de versão. Studio-only por ora (o People
não tem agenda).

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

SemVer por tag git. Push de tag `v*` dispara o workflow `publish`, que confere
`package.json.version == tag` e roda `npm publish`.

- **major** — token removido/renomeado, ou mudança de mecanismo (ex: v1→v2:
  atributo de tema, `:root` passou a ser claro)
- **minor** — token novo
- **patch** — valor corrigido sem mudança de intenção visual
