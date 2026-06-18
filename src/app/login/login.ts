import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { HttpClient } from '@angular/common/http'; 
import { Router } from '@angular/router'; // <-- NUEVO: Importamos el Router

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html', 
})
export class LoginComponent {
  email = '';
  password = '';

  // <-- NUEVO: Inyectamos el Router en el constructor
  constructor(private http: HttpClient, private router: Router) {}

  ingresar() {
    const body = {
      email: this.email,
      password: this.password
    };

    this.http.post('http://127.0.0.1:8000/api/login', body).subscribe({
      next: (respuesta: any) => {
        console.log('¡Éxito! Python nos devolvió esto:', respuesta);
        
        // 1. Guardamos el pase VIP en el bolsillo (localStorage)
        localStorage.setItem('token_naval', respuesta.access_token);
        
        // 2. Nos teletransportamos al Dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error al loguearse:', error);
        alert("Credenciales incorrectas, mi king"); // Un aviso chiquito si falla
      }
    });
  }
}