CREATE OR REPLACE FUNCTION public.bin_password_ok(_pw text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public, extensions AS $$
  SELECT encode(extensions.digest(coalesce(_pw,''), 'sha256'), 'hex') = '16b21bacf57895f061e62396ad91a564a22f5b35bf3816704aac5d6ed2e1acad'
$$;
REVOKE ALL ON FUNCTION public.bin_password_ok(text) FROM PUBLIC, anon, authenticated;