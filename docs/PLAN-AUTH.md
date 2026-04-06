# PLANO CIRÚRGICO: Correção Login (Bcrypt) + CORS

## Problemas
1. Login bloqueado por hashes bcrypt legados → bloco `$2` retorna 400 sem verificar senha
2. CORS conflitante → 3 camadas de CORS colidem no index.ts + auth.ts manual

## Arquivos a Alterar (3 apenas)
1. `cloudflare-backend/src/lib/password.ts` → +import bcrypt, +fallback comparePassword
2. `cloudflare-backend/src/routes/auth.ts` → -attachCorsForAllowedOrigin, +migração progressiva
3. `cloudflare-backend/src/index.ts` → centralizar CORS no middleware Hono

## Detalhes Completos
Consultar artefato: plano_correcao_auth_cors.md
