import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { rupiah } from '../../lib/hris';
import './admin.css';
import MasterData from './MasterData';
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

type MenuItem = { key: MenuKey; label: string; icon: string; badge?: boolean };

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

  const filteredAttendance = useMemo(() => attendance.filter(a =>
    `${a.nama || ''} ${a.id_karyawan || ''} ${a.status || ''}`
      .toLowerCase().includes(search.toLowerCase())
  ), [attendance, search]);

  const today = attendance.filter(a => a.tanggal === todayId);
  const present = today.filter(a => ['Hadir', 'Tepat Waktu', 'Terlambat'].includes(a.status || 'Hadir')).length;
  const late = today.filter(a => (a.status || '').toLowerCase().includes('terlambat')).length;
  const absent = Math.max(employees.length - new Set(today.map(a => a.karyawan_id || a.id_karyawan)).size, 0);
  const payrollTotal = employees.reduce((s, k) => s + Number(k.gaji_pokok || 0), 0);

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

  const activeLabel = menuGroups.flatMap(g => g.items as readonly MenuItem[]).find(i => i.key === menu)?.label || 'Overview';

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
            onExport={() => exportCsv(employees as unknown as Record<string, unknown>[], 'database-karyawan.csv')} onAdd={() => setMenu('employee-add')} />}

         {menu === 'organization' && (
  <MasterData initialTab="cabang" />
)}

{['attendance', 'attendance-today', 'late', 'leave', 'overtime', 'selfie'].includes(menu) && (
  <AttendanceModule
    type={menu}
    data={filteredAttendance}
    onExport={() =>
      exportCsv(
        attendance as unknown as Record<string, unknown>[],
        'laporan-absensi.csv'
      )
    }
  />
)}

{menu === 'shift' && (
  <MasterData initialTab="shift" />
)}

{menu === 'schedule' && (
  <MasterData initialTab="jadwal" />
)}

{menu === 'holiday' && (
  <ScheduleModule type="holiday" />
)}
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

  return <><Heading title="Tambah Karyawan" desc="Buat profil karyawan baru ke dalam master data."/>
    <div className="panel form-panel"><form className="form-grid" onSubmit={save}>
      {Object.entries(form).map(([key,val])=><label key={key}>{fieldLabel(key)}
        <input required={['id_karyawan','nama'].includes(key)} type={key==='gaji_pokok'?'number':key==='tanggal_masuk'?'date':'text'}
          value={val} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}
      {msg&&<div className="form-error full-span">{msg}</div>}
      <div className="full-span form-actions"><button className="secondary" type="button" onClick={onDone}>Batal</button><button className="primary" disabled={saving}>{saving?'Menyimpan…':'Simpan Karyawan'}</button></div>
    </form></div></>;



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
          <input type={key==='gaji_pokok'?'number':key==='tanggal_masuk'?'date':'text'} value={String(val ?? '')}
            onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}
        <label className="switch-row"><span>Status Aktif</span><input type="checkbox" checked={form.status_aktif} onChange={e=>setForm({...form,status_aktif:e.target.checked})}/></label>
      </div>
      <div className="drawer-foot"><button className="secondary" onClick={onClose}>Batal</button><button className="primary" onClick={()=>onSave({...form,gaji_pokok:Number(form.gaji_pokok||0)})}>Simpan Perubahan</button></div>
    </aside>
  </div>
}

function BranchNav({items,active,onChange}:{items:{key:string;label:string;icon:string}[];active:string;onChange:(key:string)=>void}) {
  return <div className="branch-nav">{items.map(item=><button key={item.key} className={active===item.key?'active':''} onClick={()=>onChange(item.key)}><span>{item.icon}</span>{item.label}</button>)}</div>;
}

function BranchPage({title,desc,items,active,onChange,children,action,onAction}:{title:string;desc:string;items:{key:string;label:string;icon:string}[];active:string;onChange:(key:string)=>void;children:React.ReactNode;action?:string;onAction?:()=>void}) {
  return <><Heading title={title} desc={desc} action={action} onAction={onAction}/><BranchNav items={items} active={active} onChange={onChange}/>{children}</>;
}

