console.log("JS cargado");


document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const mensajeExito = document.getElementById('mensaje-exito');

  if (!form || !mensajeExito) return; // Por si no existen los elementos

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validar el formulario con HTML5
    if (!form.checkValidity()) {
      form.classList.add('was-validated'); // Muestra errores
      return;
    }

    // Si es válido, muestra mensaje de éxito
    mensajeExito.classList.remove('d-none');

    // Oculta el mensaje tras 5 segundos
    setTimeout(() => {
      mensajeExito.classList.add('d-none');
    }, 5000);

    // Resetea el formulario y quita estilos de validación
    form.reset();
    form.classList.remove('was-validated');
  });
});
