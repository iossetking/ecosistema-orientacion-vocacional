-- Migration: add "Datos" (datos) field to dimension 4 records
CREATE TYPE record_datos AS ENUM (
  'se_generan',
  'se_requieren'
);

ALTER TABLE matrix_records ADD COLUMN datos record_datos;
UPDATE matrix_records SET datos = 'se_generan' WHERE dimension_id = 4;
UPDATE matrix_records SET datos = NULL WHERE dimension_id <> 4;
ALTER TABLE matrix_records ALTER COLUMN datos DROP NOT NULL;
