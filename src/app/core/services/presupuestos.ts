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

  // 3. Fase de Lectura: Traer todos los presupuestos de PostgreSQL
  obtenerListaPresupuestos(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/presupuestos/lista`, { headers });
  }

  // 4. Traer los ítems de un presupuesto específico
  obtenerDetallePresupuesto(id: number, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/presupuestos/${id}/detalle`, { headers });
  }

  // 5. Actualizar presupuesto e ítems
  actualizarPresupuesto(id: number, payload: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put(`${this.apiUrl}/presupuestos/${id}/actualizar`, payload, { headers });
  }

 // 6. Actualizar solo el estado del presupuesto
  actualizarEstado(id: number, id_estado: number, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    // Mandamos el JSON que espera Python: { id_estado: X }
    return this.http.put(`${this.apiUrl}/presupuestos/${id}/estado`, { id_estado }, { headers });
  }

  // 7. Traer proveedores pendientes (sin RUC)
  obtenerProveedoresPendientes(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(`${this.apiUrl}/proveedores/pendientes`, { headers });
  }

 // 8. Regularizar proveedor (Unir RUC y Razón Social al Apodo)
  regularizarProveedor(id: number, payload: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put(`${this.apiUrl}/proveedores/${id}/regularizar`, payload, { headers });
  }

  // 9. Consultar RUC a través de nuestro Backend (Seguro)
  consultarRucSunat(ruc: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(`${this.apiUrl}/sunat/consultar-ruc/${ruc}`, { headers });
  }
}
