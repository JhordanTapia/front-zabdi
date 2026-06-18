import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PresupuestosService {
  private apiUrl = 'http://127.0.0.1:8000/api'; 

  constructor(private http: HttpClient) { }

  // 1. Fase de Análisis (Solo IA)
  analizarExcel(archivo: File, token: string): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.apiUrl}/presupuestos/analizar-excel`, formData, { headers });
  }

  // 2. Fase de Guardado Confirmado
  guardarConfirmado(payload: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/presupuestos/guardar-confirmado`, payload, { headers });
  }
}