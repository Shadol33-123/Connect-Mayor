-- Tabla para persistir último visto por conversación
-- Cada fila representa el último timestamp visto por un usuario respecto a otro usuario (pareja)
CREATE TABLE IF NOT EXISTS message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  other_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(viewer_id, other_id)
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION trg_message_reads_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_reads_updated_at ON message_reads;
CREATE TRIGGER message_reads_updated_at
BEFORE UPDATE ON message_reads
FOR EACH ROW EXECUTE FUNCTION trg_message_reads_updated_at();

-- Row Level Security
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Políticas: solo el usuario dueño de viewer_id puede ver y modificar su registro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='message_reads' AND policyname='select_own_message_reads'
  ) THEN
    CREATE POLICY select_own_message_reads ON message_reads
    FOR SELECT USING (auth.uid() = viewer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='message_reads' AND policyname='insert_own_message_reads'
  ) THEN
    CREATE POLICY insert_own_message_reads ON message_reads
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='message_reads' AND policyname='update_own_message_reads'
  ) THEN
    CREATE POLICY update_own_message_reads ON message_reads
    FOR UPDATE USING (auth.uid() = viewer_id);
  END IF;
END$$;

-- Index para consultas por viewer
CREATE INDEX IF NOT EXISTS idx_message_reads_viewer ON message_reads(viewer_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_pair ON message_reads(viewer_id, other_id);
