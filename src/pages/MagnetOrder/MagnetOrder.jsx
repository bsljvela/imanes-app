import React, { useMemo, useEffect, useState } from 'react';
import './MagnetOrder.css';
import { CircleDollarSign, Flag, ImageUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HowItWorks from '../../components/HowItWorks/HowItWorks';

const PACKS = [
  { magnets: 9, price: 250 },
  { magnets: 18, price: 475 },
  { magnets: 27, price: 700 },
];

const LS_KEY = 'magnetOrder';

export default function MagnetOrder() {
  const navigate = useNavigate();
  const [pack, setPack] = useState(PACKS[0]);
  const price = useMemo(() => pack.price, [pack]);

  // Si ya hay un payload guardado, recupera la cantidad y selecciona ese pack
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      const found = PACKS.find(p => p.magnets === saved.required);
      if (found) setPack(found);
    } catch { }
  }, []);

  const handleSelectPhotos = () => {
    const raw = localStorage.getItem(LS_KEY);

    // Cantidad/price seleccionados ahora
    const required = pack.magnets;
    const price = pack.price;

    // Lee estado previo (si existe)
    let prevRequired = null;
    let prevImages = [];
    if (raw) {
      try {
        const current = JSON.parse(raw);
        prevRequired = typeof current.required === 'number' ? current.required : null;
        prevImages = Array.isArray(current.images) ? current.images : [];
      } catch { }
    }

    // Si cambia la cantidad, confirma
    if (prevRequired !== null && prevRequired !== required) {
      const ok = window.confirm(
        `Actualmente tienes un pedido de ${prevRequired} imanes.\n¿Quieres cambiarlo a ${required} imanes?`
      );
      if (!ok) {
        // respeta el existente y solo navega
        return navigate('/select-photos');
      }
    }

    // Decide imágenes finales:
    // - Si sube la cantidad: conserva las existentes (no borrar)
    // - Si baja la cantidad: recorta a la nueva cantidad
    let finalImages = prevImages;
    if (prevRequired !== null && prevRequired !== required) {
      if (prevRequired > required) {
        finalImages = prevImages.slice(0, required); // recortar
      } else {
        finalImages = prevImages; // mantener (podrá agregar más en SelectPhotos)
      }
    }

    // Si no había payload previo, inicia vacío
    if (prevRequired === null) {
      finalImages = []; // empieza sin imágenes la primera vez
    }

    const payload = {
      required,
      price,
      images: finalImages,
      updatedAt: Date.now(),
    };

    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    navigate('/select-photos');
  };


  return (
    <>
      <section className="mo-wrapper">
        {/* Imagen */}
        <div className="mo-left" aria-hidden />

        {/* Formulario */}
        <div className="mo-right">
          <h1 className="mo-title">Imanes Fotográficos Personalizados</h1>

          <label className="mo-label">Elige tu paquete</label>
          <div className="mo-packs">
            {PACKS.map((p) => (
              <button
                key={p.magnets}
                type="button"
                className={`mo-pack ${p.magnets === pack.magnets ? 'active' : ''}`}
                onClick={() => setPack(p)}  // ⚠️ quitamos setFiles([])
              >
                {p.magnets} imanes
              </button>
            ))}
          </div>

          <div className="mo-priceBox">
            <div>Precio por {pack.magnets} imanes</div>
            <div className="mo-price">${price.toFixed(2)}</div>
          </div>

          <button type="button" className="mo-select" onClick={handleSelectPhotos}>
            <ImageUp size={18} />
            <span>Seleccionar fotos</span>
          </button>

          <ul className="mo-benefits">
            <li><CircleDollarSign size={18} /> Garantía de reembolso 100%</li>
            <li><Flag size={18} /> Hecho en México</li>
          </ul>
        </div>
      </section>

      {/* Detalles */}
      <div className="mo-details">
        <div className="mo-details-left">
          <h2>Alta calidad en imanes de fotos personalizados</h2>
          <p>
            Nos preocupamos por la calidad de nuestros productos y usamos los mejores materiales
            y tintas para imprimir imanes con tus fotos. Es un regalo ideal para cualquier ocasión.
          </p>

          <h2>Empresa familiar y hecho en México</h2>
          <p>
            Producimos imanes fotográficos desde 2024. Somos una empresa familiar orgullosa
            de fabricar y enviar desde México.
          </p>
        </div>

        <div className="mo-details-right">
          <h3>Especificaciones</h3>
          <ul>
            <li>Imanes cuadrados de 5×5 cm</li>
            <li>Paquetes de 9, 18 y 27 piezas</li>
            <li>Calidad fotográfica premium</li>
          </ul>
        </div>
      </div>

      <HowItWorks />
    </>
  );
}
