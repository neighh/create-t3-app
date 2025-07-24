-- 004_create_lead_request_status_history_table.sql
-- Create lead_request_status_history table
create table if not exists public.lead_request_status_history (
  id serial primary key,
  lead_request_id integer references public.lead_requests(id) on delete cascade,
  status text not null,
  changed_by uuid references public.users(id) on delete set null,
  changed_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists status_history_lead_request_id_idx on public.lead_request_status_history(lead_request_id); 