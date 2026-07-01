export interface Sanction {
  idSanction: number;
  description: string;
  type: string;
  clasificacion?: string;
  startDate: string;
  endDate: string;
  state: boolean;
  // Campos del usuario vinculado (vienen del SanctionWithUserDTO del backend)
  userId?: number;
  userNames?: string;
  userSurnames?: string;
  userDoc?: string;
  userEmail?: string;
  // Compatibilidad con estructura anterior anidada
  user?: {
    idUser?: number;
    names?: string;
    surnames?: string;
    email?: string;
    docNum?: string;
  };
}