// src/app/shared/validators/regex.constants.ts
export const RegexPatterns = {
  soloLetras: /^[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ ]+$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  telefono: /^[0-9]{10,14}$/,
  passwordVoltic: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/,
  documentNumber: /^[0-9]{5,20}$/
} as const;