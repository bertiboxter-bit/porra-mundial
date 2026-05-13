-- =============================================================================
-- Usuario privado (username) + nombre en clasificación (display_name)
-- Ejecutar en el SQL Editor de tu proveedor de base de datos.
-- Sustituye la unicidad por nickname: la fila se identifica por username (único).
-- =============================================================================
--
-- Antes: UNIQUE(nickname). Después: UNIQUE(username). nickname puede repetirse;
-- la app envía nickname = display_name por compatibilidad con datos antiguos.
-- =============================================================================

ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS username text;

ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS display_name text;

-- Rellenar desde nickname existente
UPDATE predictions
SET
  display_name = CASE
    WHEN trim(coalesce(display_name, '')) <> '' THEN trim(display_name)
    ELSE trim(nickname)
  END,
  username = lower(regexp_replace(trim(nickname), '[^a-zA-Z0-9_]+', '_', 'g'))
WHERE coalesce(trim(username), '') = '';

UPDATE predictions
SET username = 'jugador_' || seq.n::text
FROM (
  SELECT ctid, row_number() OVER () AS n
  FROM predictions
  WHERE trim(coalesce(username, '')) = ''
) seq
WHERE predictions.ctid = seq.ctid;

-- Desambiguar usernames duplicados tras la normalización
WITH ranked AS (
  SELECT
    ctid,
    username,
    row_number() OVER (
      PARTITION BY username ORDER BY coalesce(updated_at, now()) ASC
    ) AS rn
  FROM predictions
)
UPDATE predictions p
SET username = p.username || '_' || ranked.rn::text
FROM ranked
WHERE p.ctid = ranked.ctid
  AND ranked.rn > 1;

ALTER TABLE predictions
  ALTER COLUMN username SET NOT NULL;

ALTER TABLE predictions
  ALTER COLUMN display_name SET NOT NULL;

ALTER TABLE predictions
  DROP CONSTRAINT IF EXISTS predictions_nickname_key;

DROP INDEX IF EXISTS predictions_nickname_unique;

ALTER TABLE predictions
  DROP CONSTRAINT IF EXISTS predictions_username_key;

ALTER TABLE predictions
  ADD CONSTRAINT predictions_username_key UNIQUE (username);

-- Mantener nickname alineado con el nombre público (opcional, por compatibilidad)
UPDATE predictions
SET nickname = display_name
WHERE nickname IS DISTINCT FROM display_name;
