import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageResponse } from '../../shared/interfaces/message-response';
import { Sanction } from '../../shared/interfaces/sanction';
import {
  AttendanceResult,
  ClinicalHistoryItem,
  DiagnosisItem,
  InstructorAvailability,
  MachineItem,
  MachineResponse,
  MedicalRestrictionItem,
  PageResponse,
  PhysicalEvaluationItem,
  QrPayload,
  Reservation,
  RoutineHistoryItem,
  RoutineResponse,
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

  updateSanction(id: number, data: {
    description: string;
    type: string;
    startDate: string;
    endDate: string;
  }): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/api/sanctions/${id}`, data);
  }

  deleteSanction(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/api/sanctions/${id}`);
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

  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/api/reservations/all`);
  }

  cancelReservation(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/api/reservations/${id}`);
  }

  generateRoutine(): Observable<RoutineResponse> {
    return this.http.post<RoutineResponse>(`${this.apiUrl}/api/routines/generate`, {});
  }

  getActiveRoutine(): Observable<RoutineResponse> {
    return this.http.get<RoutineResponse>(`${this.apiUrl}/api/routines/active`);
  }

  getRoutineHistory(): Observable<RoutineHistoryItem[]> {
    return this.http.get<RoutineHistoryItem[]>(`${this.apiUrl}/api/routines/history`);
  }

  completeRoutine(routineId: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/routines/${routineId}/complete-all`, {});
  }

  getClinicalHistory(userId?: number): Observable<ClinicalHistoryItem[]> {
    let params = new HttpParams();
    if (userId) params = params.set('userId', userId);
    return this.http.get<ClinicalHistoryItem[]>(`${this.apiUrl}/api/clinical-history`, { params });
  }

  createClinicalHistory(data: { description: string; date: string }, userId?: number): Observable<MessageResponse> {
    let params = new HttpParams();
    if (userId) params = params.set('userId', userId);
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/clinical-history`, data, { params });
  }

  updateClinicalHistory(id: number, data: { description: string; date: string }): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/api/clinical-history/${id}`, data);
  }

  deleteClinicalHistory(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/api/clinical-history/${id}`);
  }

  getDiagnosesByUser(userId: number): Observable<DiagnosisItem[]> {
    return this.http.get<DiagnosisItem[]>(`${this.apiUrl}/api/diagnosis/user/${userId}`);
  }

  createDiagnosis(data: {
    userId: number;
    evaluator?: string;
    observations?: string;
    fatPercentage?: number;
    muscleMass?: number;
    height: number;
    weight: number;
    gender?: string;
    age?: number;
    date?: string;
  }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/diagnosis`, data);
  }

  deleteDiagnosis(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/api/diagnosis/${id}`);
  }

  getRestrictionsByDiagnosis(diagnosisId: number): Observable<MedicalRestrictionItem[]> {
    return this.http.get<MedicalRestrictionItem[]>(`${this.apiUrl}/api/diagnosis/${diagnosisId}/restrictions`);
  }

  createRestriction(data: {
    diagnosisId: number;
    description: string;
    type: string;
    startDate?: string;
    endDate?: string;
  }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/diagnosis/restrictions`, data);
  }

  updateRestriction(id: number, data: Partial<MedicalRestrictionItem>): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/api/diagnosis/restrictions/${id}`, data);
  }

  deleteRestriction(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/api/diagnosis/restrictions/${id}`);
  }

  getMachines(): Observable<MachineItem[]> {
    return this.http.get<MachineItem[]>(`${this.apiUrl}/api/maquinas`);
  }

  createMachine(data: { name: string; type: string; state: boolean }): Observable<MachineResponse> {
    return this.http.post<MachineResponse>(`${this.apiUrl}/api/maquinas`, data);
  }

  getEvaluationAvailability(date: string): Observable<InstructorAvailability[]> {
    return this.http.get<InstructorAvailability[]>(`${this.apiUrl}/api/evaluations/availability`, {
      params: new HttpParams().set('date', date),
    });
  }

  createEvaluation(data: {
    date: string;
    startTime: string;
    instructorId: number;
    notes?: string;
  }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/evaluations`, data);
  }

  getMyEvaluations(): Observable<PhysicalEvaluationItem[]> {
    return this.http.get<PhysicalEvaluationItem[]>(`${this.apiUrl}/api/evaluations/my-evaluations`);
  }

  rescheduleEvaluation(id: number, data: {
    date: string;
    startTime: string;
    instructorId: number;
  }): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/api/evaluations/${id}/reschedule`, data);
  }

  cancelEvaluation(id: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/api/evaluations/${id}/cancel`, {});
  }

  sendChatbotMessage(message: string): Observable<{ response?: string; message?: string }> {
    return this.http.post<{ response?: string; message?: string }>(`${this.apiUrl}/api/chatbot/message`, { message });
  }
}
