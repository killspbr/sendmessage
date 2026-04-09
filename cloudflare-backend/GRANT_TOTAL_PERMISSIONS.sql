-- FINAL PERMISSION FIX
-- Granting all privileges to cf_hyperdrive on the public schema and all its objects

GRANT USAGE ON SCHEMA public TO cf_hyperdrive;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cf_hyperdrive;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cf_hyperdrive;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO cf_hyperdrive;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO cf_hyperdrive;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO cf_hyperdrive;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO cf_hyperdrive;

-- Ensure it can create new things if needed (though we avoid it at runtime now)
GRANT CREATE ON SCHEMA public TO cf_hyperdrive;

SELECT 'Permissoes concedidas com sucesso ao cf_hyperdrive' as result;
