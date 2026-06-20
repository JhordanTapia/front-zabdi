import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- ¡SUPER IMPORTANTE para ngModel!
import { PresupuestosService } from '../core/services/presupuestos';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // <-- Lo agregamos aquí
  templateUrl: './dashboard.html',
})

export class DashboardComponent implements OnInit {
  procesando = false; 
  monedaSubida = 'PEN';
  
  // --- ESTADOS DE LOS MODALES ---
  showModalPreview = false;
  showModalPassword = false;
  isEditing = false;
  
  // --- CONTROL DEL TOAST ---
  showToast = false;
  mensajeToast = '';
  esErrorToast = false;
  
  // --- DATOS ---
  datosExtraidos: any = null;
  passwordConfirmacion = '';
  listaPresupuestos: any[] = []; // <-- NUEVO: Aquí guardamos las cabeceras de PostgreSQL

  constructor(
    private router: Router, 
    private presupuestosService: PresupuestosService
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('token_naval');
    if (!token) {
      this.router.navigate(['/']);
    } else {
      this.cargarPresupuestos(); // <-- NUEVO: Cargamos la tabla apenas entra el operador
    }
  }

  // NUEVO: Método para traer la data real de la BD al dashboard
  cargarPresupuestos() {
    const token = localStorage.getItem('token_naval') || '';
    
    this.presupuestosService.obtenerListaPresupuestos(token).subscribe({
      next: (respuesta: any) => {
        if (respuesta.status === 'success') {
          this.listaPresupuestos = respuesta.data; // Inyectamos el arreglo a la vista
        }
      },
      error: (err: any) => {
        console.error('Error cargando presupuestos de la BD:', err);
      }
    });
  }

  // 1. Cuando el usuario sube el Excel
  onArchivoSeleccionado(event: any) {
    const archivo: File = event.target.files[0];
    
    if (archivo) {
      this.procesando = true;
      const token = localStorage.getItem('token_naval') || '';
      
      // Magia: Le mandamos la moneda al servicio
      this.presupuestosService.analizarExcel(archivo, token, this.monedaSubida).subscribe({
        next: (respuesta: any) => {
          this.procesando = false;
          this.datosExtraidos = respuesta.data;
          this.showModalPreview = true;
          event.target.value = '';
        },
        error: (err: any) => {
          this.procesando = false;
          console.error('Error:', err);
          this.mostrarToast('Error analizando el documento. Revisa la consola.', true);
        }
      });
    }
  }

  // --- CONTROLES DE LA INTERFAZ ---
  cerrarModales() {
    this.showModalPreview = false;
    this.showModalPassword = false;
    this.isEditing = false;
    this.datosExtraidos = null;
    this.passwordConfirmacion = '';
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  solicitarGuardado() {
    // Abrimos el modal pequeño de contraseña
    this.showModalPassword = true;
  }

  // 2. Cuando el usuario pone su clave y le da a Confirmar
  // 2. Cuando el usuario pone su clave y le da a Confirmar
  confirmarYGuardar() {
    if (!this.passwordConfirmacion) {
      this.mostrarToast("Debes ingresar tu contraseña para continuar.", true);
      return;
    }

    const token = localStorage.getItem('token_naval') || '';
    
    // Armamos el paquete con los datos (editados o no) y la clave
    const payload = {
      ...this.datosExtraidos,
      password_confirmacion: this.passwordConfirmacion
    };

    this.presupuestosService.guardarConfirmado(payload, token).subscribe({
      next: (res: any) => {
        this.mostrarToast('¡Presupuesto guardado con éxito!');
        this.cerrarModales();
        this.cargarPresupuestos(); // Refrescamos la tabla automáticamente tras guardar
      },
      error: (err: any) => {
        console.error('Error al guardar:', err);
        // Si es 401, es contraseña incorrecta
        if (err.status === 401) {
          this.mostrarToast('Contraseña incorrecta. Inténtalo de nuevo.', true);
        } else {
          this.mostrarToast('Error al guardar en la base de datos.', true);
        }
      }
    });
  }

  // --- FUNCIÓN DEL TOAST DINÁMICO ---
  mostrarToast(mensaje: string, esError: boolean = false) {
    this.mensajeToast = mensaje;
    this.esErrorToast = esError;
    this.showToast = true;
    
    // Se esconde solito a los 3.5 segundos
    setTimeout(() => {
      this.showToast = false;
    }, 3500);
  }
  
obtenerSimboloMoneda(moneda: string | undefined): string {
    if (moneda === 'USD') return '$';
    if (moneda === 'EUR') return '€';
    return 'S/'; // PEN por defecto
  }

  cerrarSesion() {
    localStorage.removeItem('token_naval');
    this.router.navigate(['/']);
  }
}