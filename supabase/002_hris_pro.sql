
-- MoonHR HRIS PRO migration
-- IMPORTANT: this migration does not alter the existing karyawan.id or absensi date/time column types.
-- It adds optional HRIS fields and new modules using text employee IDs where schema compatibility matters.

create extension if not exists pgcrypto;

alter table public.karyawan add column if not exists role text default 'karyawan';
alter table public.karyawan add column if not exists status_aktif boolean default true;
alter table public.karyawan add column if not exists departemen text;
alter table public.karyawan add column if not exists tanggal_masuk date;
alter table public.karyawan add column if not exists status_karyawan text default 'Tetap';

create index if not exists idx_karyawan_nama on public.karyawan(nama);
create index if not exists idx_karyawan_id_karyawan on public.karyawan(id_karyawan);
create index if not exists idx_karyawan_departemen on public.karyawan(departemen);

alter table public.absensi add column if not exists latitude numeric(10,7);
alter table public.absensi add column if not exists longitude numeric(10,7);
alter table public.absensi add column if not exists lokasi_masuk text;
alter table public.absensi add column if not exists lokasi_pulang text;
alter table public.absensi add column if not exists selfie_masuk text;
alter table public.absensi add column if not exists selfie_pulang text;
alter table public.absensi add column if not exists keterlambatan_menit integer default 0;
alter table public.absensi add column if not exists lembur_menit integer default 0;
alter table public.absensi add column if not exists keterangan text;

create index if not exists idx_absensi_tanggal on public.absensi(tanggal);
create index if not exists idx_absensi_id_karyawan on public.absensi(id_karyawan);

create table if not exists public.hris_departemen (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  kode text unique,
  kepala_departemen text,
  status text not null default 'Aktif',
  created_at timestamptz not null default now()
);

create table if not exists public.hris_shift (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  jam_masuk time,
  jam_pulang time,
  istirahat_menit integer default 60,
  toleransi_menit integer default 10,
  status text not null default 'Aktif',
  created_at timestamptz not null default now()
);

create table if not exists public.hris_jadwal (
  id uuid primary key default gen_random_uuid(),
  id_karyawan text not null,
  tanggal date not null,
  shift_id uuid references public.hris_shift(id) on delete set null,
  status text not null default 'Terjadwal',
  catatan text,
  created_at timestamptz not null default now(),
  unique(id_karyawan,tanggal)
);

create table if not exists public.hris_hari_libur (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null unique,
  nama text not null,
  tipe text not null default 'Nasional',
  created_at timestamptz not null default now()
);

create table if not exists public.hris_cuti (
  id uuid primary key default gen_random_uuid(),
  id_karyawan text not null,
  jenis text not null,
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  jumlah_hari numeric(5,2) not null default 1,
  alasan text,
  status text not null default 'Menunggu',
  disetujui_oleh text,
  created_at timestamptz not null default now()
);

create table if not exists public.hris_saldo_cuti (
  id uuid primary key default gen_random_uuid(),
  id_karyawan text not null,
  tahun integer not null,
  jenis text not null default 'Tahunan',
  saldo numeric(5,2) not null default 12,
  terpakai numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(id_karyawan,tahun,jenis)
);

create table if not exists public.hris_kpi (
  id uuid primary key default gen_random_uuid(),
  id_karyawan text not null,
  periode text not null,
  indikator text not null,
  target numeric,
  realisasi numeric,
  bobot numeric default 0,
  skor numeric default 0,
  status text default 'Draft',
  created_at timestamptz not null default now()
);

create table if not exists public.hris_kandidat (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  email text,
  no_telp text,
  posisi text,
  sumber text,
  tahap text default 'Screening',
  status text default 'Aktif',
  catatan text,
  created_at timestamptz not null default now()
);

create table if not exists public.hris_payroll (
  id uuid primary key default gen_random_uuid(),
  id_karyawan text not null,
  periode text not null,
  gaji_pokok numeric(14,2) default 0,
  tunjangan numeric(14,2) default 0,
  uang_makan numeric(14,2) default 0,
  transport numeric(14,2) default 0,
  lembur numeric(14,2) default 0,
  bonus numeric(14,2) default 0,
  potongan numeric(14,2) default 0,
  bpjs numeric(14,2) default 0,
  pph21 numeric(14,2) default 0,
  total_pendapatan numeric(14,2) generated always as
    (gaji_pokok + tunjangan + uang_makan + transport + lembur + bonus) stored,
  total_potongan numeric(14,2) generated always as
    (potongan + bpjs + pph21) stored,
  gaji_bersih numeric(14,2) generated always as
    (gaji_pokok + tunjangan + uang_makan + transport + lembur + bonus - potongan - bpjs - pph21) stored,
  status text default 'Draft',
  tanggal_proses timestamptz,
  tanggal_bayar date,
  created_at timestamptz not null default now(),
  unique(id_karyawan,periode)
);

create table if not exists public.hris_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_email text,
  action text not null,
  module text,
  record_id text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hris_company_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text not null default 'Moonjustfine by Tirta',
  work_start time default '07:00',
  work_end time default '16:00',
  break_minutes integer default 60,
  payday_day text default 'Jumat',
  currency text default 'IDR',
  timezone text default 'Asia/Jakarta',
  created_at timestamptz not null default now()
);

create index if not exists idx_hris_jadwal_tanggal on public.hris_jadwal(tanggal);
create index if not exists idx_hris_cuti_karyawan on public.hris_cuti(id_karyawan);
create index if not exists idx_hris_payroll_periode on public.hris_payroll(periode);
create index if not exists idx_hris_kpi_karyawan on public.hris_kpi(id_karyawan);

-- Enable RLS. Policies are intentionally limited to authenticated users;
-- tighten by role after your Supabase Auth roles are configured.
alter table public.hris_departemen enable row level security;
alter table public.hris_shift enable row level security;
alter table public.hris_jadwal enable row level security;
alter table public.hris_hari_libur enable row level security;
alter table public.hris_cuti enable row level security;
alter table public.hris_saldo_cuti enable row level security;
alter table public.hris_kpi enable row level security;
alter table public.hris_kandidat enable row level security;
alter table public.hris_payroll enable row level security;
alter table public.hris_audit_logs enable row level security;
alter table public.hris_company_settings enable row level security;

do $$ begin
  create policy "authenticated hris_departemen" on public.hris_departemen for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated hris_shift" on public.hris_shift for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated hris_jadwal" on public.hris_jadwal for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated hris_hari_libur" on public.hris_hari_libur for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated hris_cuti" on public.hris_cuti for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated hris_saldo_cuti" on public.hris_saldo_cuti for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated hris_kpi" on public.hris_kpi for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated hris_kandidat" on public.hris_kandidat for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated hris_payroll" on public.hris_payroll for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated hris_audit_logs" on public.hris_audit_logs for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated hris_company_settings" on public.hris_company_settings for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

insert into public.hris_company_settings(company_name)
select 'Moonjustfine by Tirta'
where not exists (select 1 from public.hris_company_settings);
