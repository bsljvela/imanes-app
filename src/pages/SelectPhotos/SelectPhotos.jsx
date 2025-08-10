import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SelectPhotos.css";
import {
  X,
  UploadCloud,
  Images,
  Facebook,
  Instagram,
  Cloud,
  ImagePlus,
  Trash2,
  Crop,
} from "lucide-react";
import localforage from "localforage";

const LS_KEY = "magnetOrder";

// Guarda el archivo original (Blob) y regresa una key
async function saveBlob(file) {
  const key = `img-${crypto.randomUUID()}`;
  await localforage.setItem(key, file);
  return key;
}

// Genera un thumbnail liviano para guardar en localStorage
async function makeThumb(file, max = 320) {
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ratio = img.width / img.height;
  if (img.width >= img.height) {
    canvas.width = max;
    canvas.height = Math.round(max / ratio);
  } else {
    canvas.height = max;
    canvas.width = Math.round(max * ratio);
  }
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

// Carga el Blob y devuelve un objectURL
async function loadPreviewUrl(key) {
  const blob = await localforage.getItem(key);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

// Borra el blob original
async function deleteBlob(key) {
  await localforage.removeItem(key);
}

// Modal de conexión (mock)
function ConnectModal({ open, provider, onClose, onContinue }) {
  if (!open) return null;
  const pretty =
    provider === "google"
      ? "Google Photos"
      : provider === "dropbox"
        ? "Dropbox"
        : provider === "facebook"
          ? "Facebook"
          : provider === "instagram"
            ? "Instagram"
            : "Servicio";

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Conectar con {pretty}</h3>
        <p className="sp-muted">
          Esta es una demo. La conexión real requiere OAuth/API del proveedor.
        </p>
        <div className="sp-modal-actions">
          <button className="sp-btn ghost" onClick={onClose}>
            Cancelar
          </button>
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
  const [images, setImages] = useState([]);
  const [connecting, setConnecting] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Cargar desde localStorage e IndexedDB
  useEffect(() => {
    const load = async () => {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) {
        navigate("/order");
        setHydrated(true);
        return;
      }
      try {
        const payload = JSON.parse(raw);
        setRequired(payload.required || 0);
        setPrice(payload.price || 0);

        const refs = Array.isArray(payload.images) ? payload.images : [];
        const withPreviews = await Promise.all(
          refs.map(async (ref) => {
            const previewUrl = ref.storeKey ? await loadPreviewUrl(ref.storeKey) : null;
            // ⬇️ conservamos originalKey si viene del preview
            return { ...ref, previewUrl, originalKey: ref.originalKey || ref.storeKey };
          })
        );
        setImages(withPreviews);
      } catch {
        navigate("/order");
      } finally {
        setHydrated(true);
      }
    };
    load();
  }, [navigate]);

  // Guardar sólo referencias y thumbs
  useEffect(() => {
    if (!hydrated) return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw);
      const refs = images.map(({ id, name, storeKey, thumb, originalKey }) => ({
        id,
        name,
        storeKey,
        thumb,
        originalKey,
      }));
      payload.images = refs;
      payload.images = refs;
      payload.updatedAt = Date.now();
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error("Error guardando en localStorage:", err);
    }
  }, [images, hydrated]);

  // Limpieza de ObjectURLs
  useEffect(() => {
    return () => {
      images.forEach(
        (it) => it.previewUrl && URL.revokeObjectURL(it.previewUrl)
      );
    };
  }, [images]);

  const remaining = useMemo(
    () => Math.max(required - images.length, 0),
    [required, images.length]
  );
  const canAddMore = remaining > 0;

  const openPicker = () => inputRef.current?.click();

  const addFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) =>
      f.type?.startsWith("image/")
    );
    const room = Math.max(0, required - images.length);
    if (room <= 0) return;

    const toTake = files.slice(0, room);
    const items = [];
    for (const f of toTake) {
      const storeKey = await saveBlob(f);
      const previewUrl = URL.createObjectURL(f);
      const thumb = await makeThumb(f);
      items.push({
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        storeKey,
        originalKey: storeKey, // ⬅️ clave original
        previewUrl,
        thumb,
      });
    }
    setImages((prev) => [...prev, ...items]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canAddMore) return;
    addFiles(e.dataTransfer.files);
  };

  const removeIdx = (idx) => {
    setImages((prev) => {
      const item = prev[idx];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item?.storeKey) deleteBlob(item.storeKey);
      if (item?.originalKey && item.originalKey !== item.storeKey) {
        deleteBlob(item.originalKey);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };


  const handleAddToCart = () => {
    navigate("/checkout-preview");
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <ConnectModal
        open={!!connecting}
        provider={connecting}
        onClose={() => setConnecting(null)}
        onContinue={() => {
          setConnecting(null);
          openPicker();
        }}
      />

      <section className="sp-wrapper">
        <aside className="sp-sidebar">
          <button className="sp-side-item active" onClick={openPicker}>
            <Images size={18} /> Archivos locales
          </button>
          <button
            className="sp-side-item"
            onClick={() => setConnecting("google")}
          >
            <Cloud size={18} /> Google Photos
          </button>
          <button
            className="sp-side-item"
            onClick={() => setConnecting("dropbox")}
          >
            <Cloud size={18} /> Dropbox
          </button>
          <button
            className="sp-side-item"
            onClick={() => setConnecting("facebook")}
          >
            <Facebook size={18} /> Facebook
          </button>
          <button
            className="sp-side-item"
            onClick={() => setConnecting("instagram")}
          >
            <Instagram size={18} /> Instagram
          </button>
        </aside>

        <main
          className="sp-main"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className={`sp-dropzone ${isDragging ? "highlight" : ""}`}>
            <UploadCloud size={40} />
            <h2>Arrastra y suelta tus fotos</h2>
            <p className="sp-muted">
              Necesitas <b>{required}</b> fotos — seleccionadas: {images.length}
            </p>
            <button
              className="sp-btn primary"
              onClick={openPicker}
              disabled={!canAddMore}
            >
              <ImagePlus size={16} />
              <span style={{ marginLeft: 8 }}>
                {canAddMore
                  ? "Subir desde celular o PC"
                  : "Límite alcanzado"}
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

        <aside className="sp-preview">
          <div className="sp-preview-head">
            <h3>Selección</h3>
            <button
              className="sp-icon-btn"
              onClick={() => navigate("/order")}
              title="Cerrar"
            >
              <X />
            </button>
          </div>
          <div className="sp-thumbs-wrapper">
            <div className="sp-thumbs">
              {images.map((img, idx) => (
                <div className="sp-thumb" key={img.id}>
                  <button
                    className="sp-thumb-remove"
                    onClick={() => removeIdx(idx)}
                  >
                    <Trash2 size={16} />
                  </button>
                  <img
                    src={img.previewUrl || img.thumb}
                    alt={img.name}
                    onClick={() => { }}
                  />
                  <div className="sp-thumb-actions">
                    <button
                      className="sp-btn tiny"
                      onClick={() => { }}
                    >
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
            >
              Agregar al carrito
            </button>
          </div>
        </aside>
      </section>
    </>
  );
}
