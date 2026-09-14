-- MoonHR / Moonjustfine HRIS - safe upgrade migration
-- Tidak mengubah tipe kolom lama pada karyawan/absensi.
-- Jalankan di Supabase SQL Editor setelah backup.

alter table public.karyawan add column if not exists role text not null default 'employee';
alter table public.karyawan add column if not exists status_aktif boolean not null default true;
alter table public.karyawan add column if not exists departemen text;
alter table public.karyawan add column if not exists tanggal_masuk date;
alter table public.karyawan add column if not exists status_karyawan text default 'Tetap';

create index if not exists idx_karyawan_nama on public.karyawan(nama);
create index if not exists idx_karyawan_id_karyawan on public.karyawan(id_karyawan);
create index if not exists idx_absensi_tanggal on public.absensi(tanggal);
create index if not exists idx_absensi_karyawan on public.absensi(karyawan_id);

-- Kolom tambahan absensi dibuat tanpa mengubah kolom yang sudah dipakai Portal Karyawan.
alter table public.absensi add column if not exists latitude numeric;
alter table public.absensi add column if not exists longitude numeric;
alter table public.absensi add column if not exists lokasi_masuk text;
alter table public.absensi add column if not exists lokasi_pulang text;
alter table public.absensi add column if not exists selfie_masuk text;
alter table public.absensi add column if not exists selfie_pulang text;
alter table public.absensi add column if not exists keterlambatan_menit integer not null default 0;
alter table public.absensi add column if not exists lembur_menit integer not null default 0;
alter table public.absensi add column if not exists keterangan text;

create table if not exists public.payroll (
  id uuid primary key default gen_random_uuid(),
  id_karyawan text not null,
  periode date not null,
  gaji_pokok numeric(14,2) not null default 0,
  tunjangan numeric(14,2) not null default 0,
  uang_makan numeric(14,2) not null default 0,
  transport numeric(14,2) not null default 0,
  lembur numeric(14,2) not null default 0,
  bonus numeric(14,2) not null default 0,
  potongan numeric(14,2) not null default 0,
  bpjs numeric(14,2) not null default 0,
  pph21 numeric(14,2) not null default 0,
  total_pendapatan numeric(14,2) generated always as
    (gaji_pokok + tunjangan + uang_makan + transport + lembur + bonus) stored,
  total_potongan numeric(14,2) generated always as
    (potongan + bpjs + pph21) stored,
  gaji_bersih numeric(14,2) generated always as
    ((gaji_pokok + tunjangan + uang_makan + transport + lembur + bonus) - (potongan + bpjs + pph21)) stored,
  status text not null default 'draft' check (status in ('draft','diproses','dibayar')),
  tanggal_bayar date,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id_karyawan, periode)
);

create index if not exists idx_payroll_periode on public.payroll(periode);
create index if not exists idx_payroll_karyawan on public.payroll(id_karyawan);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id text,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- Pengaturan perusahaan. Satu baris dapat dipakai sebagai konfigurasi utama.
create table if not exists public.company_settings (
  id integer primary key default 1 check (id = 1),
  company_name text not null default 'Moonjustfine by Tirta',
  company_email text,
  company_phone text,
  company_address text,
  payroll_day text default 'Jumat',
  work_hours numeric(4,2) default 8,
  updated_at timestamptz not null default now()
);

insert into public.company_settings (id)
values (1)
on conflict (id) do nothing;

-- RLS sengaja tidak dipaksakan di sini agar tidak memutus aplikasi lama.
-- Setelah Supabase Auth + role/RLS sudah siap, aktifkan RLS dan buat policy
-- berdasarkan auth.uid() serta role pengguna.
