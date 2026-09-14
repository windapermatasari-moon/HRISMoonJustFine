import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import './admin.css';

type Karyawan = {
  id: string; id_karyawan?: string; nama: string; jabatan?: string; email?: string;
  no_telp?: string; alamat_rumah?: string; gaji_pokok?: number; nik_ktp?: string;
};
type Absensi = {
  id: string; karyawan_id?: string; id_karyawan?: string; nama?: string; jabatan?: string;
  tanggal?: string; jam_masuk?: string; jam_pulang?: string; total_jam?: string;
  status?: string; lokasi?: string; foto?: string;
};

type Menu = 'overview' | 'employees' | 'attendance' | 'payroll' | 'reports' | 'settings';

const money = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const todayId = new Date().toLocaleDateString('id-ID');

export default function DashboardAdmin() {
  const [logged, setLogged] = useState(false);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [menu, setMenu] = useState<Menu>('overview');
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [attendance, setAttendance] = useState<Absensi[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebar, setSidebar] = useState(true);

  useEffect(() => { if (logged) refresh(); }, [logged]);

  async function refresh() {
    setLoading(true); setError('');
    const [k, a] = await Promise.all([
      supabase.from('karyawan').select('*').order('nama'),
      supabase.from('absensi').select('*').order('created_at', { ascending: false }).limit(1000)
    ]);
    if (k.error) setError(k.error.message); else setEmployees(k.data || []);
    if (a.error) setError(a.error.message); else setAttendance(a.data || []);
    setLoading(false);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    // Untuk produksi, pindahkan autentikasi admin ke Supabase Auth + role/RLS.
    if (email === 'admin' && pin === 'admin123') { setLogged(true); setLoading(false); return; }
    const { data, error: err } = await supabase.from('karyawan').select('*').eq('email', email).eq('pin', pin).limit(1).maybeSingle();
    setLoading(false);
    if (data && !err) setLogged(true); else setError('Email/PIN admin tidak valid.');
  }

  const filteredEmployees = useMemo(() => employees.filter(k => `${k.nama} ${k.id_karyawan || ''} ${k.jabatan || ''}`.toLowerCase().includes(search.toLowerCase())), [employees, search]);
  const filteredAttendance = useMemo(() => attendance.filter(a => `${a.nama || ''} ${a.id_karyawan || ''} ${a.status || ''}`.toLowerCase().includes(search.toLowerCase())), [attendance, search]);
  const today = attendance.filter(a => a.tanggal === todayId);
  const present = today.filter(a => ['Hadir','Tepat Waktu','Terlambat'].includes(a.status || 'Hadir')).length;
  const late = today.filter(a => (a.status || '').toLowerCase().includes('terlambat')).length;
  const absent = Math.max(employees.length - new Set(today.map(a => a.karyawan_id || a.id_karyawan)).size, 0);
  const payroll = employees.reduce((s, k) => s + Number(k.gaji_pokok || 0), 0);

  function exportCsv(rows: Record<string, unknown>[], filename: string) {
    if (!rows.length) return alert('Tidak ada data untuk diekspor.');
    const keys = Object.keys(rows[0]);
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [keys.join(';'), ...rows.map(r => keys.map(k => esc(r[k])).join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
  }

  async function deleteEmployee(k: Karyawan) {
    if (!confirm(`Hapus ${k.nama}? Tindakan ini permanen.`)) return;
    const { error: err } = await supabase.from('karyawan').delete().eq('id', k.id);
    if (err) alert(err.message); else refresh();
  }

  if (!logged) return <Login email={email} pin={pin} setEmail={setEmail} setPin={setPin} onSubmit={login} error={error} loading={loading} />;

  return <div className="talenta-shell">
    <aside className={`talenta-sidebar ${sidebar ? '' : 'collapsed'}`}>
      <div className="brand"><div className="brand-mark">M</div>{sidebar && <div><b>MoonHR</b><small>People Platform</small></div>}</div>
      <div className="workspace">{sidebar ? <><span>WORKSPACE</span><b>Moonjustfine by Tirta</b></> : '•••'}</div>
      <nav>
        <Nav icon="⌂" text="Overview" active={menu==='overview'} open={sidebar} onClick={()=>setMenu('overview')} />
        <Nav icon="♙" text="Karyawan" active={menu==='employees'} open={sidebar} onClick={()=>setMenu('employees')} badge={employees.length} />
        <Nav icon="◷" text="Absensi" active={menu==='attendance'} open={sidebar} onClick={()=>setMenu('attendance')} />
        <Nav icon="Rp" text="Payroll" active={menu==='payroll'} open={sidebar} onClick={()=>setMenu('payroll')} />
        <Nav icon="▤" text="Laporan" active={menu==='reports'} open={sidebar} onClick={()=>setMenu('reports')} />
      </nav>
      <div className="sidebar-bottom"><Nav icon="⚙" text="Pengaturan" active={menu==='settings'} open={sidebar} onClick={()=>setMenu('settings')} /><button className="logout" onClick={()=>setLogged(false)}>↪ {sidebar && 'Keluar'}</button></div>
    </aside>

    <main className="talenta-main">
      <header className="topbar"><button className="icon-btn" onClick={()=>setSidebar(!sidebar)}>☰</button><div className="crumb">{label(menu)}</div><div className="top-actions"><div className="search-global"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari karyawan, ID, menu..." /></div><button className="icon-btn">◌</button><div className="avatar">HR</div></div></header>
      <section className="page">
        {loading && <div className="loading">Memuat data…</div>}
        {error && <div className="alert">{error}</div>}
        {menu==='overview' && <Overview employees={employees} attendance={attendance} present={present} late={late} absent={absent} payroll={payroll} setMenu={setMenu} />}
        {menu==='employees' && <Employees data={filteredEmployees} onDelete={deleteEmployee} onExport={()=>exportCsv(employees as unknown as Record<string,unknown>[], 'database-karyawan.csv')} />}
        {menu==='attendance' && <Attendance data={filteredAttendance} onExport={()=>exportCsv(attendance as unknown as Record<string,unknown>[], 'laporan-absensi.csv')} />}
        {menu==='payroll' && <Payroll employees={employees} />}
        {menu==='reports' && <Reports employees={employees} attendance={attendance} exportCsv={exportCsv} />}
        {menu==='settings' && <Settings />}
      </section>
    </main>
  </div>;
}

function Nav({icon,text,active,open,onClick,badge}:{icon:string;text:string;active:boolean;open:boolean;onClick:()=>void;badge?:number}) { return <button className={`nav-item ${active?'active':''}`} onClick={onClick}><span className="nav-icon">{icon}</span>{open&&<><span>{text}</span>{badge!==undefined&&<em>{badge}</em>}</>}</button> }
function label(m:Menu){return ({overview:'Overview',employees:'Karyawan',attendance:'Absensi',payroll:'Payroll',reports:'Laporan',settings:'Pengaturan'})[m]}
function Login(p:{email:string;pin:string;setEmail:(v:string)=>void;setPin:(v:string)=>void;onSubmit:(e:React.FormEvent)=>void;error:string;loading:boolean}){return <div className="login-wrap"><div className="login-card"><div className="brand center"><div className="brand-mark">M</div><div><b>MoonHR</b><small>People Platform</small></div></div><h1>Selamat datang kembali</h1><p>Masuk ke dashboard HR & payroll Anda.</p><form onSubmit={p.onSubmit}><label>Email Admin<input type="email" value={p.email} onChange={e=>p.setEmail(e.target.value)} placeholder="admin@perusahaan.com" required /></label><label>PIN / Password<input type="password" value={p.pin} onChange={e=>p.setPin(e.target.value)} placeholder="••••••" required /></label>{p.error&&<div className="form-error">{p.error}</div>}<button className="primary full" disabled={p.loading}>{p.loading?'Memeriksa…':'Masuk ke Dashboard'}</button></form><small className="security-note">Untuk produksi, gunakan Supabase Auth dan RLS. Login demo lama masih didukung agar aplikasi tetap kompatibel.</small></div></div>}

function Overview({employees,attendance,present,late,absent,payroll,setMenu}:{employees:Karyawan[];attendance:Absensi[];present:number;late:number;absent:number;payroll:number;setMenu:(m:Menu)=>void}){const recent=attendance.slice(0,6); return <>
  <div className="page-heading"><div><h1>Selamat datang, HR 👋</h1><p>Ringkasan kondisi tenaga kerja dan aktivitas hari ini.</p></div><button className="primary" onClick={()=>setMenu('reports')}>＋ Buat laporan</button></div>
  <div className="stat-grid"><Stat title="Total Karyawan" value={employees.length.toString()} hint="Karyawan aktif" icon="♙"/><Stat title="Hadir Hari Ini" value={present.toString()} hint={`${late} terlambat`} icon="✓"/><Stat title="Belum Absen" value={absent.toString()} hint="Perlu ditindaklanjuti" icon="!"/><Stat title="Payroll Bulanan" value={money(payroll)} hint="Total gaji pokok" icon="Rp"/></div>
  <div className="content-grid"><div className="panel"><div className="panel-head"><div><h2>Aktivitas absensi terbaru</h2><p>Monitoring kehadiran secara real-time.</p></div><button className="link-btn" onClick={()=>setMenu('attendance')}>Lihat semua →</button></div><AttendanceMini rows={recent}/></div><div className="panel quick"><h2>Akses cepat</h2><p>Menu yang paling sering digunakan HR.</p><button onClick={()=>setMenu('employees')}>♙ Kelola karyawan <span>→</span></button><button onClick={()=>setMenu('attendance')}>◷ Rekap absensi <span>→</span></button><button onClick={()=>setMenu('payroll')}>Rp Kelola payroll <span>→</span></button></div></div>
 </>}
function Stat({title,value,hint,icon}:{title:string;value:string;hint:string;icon:string}){return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{title}</span><strong>{value}</strong><small>{hint}</small></div></div>}
function AttendanceMini({rows}:{rows:Absensi[]}){return <div className="table-wrap"><table><thead><tr><th>Karyawan</th><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Status</th></tr></thead><tbody>{rows.length?rows.map((a,i)=><tr key={a.id||i}><td><b>{a.nama||'-'}</b><small>{a.id_karyawan||''}</small></td><td>{a.tanggal||'-'}</td><td className="green">{a.jam_masuk||'-'}</td><td>{a.jam_pulang||'-'}</td><td><Status value={a.status||'Hadir'}/></td></tr>):<Empty cols={5}/>}</tbody></table></div>}
function Employees({data,onDelete,onExport}:{data:Karyawan[];onDelete:(k:Karyawan)=>void;onExport:()=>void}){return <><Heading title="Karyawan" desc="Kelola data tenaga kerja, jabatan, dan informasi payroll." action="＋ Tambah Karyawan"/><div className="toolbar"><div><b>{data.length}</b> karyawan ditemukan</div><button className="secondary" onClick={onExport}>⇩ Export CSV</button></div><div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Nama</th><th>ID Karyawan</th><th>Jabatan</th><th>Email</th><th>Gaji Pokok</th><th>Aksi</th></tr></thead><tbody>{data.length?data.map(k=><tr key={k.id}><td><div className="person"><div className="mini-avatar">{k.nama?.charAt(0)||'K'}</div><b>{k.nama}</b></div></td><td>{k.id_karyawan||'-'}</td><td>{k.jabatan||'-'}</td><td>{k.email||'-'}</td><td>{money(Number(k.gaji_pokok||0))}</td><td><button className="danger-text" onClick={()=>onDelete(k)}>Hapus</button></td></tr>):<Empty cols={6}/>}</tbody></table></div></div></>}
function Attendance({data,onExport}:{data:Absensi[];onExport:()=>void}){return <><Heading title="Absensi" desc="Pantau kehadiran, jam kerja, lokasi, dan selfie karyawan." action="⇩ Export" onAction={onExport}/><div className="filter-row"><span className="filter active">Semua</span><span className="filter">Hadir</span><span className="filter">Terlambat</span><span className="filter">Belum Pulang</span></div><div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Foto</th><th>Karyawan</th><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Total</th><th>Status</th><th>Lokasi</th></tr></thead><tbody>{data.length?data.map((a,i)=><tr key={a.id||i}><td>{a.foto?<img className="selfie" src={a.foto} />:<div className="selfie blank">—</div>}</td><td><b>{a.nama||'-'}</b><small>{a.id_karyawan||''}</small></td><td>{a.tanggal||'-'}</td><td className="green">{a.jam_masuk||'-'}</td><td>{a.jam_pulang||'-'}</td><td>{a.total_jam||'-'}</td><td><Status value={a.status||'Hadir'}/></td><td className="muted">{a.lokasi||'-'}</td></tr>):<Empty cols={8}/>}</tbody></table></div></div></>}
function Payroll({employees}:{employees:Karyawan[]}){const total=employees.reduce((s,k)=>s+Number(k.gaji_pokok||0),0);return <><Heading title="Payroll" desc="Ringkasan komponen gaji pokok berdasarkan database karyawan." action="Export Payroll"/><div className="stat-grid"><Stat title="Total Payroll" value={money(total)} hint="Gaji pokok" icon="Rp"/><Stat title="Karyawan" value={String(employees.length)} hint="Dalam database" icon="♙"/><Stat title="Rata-rata" value={money(employees.length?total/employees.length:0)} hint="Per karyawan" icon="∑"/><Stat title="Periode" value="Bulan berjalan" hint="Siap diproses" icon="◷"/></div><div className="panel table-panel"><div className="panel-head"><div><h2>Daftar payroll</h2><p>Data ini adalah ringkasan awal; komponen lembur/tunjangan perlu tabel payroll khusus.</p></div></div><div className="table-wrap"><table><thead><tr><th>Nama</th><th>ID</th><th>Jabatan</th><th>Gaji Pokok</th></tr></thead><tbody>{employees.map(k=><tr key={k.id}><td><b>{k.nama}</b></td><td>{k.id_karyawan||'-'}</td><td>{k.jabatan||'-'}</td><td>{money(Number(k.gaji_pokok||0))}</td></tr>)}</tbody></table></div></div></>}
function Reports({employees,attendance,exportCsv}:{employees:Karyawan[];attendance:Absensi[];exportCsv:(r:Record<string,unknown>[],f:string)=>void}){return <><Heading title="Laporan" desc="Export data operasional untuk pengolahan lanjutan."/><div className="report-grid"><ReportCard title="Database Karyawan" desc="Identitas dan data payroll karyawan." onClick={()=>exportCsv(employees as unknown as Record<string,unknown>[], 'database-karyawan.csv')}/><ReportCard title="Laporan Absensi" desc="Riwayat absensi, jam masuk/pulang, status dan lokasi." onClick={()=>exportCsv(attendance as unknown as Record<string,unknown>[], 'laporan-absensi.csv')}/><ReportCard title="Payroll" desc="Ringkasan gaji pokok seluruh karyawan." onClick={()=>exportCsv(employees.map(k=>({id:k.id_karyawan,nama:k.nama,jabatan:k.jabatan,gaji_pokok:k.gaji_pokok||0})), 'payroll.csv')}/></div></>}
function ReportCard({title,desc,onClick}:{title:string;desc:string;onClick:()=>void}){return <div className="report-card"><div className="report-icon">▤</div><h2>{title}</h2><p>{desc}</p><button className="secondary" onClick={onClick}>Download CSV →</button></div>}
function Settings(){return <><Heading title="Pengaturan" desc="Konfigurasi dasar aplikasi MoonHR."/><div className="panel settings"><h2>Keamanan</h2><p>Login admin saat ini masih memiliki fallback demo di frontend. Untuk deployment produksi, migrasikan admin ke Supabase Auth dan aktifkan Row Level Security.</p><div className="setting-row"><span>Supabase Auth</span><b className="pill warn">Perlu diaktifkan</b></div><div className="setting-row"><span>Row Level Security</span><b className="pill warn">Perlu dicek</b></div><div className="setting-row"><span>Audit log</span><b className="pill neutral">Belum tersedia</b></div></div></>}
function Heading({title,desc,action,onAction}:{title:string;desc:string;action?:string;onAction?:()=>void}){return <div className="page-heading"><div><h1>{title}</h1><p>{desc}</p></div>{action&&<button className="primary" onClick={onAction}>{action}</button>}</div>}
function Status({value}:{value:string}){const v=value.toLowerCase();const cls=v.includes('terlambat')?'late':v.includes('hadir')?'ok':'neutral';return <span className={`status ${cls}`}>{value}</span>}
function Empty({cols}:{cols:number}){return <tr><td colSpan={cols} className="empty">Belum ada data.</td></tr>}
