import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importación de tus páginas
import Products from './pages/Products';
import Reviews from './pages/Reviews';
import Shipping from './pages/Shipping';
import Wholesale from './pages/Wholesale';
import About from './pages/About';
import Contact from './pages/Contact';
import GiftCards from './pages/GiftCards';
import NotFound from './pages/NotFound/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Products />} />
      <Route path="/products" element={<Products />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/shipping" element={<Shipping />} />
      <Route path="/wholesale" element={<Wholesale />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/gift-cards" element={<GiftCards />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
