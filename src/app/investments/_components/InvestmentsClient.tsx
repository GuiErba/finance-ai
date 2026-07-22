"use client";

import { useState } from "react";
import { logout } from "@/app/actions/auth";
import type { Investment } from "@/lib/types/database";
import InvestmentForm from "./InvestmentForm";
import InvestmentCard from "./InvestmentCard";
import Link from "next/link";

interface InvestmentsClientProps {
  userEmail: string;
  investments: Investment[];
}

export default function InvestmentsClient({
  userEmail,
  investments,
}: InvestmentsClientProps) {
  const [showForm, setShowForm] = useState(false);

  // Métricas
  const totalAportado = investments.reduce(
    (sum, inv) => sum + Number(inv.valor_aportado),
    0
  );
  const totalAtual = investments.reduce(
    (sum, inv) => sum + Number(inv.valor_atual),
    0
  );
  const rendimento = totalAtual - totalAportado;
  const rendimentoPct = totalAportado > 0 ? (rendimento / totalAportado) * 100 : 0;

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Agrupamento por tipo
  const byType = investments.reduce(
    (acc, inv) => {
      acc[inv.tipo] = (acc[inv.tipo] || 0) + Number(inv.valor_atual);
      return acc;
    },
    {} as Record<string, number>
  );
  const typeEntries = Object.entries(byType).sort(([, a], [, b]) => b - a);

  const typeCores: Record<string, string> = {
    "Renda Fixa": "from-sky-400 to-sky-600",
    "Ações": "from-violet-400 to-violet-600",
    FII: "from-amber-400 to-amber-600",
    Cripto: "from-orange-400 to-orange-600",
    "Tesouro Direto": "from-emerald-400 to-emerald-600",
    ETF: "from-indigo-400 to-indigo-600",
    Poupança: "from-cyan-400 to-cyan-600",
    Outros: "from-gray-400 to-gray-600",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-white/[0.02] backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">Assessor Financeiro</span>
          </div>

          {/* Navegação */}
          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Dashboard
            </Link>
            <span className="text-sm text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              Investimentos
            </span>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">{userEmail}</span>
            <form action={logout}>
              <button type="submit" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title + Add Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Investimentos</h1>
            <p className="text-gray-400 mt-1">Acompanhamento manual da sua carteira</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
          >
            {showForm ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                Fechar
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Novo Investimento
              </>
            )}
          </button>
        </div>

        {/* Form (condicional) */}
        {showForm && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <InvestmentForm onSuccess={() => setShowForm(false)} />
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Aportado */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl translate-x-8 -translate-y-8" />
            <p className="text-sm text-gray-400 mb-1">Total Aportado</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalAportado)}</p>
          </div>

          {/* Valor Atual */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl translate-x-8 -translate-y-8" />
            <p className="text-sm text-gray-400 mb-1">Valor Atual</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalAtual)}</p>
          </div>

          {/* Rendimento R$ */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className={`absolute top-0 right-0 w-32 h-32 ${rendimento >= 0 ? "bg-emerald-500/5" : "bg-red-500/5"} rounded-full blur-2xl translate-x-8 -translate-y-8`} />
            <p className="text-sm text-gray-400 mb-1">Rendimento</p>
            <p className={`text-2xl font-bold ${rendimento >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {rendimento >= 0 ? "+" : ""}{formatCurrency(rendimento)}
            </p>
          </div>

          {/* Rendimento % */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className={`absolute top-0 right-0 w-32 h-32 ${rendimentoPct >= 0 ? "bg-violet-500/5" : "bg-red-500/5"} rounded-full blur-2xl translate-x-8 -translate-y-8`} />
            <p className="text-sm text-gray-400 mb-1">Rentabilidade</p>
            <p className={`text-2xl font-bold ${rendimentoPct >= 0 ? "text-violet-400" : "text-red-400"}`}>
              {rendimentoPct >= 0 ? "+" : ""}{rendimentoPct.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribuição por Tipo */}
          <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold mb-4">Distribuição por Tipo</h2>
            {typeEntries.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum investimento registrado.</p>
            ) : (
              <div className="space-y-3">
                {typeEntries.map(([tipo, valor]) => {
                  const percent = totalAtual > 0 ? (valor / totalAtual) * 100 : 0;
                  const cores = typeCores[tipo] || "from-gray-400 to-gray-600";
                  return (
                    <div key={tipo}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-300">{tipo}</span>
                        <span className="text-gray-400">{percent.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${cores} transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lista de Investimentos */}
          <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold mb-4">Seus Investimentos</h2>
            {investments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                </svg>
                <p className="text-gray-500 text-sm">Nenhum investimento registrado.</p>
                <p className="text-gray-600 text-xs mt-1">Clique em &quot;Novo Investimento&quot; para adicionar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {investments.map((inv) => (
                  <InvestmentCard key={inv.id} investment={inv} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
