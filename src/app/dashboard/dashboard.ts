import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- ¡SUPER IMPORTANTE para ngModel!
import { PresupuestosService } from '../core/services/presupuestos';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule], // <-- Lo agregamos aquí
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  procesando = false; 
  
  // --- ESTADOS DE LOS MODALES ---
  showModalPreview = false;
  showModalPassword = false;
  isEditing = false;
  
  // --- DATOS ---
  datosExtraidos: any = null;
  passwordConfirmacion = '';

  constructor(
    private router: Router, 
    private presupuestosService: PresupuestosService
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('token_naval');
    if (!token) {
      this.router.navigate(['/']);
    }
  }

  // 1. Cuando el usuario sube el Excel
  onArchivoSeleccionado(event: any) {
    const archivo: File = event.target.files[0];
    
    if (archivo) {
      this.procesando = true;
      const token = localStorage.getItem('token_naval') || '';
      
      this.presupuestosService.analizarExcel(archivo, token).subscribe({
        next: (respuesta: any) => {
          this.procesando = false;
          // Guardamos el JSON de la IA y abrimos el modal grande
          this.datosExtraidos = respuesta.data;
          this.showModalPreview = true;
          // Reseteamos el input file para que permita subir el mismo archivo si se cancela
          event.target.value = '';
        },
        error: (err) => {
          this.procesando = false;
          console.error('Error:', err);
          alert('Error analizando el documento. Revisa la consola.');
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
  confirmarYGuardar() {
    if (!this.passwordConfirmacion) {
      alert("Debes ingresar tu contraseña para continuar.");
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
        alert('¡ÉXITO! 🚀\n' + res.mensaje);
        this.cerrarModales();
        // Aquí puedes actualizar tu contador de presupuestos activos
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        // Si es 401, es contraseña incorrecta
        if (err.status === 401) {
          alert('❌ Contraseña incorrecta. Inténtalo de nuevo.');
        } else {
          alert('❌ Error al guardar en la base de datos.');
        }
      }
    });
  }

  cerrarSesion() {
    localStorage.removeItem('token_naval');
    this.router.navigate(['/']);
  }
}