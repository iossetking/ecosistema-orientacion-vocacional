-- Migration: make "Estado del registro" (status) nullable and only applicable to dimension 3
ALTER TABLE matrix_records ALTER COLUMN status DROP NOT NULL;
ALTER TABLE matrix_records ALTER COLUMN status DROP DEFAULT;
UPDATE matrix_records SET status = NULL WHERE dimension_id <> 3;
