export interface Sanction {
  idSanction: number;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  state: boolean;
  user?: {
    idUser?: number;
    names?: string;
    surnames?: string;
    email?: string;
    docNumber?: string;
    docNum?: string;
  };
}
