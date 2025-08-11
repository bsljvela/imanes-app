import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import localforage from 'localforage';
import Cropper from 'react-easy-crop';
import './PreviewCheckout.css';
import { printMagnetsPdf } from '../../utils/printMagnetsPdf';

const LS_KEY = 'magnetOrder';

const genId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ---- Helpers: blobURL desde IndexedDB ----
async function getBlobUrl(storeKey) {
  try {
    if (!storeKey) return null;
    const blob = await localforage.getItem(storeKey);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

// ---- Helpers: crear imagen desde URL ----
function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// ---- Helper: generar blob recortado a partir de píxeles ----
async function getCroppedBlob(imageSrc, cropPixels, mime = 'image/jpeg', quality = 0.92) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  ctx.drawImage(
    image,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, cropPixels.width, cropPixels.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

// helpers locales para convertir a DataURL
async function blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });
}

async function getItemDataURLFromStores(item) {
  // 1) IndexedDB (storeKey)
  if (item.storeKey) {
    const blob = await localforage.getItem(item.storeKey);
    if (blob) return await blobToDataURL(blob);
  }
  // 2) Fallback: desde la url actual (blob: o remota)
  if (item.url) {
    const resp = await fetch(item.url);
    const blob = await resp.blob();
    return await blobToDataURL(blob);
  }
  return null;
}

