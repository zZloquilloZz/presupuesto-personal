-- ─────────────────────────────────────────────────────
-- SCHEMA — Presupuesto Personal
-- Ejecutar en Supabase SQL Editor
-- ─────────────────────────────────────────────────────

-- Habilitar Row Level Security en todas las tablas
-- Cada usuario solo ve SUS datos

-- ── GASTOS ───────────────────────────────────────────
create table gastos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  descripcion   text not null,
  categoria     text not null,
  monto         numeric(10,2) not null,
  metodo        text not null,
  fecha         date not null,
  notas         text,
  recurrente_origen uuid,
  mes_key       text,
  created_at    timestamptz default now()
);
alter table gastos enable row level security;
create policy "usuario ve sus gastos" on gastos
  for all using (auth.uid() = user_id);

-- ── GASTOS FIJOS ─────────────────────────────────────
create table gastos_fijos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  descripcion   text not null,
  monto         numeric(10,2) not null,
  dia           int not null,
  created_at    timestamptz default now()
);
alter table gastos_fijos enable row level security;
create policy "usuario ve sus fijos" on gastos_fijos
  for all using (auth.uid() = user_id);

-- ── GASTOS RECURRENTES ───────────────────────────────
create table gastos_recurrentes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  descripcion   text not null,
  categoria     text not null,
  monto         numeric(10,2) not null,
  metodo        text not null,
  notas         text,
  created_at    timestamptz default now()
);
alter table gastos_recurrentes enable row level security;
create policy "usuario ve sus recurrentes" on gastos_recurrentes
  for all using (auth.uid() = user_id);

-- ── HISTORIAL INGRESOS ───────────────────────────────
create table historial_ingresos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  mes_idx       int not null,
  anio          int not null,
  haber_basico  numeric(10,2) not null,
  he25          numeric(6,2) default 0,
  he100         numeric(6,2) default 0,
  gratificacion numeric(10,2) default 0,
  cts           numeric(10,2) default 0,
  bono          numeric(10,2) default 0,
  otro_extra    numeric(10,2) default 0,
  otro_label    text,
  bruto         numeric(10,2) not null,
  afp           numeric(10,2) not null,
  neto          numeric(10,2) not null,
  created_at    timestamptz default now(),
  unique (user_id, mes_idx, anio)  -- un registro por mes/año por usuario
);
alter table historial_ingresos enable row level security;
create policy "usuario ve sus ingresos" on historial_ingresos
  for all using (auth.uid() = user_id);

-- ── PRESUPUESTOS ─────────────────────────────────────
create table presupuestos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  categoria     text not null,
  monto         numeric(10,2) not null default 0,
  updated_at    timestamptz default now(),
  unique (user_id, categoria)
);
alter table presupuestos enable row level security;
create policy "usuario ve sus presupuestos" on presupuestos
  for all using (auth.uid() = user_id);

-- ── CUOTAS TARJETAS ──────────────────────────────────
create table cuotas_tarjetas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  tarjeta       text not null,  -- "bcp" | "amex"
  descripcion   text not null,
  monto_total   numeric(10,2) default 0,
  cuota         numeric(10,2) not null,
  total_cuotas  int not null,
  pagadas       int default 0,
  created_at    timestamptz default now()
);
alter table cuotas_tarjetas enable row level security;
create policy "usuario ve sus cuotas" on cuotas_tarjetas
  for all using (auth.uid() = user_id);

-- ── DEUDAS ───────────────────────────────────────────
create table deudas (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users not null,
  tipo             text not null,
  descripcion      text not null,
  acreedor         text,
  monto_original   numeric(10,2) default 0,
  cuota_mensual    numeric(10,2) not null,
  meses_pactados   int not null,
  pagos_realizados int default 0,
  dia_vencimiento  int,
  fecha_inicio     text,
  notas            text,
  created_at       timestamptz default now()
);
alter table deudas enable row level security;
create policy "usuario ve sus deudas" on deudas
  for all using (auth.uid() = user_id);

-- ── CONFIG ───────────────────────────────────────────
create table config (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users not null unique,
  haber_basico   numeric(10,2) default 1443,
  dia_deposito   int default 28,
  updated_at     timestamptz default now()
);
alter table config enable row level security;
create policy "usuario ve su config" on config
  for all using (auth.uid() = user_id);
