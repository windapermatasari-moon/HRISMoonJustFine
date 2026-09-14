import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

type Tab = 'cabang' | 'departemen' | 'jabatan' | 'shift' | 'jadwal';

type Cabang = {
  id: string;
  kode: string;
  nama: string;
  kota?: string;
  alamat?: string;
  status_aktif?: boolean;
};

type Departemen = {
  id: string;
  kode: string;
  nama: string;
  cabang_id?: string;
  kepala?: string;
  status_aktif?: boolean;
};

type Jabatan = {
  id: string;
  kode: string;
  nama: string;
  departemen_id?: string;
  level?: string;
  grade?: string;
  status_aktif?: boolean;
};

type Shift = {
  id: string;
  kode: string;
  nama: string;
  jam_masuk: string;
  jam_pulang: string;
  istirahat_menit: number;
  toleransi_menit: number;
  status_aktif?: boolean;
};

type Karyawan = {
  id: string;
  nama: string;
  id_karyawan?: string;
};

type Jadwal = {
  id: string;
  tanggal: string;
  karyawan_id: string;
  shift_id?: string;
  cabang_id?: string;
  status: string;
  catatan?: string;
};

const emptyCabang = {
  kode: '',
  nama: '',
  kota: '',
  alamat: '',
  status_aktif: true,
};

const emptyDepartemen = {
  kode: '',
  nama: '',
  cabang_id: '',
  kepala: '',
  status_aktif: true,
};

const emptyJabatan = {
  kode: '',
  nama: '',
  departemen_id: '',
  level: '',
  grade: '',
  status_aktif: true,
};

const emptyShift = {
  kode: '',
  nama: '',
  jam_masuk: '07:00',
  jam_pulang: '16:00',
  istirahat_menit: 60,
  toleransi_menit: 15,
  status_aktif: true,
};

const emptyJadwal = {
  tanggal: new Date().toISOString().slice(0, 10),
  karyawan_id: '',
  shift_id: '',
  cabang_id: '',
  status: 'Terjadwal',
  catatan: '',
};

export default function MasterData({
  initialTab = 'cabang',
}: {
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const tabs = [
    ['cabang', 'Cabang', '▦'],
    ['departemen', 'Departemen', '▤'],
    ['jabatan', 'Jabatan', '♙'],
    ['shift', 'Shift', '◫'],
    ['jadwal', 'Jadwal Kerja', '▤'],
  ] as const;

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MASTER DATA HR</div>
          <h1>
            {tabs.find(x => x[0] === tab)?.[1]}
          </h1>
          <p>
            Kelola cabang, departemen, jabatan, shift, dan jadwal kerja
            perusahaan.
          </p>
        </div>
      </div>

      <div className="branch-nav">
        {tabs.map(t => (
          <button
            key={t[0]}
            className={tab === t[0] ? 'active' : ''}
            onClick={() => setTab(t[0])}
          >
            <span>{t[2]}</span>
            {t[1]}
          </button>
        ))}
      </div>

      {message && (
        <div className="form-success" style={{ marginBottom: 16 }}>
          {message}
        </div>
      )}

      {tab === 'cabang' && (
        <CabangModule
          setLoading={setLoading}
          loading={loading}
          notify={setMessage}
        />
      )}

      {tab === 'departemen' && (
        <DepartemenModule
          setLoading={setLoading}
          loading={loading}
          notify={setMessage}
        />
      )}

      {tab === 'jabatan' && (
        <JabatanModule
          setLoading={setLoading}
          loading={loading}
          notify={setMessage}
        />
      )}

      {tab === 'shift' && (
        <ShiftModule
          setLoading={setLoading}
          loading={loading}
          notify={setMessage}
        />
      )}

      {tab === 'jadwal' && (
        <JadwalModule
          setLoading={setLoading}
          loading={loading}
          notify={setMessage}
        />
      )}
    </div>
  );
}

/* =========================================================
   CABANG
========================================================= */

