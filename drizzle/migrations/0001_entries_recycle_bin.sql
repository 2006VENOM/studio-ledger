CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE OR REPLACE FUNCTION public.entries_guard_restore()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL
     AND coalesce(current_setting('app.bin_ok', true), '') <> 'yes' THEN
    RAISE EXCEPTION 'Restoring requires the bin password';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER entries_guard_restore BEFORE UPDATE ON public.entries
FOR EACH ROW EXECUTE FUNCTION public.entries_guard_restore();

REVOKE DELETE ON public.entries FROM authenticated;

CREATE OR REPLACE FUNCTION public.bin_password_ok(_pw text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public, extensions AS $$
  SELECT encode(extensions.digest(coalesce(_pw,''), 'sha256'), 'hex') = 'b0f0a0e5ac9a5e6bd2b8f2ea0c5bdbb5fbc6f00a1a0de2a5fd1c4cd1b3a2c9f0'
$$;
REVOKE ALL ON FUNCTION public.bin_password_ok(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.restore_entries(_ids uuid[], _pw text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.bin_password_ok(_pw) THEN RAISE EXCEPTION 'Wrong password'; END IF;
  PERFORM set_config('app.bin_ok', 'yes', true);
  UPDATE public.entries SET deleted_at = NULL WHERE id = ANY(_ids) AND user_id = auth.uid() AND deleted_at IS NOT NULL;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.purge_entries(_ids uuid[], _pw text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.bin_password_ok(_pw) THEN RAISE EXCEPTION 'Wrong password'; END IF;
  DELETE FROM public.entries WHERE id = ANY(_ids) AND user_id = auth.uid() AND deleted_at IS NOT NULL;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.restore_entries(uuid[], text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.purge_entries(uuid[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_entries(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_entries(uuid[], text) TO authenticated;