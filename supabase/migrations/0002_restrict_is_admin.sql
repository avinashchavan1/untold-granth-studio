revoke execute on function public.is_admin() from anon, public;
grant execute on function public.is_admin() to authenticated;
comment on function public.is_admin() is 'True when the signed-in user''s email is in app_admins. Intentionally callable by signed-in users (reveals only their own admin status); used by RLS policies and by the app to show an access message.';
