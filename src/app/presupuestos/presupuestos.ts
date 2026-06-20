import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <-- ¡IMPORTANTE para el buscador!
import { PresupuestosService } from '../core/services/presupuestos';

@Component({
  selector: 'app-presupuestos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // <-- Lo agregamos aquí
  templateUrl: './presupuestos.html',
})
export class PresupuestosComponent implements OnInit {
  listaPresupuestos: any[] = [];
  searchTerm: string = '';

  // --- CONTROL DE MODALES ---
  showModalVer = false;
  showModalEditar = false;
  showModalEstado = false;
  presupuestoSeleccionado: any = null;
  itemsEdicion: any[] = [];
  cargandoEdicion: boolean = false;
  nuevoEstadoId: number = 1;
  showModalEliminar: boolean = false;
  itemAEliminarIndex: number | null = null;
  showToastExito: boolean = false;
  mensajeToast: string = '';

  // --- CONTROL DE CREACIÓN MANUAL ---
  showModalNuevo: boolean = false;
  cargandoNuevo: boolean = false;
  nuevoPresupuesto = {
    astillero: '',
    embarcacion: '',
    numero_cotizacion: '',
    moneda: 'PEN'
  };
  itemsNuevo: any[] = [];

  // --- CONTROL DE REGULARIZACIÓN ---
  showModalRegularizar: boolean = false;
  proveedoresPendientes: any[] = [];
  cargandoPendientes: boolean = false;

  constructor(
    private presupuestosService: PresupuestosService,
    private router: Router
  ) { }

  ngOnInit() {
    const token = localStorage.getItem('token_naval');
    if (!token) {
      this.router.navigate(['/']);
    } else {
      this.cargarPresupuestos();
    }
  }

  abrirModalEliminar(index: number) {
    this.itemAEliminarIndex = index;
    this.showModalEliminar = true;
  }

  confirmarEliminacion() {
    if (this.itemAEliminarIndex !== null) {
      this.itemsEdicion.splice(this.itemAEliminarIndex, 1);
      this.cerrarModalEliminar();
    }
  }

  cerrarModalEliminar() {
    this.showModalEliminar = false;
    this.itemAEliminarIndex = null;
  }
  
  cargarPresupuestos() {
    const token = localStorage.getItem('token_naval') || '';

    this.presupuestosService.obtenerListaPresupuestos(token).subscribe({
      next: (respuesta: any) => {
        if (respuesta.status === 'success') {
          this.listaPresupuestos = respuesta.data;
        }
      },
      error: (err: any) => {
        console.error('Error cargando la lista:', err);
      }
    });
  }

  eliminarItemEdicion(index: number) {
      if(confirm('¿Seguro que quieres eliminar este ítem del presupuesto?')) {
        this.itemsEdicion.splice(index, 1);
      }
  }

  agregarItemEdicion() {
    this.itemsEdicion.push({ 
      id: null, // <--- Es vital que vaya null para que Python sepa que es nuevo
      descripcion: '', 
      cantidad: 1, 
      precio_unitario: 0.00 
    });
    
    // Focus automático (opcional pero elegante)
    setTimeout(() => {
      const nuevoIndice = this.itemsEdicion.length - 1;
      const nuevoElemento = document.getElementById('desc_edit_' + nuevoIndice);
      if (nuevoElemento) nuevoElemento.focus();
    }, 0);
  }

  // MAGIA DEL BUSCADOR: Filtra la tabla en tiempo real
  get presupuestosFiltrados() {
    if (!this.searchTerm) return this.listaPresupuestos;
    
    const termino = this.searchTerm.toLowerCase();
    return this.listaPresupuestos.filter(p => 
      (p.embarcacion && p.embarcacion.toLowerCase().includes(termino)) ||
      (p.numero_cotizacion && p.numero_cotizacion.toLowerCase().includes(termino)) ||
      (p.estado && p.estado.toLowerCase().includes(termino)) ||
      (p.astillero && p.astillero.toLowerCase().includes(termino)) // <--- AGREGAMOS EL ASTILLERO AL FILTRO
    );
  }

