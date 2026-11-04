-- Ejecutar en el SQL Editor de Supabase para corregir permisos de tablas creadas por SQL.
GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;

-- Replica identity para eventos DELETE en tiempo real (con RLS activo).
ALTER TABLE matrix_records REPLICA IDENTITY FULL;
ALTER TABLE record_dependencies REPLICA IDENTITY FULL;
ALTER TABLE catalog_action_types REPLICA IDENTITY FULL;
ALTER TABLE catalog_modalities REPLICA IDENTITY FULL;
ALTER TABLE catalog_dependencies REPLICA IDENTITY FULL;
