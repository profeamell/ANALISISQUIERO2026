
import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { parseExcelFile, processAcademicData } from './utils/excelParser';

const App: React.FC = () => {
  const [estudiantesFile, setEstudiantesFile] = useState<File | null>(null);
  const [respuestasFile, setRespuestasFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = useCallback(async () => {
    if (!estudiantesFile || !respuestasFile) {
      setError("Por favor, sube ambos archivos (Estudiantes y Respuestas) para continuar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [estudiantesData, respuestasData] = await Promise.all([
        parseExcelFile(estudiantesFile), 
        parseExcelFile(respuestasFile)
      ]);

      const processed = processAcademicData(estudiantesData, respuestasData);
      setResults(processed);
    } catch (err: any) {
      console.error(err);
      setError(`Error de procesamiento: ${err.message}.`);
    } finally {
      setLoading(false);
    }
  }, [estudiantesFile, respuestasFile]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 p-2.5 rounded-2xl shadow-lg transform -rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">EduAnalisQuieroSerQuieroAprender</h1>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Institucion Educativa la Pascuala</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Análisis por Cruce de Datos</p>
            </div>
          </div>
          {results && (
            <button 
              onClick={() => setResults(null)}
              className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg"
            >
              Cargar Nuevos Datos
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-10">
        {!results ? (
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="bg-white p-6 rounded-[3rem] shadow-xl border border-slate-100 transform hover:scale-105 transition-transform duration-500">
                <img 
                  src="https://i.imgur.com/0qZu5IB.png" 
                  alt="Logo Institucional" 
                  className="h-48 w-auto object-contain"
                />
              </div>
              <div className="space-y-4">
                <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">Auditoría Académica</span>
                <h2 className="text-5xl font-black text-slate-900 leading-tight tracking-tighter">Procesamiento de Respuestas</h2>
                <p className="text-lg text-slate-500 font-medium italic">Sincroniza tus archivos para auditar el rendimiento individual.</p>
              </div>
            </div>

            <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 space-y-10 relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                <FileUpload 
                  label="1. Archivo Estudiantes" 
                  description="Col A: Grupo, Col B: Estudiante, Col C+: Respuestas"
                  accept=".xlsx, .xls"
                  onFileSelect={setEstudiantesFile}
                  selectedFileName={estudiantesFile?.name}
                />
                <FileUpload 
                  label="2. Archivo Respuestas" 
                  description="Col B: ID Pregunta, Col G: Respuesta Correcta"
                  accept=".xlsx, .xls"
                  onFileSelect={setRespuestasFile}
                  selectedFileName={respuestasFile?.name}
                />
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl animate-in shake duration-500">
                  <p className="text-sm font-bold text-rose-600 text-center flex items-center justify-center">
                    {error}
                  </p>
                </div>
              )}

              <button
                onClick={handleProcess}
                disabled={loading || !estudiantesFile || !respuestasFile}
                className={`w-full py-6 rounded-[2.5rem] font-black text-xl text-white shadow-2xl transition-all
                  ${loading || !estudiantesFile || !respuestasFile 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}`}
              >
                {loading ? 'Analizando...' : 'Iniciar Auditoría'}
              </button>
            </div>
          </div>
        ) : (
          <Dashboard results={results} />
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
            EduAnalisQuieroSerQuieroAprender - I.E. La Pascuala &copy; 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
