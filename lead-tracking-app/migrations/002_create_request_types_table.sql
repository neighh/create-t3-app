-- 002_create_request_types_table.sql
-- Create request_types table
create table if not exists public.request_types (
  id serial primary key,
  name text not null unique,
  description text,
  fields jsonb not null default '[]', -- array of field definitions for dynamic forms
  created_at timestamp with time zone default timezone('utc'::text, now())
); 