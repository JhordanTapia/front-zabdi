import { Component, OnInit } from '@angular/core'; // <-- Importamos OnInit
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { HttpClient } from '@angular/common/http'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html', 
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  recordarme = false; // <-- 1. NUEVA VARIABLE PARA EL CHECKBOX

  // --- CONTROL DEL TOAST ---
  showToast = false;
  mensajeToast = '';
  esErrorToast = false;

  constructor(private http: HttpClient, private router: Router) {}

  // <-- 2. AL ABRIR LA APP, REVISAMOS SI DEBEMOS AUTO-COMPLETAR
  ngOnInit() {
    const correoGuardado = localStorage.getItem('astillero_correo_guardado');
    if (correoGuardado) {
      this.email = correoGuardado;
      this.recordarme = true;
    }
  }

  ingresar() {
    const body = {
      email: this.email,
      password: this.password
    };

    this.http.post('http://127.0.0.1:8000/api/login', body).subscribe({
      next: (respuesta: any) => {
        // Guardamos el token de seguridad
        localStorage.setItem('token_naval', respuesta.access_token);
        
        // <-- 3. LA MAGIA DEL CHECKBOX
        if (this.recordarme) {
          localStorage.setItem('astillero_correo_guardado', this.email);
        } else {
          localStorage.removeItem('astillero_correo_guardado');
        }
        
        // Nos teletransportamos al Dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error al loguearse:', error);
        this.mostrarToast("Credenciales incorrectas, mi king. Intenta de nuevo.", true);
      }
    });
  }

  // --- FUNCIÓN DEL TOAST DINÁMICO ---
  mostrarToast(mensaje: string, esError: boolean = false) {
    this.mensajeToast = mensaje;
    this.esErrorToast = esError;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 3500);
  }
}