-- Fix course deletion: progress + certificates must cascade when a course is deleted.
-- The DB currently has ON DELETE NO ACTION on both FKs, which makes DELETE FROM courses fail
-- whenever the course has any progress or certificate rows.

ALTER TABLE hashibasha_org.course_progress
  DROP CONSTRAINT IF EXISTS "FK_<progress_course>";

DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE ns.nspname = 'hashibasha_org'
      AND rel.relname = 'course_progress'
      AND con.contype = 'f'
      AND att.attname = 'course_id'
  LOOP
    EXECUTE format('ALTER TABLE hashibasha_org.course_progress DROP CONSTRAINT %I', cname);
  END LOOP;
END $$;

ALTER TABLE hashibasha_org.course_progress
  ADD CONSTRAINT course_progress_course_id_fk
  FOREIGN KEY (course_id) REFERENCES hashibasha_org.courses(id) ON DELETE CASCADE;

DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE ns.nspname = 'hashibasha_org'
      AND rel.relname = 'course_certificates'
      AND con.contype = 'f'
      AND att.attname = 'course_id'
  LOOP
    EXECUTE format('ALTER TABLE hashibasha_org.course_certificates DROP CONSTRAINT %I', cname);
  END LOOP;
END $$;

ALTER TABLE hashibasha_org.course_certificates
  ADD CONSTRAINT course_certificates_course_id_fk
  FOREIGN KEY (course_id) REFERENCES hashibasha_org.courses(id) ON DELETE CASCADE;

-- Create the course-content storage bucket (public) if it does not exist yet.
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id)
VALUES ('course-content', 'course-content', true, false, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET public = true;
