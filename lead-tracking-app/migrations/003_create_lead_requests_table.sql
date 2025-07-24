-- 003_create_lead_requests_table.sql
-- Create lead_requests table
create table if not exists public.lead_requests (
  id serial primary key,
  user_id uuid references public.users(id) on delete set null,
  request_type_id integer references public.request_types(id) on delete set null,
  form_data jsonb not null,
  status text not null default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists lead_requests_user_id_idx on public.lead_requests(user_id);
create index if not exists lead_requests_request_type_id_idx on public.lead_requests(request_type_id); 