-- Ecosistema de Orientación Vocacional — esquema
CREATE TYPE record_status AS ENUM (
  'no_existe',
  'no_funciona',
  'posible_duplicado',
  'existe_y_funciona',
  'requiere_fortalecimiento',
  'sin_clasificar'
);

CREATE TABLE catalog_action_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE catalog_modalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE catalog_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE matrix_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id SMALLINT NOT NULL CHECK (dimension_id BETWEEN 1 AND 7),
  primary_stage_id SMALLINT NOT NULL CHECK (primary_stage_id BETWEEN 1 AND 5),
  related_stage_ids SMALLINT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  status record_status NOT NULL DEFAULT 'sin_clasificar',
  action_name TEXT,
  action_type_id UUID REFERENCES catalog_action_types(id) ON DELETE SET NULL,
  organizer TEXT,
  executor TEXT,
  modality_id UUID REFERENCES catalog_modalities(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  created_by_dependency TEXT NOT NULL,
  updated_by_name TEXT NOT NULL,
  updated_by_dependency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE record_dependencies (
  record_id UUID NOT NULL REFERENCES matrix_records(id) ON DELETE CASCADE,
  dependency_id UUID NOT NULL REFERENCES catalog_dependencies(id) ON DELETE CASCADE,
  PRIMARY KEY (record_id, dependency_id)
);

CREATE INDEX idx_matrix_records_dimension ON matrix_records(dimension_id);
CREATE INDEX idx_matrix_records_stage ON matrix_records(primary_stage_id);
CREATE INDEX idx_record_dependencies_dependency ON record_dependencies(dependency_id);

-- Seguridad: bloqueo total al rol anon; solo sesiones authenticated (PIN validado)
ALTER TABLE matrix_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read matrix_records" ON matrix_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read record_dependencies" ON record_dependencies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read catalog_action_types" ON catalog_action_types
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read catalog_modalities" ON catalog_modalities
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read catalog_dependencies" ON catalog_dependencies
  FOR SELECT TO authenticated USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE matrix_records;
ALTER PUBLICATION supabase_realtime ADD TABLE record_dependencies;
ALTER PUBLICATION supabase_realtime ADD TABLE catalog_action_types;
ALTER PUBLICATION supabase_realtime ADD TABLE catalog_modalities;
ALTER PUBLICATION supabase_realtime ADD TABLE catalog_dependencies;

-- Permisos: las tablas creadas por SQL no heredan acceso a service_role por defecto
GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;
