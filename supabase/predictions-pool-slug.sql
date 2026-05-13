-- =============================================================================
-- FUTURO: porras separadas (pool_slug + UNIQUE pool_slug, nickname).
-- No ejecutes esto hasta activar la funcionalidad en la app (ver src/poolsConfig.js).
-- Descomenta el bloque inferior cuando toque.
-- =============================================================================

/*
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS pool_slug text;

UPDATE predictions
SET pool_slug = 'default'
WHERE pool_slug IS NULL OR trim(pool_slug) = '';

ALTER TABLE predictions
  ALTER COLUMN pool_slug SET DEFAULT 'default';

ALTER TABLE predictions
  ALTER COLUMN pool_slug SET NOT NULL;

ALTER TABLE predictions
  DROP CONSTRAINT IF EXISTS predictions_nickname_key;

DROP INDEX IF EXISTS predictions_nickname_unique;

ALTER TABLE predictions
  ADD CONSTRAINT predictions_pool_slug_nickname_key UNIQUE (pool_slug, nickname);
*/
