-- Run this in Supabase SQL Editor for this demo POS app.
-- It creates the 2 branches and lets the publishable key read/write app data.
-- For a real production POS, replace these open policies with authenticated user/role policies.

insert into branches (id, name) values (1, 'لقی ١'), (2, 'لقی ٢')
on conflict (id) do update set name = excluded.name;

alter table branches enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table expenses enable row level security;

drop policy if exists "public branches access" on branches;
drop policy if exists "public products access" on products;
drop policy if exists "public customers access" on customers;
drop policy if exists "public sales access" on sales;
drop policy if exists "public expenses access" on expenses;

create policy "public branches access" on branches for all using (true) with check (true);
create policy "public products access" on products for all using (true) with check (true);
create policy "public customers access" on customers for all using (true) with check (true);
create policy "public sales access" on sales for all using (true) with check (true);
create policy "public expenses access" on expenses for all using (true) with check (true);
