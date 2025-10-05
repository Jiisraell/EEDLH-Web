// js/admin.js

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'
  : 'https://eedlh-web-back.onrender.com';

let credenciales = null;
let todosPedidos = [];

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');
  
  try {
    const response = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`)
      }
    });
    
    if (!response.ok) {
      throw new Error('Credenciales incorrectas');
    }
    
    const data = await response.json();
    
    // Guardar credenciales
    credenciales = btoa(`${username}:${password}`);
    sessionStorage.setItem('admin_auth', credenciales);
    
    // Mostrar panel
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    
    // Cargar datos
    cargarEstadisticas();
    cargarPedidos();
    
  } catch (error) {
    errorDiv.textContent = 'Usuario o contraseña incorrectos';
    errorDiv.classList.remove('d-none');
    setTimeout(() => errorDiv.classList.add('d-none'), 3000);
  }
});

// Verificar sesión al cargar
window.addEventListener('DOMContentLoaded', () => {
  const auth = sessionStorage.getItem('admin_auth');
  if (auth) {
    credenciales = auth;
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    cargarEstadisticas();
    cargarPedidos();
  }
});

// Cerrar sesión
function cerrarSesion() {
  sessionStorage.removeItem('admin_auth');
  credenciales = null;
  document.getElementById('login-section').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('login-form').reset();
}

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    const response = await fetch(`${API_URL}/api/admin/estadisticas`, {
      headers: {
        'Authorization': 'Basic ' + credenciales
      }
    });
    
    if (!response.ok) throw new Error('Error al cargar estadísticas');
    
    const stats = await response.json();
    
    document.getElementById('stat-total').textContent = stats.total_pedidos;
    document.getElementById('stat-ingresos').textContent = stats.total_ingresos.toFixed(2) + '€';
    document.getElementById('stat-pendientes').textContent = stats.pedidos_por_estado.pendiente || 0;
    document.getElementById('stat-promedio').textContent = stats.pedido_promedio.toFixed(2) + '€';
    
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}

// Cargar pedidos
async function cargarPedidos() {
  try {
    const response = await fetch(`${API_URL}/api/admin/pedidos`, {
      headers: {
        'Authorization': 'Basic ' + credenciales
      }
    });
    
    if (!response.ok) throw new Error('Error al cargar pedidos');
    
    todosPedidos = await response.json();
    mostrarPedidos(todosPedidos);
    
  } catch (error) {
    console.error('Error cargando pedidos:', error);
    document.getElementById('pedidos-tbody').innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">
          Error al cargar pedidos. Por favor, intenta de nuevo.
        </td>
      </tr>
    `;
  }
}

