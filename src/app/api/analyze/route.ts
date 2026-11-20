import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const VISION_MODEL = 'qwen3.5:0.8b';
const TEXT_MODEL = 'qwen3:4b-instruct';

async function ollamaGenerate(
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, stream: false }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ollama respondeu ${res.status}`);
    const json = await res.json();
    return (json.response || '').trim();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchListingText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 4000) || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const { surveyId } = await request.json();
  if (!surveyId) {
    return NextResponse.json({ error: 'surveyId é obrigatório' }, { status: 400 });
  }

  const { data: survey } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .single();

  if (!survey) {
    return NextResponse.json({ error: 'Inspeção não encontrada' }, { status: 404 });
  }

  await supabase.from('surveys').update({ status: 'processing' }).eq('id', surveyId);

  try {
    const { data: photos } = await supabase
      .from('survey_photos')
      .select('*')
      .eq('survey_id', surveyId);

    const photoFindings: string[] = [];

    for (const photo of photos || []) {
      try {
        const imgRes = await fetch(photo.url);
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const base64 = buf.toString('base64');

        const finding = await ollamaGenerate(
          {
            model: VISION_MODEL,
            prompt:
              'Você é um perito em vistoria de embarcações. Analise esta foto e descreva objetivamente o que vê: estado de conservação, sinais de dano, corrosão, desgaste ou qualquer ponto de atenção relevante para um comprador. Seja direto e conciso, em português.',
            images: [base64],
          },
          120_000
        );

        photoFindings.push(finding || '(sem observações relevantes)');
        await supabase
          .from('survey_photos')
          .update({ ai_analysis: finding })
          .eq('id', photo.id);
      } catch (photoErr) {
        photoFindings.push('(não foi possível analisar esta foto)');
      }
    }

    const listingText = survey.listing_url
      ? await fetchListingText(survey.listing_url)
      : null;

    const synthesisPrompt = `
Você é um perito independente de vistoria náutica, contratado para reduzir a assimetria de informação entre vendedor e comprador de um barco usado.

Dados do anúncio:
- Modelo: ${survey.boat_model}${survey.boat_year ? ` (${survey.boat_year})` : ''}
- Link do anúncio: ${survey.listing_url || 'não informado'}
- Conteúdo extraído automaticamente do anúncio: ${listingText || 'não disponível'}
- Descrição do vendedor: "${survey.seller_description || 'não informada'}"

Análises técnicas das fotos enviadas (uma por foto):
${photoFindings.length ? photoFindings.map((f, i) => `Foto ${i + 1}: ${f}`).join('\n') : 'Nenhuma foto enviada.'}

Gere um relatório em português, em Markdown, com exatamente estas seções:
## Resumo
## Pontos de Atenção
## Perguntas Recomendadas ao Vendedor
## Avaliação Geral

Em "Pontos de Atenção", aponte inconsistências entre a descrição do vendedor e o que as fotos mostram, riscos e itens que devem ser verificados pessoalmente. Seja objetivo e cético de forma construtiva, citando evidências das fotos quando relevante.

Termine sua resposta com uma linha própria, no formato exato:
SCORE: <nota de 0 a 10 representando o estado geral de conservação>
`.trim();

    const rawReport = await ollamaGenerate({ model: TEXT_MODEL, prompt: synthesisPrompt }, 180_000);

    const scoreMatch = rawReport.match(/SCORE:\s*([\d.,]+)/i);
    const scoreTotal = scoreMatch
      ? Math.max(0, Math.min(10, parseFloat(scoreMatch[1].replace(',', '.'))))
      : null;
    const aiReport = rawReport.replace(/\n?SCORE:\s*[\d.,]+\s*$/i, '').trim();

    await supabase
      .from('surveys')
      .update({ ai_report: aiReport, score_total: scoreTotal, status: 'completed' })
      .eq('id', surveyId);

    return NextResponse.json({ ok: true, aiReport, scoreTotal });
  } catch (err) {
    await supabase.from('surveys').update({ status: 'error' }).eq('id', surveyId);
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
