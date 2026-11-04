INSERT INTO catalog_dependencies (name, code, sort_order) VALUES
  ('SEMS', 'SEMS', 1),
  ('CGAI', 'CGAI', 2),
  ('CSE', 'CSE', 3),
  ('Centros Universitarios', 'CU', 4),
  ('Escuelas Preparatorias', 'PREPA', 5),
  ('Otros', 'OTROS', 6)
ON CONFLICT (name) DO NOTHING;

INSERT INTO catalog_action_types (name, sort_order) VALUES
  ('Test vocacionales', 1),
  ('Asesorías personalizadas', 2),
  ('Talleres o charlas', 3),
  ('Cursos o simuladores', 4),
  ('Ferias y exposiciones', 5),
  ('Otras', 6)
ON CONFLICT (name) DO NOTHING;

INSERT INTO catalog_modalities (name, sort_order) VALUES
  ('Presencial', 1),
  ('Virtual', 2),
  ('Híbrida', 3),
  ('Autogestiva', 4)
ON CONFLICT (name) DO NOTHING;