  // --- FUNCIONES PARA LOS BOTONES ---
  abrirVer(presupuesto: any) {
    this.presupuestoSeleccionado = presupuesto;
    this.showModalVer = true;

    // Limpiamos datos anteriores y mostramos un loader
    this.itemsDetalle = [];
    this.totalDetalle = 0;
    this.cargandoDetalle = true;

    const token = localStorage.getItem('token_naval') || '';

    // Llamamos a Python para traer los ítems de este ID
    this.presupuestosService.obtenerDetallePresupuesto(presupuesto.id, token).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.itemsDetalle = res.data.items;
          this.totalDetalle = res.data.total;
        }
        this.cargandoDetalle = false;
      },
      error: (err: any) => {
        console.error('Error cargando detalle:', err);
        this.cargandoDetalle = false;
      }
    });
  }

  abrirEditar(presupuesto: any) {
    // Clonamos el presupuesto para no alterar la tabla principal hasta que guardemos
    this.presupuestoSeleccionado = { ...presupuesto }; 
    this.showModalEditar = true;
    this.cargandoEdicion = true;
    this.itemsEdicion = [];

    const token = localStorage.getItem('token_naval') || '';
    
    
    // Traemos los ítems reales de la BD
    this.presupuestosService.obtenerDetallePresupuesto(presupuesto.id, token).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          // Clonamos los ítems para poder editarlos libremente
          this.itemsEdicion = res.data.items.map((item: any) => ({...item}));
        }
        this.cargandoEdicion = false;
      },
      error: (err: any) => {
        console.error('Error cargando para edición:', err);
        this.cargandoEdicion = false;
      }
    });
  }

  guardarEdicion() {
    const token = localStorage.getItem('token_naval') || '';
    
    // Armamos el paquete según lo que pide nuestro esquema de Python
    const payload = {
      nro_cotizacion: this.presupuestoSeleccionado.numero_cotizacion,
      items: this.itemsEdicion.map(item => ({
        id: item.id || null, // <--- Si no tiene ID, manda null
        descripcion_original: item.descripcion,
        cantidad: Number(item.cantidad) || 0,
        precio_unitario: Number(item.precio_unitario) || 0
      }))
    };

    this.presupuestosService.actualizarPresupuesto(this.presupuestoSeleccionado.id, payload, token).subscribe({
      next: (res: any) => {
        this.mostrarToastExito('¡Cambios guardados con éxito!'); // <-- EL ELEGANTE
        this.cerrarModales();
        this.cargarPresupuestos(); // Refrescamos la tabla
      },
      error: (err: any) => {
        console.error('Error al actualizar:', err);
        alert('Ocurrió un error al guardar los cambios.');
      }
    });
  }

  // Pequeña función para calcular el total dinámico mientras editas
  get totalEdicion() {
    return this.itemsEdicion.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);
  }

  abrirEstado(presupuesto: any) {
    this.presupuestoSeleccionado = presupuesto;
    
    // Mapeo exacto según los IDs de tu tabla PostgreSQL
    if (presupuesto.estado === 'En Revisión') this.nuevoEstadoId = 2;
    else if (presupuesto.estado === 'Confirmado') this.nuevoEstadoId = 3;
    else if (presupuesto.estado === 'Rechazado') this.nuevoEstadoId = 4;
    else if (presupuesto.estado === 'Anulado') this.nuevoEstadoId = 5;
    else this.nuevoEstadoId = 1; // Borrador

    this.showModalEstado = true;
  }

  guardarEstado() {
    const token = localStorage.getItem('token_naval') || '';
    const estadoParseado = Number(this.nuevoEstadoId); // Aseguramos que sea número

    this.presupuestosService.actualizarEstado(this.presupuestoSeleccionado.id, estadoParseado, token).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.cerrarModales();
          this.cargarPresupuestos(); // Recargamos la tabla para ver el cambio
        }
      },
      error: (err: any) => {
        console.error('Error al cambiar el estado:', err);
        alert('Ocurrió un error al actualizar el estado en la base de datos.');
      }
    });
  }
  
  mostrarToastExito(mensaje: string) {
    this.mensajeToast = mensaje;
    this.showToastExito = true;
    
    // El setTimeout hace que a los 3 segundos (3000ms) se cierre solo
    setTimeout(() => {
      this.showToastExito = false;
    }, 3000);
  }

  cerrarModales() {
    this.showModalVer = false;
    this.showModalEditar = false;
    this.showModalEstado = false;
    this.showModalEliminar = false; 
    this.showModalNuevo = false; 
    this.showModalRegularizar = false; // <-- Cerramos el modal de regularización también
    this.itemAEliminarIndex = null; 
    this.presupuestoSeleccionado = null;
    this.itemsDetalle = []; 
  }
  itemsDetalle: any[] = [];
  totalDetalle: number = 0;
  cargandoDetalle: boolean = false;

  obtenerSimboloMoneda(moneda: string | undefined): string {
    if (moneda === 'USD') return '$';
    if (moneda === 'EUR') return '€';
    return 'S/'; // PEN por defecto para la industria peruana
  }

  cerrarSesion() {
    localStorage.removeItem('token_naval');
    this.router.navigate(['/']);
  }

