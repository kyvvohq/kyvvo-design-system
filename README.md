# @kyvvohq/design-system

Fundações de design compartilhadas entre os produtos Kyvvo (Studio, People).

## O que tem aqui hoje

`tokens.foundations.css` — **só** a escala de espaçamento (`--space-1..8`) e a
escala de raio (`--radius-sm..full`). Esses são os únicos tokens que hoje já são
idênticos byte-a-byte no painel do Studio, na landing do Studio e no People.

Cor, superfície e mecanismo de tema (claro/escuro) ainda divergem entre os
produtos — cada um mantém seu vocabulário. Unificar isso é uma tarefa dedicada,
com QA visual, fora deste pacote por ora.

Fonte da verdade do design system completo: `docs/design-system.md` no repo
`kyvvo` e o arquivo pen.dev "Kyvvo DS".

## Instalar

Consumidores precisam de um `.npmrc` apontando o escopo `@kyvvohq` para o
GitHub Packages:

```
@kyvvohq:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_PACKAGES_TOKEN}
```

`NPM_PACKAGES_TOKEN` = PAT (classic) com `read:packages`. Nos repos `kyvvo` e
`kyvvo-people` já existe como secret; localmente, exporte no ambiente.

```
npm install @kyvvohq/design-system
```

## Usar

```css
@import "@kyvvohq/design-system/tokens.foundations.css";
```

Não há bundler nos produtos — o arquivo precisa ser servido estaticamente
(copiado para a pasta pública no build, ou servido de `node_modules`).

## Versionamento

SemVer, versionado por tag git. Push de tag `v*` dispara o workflow `publish`,
que confere `package.json.version == tag` e roda `npm publish` no GitHub
Packages privado da org `kyvvohq`.

- **patch** — valor de token corrigido sem mudança de intenção visual
- **minor** — token novo adicionado
- **major** — token removido ou renomeado
