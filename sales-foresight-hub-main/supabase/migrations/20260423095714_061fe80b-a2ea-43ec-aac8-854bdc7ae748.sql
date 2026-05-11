
-- Roles enum + table
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  company text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sku text,
  category text,
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sale_date date not null,
  units_sold integer not null default 0,
  revenue numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
create index sales_product_date_idx on public.sales(product_id, sale_date);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  horizon_days integer not null,
  model text not null default 'linear_regression',
  output jsonb not null,
  created_at timestamptz not null default now()
);

-- has_role security definer function
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- new user trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.predictions enable row level security;

-- profiles policies
create policy "profiles select own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles update own" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "admins select all profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- user_roles policies (read-only to user; admins manage)
create policy "user_roles select own" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- products policies
create policy "products select own" on public.products for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "products insert own" on public.products for insert to authenticated with check (auth.uid() = user_id);
create policy "products update own" on public.products for update to authenticated using (auth.uid() = user_id);
create policy "products delete own" on public.products for delete to authenticated using (auth.uid() = user_id);

-- sales policies
create policy "sales select own" on public.sales for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "sales insert own" on public.sales for insert to authenticated with check (auth.uid() = user_id);
create policy "sales update own" on public.sales for update to authenticated using (auth.uid() = user_id);
create policy "sales delete own" on public.sales for delete to authenticated using (auth.uid() = user_id);

-- predictions policies
create policy "predictions select own" on public.predictions for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "predictions insert own" on public.predictions for insert to authenticated with check (auth.uid() = user_id);
create policy "predictions delete own" on public.predictions for delete to authenticated using (auth.uid() = user_id);
