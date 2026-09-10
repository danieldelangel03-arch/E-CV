-- El ON DELETE SET NULL de profile_versions.created_by es una limpieza de
-- referencia, no una edición del snapshot. Debe poder ejecutarse al eliminar
-- una cuenta sin debilitar la inmutabilidad del contenido.
CREATE OR REPLACE FUNCTION eprofile_prevent_version_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.created_by IS NULL
    AND OLD.created_by IS NOT NULL
    AND NEW.id IS NOT DISTINCT FROM OLD.id
    AND NEW.profile_id IS NOT DISTINCT FROM OLD.profile_id
    AND NEW.sequence IS NOT DISTINCT FROM OLD.sequence
    AND NEW.kind IS NOT DISTINCT FROM OLD.kind
    AND NEW.content IS NOT DISTINCT FROM OLD.content
    AND NEW.content_hash IS NOT DISTINCT FROM OLD.content_hash
    AND NEW.source_version_id IS NOT DISTINCT FROM OLD.source_version_id
    AND NEW.published_at IS NOT DISTINCT FROM OLD.published_at
    AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Profile versions are immutable snapshots';
END;
$$ LANGUAGE plpgsql;
