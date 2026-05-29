export interface UserProfile {
  idUser: number;
  names: string;
  surnames?: string;
  email: string;
  phone?: string | number;
  docNum?: string;
  docNumber?: string;
  docType?: string;
  role?: { name?: string } | string;
  state?: boolean;
}

export interface QrPayload {
  qrBase64?: string;
  token?: string;
}

export interface AttendanceResult {
  id?: number;
  fullName?: string;
  docNumber?: string;
  entryTime?: string;
  exitTime?: string;
  registrationType?: string;
  message?: string;
  type?: string;
  userName?: string;
  names?: string;
  lastNames?: string;
  dateTime?: string;
  status?: string;
  [key: string]: unknown;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ShiftResponse {
  shiftId?: number;
  id?: number;
  startTime?: string;
  endTime?: string;
  availableSpots?: number;
  totalSpots?: number;
  capacity?: number;
  status?: string;
  date?: string;
  available?: boolean;
}

export interface Reservation {
  idReservation: number;
  date: string;
  startTime: string;
  endTime: string;
  state: boolean;
  user?: UserProfile;
}
