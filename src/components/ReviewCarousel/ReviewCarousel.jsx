import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './ReviewCarousel.css';

const reviews = [
  {
    nombre: 'Ana Torres',
    verificado: true,
    mensaje: '¡Excelente calidad! Me encantaron los imanes, muy nítidos.',
    imagen: '/public/image1.jpeg',
    titulo: 'Me encantó 😍',
  },
  {
    nombre: 'Carlos Rivera',
    verificado: true,
    mensaje: 'Entrega rápida y un resultado increíble. Muy recomendable.',
    imagen: '/public/vite.svg',
    titulo: 'Servicio 10/10',
  },
  {
    nombre: 'Ana Torres',
    verificado: true,
    mensaje: '¡Excelente calidad! Me encantaron los imanes, muy nítidos.',
    imagen: '/public/image1.jpeg',
    titulo: 'Me encantó 😍',
  },
  {
    nombre: 'Laura Gómez',
    verificado: true,
    mensaje: 'Los imanes se ven hermosos en mi refrigerador. ¡Gracias!',
    imagen: '/public/vite.svg',
    titulo: '¡Hermosos!',
  },
  {
    nombre: 'Ana Torres',
    verificado: true,
    mensaje: '¡Excelente calidad! Me encantaron los imanes, muy nítidos.',
    imagen: '/public/image1.jpeg',
    titulo: 'Me encantó 😍',
  },
  {
    nombre: 'Pedro López',
    verificado: true,
    mensaje: 'Buen precio y calidad. Ya pedí otros para regalar.',
    imagen: '/public/vite.svg',
    titulo: 'Ideal para regalar 🎁',
  },
  {
    nombre: 'Ana Torres',
    verificado: true,
    mensaje: '¡Excelente calidad! Me encantaron los imanes, muy nítidos.',
    imagen: '/public/image1.jpeg',
    titulo: 'Me encantó 😍',
  },
];

const ReviewCarousel = () => {
  return (
    <section className="carousel-section">
      <h2 className="carousel-title">Opiniones de nuestros clientes</h2>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        // navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 10000 }}
        loop={true} // 🔁 Activa el modo loop infinito
        loopedSlides={reviews.length} // (opcional) ayuda a suavizar el ciclo si tienes pocos slides
        breakpoints={{
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {reviews.map((review, index) => (
          <SwiperSlide key={index}>
            <div className="review-card">
              <img src={review.imagen} alt={review.nombre} className="review-image" />
              <div className="review-content">
                <div className="stars">⭐⭐⭐⭐⭐</div>
                <h4>{review.nombre} {review.verificado && <span className="verified">Verificado</span>}</h4>
                <h3 className="review-title">{review.titulo}</h3>
                <p className="review-message">{review.mensaje}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default ReviewCarousel;
