// js/tienda.js

const API_URL = 'https://eedlh-web-back.onrender.com';
let todosLosProductos = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Configuración de reintentos para la API
const API_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 10000
};

// Función auxiliar para hacer peticiones con reintentos
async function fetchWithRetry(url, options = {}, retries = API_CONFIG.maxRetries) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (retries > 0 && error.name !== 'AbortError') {
      console.log(`Reintentando... quedan ${retries} intentos`);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

async function cargarProductos() {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const filtros = document.getElementById('filtros');

  try {
    const productos = await fetchWithRetry(`${API_URL}/productos`);
    todosLosProductos = productos;

    loading.style.display = 'none';
    filtros.style.display = 'block';

    document.getElementById('total-productos').textContent = productos.length;

    mostrarProductos(productos);
    actualizarCarrito();

  } catch (err) {
    console.error('Error:', err);
    loading.style.display = 'none';
    
    // Mostrar mensaje de error más específico
    const errorMessage = document.querySelector('#error p');
    if (err.name === 'AbortError') {
      errorMessage.textContent = 'La conexión tardó demasiado. Por favor, verifica tu conexión a internet.';
    } else if (err.message.includes('Failed to fetch')) {
      errorMessage.textContent = 'No se pudo conectar con el servidor. Verifica que la API esté funcionando.';
    }
    
    error.style.display = 'block';
  }
}

function mostrarProductos(productos) {
  const container = document.getElementById('productos-container');
  container.innerHTML = '';

  document.getElementById('resultados-count').textContent = 
    `${productos.length} producto${productos.length !== 1 ? 's' : ''} encontrado${productos.length !== 1 ? 's' : ''}`;

  if (productos.length === 0) {
    container.innerHTML = `
      <div class="sin-resultados" style="grid-column: 1 / -1;">
        <i class="bi bi-inbox"></i>
        <h4>No se encontraron productos</h4>
        <p>Intenta con otro término de búsqueda o categoría</p>
      </div>
    `;
    return;
  }

  productos.forEach(producto => {
    const div = document.createElement('div');
    div.setAttribute('data-aos', 'fade-up');

    const imagenUrl = producto.imagen || 'https://via.placeholder.com/300x220/0b3d0b/ffffff?text=Producto';

    div.innerHTML = `
      <div class="product-card">
        <div class="product-image-container">
          <img src="${imagenUrl}" 
               class="product-img" 
               alt="${producto.nombre}"
               onerror="this.onerror=null; this.src='https://via.placeholder.com/300x220/0b3d0b/ffffff?text=Sin+Imagen';">
          <span class="badge-stock">
            <i class="bi bi-box-seam"></i> ${producto.stock}
          </span>
          <span class="badge-categoria">${producto.categoria}</span>
        </div>
        <div class="product-info">
          <h5 class="product-name">${producto.nombre}</h5>
          <p class="product-description">${producto.descripcion || 'Producto fresco de temporada'}</p>
          <div class="product-footer">
            <div class="precio">
              ${producto.precio.toFixed(2)}€
              <small>/ ${producto.unidad}</small>
            </div>
            <button class="btn-agregar" onclick="agregarAlCarrito(${producto.id})">
              <i class="bi bi-cart-plus"></i>
              Añadir
            </button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(div);
  });
}

function filtrarPorCategoria(categoria) {
  let productosFiltrados = todosLosProductos;

  if (categoria !== 'todos') {
    productosFiltrados = todosLosProductos.filter(p => p.categoria === categoria);
  }

  const textoBusqueda = document.getElementById('busqueda').value;
  if (textoBusqueda) {
    productosFiltrados = productosFiltrados.filter(p => 
      p.nombre.toLowerCase().includes(textoBusqueda.toLowerCase())
    );
  }

  const ordenamiento = document.getElementById('ordenar').value;
  productosFiltrados = ordenarProductos(productosFiltrados, ordenamiento);

  mostrarProductos(productosFiltrados);
}

function buscarProductos(texto) {
  let productosFiltrados = todosLosProductos;

  if (texto) {
    productosFiltrados = todosLosProductos.filter(p => 
      p.nombre.toLowerCase().includes(texto.toLowerCase())
    );
  }

  const categoria = document.getElementById('filtroCategoria').value;
  if (categoria !== 'todos') {
    productosFiltrados = productosFiltrados.filter(p => p.categoria === categoria);
  }

  const ordenamiento = document.getElementById('ordenar').value;
  productosFiltrados = ordenarProductos(productosFiltrados, ordenamiento);

  mostrarProductos(productosFiltrados);
}

function ordenarProductos(productos, tipo) {
  const productosOrdenados = [...productos];

  switch(tipo) {
    case 'precio-asc':
      return productosOrdenados.sort((a, b) => a.precio - b.precio);
    case 'precio-desc':
      return productosOrdenados.sort((a, b) => b.precio - a.precio);
    case 'nombre':
      return productosOrdenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    case 'stock':
      return productosOrdenados.sort((a, b) => b.stock - a.stock);
    default:
      return productosOrdenados;
  }
}

function limpiarFiltros() {
  document.getElementById('busqueda').value = '';
  document.getElementById('filtroCategoria').value = 'todos';
  document.getElementById('ordenar').value = 'default';
  mostrarProductos(todosLosProductos);
}

function agregarAlCarrito(productoId) {
  const producto = todosLosProductos.find(p => p.id === productoId);
  
  if (!producto) {
    console.error('Producto no encontrado');
    mostrarNotificacion('Error: Producto no encontrado', 'error');
    return;
  }

  const itemExistente = carrito.find(item => item.id === productoId);

  if (itemExistente) {
    itemExistente.cantidad++;
  } else {
    carrito.push({
      ...producto,
      cantidad: 1
    });
  }

  localStorage.setItem('carrito', JSON.stringify(carrito));
  
  actualizarCarrito();
  mostrarNotificacion(`${producto.nombre} añadido al carrito`);
}

function actualizarCarrito() {
  const carritoItems = document.getElementById('carrito-items');
  const carritoCount = document.getElementById('carrito-count');
  const carritoTotal = document.getElementById('carrito-total');

  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  carritoCount.textContent = totalItems;

  if (carrito.length === 0) {
    carritoItems.innerHTML = `
      <div class="carrito-vacio">
        <i class="bi bi-cart-x"></i>
        <p>Tu carrito está vacío</p>
      </div>
    `;
    carritoTotal.textContent = '0.00€';
    return;
  }

  carritoItems.innerHTML = carrito.map(item => `
    <div class="carrito-item">
      <div class="carrito-item-info">
        <h6>${item.nombre}</h6>
        <p class="text-muted">${item.precio.toFixed(2)}€ / ${item.unidad}</p>
      </div>
      <div class="carrito-item-controls">
        <button class="btn-cantidad" onclick="cambiarCantidad(${item.id}, -1)">
          <i class="bi bi-dash"></i>
        </button>
        <span class="cantidad">${item.cantidad}</span>
        <button class="btn-cantidad" onclick="cambiarCantidad(${item.id}, 1)">
          <i class="bi bi-plus"></i>
        </button>
      </div>
      <button class="btn-eliminar" onclick="eliminarDelCarrito(${item.id})">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `).join('');

  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  carritoTotal.textContent = `${total.toFixed(2)}€`;
}

function cambiarCantidad(productoId, cambio) {
  const item = carrito.find(i => i.id === productoId);
  
  if (!item) return;

  item.cantidad += cambio;

  if (item.cantidad <= 0) {
    eliminarDelCarrito(productoId);
    return;
  }

  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarCarrito();
}

function eliminarDelCarrito(productoId) {
  carrito = carrito.filter(item => item.id !== productoId);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarCarrito();
}

function toggleCarrito() {
  const miniCarrito = document.getElementById('mini-carrito');
  const overlay = document.getElementById('carrito-overlay');
  
  miniCarrito.classList.toggle('active');
  overlay.classList.toggle('active');
}

function mostrarNotificacion(mensaje, tipo = 'success') {
  const notif = document.createElement('div');
  notif.className = `notificacion ${tipo}`;
  
  const icono = tipo === 'error' ? 'x-circle-fill' : 'check-circle-fill';
  notif.innerHTML = `<i class="bi bi-${icono} me-2"></i>${mensaje}`;
  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add('show'), 10);

  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

function finalizarCompra() {
  if (carrito.length === 0) {
    mostrarNotificacion('El carrito está vacío', 'error');
    return;
  }

  const checkoutItems = document.getElementById('checkout-items');
  const checkoutTotal = document.getElementById('checkout-total');

  checkoutItems.innerHTML = carrito.map(item => `
    <div class="checkout-item">
      <span>${item.nombre} x${item.cantidad}</span>
      <span>${(item.precio * item.cantidad).toFixed(2)}€</span>
    </div>
  `).join('');

  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  checkoutTotal.textContent = `${total.toFixed(2)}€`;

  toggleCarrito();
  const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
  checkoutModal.show();
}

// ===== VALIDACIONES DEL FORMULARIO =====

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validarTelefono(telefono) {
  // Eliminar espacios y caracteres especiales
  const telefonoLimpio = telefono.replace(/[\s\-\+]/g, '');
  // Debe tener entre 9 y 15 dígitos
  return /^\d{9,15}$/.test(telefonoLimpio);
}

function validarNombre(nombre) {
  const nombreTrim = nombre.trim();
  return nombreTrim.length >= 3 && nombreTrim.length <= 100;
}

function validarDireccion(direccion) {
  const direccionTrim = direccion.trim();
  return direccionTrim.length >= 10 && direccionTrim.length <= 500;
}

function mostrarErrorCampo(campo, mensaje) {
  const input = document.getElementById(campo);
  input.classList.add('is-invalid');
  
  let errorDiv = input.nextElementSibling;
  if (!errorDiv || !errorDiv.classList.contains('invalid-feedback')) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    input.parentNode.insertBefore(errorDiv, input.nextSibling);
  }
  errorDiv.textContent = mensaje;
}

function limpiarErrorCampo(campo) {
  const input = document.getElementById(campo);
  input.classList.remove('is-invalid');
  
  const errorDiv = input.nextElementSibling;
  if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
    errorDiv.remove();
  }
}

function validarFormularioCheckout() {
  const nombre = document.getElementById('nombre').value;
  const email = document.getElementById('email').value;
  const telefono = document.getElementById('telefono').value;
  const direccion = document.getElementById('direccion').value;
  
  let valido = true;
  
  // Limpiar errores previos
  ['nombre', 'email', 'telefono', 'direccion'].forEach(limpiarErrorCampo);
  
  // Validar nombre
  if (!validarNombre(nombre)) {
    mostrarErrorCampo('nombre', 'El nombre debe tener entre 3 y 100 caracteres');
    valido = false;
  }
  
  // Validar email
  if (!validarEmail(email)) {
    mostrarErrorCampo('email', 'Por favor, introduce un email válido');
    valido = false;
  }
  
  // Validar teléfono
  if (!validarTelefono(telefono)) {
    mostrarErrorCampo('telefono', 'El teléfono debe tener entre 9 y 15 dígitos');
    valido = false;
  }
  
  // Validar dirección
  if (!validarDireccion(direccion)) {
    mostrarErrorCampo('direccion', 'La dirección debe tener al menos 10 caracteres');
    valido = false;
  }
  
  return valido;
}

async function confirmarPedido() {
  // Validar formulario
  if (!validarFormularioCheckout()) {
    mostrarNotificacion('Por favor, corrige los errores del formulario', 'error');
    return;
  }

  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const direccion = document.getElementById('direccion').value.trim();

  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const pedido = {
    items: carrito.map(item => ({
      producto_id: item.id,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.cantidad,
      unidad: item.unidad
    })),
    total: total,
    cliente_nombre: nombre,
    cliente_email: email,
    cliente_telefono: telefono,
    direccion_entrega: direccion
  };

  // Deshabilitar botón mientras se procesa
  const btnConfirmar = document.getElementById('confirmar-pedido');
  const textoOriginal = btnConfirmar.innerHTML;
  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

  try {
    const pedidoCreado = await fetchWithRetry(`${API_URL}/api/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pedido)
    });

    // Cerrar modal de checkout
    const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
    checkoutModal.hide();

    // Mostrar modal de confirmación
    document.getElementById('pedido-numero').textContent = pedidoCreado.id;
    const confirmacionModal = new bootstrap.Modal(document.getElementById('confirmacionModal'));
    confirmacionModal.show();

    // Limpiar carrito
    carrito = [];
    localStorage.removeItem('carrito');
    actualizarCarrito();

    // Resetear formulario
    document.getElementById('checkout-form').reset();
    ['nombre', 'email', 'telefono', 'direccion'].forEach(limpiarErrorCampo);

    // Mostrar notificación si el email no se envió
    if (pedidoCreado.email_enviado === false) {
      console.warn('⚠️ El pedido se creó pero no se pudo enviar el email de confirmación');
    }

  } catch (error) {
    console.error('Error:', error);
    
    let mensajeError = 'Hubo un error al procesar tu pedido. Por favor, inténtalo de nuevo.';
    
    if (error.message.includes('400')) {
      mensajeError = 'Hay un error en los datos del formulario. Por favor, verifica la información.';
    } else if (error.message.includes('Failed to fetch')) {
      mensajeError = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }
    
    mostrarNotificacion(mensajeError, 'error');
  } finally {
    // Rehabilitar botón
    btnConfirmar.disabled = false;
    btnConfirmar.innerHTML = textoOriginal;
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  cargarProductos();

  document.getElementById('filtroCategoria').addEventListener('change', (e) => {
    filtrarPorCategoria(e.target.value);
  });

  document.getElementById('busqueda').addEventListener('input', (e) => {
    buscarProductos(e.target.value);
  });

  document.getElementById('ordenar').addEventListener('change', (e) => {
    const categoria = document.getElementById('filtroCategoria').value;
    const texto = document.getElementById('busqueda').value;
    
    let productosFiltrados = todosLosProductos;
    
    if (categoria !== 'todos') {
      productosFiltrados = productosFiltrados.filter(p => p.categoria === categoria);
    }
    
    if (texto) {
      productosFiltrados = productosFiltrados.filter(p => 
        p.nombre.toLowerCase().includes(texto.toLowerCase())
      );
    }
    
    productosFiltrados = ordenarProductos(productosFiltrados, e.target.value);
    mostrarProductos(productosFiltrados);
  });

  document.getElementById('limpiar-filtros').addEventListener('click', limpiarFiltros);

  document.getElementById('btn-carrito').addEventListener('click', toggleCarrito);

  document.getElementById('cerrar-carrito').addEventListener('click', toggleCarrito);
  document.getElementById('carrito-overlay').addEventListener('click', toggleCarrito);

  document.getElementById('confirmar-pedido').addEventListener('click', confirmarPedido);
  
  // Validación en tiempo real
  const campos = ['nombre', 'email', 'telefono', 'direccion'];
  campos.forEach(campo => {
    const input = document.getElementById(campo);
    if (input) {
      input.addEventListener('blur', () => {
        const valor = input.value;
        
        switch(campo) {
          case 'nombre':
            if (valor && !validarNombre(valor)) {
              mostrarErrorCampo(campo, 'El nombre debe tener entre 3 y 100 caracteres');
            } else {
              limpiarErrorCampo(campo);
            }
            break;
          case 'email':
            if (valor && !validarEmail(valor)) {
              mostrarErrorCampo(campo, 'Por favor, introduce un email válido');
            } else {
              limpiarErrorCampo(campo);
            }
            break;
          case 'telefono':
            if (valor && !validarTelefono(valor)) {
              mostrarErrorCampo(campo, 'El teléfono debe tener entre 9 y 15 dígitos');
            } else {
              limpiarErrorCampo(campo);
            }
            break;
          case 'direccion':
            if (valor && !validarDireccion(valor)) {
              mostrarErrorCampo(campo, 'La dirección debe tener al menos 10 caracteres');
            } else {
              limpiarErrorCampo(campo);
            }
            break;
        }
      });
    }
  });
});