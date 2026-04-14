#!/bin/bash
# Script de setup do Stripe para PromptPro
# Execute: bash scripts/setup-stripe.sh

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║          PromptPro — Setup Stripe                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Verifica se .env.local existe
if [ ! -f ".env.local" ]; then
  echo "❌ Arquivo .env.local não encontrado. Crie-o primeiro."
  exit 1
fi

# Verifica se as chaves do Stripe foram preenchidas
STRIPE_KEY=$(grep "STRIPE_SECRET_KEY" .env.local | cut -d= -f2)
if [[ "$STRIPE_KEY" == *"COLE_AQUI"* ]] || [[ -z "$STRIPE_KEY" ]]; then
  echo "⚠️  As chaves do Stripe ainda não foram configuradas no .env.local"
  echo ""
  echo "Siga estes passos:"
  echo ""
  echo "  1. Acesse: https://stripe.com"
  echo "     → Developers → API Keys"
  echo "     → Copie a 'Secret key' (sk_test_...)"
  echo "     → Cole em STRIPE_SECRET_KEY no .env.local"
  echo ""
  echo "  2. Ainda no Stripe:"
  echo "     → Products → Add product"
  echo "     → Crie 3 produtos (one-time payment):"
  echo "       • Básico    → R\$ 19,90 → 50 créditos"
  echo "       • Pro       → R\$ 59,90 → 200 créditos"
  echo "       • Business  → R\$ 119,90 → 500 créditos"
  echo "     → Para cada produto, copie o Price ID (price_...)"
  echo "     → Cole nos campos STRIPE_PRICE_* no .env.local"
  echo ""
  echo "  3. Para webhook local, instale o Stripe CLI:"
  echo "     → https://stripe.com/docs/stripe-cli"
  echo "     → Execute: stripe login"
  echo "     → Execute: stripe listen --forward-to localhost:3000/api/stripe/webhook"
  echo "     → Cole o whsec_... em STRIPE_WEBHOOK_SECRET no .env.local"
  echo ""
  exit 0
fi

echo "✓ Chaves do Stripe detectadas no .env.local"
echo ""

# Instala dependências se necessário
if [ ! -d "node_modules" ]; then
  echo "Instalando dependências..."
  npm install
fi

echo "✓ Tudo pronto! Rode: npm run dev"
echo ""
echo "Para testar pagamentos, use o cartão de teste Stripe:"
echo "  Número:  4242 4242 4242 4242"
echo "  Validade: qualquer data futura"
echo "  CVC:     qualquer 3 dígitos"
echo ""
