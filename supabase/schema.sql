-- ========================================
-- Schema do Projeto Assessor Financeiro
-- Execute este SQL no Supabase SQL Editor
-- ========================================

-- Tabela principal de transações financeiras
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  estabelecimento TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (
    categoria IN (
      'Alimentação', 'Transporte', 'Combustível', 'Lazer',
      'Saúde', 'Assinaturas', 'Casa', 'Vestuário',
      'Educação', 'Investimento', 'Outros'
    )
  ),
  valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
  fonte TEXT NOT NULL DEFAULT 'manual' CHECK (
    fonte IN ('whatsapp_text', 'whatsapp_audio', 'fatura_pdf', 'manual')
  ),
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para queries comuns do Dashboard
CREATE INDEX IF NOT EXISTS idx_transactions_data ON transactions(data);
CREATE INDEX IF NOT EXISTS idx_transactions_categoria ON transactions(categoria);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_fonte ON transactions(fonte);

-- Tabela de investimentos (Fase 5)
CREATE TABLE IF NOT EXISTS investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  valor_aportado DECIMAL(12,2) NOT NULL CHECK (valor_aportado >= 0),
  valor_atual DECIMAL(12,2) NOT NULL CHECK (valor_atual >= 0),
  data_aporte DATE NOT NULL,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

-- Habilita RLS nas tabelas
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ler apenas suas transações
CREATE POLICY "users_read_own_transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir suas próprias transações
CREATE POLICY "users_insert_own_transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias transações
CREATE POLICY "users_update_own_transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar suas próprias transações
CREATE POLICY "users_delete_own_transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY "users_read_own_investments"
  ON investments FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir investimentos
CREATE POLICY "users_insert_own_investments"
  ON investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus investimentos
CREATE POLICY "users_update_own_investments"
  ON investments FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar seus investimentos
CREATE POLICY "users_delete_own_investments"
  ON investments FOR DELETE
  USING (auth.uid() = user_id);
