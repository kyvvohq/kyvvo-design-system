#!/usr/bin/env python3
"""Gera exemplos/automacoes-disparos.standalone.html: o mesmo exemplo, com
tokens.css, components.css e components.js embutidos — abre em qualquer
lugar (arquivo baixado, prévia, e-mail), sem depender de caminhos relativos.
Rode de novo sempre que o DS mudar:  python3 exemplos/gerar-standalone.py"""
import pathlib, re
raiz = pathlib.Path(__file__).resolve().parent.parent
fonte = (raiz / 'exemplos' / 'automacoes-disparos.html').read_text()
css = (raiz / 'tokens.css').read_text() + '\n' + (raiz / 'components.css').read_text()
js = (raiz / 'components.js').read_text()
fonte = re.sub(r'<link rel="stylesheet" href="\.\./tokens\.css">\s*<link rel="stylesheet" href="\.\./components\.css">',
               lambda m: '<style>\n' + css + '\n</style>', fonte)
fonte = fonte.replace('<script src="../components.js"></script>', lambda: None or '<script>\n' + js + '\n</script>') if False else \
        fonte.replace('<script src="../components.js"></script>', '<script>\n' + js.replace('</script>', '<\\/script>') + '\n</script>')
(raiz / 'exemplos' / 'automacoes-disparos.standalone.html').write_text(fonte)
print('ok')
