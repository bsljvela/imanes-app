import React from 'react';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPassword = () => {
  return (
    <div className="forgot-container">
      <h1 className="forgot-title">Restablecer contraseña</h1>
      <div className="forgot-form">
        <p className="forgot-text">Te enviaremos un correo para restablecer tu contraseña.</p>
        <form>
          <label htmlFor="email">Correo electrónico</label>
          <input type="email" id="email" placeholder="Correo electrónico" />

          <div className="form-footer">
            <button type="submit" className="reset-button">REESTABLECER</button>
            <Link to="/account/login" className="cancel-link">o Cancelar</Link>
          </div>
        </form>

        <div className="divider"></div>

        <div className="new-customer">
          <h3>¿Eres nuevo?</h3>
          <p>
            Crea una cuenta para aprovechar el historial de pedidos y completar automáticamente tus datos en futuras compras.
          </p>
          <Link to="/account/register" className="register-button">REGISTRARSE</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