function CabangModule({
  setLoading,
  loading,
  notify,
}: {
  setLoading: (v: boolean) => void;
  loading: boolean;
  notify: (v: string) => void;
}) {
  const [rows, setRows] = useState<Cabang[]>([]);
  const [form, setForm] = useState(emptyCabang);
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from('hris_cabang')
      .select('*')
      .order('nama');

    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    setForm(emptyCabang);
    setEditing(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!form.kode || !form.nama) {
      notify('Kode dan nama cabang wajib diisi.');
      return;
    }

    setLoading(true);

    const payload = {
      kode: form.kode.toUpperCase(),
      nama: form.nama,
      kota: form.kota || null,
      alamat: form.alamat || null,
      status_aktif: form.status_aktif,
    };

    const result = editing
      ? await supabase
          .from('hris_cabang')
          .update(payload)
          .eq('id', editing)
      : await supabase
          .from('hris_cabang')
          .insert(payload);

    setLoading(false);

    if (result.error) {
      notify(result.error.message);
      return;
    }

    notify(editing ? 'Cabang berhasil diperbarui.' : 'Cabang berhasil ditambahkan.');
    reset();
    load();
  }

  async function remove(id: string) {
    if (!confirm('Hapus cabang ini?')) return;

    const { error } = await supabase
      .from('hris_cabang')
      .delete()
      .eq('id', id);

    if (error) {
      notify(error.message);
      return;
    }

    notify('Cabang berhasil dihapus.');
    load();
  }

  return (
    <>
      <div className="content-grid">
        <div className="panel form-panel">
          <div className="panel-head">
            <div>
              <h2>{editing ? 'Edit Cabang' : 'Tambah Cabang'}</h2>
              <p>Data lokasi operasional perusahaan.</p>
            </div>
          </div>

          <form className="form-grid" onSubmit={save}>
            <label>
              Kode Cabang
              <input
                value={form.kode}
                onChange={e =>
                  setForm({ ...form, kode: e.target.value })
                }
                placeholder="JKT01"
                required
              />
            </label>

            <label>
              Nama Cabang
              <input
                value={form.nama}
                onChange={e =>
                  setForm({ ...form, nama: e.target.value })
                }
                placeholder="Cabang Jakarta"
                required
              />
            </label>

            <label>
              Kota
              <input
                value={form.kota}
                onChange={e =>
                  setForm({ ...form, kota: e.target.value })
                }
                placeholder="Jakarta"
              />
            </label>

            <label>
              Status
              <select
                value={form.status_aktif ? 'aktif' : 'nonaktif'}
                onChange={e =>
                  setForm({
                    ...form,
                    status_aktif: e.target.value === 'aktif',
                  })
                }
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </label>

            <label className="full-span">
              Alamat
              <textarea
                value={form.alamat}
                onChange={e =>
                  setForm({ ...form, alamat: e.target.value })
                }
                placeholder="Alamat lengkap cabang"
                rows={4}
              />
            </label>

            <div className="full-span form-actions">
              {editing && (
                <button
                  type="button"
                  className="secondary"
                  onClick={reset}
                >
                  Batal
                </button>
              )}

              <button className="primary" disabled={loading}>
                {loading
                  ? 'Menyimpan...'
                  : editing
                  ? 'Simpan Perubahan'
                  : 'Tambah Cabang'}
              </button>
            </div>
          </form>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Daftar Cabang</h2>
              <p>{rows.length} cabang terdaftar.</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama</th>
                  <th>Kota</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {rows.length ? (
                  rows.map(row => (
                    <tr key={row.id}>
                      <td><b>{row.kode}</b></td>
                      <td>{row.nama}</td>
                      <td>{row.kota || '-'}</td>
                      <td>
                        <span
                          className={`status ${
                            row.status_aktif === false
                              ? 'red'
                              : 'green'
                          }`}
                        >
                          {row.status_aktif === false
                            ? 'Nonaktif'
                            : 'Aktif'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="link-btn"
                          onClick={() => {
                            setEditing(row.id);
                            setForm({
                              kode: row.kode || '',
                              nama: row.nama || '',
                              kota: row.kota || '',
                              alamat: row.alamat || '',
                              status_aktif:
                                row.status_aktif !== false,
                            });
                          }}
                        >
                          Edit
                        </button>{' '}
                        <button
                          className="danger-text"
                          onClick={() => remove(row.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow cols={5} />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   DEPARTEMEN
========================================================= */

function DepartemenModule({
  setLoading,
  loading,
  notify,
}: {
  setLoading: (v: boolean) => void;
  loading: boolean;
  notify: (v: string) => void;
}) {
  const [rows, setRows] = useState<Departemen[]>([]);
  const [branches, setBranches] = useState<Cabang[]>([]);
  const [form, setForm] = useState(emptyDepartemen);
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    const [d, c] = await Promise.all([
      supabase.from('hris_departemen').select('*').order('nama'),
      supabase.from('hris_cabang').select('*').order('nama'),
    ]);

    setRows(d.data || []);
    setBranches(c.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    setForm(emptyDepartemen);
    setEditing(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!form.kode || !form.nama) {
      notify('Kode dan nama departemen wajib diisi.');
      return;
    }

    setLoading(true);

    const payload = {
      kode: form.kode.toUpperCase(),
      nama: form.nama,
      cabang_id: form.cabang_id || null,
      kepala: form.kepala || null,
      status_aktif: form.status_aktif,
    };

    const result = editing
      ? await supabase
          .from('hris_departemen')
          .update(payload)
          .eq('id', editing)
      : await supabase
          .from('hris_departemen')
          .insert(payload);

    setLoading(false);

    if (result.error) {
      notify(result.error.message);
      return;
    }

    notify(editing ? 'Departemen diperbarui.' : 'Departemen ditambahkan.');
    reset();
    load();
  }

  async function remove(id: string) {
    if (!confirm('Hapus departemen ini?')) return;

    const { error } = await supabase
      .from('hris_departemen')
      .delete()
      .eq('id', id);

    if (error) {
      notify(error.message);
      return;
    }

    notify('Departemen dihapus.');
    load();
  }

  return (
    <div className="content-grid">
      <div className="panel form-panel">
        <div className="panel-head">
          <div>
            <h2>{editing ? 'Edit Departemen' : 'Tambah Departemen'}</h2>
            <p>Atur struktur departemen perusahaan.</p>
          </div>
        </div>

        <form className="form-grid" onSubmit={save}>
          <label>
            Kode
            <input
              value={form.kode}
              onChange={e =>
                setForm({ ...form, kode: e.target.value })
              }
              placeholder="OPS"
              required
            />
          </label>

          <label>
            Nama Departemen
            <input
              value={form.nama}
              onChange={e =>
                setForm({ ...form, nama: e.target.value })
              }
              placeholder="Operations"
              required
            />
          </label>

          <label>
            Cabang
            <select
              value={form.cabang_id}
              onChange={e =>
                setForm({
                  ...form,
                  cabang_id: e.target.value,
                })
              }
            >
              <option value="">Semua / Tidak ditentukan</option>
              {branches.map(c => (
                <option key={c.id} value={c.id}>
                  {c.kode} - {c.nama}
                </option>
              ))}
            </select>
          </label>

          <label>
            Kepala Departemen
            <input
              value={form.kepala}
              onChange={e =>
                setForm({
                  ...form,
                  kepala: e.target.value,
                })
              }
              placeholder="Nama kepala departemen"
            />
          </label>

          <label>
            Status
            <select
              value={form.status_aktif ? 'aktif' : 'nonaktif'}
              onChange={e =>
                setForm({
                  ...form,
                  status_aktif: e.target.value === 'aktif',
                })
              }
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </label>

          <div className="full-span form-actions">
            {editing && (
              <button
                type="button"
                className="secondary"
                onClick={reset}
              >
                Batal
              </button>
            )}

            <button className="primary" disabled={loading}>
              {loading
                ? 'Menyimpan...'
                : editing
                ? 'Simpan Perubahan'
                : 'Tambah Departemen'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Daftar Departemen</h2>
            <p>{rows.length} departemen.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Departemen</th>
                <th>Cabang</th>
                <th>Kepala</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map(row => {
                  const branch = branches.find(
                    b => b.id === row.cabang_id
                  );

                  return (
                    <tr key={row.id}>
                      <td><b>{row.kode}</b></td>
                      <td>{row.nama}</td>
                      <td>{branch?.nama || '-'}</td>
                      <td>{row.kepala || '-'}</td>
                      <td>
                        <span className="status green">
                          {row.status_aktif === false
                            ? 'Nonaktif'
                            : 'Aktif'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="link-btn"
                          onClick={() => {
                            setEditing(row.id);
                            setForm({
                              kode: row.kode || '',
                              nama: row.nama || '',
                              cabang_id: row.cabang_id || '',
                              kepala: row.kepala || '',
                              status_aktif:
                                row.status_aktif !== false,
                            });
                          }}
                        >
                          Edit
                        </button>{' '}
                        <button
                          className="danger-text"
                          onClick={() => remove(row.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <EmptyRow cols={6} />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   JABATAN
========================================================= */

function JabatanModule({
  setLoading,
  loading,
  notify,
}: {
  setLoading: (v: boolean) => void;
  loading: boolean;
  notify: (v: string) => void;
}) {
  const [rows, setRows] = useState<Jabatan[]>([]);
  const [departments, setDepartments] = useState<Departemen[]>([]);
  const [form, setForm] = useState(emptyJabatan);
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    const [j, d] = await Promise.all([
      supabase.from('hris_jabatan').select('*').order('nama'),
      supabase.from('hris_departemen').select('*').order('nama'),
    ]);

    setRows(j.data || []);
    setDepartments(d.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    setForm(emptyJabatan);
    setEditing(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!form.kode || !form.nama) {
      notify('Kode dan nama jabatan wajib diisi.');
      return;
    }

    setLoading(true);

    const payload = {
      kode: form.kode.toUpperCase(),
      nama: form.nama,
      departemen_id: form.departemen_id || null,
      level: form.level || null,
      grade: form.grade || null,
      status_aktif: form.status_aktif,
    };

    const result = editing
      ? await supabase
          .from('hris_jabatan')
          .update(payload)
          .eq('id', editing)
      : await supabase
          .from('hris_jabatan')
          .insert(payload);

    setLoading(false);

    if (result.error) {
      notify(result.error.message);
      return;
    }

    notify(editing ? 'Jabatan diperbarui.' : 'Jabatan ditambahkan.');
    reset();
    load();
  }

  async function remove(id: string) {
    if (!confirm('Hapus jabatan ini?')) return;

    const { error } = await supabase
      .from('hris_jabatan')
      .delete()
      .eq('id', id);

    if (error) {
      notify(error.message);
      return;
    }

    notify('Jabatan dihapus.');
    load();
  }

  return (
    <div className="content-grid">
      <div className="panel form-panel">
        <div className="panel-head">
          <div>
            <h2>{editing ? 'Edit Jabatan' : 'Tambah Jabatan'}</h2>
            <p>Kelola posisi dan grade organisasi.</p>
          </div>
        </div>

        <form className="form-grid" onSubmit={save}>
          <label>
            Kode
            <input
              value={form.kode}
              onChange={e =>
                setForm({ ...form, kode: e.target.value })
              }
              placeholder="STF"
              required
            />
          </label>

          <label>
            Nama Jabatan
            <input
              value={form.nama}
              onChange={e =>
                setForm({ ...form, nama: e.target.value })
              }
              placeholder="Staff Warehouse"
              required
            />
          </label>

          <label>
            Departemen
            <select
              value={form.departemen_id}
              onChange={e =>
                setForm({
                  ...form,
                  departemen_id: e.target.value,
                })
              }
            >
              <option value="">Pilih Departemen</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.kode} - {d.nama}
                </option>
              ))}
            </select>
          </label>

          <label>
            Level
            <input
              value={form.level}
              onChange={e =>
                setForm({ ...form, level: e.target.value })
              }
              placeholder="Staff / Supervisor / Manager"
            />
          </label>

          <label>
            Grade
            <input
              value={form.grade}
              onChange={e =>
                setForm({ ...form, grade: e.target.value })
              }
              placeholder="G1"
            />
          </label>

          <label>
            Status
            <select
              value={form.status_aktif ? 'aktif' : 'nonaktif'}
              onChange={e =>
                setForm({
                  ...form,
                  status_aktif: e.target.value === 'aktif',
                })
              }
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </label>

          <div className="full-span form-actions">
            {editing && (
              <button
                type="button"
                className="secondary"
                onClick={reset}
              >
                Batal
              </button>
            )}

            <button className="primary" disabled={loading}>
              {loading
                ? 'Menyimpan...'
                : editing
                ? 'Simpan Perubahan'
                : 'Tambah Jabatan'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Daftar Jabatan</h2>
            <p>{rows.length} jabatan.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Jabatan</th>
                <th>Departemen</th>
                <th>Level</th>
                <th>Grade</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map(row => {
                  const department = departments.find(
                    d => d.id === row.departemen_id
                  );

                  return (
                    <tr key={row.id}>
                      <td><b>{row.kode}</b></td>
                      <td>{row.nama}</td>
                      <td>{department?.nama || '-'}</td>
                      <td>{row.level || '-'}</td>
                      <td>{row.grade || '-'}</td>
                      <td>
                        <button
                          className="link-btn"
                          onClick={() => {
                            setEditing(row.id);
                            setForm({
                              kode: row.kode || '',
                              nama: row.nama || '',
                              departemen_id:
                                row.departemen_id || '',
                              level: row.level || '',
                              grade: row.grade || '',
                              status_aktif:
                                row.status_aktif !== false,
                            });
                          }}
                        >
                          Edit
                        </button>{' '}
                        <button
                          className="danger-text"
                          onClick={() => remove(row.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <EmptyRow cols={6} />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SHIFT
========================================================= */

function ShiftModule({
  setLoading,
  loading,
  notify,
}: {
  setLoading: (v: boolean) => void;
  loading: boolean;
  notify: (v: string) => void;
}) {
  const [rows, setRows] = useState<Shift[]>([]);
  const [form, setForm] = useState(emptyShift);
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from('hris_shift')
      .select('*')
      .order('jam_masuk');

    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    setForm(emptyShift);
    setEditing(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!form.kode || !form.nama) {
      notify('Kode dan nama shift wajib diisi.');
      return;
    }

    setLoading(true);

    const payload = {
      kode: form.kode.toUpperCase(),
      nama: form.nama,
      jam_masuk: form.jam_masuk,
      jam_pulang: form.jam_pulang,
      istirahat_menit: Number(form.istirahat_menit),
      toleransi_menit: Number(form.toleransi_menit),
      status_aktif: form.status_aktif,
    };

    const result = editing
      ? await supabase
          .from('hris_shift')
          .update(payload)
          .eq('id', editing)
      : await supabase
          .from('hris_shift')
          .insert(payload);

    setLoading(false);

    if (result.error) {
      notify(result.error.message);
      return;
    }

    notify(editing ? 'Shift diperbarui.' : 'Shift berhasil ditambahkan.');
    reset();
    load();
  }

  async function remove(id: string) {
    if (!confirm('Hapus shift ini?')) return;

    const { error } = await supabase
      .from('hris_shift')
      .delete()
      .eq('id', id);

    if (error) {
      notify(error.message);
      return;
    }

    notify('Shift dihapus.');
    load();
  }

  return (
    <div className="content-grid">
      <div className="panel form-panel">
        <div className="panel-head">
          <div>
            <h2>{editing ? 'Edit Shift' : 'Tambah Shift'}</h2>
            <p>Atur jam masuk, pulang, istirahat dan toleransi.</p>
          </div>
        </div>

        <form className="form-grid" onSubmit={save}>
          <label>
            Kode Shift
            <input
              value={form.kode}
              onChange={e =>
                setForm({ ...form, kode: e.target.value })
              }
              placeholder="PAGI"
              required
            />
          </label>

          <label>
            Nama Shift
            <input
              value={form.nama}
              onChange={e =>
                setForm({ ...form, nama: e.target.value })
              }
              placeholder="Shift Pagi"
              required
            />
          </label>

          <label>
            Jam Masuk
            <input
              type="time"
              value={form.jam_masuk}
              onChange={e =>
                setForm({
                  ...form,
                  jam_masuk: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Jam Pulang
            <input
              type="time"
              value={form.jam_pulang}
              onChange={e =>
                setForm({
                  ...form,
                  jam_pulang: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Istirahat (menit)
            <input
              type="number"
              min="0"
              value={form.istirahat_menit}
              onChange={e =>
                setForm({
                  ...form,
                  istirahat_menit: Number(e.target.value),
                })
              }
            />
          </label>

          <label>
            Toleransi Terlambat (menit)
            <input
              type="number"
              min="0"
              value={form.toleransi_menit}
              onChange={e =>
                setForm({
                  ...form,
                  toleransi_menit: Number(e.target.value),
                })
              }
            />
          </label>

          <label>
            Status
            <select
              value={form.status_aktif ? 'aktif' : 'nonaktif'}
              onChange={e =>
                setForm({
                  ...form,
                  status_aktif: e.target.value === 'aktif',
                })
              }
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </label>

          <div className="full-span form-actions">
            {editing && (
              <button
                type="button"
                className="secondary"
                onClick={reset}
              >
                Batal
              </button>
            )}

            <button className="primary" disabled={loading}>
              {loading
                ? 'Menyimpan...'
                : editing
                ? 'Simpan Perubahan'
                : 'Tambah Shift'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Daftar Shift</h2>
            <p>{rows.length} shift tersedia.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Shift</th>
                <th>Masuk</th>
                <th>Pulang</th>
                <th>Istirahat</th>
                <th>Toleransi</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map(row => (
                  <tr key={row.id}>
                    <td><b>{row.kode}</b></td>
                    <td>{row.nama}</td>
                    <td>{row.jam_masuk}</td>
                    <td>{row.jam_pulang}</td>
                    <td>{row.istirahat_menit} menit</td>
                    <td>{row.toleransi_menit} menit</td>
                    <td>
                      <button
                        className="link-btn"
                        onClick={() => {
                          setEditing(row.id);
                          setForm({
                            kode: row.kode || '',
                            nama: row.nama || '',
                            jam_masuk:
                              row.jam_masuk || '07:00',
                            jam_pulang:
                              row.jam_pulang || '16:00',
                            istirahat_menit:
                              Number(row.istirahat_menit || 0),
                            toleransi_menit:
                              Number(row.toleransi_menit || 0),
                            status_aktif:
                              row.status_aktif !== false,
                          });
                        }}
                      >
                        Edit
                      </button>{' '}
                      <button
                        className="danger-text"
                        onClick={() => remove(row.id)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow cols={7} />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   JADWAL
========================================================= */

function JadwalModule({
  setLoading,
  loading,
  notify,
}: {
  setLoading: (v: boolean) => void;
  loading: boolean;
  notify: (v: string) => void;
}) {
  const [rows, setRows] = useState<Jadwal[]>([]);
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [branches, setBranches] = useState<Cabang[]>([]);
  const [form, setForm] = useState(emptyJadwal);
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    const [j, k, s, c] = await Promise.all([
      supabase
        .from('hris_jadwal')
        .select('*')
        .order('tanggal', { ascending: false })
        .limit(500),

      supabase
        .from('karyawan')
        .select('id,nama,id_karyawan')
        .order('nama'),

      supabase
        .from('hris_shift')
        .select('*')
        .eq('status_aktif', true)
        .order('jam_masuk'),

      supabase
        .from('hris_cabang')
        .select('*')
        .eq('status_aktif', true)
        .order('nama'),
    ]);

    setRows(j.data || []);
    setEmployees(k.data || []);
    setShifts(s.data || []);
    setBranches(c.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    setForm({
      ...emptyJadwal,
      tanggal: new Date().toISOString().slice(0, 10),
    });
    setEditing(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!form.tanggal || !form.karyawan_id) {
      notify('Tanggal dan karyawan wajib dipilih.');
      return;
    }

    setLoading(true);

    const payload = {
      tanggal: form.tanggal,
      karyawan_id: form.karyawan_id,
      shift_id: form.shift_id || null,
      cabang_id: form.cabang_id || null,
      status: form.status,
      catatan: form.catatan || null,
    };

    const result = editing
      ? await supabase
          .from('hris_jadwal')
          .update(payload)
          .eq('id', editing)
      : await supabase
          .from('hris_jadwal')
          .insert(payload);

    setLoading(false);

    if (result.error) {
      notify(result.error.message);
      return;
    }

    notify(editing ? 'Jadwal diperbarui.' : 'Jadwal berhasil dibuat.');
    reset();
    load();
  }

  async function remove(id: string) {
    if (!confirm('Hapus jadwal ini?')) return;

    const { error } = await supabase
      .from('hris_jadwal')
      .delete()
      .eq('id', id);

    if (error) {
      notify(error.message);
      return;
    }

    notify('Jadwal dihapus.');
    load();
  }

  function employeeName(id: string) {
    return (
      employees.find(e => e.id === id)?.nama || 'Karyawan'
    );
  }

  function shiftName(id?: string) {
    return (
      shifts.find(s => s.id === id)?.nama || '-'
    );
  }

  function branchName(id?: string) {
    return (
      branches.find(b => b.id === id)?.nama || '-'
    );
  }

  return (
    <div>
      <div className="panel form-panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div>
            <h2>
              {editing ? 'Edit Jadwal' : 'Buat Jadwal Kerja'}
            </h2>
            <p>
              Tetapkan karyawan ke shift dan cabang tertentu.
            </p>
          </div>
        </div>

        <form className="form-grid" onSubmit={save}>
          <label>
            Tanggal
            <input
              type="date"
              value={form.tanggal}
              onChange={e =>
                setForm({
                  ...form,
                  tanggal: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Karyawan
            <select
              value={form.karyawan_id}
              onChange={e =>
                setForm({
                  ...form,
                  karyawan_id: e.target.value,
                })
              }
              required
            >
              <option value="">Pilih Karyawan</option>

              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.id_karyawan
                    ? `${e.id_karyawan} - ${e.nama}`
                    : e.nama}
                </option>
              ))}
            </select>
          </label>

          <label>
            Shift
            <select
              value={form.shift_id}
              onChange={e =>
                setForm({
                  ...form,
                  shift_id: e.target.value,
                })
              }
            >
              <option value="">Libur / Tanpa Shift</option>

              {shifts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.jam_masuk} - {s.jam_pulang})
                </option>
              ))}
            </select>
          </label>

          <label>
            Cabang
            <select
              value={form.cabang_id}
              onChange={e =>
                setForm({
                  ...form,
                  cabang_id: e.target.value,
                })
              }
            >
              <option value="">Pilih Cabang</option>

              {branches.map(c => (
                <option key={c.id} value={c.id}>
                  {c.kode} - {c.nama}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={e =>
                setForm({
                  ...form,
                  status: e.target.value,
                })
              }
            >
              <option value="Terjadwal">Terjadwal</option>
              <option value="Libur">Libur</option>
              <option value="Cuti">Cuti</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
            </select>
          </label>

          <label className="full-span">
            Catatan
            <textarea
              value={form.catatan}
              onChange={e =>
                setForm({
                  ...form,
                  catatan: e.target.value,
                })
              }
              placeholder="Catatan jadwal..."
              rows={3}
            />
          </label>

          <div className="full-span form-actions">
            {editing && (
              <button
                type="button"
                className="secondary"
                onClick={reset}
              >
                Batal
              </button>
            )}

            <button className="primary" disabled={loading}>
              {loading
                ? 'Menyimpan...'
                : editing
                ? 'Simpan Jadwal'
                : 'Buat Jadwal'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Daftar Jadwal</h2>
            <p>{rows.length} jadwal tersimpan.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Karyawan</th>
                <th>Shift</th>
                <th>Cabang</th>
                <th>Status</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map(row => (
                  <tr key={row.id}>
                    <td><b>{row.tanggal}</b></td>
                    <td>{employeeName(row.karyawan_id)}</td>
                    <td>{shiftName(row.shift_id)}</td>
                    <td>{branchName(row.cabang_id)}</td>
                    <td>
                      <span className="status green">
                        {row.status}
                      </span>
                    </td>
                    <td>{row.catatan || '-'}</td>
                    <td>
                      <button
                        className="link-btn"
                        onClick={() => {
                          setEditing(row.id);
                          setForm({
                            tanggal:
                              row.tanggal ||
                              new Date()
                                .toISOString()
                                .slice(0, 10),
                            karyawan_id:
                              row.karyawan_id || '',
                            shift_id:
                              row.shift_id || '',
                            cabang_id:
                              row.cabang_id || '',
                            status:
                              row.status || 'Terjadwal',
                            catatan:
                              row.catatan || '',
                          });
                        }}
                      >
                        Edit
                      </button>{' '}
                      <button
                        className="danger-text"
                        onClick={() => remove(row.id)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow cols={7} />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HELPER
========================================================= */

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td
        colSpan={cols}
        className="empty-cell"
      >
        Belum ada data.
      </td>
    </tr>
  );
}
