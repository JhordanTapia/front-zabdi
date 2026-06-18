import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard'; // <-- Ahora sí lo va a encontrar

export const routes: Routes = [
  { path: '', component: LoginComponent }, 
  { path: 'dashboard', component: DashboardComponent }, 
  { path: '**', redirectTo: '' } 
];