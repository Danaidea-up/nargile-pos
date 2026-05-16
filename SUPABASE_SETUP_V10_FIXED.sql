-- Nargile POS V10 Fixed Auto Employee Auth
create table if not exists profiles (
  id uuid primary key,
  email text,
  username text,
  full_name text,
  role text default 'cashier',
  branch_id bigint default 1,
  created_at timestamp default now()
);

create table if not exists employees (
  id bigint generated always as identity primary key,
  branch_id bigint default 1,
  name text not null,
  email text,
  role text default 'cashier',
  created_at timestamp default now()
);

alter table profiles enable row level security;
alter table employees enable row level security;

drop policy if exists "allow_all_profiles" on profiles;
drop policy if exists "allow_all_employees" on employees;

create policy "allow_all_profiles"
on profiles for all
using (true)
with check (true);

create policy "allow_all_employees"
on employees for all
using (true)
with check (true);
