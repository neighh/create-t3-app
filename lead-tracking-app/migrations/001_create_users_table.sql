-- 001_create_users_table.sql
-- Create users table
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'icl_owner',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists users_email_idx on public.users(email);

-- Function to sync new auth users to users table
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new auth.users
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user(); 