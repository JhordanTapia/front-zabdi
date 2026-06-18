import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PresupuestosService {
  private apiUrl = 'http://127.0.0.1:8000/api'; 

  constructor(private http: HttpClient) { }

  procesarExcel(archivo: File, token: string): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo); // 'archivo' debe ser igual que en el main.py

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.apiUrl}/presupuestos/procesar-excel`, formData, { headers });
  }
}