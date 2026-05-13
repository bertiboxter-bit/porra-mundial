-- =============================================================================
-- SQL Editor: ejecuta DESPUÉS de revisar duplicados de nickname
-- (Proyecto nuevo: preferir predictions-username-display.sql — usuario + nombre público.)
-- =============================================================================
-- 1) Comprueba si ya hay el mismo nick en varias filas:
--    SELECT nickname, COUNT(*) AS n FROM predictions GROUP BY nickname HAVING COUNT(*) > 1;
--
-- 2) Si hay duplicados, borra o fusiona manualmente las filas que no quieras
--    conservar (deja una fila por nickname).
--
-- 3) Crea la restricción UNIQUE para que el upsert con onConflict funcione:
-- =============================================================================

ALTER TABLE predictions
  ADD CONSTRAINT predictions_nickname_key UNIQUE (nickname);

-- Si el nombre del constraint ya existe o falla, puedes usar solo:
-- CREATE UNIQUE INDEX IF NOT EXISTS predictions_nickname_unique ON predictions (nickname);
