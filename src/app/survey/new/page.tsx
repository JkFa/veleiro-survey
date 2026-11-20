'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function NewSurvey() {
  const router = useRouter();

  const [boatModel, setBoatModel] = useState('');
  const [boatYear, setBoatYear] = useState('');
  const [listingUrl, setListingUrl] = useState('');
  const [sellerDescription, setSellerDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');

  function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotos(Array.from(e.target.files || []));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      setStep('Criando inspeção...');
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          boat_model: boatModel.trim(),
          boat_year: boatYear ? Number(boatYear) : null,
          listing_url: listingUrl.trim() || null,
          seller_description: sellerDescription.trim() || null,
          status: 'pending',
        })
        .select()
        .single();

      if (surveyError || !survey) {
        throw new Error(surveyError?.message || 'Falha ao criar inspeção');
      }

      if (photos.length > 0) {
        setStep(`Enviando ${photos.length} foto(s)...`);
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const path = `${survey.id}/${Date.now()}-${i}-${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('survey-photos')
            .upload(path, file);

          if (uploadError) throw new Error(`Erro ao enviar foto "${file.name}": ${uploadError.message}`);

          const { data: publicUrl } = supabase.storage.from('survey-photos').getPublicUrl(path);

          const { error: photoRowError } = await supabase.from('survey_photos').insert({
            survey_id: survey.id,
            url: publicUrl.publicUrl,
            storage_path: path,
          });

          if (photoRowError) throw new Error(`Erro ao registrar foto "${file.name}": ${photoRowError.message}`);
        }
      }

      setStep('Analisando com IA local (pode levar alguns minutos)...');
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: survey.id }),
      });

      if (!analyzeRes.ok) {
        const body = await analyzeRes.json().catch(() => ({}));
        throw new Error(body.error || 'Falha ao gerar relatório com IA');
      }

      router.push(`/survey?id=${survey.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setSubmitting(false);
      setStep('');
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">Nova Inspeção 🚤</h1>
        <p className="text-gray-400 mb-8">
          Envie o link do anúncio, fotos e a descrição do vendedor. A IA local analisa tudo e gera
          um relatório para reduzir a assimetria de informação entre vendedor e comprador.
        </p>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-2xl p-4 mb-8">
            {error}
          </div>
        )}

        <div className="bg-gray-900 rounded-3xl p-8 mb-8 space-y-6">
          <h2 className="text-xl font-semibold">Dados do Veleiro</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Modelo *</label>
              <input
                type="text"
                required
                value={boatModel}
                onChange={(e) => setBoatModel(e.target.value)}
                placeholder="Ex: Beneteau Oceanis 40"
                className="w-full bg-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ano</label>
              <input
                type="number"
                value={boatYear}
                onChange={(e) => setBoatYear(e.target.value)}
                placeholder="Ex: 2015"
                className="w-full bg-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Link do anúncio</label>
            <input
              type="url"
              value={listingUrl}
              onChange={(e) => setListingUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="bg-gray-900 rounded-3xl p-8 mb-8 space-y-6">
          <h2 className="text-xl font-semibold">Descrição do Vendedor</h2>
          <textarea
            value={sellerDescription}
            onChange={(e) => setSellerDescription(e.target.value)}
            placeholder="Cole aqui o texto de descrição fornecido pelo vendedor..."
            rows={6}
            className="w-full bg-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 resize-y"
          />
        </div>

        <div className="bg-gray-900 rounded-3xl p-8 mb-8 space-y-6">
          <h2 className="text-xl font-semibold">Fotos</h2>
          <input
            type="file"
            multiple
            accept="image/*,.heic,.heif"
            onChange={handlePhotosChange}
            className="w-full bg-gray-800 rounded-xl px-4 py-3 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer file:hover:bg-blue-700 cursor-pointer"
          />
          {photos.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((file, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-800">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all px-10 py-5 rounded-2xl text-2xl font-semibold shadow-lg shadow-blue-500/30"
        >
          {submitting ? step || 'Processando...' : 'Analisar e Gerar Relatório'}
        </button>
      </form>
    </main>
  );
}