function Feature({title,text,icon}:{title:string;text:string;icon:string}) {
  return <div className="feature-card"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p><button className="link-btn">Kelola →</button></div>;
}


  const [tab,setTab]=useState('departments');
  const depts=[...new Set(employees.map(e=>e.departemen||'Belum ditentukan'))];
  const items=[{key:'departments',label:'Departemen',icon:'▦'},{key:'positions',label:'Jabatan',icon:'♙'},{key:'structure',label:'Struktur',icon:'⌘'}];
  return <BranchPage title="Organisasi" desc="Kelola struktur perusahaan, departemen, jabatan, dan reporting line." items={items} active={tab} onChange={setTab} action={tab==='departments'?'＋ Tambah Departemen':'＋ Tambah'}>
    {tab==='departments' && <div className="org-grid">{depts.map(d=><div className="org-card clickable" key={d}><div className="org-icon">▦</div><h3>{d}</h3><p>{employees.filter(e=>(e.departemen||'Belum ditentukan')===d).length} karyawan</p><div className="progress"><span style={{width:`${Math.min(100, employees.length ? employees.filter(e=>(e.departemen||'Belum ditentukan')===d).length/employees.length*100 : 0)}%`}}/></div><button className="link-btn">Lihat anggota →</button></div>)}</div>}
    {tab==='positions' && <div className="feature-grid"><Feature title="Daftar Jabatan" text="Kelola jabatan dan level organisasi dari satu tempat." icon="♙"/><Feature title="Level & Grade" text="Atur grade, level, dan rentang kompensasi." icon="◎"/><Feature title="Job Description" text="Simpan tanggung jawab dan persyaratan setiap posisi." icon="▤"/></div>}
    {tab==='structure' && <div className="panel"><div className="empty-module"><div className="empty-icon">⌘</div><h3>Organization Chart</h3><p>Struktur reporting line siap digunakan. Setiap karyawan dapat diarahkan ke departemen dan atasan langsung.</p><button className="primary">＋ Atur Struktur</button></div></div>}
  </BranchPage>;


function AttendanceModule({type,data,onExport}:{type:MenuKey;data:Absensi[];onExport:()=>void}) {
  const [tab,setTab]=useState(type==='attendance-today'?'today':type==='late'?'late':type==='leave'?'leave':type==='overtime'?'overtime':type==='selfie'?'selfie':'summary');
  const items=[{key:'summary',label:'Rekap',icon:'◷'},{key:'today',label:'Hari Ini',icon:'✓'},{key:'late',label:'Terlambat',icon:'!'},{key:'leave',label:'Izin & Sakit',icon:'○'},{key:'overtime',label:'Lembur',icon:'↗'},{key:'selfie',label:'Monitoring Selfie',icon:'▣'}];
  let rows=data;
  if(tab==='late') rows=data.filter(a=>(a.status||'').toLowerCase().includes('terlambat')||Number(a.keterlambatan_menit||0)>0);
  if(tab==='overtime') rows=data.filter(a=>Number(a.lembur_menit||0)>0);
  if(tab==='leave') rows=data.filter(a=>['izin','sakit'].some(s=>(a.status||'').toLowerCase().includes(s)));
  if(tab==='today') rows=data.filter(a=>a.tanggal===todayId);
  if(tab==='selfie') rows=data.filter(a=>!!a.foto);
  const title=items.find(x=>x.key===tab)?.label || 'Rekap Absensi';
  return <BranchPage title={title} desc="Kehadiran, jam kerja, lokasi, approval, dan monitoring workforce." items={items} active={tab} onChange={setTab} action="⇩ Export CSV" onAction={onExport}>
    <div className="stat-grid three"><Stat title="Data" value={String(rows.length)} hint="Record ditampilkan" icon="▤"/><Stat title="Hadir" value={String(rows.filter(a=>['Hadir','Tepat Waktu','Terlambat'].includes(a.status||'')).length)} hint="Status hadir" icon="✓"/><Stat title="Perlu Review" value={String(rows.filter(a=>(a.status||'').toLowerCase().includes('terlambat')||Number(a.lembur_menit||0)>0).length)} hint="Terlambat / lembur" icon="!"/></div>
    <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Foto</th><th>Karyawan</th><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Total</th><th>Status</th><th>Lokasi</th></tr></thead><tbody>{rows.length?rows.map((a,i)=><tr key={a.id||i}><td>{a.foto?<img className="selfie" src={a.foto}/>:<div className="selfie blank">—</div>}</td><td><b>{a.nama||'-'}</b><small>{a.id_karyawan||''}</small></td><td>{a.tanggal||'-'}</td><td className="green">{a.jam_masuk||'-'}</td><td>{a.jam_pulang||'-'}</td><td>{a.total_jam||'-'}</td><td><Status value={a.status||'Hadir'}/></td><td className="muted">{a.lokasi||'-'}</td></tr>):<Empty cols={8}/>}</tbody></table></div></div>
  </BranchPage>;
}

