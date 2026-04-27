import { useEffect, useRef, useState } from 'react';
import { FiX, FiCamera, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { mockInventory } from '../services/api';

const CAPTURE_SIZE  = 128;
const GRID          = 4;
const CELL          = CAPTURE_SIZE / GRID;
const SCAN_INTERVAL = 900;     // scan every 0.9s
const WARMUP_MS     = 1200;    // shorter warmup
const CONFIRM_HITS  = 1;       // single confident match is enough
const AUTO_CONFIRM_THRESHOLD = 55;

export default function CameraScanner({ onItemDetected, onClose }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const timerRef   = useRef(null);
  const busyRef    = useRef(false);
  const streakRef  = useRef({ id: null, count: 0 });
  const prebuiltRef = useRef([]);

  const [phase,      setPhase]      = useState('init');
  const [status,     setStatus]     = useState('Starting camera…');
  const [topMatch,   setTopMatch]   = useState(null);   // {item, score}
  const [countdown,  setCountdown]  = useState(null);   // countdown before add
  const [photoCount, setPhotoCount] = useState(0);

  useEffect(() => {
    initCamera();
    return () => teardown();
  }, []);

  const teardown = () => {
    clearInterval(timerRef.current);
    busyRef.current = false;
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  /* ── Init camera & preload inventory histograms ── */
  const initCamera = async () => {
    const real = mockInventory.filter(p => p.image && p.image.startsWith('data:image'));
    setPhotoCount(real.length);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(r => { videoRef.current.onloadedmetadata = r; });
        await videoRef.current.play();
      }

      if (real.length === 0) {
        setPhase('no-photos');
        setStatus('No product photos found. Add photos in Inventory first.');
        return;
      }

      setStatus('Loading product photos…');
      const built = await buildAllFeatures(real);
      prebuiltRef.current = built;
      setPhotoCount(built.length);

      /* Wait for camera to autofocus, then start scanning */
      setPhase('warming');
      setStatus('Camera warming up… hold product in the frame.');
      setTimeout(() => {
        setPhase('scanning');
        setStatus('Scanning… hold product steady in the frame.');
        timerRef.current = setInterval(doScan, SCAN_INTERVAL);
      }, WARMUP_MS);

    } catch (e) {
      setStatus('Camera access denied. Please allow permissions.');
      setPhase('error');
    }
  };

  /* ── Core scan ── */
  const doScan = () => {
    if (busyRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    busyRef.current = true;

    canvas.width  = CAPTURE_SIZE;
    canvas.height = CAPTURE_SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);

    const frameFeatures = computeSpatialFeatures(ctx);
    const built = prebuiltRef.current;

    const scored = built
      .map(e => ({ item: e.item, score: compareFeatures(frameFeatures, e.features) }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    
    // Only show match card if it resembles something even slightly (e.g., >25%)
    if (best && best.score >= 25) {
      setTopMatch(best);
    } else {
      setTopMatch(null);
    }

    if (best && best.score >= AUTO_CONFIRM_THRESHOLD) {
      if (streakRef.current.id === best.item.id) {
        streakRef.current.count++;
      } else {
        streakRef.current = { id: best.item.id, count: 1 };
      }

      if (streakRef.current.count >= CONFIRM_HITS) {
        /* Confirmed — stop scanning, auto-add */
        clearInterval(timerRef.current);
        setPhase('confirmed');
        setStatus(`✅ ${best.item.name} — adding to cart…`);
        onItemDetected(best.item);
        setTimeout(() => onClose(), 1400);
      } else {
        setStatus(`Confirming: ${best.item.name} (${Math.round(best.score)}%) — hold steady…`);
      }
    } else {
      streakRef.current = { id: null, count: 0 };
      if (best && best.score >= 25) {
        setStatus(`Scanning… closest match: ${best.item.name} (${Math.round(best.score)}%)`);
      } else {
        setStatus('No Item Found');
      }
    }

    busyRef.current = false;
  };

  /* ── Feature extraction: 4×4 spatial grid in HSV ── */
  const computeSpatialFeatures = (ctx) => {
    const cells = [];
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const data = ctx.getImageData(gx * CELL, gy * CELL, CELL, CELL).data;
        cells.push(rgbaToHsvHistogram(data));
      }
    }
    return cells;
  };

  const buildAllFeatures = (items) =>
    Promise.all(items.map(item =>
      new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = CAPTURE_SIZE; c.height = CAPTURE_SIZE;
          const ctx = c.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
          const features = computeSpatialFeatures(ctx);
          resolve({ item, features });
        };
        img.onerror = () => resolve(null);
        img.src = item.image;
      })
    )).then(r => r.filter(Boolean));

  const rgbaToHsvHistogram = (data) => {
    const H = new Float32Array(16);
    const S = new Float32Array(8);
    const V = new Float32Array(8);
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]/255, g = data[i+1]/255, b = data[i+2]/255;
      const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
      let h = 0;
      if (d > 0) {
        if (max===r) h = ((g-b)/d + 6) % 6;
        else if (max===g) h = (b-r)/d + 2;
        else h = (r-g)/d + 4;
        h *= 60;
      }
      const s = max===0 ? 0 : d/max;
      H[Math.floor(h/22.5 ) % 16]++;
      S[Math.floor(s*7.99)]++;
      V[Math.floor(max*7.99)]++;
    }
    for (let i=0;i<16;i++) H[i]/=n;
    for (let i=0;i<8;i++) { S[i]/=n; V[i]/=n; }
    return { H, S, V };
  };

  const compareFeatures = (f1, f2) => {
    if (!f1||!f2||f1.length!==f2.length) return 0;
    let total = 0;
    for (let c=0;c<f1.length;c++) {
      total += bhatt(f1[c].H, f2[c].H)*0.6 + bhatt(f1[c].S, f2[c].S)*0.25 + bhatt(f1[c].V, f2[c].V)*0.15;
    }
    return (total / f1.length) * 100;
  };

  const bhatt = (h1, h2) => {
    let s=0;
    for (let i=0;i<h1.length;i++) s += Math.sqrt(h1[i]*h2[i]);
    return Math.min(s,1);
  };

  const resetAndRescan = () => {
    streakRef.current = { id: null, count: 0 };
    busyRef.current = false;
    clearInterval(timerRef.current);
    setTopMatch(null);
    setPhase('scanning');
    setStatus('Rescanning… hold product steady in the frame.');
    timerRef.current = setInterval(doScan, SCAN_INTERVAL);
  };

  /* Confidence bar color */
  const barColor = (pct) => pct >= AUTO_CONFIRM_THRESHOLD ? '#10b981' : pct > 30 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.92)',
      zIndex:9999, display:'flex', alignItems:'center',
      justifyContent:'center', padding:'20px'
    }}>
      <div style={{
        background:'var(--bg-card)', borderRadius:'20px',
        width:'100%', maxWidth:'440px', overflow:'hidden',
        boxShadow:'0 30px 80px rgba(0,0,0,0.7)'
      }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', background:'#0B3C5D' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <FiCamera size={18} color="#fff" />
            <div>
              <p style={{ margin:0, fontWeight:700, fontSize:'0.95rem', color:'#fff' }}>Smart Scanner</p>
              <p style={{ margin:0, fontSize:'0.68rem', color:'rgba(255,255,255,0.5)' }}>
                {photoCount} product photo{photoCount!==1?'s':''} · auto-detect & add
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', borderRadius:'8px', padding:'6px', cursor:'pointer', display:'flex' }}>
            <FiX size={17} />
          </button>
        </div>

        {/* Video */}
        <div style={{ position:'relative', background:'#000' }}>
          <video ref={videoRef} autoPlay playsInline muted
            style={{ width:'100%', maxHeight:'240px', objectFit:'cover', display:'block' }} />

          {/* Scanning frame overlay */}
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <div style={{
              width:'160px', height:'160px', borderRadius:'14px',
              border:`2.5px solid ${phase==='confirmed' ? '#10b981' : '#1F7A63'}`,
              boxShadow:`0 0 0 9999px rgba(0,0,0,0.42), 0 0 20px ${phase==='confirmed'?'#10b98155':'#1F7A6344'}`,
              transition:'border-color 0.3s, box-shadow 0.3s'
            }} />
          </div>

          {/* Scanning pulse */}
          {phase === 'scanning' && (
            <div style={{
              position:'absolute', top:'10px', left:'50%', transform:'translateX(-50%)',
              background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)',
              color:'#fff', fontSize:'0.7rem', fontWeight:600,
              padding:'4px 12px', borderRadius:'20px',
              display:'flex', alignItems:'center', gap:'6px'
            }}>
              <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#10b981', animation:'pdot 1.2s ease-in-out infinite' }} />
              Auto scanning…
            </div>
          )}

          {/* Confirmed overlay */}
          {phase === 'confirmed' && (
            <div style={{
              position:'absolute', inset:0, background:'rgba(16,185,129,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'3rem', backdropFilter:'blur(2px)'
            }}>✅</div>
          )}
        </div>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} style={{ display:'none' }} />

        {/* Status */}
        <div style={{ padding:'10px 18px', background:'var(--bg-glass)', borderTop:'1px solid var(--border-subtle)' }}>
          <p style={{ margin:0, fontSize:'0.8rem', color:'var(--text-secondary)', textAlign:'center' }}>{status}</p>
        </div>

        {/* Live best match card */}
        {topMatch && phase === 'scanning' && (
          <div style={{ padding:'12px 18px' }}>
            <p style={{ margin:'0 0 6px', fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px' }}>Current best match</p>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              {topMatch.item.image && (
                <img src={topMatch.item.image} alt="" style={{ width:'44px', height:'44px', objectFit:'cover', borderRadius:'8px', flexShrink:0 }} />
              )}
              <div style={{ flex:1 }}>
                <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)' }}>{topMatch.item.name}</p>
                <div style={{ height:'6px', background:'var(--border-subtle)', borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.round(topMatch.score)}%`, background: barColor(topMatch.score), transition:'width 0.5s ease' }} />
                </div>
                <p style={{ margin:'3px 0 0', fontSize:'0.7rem', color:'var(--text-muted)' }}>
                  {Math.round(topMatch.score)}% match · needs {AUTO_CONFIRM_THRESHOLD}% to auto-add
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No-photos warning */}
        {phase === 'no-photos' && (
          <div style={{ padding:'14px 18px', display:'flex', gap:'10px', alignItems:'flex-start' }}>
            <FiAlertCircle size={18} color="#f59e0b" style={{ flexShrink:0 }} />
            <p style={{ margin:0, fontSize:'0.8rem', color:'var(--text-muted)' }}>
              Go to <strong>Inventory → Add Item → Take Photo</strong> to capture product photos. Photo matching only works with camera-captured images.
            </p>
          </div>
        )}

        {/* Footer actions */}
        <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border-subtle)', display:'flex', gap:'8px' }}>
          {phase === 'scanning' && (
            <button className="btn btn-secondary" onClick={resetAndRescan}
              style={{ flex:1, display:'flex', gap:'6px', alignItems:'center', justifyContent:'center' }}>
              <FiRefreshCw size={13} /> Reset
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose} style={{ flex:1 }}>Cancel</button>
        </div>

        <div style={{ padding:'8px 18px', borderTop:'1px solid var(--border-subtle)', textAlign:'center' }}>
          <p style={{ margin:0, fontSize:'0.65rem', color:'var(--text-muted)' }}>
            Scans every 2s · 4×4 HSV spatial grid · Needs {CONFIRM_HITS} consecutive matches at {AUTO_CONFIRM_THRESHOLD}%+
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pdot {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.3;transform:scale(0.6)}
        }
      `}</style>
    </div>
  );
}
