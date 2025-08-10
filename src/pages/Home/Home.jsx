import React from 'react';
import './Home.css'
import { Link } from 'react-router-dom';
import ReviewCarousel from '../../components/ReviewCarousel/ReviewCarousel';

const Productos = () => {
  return (
    <div>
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Recuerdos Artesanales</h1>
          <p className="hero-subtitle">
            Imprime tus recuerdos de Instagram y del carrete de tu cámara en imanes cuadrados.
          </p>
          <Link to="/order" className="hero-button">
            Ordenar ahora <span className="arrow">→</span>
          </Link>
        </div>
      </section>

      <ReviewCarousel />

    </div>
  );
};

export default Productos;
