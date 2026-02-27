import React, { useState } from 'react';
import { PaperRequest, AcademicLevel, Style, Language, Grade } from '../types';
import { BookOpen, GraduationCap, FileText, Layers, Globe, Star } from 'lucide-react';

interface GeneratorFormProps {
  onSubmit: (data: PaperRequest) => void;
  isLoading: boolean;
  loadingStatus: string;
}

const GeneratorForm: React.FC<GeneratorFormProps> = ({ onSubmit, isLoading, loadingStatus }) => {
  const [formData, setFormData] = useState<PaperRequest>({
    theme: '',
    discipline: '',
    level: 'Universidade',
    pages: 5,
    style: 'Normal',
    language: 'Português Angola',
    grade: '14-17'
  });

  const handleChange = (field: keyof PaperRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Gerador de Trabalho Académico</h2>
        <p className="text-slate-500 text-sm">Preencha os dados abaixo para iniciar o pipeline de escrita humanizada.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tema e Disciplina */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <BookOpen size={16} /> Tema do Trabalho
            </label>
            <input
              required
              type="text"
              placeholder="Ex: A cultura angolana"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={formData.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Layers size={16} /> Disciplina
            </label>
            <input
              required
              type="text"
              placeholder="Ex: Sociologia, Informática"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={formData.discipline}
              onChange={(e) => handleChange('discipline', e.target.value)}
            />
          </div>
        </div>

        {/* Nível e Páginas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <GraduationCap size={16} /> Nível Académico
            </label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={formData.level}
              onChange={(e) => handleChange('level', e.target.value as AcademicLevel)}
            >
              <option>Ensino Secundário</option>
              <option>Ensino Médio</option>
              <option>Técnico</option>
              <option>Universidade</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <FileText size={16} /> Nº de Páginas (aprox.)
            </label>
            <input
              type="number"
              min={1}
              max={50}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.pages}
              onChange={(e) => handleChange('pages', parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Estilo e Idioma */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Star size={16} /> Estilo de Escrita
            </label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={formData.style}
              onChange={(e) => handleChange('style', e.target.value as Style)}
            >
              <option>Simples</option>
              <option>Normal</option>
              <option>Aluno médio</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Globe size={16} /> Idioma
            </label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={formData.language}
              onChange={(e) => handleChange('language', e.target.value as Language)}
            >
              <option>Português Angola</option>
              <option>Português Brasil</option>
              <option>Português Portugal</option>
            </select>
          </div>
        </div>

        {/* Nota Desejada (Slider) */}
        <div className="space-y-3 pt-2">
          <label className="text-sm font-medium text-slate-700 flex justify-between">
            <span>Nota Desejada (Intervalo)</span>
            <span className="text-blue-600 font-bold">{formData.grade}</span>
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="1"
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            value={formData.grade === '10-14' ? 1 : formData.grade === '14-17' ? 2 : 3}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              const grades: Grade[] = ['10-14', '14-17', '17-20'];
              handleChange('grade', grades[val - 1]);
            }}
          />
          <div className="flex justify-between text-xs text-slate-400 px-1">
            <span>10-14 (Suficiente)</span>
            <span>14-17 (Bom)</span>
            <span>17-20 (Excelente)</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-lg text-white font-bold text-lg shadow-md transition-all transform hover:scale-[1.01] active:scale-[0.99]
            ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800'}
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {loadingStatus}
            </div>
          ) : (
            'Gerar Trabalho (Preview Grátis)'
          )}
        </button>
      </form>
    </div>
  );
};

export default GeneratorForm;