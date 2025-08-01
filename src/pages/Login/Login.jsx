import React from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

function Login() {
  return (
    <div className="login-container">
      <h1 className="login-title">Iniciar sesión</h1>

      <div className="login-card">
        <form className="login-form">
          <label htmlFor="email">Correo electrónico</label>
          <input type="email" id="email" placeholder="Email" />

          <label htmlFor="password">Contraseña</label>
          <input type="password" id="password" placeholder="Contraseña" />

          <div className="login-actions">
            <button type="submit" className="login-btn">Iniciar sesión</button>
            <Link to="/account/forgot-password" className="forgot-password">¿Olvidaste tu contraseña?</Link>
          </div>




        </form>
        <div className="divider"></div>

        <div className="new-customer">
          <h3>¿Eres nuevo?</h3>
          <p>
            Crea una cuenta para aprovechar el historial de pedidos y completar automáticamente tus datos en futuras compras.
          </p>
          <Link to="/account/register" className="register-btn">REGISTRARSE</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
