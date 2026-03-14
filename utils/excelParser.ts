
import * as XLSX from 'xlsx';
import { Subject, QuestionStats, OptionBreakdown, StudentAnswerDetail, ProcessedResults } from '../types';

const normalizeValue = (val: any): string | null => {
  if (val === null || val === undefined) return null;
  let str = String(val).trim().toUpperCase();
  if (str.endsWith('.0')) {
    str = str.substring(0, str.length - 2);
  }
  if (str === '' || str === 'NR' || str === 'N/R' || str === 'N.R' || str === 'NULL') {
    return null;
  }
  return str;
};

export const parseExcelFile = async (file: File): Promise<any[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellStyles: true, cellFormula: true, cellLinks: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: "",
          blankrows: false
        });

        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let r = range.s.r; r <= range.e.r; r++) {
          for (let c = range.s.c; c <= range.e.c; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r, c });
            const cell = worksheet[cellAddress];
            if (cell && cell.l && cell.l.Target) {
              const currentVal = String(rawData[r]?.[c] || '').toLowerCase();
              if (!currentVal.startsWith('http')) {
                if (c === 0) {
                   rawData[r][c] = cell.l.Target;
                }
              }
            }
          }
        }

        resolve(rawData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const processAcademicData = (
  estudiantesRaw: any[][],
  respuestasRaw: any[][]
): ProcessedResults => {
  // --- RESPUESTAS ---
  const headerIdxResp = respuestasRaw.findIndex(row => row[1] && row[6]);
  if (headerIdxResp === -1) throw new Error("No se encontró estructura en Respuestas (Col B e ID).");
  
  const itemsClave = respuestasRaw.slice(headerIdxResp + 1).map((row, index) => {
    const id = normalizeValue(row[1]); 
    const correcta = normalizeValue(row[6]); 
    const areaRaw = String(row[2] || '').toLowerCase();
    
    const competencia = String(row[3] || 'No especificada').trim();
    const afirmacion = String(row[4] || 'No especificada').trim();
    const evidencia = String(row[5] || 'No especificada').trim();
    
    let link = String(row[0] || '').trim();
    if (!link.toLowerCase().startsWith('http')) {
        const foundLink = row.find(cell => String(cell).toLowerCase().startsWith('http'));
        if (foundLink) link = String(foundLink);
    }

    return {
      orden: index + 1,
      id,
      correcta,
      materia: (areaRaw.includes('mat') || areaRaw.includes('num')) ? Subject.MATEMATICAS : Subject.LENGUAJE,
      competencia,
      informacion: afirmacion,
      evidencia,
      link: link.toLowerCase().startsWith('http') ? link : undefined
    };
  }).filter(item => item.id !== null && item.correcta !== null);

  // --- ESTUDIANTES ---
  const headerIdxEst = estudiantesRaw.findIndex(row => 
    row.some(cell => {
      const norm = normalizeValue(cell);
      return norm !== null && itemsClave.some(ic => ic.id === norm);
    })
  );
  
  if (headerIdxEst === -1) throw new Error("No se detectaron preguntas en el archivo de Estudiantes.");
  
  const headersEstudiantes = estudiantesRaw[headerIdxEst].map(h => normalizeValue(h));
  const rawHeaders = estudiantesRaw[headerIdxEst].map(h => String(h || '').toUpperCase());

  let nameColIdx = rawHeaders.findIndex(h => h.includes('NOMBRE') || h.includes('ESTUDIANTE') || h.includes('ALUMNO'));
  let groupColIdx = rawHeaders.findIndex(h => h.includes('GRUPO') || h.includes('CURSO') || h.includes('GRADO') || h.includes('SECCIÓN'));

  if (nameColIdx === -1 && groupColIdx === -1) {
    groupColIdx = 0; 
    nameColIdx = 1;  
  } else if (nameColIdx === -1) {
    nameColIdx = groupColIdx === 0 ? 1 : 0;
  } else if (groupColIdx === -1) {
    groupColIdx = nameColIdx === 0 ? 1 : 0;
  }

  const alumnosData = estudiantesRaw.slice(headerIdxEst + 1).filter(row => row[nameColIdx] || row[groupColIdx]);

  // --- ESTADÍSTICAS ---
  const stats: QuestionStats[] = itemsClave.map(item => {
    let aciertos = 0;
    const dist: OptionBreakdown = { A: 0, B: 0, C: 0, D: 0, otros: 0 };
    const colIndex = headersEstudiantes.findIndex(h => h === item.id);
    
    if (colIndex !== -1) {
      alumnosData.forEach(row => {
        const respAlumno = normalizeValue(row[colIndex]);
        if (respAlumno !== null && respAlumno === item.correcta) aciertos++;
        if (respAlumno && ['A', 'B', 'C', 'D'].includes(respAlumno)) {
          dist[respAlumno as keyof OptionBreakdown]++;
        } else if (respAlumno !== null) dist.otros++;
      });
    }

    return {
      orden: item.orden,
      pregunta: item.id!,
      materia: item.materia,
      aciertos,
      total: alumnosData.length,
      porcentaje: alumnosData.length > 0 ? (aciertos / alumnosData.length) * 100 : 0,
      respuestaCorrecta: item.correcta!,
      distribucion: dist,
      competencia: item.competencia,
      informacion: item.informacion,
      evidencia: item.evidencia,
      link: item.link
    };
  });

  const students: StudentAnswerDetail[] = alumnosData.map(row => {
    const nombre = String(row[nameColIdx] || '').trim();
    const grupo = String(row[groupColIdx] || 'N/A').trim();
    const studentAnswers: Record<string, string> = {};
    let studentAciertos = 0;

    itemsClave.forEach(item => {
      const colIndex = headersEstudiantes.findIndex(h => h === item.id);
      if (colIndex !== -1) {
        const ans = normalizeValue(row[colIndex]);
        studentAnswers[item.id!] = ans === null ? 'NR' : ans;
        if (ans !== null && ans === item.correcta) studentAciertos++;
      }
    });

    return { nombre, grupo, respuestas: studentAnswers, aciertos: studentAciertos };
  });

  const leng = stats.filter(s => s.materia === Subject.LENGUAJE);
  const math = stats.filter(s => s.materia === Subject.MATEMATICAS);

  return {
    stats,
    students,
    totalStudents: students.length,
    avgLenguaje: leng.length ? leng.reduce((a, b) => a + b.porcentaje, 0) / leng.length : 0,
    avgMatematicas: math.length ? math.reduce((a, b) => a + b.porcentaje, 0) / math.length : 0,
    detectedColumns: headersEstudiantes.filter(h => h !== null) as string[]
  };
};

export const downloadResultsAsExcel = (results: QuestionStats[]) => {
  const data = results.map(s => ({
    'Orden': s.orden,
    'Pregunta ID': s.pregunta,
    'Aciertos': s.aciertos,
    'Total': s.total,
    '% Logro': `${s.porcentaje.toFixed(1)}%`,
    'Clave': s.respuestaCorrecta,
    'Área': s.materia,
    'Competencia': s.competencia,
    'Información': s.informacion,
    'Evidencia': s.evidencia,
    'URL Pregunta': s.link || ''
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
  XLSX.writeFile(wb, "Reporte_Aciertos.xlsx");
};

export const downloadStudentSummaryAsExcel = (students: StudentAnswerDetail[], totalQuestions: number) => {
  const data = students.map(s => ({
    'Estudiante': s.nombre,
    'Grupo': s.grupo,
    'Aciertos': s.aciertos,
    '% de Acierto': totalQuestions > 0 ? `${((s.aciertos / totalQuestions) * 100).toFixed(1)}%` : '0%'
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Resumen");
  XLSX.writeFile(wb, "Resumen_Aciertos_Estudiantes.xlsx");
};
