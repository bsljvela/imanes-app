import React from 'react';
import './Newsletter.css'; // o usa Tailwind si ya estás con esa config

const Newsletter = () => {
  return (
    <section className="newsletter-section">
      <h2 className="newsletter-title">Boletín</h2>
      <h3 className="newsletter-subtitle">Sé el primero en enterarte 🔔</h3>
      <p className="newsletter-text">Recibe ofertas y actualizaciones directamente en tu bandeja de entrada.</p>

      <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          placeholder="Correo electrónico"
          required
          className="newsletter-input"
        />
        <button type="submit" className="newsletter-button">
          SUSCRIBIRSE
        </button>
      </form>
    </section>
  );
};

export default Newsletter;
