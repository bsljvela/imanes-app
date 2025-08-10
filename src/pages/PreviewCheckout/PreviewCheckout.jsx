import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import localforage from 'localforage';
import Cropper from 'react-easy-crop';
import './PreviewCheckout.css';

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

  const handleAddToCart = () => {
    alert(`Añadidas ${selectedCount}/${required}. Total: $${price.toFixed(2)}`);
    // navigate('/checkout');
  };

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
                <img src={it.url} alt={it.name || 'foto'} className="cover" />
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

        <div className="pc-count small">
          Seleccionadas <strong>{selectedCount}/{required}</strong>
        </div>

        <div className="pc-total small">
          Total estimado: <strong>${price.toFixed(2)}</strong>
        </div>
      </aside>

      {/* Footer móvil/tablet (informativo) */}
      <div className="pc-footer-bar">
        <div className="pc-footer-inner">
          <div className="pc-footer-info">
            <span className="pc-footer-title">Listo para imprimir</span>
            <span className="pc-footer-sub"> Revisa el recorte antes de continuar</span>
          </div>
        </div>
      </div>

      <button
        className="pc-add-to-cart"
        onClick={handleAddToCart}
        disabled={!allGood}
      >
        Pagar
      </button>

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
