// js/tienda.js

const API_URL = 'https://eedlh-web-back.onrender.com';
let todosLosProductos = [];
let carrito = [];

async function cargarProductos() {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const container = document.getElementById('productos-container');
  const filtros = document.getElementById('filtros');

  try {
    const response = await fetch(`${API_URL}/productos`);
    
    if (!response.ok) {
      throw new Error('Error al obtener productos');
    }

    const productos = await response.json();
    todosLosProductos = productos;

    loading.style.display = 'none';
    filtros.style.display = 'block';

    document.getElementById('total-productos').textContent = productos.length;

    mostrarProductos(productos);

  } catch (err) {
    console.error('Error:', err);
    loading.style.display = 'none';
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

    const descripcion = producto.categoria === 'frutas' 
      ? 'Fruta fresca de temporada' 
      : 'Verdura fresca de la huerta';

    div.innerHTML = `
      <div class="product-card">
        <div class="product-image-container">
          <img src="https://via.placeholder.com/300x220/0b3d0b/ffffff?text=${encodeURIComponent(producto.nombre)}" 
               class="product-img" 
               alt="${producto.nombre}">
          <span class="badge-stock">
            <i class="bi bi-box-seam"></i> ${producto.stock}
          </span>
          <span class="badge-categoria">${producto.categoria}</span>
        </div>
        <div class="product-info">
          <h5 class="product-name">${producto.nombre}</h5>
          <p class="product-description">${descripcion}</p>
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

  actualizarCarrito();
  mostrarNotificacion(`${producto.nombre} añadido al carrito ✓`);
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

  actualizarCarrito();
}

function eliminarDelCarrito(productoId) {
  carrito = carrito.filter(item => item.id !== productoId);
  actualizarCarrito();
}

function toggleCarrito() {
  const miniCarrito = document.getElementById('mini-carrito');
  const overlay = document.getElementById('carrito-overlay');
  
  miniCarrito.classList.toggle('active');
  overlay.classList.toggle('active');
}

function mostrarNotificacion(mensaje) {
  const notif = document.createElement('div');
  notif.className = 'notificacion';
  notif.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>${mensaje}`;
  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add('show'), 10);

  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 300);
  }, 2000);
}

function finalizarCompra() {
  if (carrito.length === 0) {
    alert('El carrito está vacío');
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

async function confirmarPedido() {
  const nombre = document.getElementById('nombre').value;
  const email = document.getElementById('email').value;
  const telefono = document.getElementById('telefono').value;
  const direccion = document.getElementById('direccion').value;

  if (!nombre || !email || !telefono || !direccion) {
    alert('Por favor, completa todos los campos');
    return;
  }

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

  try {
    const response = await fetch(`${API_URL}/api/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pedido)
    });

    if (!response.ok) {
      throw new Error('Error al crear el pedido');
    }

    const pedidoCreado = await response.json();

    const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
    checkoutModal.hide();

    document.getElementById('pedido-numero').textContent = pedidoCreado.id;
    const confirmacionModal = new bootstrap.Modal(document.getElementById('confirmacionModal'));
    confirmacionModal.show();

    carrito = [];
    actualizarCarrito();

    document.getElementById('checkout-form').reset();

  } catch (error) {
    console.error('Error:', error);
    alert('Hubo un error al procesar tu pedido. Por favor, intenta de nuevo.');
  }
}

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
});