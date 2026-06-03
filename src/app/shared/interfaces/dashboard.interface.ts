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

export interface RoutineExercise {
  name: string;
  sets: number;
  reps: number;
  description?: string;
  gifUrl?: string;
  completed?: boolean;
}

export interface RoutineResponse {
  routineId: number;
  objective: string;
  duration: string;
  description: string;
  muscleGroup: string;
  level: string;
  personalized?: boolean;
  isPersonalized?: boolean;
  warningMessage?: string;
  exercises: RoutineExercise[];
}

export interface RoutineHistoryItem {
  assignmentDate?: string;
  state?: boolean;
  active?: boolean;
  routine?: {
    idRoutine: number;
    objective: string;
    duration: string;
    description: string;
    muscleGroup: string;
    level: string;
  };
}

export interface ClinicalHistoryItem {
  idHistory: number;
  description: string;
  date: string;
  user?: UserProfile;
}

export interface DiagnosisItem {
  idDiagnosis: number;
  evaluator?: string;
  observations?: string;
  fatPercentage?: number;
  muscleMass?: number;
  imc?: number;
  height?: number;
  weight?: number;
  gender?: string;
  age?: number;
  date?: string;
  user?: UserProfile;
}

export interface MedicalRestrictionItem {
  idRestriction: number;
  description: string;
  type: string;
  startDate?: string;
  endDate?: string;
  state?: boolean;
  diagnosis?: DiagnosisItem;
}

export interface MachineItem {
  idMachine?: number;
  name: string;
  type: string;
  registrationDate?: string;
  state: boolean;
}

export interface MachineResponse {
  status: 'SUCCESS' | 'ERROR' | string;
  message: string;
}

export interface InstructorAvailability {
  instructorId: number;
  instructorName: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface PhysicalEvaluationItem {
  idEvaluation?: number;
  IdEvaluation?: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  user?: UserProfile;
  instructor?: UserProfile;
}
