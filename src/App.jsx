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
        <AppRoutes />
      </main>

      <Newsletter />
      <Footer />

      {/* <OrderCreator /> */}
    </BrowserRouter>
  )

}

export default App;
