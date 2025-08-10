// src/components/Footer.jsx
import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-logo">
          <img src="/logo.png" alt="Printed Logo" />
        </div>

        <div className="footer-columns">
          <div className="footer-col">
            <h4>TIENDA</h4>
            <a href="#">Imanes</a>
            <a href="#">Opiniones</a>
            <a href="#">Mayoristas</a>
          </div>
          <div className="footer-col">
            <h4>NOSOTROS</h4>
            {/* <a href="#">Envíos</a> */}
            <a href="#">Acerca</a>
            <a href="#">Contacto</a>
            <a href="#">Regalos</a>
          </div>
          <div className="footer-col">
            <h4>SOCIAL</h4>
            <a href="#">Facebook</a>
            <a href="#">Instagram</a>
          </div>
          <div className="footer-col">
            <h4>SOBRE PRINTED</h4>
            <p>Imprimimos tus recuerdos desde 2023.<br />Con base en San Luis Río Colorado, México.</p>
            <p>contacto@printed.com</p>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;
