import AiReport from './AiReport';

export type Survey = {
  id: string;
  boat_model: string;
  boat_year: number | null;
  score_total: number | null;
  listing_url: string | null;
  seller_description: string | null;
  ai_report: string | null;
  status: string;
  created_at: string;
};

export type SurveyPhoto = {
  id: string;
  survey_id: string;
  url: string;
  ai_analysis: string | null;
};

export default function SurveyDetailView({
  survey,
  photos,
}: {
  survey: Survey;
  photos: SurveyPhoto[];
}) {
  return (
    <div className="bg-gray-900 rounded-3xl p-10">
      <h1 className="text-5xl font-bold mb-2">{survey.boat_model}</h1>
      {survey.boat_year && <p className="text-2xl text-gray-400">Ano {survey.boat_year}</p>}

      {survey.listing_url && (
        <a
          href={survey.listing_url}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-4 text-blue-400 hover:text-blue-300 underline break-all"
        >
          {survey.listing_url}
        </a>
      )}

      {survey.score_total != null && (
        <div className="mt-8 mb-10 text-center">
          <p className="text-gray-400 text-sm">SCORE FINAL</p>
          <p className="text-8xl font-bold text-blue-500">{survey.score_total}</p>
        </div>
      )}

      {survey.seller_description && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-3">Descrição do Vendedor</h2>
          <p className="text-gray-400 italic whitespace-pre-wrap">{survey.seller_description}</p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-6">Fotos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-gray-800 rounded-2xl overflow-hidden">
                <img src={photo.url} alt="" className="w-full aspect-video object-cover" />
                {photo.ai_analysis && (
                  <p className="text-sm text-gray-400 p-3">{photo.ai_analysis}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-6">Relatório da IA</h2>
        {survey.status === 'processing' || survey.status === 'pending' ? (
          <p className="text-gray-400">Analisando com IA local, atualize a página em instantes...</p>
        ) : survey.status === 'error' ? (
          <p className="text-red-400">
            Não foi possível gerar o relatório. Verifique se o Ollama está em execução e tente novamente.
          </p>
        ) : survey.ai_report ? (
          <AiReport markdown={survey.ai_report} />
        ) : (
          <p className="text-gray-400">Nenhum relatório disponível.</p>
        )}
      </div>
    </div>
  );
}
