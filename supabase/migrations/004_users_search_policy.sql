-- Allow any authenticated user to search the users table.
-- Without this, the friend search returns nothing for non-friends,
-- making it impossible to send a friend request.
create policy "users_authenticated_search"
  on public.users
  for select
  using (auth.role() = 'authenticated');
