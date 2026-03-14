
import React, { useState, useMemo } from 'react';
import { ProcessedResults, Subject, QuestionStats, StudentAnswerDetail } from '../types';
import { downloadResultsAsExcel, downloadStudentSummaryAsExcel } from '../utils/excelParser';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardProps {
  results: ProcessedResults;
}

const PERFORMANCE_LEVELS = [
  { name: 'Bajo', min: 0, max: 59.99, color: '#f43f5e' }, // Rose-500
  { name: 'Básico', min: 60, max: 79.99, color: '#f59e0b' }, // Amber-500
  { name: 'Alto', min: 80, max: 94.99, color: '#3b82f6' }, // Blue-500
  { name: 'Superior', min: 95, max: 100, color: '#10b981' } // Emerald-500
];

const PerformancePieChart: React.FC<{ 
  title: string; 
  students: StudentAnswerDetail[]; 
  stats: QuestionStats[];
  subject?: Subject;
}> = ({ title, students, stats, subject }) => {
  const data = useMemo(() => {
    const relevantStats = subject ? stats.filter(s => s.materia === subject) : stats;
    const totalPossible = relevantStats.length;
    
    if (totalPossible === 0) return [];

    const counts = { Bajo: 0, Básico: 0, Alto: 0, Superior: 0 };

    students.forEach(student => {
      let score = 0;
      relevantStats.forEach(q => {
        if (student.respuestas[q.pregunta] === q.respuestaCorrecta) {
          score++;
        }
      });
      
      const percentage = (score / totalPossible) * 100;
      
      if (percentage < 60) counts.Bajo++;
      else if (percentage < 80) counts.Básico++;
      else if (percentage < 95) counts.Alto++;
      else counts.Superior++;
    });

    return PERFORMANCE_LEVELS.map(level => ({
      name: level.name,
      value: counts[level.name as keyof typeof counts],
      color: level.color
    })).filter(d => d.value > 0);
  }, [students, stats, subject]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Distribución por Niveles de Desempeño</p>
      </div>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={140}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: '700', fontSize: '12px', paddingTop: '20px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
        {PERFORMANCE_LEVELS.map(level => {
          const count = data.find(d => d.name === level.name)?.value || 0;
          return (
            <div key={level.name} className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
              <span className="text-[9px] font-black uppercase tracking-widest block mb-1" style={{ color: level.color }}>{level.name}</span>
              <span className="text-2xl font-black text-slate-900">{count}</span>
              <span className="text-[10px] text-slate-400 block font-bold">Estudiantes</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RankingModal: React.FC<{ 
  students: StudentAnswerDetail[]; 
  totalQuestions: number;
  onClose: () => void 
}> = ({ students, totalQuestions, onClose }) => {
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => b.aciertos - a.aciertos);
  }, [students]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Auditoría de Excelencia</span>
            <h2 className="text-4xl font-black italic tracking-tighter">Ranking de Rendimiento</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-10 space-y-4">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Puesto</th>
                <th className="px-6 py-4">Estudiante</th>
                <th className="px-6 py-4 text-center">Grupo</th>
                <th className="px-6 py-4 text-center">Aciertos</th>
                <th className="px-6 py-4 text-right">Porcentaje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedStudents.map((student, index) => {
                const percentage = totalQuestions > 0 ? (student.aciertos / totalQuestions) * 100 : 0;
                return (
                  <tr key={index} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-6">
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm 
                        ${index === 0 ? 'bg-amber-100 text-amber-600' : 
                          index === 1 ? 'bg-slate-200 text-slate-600' : 
                          index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-black text-slate-900 uppercase tracking-tight">{student.nombre}</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 uppercase">{student.grupo}</span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="text-xl font-black text-indigo-600 tabular-nums">{student.aciertos}</span>
                      <span className="text-[10px] text-slate-400 font-bold ml-1">/{totalQuestions}</span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-lg font-black ${percentage > 60 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {percentage.toFixed(1)}%
                        </span>
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${percentage > 60 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
          >
            Cerrar Ranking
          </button>
        </div>
      </div>
    </div>
  );
};

const QuestionDetailModal: React.FC<{ 
  stat: QuestionStats | null; 
  onClose: () => void 
}> = ({ stat, onClose }) => {
  if (!stat) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`p-8 ${stat.materia === Subject.LENGUAJE ? 'bg-emerald-600' : 'bg-blue-600'} text-white`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Pregunta #{stat.orden}</span>
                {stat.link && (
                    <span className="bg-amber-400 text-amber-900 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">Link Activo</span>
                )}
              </div>
              <h2 className="text-3xl font-black italic">ID: {stat.pregunta}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Materia</span>
                <span className="font-bold text-slate-700">{stat.materia}</span>
             </div>
             <div className="bg-indigo-50 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-indigo-400 uppercase block mb-1">Clave</span>
                <span className="font-bold text-indigo-700 text-lg">{stat.respuestaCorrecta}</span>
             </div>
             <div className="bg-emerald-50 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-emerald-400 uppercase block mb-1">% Logro</span>
                <span className="font-bold text-emerald-700 text-lg">{stat.porcentaje.toFixed(1)}%</span>
             </div>
          </div>

          {stat.link && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-8 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="text-center sm:text-left">
                <h4 className="text-lg font-black text-amber-900 tracking-tight flex items-center justify-center sm:justify-start">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                   </svg>
                   Visualizar Pregunta
                </h4>
                <p className="text-xs text-amber-700 font-bold mt-1">Haz clic para abrir el contenido web externo.</p>
              </div>
              <a 
                href={stat.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-amber-200 flex items-center justify-center group"
              >
                Ir al Sitio Web
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          )}

          <div className="space-y-6">
            <section className="space-y-2">
              <h4 className="flex items-center text-xs font-black text-slate-900 uppercase tracking-widest">
                <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] mr-3">C</span>
                Competencia
              </h4>
              <p className="text-slate-600 font-medium leading-relaxed pl-9">
                {stat.competencia || 'No disponible'}
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="flex items-center text-xs font-black text-slate-900 uppercase tracking-widest">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] mr-3">I</span>
                Información / Afirmación
              </h4>
              <p className="text-slate-600 font-medium leading-relaxed pl-9">
                {stat.informacion || 'No disponible'}
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="flex items-center text-xs font-black text-slate-900 uppercase tracking-widest">
                <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] mr-3">E</span>
                Evidencia
              </h4>
              <p className="text-slate-600 font-medium leading-relaxed pl-9">
                {stat.evidencia || 'No disponible'}
              </p>
            </section>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
          >
            Cerrar Detalles
          </button>
        </div>
      </div>
    </div>
  );
};

const QuestionCard: React.FC<{ stat: QuestionStats; onOpenDetails: (s: QuestionStats) => void }> = ({ stat, onOpenDetails }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full relative overflow-hidden group">
    {stat.link && (
      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <a 
          href={stat.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          title="Ver Pregunta"
          className="bg-amber-100 text-amber-600 p-2 rounded-lg hover:bg-amber-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    )}
    
    <div className="flex justify-between items-start mb-4">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Orden #{stat.orden}</span>
        <h4 className="text-2xl font-black text-slate-900 leading-none">ID: {stat.pregunta}</h4>
      </div>
      <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${stat.materia === Subject.LENGUAJE ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
        {stat.materia}
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-3 mb-4 text-center">
      <div className="bg-slate-50 p-3 rounded-xl">
        <span className="text-[9px] font-bold text-slate-400 uppercase block">Clave</span>
        <span className="text-xl font-black text-slate-900">{stat.respuestaCorrecta}</span>
      </div>
      <div className="bg-indigo-50 p-3 rounded-xl">
        <span className="text-[9px] font-bold text-indigo-400 uppercase block">Aciertos</span>
        <span className="text-xl font-black text-indigo-600">{stat.aciertos}</span>
      </div>
    </div>

    <div className="space-y-1 mb-6">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-slate-500">Nivel de Logro</span>
        <span className={stat.porcentaje > 60 ? 'text-emerald-500' : 'text-rose-500'}>{stat.porcentaje.toFixed(1)}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-700 ${stat.porcentaje > 60 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
          style={{ width: `${stat.porcentaje}%` }}
        />
      </div>
    </div>

    <button 
      onClick={() => onOpenDetails(stat)}
      className="mt-auto w-full py-3 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-indigo-100"
    >
      Ver Información Pedagógica
    </button>
  </div>
);

const PedagogicalAnalysis: React.FC<{ stats: QuestionStats[] }> = ({ stats }) => {
  const [subjectFilter, setSubjectFilter] = useState<Subject>(Subject.LENGUAJE);

  const filteredStats = useMemo(() => {
    return stats.filter(s => s.materia === subjectFilter);
  }, [stats, subjectFilter]);

  const analysis = useMemo(() => {
    const groupBy = (key: 'competencia' | 'informacion' | 'evidencia') => {
      const groups: Record<string, { name: string; total: number; count: number; materia: Subject; questions: string[] }> = {};
      
      filteredStats.forEach(s => {
        const val = s[key] || 'No especificada';
        if (!groups[val]) {
          groups[val] = { name: val, total: 0, count: 0, materia: s.materia, questions: [] };
        }
        groups[val].total += s.porcentaje;
        groups[val].count += 1;
        groups[val].questions.push(s.pregunta);
      });

      return Object.values(groups)
        .map(g => ({
          name: g.name,
          percentage: g.total / g.count,
          count: g.count,
          materia: g.materia,
          questions: g.questions
        }))
        .sort((a, b) => a.percentage - b.percentage);
    };

    return {
      competencias: groupBy('competencia'),
      afirmaciones: groupBy('informacion'),
      evidencias: groupBy('evidencia')
    };
  }, [filteredStats]);

  const renderSection = (title: string, data: any[], color: string, icon: string) => (
    <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg`} style={{ backgroundColor: color }}>
              {icon}
            </span>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 ml-11">Análisis de Desempeño y Falencias Críticas</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 20, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Logro Promedio']}
                />
                <Bar dataKey="percentage" fill={color} radius={[0, 10, 10, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] text-slate-400 font-bold italic text-center uppercase tracking-widest">Mostrando los 8 ítems con menor rendimiento</p>
        </div>

        <div className="space-y-5">
          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 animate-pulse" />
            Diagnóstico de Falencias Concretas
          </h4>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {data.map((item, idx) => (
              <div key={idx} className={`p-6 rounded-[2rem] border transition-all duration-300 ${item.percentage < 60 ? 'bg-rose-50/30 border-rose-100' : 'bg-slate-50 border-slate-100'} hover:shadow-md`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.materia === Subject.LENGUAJE ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      {item.materia}
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[8px] font-black text-slate-400 uppercase">
                      {item.count} {item.count === 1 ? 'Pregunta' : 'Preguntas'}
                    </span>
                  </div>
                  <span className={`text-lg font-black ${item.percentage < 60 ? 'text-rose-600' : 'text-amber-600'}`}>
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
                
                <p className="text-xs font-black text-slate-800 leading-relaxed uppercase tracking-tight mb-4">
                  {item.name}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {item.questions.map((qId: string) => (
                    <span key={qId} className="bg-white/80 px-2 py-1 rounded-lg text-[9px] font-bold text-slate-500 border border-slate-100">
                      ID: {qId}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {data.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 text-sm font-medium italic">No se encontraron datos para los filtros seleccionados.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-center mb-8">
        <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1">
          {[Subject.LENGUAJE, Subject.MATEMATICAS].map(f => (
            <button
              key={f}
              onClick={() => setSubjectFilter(f as any)}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${subjectFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {renderSection("Competencias", analysis.competencias, "#6366f1", "C")}
      {renderSection("Afirmaciones", analysis.afirmaciones, "#8b5cf6", "A")}
      {renderSection("Evidencias", analysis.evidencias, "#ec4899", "E")}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ results }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'lenguaje' | 'matematicas' | 'audit' | 'pedagogico'>('general');
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionStats | null>(null);
  const [isRankingOpen, setIsRankingOpen] = useState(false);

  const lenguajeStats = results.stats.filter(s => s.materia === Subject.LENGUAJE);
  const mathStats = results.stats.filter(s => s.materia === Subject.MATEMATICAS);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <QuestionDetailModal 
        stat={selectedQuestion} 
        onClose={() => setSelectedQuestion(null)} 
      />

      {isRankingOpen && (
        <RankingModal 
          students={results.students} 
          totalQuestions={results.stats.length} 
          onClose={() => setIsRankingOpen(false)} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Estudiantes Analizados</p>
          <p className="text-6xl font-black mt-2 tracking-tighter">{results.totalStudents}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Aciertos Lenguaje (Media)</p>
          <p className="text-6xl font-black mt-2 text-emerald-500 tracking-tighter">{results.avgLenguaje.toFixed(1)}%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Aciertos Matemáticas (Media)</p>
          <p className="text-6xl font-black mt-2 text-blue-500 tracking-tighter">{results.avgMatematicas.toFixed(1)}%</p>
        </div>
      </div>

      <div className="flex justify-center sticky top-[90px] z-30">
        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-[2rem] inline-flex gap-1 shadow-2xl border border-white">
          {[
            { id: 'general', label: 'Reporte de Auditoría' },
            { id: 'lenguaje', label: 'Lenguaje' },
            { id: 'matematicas', label: 'Matemáticas' },
            { id: 'pedagogico', label: 'Análisis Pedagógico' },
            { id: 'audit', label: 'Respuesta Individual' }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        {activeTab === 'general' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-5 duration-700">
            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Análisis de Aciertos por Ítem</h3>
                <button 
                  onClick={() => downloadResultsAsExcel(results.stats)}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all shadow-xl"
                >
                  Descargar Reporte Excel
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                      <th className="px-6 py-5 italic">Orden</th>
                      <th className="px-6 py-5">ID Pregunta</th>
                      <th className="px-6 py-5">Materia</th>
                      <th className="px-6 py-5 text-center">Clave</th>
                      <th className="px-6 py-5 text-center bg-indigo-50/50 rounded-t-2xl">Aciertos</th>
                      <th className="px-6 py-5 text-right">% Logro</th>
                      <th className="px-6 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {results.stats.map(s => (
                      <tr key={s.pregunta} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5 text-slate-400 font-black italic">#{s.orden}</td>
                        <td className="px-6 py-5">
                          <span className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black tracking-tighter">
                            {s.pregunta}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${s.materia === Subject.LENGUAJE ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                            {s.materia}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center font-black text-lg text-slate-900">
                          {s.respuestaCorrecta}
                        </td>
                        <td className="px-6 py-5 text-center bg-indigo-50/20">
                          <span className="text-4xl font-black text-indigo-600 tabular-nums">
                            {s.aciertos}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className={`text-lg font-black ${s.porcentaje > 60 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {s.porcentaje.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right flex items-center justify-end space-x-2">
                          {s.link && (
                            <a 
                              href={s.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-3 bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all border border-amber-100"
                              title="Visitar Pregunta"
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                               </svg>
                            </a>
                          )}
                          <button 
                            onClick={() => setSelectedQuestion(s)}
                            className="p-3 bg-slate-100 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-xl transition-all"
                            title="Ver Detalles"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <PerformancePieChart 
              title="Rendimiento General de Estudiantes" 
              students={results.students} 
              stats={results.stats} 
            />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Matriz de Auditoría Individual</h3>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Análisis detallado por estudiante</p>
               </div>
               <div className="flex gap-3">
                 <button 
                    onClick={() => setIsRankingOpen(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-xl flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Ver Ranking
                  </button>
                  <button 
                    onClick={() => downloadStudentSummaryAsExcel(results.students, results.stats.length)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all shadow-xl"
                  >
                    Exportar Resumen Excel
                  </button>
               </div>
            </div>
            <div className="overflow-x-auto max-h-[700px]">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-5 font-black text-slate-600 uppercase text-center sticky left-0 bg-slate-50 z-20 min-w-[100px] border-r border-slate-200">
                      Grupo
                    </th>
                    <th className="px-8 py-5 font-black text-slate-500 uppercase border-r border-slate-200 min-w-[300px]">
                      Estudiante
                    </th>
                    <th className="px-4 py-5 font-black text-indigo-600 text-center bg-indigo-50/30 border-r border-slate-200">Total Aciertos</th>
                    {results.stats.map(s => (
                      <th key={s.pregunta} className="px-3 py-5 font-black text-center border-l border-slate-200 min-w-[60px] text-black">ID:{s.pregunta}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.students.map((student, sIdx) => (
                    <tr key={sIdx} className="hover:bg-indigo-50/10 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-slate-500 border-r border-slate-100 bg-white sticky left-0 z-10">
                        {student.grupo}
                      </td>
                      <td className="px-8 py-4 bg-white font-black text-slate-900 border-r border-slate-100">
                        <div className="text-sm font-black text-slate-900 truncate uppercase">
                          {student.nombre}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-black text-indigo-600 bg-indigo-50/5 text-base border-r border-slate-100">
                        {student.aciertos}
                      </td>
                      {results.stats.map(s => {
                        const val = student.respuestas[s.pregunta];
                        const isCorrect = val === s.respuestaCorrecta && val !== 'NR';
                        return (
                          <td key={s.pregunta} className={`px-3 py-4 text-center border-l border-slate-50 font-black text-sm ${
                            val === 'NR' ? 'text-slate-200 italic' : isCorrect ? 'text-emerald-500 bg-emerald-50/40' : 'text-rose-500 bg-rose-50/40'
                          }`}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'lenguaje' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-5">
              {lenguajeStats.map(s => <QuestionCard key={s.pregunta} stat={s} onOpenDetails={setSelectedQuestion} />)}
            </div>
            <PerformancePieChart 
              title="Rendimiento en Lenguaje" 
              students={results.students} 
              stats={results.stats} 
              subject={Subject.LENGUAJE} 
            />
          </div>
        )}

        {activeTab === 'matematicas' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-5">
              {mathStats.map(s => <QuestionCard key={s.pregunta} stat={s} onOpenDetails={setSelectedQuestion} />)}
            </div>
            <PerformancePieChart 
              title="Rendimiento en Matemáticas" 
              students={results.students} 
              stats={results.stats} 
              subject={Subject.MATEMATICAS} 
              />
          </div>
        )}

        {activeTab === 'pedagogico' && (
          <PedagogicalAnalysis stats={results.stats} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
