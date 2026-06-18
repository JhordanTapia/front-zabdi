import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // <-- Necesario para el *ngIf
import { PresupuestosService } from '../core/services/presupuestos'; // <-- Ajusta la ruta si es distinta

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  procesando = false; // Bandera para mostrar el loader
  
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

  onArchivoSeleccionado(event: any) {
    const archivo: File = event.target.files[0];
    
    if (archivo) {
      this.procesando = true; // Prendemos el loader
      const token = localStorage.getItem('token_naval') || '';
      
      this.presupuestosService.procesarExcel(archivo, token).subscribe({
        next: (respuesta: any) => {
          this.procesando = false;
          alert('¡ÉXITO! 🚀\n' + respuesta.mensaje);
          // Aquí luego podemos actualizar la lista de "Presupuestos Activos"
        },
        error: (err) => {
          this.procesando = false;
          console.error('Error:', err);
          alert('Error procesando el documento. Revisa la consola.');
        }
      });
    }
  }

  cerrarSesion() {
    localStorage.removeItem('token_naval');
    this.router.navigate(['/']);
  }
}