
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { exportCsv as downloadCsv, rupiah } from '../../lib/hris';
import './admin.css';

type Karyawan = {
  id: string;
  id_karyawan?: string;
  nama: string;
  jabatan?: string;
  email?: string;
  no_telp?: string;
  alamat_rumah?: string;
  gaji_pokok?: number;
  nik_ktp?: string;
  departemen?: string;
  status_aktif?: boolean;
  tanggal_masuk?: string;
  status_karyawan?: string;
  role?: string;
};

type Absensi = {
  id: string;
  karyawan_id?: string;
  id_karyawan?: string;
  nama?: string;
  jabatan?: string;
  tanggal?: string;
  jam_masuk?: string;
  jam_pulang?: string;
  total_jam?: string;
  status?: string;
  lokasi?: string;
  foto?: string;
  keterlambatan_menit?: number;
  lembur_menit?: number;
};

type MenuKey =
  | 'overview' | 'employees' | 'employee-add' | 'organization' | 'attendance'
  | 'attendance-today' | 'late' | 'leave' | 'overtime' | 'selfie'
  | 'schedule' | 'shift' | 'holiday' | 'leave-request' | 'leave-balance'
  | 'payroll' | 'payroll-components' | 'payroll-overtime' | 'payslip'
  | 'performance' | 'kpi' | 'recruitment' | 'candidates'
  | 'reports' | 'settings' | 'roles' | 'audit';

const money = (n: number) => rupiah(n);

const todayId = new Date().toLocaleDateString('id-ID');

const menuGroups = [
  { title: 'UTAMA', items: [{ key: 'overview', label: 'Overview', icon: '⌂' }] },
  {
    title: 'PEOPLE',
    items: [
      { key: 'employees', label: 'Semua Karyawan', icon: '♙', badge: true },
      { key: 'employee-add', label: 'Tambah Karyawan', icon: '+' },
      { key: 'organization', label: 'Organisasi', icon: '▦' },
    ],
  },
  {
    title: 'ATTENDANCE',
    items: [
      { key: 'attendance', label: 'Rekap Absensi', icon: '◷' },
      { key: 'attendance-today', label: 'Absensi Hari Ini', icon: '✓' },
      { key: 'late', label: 'Keterlambatan', icon: '!' },
      { key: 'leave', label: 'Izin & Sakit', icon: '○' },
      { key: 'overtime', label: 'Lembur', icon: '↗' },
      { key: 'selfie', label: 'Monitoring Selfie', icon: '▣' },
    ],
  },
  {
    title: 'SCHEDULE',
    items: [
      { key: 'schedule', label: 'Jadwal Kerja', icon: '▤' },
      { key: 'shift', label: 'Shift', icon: '◫' },
      { key: 'holiday', label: 'Hari Libur', icon: '☆' },
    ],
  },
  {
    title: 'LEAVE',
    items: [
      { key: 'leave-request', label: 'Pengajuan Cuti', icon: '◉' },
      { key: 'leave-balance', label: 'Saldo Cuti', icon: '◌' },
    ],
  },
  {
    title: 'PAYROLL',
    items: [
      { key: 'payroll', label: 'Payroll Bulanan', icon: 'Rp' },
      { key: 'payroll-components', label: 'Komponen Gaji', icon: '≡' },
      { key: 'payroll-overtime', label: 'Payroll Lembur', icon: '↗' },
      { key: 'payslip', label: 'Slip Gaji', icon: '▤' },
    ],
  },
  {
    title: 'TALENT',
    items: [
      { key: 'performance', label: 'Performance', icon: '↗' },
      { key: 'kpi', label: 'KPI & Target', icon: '◎' },
      { key: 'recruitment', label: 'Recruitment', icon: '♧' },
      { key: 'candidates', label: 'Kandidat', icon: '♙' },
    ],
  },
  {
    title: 'REPORTING',
    items: [{ key: 'reports', label: 'Laporan', icon: '▥' }],
  },
  {
    title: 'SYSTEM',
    items: [
      { key: 'settings', label: 'Pengaturan', icon: '⚙' },
      { key: 'roles', label: 'Role & Permission', icon: '♙' },
      { key: 'audit', label: 'Audit Log', icon: '◉' },
    ],
  },
] as const;

