# @kyvvohq/design-system

Tokens de design compartilhados entre os produtos Kyvvo (Studio, People).

## O que tem aqui

- **`tokens.css`** — o set canônico completo: cor, superfície, texto, marca,
  semânticos, overlay/sombra, escala de espaçamento (8pt), raio e tipografia.
  `:root` é o **tema claro** (default); o escuro é override em
  `:root[data-theme="dark"]`.
- **`tokens.foundations.css`** — só reexporta `tokens.css` (compat da v1, que
  publicava apenas espaçamento + raio).
- **`favicon.svg`** — o mark do Kyvvo (quadrado `--accent` + "vv"). Único pros
  produtos; o que varia é o **nome do produto**, não o ícone.
- **`logo.svg`** — o wordmark "Kyvvo". Idem: o nome do produto ("Studio",
  "People") acompanha à parte, não é assado no logo.

Trocar a marca = editar `favicon.svg` / `logo.svg` aqui, bump de versão, e os
produtos pegam no próximo `npm install` (todos já em `^2.x`).

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

## Versionamento

SemVer por tag git. Push de tag `v*` dispara o workflow `publish`, que confere
`package.json.version == tag` e roda `npm publish`.

- **major** — token removido/renomeado, ou mudança de mecanismo (ex: v1→v2:
  atributo de tema, `:root` passou a ser claro)
- **minor** — token novo
- **patch** — valor corrigido sem mudança de intenção visual
