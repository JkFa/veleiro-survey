'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Survey = {
  id: string;
  boat_model: string;
  boat_year: number | null;
  score_total: number | null;
  status: string;
  created_at: string;
};

export default function SurveysList() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSurveys() {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      setSurveys(data || []);
      setLoading(false);
    }
    loadSurveys();
  }, []);

  if (loading) return <main className="min-h-screen bg-gray-950 text-white p-8">Carregando...</main>;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-bold">Minhas Inspeções</h1>
            <p className="text-gray-400 text-xl">Total: {surveys.length}</p>
          </div>
          <a href="/survey/new" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-2xl text-xl font-semibold">
            + Nova Inspeção
          </a>
        </div>

        <div className="grid gap-4">
          {surveys.map((survey) => (
            <a
              key={survey.id}
              href={`/survey?id=${survey.id}`}
              className="block bg-gray-900 hover:bg-gray-800 rounded-3xl p-8 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div>
                    <h3 className="text-3xl font-semibold">{survey.boat_model}</h3>
                    {survey.boat_year && <p className="text-gray-400">Ano {survey.boat_year}</p>}
                  </div>
                  <div className="text-center">
                    {survey.score_total != null ? (
                      <p className="text-6xl font-bold text-blue-500">{survey.score_total}</p>
                    ) : (
                      <p className="text-xl font-semibold text-gray-500">
                        {survey.status === 'error' ? 'Erro' : 'Processando...'}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">SCORE</p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  {new Date(survey.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
