import { GoogleGenAI } from "@google/genai";
import { PaperRequest } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY || "";
  if (!apiKey) {
    throw new Error("A chave da API do Gemini não está configurada. Por favor, adicione a variável de ambiente GEMINI_API_KEY no Netlify.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to clean markdown for display
const cleanText = (text: string) => {
  if (!text) return "";
  return text
    .replace(/```html/gi, '') // Remove all ```html
    .replace(/```/g, '')      // Remove all ```
    .trim();
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle API calls with exponential backoff for 429 errors
const generateWithRetry = async (model: string, prompt: string) => {
  const ai = getAiClient();
  let attempt = 0;
  const maxRetries = 5;
  let baseDelay = 2000;

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      return response;
    } catch (error: any) {
      attempt++;
      const isQuotaError = 
        error.status === 429 || 
        error.code === 429 ||
        error.message?.includes('429') || 
        error.message?.includes('quota') || 
        error.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaError && attempt < maxRetries) {
        await delay(baseDelay);
        baseDelay *= 2; 
      } else {
        throw error;
      }
    }
  }
  throw new Error("O sistema está sobrecarregado. Tente novamente em instantes.");
};

/**
 * NOVA ESTRATÉGIA: Geração Granular Iterativa.
 * Para maximizar folhas, geramos o trabalho capítulo por capítulo.
 * Se o user pede 10 páginas, geramos ~8 capítulos de desenvolvimento + Intro + Conclusão/Refs.
 */
export const generatePaperPipeline = async (
  request: PaperRequest,
  onProgress: (status: string) => void
): Promise<string> => {
  const modelId = "gemini-3-flash-preview"; 
  let finalHtml = "";

  // 1. Calcular estrutura baseada no número de páginas
  // Reservamos 1 pág para Intro, 1 para Conclusão, 1 para Referências.
  // O resto são capítulos de desenvolvimento.
  const corePages = Math.max(request.pages - 3, 2); 
  
  onProgress(`Planeando estrutura para ${request.pages} páginas...`);

  // -- Passo 1: Gerar Títulos dos Capítulos --
  const outlinePrompt = `
    Atue como um professor universitário.
    O aluno precisa de um trabalho de ${request.pages} páginas sobre "${request.theme}" (${request.discipline}).
    Nível académico: ${request.level}. A profundidade e complexidade dos capítulos devem estar adequadas a este nível.
    
    Liste EXATAMENTE ${corePages} títulos de capítulos para o DESENVOLVIMENTO do trabalho.
    NÃO inclua "Introdução", "Conclusão" ou "Referências". Apenas o miolo do trabalho.
    Os títulos devem ser académicos e progressivos.
    
    Retorne APENAS a lista de títulos separados por ponto e vírgula (;).
    Exemplo: História do tema; Conceitos Fundamentais; Análise de Casos; Impacto Social
  `;

  const outlineRes = await generateWithRetry(modelId, outlinePrompt);
  let chapters = (outlineRes.text || "")
    .split(';')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  // Fallback de segurança se a IA não gerar capítulos suficientes
  if (chapters.length < corePages) {
    const missing = corePages - chapters.length;
    for (let i = 0; i < missing; i++) {
      chapters.push(`Análise Aprofundada ${i + 1}: ${request.theme}`);
    }
  }

  // We will store the generated HTML for each section
  let introHtml = "";
  let chaptersHtml: string[] = [];
  let concHtml = "";
  let refHtml = "";

  // -- Passo 2: Gerar Introdução (Página 1) --
  onProgress("Escrevendo Introdução...");
  const introPrompt = `
    Escreva a INTRODUÇÃO para um trabalho académico sobre "${request.theme}".
    Nível académico: ${request.level}. Estilo: ${request.style}.
    A linguagem, profundidade e complexidade devem ser estritamente adequadas a este nível académico.
    
    Diretrizes:
    - O texto deve ocupar APENAS UMA PÁGINA (aprox. 350 a 400 palavras).
    - Não seja demasiado extenso, mas preencha visualmente a página.
    - Comece DIRETAMENTE com <h2>1. Introdução</h2>.
    - Fale sobre a contextualização, problema, justificativa e objetivos.
    - Use <p> para parágrafos. Não use markdown, apenas HTML.
    - Adicione <!--PAGE_BREAK--> no final.
  `;
  const introRes = await generateWithRetry(modelId, introPrompt);
  introHtml = cleanText(introRes.text || "");

  // -- Passo 3: Loop de Desenvolvimento (1 Capítulo = 1 Página) --
  for (let i = 0; i < chapters.length; i++) {
    const chapterTitle = chapters[i];
    const chapterNum = i + 2; // Começa no 2 porque Intro é 1

    onProgress(`Escrevendo Cap. ${chapterNum}/${chapters.length + 3}: ${chapterTitle}...`);
    
    const formattedChap = chapterTitle.charAt(0).toUpperCase() + chapterTitle.slice(1).toLowerCase();
    const chapterPrompt = `
      Escreva um capítulo COMPLETO e EXTENSO sobre: "${chapterTitle}".
      Este é o capítulo ${chapterNum} de um trabalho sobre "${request.theme}".
      Nível académico: ${request.level}. A linguagem, profundidade e complexidade devem ser estritamente adequadas a este nível.
      
      OBJETIVO: ENCHER UMA PÁGINA INTEIRA (A4).
      
      Diretrizes:
      - Comece com <h2>${chapterNum}. ${formattedChap}</h2>.
      - Escreva de forma detalhada, "encha linguiça" com qualidade académica.
      - Adote o ESTILO ACADÉMICO GERAL DOS PALOP.
      - Defina conceitos, dê exemplos históricos, cite autores (fictícios ou reais), explore causas e consequências.
      - Use linguagem formal (${request.language}).
      - Mínimo 600 palavras.
      - Formato HTML (<p>, <ul>, <blockquote>).
      - Adicione <!--PAGE_BREAK--> no final do texto.
    `;

    const chapterRes = await generateWithRetry(modelId, chapterPrompt);
    chaptersHtml.push(cleanText(chapterRes.text || ""));
    
    // Pequeno delay para não estourar rate limit
    await delay(1000);
  }

  // -- Passo 4: Conclusão --
  onProgress("Escrevendo Conclusão...");
  const concPrompt = `
    Escreva a CONCLUSÃO para o trabalho sobre "${request.theme}".
    Nível académico: ${request.level}. A linguagem e profundidade devem ser adequadas a este nível.
    
    Diretrizes:
    - Comece com <h2>Conclusão</h2>.
    - O texto deve ocupar APENAS UMA PÁGINA (aprox. 300 a 350 palavras).
    - Sintetize os pontos principais abordados nos capítulos anteriores.
    - Formato HTML.
    - Adicione <!--PAGE_BREAK--> no final.
  `;
  const concRes = await generateWithRetry(modelId, concPrompt);
  concHtml = cleanText(concRes.text || "");

  // -- Passo 5: Referências --
  onProgress("Gerando Referências Bibliográficas...");
  const refPrompt = `
    Crie uma lista de REFERÊNCIAS BIBLIOGRÁFICAS para o tema "${request.theme}".
    Nível académico: ${request.level}. O tipo de fontes (livros, artigos científicos, etc.) deve ser adequado a este nível.
    
    Diretrizes:
    - Retorne APENAS o código HTML das referências. NÃO inclua nenhum texto introdutório ou de conclusão (ex: "Aqui está a lista...").
    - Comece diretamente com <h2>Referências bibliográficas</h2>.
    - Gere pelo menos 10 a 15 referências fictícias ou reais seguindo as NORMAS GERAIS DOS PALOP.
    - Formato HTML (use <ul> e <li> ou <p> com recuo).
  `;
  const refRes = await generateWithRetry(modelId, refPrompt);
  let refText = cleanText(refRes.text || "");
  
  // Força a remoção de qualquer texto conversacional antes do <h2>
  const h2Index = refText.indexOf('<h2');
  if (h2Index > 0) {
    refText = refText.substring(h2Index);
  }
  
  refHtml = refText;

  // -- Passo 6: Gerar Sumário Dinâmico --
  onProgress("Gerando Sumário...");
  
  const countWords = (html: string) => {
    const text = html.replace(/<[^>]*>?/gm, '');
    return text.split(/\s+/).filter(w => w.length > 0).length;
  };

  const WORDS_PER_PAGE = 450;
  let currentPage = 2; // Intro is on page 2

  let summaryHtml = `
    <div class="toc-page" style="font-family: 'Times New Roman', serif; color: black;">
      <h2 style="text-align: center; margin-bottom: 40px;">Sumário</h2>
      <table width="100%" style="font-size: 12pt; line-height: 1.5; border-collapse: collapse; border: none;">
        <tr>
          <td style="text-align: left; border: none; padding: 5px 0;"><b>1. Introdução</b></td>
          <td style="text-align: right; border: none; padding: 5px 0;">${currentPage}</td>
        </tr>
  `;

  let introWords = countWords(introHtml);
  currentPage += Math.max(1, Math.ceil(introWords / WORDS_PER_PAGE));

  let currentChapterWords = 0;
  chapters.forEach((chap, index) => {
    const formattedChap = chap.charAt(0).toUpperCase() + chap.slice(1).toLowerCase();
    const chapterStartPage = currentPage + Math.floor(currentChapterWords / WORDS_PER_PAGE);
    
    summaryHtml += `
        <tr>
          <td style="text-align: left; border: none; padding: 5px 0;"><b>${index + 2}. ${formattedChap}</b></td>
          <td style="text-align: right; border: none; padding: 5px 0;">${chapterStartPage}</td>
        </tr>
    `;
    
    currentChapterWords += countWords(chaptersHtml[index]);
  });

  currentPage += Math.ceil(currentChapterWords / WORDS_PER_PAGE);

  summaryHtml += `
        <tr>
          <td style="text-align: left; border: none; padding: 5px 0;"><b>Conclusão</b></td>
          <td style="text-align: right; border: none; padding: 5px 0;">${currentPage}</td>
        </tr>
  `;

  let concWords = countWords(concHtml);
  currentPage += Math.max(1, Math.ceil(concWords / WORDS_PER_PAGE));

  summaryHtml += `
        <tr>
          <td style="text-align: left; border: none; padding: 5px 0;"><b>Referências bibliográficas</b></td>
          <td style="text-align: right; border: none; padding: 5px 0;">${currentPage}</td>
        </tr>
      </table>
    </div>
  `;

  // Combine everything with PAGE_BREAK markers so the Word export logic can split them properly
  finalHtml = summaryHtml + "\n<!--PAGE_BREAK-->\n" + introHtml + "\n<!--PAGE_BREAK-->\n" + chaptersHtml.join("\n<!--PAGE_BREAK-->\n") + "\n<!--PAGE_BREAK-->\n" + concHtml + "\n<!--PAGE_BREAK-->\n" + refHtml;

  // Remove qualquer menção a "ABNT" do texto final gerado
  finalHtml = finalHtml.replace(/ABNT/gi, '');

  return finalHtml;
};