export default function PreviewCheckout() {
  const navigate = useNavigate();
  const [required, setRequired] = useState(0);
  const [price, setPrice] = useState(0);
  // items: { id, name, storeKey, originalKey?, thumb?, url }
  const [items, setItems] = useState([]);
  const urlsRef = useRef([]);

  // Editor (react-easy-crop)
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedAreaPct, setCroppedAreaPct] = useState(null); // porcentajes
  const [initialAreaPct, setInitialAreaPct] = useState(null); // para initialCroppedAreaPercentages

  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');


  // Bloquear scroll del body en esta pantalla
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev || ''; };
  }, []);

  // Cargar orden + reconstruir URLs + asegurar originalKey
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) { navigate('/order'); return; }

      try {
        const payload = JSON.parse(raw);
        setRequired(payload.required || 0);
        setPrice(payload.price || 0);

        const refs = Array.isArray(payload.images) ? payload.images : [];

        const withUrls = await Promise.all(
          refs.map(async (ref) => {
            let url = await getBlobUrl(ref.storeKey);
            if (!url && ref.thumb) url = ref.thumb;
            return { ...ref, url };
          })
        );

        if (cancelled) return;

        // Asegurar originalKey (si falta, la igualamos a storeKey y persistimos)
        const updated = [];
        const needsSave = [];
        withUrls.forEach((ref) => {
          if (!ref.originalKey && ref.storeKey) {
            ref.originalKey = ref.storeKey;
            needsSave.push({ id: ref.id, originalKey: ref.originalKey });
          }
          updated.push(ref);
        });

        if (needsSave.length) {
          try {
            const raw2 = localStorage.getItem(LS_KEY);
            if (raw2) {
              const payload2 = JSON.parse(raw2);
              (payload2.images || []).forEach((imgRef) => {
                const found = needsSave.find((n) => n.id === imgRef.id);
                if (found) imgRef.originalKey = found.originalKey;
              });
              localStorage.setItem(LS_KEY, JSON.stringify(payload2));
            }
          } catch { }
        }

        // Limpieza de blobURLs previos
        urlsRef.current.forEach(u => u && u.startsWith('blob:') && URL.revokeObjectURL(u));
        urlsRef.current = updated.map(i => i.url).filter(u => u && u.startsWith('blob:'));

        setItems(updated);
      } catch {
        navigate('/order');
      }
    }

    load();

    return () => {
      cancelled = true;
      urlsRef.current.forEach(u => u && u.startsWith('blob:') && URL.revokeObjectURL(u));
      urlsRef.current = [];
    };
  }, [navigate]);

  const selectedCount = items.filter(i => !!i.url).length;
  const allGood = useMemo(() => selectedCount === required, [selectedCount, required]);

  // Abrir editor con recorte inicial guardado en porcentajes (y resetear zoom a 1)
  const openEditor = (idx) => {
    const it = items[idx];
    if (!it || !it.url) return;

    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const payload = JSON.parse(raw);
        const saved = payload.cropMap?.[it.id];

        // Reiniciar SIEMPRE el zoom a 1 (tu requerimiento)
        setZoom(1);

        // Mantener posición/área con porcentajes si existían
        setCrop(saved?.crop ?? { x: 0, y: 0 });
        setInitialAreaPct(saved?.areaPct || null);
      } else {
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setInitialAreaPct(null);
      }
    } catch {
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setInitialAreaPct(null);
    }

    setEditingIdx(idx);
    setEditorOpen(true);
  };

  // react-easy-crop entrega ambas: porcentajes y píxeles
  const onCropComplete = (areaPct, areaPx) => {
    setCroppedAreaPct(areaPct);       // porcentajes -> para restaurar
    setCroppedAreaPixels(areaPx);     // píxeles -> para generar el blob
  };

  // Guardar recorte (nuevo blob a IndexedDB, actualizar url/storeKey y persistir crop)
  const handleSaveCrop = async () => {
    const idx = editingIdx;
    const it = items[idx];
    if (!it || !it.url || !croppedAreaPixels) {
      setEditorOpen(false);
      return;
    }

    const blob = await getCroppedBlob(it.url, croppedAreaPixels, 'image/jpeg', 0.92);
    const storeKey = `cropped-${genId()}-${it.id}`;
    await localforage.setItem(storeKey, blob);
    const newUrl = URL.createObjectURL(blob);

    // Limpieza del blobURL anterior si aplicaba
    if (it.url && it.url.startsWith('blob:')) {
      try { URL.revokeObjectURL(it.url); } catch { }
    }

    const next = [...items];
    next[idx] = { ...it, url: newUrl, storeKey };
    setItems(next);

    // Persistir crop (con porcentajes) + nuevo storeKey
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const payload = JSON.parse(raw);
        if (!payload.cropMap) payload.cropMap = {};
        payload.cropMap[it.id] = {
          crop,
          zoom,                 // lo guardamos por si en el futuro quisieras restaurarlo
          area: croppedAreaPixels,
          areaPct: croppedAreaPct,
        };
        const i = (payload.images || []).findIndex(r => r.id === it.id);
        if (i >= 0) payload.images[i].storeKey = storeKey;
        localStorage.setItem(LS_KEY, JSON.stringify(payload));
      }
    } catch { }

    setEditorOpen(false);
  };

  // Restaurar una imagen a su originalKey
  async function handleRestoreAt(idx) {
    const it = items[idx];
    if (!it || !it.originalKey) return;

    const blob = await localforage.getItem(it.originalKey);
    if (!blob) {
      alert('No se encontró el original en el almacenamiento.');
      return;
    }

    const newUrl = URL.createObjectURL(blob);
    if (it.url && it.url.startsWith('blob:')) {
      try { URL.revokeObjectURL(it.url); } catch { }
    }

    const next = [...items];
    next[idx] = { ...it, url: newUrl, storeKey: it.originalKey };
    setItems(next);

    // limpiar cualquier crop guardado y restablecer referencia
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const payload = JSON.parse(raw);
        if (payload.cropMap && payload.cropMap[it.id]) {
          delete payload.cropMap[it.id];
        }
        const i = (payload.images || []).findIndex(r => r.id === it.id);
        if (i >= 0) payload.images[i].storeKey = it.originalKey;
        localStorage.setItem(LS_KEY, JSON.stringify(payload));
      }
    } catch { }
  }

  const handlePay = () => {
    alert(`Añadidas ${selectedCount}/${required}. Total: $${total.toFixed(2)}`);
    // navigate('/checkout');
  };

  async function handleDownloadPdf() {
    const photoUrls = items.map(it => it?.url).filter(Boolean);
    console.log(photoUrls)
    await printMagnetsPdf(photoUrls, {
      orderId: '10010',
      website: 'www.yoursite.com',
      autoPrint: true, // pon true si quieres abrir el diálogo de impresión automático
    });
  }

  // carga cupón guardado
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      if (payload.coupon) setCoupon(payload.coupon);
    } catch { }
  }, []);

  // persiste cupón cuando cambia
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      payload.coupon = coupon || null;
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch { }
  }, [coupon]);

  // catálogo simple de cupones (ejemplos)
  const COUPONS = {
    DESC50: { type: 'flat', value: 50, label: '$50 de descuento' },
    DESC10: { type: 'percent', value: 10, label: '10% de descuento' },
    ENVIOFREE: { type: 'shipping', value: 1, label: 'Envío gratis' },
  };

  // costos
  const SHIPPING = 89;                    // ajusta a tu tarifa
  const subtotal = price;                 // el pack ya te da el precio
  const discount = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.type === 'flat') return coupon.value;
    if (coupon.type === 'percent') return (subtotal * coupon.value) / 100;
    if (coupon.type === 'shipping') return SHIPPING; // envío gratis
    return 0;
  }, [coupon, subtotal]);

  const total = Math.max(0, subtotal + SHIPPING - discount);

  function applyCoupon() {
    setCouponError('');
    const code = (couponInput || '').trim().toUpperCase();
    if (!code) return;

    const c = COUPONS[code];
    if (!c) {
      setCouponError('Código inválido');
      return;
    }
    setCoupon({ code, ...c });
    setCouponOpen(false);
    setCouponInput('');
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponError('');
  }

  return (
    <section className="pc-wrapper">
      {/* Galería IZQUIERDA (click = abrir editor) */}
      <div className="pc-grid pc-grid--with-footer">
        {items.map((it, idx) => (
          <figure
            key={it.id}
            className="pc-cell"
            onClick={() => openEditor(idx)}
          >
            {it.url ? (
              <>
                <img src={it.url} alt={it.name || 'foto'} />
                {/* sombreado fuera de la guía */}
                <div className="pc-hole" aria-hidden />
              </>
            ) : (
              <div className="pc-missing">Sin vista previa</div>
            )}
          </figure>
        ))}
      </div>

      {/* Panel DERECHA (lo dejé como lo tenías) */}
      <aside className="pc-panel">
        <div className="pc-panel-head">
          <h2>Vista previa</h2>
          <button
            className="pc-close"
            onClick={() => navigate('/select-photos')}
            title="Volver a selección"
          >
            <X />
          </button>
        </div>

        <p className="pc-muted small">
          Revisa cómo se verán tus imanes. La línea punteada indica el área imprimible (1:1).
        </p>

        <div className="pc-tip">
          <div className="pc-tip-icon grid" />
          <div className="pc-tip-text">
            <strong>{selectedCount}</strong> imágenes se adaptaron al formato cuadrado.
          </div>
        </div>

        <div className="pc-tip">
          <div className="pc-tip-icon bleed" />
          <div className="pc-tip-text">
            El área <em>fuera</em> de la guía envolverá los bordes del imán. Mantén lo importante dentro.
          </div>
        </div>
      </aside>

      <div className="pc-summary">
        <div className="pc-row">
          <span>Productos ({selectedCount})</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        <div className="pc-row">
          <span>Envío</span>
          <span>${SHIPPING.toFixed(2)}</span>
        </div>

        {!coupon && !couponOpen && (
          <button
            className="pc-link"
            type="button"
            onClick={() => setCouponOpen(true)}
          >
            Ingresar código de cupón
          </button>
        )}

        {!coupon && couponOpen && (
          <div className="pc-coupon-line">
            <input
              className="pc-coupon-input"
              placeholder="CUPÓN DE DESCUENTO"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
            />
            <button className="pc-btn primary pc-coupon-btn" type="button" onClick={applyCoupon}>
              Aplicar
            </button>
          </div>
        )}

        {couponError && <div className="pc-error">{couponError}</div>}

        {coupon && (
          <div className="pc-row">
            <span className="small">
              Cupón <strong>{coupon.code}</strong> – {coupon.label}{' '}
              <br />
              <button className="pc-link small" onClick={removeCoupon} type="button">
                Quitar
              </button>
            </span>
            <span>- ${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="pc-row pc-total-line">
          <span>Total</span>
          <span className="pc-total-amount">${total.toFixed(2)}</span>
        </div>

        <button
          className="pc-pay-btn"
          // onClick={handlePay}
          onClick={handleDownloadPdf}
          disabled={!allGood}
        >
          Pagar
        </button>
      </div>

      {/* Overlay del editor (react-easy-crop) */}
      {editorOpen && editingIdx !== null && items[editingIdx]?.url && (
        <div className="pc-editor-overlay" onClick={() => setEditorOpen(false)}>
          <div className="pc-editor" onClick={(e) => e.stopPropagation()}>
            <div className="pc-editor-crop">
              <Cropper
                image={items[editingIdx].url}
                crop={crop}
                zoom={zoom}
                aspect={1}
                showGrid={false}
                restrictPosition={true}
                zoomWithScroll={true}
                minZoom={1}
                maxZoom={5}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                initialCroppedAreaPercentages={initialAreaPct || undefined}
              />
            </div>

            <div className="pc-editor-actions">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label className="small">Zoom</label>
                <input
                  className="pc-zoom"
                  type="range"
                  min={1}
                  max={5}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                />
              </div>

              <div className="pc-editor-buttons" style={{ display: 'flex', gap: 10 }}>
                {items[editingIdx]?.originalKey && (
                  <button
                    className="pc-btn secondary"
                    onClick={async () => { await handleRestoreAt(editingIdx); setEditorOpen(false); }}
                  >
                    Restaurar original
                  </button>
                )}
                <button className="pc-btn danger" onClick={() => setEditorOpen(false)}>Cancelar</button>
                <button className="pc-btn primary" onClick={handleSaveCrop}>Guardar recorte</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
