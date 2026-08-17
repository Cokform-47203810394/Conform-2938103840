-- Trigger functions must not be callable through the public PostgREST RPC surface.
revoke all on function public.enforce_cokform_pilot_limits() from public, anon, authenticated;
revoke all on function public.trim_cokform_form_versions() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
