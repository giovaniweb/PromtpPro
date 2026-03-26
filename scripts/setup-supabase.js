#!/usr/bin/env node
/**
 * Script de setup do Supabase Storage.
 * Rode UMA VEZ na sua máquina local:
 *   node scripts/setup-supabase.js
 */

const SUPABASE_URL = 'https://ydkdonnshcprlvntvouy.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlka2Rvbm5zaGNwcmx2bnR2b3V5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMwMjA1NCwiZXhwIjoyMDg5ODc4MDU0fQ.yr4uoDYW8A1ylIoOQWf0btZBGS-pxQsFnt328xNi0bM';

async function createBucket(name, isPublic = true) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ id: name, name, public: isPublic }),
  });

  const body = await res.json();

  if (res.ok) {
    console.log(`✅ Bucket "${name}" criado com sucesso!`);
  } else if (body?.error === 'The resource already exists') {
    console.log(`ℹ️  Bucket "${name}" já existe — OK.`);
  } else {
    console.error(`❌ Erro ao criar bucket "${name}":`, body);
    process.exit(1);
  }
}

async function createRlsPolicy() {
  // Permite que qualquer pessoa leia imagens públicas
  const sql = `
    CREATE POLICY IF NOT EXISTS "Public read generated-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'generated-images');

    CREATE POLICY IF NOT EXISTS "Service role can insert generated-images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'generated-images');
  `;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) {
    console.log('✅ Políticas RLS configuradas.');
  } else {
    // RLS policies can be set manually — not critical for MVP
    console.log('ℹ️  Políticas RLS opcionais — configure manualmente se necessário.');
  }
}

(async () => {
  console.log('🚀 Configurando Supabase Storage para PromptPro...\n');
  await createBucket('generated-images', true);
  await createRlsPolicy();
  console.log('\n✅ Setup concluído! O bucket está pronto para receber imagens geradas.');
})();
