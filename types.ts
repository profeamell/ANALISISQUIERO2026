
export enum Subject {
  LENGUAJE = 'Lenguaje',
  MATEMATICAS = 'Matemáticas'
}

export interface AnswerKey {
  pregunta: string;
  respuestaCorrecta: string;
  materia: Subject;
}

export interface OptionBreakdown {
  A: number;
  B: number;
  C: number;
  D: number;
  otros: number;
}

export interface StudentAnswerDetail {
  nombre: string;
  grupo: string;
  respuestas: Record<string, string>; // ID Pregunta -> Respuesta del alumno
  aciertos: number;
}

export interface QuestionStats {
  orden: number;
  pregunta: string;
  materia: Subject;
  aciertos: number;
  total: number;
  porcentaje: number;
  respuestaCorrecta: string;
  distribucion: OptionBreakdown;
  competencia?: string;
  informacion?: string;
  evidencia?: string;
  link?: string;
}

export interface ProcessedResults {
  stats: QuestionStats[];
  students: StudentAnswerDetail[];
  totalStudents: number;
  avgLenguaje: number;
  avgMatematicas: number;
  detectedColumns: string[]; 
}
