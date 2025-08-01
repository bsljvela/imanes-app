import React, { useState } from 'react';
import './Contact.css';

const ContactUs = () => {
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Formulario enviado:', form);
    // Aquí podrías hacer la llamada a una API o servicio
  };

  return (
    <section className="contact-section">
      <h1 className="contact-title">Contáctanos</h1>
      <form onSubmit={handleSubmit} className="contact-form">
        <label>
          <input
            type="text"
            name="nombre"
            placeholder="Tu nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          <input
            type="email"
            name="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          <textarea
            name="mensaje"
            placeholder="Mensaje"
            rows="5"
            value={form.mensaje}
            onChange={handleChange}
            required
          ></textarea>
        </label>
        <button type="submit" className="contact-submit">ENVIAR</button>
      </form>
    </section>
  );
};

export default ContactUs;
