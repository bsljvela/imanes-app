import React from 'react';
import './HowItWorks.css';
import { UploadCloud, ShoppingCart, Truck } from 'lucide-react'; // opcional

const steps = [
  {
    icon: <UploadCloud size={40} />,
    title: '1. Sube tus fotos',
    text:
      'Sube tus fotos desde tu celular o computadora. Puedes recortar, ajustar y previsualizar antes de enviarlas.',
  },
  {
    icon: <ShoppingCart size={40} />,
    title: '2. Realiza tu pedido',
    text:
      'Cuando estés conforme con tus fotos, agrégalas al carrito, completa tus datos de envío y confirma el pedido.',
  },
  {
    icon: <Truck size={40} />,
    title: '3. Rastrea tu orden',
    text:
      'Imprimimos, cortamos y empacamos tus imanes. Recibirás un correo con tu número de seguimiento.',
  },
];

export default function HowItWorks() {
  return (
    <section className="hiw-section">
      <h2 className="hiw-title">Cómo Funciona</h2>

      <div className="hiw-grid">
        {steps.map((s, i) => (
          <div key={i} className="hiw-item">
            <div className="hiw-icon">{s.icon}</div>
            <h3 className="hiw-step-title">{s.title}</h3>
            <p className="hiw-step-text">{s.text}</p>

            {/* Separador vertical sólo en desktop (entre items) */}
            {i < steps.length - 1 && <div className="hiw-separator" aria-hidden />}
          </div>
        ))}
      </div>
    </section>
  );
}
