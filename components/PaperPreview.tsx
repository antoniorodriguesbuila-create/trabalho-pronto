import React, { useEffect, useState, useMemo } from 'react';
import { GeneratedPaper } from '../types';
import { Lock, FileText, ShieldAlert, EyeOff, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

interface PaperPreviewProps {
  paper: GeneratedPaper;
  isUnlocked: boolean;
  onRequestUnlock: () => void;
  onBack: () => void;
}

const PaperPreview: React.FC<PaperPreviewProps> = ({ paper, isUnlocked, onRequestUnlock, onBack }) => {
  const [isBlurred, setIsBlurred] = useState(false);
  const [securityWarning, setSecurityWarning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Lógica de Paginação
  const pages = useMemo(() => {
    // 1. Tenta dividir pelos marcadores inseridos pela IA
    let splitContent = paper.content.split('<!--PAGE_BREAK-->');
    
    // 2. Fallback: Se não houver marcadores (trabalhos antigos), tenta dividir antes de cada H2
    if (splitContent.length === 1) {
       // Adiciona o marcador artificialmente antes dos H2, exceto o primeiro se estiver muito no topo
       const manualSplit = paper.content.replace(/(<h2)/g, '<!--PAGE_BREAK-->$1');
       splitContent = manualSplit.split('<!--PAGE_BREAK-->');
    }

    // Filtra páginas vazias que podem surgir do split
    return splitContent.filter(p => p.trim().length > 0);
  }, [paper.content]);

  const totalPages = pages.length;

  // Reset page when paper changes
  useEffect(() => {
    setCurrentPage(1);
  }, [paper.title]);

  // Efeito para adicionar classe ao body para bloquear impressão via browser SE bloqueado
  useEffect(() => {
    if (!isUnlocked) {
      document.body.classList.add('printing-locked');
    } else {
      document.body.classList.remove('printing-locked');
    }
    return () => {
      document.body.classList.remove('printing-locked');
    };
  }, [isUnlocked]);

  // Efeito Anti-Screenshot / Anti-Copy
  useEffect(() => {
    if (isUnlocked) {
      setIsBlurred(false);
      return;
    }

    // 1. Desfocar ao perder foco
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => {
      setIsBlurred(false);
      setSecurityWarning(false);
    };

    // 2. Detetar teclas
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isUnlocked) return;

      if (e.key === 'PrintScreen') {
        setIsBlurred(true);
        setSecurityWarning(true);
        navigator.clipboard.writeText(''); 
        alert('Ação Bloqueada: Realize o pagamento para baixar o documento.');
      }

      if (
        (e.metaKey && e.shiftKey) || // Mac
        (e.ctrlKey && e.key === 'p') || // Ctrl+P
        (e.key === 'Meta' || e.key === 'OS')
      ) {
        setIsBlurred(true);
        setSecurityWarning(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
       if (e.key === 'PrintScreen' && !isUnlocked) {
         setIsBlurred(true);
         setSecurityWarning(true);
         navigator.clipboard.writeText('');
       }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isUnlocked]);

  // Download para Word corrigido (Codificação UTF-8)
  const handleWordDownload = () => {
    if (!isUnlocked) return;
    
    // Adiciona o cabeçalho necessário para o Word reconhecer acentos
    // E especifica Times New Roman no CSS inline do Word também
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' 
                          xmlns:w='urn:schemas-microsoft-com:office:word' 
                          xmlns='http://www.w3.org/TR/REC-html40'>
                    <head>
                      <meta charset='utf-8'>
                      <title>Documento</title>
                      <style>
                        @page { size: A4; margin: 3cm 2cm 2cm 3cm; }
                        body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; }
                        p, h1, h2, h3, h4, li { font-family: 'Times New Roman', Times, serif; }
                        p, li { text-align: justify; }
                        p { text-indent: 1.25cm; margin-top: 0; margin-bottom: 0; }
                        h1, h2, h3 { margin-top: 24pt; margin-bottom: 12pt; }
                      </style>
                    </head><body>`;
    const footer = "</body></html>";
    
    // Processar o conteúdo para o Word
    let formattedContent = paper.content;
    
    // 1. Remover quebras de página existentes para resetar a formatação
    formattedContent = formattedContent.replace(/<!--PAGE_BREAK-->/g, '<br><br>');
    
    // 2. Inserir quebras de página ANTES das secções principais para isolá-las
    const pageBreakHTML = '<br clear="all" style="page-break-before:always; mso-break-type:page-break" />';
    
    // Introdução
    formattedContent = formattedContent.replace(/(<h2[^>]*>\s*(?:1\.\s*)?Introdução\s*<\/h2>)/i, `${pageBreakHTML}$1`);
    
    // Primeiro Capítulo de Desenvolvimento (Sempre começa com 2.)
    formattedContent = formattedContent.replace(/(<h2[^>]*>\s*2\.\s*[^<]+<\/h2>)/i, `${pageBreakHTML}$1`);
    
    // Conclusão
    formattedContent = formattedContent.replace(/(<h2[^>]*>\s*Conclusão\s*<\/h2>)/i, `${pageBreakHTML}$1`);
    
    // Referências Bibliográficas
    formattedContent = formattedContent.replace(/(<h2[^>]*>\s*Referências bibliográficas\s*<\/h2>)/i, `${pageBreakHTML}$1`);
    
    const sourceHTML = header + formattedContent + footer;
    
    // Adiciona o BOM (\ufeff) para forçar o Word a ler como UTF-8 e evitar cortes no texto
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Trabalho_${paper.request.theme.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const preventActions = (e: React.SyntheticEvent | React.MouseEvent) => {
    if (!isUnlocked) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  const watermarks = Array(20).fill("PRÉ-VISUALIZAÇÃO • PAGAMENTO PENDENTE");

  return (
    <div className="flex flex-col lg:flex-row gap-8 select-none">
      {/* Estilos específicos para Impressão Nativa (Ctrl+P Backup) */}
      <style>{`
        /* Forçar Times New Roman globalmente no preview */
        .times-new-roman-font, .times-new-roman-font * {
          font-family: "Times New Roman", Times, serif !important;
        }

        @media print {
          @page { size: A4; margin: 0; } /* Remove margem da impressora para usar a do CSS */
          .no-print { display: none !important; }
          body { background: white; margin: 0; }
          #root { margin: 0; padding: 0; }
          
          /* Forçar dimensões exatas na impressão A4 (210mm x 297mm) */
          #paper-content-wrapper {
            width: 210mm !important;
            min-height: 297mm !important;
            height: auto !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          #printable-content { 
            display: block !important; 
            width: 210mm !important;
            /* Margens ABNT para impressão: Top/Esq 3cm, Dir/Baixo 2cm */
            padding: 30mm 20mm 20mm 30mm !important; 
            font-family: "Times New Roman", Times, serif !important;
          }
          #printable-content * {
            font-family: "Times New Roman", Times, serif !important;
          }

          .page-view-container { display: block !important; margin: 0 !important; width: 100% !important; }
        }
      `}</style>

      {/* Preview Section */}
      <div 
        className="flex-1 flex flex-col items-center page-view-container"
        onMouseLeave={() => !isUnlocked && setIsBlurred(true)}
        onMouseEnter={() => !isUnlocked && setIsBlurred(false)}
      >
        {/* Header Navigation */}
        <div className="w-full md:w-[210mm] bg-white border border-slate-200 rounded-t-xl px-4 py-3 flex justify-between items-center mb-0 shadow-sm z-30 relative no-print">
          <button onClick={onBack} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
             ← Voltar
          </button>
          
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
               disabled={currentPage === 1}
               className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
             >
                <ChevronLeft size={20} />
             </button>
             <span className="text-sm font-medium text-slate-600">
               Página {currentPage} de {totalPages}
             </span>
             <button 
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
               disabled={currentPage === totalPages}
               className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
             >
                <ChevronRight size={20} />
             </button>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
             <FileText size={16} /> 
             <span className="hidden sm:inline">A4 (210x297mm)</span>
          </div>
        </div>
        
        {/* Document Container (A4 Page Simulation) */}
        {/* A4 Width = 210mm, Height = 297mm */}
        <div 
          id="paper-content-wrapper"
          className="relative w-full md:w-[210mm] bg-white shadow-lg border-x border-b border-slate-200 mb-8 mx-auto print:shadow-none print:border-none print:w-[210mm]"
          style={{ minHeight: '297mm', width: '210mm' }}
          onContextMenu={preventActions}
          onCopy={preventActions}
          onCut={preventActions}
          onPaste={preventActions}
          onDragStart={preventActions}
        >
            {/* 1. Camada de Bloqueio (Shield Overlay) */}
            {!isUnlocked && (
              <div className="absolute inset-0 z-20 bg-transparent cursor-not-allowed no-print" onClick={preventActions} />
            )}

            {/* 2. Camada de Blur */}
            {!isUnlocked && (isBlurred || securityWarning) && (
              <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center flex-col text-slate-800 animate-in fade-in duration-100 no-print rounded-b-xl">
                 {securityWarning ? (
                    <>
                      <AlertTriangle size={64} className="mb-4 text-red-500 animate-bounce" />
                      <h3 className="text-2xl font-bold text-red-600 mb-2">Ação Bloqueada</h3>
                      <p className="font-semibold mb-4">Capturas de ecrã não são permitidas.</p>
                    </>
                 ) : (
                    <>
                      <EyeOff size={48} className="mb-4 text-slate-400" />
                      <p className="font-semibold text-lg">Conteúdo Protegido</p>
                    </>
                 )}
                 <p className="text-sm text-slate-500">Mantenha o rato sobre o documento para visualizar.</p>
              </div>
            )}

            {/* 3. Marca d'água (Apenas visível se bloqueado) */}
            {!isUnlocked && (
              <div className="watermark-container no-print overflow-hidden rounded-b-xl">
                {watermarks.map((text, i) => (
                  <div key={i} className="watermark-text">{text}</div>
                ))}
              </div>
            )}

            {/* Conteúdo Real (Página Atual) */}
            <div 
              id="printable-content"
              className={`
                /* Margens ABNT: Superior/Esquerda 3cm (30mm), Inferior/Direita 2cm (20mm) */
                pt-[30mm] pl-[30mm] pr-[20mm] pb-[20mm]
                text-[12pt] leading-[1.5] text-justify text-slate-900 bg-white h-full times-new-roman-font
                ${!isUnlocked ? 'protected-content security-pattern' : ''} 
                ${isBlurred ? 'privacy-blur' : ''}
              `}
              style={{ minHeight: '297mm' }}
            >
              {/* Render HTML content for CURRENT PAGE ONLY */}
              <div 
                className="prose prose-slate max-w-none relative z-10 times-new-roman-font [&_p]:text-justify [&_li]:text-justify [&_p]:indent-[1.25cm] [&_p]:my-0 [&_p]:leading-[1.5] [&_h2]:mt-6 [&_h2]:mb-4"
                dangerouslySetInnerHTML={{ __html: pages[currentPage - 1] }}
              />

              {/* Gradient Fade if locked - Só mostra na página 1 ou aleatória para incentivar */}
              {!isUnlocked && currentPage === 1 && (
                <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none flex flex-col items-center justify-end pb-10 z-30 no-print rounded-b-xl">
                   <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-2xl border-2 border-red-100 text-center max-w-md mx-4 transform translate-y-4">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Lock size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Documento Bloqueado</h3>
                    <p className="text-slate-600 mb-4 text-sm">
                      Visualize a primeira página gratuitamente. Para ler o restante e baixar, efetue o pagamento.
                    </p>
                    <button 
                      onClick={onRequestUnlock}
                      className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <ShieldAlert size={18} />
                      Desbloquear Agora
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer da Página (Número) */}
            <div className="absolute bottom-4 right-8 text-xs text-slate-400">
               {currentPage}
            </div>
        </div>
      </div>

      {/* Sidebar / Actions */}
      <div className="w-full lg:w-80 space-y-6 sidebar-actions no-print h-fit sticky top-24">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Ações do Documento</h3>
          
          <div className="space-y-3">
            <button 
              disabled={!isUnlocked}
              onClick={handleWordDownload}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition relative overflow-hidden group
                ${isUnlocked 
                  ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                  : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'}
              `}
            >
              <div className="flex items-center gap-3">
                <FileText size={18} /> Download Word
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 bg-slate-100/50 flex items-center justify-center backdrop-blur-[1px]">
                   <Lock size={16} className="text-slate-500" />
                </div>
              )}
            </button>
          </div>

          {!isUnlocked && (
            <div className="mt-6 pt-6 border-t border-slate-100">
               <button 
                  onClick={onRequestUnlock}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition transform active:scale-95"
                >
                  Liberar Acesso Total
                </button>
                <div className="mt-3 flex flex-col items-center justify-center gap-1 text-xs text-red-500 font-medium bg-red-50 p-2 rounded">
                   <div className="flex items-center gap-1">
                      <ShieldAlert size={14} />
                      <span>Proteção Ativa</span>
                   </div>
                   <span className="text-center opacity-80">Anti-Cópia & Anti-Print Ativados</span>
                </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-3">Detalhes do Pedido</h3>
          <ul className="text-sm space-y-2 text-slate-600">
            <li className="flex justify-between"><span>Tema:</span> <span className="font-medium text-slate-800 truncate max-w-[120px]">{paper.request.theme}</span></li>
            <li className="flex justify-between"><span>Nível:</span> <span className="font-medium text-slate-800">{paper.request.level}</span></li>
            <li className="flex justify-between"><span>Páginas:</span> <span className="font-medium text-slate-800">{paper.request.pages}</span></li>
            <li className="flex justify-between"><span>Idioma:</span> <span className="font-medium text-slate-800">{paper.request.language === 'Português Angola' ? 'PT-AO' : 'PT'}</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaperPreview;