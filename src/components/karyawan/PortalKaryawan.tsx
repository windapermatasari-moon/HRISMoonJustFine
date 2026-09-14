import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';

interface Karyawan {
  id: string;
  id_karyawan: string;
  nama: string;
  jabatan: string;
  email?: string;
  pin?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  bulan?: string;
  tahun_lahir?: string;
  gaji_pokok?: number;
  nik_ktp?: string;
  nama_ibu_kandung?: string;
  no_telp?: string;
  alamat_rumah?: string;
  nama_rekening?: string;
  no_rekening?: string;
}

export default function PortalKaryawan() {
  const [subView, setSubView] = useState<'login' | 'daftar_kry' | 'daftar_adm' | 'lupa' | 'dashboard_kry' | 'slip_gaji'>('login');
  const [daftarKaryawan, setDaftarKaryawan] = useState<Karyawan[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [karyawanLogin, setKaryawanLogin] = useState<Karyawan | null>(null);

  const [regId, setRegId] = useState('');
  const [regNama, setRegNama] = useState('');
  const [regJabatan, setRegJabatan] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regTempatLahir, setRegTempatLahir] = useState('');
  const [regTanggalLahir, setRegTanggalLahir] = useState('');
  const [regBulanLahir, setRegBulanLahir] = useState('');
  const [regTahunLahir, setRegTahunLahir] = useState('');
  
  const [regNik, setRegNik] = useState('');
  const [regIbu, setRegIbu] = useState('');
  const [regTelp, setRegTelp] = useState('');
  const [regAlamat, setRegAlamat] = useState('');
  const [regBank, setRegBank] = useState('');
  const [regNoRek, setRegNoRek] = useState('');

  const [loading, setLoading] = useState(false);
  const [lupaEmail, setLupaEmail] = useState('');

  const [lokasiUser, setLokasiUser] = useState('Mendeteksi GPS...');
  const [fotoSnapshot, setFotoSnapshot] = useState<string | null>(null);
  const [jenisAbsen, setJenisAbsen] = useState<'Masuk' | 'Pulang'>('Masuk');
  const [statusAbsen, setStatusAbsen] = useState('Hadir');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchKaryawan();
  }, []);

  useEffect(() => {
    if (karyawanLogin && subView === 'dashboard_kry') {
      startCamera();
      ambilGPS();
    } else {
      stopCamera();
    }
  }, [karyawanLogin, subView]);

  const fetchKaryawan = async () => {
    const { data } = await supabase.from('karyawan').select('*').order('nama');
    if (data) setDaftarKaryawan(data);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.log("Play error:", err));
      }
    } catch (err) {
      console.error("Gagal akses kamera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const ambilFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL('image/jpeg');
        setFotoSnapshot(dataURL);
        alert('Foto selfie berhasil diambil!');
      }
    }
  };

  const ambilGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLokasiUser(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`),
        () => setLokasiUser('Izin GPS ditolak')
      );
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const kry = daftarKaryawan.find(k => k.id === selectedId);
    if (!kry) {
      alert('Pilih nama karyawan.');
      return;
    }
    if (inputPin === (kry.pin || '1234')) {
      setKaryawanLogin(kry);
      setSubView('dashboard_kry');
    } else {
      alert('PIN atau Password salah!');
    }
  };

  const handleDaftarKaryawan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regId || !regNama || !regJabatan || !regEmail || !regPin || !regTempatLahir || !regTanggalLahir || !regBulanLahir || !regTahunLahir) {
      alert('Semua kolom utama wajib diisi!');
      return;
    }
    if (!regEmail.includes('@gmail.com')) {
      alert('Gunakan alamat Gmail yang valid.');
      return;
    }

    const { data: existing } = await supabase.from('karyawan').select('*').or(`email.eq.${regEmail},nama.eq.${regNama}`);
    if (existing && existing.length > 0) {
      alert('Pendaftaran ditolak! Nama atau Email tersebut sudah terdaftar.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('karyawan').insert([
      { 
        id_karyawan: regId, 
        nama: regNama, 
        jabatan: regJabatan, 
        email: regEmail, 
        pin: regPin, 
        tempat_lahir: regTempatLahir,
        tanggal_lahir: regTanggalLahir,
        bulan: regBulanLahir,
        tahun_lahir: regTahunLahir,
        nik_ktp: regNik,
        nama_ibu_kandung: regIbu,
        no_telp: regTelp,
        alamat_rumah: regAlamat,
        nama_rekening: regBank,
        no_rekening: regNoRek,
        gaji_pokok: 4500000 
      }
    ]);
    setLoading(false);
    if (error) {
      alert('Gagal daftar: ' + error.message);
    } else {
      alert('Registrasi akun karyawan berhasil!');
      fetchKaryawan();
      setSubView('login');
    }
  };

  const handleDaftarAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNama || !regEmail || !regPin || !regTempatLahir || !regTanggalLahir || !regBulanLahir || !regTahunLahir) {
      alert('Semua kolom wajib diisi!');
      return;
    }
    if (!regEmail.includes('@gmail.com')) {
      alert('Gunakan alamat Gmail yang valid.');
      return;
    }

    const { data: existing } = await supabase.from('karyawan').select('*').or(`email.eq.${regEmail},nama.eq.${regNama}`);
    if (existing && existing.length > 0) {
      alert('Pendaftaran Admin ditolak! Nama atau Email sudah terdaftar.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('karyawan').insert([
      { 
        id_karyawan: 'ADM-' + Math.floor(1000 + Math.random() * 9000), 
        nama: regNama, 
        jabatan: 'Administrator HR', 
        email: regEmail, 
        pin: regPin,
        tempat_lahir: regTempatLahir,
        tanggal_lahir: regTanggalLahir,
        bulan: regBulanLahir,
        tahun_lahir: regTahunLahir,
        nik_ktp: regNik,
        nama_ibu_kandung: regIbu,
        no_telp: regTelp,
        alamat_rumah: regAlamat,
        nama_rekening: regBank,
        no_rekening: regNoRek,
        gaji_pokok: 8000000 
      }
    ]);
    setLoading(false);
    if (error) {
      alert('Gagal daftar Admin: ' + error.message);
    } else {
      alert('Akun Admin berhasil didaftarkan!');
      fetchKaryawan();
      setSubView('login');
    }
  };

  const handleLupaPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lupaEmail || !lupaEmail.includes('@gmail.com')) {
      alert('Masukkan Gmail yang valid.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(lupaEmail, { redirectTo: window.location.origin });
    setLoading(false);
    if (error) {
      alert('Gagal mengirim pemulihan: ' + error.message);
    } else {
      alert(`Instruksi pemulihan telah dikirim ke: ${lupaEmail}`);
      setSubView('login');
    }
  };

  const handleKirimAbsen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!karyawanLogin) return;
    if (!fotoSnapshot) {
      alert('Harap ambil foto selfie terlebih dahulu!');
      return;
    }

    const now = new Date();
    const tanggalHariIni = now.toLocaleDateString('id-ID');
    const jamSekarang = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const { data: existingData } = await supabase
      .from('absensi')
      .select('*')
      .eq('karyawan_id', karyawanLogin.id)
      .eq('tanggal', tanggalHariIni)
      .single();

    if (jenisAbsen === 'Masuk') {
      if (existingData) {
        alert('Anda sudah melakukan Absen Masuk hari ini.');
        return;
      }
      const { error } = await supabase.from('absensi').insert([{
        karyawan_id: karyawanLogin.id,
        id_karyawan: karyawanLogin.id_karyawan || '-',
        nama: karyawanLogin.nama,
        jabatan: karyawanLogin.jabatan,
        tanggal: tanggalHariIni,
        jam_masuk: jamSekarang,
        jam_pulang: '-',
        total_jam: 'Sedang Berjalan',
        status: statusAbsen,
        lokasi: lokasiUser,
        foto: fotoSnapshot
      }]);
      if (error) alert('Gagal absen masuk: ' + error.message);
      else alert('Absen Masuk berhasil dicatat secara realtime!');
    } else {
      if (!existingData) {
        alert('Anda belum melakukan Absen Masuk hari ini.');
        return;
      }

      const jamMasukStr = existingData.jam_masuk;
      let totalJamStr = '0 Jam';
      try {
        const [hM, mM] = jamMasukStr.split(':').map(Number);
        const [hP, mP] = jamSekarang.split(':').map(Number);
        const selisihMenit = (hP * 60 + mP) - (hM * 60 + mM);
        if (selisihMenit > 0) {
          const jam = Math.floor(selisihMenit / 60);
          const menit = selisihMenit % 60;
          totalJamStr = `${jam} Jam ${menit} Menit`;
        }
      } catch {
        totalJamStr = 'hitung otomatis';
      }

      const { error } = await supabase.from('absensi').update({
        jam_pulang: jamSekarang,
        total_jam: totalJamStr,
        foto: fotoSnapshot
      }).eq('id', existingData.id);

      if (error) alert('Gagal absen pulang: ' + error.message);
      else alert(`Absen Pulang berhasil dicatat! Total Kerja: ${totalJamStr}`);
    }

    setFotoSnapshot(null);
  };

  const handleDownloadSlip = () => {
    if (!karyawanLogin) return;
    const slipWindow = window.open('', '', 'height=600,width=800');
    if (!slipWindow) return;
    const gaji = karyawanLogin.gaji_pokok || 4500000;
    const html = `
      <html>
        <head><title>Slip Gaji - ${karyawanLogin.nama}</title></head>
        <body style="font-family: Arial; padding: 30px;">
          <h2 style="text-align: center; color: #0f172a;">PT. MOONLIGHT INDONESIA</h2>
          <h3 style="text-align: center; color: #3b82f6;">SLIP GAJI RESMI KARYAWAN</h3>
          <hr/>
          <p><b>Nama:</b> ${karyawanLogin.nama}</p>
          <p><b>Jabatan:</b> ${karyawanLogin.jabatan}</p>
          <p><b>NIK KTP:</b> ${karyawanLogin.nik_ktp || '-'}</p>
          <p><b>No Telepon:</b> ${karyawanLogin.no_telp || '-'}</p>
          <p><b>Alamat Rumah:</b> ${karyawanLogin.alamat_rumah || '-'}</p>
          <p><b>Rekening:</b> ${karyawanLogin.nama_rekening || '-'} (${karyawanLogin.no_rekening || '-'})</p>
          <hr/>
          <p><b>Gaji Pokok:</b> Rp ${gaji.toLocaleString('id-ID')}</p>
          <p><b>Tunjangan & Kinerja:</b> Rp 500.000</p>
          <p><b>Total Pendapatan:</b> <span style="color: green; font-weight: bold;">Rp ${(gaji + 500000).toLocaleString('id-ID')}</span></p>
          <br/><br/>
          <p style="text-align: right;">HRD Manager PT. Moonlight Indonesia</p>
        </body>
      </html>
    `;
    slipWindow.document.write(html);
    slipWindow.document.close();
    slipWindow.focus();
    setTimeout(() => slipWindow.print(), 500);
  };

  const handleLogout = () => {
    stopCamera();
    setKaryawanLogin(null);
    setSelectedId('');
    setInputPin('');
    setSubView('login');
  };

  return (
    <div style={{ background: 'rgba(20, 15, 30, 0.85)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255, 183, 197, 0.25)', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', color: '#fff' }}>
      {subView === 'login' && !karyawanLogin && (
        <div>
          <h2 style={{ color: '#fff', marginBottom: '16px' }}>👤 Login Karyawan / Admin</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px' }}>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }}>
              <option value="">-- Pilih Nama Pengguna --</option>
              {daftarKaryawan.map(k => <option key={k.id} value={k.id}>{k.nama} ({k.jabatan})</option>)}
            </select>
            <input type="password" maxLength={6} placeholder="PIN / Password..." value={inputPin} onChange={e => setInputPin(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <button type="submit" style={{ background: '#f472b6', color: '#0f172a', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Masuk Portal</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '6px' }}>
              <span onClick={() => setSubView('daftar_kry')} style={{ color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold' }}>Daftar Karyawan</span>
              <span onClick={() => setSubView('daftar_adm')} style={{ color: '#4ade80', cursor: 'pointer', fontWeight: 'bold' }}>Daftar Admin</span>
              <span onClick={() => setSubView('lupa')} style={{ color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}>Lupa PIN?</span>
            </div>
          </form>
        </div>
      )}

      {subView === 'daftar_kry' && (
        <div>
          <h2 style={{ color: '#fff', marginBottom: '16px' }}>✍️ Pendaftaran Akun Karyawan</h2>
          <form onSubmit={handleDaftarKaryawan} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px' }}>
            <input type="text" placeholder="ID Karyawan / NIP..." value={regId} onChange={e => setRegId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <input type="text" placeholder="Nama Lengkap..." value={regNama} onChange={e => setRegNama(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <input type="text" placeholder="Jabatan..." value={regJabatan} onChange={e => setRegJabatan(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <input type="text" placeholder="NIK KTP..." value={regNik} onChange={e => setRegNik(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <input type="text" placeholder="Nama Ibu Kandung..." value={regIbu} onChange={e => setRegIbu(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <input type="text" placeholder="Nomor Telepon..." value={regTelp} onChange={e => setRegTelp(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <input type="text" placeholder="Alamat Rumah..." value={regAlamat} onChange={e => setRegAlamat(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" placeholder="Nama Bank" value={regBank} onChange={e => setRegBank(e.target.value)} style={{ width: '50%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
              <input type="text" placeholder="No Rekening" value={regNoRek} onChange={e => setRegNoRek(e.target.value)} style={{ width: '50%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            </div>
            <input type="text" placeholder="Tempat Lahir..." value={regTempatLahir} onChange={e => setRegTempatLahir(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" placeholder="Tgl (1-31)" value={regTanggalLahir} onChange={e => setRegTanggalLahir(e.target.value)} style={{ width: '30%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
              <select value={regBulanLahir} onChange={e => setRegBulanLahir(e.target.value)} style={{ width: '40%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }}>
                <option value="">Bulan</option>
                <option value="Januari">Januari</option>
                <option value="Februari">Februari</option>
                <option value="Maret">Maret</option>
                <option value="April">April</option>
                <option value="Mei">Mei</option>
                <option value="Juni">Juni</option>
                <option value="Juli">Juli</option>
                <option value="Agustus">Agustus</option>
                <option value="September">September</option>
                <option value="Oktober">Oktober</option>
                <option value="November">November</option>
                <option value="Desember">Desember</option>
              </select>
              <input type="text" placeholder="Tahun" value={regTahunLahir} onChange={e => setRegTahunLahir(e.target.value)} style={{ width: '30%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            </div>
            <input type="email" placeholder="Alamat Gmail..." value={regEmail} onChange={e => setRegEmail(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <input type="password" maxLength={6} placeholder="Buat PIN (6 Digit)..." value={regPin} onChange={e => setRegPin(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <button type="submit" disabled={loading} style={{ background: '#34d399', color: '#0f172a', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? 'Menyimpan...' : 'Daftar Karyawan'}</button>
            <span onClick={() => setSubView('login')} style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>← Kembali ke Login</span>
          </form>
        </div>
      )}

      {subView === 'daftar_adm' && (
        <div>
          <h2 style={{ color: '#fff', marginBottom: '16px' }}>✍️ Pendaftaran Akun Admin</h2>
          <form onSubmit={handleDaftarAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px' }}>
            <input type="text" placeholder="Nama Lengkap Admin..." value={regNama} onChange={e => setRegNama(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <input type="text" placeholder="NIK KTP..." value={regNik} onChange={e => setRegNik(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <input type="text" placeholder="Nomor Telepon..." value={regTelp} onChange={e => setRegTelp(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <input type="text" placeholder="Alamat Rumah..." value={regAlamat} onChange={e => setRegAlamat(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <input type="text" placeholder="Tempat Lahir..." value={regTempatLahir} onChange={e => setRegTempatLahir(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" placeholder="Tgl (1-31)" value={regTanggalLahir} onChange={e => setRegTanggalLahir(e.target.value)} style={{ width: '30%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
              <select value={regBulanLahir} onChange={e => setRegBulanLahir(e.target.value)} style={{ width: '40%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }}>
                <option value="">Bulan</option>
                <option value="Januari">Januari</option>
                <option value="Februari">Februari</option>
                <option value="Maret">Maret</option>
                <option value="April">April</option>
                <option value="Mei">Mei</option>
                <option value="Juni">Juni</option>
                <option value="Juli">Juli</option>
                <option value="Agustus">Agustus</option>
                <option value="September">September</option>
                <option value="Oktober">Oktober</option>
                <option value="November">November</option>
                <option value="Desember">Desember</option>
              </select>
              <input type="text" placeholder="Tahun" value={regTahunLahir} onChange={e => setRegTahunLahir(e.target.value)} style={{ width: '30%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            </div>
            <input type="email" placeholder="Alamat Gmail Admin..." value={regEmail} onChange={e => setRegEmail(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <input type="password" placeholder="Password / PIN Admin..." value={regPin} onChange={e => setRegPin(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <button type="submit" disabled={loading} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? 'Menyimpan...' : 'Daftar Admin ke Database'}</button>
            <span onClick={() => setSubView('login')} style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>← Kembali ke Login</span>
          </form>
        </div>
      )}

      {subView === 'lupa' && (
        <div>
          <h2 style={{ color: '#fff', marginBottom: '16px' }}>🔄 Pemulihan PIN via Gmail</h2>
          <form onSubmit={handleLupaPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px' }}>
            <input type="email" placeholder="Masukkan Gmail terdaftar..." value={lupaEmail} onChange={e => setLupaEmail(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }} />
            <button type="submit" disabled={loading} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Kirim Pemulihan</button>
            <span onClick={() => setSubView('login')} style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>← Kembali ke Login</span>
          </form>
        </div>
      )}

      {karyawanLogin && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ color: '#fff', margin: 0 }}>Halo, {karyawanLogin.nama}</h2>
            <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Keluar (Logout)</button>
          </div>
          <p style={{ fontSize: '13px', color: '#cbd5e1' }}>Lokasi GPS: <strong>{lokasiUser}</strong></p>
          
          <div style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
            <button onClick={() => setSubView('dashboard_kry')} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Absensi & Selfie</button>
            <button onClick={() => setSubView('slip_gaji')} style={{ background: '#34d399', color: '#0f172a', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Unduh Slip Gaji</button>
          </div>

          {subView === 'dashboard_kry' && (
            <form onSubmit={handleKirimAbsen} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '360px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#fff' }}>Jenis Absen:</label>
                <select value={jenisAbsen} onChange={e => setJenisAbsen(e.target.value as 'Masuk' | 'Pulang')} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }}>
                  <option value="Masuk">🟢 Absen Masuk</option>
                  <option value="Pulang">🔴 Absen Pulang</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#fff' }}>Status Kehadiran:</label>
                <select value={statusAbsen} onChange={e => setStatusAbsen(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,23,42,0.8)', color: '#fff' }}>
                  <option value="Hadir">Hadir</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                </select>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.3)' }}>
                <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', color: '#fff' }}>📸 Foto Selfie Kehadiran:</p>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '140px', background: '#000', borderRadius: '8px', objectFit: 'cover' }} />
                {fotoSnapshot && <p style={{ color: '#34d399', fontSize: '12px', fontWeight: 'bold', margin: '6px 0' }}>✔ Foto Siap Disimpan</p>}
                <button type="button" onClick={ambilFoto} style={{ marginTop: '8px', background: '#38bdf8', color: '#0f172a', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Ambil Foto Selfie</button>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <button type="submit" style={{ background: '#34d399', color: '#0f172a', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Kirim Absen Sekarang</button>
            </form>
          )}

          {subView === 'slip_gaji' && (
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', maxWidth: '400px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#fff' }}>Slip Gaji Bulanan</h3>
              <p style={{ fontSize: '14px', color: '#cbd5e1' }}>Gaji Pokok: Rp {(karyawanLogin.gaji_pokok || 4500000).toLocaleString('id-ID')}</p>
              <button onClick={handleDownloadSlip} style={{ background: '#34d399', color: '#0f172a', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Download Slip Gaji (PDF)</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
