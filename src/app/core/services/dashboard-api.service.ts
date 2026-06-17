import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageResponse } from '../../shared/interfaces/message-response';
import { Sanction } from '../../shared/interfaces/sanction';
import {
  AttendanceResult,
  ClinicalHistoryItem,
  DiagnosisItem,
  FailureReportItem,
  InstructorAvailability,
  MachineItem,
  MachineResponse,
  MaintenanceItem,
  MedicalRestrictionItem,
  NotificationItem,
  PageResponse,
  PhysicalEvaluationItem,
  ProgressResponse,
  QrPayload,
  Reservation,
  RoutineHistoryItem,
  RoutineResponse,
  ShiftResponse,
  UserProfile,
} from '../../shared/interfaces/dashboard.interface';

export interface SupportTicket {
  code: string;
  userId?: number;
  user: string;
  subject: string;
  lastMessage: string;
  status: 'Escalada' | 'En revision' | 'Resuelta';
  createdAt: string;
  attachment?: string | null;
  response?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly apiUrl = environment.apiUrl;

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

  getAllAttendance(startDate?: string, endDate?: string): Observable<AttendanceResult[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate)   params = params.set('endDate', endDate);
    return this.http.get<AttendanceResult[]>(`${this.apiUrl}/attendance/all`, { params });
  }

  getAllAttendanceByUser(userId: number, startDate?: string, endDate?: string): Observable<AttendanceResult[]> {
    let params = new HttpParams().set('userId', userId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate)   params = params.set('endDate', endDate);
    return this.http.get<AttendanceResult[]>(`${this.apiUrl}/attendance/all`, { params });
  }

  getSanctions(): Observable<Sanction[]> {
    return this.http.get<Sanction[]>(`${this.apiUrl}/api/sanctions`);
  }

  createSanction(data: {
    userId: number;
    description: string;
    type: string;
    clasificacion: string;
    startDate: string;
    endDate: string;
  }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/sanctions`, data);
  }

  updateSanction(id: number, data: {
    description?: string;
    type?: string;
    clasificacion?: string;
    startDate?: string;
    endDate?: string;
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

  createFullGymReservation(data: { reservationDate: string; startTime: string; endTime: string; reason: string }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/reservations/full-gym`, data);
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

  updateMachine(id: number, data: { name: string; type: string; state: boolean }): Observable<MachineResponse> {
    return this.http.put<MachineResponse>(`${this.apiUrl}/api/maquinas/${id}`, data);
  }

  inactivateMachine(id: number): Observable<MachineResponse> {
    return this.http.put<MachineResponse>(`${this.apiUrl}/api/maquinas/${id}/inactivar`, {});
  }

  deleteMachine(id: number): Observable<MachineResponse> {
    return this.http.delete<MachineResponse>(`${this.apiUrl}/api/maquinas/${id}`);
  }

  exportReport(
    format: 'pdf' | 'excel',
    report: 'users' | 'attendance' | 'machines' | 'maintenance' | 'sanctions',
    userId?: number,
    startDate?: string,
    endDate?: string,
    status?: string,
  ): Observable<Blob> {
    let params = new HttpParams();
    if (userId) params = params.set('userId', userId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (status) params = params.set('status', status);
    return this.http.get(`${this.apiUrl}/api/export/${format}/${report}`, {
      params,
      responseType: 'blob',
    });
  }

  generateReport(data: { type: string; format: string; startDate?: string; endDate?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/reports/generate`, data);
  }

  getMyReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/reports/my`);
  }

  getAllReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/reports`);
  }

  createFailureReport(data: { machineId: number; description: string; priority: string }): Observable<FailureReportItem> {
    return this.http.post<FailureReportItem>(`${this.apiUrl}/api/failures`, data);
  }

  getFailureReports(): Observable<FailureReportItem[]> {
    return this.http.get<FailureReportItem[]>(`${this.apiUrl}/api/failures`);
  }

  updateFailureStatus(code: string, status: FailureReportItem['status']): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/api/failures/${code}/status`, { status });
  }

  getMaintenanceReport(startDate?: string, endDate?: string): Observable<MaintenanceItem[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate)   params = params.set('endDate', endDate);
    return this.http.get<MaintenanceItem[]>(`${this.apiUrl}/api/maintenance/report`, { params });
  }

  getSanctionsReport(startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate)   params = params.set('endDate', endDate);
    return this.http.get<any[]>(`${this.apiUrl}/api/sanctions/report`, { params });
  }

  getSanctionsReportByUser(userId?: number, startDate?: string, endDate?: string, status?: string): Observable<any[]> {
    let params = new HttpParams();
    if (userId)    params = params.set('userId', userId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate)   params = params.set('endDate', endDate);
    if (status)    params = params.set('status', status);
    return this.http.get<any[]>(`${this.apiUrl}/api/sanctions/report`, { params });
  }

  getMaintenanceHistory(): Observable<MaintenanceItem[]> {
    return this.http.get<MaintenanceItem[]>(`${this.apiUrl}/api/maintenance`);
  }

  scheduleMaintenance(data: {
    machineId: number;
    type: string;
    description: string;
    date: string;
    responsible: string;
  }): Observable<MachineResponse> {
    return this.http.post<MachineResponse>(`${this.apiUrl}/api/maintenance`, data);
  }

  getProgress(): Observable<ProgressResponse> {
    return this.http.get<ProgressResponse>(`${this.apiUrl}/api/progress/graphs`);
  }

  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.apiUrl}/api/notifications`);
  }

  createNotification(data: {
    titulo: string;
    mensaje: string;
    tipo: string;
    usuarioDestinoId: number;
    fechaExpiracion?: string;
  }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/notifications`, data);
  }

  createNotificationForAll(data: {
    titulo: string;
    mensaje: string;
    tipo: string;
    fechaExpiracion?: string;
  }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/notifications/all`, data);
  }

  markNotificationAsRead(id: number): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(`${this.apiUrl}/api/notifications/${id}/read`, {});
  }

  deleteNotification(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/api/notifications/${id}`);
  }

  getBroadcastHistory(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.apiUrl}/api/notifications/broadcast-history`);
  }

  getAllNotificationsAdmin(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.apiUrl}/api/notifications/admin/all`);
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

  getAllEvaluations(): Observable<PhysicalEvaluationItem[]> {
    return this.http.get<PhysicalEvaluationItem[]>(`${this.apiUrl}/api/evaluations/all`);
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

  markEvaluationAsCompleted(id: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/api/evaluations/${id}/complete`, {});
  }

  sendChatbotMessage(message: string): Observable<{ response?: string; message?: string }> {
    return this.http.post<{ response?: string; message?: string }>(`${this.apiUrl}/api/chatbot/message`, { message });
  }

  createSupportTicket(data: { subject: string; description: string; attachment?: string }): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.apiUrl}/api/support/instructor`, data);
  }

  getSupportTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.apiUrl}/api/support/instructor`);
  }

  getMySupportTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.apiUrl}/api/support/instructor/my`);
  }

  updateSupportTicketStatus(code: string, status: SupportTicket['status']): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/api/support/instructor/${code}/status`, { status });
  }

  replySupportTicket(code: string, message: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/support/instructor/${code}/reply`, { message });
  }

  // Clinical history documents
  uploadClinicalHistoryDocument(historyId: number, file: File): Observable<MessageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MessageResponse>(`${this.apiUrl}/api/clinical-history/${historyId}/documents`, formData);
  }

  getClinicalHistoryDocuments(historyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/clinical-history/${historyId}/documents`);
  }

  downloadClinicalHistoryDocument(historyId: number, docId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/api/clinical-history/${historyId}/documents/${docId}/download`, {
      responseType: 'blob',
    });
  }

  deleteClinicalHistoryDocument(historyId: number, docId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/api/clinical-history/${historyId}/documents/${docId}`);
  }

}
