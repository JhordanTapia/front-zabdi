import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { PresupuestosComponent } from './presupuestos/presupuestos'; // <-- Importamos la clase con "Component" al final

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'presupuestos', component: PresupuestosComponent }, // <-- Y la usamos aquí
  { path: '**', redirectTo: '' } 
];