// Mostrar pedidos en tabla
function mostrarPedidos(pedidos) {
  const tbody = document.getElementById('pedidos-tbody');
  
  if (pedidos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">
          No hay pedidos disponibles
        </td>
      </tr>
    `;
    return;
  }
  
  // Ordenar por ID descendente (más recientes primero)
  pedidos.sort((a, b) => b.id - a.id);
  
  tbody.innerHTML = pedidos.map(pedido => `
    <tr>
      <td><strong>#${pedido.id}</strong></td>
      <td>
        <div><strong>${pedido.cliente_nombre}</strong></div>
        <small class="text-muted">${pedido.cliente_email}</small>
      </td>
      <td><small>${pedido.fecha}</small></td>
      <td><strong>${pedido.total.toFixed(2)}€</strong></td>
      <td>
        <span class="badge badge-estado estado-${pedido.estado}">
          ${formatearEstado(pedido.estado)}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="verDetalles(${pedido.id})">
          <i class="bi bi-eye"></i>
        </button>
        <button class="btn btn-sm btn-outline-success" onclick="cambiarEstado(${pedido.id}, '${pedido.estado}')">
          <i class="bi bi-pencil"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Formatear nombre de estado
function formatearEstado(estado) {
  const estados = {
    'pendiente': 'Pendiente',
    'en_preparacion': 'En Preparación',
    'enviado': 'Enviado',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado'
  };
  return estados[estado] || estado;
}

// Ver detalles de pedido
function verDetalles(pedidoId) {
  const pedido = todosPedidos.find(p => p.id === pedidoId);
  if (!pedido) return;
  
  document.getElementById('modal-pedido-id').textContent = pedido.id;
  
  const itemsHtml = pedido.items.map(item => `
    <tr>
      <td>${item.nombre}</td>
      <td class="text-center">${item.cantidad} ${item.unidad}</td>
      <td class="text-end">${item.precio.toFixed(2)}€</td>
      <td class="text-end"><strong>${(item.precio * item.cantidad).toFixed(2)}€</strong></td>
    </tr>
  `).join('');
  
  document.getElementById('modal-body-content').innerHTML = `
    <div class="row mb-3">
      <div class="col-md-6">
        <h6 class="text-muted">Información del Cliente</h6>
        <p class="mb-1"><strong>Nombre:</strong> ${pedido.cliente_nombre}</p>
        <p class="mb-1"><strong>Email:</strong> ${pedido.cliente_email}</p>
        <p class="mb-1"><strong>Teléfono:</strong> ${pedido.cliente_telefono}</p>
        <p class="mb-1"><strong>Dirección:</strong> ${pedido.direccion_entrega}</p>
      </div>
      <div class="col-md-6">
        <h6 class="text-muted">Información del Pedido</h6>
        <p class="mb-1"><strong>Fecha:</strong> ${pedido.fecha}</p>
        <p class="mb-1"><strong>Estado:</strong> 
          <span class="badge badge-estado estado-${pedido.estado}">
            ${formatearEstado(pedido.estado)}
          </span>
        </p>
      </div>
    </div>
    
    <h6 class="text-muted mb-3">Productos</h6>
    <table class="table table-sm">
      <thead>
        <tr>
          <th>Producto</th>
          <th class="text-center">Cantidad</th>
          <th class="text-end">Precio</th>
          <th class="text-end">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="text-end"><strong>TOTAL:</strong></td>
          <td class="text-end"><strong>${pedido.total.toFixed(2)}€</strong></td>
        </tr>
      </tfoot>
    </table>
  `;
  
  const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
  modal.show();
}

// Cambiar estado de pedido
async function cambiarEstado(pedidoId, estadoActual) {
  const estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_preparacion', label: 'En Preparación' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'entregado', label: 'Entregado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];
  
  const opciones = estados.map(e => 
    `<option value="${e.value}" ${e.value === estadoActual ? 'selected' : ''}>${e.label}</option>`
  ).join('');
  
  const nuevoEstado = prompt(`Cambiar estado del pedido #${pedidoId}:\n\nSelecciona:\n1 - Pendiente\n2 - En Preparación\n3 - Enviado\n4 - Entregado\n5 - Cancelado\n\nEscribe el número:`, '');
  
  if (!nuevoEstado) return;
  
  const mapeo = {
    '1': 'pendiente',
    '2': 'en_preparacion',
    '3': 'enviado',
    '4': 'entregado',
    '5': 'cancelado'
  };
  
  const estadoSeleccionado = mapeo[nuevoEstado];
  
  if (!estadoSeleccionado) {
    alert('Opción inválida');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/admin/pedidos/${pedidoId}/estado`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Basic ' + credenciales,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nuevo_estado: estadoSeleccionado })
    });
    
    if (!response.ok) throw new Error('Error al cambiar estado');
    
    // Recargar pedidos y estadísticas
    await cargarPedidos();
    await cargarEstadisticas();
    
    alert(`Estado actualizado a: ${formatearEstado(estadoSeleccionado)}`);
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cambiar el estado. Por favor, intenta de nuevo.');
  }
}

// Filtros
document.getElementById('filtro-estado').addEventListener('change', (e) => {
  filtrarPedidos();
});

document.getElementById('buscar-pedido').addEventListener('input', (e) => {
  filtrarPedidos();
});

function filtrarPedidos() {
  const estadoFiltro = document.getElementById('filtro-estado').value;
  const busqueda = document.getElementById('buscar-pedido').value.toLowerCase();
  
  let pedidosFiltrados = [...todosPedidos];
  
  // Filtrar por estado
  if (estadoFiltro !== 'todos') {
    pedidosFiltrados = pedidosFiltrados.filter(p => p.estado === estadoFiltro);
  }
  
  // Filtrar por búsqueda
  if (busqueda) {
    pedidosFiltrados = pedidosFiltrados.filter(p => 
      p.id.toString().includes(busqueda) ||
      p.cliente_nombre.toLowerCase().includes(busqueda) ||
      p.cliente_email.toLowerCase().includes(busqueda)
    );
  }
  
  mostrarPedidos(pedidosFiltrados);
}