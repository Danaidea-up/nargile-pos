-- Nargile POS V6 Ultimate Enterprise Supabase Setup
create table if not exists branches (id bigint primary key, name text not null);
create table if not exists profiles (
  id uuid primary key,
  email text,
  username text,
  full_name text,
  role text default 'cashier',
  branch_id bigint default 1,
  created_at timestamp default now()
);
create table if not exists products (id bigint generated always as identity primary key, branch_id bigint, name text not null, barcode text, category text, unit_type text default 'piece', cost_price numeric default 0, sale_price numeric default 0, stock numeric default 0, low_stock numeric default 5, image_url text, created_at timestamp default now());
create table if not exists customers (id bigint generated always as identity primary key, branch_id bigint, name text not null, phone text, debt numeric default 0, created_at timestamp default now());
create table if not exists sales (id bigint generated always as identity primary key, branch_id bigint, customer_id bigint, total numeric default 0, payment_method text default 'cash', user_id text, created_at timestamp default now());
create table if not exists sale_items (id bigint generated always as identity primary key, branch_id bigint, sale_id bigint, product_id bigint, product_name text, quantity numeric default 1, unit_price numeric default 0, cost_price numeric default 0, total numeric default 0, created_at timestamp default now());
create table if not exists expenses (id bigint generated always as identity primary key, branch_id bigint, title text, amount numeric default 0, created_at timestamp default now());
create table if not exists suppliers (id bigint generated always as identity primary key, branch_id bigint, name text, phone text, created_at timestamp default now());
create table if not exists purchases (id bigint generated always as identity primary key, branch_id bigint, supplier_id bigint, title text, amount numeric default 0, created_at timestamp default now());
create table if not exists stock_transfers (id bigint generated always as identity primary key, branch_id bigint, from_branch bigint, to_branch bigint, product_id bigint, product_name text, quantity numeric default 0, status text default 'pending', created_at timestamp default now());
create table if not exists employees (id bigint generated always as identity primary key, branch_id bigint, name text, role text, created_at timestamp default now());
create table if not exists attendance (id bigint generated always as identity primary key, branch_id bigint, user_id text, employee_name text, type text, created_at timestamp default now());
create table if not exists cash_drawers (id bigint generated always as identity primary key, branch_id bigint, user_id text, opening_cash numeric default 0, closing_cash numeric default 0, status text default 'open', opened_at timestamp default now(), closed_at timestamp);
create table if not exists reservations (id bigint generated always as identity primary key, branch_id bigint, table_no text, customer_name text, reserved_at timestamp, status text default 'reserved', created_at timestamp default now());
create table if not exists activity_logs (id bigint generated always as identity primary key, branch_id bigint, user_id text, action text, details text, created_at timestamp default now());

insert into branches (id,name) values (1,'Branch 1'),(2,'Branch 2') on conflict (id) do update set name=excluded.name;

alter table branches enable row level security;
alter table profiles enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table expenses enable row level security;
alter table suppliers enable row level security;
alter table purchases enable row level security;
alter table stock_transfers enable row level security;
alter table employees enable row level security;
alter table attendance enable row level security;
alter table cash_drawers enable row level security;
alter table reservations enable row level security;
alter table activity_logs enable row level security;

drop policy if exists "allow_all_branches" on branches;
drop policy if exists "allow_all_profiles" on profiles;
drop policy if exists "allow_all_products" on products;
drop policy if exists "allow_all_customers" on customers;
drop policy if exists "allow_all_sales" on sales;
drop policy if exists "allow_all_sale_items" on sale_items;
drop policy if exists "allow_all_expenses" on expenses;
drop policy if exists "allow_all_suppliers" on suppliers;
drop policy if exists "allow_all_purchases" on purchases;
drop policy if exists "allow_all_stock_transfers" on stock_transfers;
drop policy if exists "allow_all_employees" on employees;
drop policy if exists "allow_all_attendance" on attendance;
drop policy if exists "allow_all_cash_drawers" on cash_drawers;
drop policy if exists "allow_all_reservations" on reservations;
drop policy if exists "allow_all_activity_logs" on activity_logs;

create policy "allow_all_branches" on branches for all using (true) with check (true);
create policy "allow_all_profiles" on profiles for all using (true) with check (true);
create policy "allow_all_products" on products for all using (true) with check (true);
create policy "allow_all_customers" on customers for all using (true) with check (true);
create policy "allow_all_sales" on sales for all using (true) with check (true);
create policy "allow_all_sale_items" on sale_items for all using (true) with check (true);
create policy "allow_all_expenses" on expenses for all using (true) with check (true);
create policy "allow_all_suppliers" on suppliers for all using (true) with check (true);
create policy "allow_all_purchases" on purchases for all using (true) with check (true);
create policy "allow_all_stock_transfers" on stock_transfers for all using (true) with check (true);
create policy "allow_all_employees" on employees for all using (true) with check (true);
create policy "allow_all_attendance" on attendance for all using (true) with check (true);
create policy "allow_all_cash_drawers" on cash_drawers for all using (true) with check (true);
create policy "allow_all_reservations" on reservations for all using (true) with check (true);
create policy "allow_all_activity_logs" on activity_logs for all using (true) with check (true);

-- For cloud image upload:
-- Go to Supabase Storage and create a public bucket named: pos-images


-- REAL AUTH SETUP NOTE
-- 1) Go to Supabase → Authentication → Users → Add user
-- 2) Email: zana@nargile.local
-- 3) Password: use the password you chose for the admin account
-- 4) After first login, profile will be created automatically as admin if username is zana.
-- 5) You can later edit profiles table to set roles: admin, manager, cashier, warehouse.
