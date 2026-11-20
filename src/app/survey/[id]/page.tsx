'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Link from 'next/link';
import SurveyDetailView, { Survey, SurveyPhoto } from '../../../components/SurveyDetailView';

export default function SurveyDetail() {
  const params = useParams();
  const id = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [photos, setPhotos] = useState<SurveyPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function loadDetail() {
      const { data: surveyData } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', id)
        .single();

      const { data: photosData } = await supabase
        .from('survey_photos')
        .select('*')
        .eq('survey_id', id);

      setSurvey(surveyData);
      setPhotos(photosData || []);
      setLoading(false);
    }
    loadDetail();
  }, [id]);

  if (loading) return <main className="min-h-screen bg-gray-950 text-white p-8">Carregando...</main>;

  if (!survey) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-8">
        <h1 className="text-3xl font-bold text-red-400">Inspeção não encontrada</h1>
        <Link href="/surveys" className="text-blue-400 mt-6 inline-flex items-center gap-2">← Voltar</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/surveys" className="text-blue-400 mb-8 inline-flex items-center gap-2">← Voltar para lista</Link>
        <SurveyDetailView survey={survey} photos={photos} />
      </div>
    </main>
  );
}