// ==========================================
  // LÓGICA PARA CREAR PRESUPUESTO MANUAL
  // ==========================================
  abrirModalNuevo() {
    // Reseteamos el formulario al abrir para que esté limpio
    this.nuevoPresupuesto = { astillero: '', embarcacion: '', numero_cotizacion: '', moneda: 'PEN' };
    this.itemsNuevo = [
      { descripcion: '', cantidad: 1, precio_unitario: 0.00 } // Empezamos con 1 fila vacía por defecto
    ];
    this.showModalNuevo = true;
  }

  agregarItemNuevo() {
    this.itemsNuevo.push({ descripcion: '', cantidad: 1, precio_unitario: 0.00 });
    setTimeout(() => {
      const nuevoIndice = this.itemsNuevo.length - 1;
      const nuevoElemento = document.getElementById('desc_input_' + nuevoIndice);
      if (nuevoElemento) {
        nuevoElemento.focus();
      }
    }, 0);
  }

  eliminarItemNuevo(index: number) {
    this.itemsNuevo.splice(index, 1);
    // Si borra absolutamente todas las filas, le dejamos una vacía para que no se quede sin tabla
    if (this.itemsNuevo.length === 0) {
      this.agregarItemNuevo();
    }
  }

  // Calcula el subtotal en tiempo real
  get totalNuevo() {
    return this.itemsNuevo.reduce((acc, item) => acc + (Number(item.cantidad) * Number(item.precio_unitario)), 0);
  }

  async guardarNuevoPresupuesto() {
    if (!this.nuevoPresupuesto.embarcacion.trim()) {
      alert('Debes ingresar el nombre de la embarcación o proyecto.');
      return;
    }

    this.cargandoNuevo = true;
    const token = localStorage.getItem('token_naval') || '';

    // Armamos el paquete de datos exactamente como lo pide el BaseModel de Python
    const payload = {
      astillero: this.nuevoPresupuesto.astillero, // <-- SE LO MANDAMOS A PYTHON
      embarcacion: this.nuevoPresupuesto.embarcacion,
      numero_cotizacion: this.nuevoPresupuesto.numero_cotizacion,
      moneda: this.nuevoPresupuesto.moneda,
      items: this.itemsNuevo.map(i => ({
        detalle_actividad: i.descripcion,
        cantidad: Number(i.cantidad) || 0,
        precio_unitario: Number(i.precio_unitario) || 0
      }))
    };

    try {
      const response = await fetch('http://localhost:8000/api/presupuestos/crear-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      this.cargandoNuevo = false;

      if (response.ok && data.status === 'success') {
        this.mostrarToastExito('¡Presupuesto creado con éxito!');
        this.cerrarModales();
        this.cargarPresupuestos(); // Refrescamos la tabla para ver el nuevo registro
      } else {
        alert(data.detail || 'Ocurrió un error al guardar en la base de datos.');
      }
    } catch (error) {
      this.cargandoNuevo = false;
      console.error('Error al crear:', error);
      alert('Error de conexión con el servidor. Verifica que el backend esté encendido.');
    }
  }

// --- FUNCIÓN PARA EXPORTAR EXCEL ---
  async exportarExcel(presupuesto: any) {
    const token = localStorage.getItem('token_naval') || '';
    
    // Usamos tu Toast nuevo para avisar que está cargando
    this.mostrarToastExito('Generando documento Excel...');

    try {
      // Como Angular + Tauri requieren la URL completa a tu backend, usa fetch para no complicar el Service
      // Asegúrate de cambiar 'http://localhost:8000' por la URL real de tu backend si es distinta
      const urlBackend = `http://localhost:8000/api/presupuestos/${presupuesto.id}/exportar/excel`;
      
      const response = await fetch(urlBackend, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Fallo la descarga del Excel');

      // Convertimos la respuesta en un archivo Blob y forzamos la descarga en el navegador/Tauri
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cotizacion_${presupuesto.numero_cotizacion || presupuesto.id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Hubo un error al generar el archivo. Verifica que el backend esté encendido.');
    }
  }

  // ==========================================
  // LÓGICA PARA REGULARIZAR CLIENTES / ASTILLEROS
  // ==========================================
  abrirModalRegularizar() {
    this.showModalRegularizar = true;
    this.cargarPendientes();
  }

  cerrarModalRegularizar() {
    this.showModalRegularizar = false;
    this.proveedoresPendientes = [];
  }

  cargarPendientes() {
    this.cargandoPendientes = true;
    const token = localStorage.getItem('token_naval') || '';
    
    this.presupuestosService.obtenerProveedoresPendientes(token).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          // Mapeamos agregando campos temporales vacíos para los inputs de la tabla
          this.proveedoresPendientes = res.data.map((p: any) => ({
            ...p,
            inputRuc: '',
            inputRazonSocial: '',
            guardando: false,
            buscandoRuc: false // <-- AÑADIMOS ESTA BANDERA PARA LA LUPA
          }));
        }
        this.cargandoPendientes = false;
      },
      error: (err: any) => {
        console.error('Error cargando clientes pendientes:', err);
        this.cargandoPendientes = false;
      }
    });
  }

  buscarRucEnSunat(proveedor: any) {
    if (!proveedor.inputRuc || proveedor.inputRuc.length !== 11) {
      alert('El RUC debe tener exactamente 11 dígitos.');
      return;
    }

    proveedor.buscandoRuc = true;
    const token = localStorage.getItem('token_naval') || '';

    this.presupuestosService.consultarRucSunat(proveedor.inputRuc, token).subscribe({
      next: (res: any) => {
        if (res.status === 'success' && res.data) {
          proveedor.inputRazonSocial = res.data.razon_social || res.data.nombre || res.data.razonSocial;
          // Guardamos la data extra silenciosamente en el objeto de la fila
          proveedor.inputDireccion = res.data.direccion;
          proveedor.inputDistrito = res.data.distrito;
          proveedor.inputProvincia = res.data.provincia;
          proveedor.inputDepartamento = res.data.departamento;
        } else {
          alert(res.detail || 'No se encontró Razón Social para este RUC en la SUNAT.');
          proveedor.inputRazonSocial = '';
        }
        proveedor.buscandoRuc = false;
      },
      error: (err: any) => {
        console.error('Error consultando SUNAT:', err);
        alert('Hubo un error al conectar con la API de SUNAT.');
        proveedor.buscandoRuc = false;
      }
    });
  }

  guardarRegularizacion(proveedor: any) {
    if (!proveedor.inputRuc || !proveedor.inputRazonSocial) {
      alert('Debes ingresar el RUC de 11 dígitos y la Razón Social.');
      return;
    }

    proveedor.guardando = true;
    const token = localStorage.getItem('token_naval') || '';
    const payload = {
      ruc: proveedor.inputRuc,
      razon_social: proveedor.inputRazonSocial,
      direccion: proveedor.inputDireccion || '',
      distrito: proveedor.inputDistrito || '',
      provincia: proveedor.inputProvincia || '',
      departamento: proveedor.inputDepartamento || ''
    };

    this.presupuestosService.regularizarProveedor(proveedor.id, payload, token).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.mostrarToastExito('¡Cliente regularizado correctamente!');
          this.cargarPendientes(); 
          this.cargarPresupuestos(); 
        }
        proveedor.guardando = false;
      },
      error: (err: any) => {
        console.error('Error al regularizar:', err);
        alert(err.error?.detail || 'Ocurrió un error al guardar en la base de datos.');
        proveedor.guardando = false;
      }
    });
  }
}