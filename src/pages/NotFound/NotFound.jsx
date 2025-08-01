import React from 'react';
import './NotFound.css';
import { Link } from 'react-router-dom';
import { ArrowLeftCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1>404</h1>
      <h2>Página no encontrada</h2>
      <p>Lo sentimos, la página que buscas no existe o ha sido movida.</p>
      <Link to="/" className="back-home">
        <ArrowLeftCircle size={20} />
        Volver al inicio
      </Link>
    </div>
  );
};

export default NotFound;
