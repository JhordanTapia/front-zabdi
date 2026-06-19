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
        id: item.id,
        descripcion_original: item.descripcion,
        cantidad: Number(item.cantidad) || 0,
        precio_unitario: Number(item.precio_unitario) || 0
      }))
    };

    this.presupuestosService.actualizarPresupuesto(this.presupuestoSeleccionado.id, payload, token).subscribe({
      next: (res: any) => {
        alert('¡Cambios guardados con éxito!');
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

  cerrarModales() {
    this.showModalVer = false;
    this.showModalEditar = false;
    this.showModalEstado = false;
    this.presupuestoSeleccionado = null;
    this.itemsDetalle = []; // Limpiamos al cerrar
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
}