function ScheduleModule({type}:{type:MenuKey}) {
  const initial=type==='shift'?'shifts':type==='holiday'?'holidays':'calendar';
  const [tab,setTab]=useState(initial);
  const items=[{key:'calendar',label:'Kalender Jadwal',icon:'▤'},{key:'templates',label:'Template Jadwal',icon:'▥'},{key:'assignments',label:'Penugasan',icon:'♙'},{key:'shifts',label:'Kelola Shift',icon:'◫'},{key:'holidays',label:'Hari Libur',icon:'☆'}];
  const [selected,setSelected]=useState('Shift Pagi');
  const shifts=['Shift Pagi','Shift Siang','Shift Malam'];
  const holidays=['Libur Nasional','Libur Perusahaan','Tanggal Merah'];
  return <BranchPage title={items.find(x=>x.key===tab)?.label || 'Jadwal Kerja'} desc="Kelola kalender kerja, template, shift, penugasan, dan hari libur." items={items} active={tab} onChange={setTab} action={tab==='calendar'?'＋ Buat Jadwal':tab==='shifts'?'＋ Tambah Shift':tab==='holidays'?'＋ Tambah Hari Libur':'＋ Tambah'}>
    {tab==='calendar' && <div className="calendar-grid">{['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map(day=><div className="calendar-card clickable" key={day}><span>HARI</span><h3>{day}</h3><p>Jadwal workforce dan kebutuhan staffing.</p><button className="link-btn" onClick={()=>setTab('assignments')}>Kelola jadwal →</button></div>)}</div>}
    {tab==='templates' && <div className="feature-grid"><Feature title="5 Hari Kerja" text="Template Senin–Jumat dengan jam kerja standar." icon="▤"/><Feature title="6 Hari Kerja" text="Template operasional untuk workforce 6 hari." icon="◷"/><Feature title="Custom" text="Buat pola kerja sesuai kebutuhan warehouse." icon="＋"/></div>}
    {tab==='assignments' && <div className="panel"><div className="panel-head"><div><h2>Penugasan Karyawan</h2><p>Pilih shift lalu tetapkan karyawan.</p></div><button className="primary" onClick={()=>setTab('shifts')}>Pilih Shift</button></div><div className="assignment-list">{['Shift Pagi','Shift Siang','Shift Malam'].map(s=><button className="assignment-row" key={s} onClick={()=>{setSelected(s);setTab('shifts')}}><b>{s}</b><span>{s==='Shift Pagi'?'07:00–16:00':s==='Shift Siang'?'09:00–18:00':'22:00–07:00'}</span><em>Kelola →</em></button>)}</div></div>}
    {tab==='shifts' && <div className="split-module"><div className="panel"><div className="panel-head"><div><h2>Daftar Shift</h2><p>Shift aktif di perusahaan.</p></div></div>{shifts.map(s=><button key={s} className={`list-select ${selected===s?'active':''}`} onClick={()=>setSelected(s)}>{s}<span>→</span></button>)}</div><div className="panel detail-panel"><span className="eyebrow">KONFIGURASI SHIFT</span><h2>{selected}</h2><p>Atur jam kerja dan aturan shift.</p><div className="detail-grid"><Info label="Jam Masuk" value={selected==='Shift Pagi'?'07:00':selected==='Shift Siang'?'09:00':'22:00'}/><Info label="Jam Pulang" value={selected==='Shift Pagi'?'16:00':selected==='Shift Siang'?'18:00':'07:00'}/><Info label="Istirahat" value="60 menit"/><Info label="Toleransi" value="15 menit"/></div><div className="detail-actions"><button className="secondary">Aturan Shift</button><button className="primary">Simpan Shift</button></div></div></div>}
    {tab==='holidays' && <div className="calendar-grid">{holidays.map(h=><div className="calendar-card clickable" key={h}><span>KALENDER</span><h3>{h}</h3><p>Kelola tanggal non-working day dan aturan pembayaran.</p><button className="link-btn">Kelola →</button></div>)}</div>}
  </BranchPage>;
}

function LeaveModule({type,employees}:{type:MenuKey;employees:Karyawan[]}) {
  const [tab,setTab]=useState(type==='leave-balance'?'balance':'inbox');
  const items=[{key:'inbox',label:'Approval Inbox',icon:'◉'},{key:'requests',label:'Pengajuan Baru',icon:'＋'},{key:'history',label:'Riwayat',icon:'▤'},{key:'balance',label:'Saldo Cuti',icon:'◌'},{key:'policies',label:'Jenis & Kebijakan',icon:'⚙'}];
  return <BranchPage title={items.find(x=>x.key===tab)?.label||'Cuti'} desc="Workflow pengajuan, approval, saldo, dan kebijakan cuti." items={items} active={tab} onChange={setTab} action={tab==='policies'?'＋ Tambah Kebijakan':'＋ Buat Pengajuan'}>
    {tab==='balance' && <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Karyawan</th><th>ID</th><th>Saldo Tahunan</th><th>Terpakai</th><th>Sisa</th><th>Aksi</th></tr></thead><tbody>{employees.map(k=><tr key={k.id}><td><b>{k.nama}</b></td><td>{k.id_karyawan||'-'}</td><td>12</td><td>0</td><td><Status value="12 Hari"/></td><td><button className="link-btn">Detail →</button></td></tr>)}</tbody></table></div></div>}
    {['inbox','requests','history'].includes(tab) && <div className="panel"><div className="empty-module"><div className="empty-icon">◉</div><h3>{tab==='inbox'?'Approval Inbox':tab==='requests'?'Pengajuan Cuti':'Riwayat Cuti'}</h3><p>Belum ada transaksi cuti. Struktur approval sudah tersedia untuk dihubungkan ke tabel HRIS.</p><button className="primary">＋ Buat Pengajuan</button></div></div>}
    {tab==='policies' && <div className="feature-grid"><Feature title="Cuti Tahunan" text="Atur jatah dan masa berlaku cuti tahunan." icon="◌"/><Feature title="Sakit" text="Atur dokumen dan approval untuk cuti sakit." icon="○"/><Feature title="Cuti Khusus" text="Buat kebijakan untuk kebutuhan khusus perusahaan." icon="☆"/></div>}
  </BranchPage>;
}

function PayrollModule({type,employees,attendance}:{type:MenuKey;employees:Karyawan[];attendance:Absensi[]}) {
  const [tab,setTab]=useState(type==='payroll-components'?'components':type==='payroll-overtime'?'overtime':type==='payslip'?'payslip':'period');
  const items=[{key:'period',label:'Periode Payroll',icon:'◷'},{key:'process',label:'Proses Payroll',icon:'▶'},{key:'register',label:'Payroll Register',icon:'▤'},{key:'components',label:'Komponen Gaji',icon:'≡'},{key:'overtime',label:'Payroll Lembur',icon:'↗'},{key:'payslip',label:'Slip Gaji',icon:'▥'}];
  const total=employees.reduce((s,k)=>s+Number(k.gaji_pokok||0),0); const overtime=attendance.reduce((s,a)=>s+Number(a.lembur_menit||0),0);
  return <BranchPage title={items.find(x=>x.key===tab)?.label||'Payroll'} desc="Kelola periode, komponen, perhitungan, approval, lembur, dan slip gaji." items={items} active={tab} onChange={setTab} action={tab==='process'?'▶ Proses Payroll':tab==='components'?'＋ Tambah Komponen':tab==='payslip'?'⇩ Export Slip':'＋ Tambah'}>
    {['period','process','register'].includes(tab) && <><div className="stat-grid"><Stat title="Gaji Pokok" value={money(total)} hint={`${employees.length} karyawan`} icon="Rp"/><Stat title="Lembur" value={`${Math.floor(overtime/60)}j ${overtime%60}m`} hint="Akumulasi" icon="↗"/><Stat title="Status" value={tab==='process'?'Siap Diproses':'Draft'} hint="Periode berjalan" icon="◷"/><Stat title="Pembayaran" value="Jumat" hint="Hari gajian" icon="✓"/></div><div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Karyawan</th><th>ID</th><th>Gaji Pokok</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{employees.map(k=><tr key={k.id}><td><b>{k.nama}</b></td><td>{k.id_karyawan||'-'}</td><td>{money(Number(k.gaji_pokok||0))}</td><td><Status value={tab==='process'?'Ready':'Draft'}/></td><td><button className="link-btn" onClick={()=>setTab('payslip')}>Lihat Slip →</button></td></tr>)}</tbody></table></div></div></>}
    {tab==='components' && <div className="feature-grid"><Feature title="Gaji Pokok" text="Komponen dasar sesuai master karyawan." icon="Rp"/><Feature title="Tunjangan" text="Transport, makan, jabatan, dan tunjangan lainnya." icon="＋"/><Feature title="Potongan" text="BPJS, pajak, kasbon, dan potongan lain." icon="−"/></div>}
    {tab==='overtime' && <div className="panel"><div className="empty-module"><div className="empty-icon">↗</div><h3>Perhitungan Payroll Lembur</h3><p>Total lembur tercatat {Math.floor(overtime/60)} jam {overtime%60} menit. Detail tarif dapat diatur pada komponen payroll.</p><button className="primary">Konfigurasi Tarif Lembur</button></div></div>}
    {tab==='payslip' && <div className="report-grid">{employees.slice(0,12).map(k=><div className="report-card" key={k.id}><span>SLIP GAJI</span><h3>{k.nama}</h3><b>{money(Number(k.gaji_pokok||0))}</b><p>{k.id_karyawan||'Tanpa ID'}</p><button className="primary">Preview Slip →</button></div>)}</div>}
  </BranchPage>;
}

function TalentModule({type,employees}:{type:MenuKey;employees:Karyawan[]}) {
  const [tab,setTab]=useState(type==='kpi'?'targets':type==='recruitment'?'vacancies':type==='candidates'?'pipeline':'period');
  const items=[{key:'period',label:'Periode Performance',icon:'◷'},{key:'reviews',label:'Penilaian',icon:'◎'},{key:'targets',label:'KPI & Target',icon:'◎'},{key:'vacancies',label:'Lowongan',icon:'♧'},{key:'pipeline',label:'Pipeline Kandidat',icon:'♙'},{key:'interviews',label:'Interview',icon:'▤'}];
  return <BranchPage title={items.find(x=>x.key===tab)?.label||'Talent'} desc="Kelola performance, KPI, recruitment, kandidat, dan interview." items={items} active={tab} onChange={setTab} action="＋ Tambah">
    {tab==='period' && <div className="feature-grid"><Feature title="Periode Penilaian" text="Buat periode review tahunan, semester, atau bulanan." icon="◷"/><Feature title="Cycle" text="Atur tahapan self review, supervisor, dan final review." icon="↗"/><Feature title="Kalender" text="Pantau deadline penilaian seluruh workforce." icon="▤"/></div>}
    {tab==='reviews' && <div className="panel"><div className="empty-module"><div className="empty-icon">◎</div><h3>Penilaian Karyawan</h3><p>{employees.length} karyawan tersedia untuk proses performance review.</p><button className="primary">Mulai Penilaian</button></div></div>}
    {tab==='targets' && <div className="feature-grid"><Feature title="KPI Individu" text="Target per karyawan dan periode." icon="◎"/><Feature title="KPI Departemen" text="Target berbasis fungsi dan departemen." icon="▦"/><Feature title="Pencapaian" text="Pantau progress target secara berkala." icon="↗"/></div>}
    {tab==='vacancies' && <div className="feature-grid"><Feature title="Lowongan Aktif" text="Buat dan kelola posisi yang sedang dibuka." icon="♧"/><Feature title="Tahapan Recruitment" text="Atur screening, interview, test, hingga offering." icon="▤"/><Feature title="Sumber Kandidat" text="Pantau asal kandidat dan efektivitas channel." icon="◎"/></div>}
    {['pipeline','interviews'].includes(tab) && <div className="panel"><div className="empty-module"><div className="empty-icon">♙</div><h3>{tab==='pipeline'?'Pipeline Kandidat':'Interview Kandidat'}</h3><p>Belum ada kandidat. Workflow recruitment sudah tersedia dan dapat disambungkan ke tabel kandidat.</p><button className="primary">＋ Tambah Kandidat</button></div></div>}
  </BranchPage>;
}

function Reports({employees,attendance,exportCsv}:{employees:Karyawan[];attendance:Absensi[];exportCsv:(r:Record<string,unknown>[],f:string)=>void}) {
  const [tab,setTab]=useState('overview');
  const items=[{key:'overview',label:'Analytics',icon:'▥'},{key:'attendance',label:'Laporan Absensi',icon:'◷'},{key:'payroll',label:'Laporan Payroll',icon:'Rp'},{key:'people',label:'Laporan Karyawan',icon:'♙'}];
  const reports=[['Master Karyawan',employees,'laporan-karyawan.csv'],['Absensi',attendance,'laporan-absensi.csv']] as const;
  return <BranchPage title={items.find(x=>x.key===tab)?.label||'Laporan'} desc="Laporan operasional HR dan export data." items={items} active={tab} onChange={setTab}>
    {tab==='overview' && <div className="report-grid">{reports.map(([name,data,file])=><div className="report-card" key={name}><span>REPORT</span><h3>{name}</h3><b>{data.length}</b><p>record tersedia</p><button className="primary" onClick={()=>exportCsv(data as unknown as Record<string,unknown>[],file)}>Export CSV</button></div>)}</div>}
    {tab==='attendance' && <div className="panel"><div className="empty-module"><div className="empty-icon">◷</div><h3>Laporan Absensi</h3><p>{attendance.length} record absensi tersedia.</p><button className="primary" onClick={()=>exportCsv(attendance as unknown as Record<string,unknown>[],'laporan-absensi.csv')}>Export Absensi</button></div></div>}
    {tab==='payroll' && <div className="panel"><div className="empty-module"><div className="empty-icon">Rp</div><h3>Laporan Payroll</h3><p>Ringkasan payroll berdasarkan master karyawan.</p><button className="primary">Buka Payroll →</button></div></div>}
    {tab==='people' && <div className="panel"><div className="empty-module"><div className="empty-icon">♙</div><h3>Laporan Karyawan</h3><p>{employees.length} karyawan terdaftar dalam workforce master.</p><button className="primary" onClick={()=>exportCsv(employees as unknown as Record<string,unknown>[],'laporan-karyawan.csv')}>Export Karyawan</button></div></div>}
  </BranchPage>;
}

function Settings() {
  const [tab,setTab]=useState('company');
  const items=[{key:'company',label:'Perusahaan',icon:'▦'},{key:'work',label:'Jam Kerja',icon:'◷'},{key:'attendance',label:'Absensi',icon:'✓'},{key:'leave',label:'Cuti',icon:'◌'},{key:'overtime',label:'Lembur',icon:'↗'},{key:'payroll',label:'Payroll',icon:'Rp'}];
  const labels:Record<string,string>={company:'Profil Perusahaan',work:'Jam Kerja',attendance:'Aturan Absensi',leave:'Kebijakan Cuti',overtime:'Aturan Lembur',payroll:'Pengaturan Payroll'};
  return <BranchPage title={labels[tab]} desc="Konfigurasi kebijakan dan parameter utama HRIS." items={items} active={tab} onChange={setTab} action="Simpan Perubahan"><div className="panel form-panel"><div className="form-grid"><label>Nama Pengaturan<input value={labels[tab]} readOnly/></label><label>Status<input value="Aktif" readOnly/></label><label className="full-span">Deskripsi<input value={`Konfigurasi ${labels[tab]} MoonHR`} readOnly/></label></div></div></BranchPage>;
}

function Roles() { const [tab,setTab]=useState('roles'); const items=[{key:'roles',label:'Daftar Role',icon:'♙'},{key:'permissions',label:'Permission',icon:'✓'},{key:'users',label:'User Access',icon:'◎'}]; return <BranchPage title={items.find(x=>x.key===tab)?.label||'Role & Permission'} desc="Atur siapa yang boleh melihat dan mengelola modul HRIS." items={items} active={tab} onChange={setTab} action="＋ Tambah"><div className="panel"><div className="table-wrap"><table><thead><tr><th>Role</th><th>Akses</th><th>Deskripsi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{['Super Admin','Admin HR','Supervisor','Karyawan'].map((r,i)=><tr key={r}><td><b>{r}</b></td><td>{i===0?'Semua modul':i===1?'People, Attendance, Payroll':'Modul sesuai kewenangan'}</td><td>Role bawaan MoonHR</td><td><Status value="Aktif"/></td><td><button className="link-btn">Kelola →</button></td></tr>)}</tbody></table></div></div></BranchPage>; }

function Audit() { const [tab,setTab]=useState('all'); const items=[{key:'all',label:'Semua Aktivitas',icon:'◉'},{key:'login',label:'Login',icon:'↪'},{key:'changes',label:'Perubahan Data',icon:'✎'}]; return <BranchPage title={items.find(x=>x.key===tab)?.label||'Audit Log'} desc="Jejak aktivitas administrator dan perubahan data." items={items} active={tab} onChange={setTab}><div className="panel"><div className="empty-module"><div className="empty-icon">◉</div><h3>{tab==='login'?'Riwayat Login':tab==='changes'?'Perubahan Data':'Audit Trail'}</h3><p>Aktivitas akan tampil setelah audit_logs aktif dan transaksi mulai tercatat.</p><button className="primary">Refresh Log</button></div></div></BranchPage>; }

function Info({label,value}:{label:string;value:string}) { return <div className="info-box"><span>{label}</span><b>{value}</b></div>; }

function Status({value}:{value:string}) { const v=value.toLowerCase(); const cls=v.includes('non')||v.includes('sakit')?'red':v.includes('terlambat')||v.includes('draft')?'orange':v.includes('izin')?'blue':'green'; return <span className={`status ${cls}`}>{value}</span>; }
function Empty({cols}:{cols:number}) { return <tr><td colSpan={cols} className="empty-cell">Belum ada data.</td></tr>; }
function fieldLabel(k:string) { return ({id_karyawan:'ID Karyawan',nama:'Nama Lengkap',jabatan:'Jabatan',email:'Email',no_telp:'No. Telepon',departemen:'Departemen',tanggal_masuk:'Tanggal Masuk',gaji_pokok:'Gaji Pokok'} as Record<string,string>)[k] || k; }
