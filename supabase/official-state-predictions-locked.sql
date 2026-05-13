-- Bloqueo global de edición de porras (columna en official_state).
-- Ejecutar en el SQL Editor si ya creaste official_state con el script anterior.

ALTER TABLE official_state
  ADD COLUMN IF NOT EXISTS predictions_locked boolean NOT NULL DEFAULT false;
