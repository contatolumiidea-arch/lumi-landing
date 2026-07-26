/**
 * LUMI IDEA — Script para criar usuário administrador
 *
 * Uso:
 *   1. Instale as dependências: npm install
 *   2. Execute: node scripts/create-admin.js
 *   3. Copie o SQL gerado e rode no Supabase SQL Editor
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  LUMI IDEA — Criar usuário admin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const email = await ask('Email do admin: ');
  const name  = await ask('Nome completo: ');
  const role  = await ask('Perfil (admin / support) [admin]: ') || 'admin';

  // Ocultar input da senha não é possível em readline simples,
  // mas o hash é gerado localmente — a senha nunca sai do seu computador.
  const password = await ask('Senha (mín. 8 caracteres): ');

  if (!email || !password || password.length < 8) {
    console.error('\n❌ Email e senha são obrigatórios (senha mín. 8 caracteres).\n');
    rl.close();
    process.exit(1);
  }

  console.log('\n⏳ Gerando hash seguro...');
  const hash = await bcrypt.hash(password, 12);

  const sql = `
-- Cole este SQL no Supabase → SQL Editor → New query
INSERT INTO lumi_admin_users (email, name, role, password_hash)
VALUES (
  '${email.toLowerCase().trim()}',
  '${name.replace(/'/g, "''")}',
  '${['admin','support'].includes(role) ? role : 'support'}',
  '${hash}'
)
ON CONFLICT (email) DO UPDATE
  SET name          = EXCLUDED.name,
      role          = EXCLUDED.role,
      password_hash = EXCLUDED.password_hash;
`;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SQL gerado com sucesso!\n');
  console.log(sql);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 Próximo passo:');
  console.log('   1. Copie o SQL acima');
  console.log('   2. Acesse: supabase.com → seu projeto → SQL Editor');
  console.log('   3. Cole e clique em "Run"\n');

  rl.close();
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
