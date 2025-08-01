import React from 'react';
import { Link } from 'react-router-dom';
import './Register.css';

const Register = () => {
  return (
    <div className="register-container">
      <h1 className="register-title">Crear cuenta</h1>
      <div className="register-form">
        <form>
          <label htmlFor="firstName">Nombre(s)</label>
          <input type="text" id="firstName" placeholder="Nombre(s)" />

          <label htmlFor="lastName">Apellidos</label>
          <input type="text" id="lastName" placeholder="Apellidos" />

          <label htmlFor="email">Correo electrónico</label>
          <input type="email" id="email" placeholder="Correo electrónico" />

          <label htmlFor="password">Contraseña</label>
          <input type="password" id="password" placeholder="Contraseña" />

          <div className="form-footer">
            <button type="submit" className="register-button">REGISTRARSE</button>
            <Link to="/account/login" className="login-link">¿Ya tienes una cuenta?</Link>

          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
