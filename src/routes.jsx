import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importación de tus páginas
import Products from './pages/Products';
import Reviews from './pages/Reviews';
import Shipping from './pages/Shipping';
import Wholesale from './pages/Wholesale/Wholesale';
import About from './pages/About';
import Contact from './pages/Contact/Contact';
import GiftCards from './pages/GiftCards';
import NotFound from './pages/NotFound/NotFound';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import Home from './pages/Home/Home'
import MagnetOrder from './pages/MagnetOrder/MagnetOrder';
import SelectPhotos from './pages/SelectPhotos/SelectPhotos';
import PreviewCheckout from './pages/PreviewCheckout/PreviewCheckout';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/shipping" element={<Shipping />} />
      <Route path="/wholesale" element={<Wholesale />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/gift-cards" element={<GiftCards />} />
      <Route path="*" element={<NotFound />} />

      <Route path="/order" element={<MagnetOrder />} />
      <Route path="/select-photos" element={<SelectPhotos />} />
      <Route path="/checkout-preview" element={<PreviewCheckout />} />

      <Route path="/account/login" element={<Login />} />
      <Route path="/account/register" element={<Register />} />
      <Route path="/account/forgot-password" element={<ForgotPassword />} />

    </Routes>
  );
};

export default AppRoutes;
