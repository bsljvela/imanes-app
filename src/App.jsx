import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes.jsx';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Newsletter from './components/Newsletter/Newsletter';

function App() {
  return (
    <BrowserRouter>

      <Header />

      <main>
        {/* <img
          src="/public/image1.jpeg"
          alt="Background"
          style={{ width: '100%', height: '150vh', objectFit: 'cover' }}
        /> */}
        <AppRoutes />
      </main>

      <Newsletter />
      <Footer />

      {/* <OrderCreator /> */}
    </BrowserRouter>
  )

}

export default App;
