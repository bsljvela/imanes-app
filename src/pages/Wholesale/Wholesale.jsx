import React, { useState } from 'react';
import './Wholesale.css';

const WholesaleOrders = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    cantidad: '',
    archivo: null,
    fechaEntrega: ''
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes manejar el envío con fetch o axios
    console.log(formData);
  };

  return (
    <div className="wholesale-section">
      <h1>Pedidos al por mayor</h1>
      <p className="sub">¿Estás interesado en comprar al mayoreo?</p>
      <p className="desc">Por favor, completa el siguiente formulario y nos pondremos en contacto contigo.</p>

      <form className="wholesale-form" onSubmit={handleSubmit}>
        <label>Nombre <span>*</span></label>
        <div className="input-row">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            required
            onChange={handleChange}
          />
          <input
            type="text"
            name="apellido"
            placeholder="Apellido"
            required
            onChange={handleChange}
          />
        </div>

        <label>Correo electrónico <span>*</span></label>
        <input
          type="email"
          name="email"
          placeholder="ejemplo@correo.com"
          required
          onChange={handleChange}
        />

        <label>¿Cuántos imanes necesitas? <span>*</span></label>
        <input
          type="number"
          name="cantidad"
          placeholder="Cantidad"
          required
          onChange={handleChange}
        />

        <label>Sube el archivo que deseas imprimir</label>
        <div className="upload-box">
          <input
            type="file"
            name="archivo"
            accept="image/*,.pdf"
            onChange={handleChange}
          />
          <p className="upload-instructions">Arrastra y suelta el archivo aquí o haz clic para seleccionarlo</p>
          <small>Máx. 10MB</small>
        </div>

        <label>¿Para cuándo lo necesitas?</label>
        <input
          type="date"
          name="fechaEntrega"
          onChange={handleChange}
        />

        <button type="submit" className="submit-button">Enviar</button>
      </form>
    </div>
  );
};

export default WholesaleOrders;
