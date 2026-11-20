'use client';

import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

export default function TestSupabase() {
  const [status, setStatus] = useState('Testando conexão...');

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('surveys')
          .select('*')
          .limit(1);

        if (error) {
          setStatus('❌ Erro: ' + error.message);
        } else {
          setStatus('✅ Conectado ao Supabase com sucesso!');
        }
      } catch (err: any) {
        setStatus('❌ Erro inesperado: ' + err.message);
      }
    }
    testConnection();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-4">Teste Supabase</h1>
        <p className="text-xl">{status}</p>
      </div>
    </main>
  );
}
