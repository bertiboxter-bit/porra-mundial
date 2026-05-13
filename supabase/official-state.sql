-- Resultados oficiales (una fila) + políticas lectura/escritura pública (ajusta RLS en producción).
-- Ejecutar en Supabase → SQL Editor.

CREATE TABLE IF NOT EXISTS official_state (
  id text PRIMARY KEY DEFAULT 'default',
  predictions jsonb NOT NULL DEFAULT '{}'::jsonb,
  knockout jsonb NOT NULL DEFAULT '{}'::jsonb,
  specials jsonb NOT NULL DEFAULT '{}'::jsonb,
  predictions_locked boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO official_state (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

ALTER TABLE official_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "official_state_select" ON official_state;
DROP POLICY IF EXISTS "official_state_insert" ON official_state;
DROP POLICY IF EXISTS "official_state_update" ON official_state;

CREATE POLICY "official_state_select" ON official_state FOR SELECT USING (true);
CREATE POLICY "official_state_insert" ON official_state FOR INSERT WITH CHECK (true);
CREATE POLICY "official_state_update" ON official_state FOR UPDATE USING (true);

-- Recálculo: la app hace UPDATE de `points` en todas las filas de `predictions` con la clave anon.
-- Si RLS en `predictions` lo impide, amplía políticas o usa una Edge Function con service_role.
