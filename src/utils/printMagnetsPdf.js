import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function printMagnetsPdf(photos, opts = {}) {
  const {
    orderId = '10009',
    website = 'www.yoursite.com',
    autoPrint = false,
  } = opts;

  const chunk9 = (arr) => {
    const out = [];
    for (let i = 0; i < arr.length; i += 9) out.push(arr.slice(i, i + 9));
    if (out.length === 0) out.push([]);
    return out;
  };

  const pages = chunk9(photos || []);

  // contenedor fuera del flujo
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.inset = '0';
  host.style.zIndex = '-1';
  host.style.opacity = '0';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);
  //2.375
  const STYLE = `
   <style>
  /* === Página carta exacta === */
  .tpl-page {
    width: 8.5in;
    height: 11in;
    box-sizing: border-box;
    background: #fff;
    display: grid;
    grid-template-columns: repeat(3, 2.375in);
    grid-template-rows: repeat(3, 2.375in);
    padding: 0.125in;
    column-gap: 0.325in;
    row-gap: 1.0in;
    justify-content: center;
    align-content: center;
    position: relative; /* Necesario para colocar las líneas */
  }

  /* Guías horizontales SOLO entre filas */
  .tpl-page::before,
  .tpl-page::after {
    content: '';
    position: absolute;
    left: 0.125in;
    right: 0.125in;
    height: 1px;
    background: rgba(0,0,0,0.3); /* color guía */
  }

  /* Línea entre fila 1 y 2 */
  .tpl-page::before {
    top: calc((3.2in * 1) + 0.125in + (1.0in / 2)); 
  }

  /* Línea entre fila 2 y 3 */
  .tpl-page::after {
    top: calc((2.5in * 2) + 0.125in + (1.0in * 2));
  }


  /* === Celda 2.3in con borde redondeado (20%) === */
  .tpl-cell {
    width: 2.385in;
    height: 2.385in;
    border: 1px solid #000;
    border-radius: 16%;
    box-sizing: border-box;
    display: grid;
    grid-template-rows: auto 2.1in auto;
    justify-items: center;
    align-items: center;
  }

  .tpl-order {
    font: 700 8px/1 sans-serif;
    color: #111;
    margin-top: 0.04in;
  }

  .tpl-imgwrap {
    width: 2.1in;
    height: 2.1in;
    overflow: hidden;
    background: #f0f0f0;
    display: grid;
    place-items: center;
  }

  .tpl-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .tpl-website {
    font: 400 8px/1 sans-serif;
    color: #333;
    margin-bottom: 0.04in;
  }

  .tpl-missing {
    font: 600 10px/1 sans-serif;
    color: #999;
  }
</style>

  `;

  // crea PDF con tamaño carta explícito
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  for (let p = 0; p < pages.length; p++) {
    const imgs = [...pages[p]];
    while (imgs.length < 9) imgs.push(null);

    host.innerHTML = `
      ${STYLE}
      <div class="tpl-page">
        ${imgs
        .map(
          (src, i) => `
          <div class="tpl-cell">
            <div class="tpl-order">Order #${orderId}</div>
            <div class="tpl-imgwrap">
              ${src
              ? `<img class="tpl-img" src="${src}" alt="img-${p}-${i}"/>`
              : `<div class="tpl-missing">No image</div>`
            }
            </div>
            <div class="tpl-website">${website}</div>
          </div>`
        )
        .join('')}
      </div>
    `;

    // esperar imágenes de ESTA página
    const imgsEls = Array.from(host.querySelectorAll('img'));
    await Promise.all(
      imgsEls.map(
        (img) =>
          new Promise((res) => {
            if (img.complete) return res();
            img.onload = img.onerror = () => res();
          })
      )
    );

    // render a canvas y añadir la página
    const pageEl = host.querySelector('.tpl-page');
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');

    if (p === 0) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    } else {
      // ⭐ más compatible que pasar formato aquí
      pdf.addPage(); // añade una página con el mismo formato que la primera
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    }
  }

  document.body.removeChild(host);

  if (autoPrint) {
    pdf.autoPrint();
    const url = pdf.output('bloburl');
    const w = window.open(url);
    if (w) setTimeout(() => w.print(), 300);
  } else {
    pdf.save(`order-${orderId}.pdf`);
  }
}
