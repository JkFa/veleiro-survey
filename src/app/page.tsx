export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white p-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tighter">
          Veleiro Survey <span className="text-6xl">🚤</span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-12">
          Sistema profissional de inspeção e avaliação de veleiros
        </p>

        <a
          href="/survey/new"
          className="inline-block bg-blue-600 hover:bg-blue-700 transition-all px-10 py-5 rounded-2xl text-2xl font-semibold shadow-lg shadow-blue-500/30"
        >
          Iniciar Nova Inspeção
        </a>

        <p className="text-gray-500 text-sm mt-8">
          Inspeções técnicas • Cálculo de score • Relatório PDF
        </p>
      </div>
    </main>
  );
}