export default function DashboardAdmin() {
  const [logged, setLogged] = useState(false);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [menu, setMenu] = useState<MenuKey>('overview');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(menuGroups.map(g => [g.title, true]))
  );
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [attendance, setAttendance] = useState<Absensi[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebar, setSidebar] = useState(true);
  const [editing, setEditing] = useState<Karyawan | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { if (logged) refresh(); }, [logged]);

  async function refresh() {
    setLoading(true);
    setError('');
    const [k, a] = await Promise.all([
      supabase.from('karyawan').select('*').order('nama'),
      supabase.from('absensi').select('*').order('created_at', { ascending: false }).limit(1000),
    ]);
    if (k.error) setError(k.error.message); else setEmployees(k.data || []);
    if (a.error) setError(a.error.message); else setAttendance(a.data || []);
    setLoading(false);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Kompatibilitas demo. Untuk produksi gunakan Supabase Auth + RLS.
    if (email === 'admin' && pin === 'admin123') {
      setLogged(true); setLoading(false); return;
    }
    const { data, error: err } = await supabase
      .from('karyawan').select('*').eq('email', email).eq('pin', pin).limit(1).maybeSingle();
    setLoading(false);
    if (data && !err) setLogged(true);
    else setError('Email/PIN admin tidak valid.');
  }

  const filteredEmployees = useMemo(() => employees.filter(k =>
    `${k.nama} ${k.id_karyawan || ''} ${k.jabatan || ''} ${k.departemen || ''}`
      .toLowerCase().includes(search.toLowerCase())
  ), [employees, search]);

  const filteredAttendance = useMemo(() => attendance.filter(a => {
    const raw = a.tanggal || '';
    // Existing app stores Indonesian date strings; date filters remain optional.
    const textMatch = 
    `${a.nama || ''} ${a.id_karyawan || ''} ${a.status || ''}`
      .toLowerCase().includes(search.toLowerCase())
  ), [attendance, search]);

  const today = attendance.filter(a => a.tanggal === todayId);
  const present = today.filter(a => ['Hadir', 'Tepat Waktu', 'Terlambat'].includes(a.status || 'Hadir')).length;
  const late = today.filter(a => (a.status || '').toLowerCase().includes('terlambat')).length;
  const absent = Math.max(employees.length - new Set(today.map(a => a.karyawan_id || a.id_karyawan)).size, 0);
  const payrollTotal = employees.reduce((s, k) => s + Number(k.gaji_pokok || 0), 0);
  const activeEmployees = employees.filter(k => k.status_aktif !== false).length;

  function exportCsv(rows: Record<string, unknown>[], filename: string) {
    if (!rows.length) return alert('Tidak ada data untuk diekspor.');
    const keys = Object.keys(rows[0]);
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [keys.join(';'), ...rows.map(r => keys.map(k => esc(r[k])).join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    URL.revokeObjectURL(a.href);
  }

  async function deleteEmployee(k: Karyawan) {
    if (!confirm(`Hapus ${k.nama}? Tindakan ini permanen.`)) return;
    const { error: err } = await supabase.from('karyawan').delete().eq('id', k.id);
    if (err) alert(err.message); else { setToast('Karyawan berhasil dihapus.'); refresh(); }
  }

  async function saveEdit(payload: Record<string, unknown>) {
    if (!editing) return;
    const { error: err } = await supabase.from('karyawan').update(payload).eq('id', editing.id);
    if (err) { setError(err.message); return; }
    setEditing(null); setToast('Data karyawan berhasil diperbarui.'); refresh();
  }

  const activeLabel = menuGroups.flatMap(g => g.items).find(i => i.key === menu)?.label || 'Overview';

  if (!logged) {
    return <Login email={email} pin={pin} setEmail={setEmail} setPin={setPin}
      onSubmit={login} error={error} loading={loading} />;
  }

  return (
    <div className="talenta-shell">
      <aside className={`talenta-sidebar ${sidebar ? '' : 'collapsed'}`}>
        <div className="brand">
          <div className="brand-mark">M</div>
          {sidebar && <div><b>MoonHR</b><small>People Platform</small></div>}
        </div>

        {sidebar && (
          <div className="workspace">
            <span>WORKSPACE</span>
            <b>Moonjustfine by Tirta</b>
            <small>HR Management</small>
          </div>
        )}

        <nav className="sidebar-nav">
          {menuGroups.map(group => (
            <div className="nav-group" key={group.title}>
              {sidebar && (
                <button className="group-title" onClick={() => setOpenGroups(v => ({...v, [group.title]: !v[group.title]}))}>
                  <span>{group.title}</span><span>{openGroups[group.title] ? '⌄' : '›'}</span>
                </button>
              )}
              {(sidebar ? openGroups[group.title] : true) && group.items.map(item => (
                <button
                  key={item.key}
                  className={`nav-item ${menu === item.key ? 'active' : ''}`}
                  onClick={() => setMenu(item.key as MenuKey)}
                  title={item.label}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {sidebar && <><span>{item.label}</span>{'badge' in item && item.badge && <em>{employees.length}</em>}</>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-mini">
            <div className="avatar">HR</div>
            {sidebar && <div><b>Administrator HR</b><small>Super Admin</small></div>}
          </div>
          <button className="logout" onClick={() => setLogged(false)}>↪ {sidebar && 'Keluar'}</button>
        </div>
      </aside>

      <main className="talenta-main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setSidebar(!sidebar)}>☰</button>
          <div className="crumb"><span>MoonHR</span><b>/</b>{activeLabel}</div>
          <div className="top-actions">
            <div className="search-global"><span>⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari karyawan, ID, menu..." />
            </div>
            <button className="icon-btn">◌</button>
            <div className="avatar">HR</div>
          </div>
        </header>

        <section className="page">
          {loading && <div className="loading">Memuat data…</div>}
          {error && <div className="alert">{error}</div>}

          {menu === 'overview' && <Overview employees={employees} attendance={attendance} present={present}
            late={late} absent={absent} payroll={payrollTotal} setMenu={setMenu} />}

          {menu === 'employees' && <Employees data={filteredEmployees} onDelete={deleteEmployee} onEdit={setEditing}
            onExport={() => exportCsv(employees as unknown as Record<string, unknown>[], 'database-karyawan.csv')} />}

          {menu === 'employee-add' && <AddEmployee onDone={() => { setMenu('employees'); refresh(); }} />}

          {menu === 'organization' && <Organization employees={employees} />}

          {['attendance', 'attendance-today', 'late', 'leave', 'overtime', 'selfie'].includes(menu) &&
            <AttendanceModule type={menu} data={filteredAttendance}
              onExport={() => exportCsv(attendance as unknown as Record<string, unknown>[], 'laporan-absensi.csv')} />}

          {['schedule', 'shift', 'holiday'].includes(menu) && <ScheduleModule type={menu} />}

          {['leave-request', 'leave-balance'].includes(menu) && <LeaveModule type={menu} employees={employees} />}

          {['payroll', 'payroll-components', 'payroll-overtime', 'payslip'].includes(menu) &&
            <PayrollModule type={menu} employees={employees} attendance={attendance} />}

          {['performance', 'kpi', 'recruitment', 'candidates'].includes(menu) &&
            <TalentModule type={menu} employees={employees} />}

          {menu === 'reports' && <Reports employees={employees} attendance={attendance} exportCsv={exportCsv} />}
          {menu === 'settings' && <Settings />}
          {menu === 'roles' && <Roles />}
          {menu === 'audit' && <Audit />}
          {editing && <EmployeeEditor employee={editing} onClose={() => setEditing(null)} onSave={saveEdit} />}
          {toast && <button className="toast" onClick={() => setToast('')}>{toast} ×</button>}
        </section>
      </main>
    </div>
  );
}

function Login(p: { email: string; pin: string; setEmail: (v: string) => void; setPin: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void; error: string; loading: boolean }) {
  return <div className="login-wrap"><div className="login-card">
    <div className="brand center"><div className="brand-mark">M</div><div><b>MoonHR</b><small>People Platform</small></div></div>
    <h1>Selamat datang kembali</h1><p>Masuk ke dashboard HR & payroll Anda.</p>
    <form onSubmit={p.onSubmit}>
      <label>Email Admin<input type="text" value={p.email} onChange={e => p.setEmail(e.target.value)} placeholder="admin@perusahaan.com" required /></label>
      <label>PIN / Password<input type="password" value={p.pin} onChange={e => p.setPin(e.target.value)} placeholder="••••••" required /></label>
      {p.error && <div className="form-error">{p.error}</div>}
      <button className="primary full" disabled={p.loading}>{p.loading ? 'Memeriksa…' : 'Masuk ke Dashboard'}</button>
    </form>
    <small className="security-note">Login demo lama tetap didukung untuk kompatibilitas. Untuk produksi, gunakan Supabase Auth + RLS.</small>
  </div></div>;
}

function Heading({title, desc, action, onAction}:{title:string;desc:string;action?:string;onAction?:()=>void}) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{desc}</p></div>
    {action && <button className="primary" onClick={onAction}>{action}</button>}</div>;
}

function Overview({employees, attendance, present, late, absent, payroll, setMenu}:{employees:Karyawan[];attendance:Absensi[];present:number;late:number;absent:number;payroll:number;setMenu:(m:MenuKey)=>void}) {
  const recent = attendance.slice(0, 7);
  return <>
    <div className="page-heading"><div><div className="eyebrow">HR COMMAND CENTER</div><h1>Selamat datang, HR 👋</h1>
      <p>Kelola people, attendance, payroll, dan talent dari satu pusat kendali.</p></div>
      <button className="primary" onClick={() => setMenu('reports')}>＋ Buat laporan</button></div>

    <div className="stat-grid">
      <Stat title="Total Karyawan" value={String(employees.length)} hint={`${employees.filter(k=>k.status_aktif !== false).length} aktif`} icon="♙"/>
      <Stat title="Hadir Hari Ini" value={String(present)} hint={`${late} terlambat`} icon="✓"/>
      <Stat title="Belum Absen" value={String(absent)} hint="Perlu ditindaklanjuti" icon="!"/>
      <Stat title="Payroll Bulanan" value={money(payroll)} hint="Total gaji pokok" icon="Rp"/>
    </div>

    <div className="mini-kpi-row">
      <MiniKpi label="Attendance Rate" value={`${employees.length ? Math.round((present/employees.length)*100) : 0}%`} />
      <MiniKpi label="Total Absensi" value={String(attendance.length)} />
      <MiniKpi label="Lembur" value={String(attendance.filter(a => Number(a.lembur_menit||0)>0).length)} />
      <MiniKpi label="Data Aktif" value={`${employees.length ? Math.round((employees.filter(k=>k.status_aktif!==false).length/employees.length)*100) : 0}%`} />
    </div>

    <div className="content-grid">
      <div className="panel"><div className="panel-head"><div><h2>Aktivitas absensi terbaru</h2><p>Monitoring aktivitas workforce.</p></div>
        <button className="link-btn" onClick={() => setMenu('attendance')}>Lihat semua →</button></div>
        <AttendanceMini rows={recent}/></div>
      <div className="panel quick"><h2>Akses cepat</h2><p>Workflow HR yang sering digunakan.</p>
        <Quick label="Tambah karyawan" icon="♙" onClick={()=>setMenu('employee-add')}/>
        <Quick label="Rekap absensi" icon="◷" onClick={()=>setMenu('attendance')}/>
        <Quick label="Proses payroll" icon="Rp" onClick={()=>setMenu('payroll')}/>
        <Quick label="Pengajuan cuti" icon="◉" onClick={()=>setMenu('leave-request')}/>
      </div>
    </div>
  </>;
}

function Stat({title,value,hint,icon}:{title:string;value:string;hint:string;icon:string}) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{title}</span><strong>{value}</strong><small>{hint}</small></div></div>;
}
function MiniKpi({label,value}:{label:string;value:string}) {
  return <div className="mini-kpi"><span>{label}</span><b>{value}</b><i>↗</i></div>;
}
function Quick({label,icon,onClick}:{label:string;icon:string;onClick:()=>void}) {
  return <button className="quick-action" onClick={onClick}><span className="quick-icon">{icon}</span>{label}<span>→</span></button>;
}
function AttendanceMini({rows}:{rows:Absensi[]}) {
  return <div className="table-wrap"><table><thead><tr><th>Karyawan</th><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Status</th></tr></thead>
    <tbody>{rows.length ? rows.map((a,i)=><tr key={a.id||i}><td><b>{a.nama||'-'}</b><small>{a.id_karyawan||''}</small></td><td>{a.tanggal||'-'}</td><td className="green">{a.jam_masuk||'-'}</td><td>{a.jam_pulang||'-'}</td><td><Status value={a.status||'Hadir'}/></td></tr>) : <Empty cols={5}/>}</tbody></table></div>;
}

function Employees({data,onDelete,onEdit,onExport}:{data:Karyawan[];onDelete:(k:Karyawan)=>void;onEdit:(k:Karyawan)=>void;onExport:()=>void}) {
  return <><Heading title="Semua Karyawan" desc="Master data workforce, jabatan, status, dan payroll." action="＋ Tambah Karyawan"/>
    <div className="toolbar"><div><b>{data.length}</b> karyawan ditemukan</div><button className="secondary" onClick={onExport}>⇩ Export CSV</button></div>
    <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Nama</th><th>ID</th><th>Jabatan</th><th>Departemen</th><th>Status</th><th>Gaji Pokok</th><th>Aksi</th></tr></thead>
      <tbody>{data.length ? data.map(k=><tr key={k.id}><td><div className="person"><div className="mini-avatar">{k.nama?.charAt(0)||'K'}</div><b>{k.nama}</b></div></td><td>{k.id_karyawan||'-'}</td><td>{k.jabatan||'-'}</td><td>{k.departemen||'-'}</td><td><Status value={k.status_aktif === false ? 'Nonaktif' : 'Aktif'}/></td><td>{money(Number(k.gaji_pokok||0))}</td><td><div className="row-actions"><button className="link-btn" onClick={()=>onEdit(k)}>Edit</button><button className="danger-text" onClick={()=>onDelete(k)}>Hapus</button></div></td></tr>) : <Empty cols={7}/>}</tbody></table></div></div></>;
}

function AddEmployee({onDone}:{onDone:()=>void}) {
  const [form,setForm]=useState({id_karyawan:'',nama:'',jabatan:'',email:'',no_telp:'',departemen:'',tanggal_masuk:'',gaji_pokok:''});
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState('');
  async function save(e:React.FormEvent){e.preventDefault();setSaving(true);setMsg('');
    const {error}=await supabase.from('karyawan').insert({...form,gaji_pokok:Number(form.gaji_pokok||0),status_aktif:true});
    setSaving(false); if(error)setMsg(error.message); else onDone();
  }
  return <><Heading title="Tambah Karyawan" desc="Buat profil karyawan baru ke dalam master data."/>
    <div className="panel form-panel"><form className="form-grid" onSubmit={save}>
      {Object.entries(form).map(([key,val])=><label key={key}>{fieldLabel(key)}
        <input required={['id_karyawan','nama'].includes(key)} type={key==='gaji_pokok'?'number':key==='tanggal_masuk'?'date':'text'}
          value={val} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}
      {msg&&<div className="form-error full-span">{msg}</div>}
      <div className="full-span form-actions"><button className="secondary" type="button" onClick={onDone}>Batal</button><button className="primary" disabled={saving}>{saving?'Menyimpan…':'Simpan Karyawan'}</button></div>
    </form></div></>;
}


function EmployeeEditor({employee,onClose,onSave}:{employee:Karyawan;onClose:()=>void;onSave:(p:Record<string,unknown>)=>void}) {
  const [form,setForm]=useState({
    nama:employee.nama||'', jabatan:employee.jabatan||'', email:employee.email||'',
    no_telp:employee.no_telp||'', departemen:employee.departemen||'',
    tanggal_masuk:employee.tanggal_masuk||'', gaji_pokok:String(employee.gaji_pokok||0),
    status_aktif:employee.status_aktif!==false
  })
  return <div className="drawer-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}>
    <aside className="edit-drawer"><div className="drawer-head"><div><span>EMPLOYEE PROFILE</span><h2>Edit Karyawan</h2></div><button className="icon-btn" onClick={onClose}>×</button></div>
      <div className="drawer-body">
        {Object.entries(form).filter(([k])=>k!=='status_aktif').map(([key,val])=><label key={key}>{fieldLabel(key)}
          <input type={key==='gaji_pokok'?'number':key==='tanggal_masuk'?'date':'text'} value={val}
            onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}
        <label className="switch-row"><span>Status Aktif</span><input type="checkbox" checked={form.status_aktif} onChange={e=>setForm({...form,status_aktif:e.target.checked})}/></label>
      </div>
      <div className="drawer-foot"><button className="secondary" onClick={onClose}>Batal</button><button className="primary" onClick={()=>onSave({...form,gaji_pokok:Number(form.gaji_pokok||0)})}>Simpan Perubahan</button></div>
    </aside>
  </div>
}

function Organization({employees}:{employees:Karyawan[]}) {
  const depts=[...new Set(employees.map(e=>e.departemen||'Belum ditentukan'))];
  return <><Heading title="Organisasi" desc="Struktur departemen dan distribusi workforce." action="＋ Tambah Departemen"/>
    <div className="org-grid">{depts.map(d=><div className="org-card" key={d}><div className="org-icon">▦</div><h3>{d}</h3><p>{employees.filter(e=>(e.departemen||'Belum ditentukan')===d).length} karyawan</p><div className="progress"><span style={{width:`${Math.min(100, employees.length ? employees.filter(e=>(e.departemen||'Belum ditentukan')===d).length/employees.length*100 : 0)}%`}}/></div></div>)}</div></>;
}

function AttendanceModule({type,data,onExport}:{type:MenuKey;data:Absensi[];onExport:()=>void}) {
  const title=({attendance:'Rekap Absensi','attendance-today':'Absensi Hari Ini',late:'Keterlambatan',leave:'Izin & Sakit',overtime:'Lembur',selfie:'Monitoring Selfie'} as Record<string,string>)[type]||'Absensi';
  let rows=data;
  if(type==='late') rows=data.filter(a=>(a.status||'').toLowerCase().includes('terlambat')||Number(a.keterlambatan_menit||0)>0);
  if(type==='overtime') rows=data.filter(a=>Number(a.lembur_menit||0)>0);
  if(type==='leave') rows=data.filter(a=>['Izin','Sakit'].some(s=>(a.status||'').toLowerCase().includes(s.toLowerCase())));
  if(type==='attendance-today') rows=data.filter(a=>a.tanggal===todayId);
  return <><Heading title={title} desc="Kehadiran, jam kerja, lokasi, dan aktivitas workforce." action="⇩ Export CSV" onAction={onExport}/>
    <div className="stat-grid three"><Stat title="Data" value={String(rows.length)} hint="Record ditampilkan" icon="▤"/><Stat title="Hadir" value={String(rows.filter(a=>['Hadir','Tepat Waktu','Terlambat'].includes(a.status||'')).length)} hint="Status hadir" icon="✓"/><Stat title="Terlambat" value={String(rows.filter(a=>(a.status||'').toLowerCase().includes('terlambat')).length)} hint="Perlu review" icon="!"/></div>
    <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Foto</th><th>Karyawan</th><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Total</th><th>Status</th><th>Lokasi</th></tr></thead>
      <tbody>{rows.length?rows.map((a,i)=><tr key={a.id||i}><td>{a.foto?<img className="selfie" src={a.foto}/>:<div className="selfie blank">—</div>}</td><td><b>{a.nama||'-'}</b><small>{a.id_karyawan||''}</small></td><td>{a.tanggal||'-'}</td><td className="green">{a.jam_masuk||'-'}</td><td>{a.jam_pulang||'-'}</td><td>{a.total_jam||'-'}</td><td><Status value={a.status||'Hadir'}/></td><td className="muted">{a.lokasi||'-'}</td></tr>):<Empty cols={8}/>}</tbody></table></div></div></>;
}

function ScheduleModule({type}:{type:MenuKey}) {
  const title=({schedule:'Jadwal Kerja',shift:'Shift',holiday:'Hari Libur'} as Record<string,string>)[type]!;
  const cards=type==='shift'?['Shift Pagi · 07:00–16:00','Shift Siang · 09:00–18:00','Shift Malam · 22:00–07:00']:type==='holiday'?['Tanggal Merah','Libur Nasional','Libur Perusahaan']:['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
  return <><Heading title={title} desc="Kelola pola kerja, shift, kalender, dan kebutuhan staffing." action={type==='schedule'?'＋ Buat Jadwal':'＋ Tambah'}/>
    <div className="calendar-grid">{cards.map((c,i)=><div className="calendar-card" key={c}><span>{type==='schedule'?'HARI':type==='shift'?'SHIFT':'KALENDER'}</span><h3>{c}</h3><p>{type==='shift'?'Atur jam masuk, pulang, dan toleransi.':type==='holiday'?'Atur tanggal non-working day.':'Jadwal workforce dapat dikembangkan dari template.'}</p><button className="link-btn">Kelola →</button></div>)}</div></>;
}

function LeaveModule({type,employees}:{type:MenuKey;employees:Karyawan[]}) {
  const title=type==='leave-request'?'Pengajuan Cuti':'Saldo Cuti';
  return <><Heading title={title} desc="Workflow cuti dan izin karyawan." action={type==='leave-request'?'＋ Buat Pengajuan':'⚙ Atur Kebijakan'}/>
    <div className="panel"><div className="panel-head"><div><h2>{type==='leave-request'?'Approval Inbox':'Saldo per Karyawan'}</h2><p>{employees.length} karyawan terdaftar.</p></div><span className="badge-soft">Belum terhubung workflow</span></div>
      <div className="empty-module"><div className="empty-icon">◉</div><h3>Modul siap digunakan</h3><p>Struktur halaman sudah tersedia. Data pengajuan dan saldo dapat dihubungkan ke tabel cuti Supabase pada tahap berikutnya.</p></div>
    </div></>;
}

function PayrollModule({type,employees,attendance}:{type:MenuKey;employees:Karyawan[];attendance:Absensi[]}) {
  const total=employees.reduce((s,k)=>s+Number(k.gaji_pokok||0),0);
  const overtime=attendance.reduce((s,a)=>s+Number(a.lembur_menit||0),0);
  const title=({payroll:'Payroll Bulanan','payroll-components':'Komponen Gaji','payroll-overtime':'Payroll Lembur',payslip:'Slip Gaji'} as Record<string,string>)[type]!;
  return <><Heading title={title} desc="Kelola penggajian, komponen pendapatan, lembur, dan slip." action={type==='payroll'?'▶ Proses Payroll':'＋ Tambah'}/>
    <div className="stat-grid"><Stat title="Gaji Pokok" value={money(total)} hint={`${employees.length} karyawan`} icon="Rp"/><Stat title="Lembur" value={`${Math.floor(overtime/60)}j ${overtime%60}m`} hint="Akumulasi menit" icon="↗"/><Stat title="Status" value="Draft" hint="Periode berjalan" icon="◷"/><Stat title="Pembayaran" value="Jumat" hint="Hari gajian" icon="✓"/></div>
    <div className="panel table-panel"><div className="panel-head"><div><h2>{type==='payslip'?'Daftar Slip Gaji':'Payroll Register'}</h2><p>Ringkasan data payroll dari master karyawan.</p></div><button className="secondary">⇩ Export</button></div>
      <div className="table-wrap"><table><thead><tr><th>Karyawan</th><th>ID</th><th>Jabatan</th><th>Gaji Pokok</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>{employees.length?employees.map(k=><tr key={k.id}><td><b>{k.nama}</b></td><td>{k.id_karyawan||'-'}</td><td>{k.jabatan||'-'}</td><td>{money(Number(k.gaji_pokok||0))}</td><td><Status value="Draft"/></td><td><button className="link-btn">Lihat →</button></td></tr>):<Empty cols={6}/>}</tbody></table></div></div></>;
}

function TalentModule({type,employees}:{type:MenuKey;employees:Karyawan[]}) {
  const title=({performance:'Performance',kpi:'KPI & Target',recruitment:'Recruitment',candidates:'Kandidat'} as Record<string,string>)[type]!;
  return <><Heading title={title} desc="Kelola talent lifecycle, target, performance, dan recruitment." action="＋ Tambah"/>
    <div className="feature-grid"><Feature title="Workflow" text="Buat tahapan, approval, dan status proses." icon="◎"/><Feature title="Data Terpusat" text={`${employees.length} karyawan tersedia sebagai workforce master.`} icon="♙"/><Feature title="Reporting" text="Siapkan metrik dan laporan talent secara berkala." icon="▥"/></div>
    <div className="panel"><div className="empty-module"><div className="empty-icon">◎</div><h3>Modul {title} siap dikembangkan</h3><p>UI dan navigasi sudah tersedia. Data transaksional dapat ditambahkan ke Supabase tanpa mengubah struktur menu.</p></div></div></>;
}
function Feature({title,text,icon}:{title:string;text:string;icon:string}) { return <div className="feature-card"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p><button className="link-btn">Kelola →</button></div>; }

function Reports({employees,attendance,exportCsv}:{employees:Karyawan[];attendance:Absensi[];exportCsv:(r:Record<string,unknown>[],f:string)=>void}) {
  const reports=[['Master Karyawan',employees,'laporan-karyawan.csv'],['Absensi',attendance,'laporan-absensi.csv']];
  return <><Heading title="Laporan & Analytics" desc="Export data operasional dan ringkasan HR."/>
    <div className="report-grid">{reports.map(([name,data,file])=><div className="report-card" key={name as string}><span>REPORT</span><h3>{name}</h3><b>{(data as unknown[]).length}</b><p>record tersedia</p><button className="primary" onClick={()=>exportCsv(data as Record<string,unknown>[],file as string)}>Export CSV</button></div>)}</div>
    <div className="panel"><div className="panel-head"><div><h2>Analytics</h2><p>Dashboard visual dapat dikembangkan dari data Supabase.</p></div></div><div className="chart-placeholder"><div className="bars">{[35,58,44,76,63,82,55].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div><div className="chart-labels"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div></div></div></>;
}

function Settings() {
  return <><Heading title="Pengaturan" desc="Konfigurasi perusahaan dan kebijakan HR." action="Simpan Perubahan"/>
    <div className="settings-grid"><SettingCard title="Profil Perusahaan" text="Nama perusahaan, alamat, kontak, logo."/><SettingCard title="Jam Kerja" text="Jam kerja efektif, istirahat, toleransi."/><SettingCard title="Aturan Absensi" text="Geofence, selfie, keterlambatan."/><SettingCard title="Kebijakan Cuti" text="Saldo, approval, dan jenis cuti."/><SettingCard title="Aturan Lembur" text="Tarif dan batas lembur."/><SettingCard title="Payroll" text="Komponen gaji, BPJS, dan PPh 21."/></div>
  </>;
}
function SettingCard({title,text}:{title:string;text:string}) { return <div className="setting-card"><div className="setting-icon">⚙</div><h3>{title}</h3><p>{text}</p><button className="link-btn">Konfigurasi →</button></div>; }

function Roles() { return <><Heading title="Role & Permission" desc="Siapa yang boleh melihat dan mengelola modul HRIS." action="＋ Tambah Role"/>
  <div className="panel"><div className="table-wrap"><table><thead><tr><th>Role</th><th>Akses</th><th>Deskripsi</th><th>Status</th></tr></thead><tbody>
    {['Super Admin','Admin HR','Supervisor','Karyawan'].map((r,i)=><tr key={r}><td><b>{r}</b></td><td>{i===0?'Semua modul':i===1?'People, Attendance, Payroll':'Modul sesuai kewenangan'}</td><td>Role bawaan MoonHR</td><td><Status value="Aktif"/></td></tr>)}</tbody></table></div></div></>; }

function Audit() { return <><Heading title="Audit Log" desc="Jejak aktivitas administrator dan perubahan data."/>
  <div className="panel"><div className="empty-module"><div className="empty-icon">◉</div><h3>Audit trail</h3><p>Setelah tabel audit_logs aktif di Supabase, setiap perubahan penting dapat dicatat di sini.</p></div></div></>; }

function Status({value}:{value:string}) { const v=value.toLowerCase(); const cls=v.includes('non')||v.includes('sakit')?'red':v.includes('terlambat')||v.includes('draft')?'orange':v.includes('izin')?'blue':'green'; return <span className={`status ${cls}`}>{value}</span>; }
function Empty({cols}:{cols:number}) { return <tr><td colSpan={cols} className="empty-cell">Belum ada data.</td></tr>; }
function fieldLabel(k:string) { return ({id_karyawan:'ID Karyawan',nama:'Nama Lengkap',jabatan:'Jabatan',email:'Email',no_telp:'No. Telepon',departemen:'Departemen',tanggal_masuk:'Tanggal Masuk',gaji_pokok:'Gaji Pokok'} as Record<string,string>)[k] || k; }
