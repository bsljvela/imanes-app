import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectPhotos.css';
import { X, UploadCloud, Images, Facebook, Instagram, Cloud, ImagePlus, Trash2, Crop } from 'lucide-react';
import localforage from 'localforage';

const LS_KEY = 'magnetOrder';

/* ========= localforage (IndexedDB) ========= */
const lf = localforage.createInstance({
  name: 'magnets',
  storeName: 'photos', // minúsculas, sin espacios
});

const genKey = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `k_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Guarda el archivo original (Blob) y regresa una key
async function saveBlob(file) {
  const key = `img-${genKey()}`;
  await lf.setItem(String(key), file); // fuerza string
  return key;
}

// Carga el Blob por key y crea un ObjectURL para previsualizar
async function loadPreviewUrl(key) {
  if (!key) return null;
  const blob = await lf.getItem(String(key));
  return blob ? URL.createObjectURL(blob) : null;
}

// Borra el blob
async function deleteBlob(key) {
  if (!key) return;
  await lf.removeItem(String(key));
}

// (quedó sin uso, la dejo por si la necesitas en otra parte)
const fileToDataURL = (file) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

/* ========= Modal mock ========= */
function ConnectModal({ open, provider, onClose, onContinue }) {
  if (!open) return null;
  const pretty =
    provider === 'google' ? 'Google Photos' :
      provider === 'dropbox' ? 'Dropbox' :
        provider === 'facebook' ? 'Facebook' :
          provider === 'instagram' ? 'Instagram' : 'Servicio';

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Conectar con {pretty}</h3>
        <p className="sp-muted">
          Esta es una demo. La conexión real requiere OAuth/API del proveedor.
        </p>
        <div className="sp-modal-actions">
          <button className="sp-btn ghost" onClick={onClose}>Cancelar</button>
          <button className="sp-btn primary" onClick={onContinue}>
            Continuar (usar archivos locales)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SelectPhotos() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [required, setRequired] = useState(0);
  const [price, setPrice] = useState(0);
  // cada imagen: { id, name, storeKey, previewUrl }
  const [images, setImages] = useState([]);
  const [connecting, setConnecting] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const onDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragEnd = () => setIsDragging(false);

  /* ========= Cargar desde localStorage + reconstruir previews ========= */
  useEffect(() => {
    const load = async () => {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) {
        navigate('/order');
        setHydrated(true);
        return;
      }
      try {
        const payload = JSON.parse(raw);
        setRequired(payload.required || 0);
        setPrice(payload.price || 0);

        const refs = Array.isArray(payload.images) ? payload.images : []; // [{id,name,storeKey}]
        // filtra refs inválidas y reconstruye previews desde IndexedDB
        const validRefs = refs.filter(
          (ref) => ref && typeof ref.storeKey === 'string' && ref.storeKey.length > 0
        );

        const withPreviews = await Promise.all(
          validRefs.map(async (ref) => {
            const previewUrl = await loadPreviewUrl(ref.storeKey);
            return { ...ref, previewUrl };
          })
        );
        setImages(withPreviews);
      } catch {
        navigate('/order');
      } finally {
        setHydrated(true);
      }
    };
    load();
  }, [navigate]);

  /* ========= Persistir SOLO metadatos en localStorage ========= */
  useEffect(() => {
    if (!hydrated) return;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      // guarda solo refs (ligero): id, name, storeKey
      const refs = images.map(({ id, name, storeKey }) => ({
        id,
        name,
        storeKey: String(storeKey || ''),
      }));
      payload.images = refs;
      payload.updatedAt = Date.now();
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error('Error guardando en localStorage:', err);
    }
  }, [images, hydrated]);

  /* ========= Revocar ObjectURLs al desmontar ========= */
  useEffect(() => {
    return () => {
      images.forEach((it) => it.previewUrl && URL.revokeObjectURL(it.previewUrl));
    };
  }, [images]);

  const remaining = useMemo(
    () => Math.max(required - images.length, 0),
    [required, images.length]
  );
  const canAddMore = remaining > 0;

  const openPicker = () => inputRef.current?.click();

  /* ========= Agregar archivos (guardar Blob en IndexedDB) ========= */
  const addFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type?.startsWith('image/'));

    const room = Math.max(0, required - images.length);
    if (room <= 0) return;

    const toTake = files.slice(0, room);

    const items = [];
    for (const f of toTake) {
      const storeKey = await saveBlob(f);          // guarda el blob original tal cual
      const previewUrl = URL.createObjectURL(f);   // preview inmediato
      items.push({
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        storeKey,                                   // SIEMPRE string
        previewUrl,
      });
    }

    setImages((prev) => [...prev, ...items]);
  };

  /* ========= Drag & Drop ========= */
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canAddMore) return;
    addFiles(e.dataTransfer.files);
  };

  /* ========= Eliminar ========= */
  const removeIdx = (idx) => {
    setImages((prev) => {
      const item = prev[idx];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item?.storeKey) deleteBlob(item.storeKey);
      return prev.filter((_, i) => i !== idx);
    });
  };

  /* ========= Continuar ========= */
  const handleAddToCart = () => {
    alert(`Se agregaron ${images.length} imanes (${required} requeridos). Precio: $${price.toFixed(2)}`);
    // aquí puedes navegar a /checkout o /cart
  };

  const handleConnect = (provider) => setConnecting(provider);
  const handleConnectContinue = () => {
    setConnecting(null);
    openPicker();
  };

  /* ========= Bloquear scroll del body en esta pantalla ========= */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow || '';
    };
  }, []);

  return (
    <>
      <ConnectModal
        open={!!connecting}
        provider={connecting}
        onClose={() => setConnecting(null)}
        onContinue={handleConnectContinue}
      />

      <section className="sp-wrapper">
        {/* Sidebar */}
        <aside className="sp-sidebar">
          <button className="sp-side-item active" onClick={openPicker}>
            <Images size={18} /> Archivos locales
          </button>
          <button className="sp-side-item" onClick={() => handleConnect('google')}>
            <Cloud size={18} /> Google Photos
          </button>
          <button className="sp-side-item" onClick={() => handleConnect('dropbox')}>
            <Cloud size={18} /> Dropbox
          </button>
          <button className="sp-side-item" onClick={() => handleConnect('facebook')}>
            <Facebook size={18} /> Facebook
          </button>
          <button className="sp-side-item" onClick={() => handleConnect('instagram')}>
            <Instagram size={18} /> Instagram
          </button>
        </aside>

        {/* Main (drop fijo) */}
        <main
          className="sp-main"
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
        >
          <div className={`sp-dropzone ${isDragging ? 'highlight' : ''}`}>
            <UploadCloud size={40} />
            <h2>Arrastra y suelta tus fotos</h2>
            <p className="sp-muted">
              Necesitas <b>{required}</b> fotos — seleccionadas: {images.length}
            </p>

            <button
              className="sp-btn primary"
              onClick={openPicker}
              disabled={!canAddMore}
              title={canAddMore ? 'Subir desde tu dispositivo' : 'Ya no puedes agregar más fotos'}
            >
              <ImagePlus size={16} />
              <span style={{ marginLeft: 8 }}>
                {canAddMore ? 'Subir desde celular o PC' : 'Límite alcanzado'}
              </span>
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
        </main>

        {/* Panel derecho con wrapper de thumbs y scroll interno */}
        <aside className="sp-preview">
          <div className="sp-preview-head">
            <h3>Selección</h3>
            <button className="sp-icon-btn" onClick={() => navigate('/order')} title="Cerrar">
              <X />
            </button>
          </div>

          <p className="sp-muted">Haz clic en una foto para editarla o recortarla.</p>

          {/* CONTENEDOR con altura flexible y scroll propio */}
          <div className="sp-thumbs-wrapper">
            <div className="sp-thumbs">
              {images.map((img, idx) => (
                <div className="sp-thumb" key={img.id}>
                  <button className="sp-thumb-remove" onClick={() => removeIdx(idx)} title="Quitar">
                    <Trash2 size={16} />
                  </button>

                  {/* Usa previewUrl (blob), no dataUrl */}
                  <img
                    src={img.previewUrl || ''}
                    alt={img.name}
                    onClick={() => setEditingIdx(idx)}
                  />

                  <div className="sp-thumb-actions">
                    <button className="sp-btn tiny" onClick={() => setEditingIdx(idx)}>
                      <Crop size={14} /> Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sp-footer">
            <div className="sp-counter">
              {images.length}/{required}
            </div>

            <button
              className="sp-btn primary wide"
              disabled={images.length !== required}
              onClick={handleAddToCart}
              title={images.length !== required ? `Selecciona ${required} fotos` : 'Agregar al carrito'}
            >
              Agregar al carrito
            </button>
          </div>
        </aside>
      </section>
    </>
  );
}
