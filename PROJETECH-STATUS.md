# PROJETECH Sustentabilidade — status

As alterações estão isoladas na branch `projetech-sustentabilidade`. A branch `main` não foi alterada e nada foi publicado.

## Implementado
- Frontend integrado à API Express pela mesma origem em `/api`; não depende de variáveis nem do cliente Supabase.
- Cadastro e login usam o PostgreSQL deste Replit. Senhas são armazenadas com bcrypt; sessões aleatórias têm apenas o hash salvo no banco e usam cookie `HttpOnly`, `SameSite=Strict` e `Secure` em produção.
- Login renova a sessão anterior; logout revoga o token no servidor. Cadastro/login têm limite de tentativas e as operações de estoque exigem sessão e origem válida.
- Produtos, movimentações, dashboard e relatórios continuam usando as rotas de estoque existentes.
- Identidade PROJETECH Sustentabilidade aplicada; o mascote Blue foi mantido.

## Verificação
- Geração do contrato OpenAPI, typecheck da API e do frontend, build da API e build de produção do frontend concluídos.
- 25 verificações funcionais passaram: cadastro, login, sessão, proteção contra origem externa, produtos, entradas, saídas, dashboard e relatórios.
- O saldo após a limpeza dos registros temporários de teste voltou ao estado original: 1 produto e 4 movimentações.
- O preview foi conferido nas telas de login e cadastro, incluindo layout móvel. Não foi publicado.
