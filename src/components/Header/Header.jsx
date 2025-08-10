import React, { useState, useEffect } from 'react';
import './Header.css';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Define qué rutas deben usar fondo sólido desde el inicio, para hacer la transparencia en el Header
  const transparentBackgroundRoutes = ['/home', '/']; // puedes ajustar las rutas
  const isTransparent = transparentBackgroundRoutes.includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }, [menuOpen]);

  useEffect(() => {
    if (isTransparent) {
      document.body.classList.remove('no-image-page');
    } else {
      document.body.classList.add('no-image-page');
    }
  }, [isTransparent]);

  return (
    // <header className={`header ${scrolled ? 'scrolled' : ''}`}>
    <header className={`header ${scrolled ? 'scrolled' : ''} ${isTransparent ? '' : 'solid'}`}>
      <div className="header-inner">
        <div className="logo">❤️ printed</div>

        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          <Link to="/products">Productos</Link>
          <Link to="/reviews">Opiniones</Link>
          {/* <Link to="/shipping">Envíos</Link> */}
          <Link to="/wholesale">Mayoreo</Link>
          <Link to="/about">Nosotros</Link>
          <Link to="/contact">Contacto</Link>
          <Link to="/gift-cards">Tarjetas de Regalo</Link>
        </nav>

        <div className="icons">
          <Link to="/cart"><ShoppingCart className="icon cart" /></Link>
          <Link to="/account/login"><User className="icon user" /></Link>


          {menuOpen ? (
            <X className="close-btn" onClick={() => setMenuOpen(!menuOpen)} />
          ) : (
            <Menu className="hamburger" onClick={() => setMenuOpen(!menuOpen)} />
          )}
        </div>
      </div>
    </header >
  );
}

export default Header;
