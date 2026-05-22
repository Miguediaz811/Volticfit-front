import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageResponse } from '../../shared/interfaces/message-response';
import { Sanction } from '../../shared/interfaces/sanction';
import {
  AttendanceResult,
  PageResponse,
  QrPayload,
  Reservation,
  ShiftResponse,
  UserProfile,
} from '../../shared/interfaces/dashboard.interface';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly apiUrl = 'http://localhost:9090';

  constructor(private http: HttpClient) {}

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/auth/usuarios/me`);
  }

  getUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.apiUrl}/auth/listar`);
  }

  updateUser(id: number, data: Partial<UserProfile>): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/auth/usuarios/${id}`, data);
  }

  updateUserRole(id: number, role: string): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/auth/usuarios/${id}/rol`, { role });
  }

  updateUserState(id: number, state: boolean): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/auth/usuarios/${id}/estado`, { state });
  }

  deactivateUser(id: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/auth/usuarios/${id}/inactivar`, {});
  }

  generateAttendanceQr(userId: number): Observable<QrPayload> {
    return this.http.get<QrPayload>(`${this.apiUrl}/attendance/qr`, {
      params: new HttpParams().set('userId', userId),
    });
  }

  scanQr(token: string): Observable<AttendanceResult> {
    return this.http.post<AttendanceResult>(`${this.apiUrl}/attendance/qr/scan`, { token });
  }

  searchAttendanceUser(docNumber: string): Observable<AttendanceResult> {
    return this.http.get<AttendanceResult>(`${this.apiUrl}/attendance/manual/search`, {
      params: new HttpParams().set('docNumber', docNumber),
    });
  }

  registerManualAttendance(docNumber: string): Observable<AttendanceResult> {
    return this.http.post<AttendanceResult>(`${this.apiUrl}/attendance/manual`, { docNumber });
  }

  getAttendanceHistory(page = 0, size = 8): Observable<PageResponse<AttendanceResult>> {
    return this.http.get<PageResponse<AttendanceResult>>(`${this.apiUrl}/attendance/history`, {
      params: new HttpParams().set('page', page).set('size', size),
    });
  }

  getSanctions(): Observable<Sanction[]> {
    return this.http.get<Sanction[]>(`${this.apiUrl}/api/sanctions`);
  }

  createSanction(data: {
    userId: number;
    description: string;
    type: string;
    startDate: string;
    endDate: string;
  }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/sanctions`, data);
  }

  getAvailableShifts(date: string): Observable<ShiftResponse[]> {
    return this.http.get<ShiftResponse[]>(`${this.apiUrl}/api/reservations/shifts`, {
      params: new HttpParams().set('date', date),
    });
  }

  createReservation(date: string, startTime: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/reservations`, { date, startTime });
  }

  getMyReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/api/reservations/my-reservations`);
  }

  cancelReservation(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/api/reservations/${id}`);
  }
}
