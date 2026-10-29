# PROJETECH — integração e publicação

Esta branch é independente da `main` (SCPE/TCC). Não faça merge no TCC sem revisão.

## O que foi alterado
- O frontend de estoque (`artifacts/estoque-facil/src/lib/api-client.ts`) chama as rotas Express `/api/*` existentes, usando o PostgreSQL do servidor, em vez de fazer consultas diretas ao Supabase.
- `VITE_API_BASE_URL` é opcional se a API estiver na mesma origem do frontend. Caso contrário, configure a URL pública da API, sem barra final.
- `DATABASE_URL` deve permanecer **somente no servidor**. Nunca crie uma variável `VITE_DATABASE_URL`.

## O que ainda exige configuração
1. A autenticação (`auth-gate.tsx`) continua usando Supabase Auth. Sem `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, o aplicativo ainda exibirá erro. Use um projeto Supabase **separado** para a Projetech ou implemente autenticação de servidor segura antes de publicar. Não reutilize as chaves ou contas do SCPE.
2. Verifique como o Replit inicia o frontend e a API: ambos usam `PORT` em seus respectivos arquivos de configuração. É necessário ter roteamento correto de `/api/*` para o servidor Express, seja por mesma origem, proxy ou URL externa.
3. A API de estoque atualmente não valida sessão nas rotas. **Não publique a API com operações de escrita acessíveis sem autenticação/autorização.** O bloqueio visual de login no frontend não protege endpoints HTTP.
4. Sincronize esta branch com o app Replit `Projetech-Sustentabilidade` (o Remix do Replit não sincroniza automaticamente com GitHub).
5. Teste build, login, cadastro, criação de produto, entrada, saída, filtros, relatórios e publicação. Nenhum teste de execução foi realizado por esta alteração.

## Objetivo
Manter o SCPE intacto e construir uma versão sustentável da gestão de estoque, com indicadores de desperdício, reutilização e reciclagem, e identidade visual PROJETECH/Blue.
