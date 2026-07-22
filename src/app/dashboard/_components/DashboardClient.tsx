"use client";

import { logout } from "@/app/actions/auth";
import type { Transaction } from "@/lib/types/database";
import UploadInvoiceForm from "./UploadInvoiceForm";
import Link from "next/link";

interface DashboardClientProps {
  userEmail: string;
  transactions: Transaction[];
}

export default function DashboardClient({
  userEmail,
  transactions,
}: DashboardClientProps) {
  // Métricas calculadas
  const totalGasto = transactions.reduce((sum, t) => sum + Number(t.valor), 0);
  const totalTransacoes = transactions.length;

  // Agrupamento por categoria
  const categorias = transactions.reduce(
    (acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + Number(t.valor);
      return acc;
    },
    {} as Record<string, number>
  );

  const categoriasOrdenadas = Object.entries(categorias).sort(
    ([, a], [, b]) => b - a
  );

  const categoriaCores: Record<string, string> = {
    Alimentação: "from-orange-400 to-orange-600",
    Transporte: "from-blue-400 to-blue-600",
    Combustível: "from-amber-400 to-amber-600",
    Lazer: "from-purple-400 to-purple-600",
    Saúde: "from-rose-400 to-rose-600",
    Assinaturas: "from-indigo-400 to-indigo-600",
    Casa: "from-teal-400 to-teal-600",
    Vestuário: "from-pink-400 to-pink-600",
    Educação: "from-cyan-400 to-cyan-600",
    Investimento: "from-emerald-400 to-emerald-600",
    Outros: "from-gray-400 to-gray-600",
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
            <span className="text-sm text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              Dashboard
            </span>
            <Link
              href="/investments"
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Investimentos
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">{userEmail}</span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-400 mt-1">Últimos 30 dias</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Total Gasto */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl translate-x-8 -translate-y-8" />
            <p className="text-sm text-gray-400 mb-1">Total Gasto</p>
            <p className="text-3xl font-bold text-red-400">{formatCurrency(totalGasto)}</p>
          </div>

          {/* Transações */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl translate-x-8 -translate-y-8" />
            <p className="text-sm text-gray-400 mb-1">Transações</p>
            <p className="text-3xl font-bold text-blue-400">{totalTransacoes}</p>
          </div>

          {/* Categorias */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl translate-x-8 -translate-y-8" />
            <p className="text-sm text-gray-400 mb-1">Categorias</p>
            <p className="text-3xl font-bold text-violet-400">{categoriasOrdenadas.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Formulário de Upload de PDF */}
          <div className="lg:col-span-1">
            <UploadInvoiceForm />
          </div>

          {/* Gastos por Categoria */}
          <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold mb-4">Por Categoria</h2>
            {categoriasOrdenadas.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum gasto registrado ainda.</p>
            ) : (
              <div className="space-y-3">
                {categoriasOrdenadas.map(([cat, valor]) => {
                  const percent = totalGasto > 0 ? (valor / totalGasto) * 100 : 0;
                  const cores = categoriaCores[cat] || "from-gray-400 to-gray-600";
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-300">{cat}</span>
                        <span className="text-gray-400">{formatCurrency(valor)}</span>
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

          {/* Tabela de Transações */}
          <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold mb-4">Transações Recentes</h2>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
                <p className="text-gray-500 text-sm">Nenhuma transação encontrada.</p>
                <p className="text-gray-600 text-xs mt-1">
                  Envie um gasto pelo WhatsApp para começar!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-white/5">
                      <th className="text-left py-3 px-2 font-medium">Data</th>
                      <th className="text-left py-3 px-2 font-medium">Estabelecimento</th>
                      <th className="text-left py-3 px-2 font-medium">Categoria</th>
                      <th className="text-right py-3 px-2 font-medium">Valor</th>
                      <th className="text-left py-3 px-2 font-medium">Fonte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-2 text-gray-300">
                          {new Date(t.data + "T12:00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 px-2 text-white font-medium">
                          {t.estabelecimento}
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/5">
                            {t.categoria}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-red-400 font-medium tabular-nums">
                          {formatCurrency(Number(t.valor))}
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-xs text-gray-500">
                            {t.fonte === "whatsapp_text"
                              ? "📝 WhatsApp"
                              : t.fonte === "whatsapp_audio"
                                ? "🎤 Áudio"
                                : t.fonte === "fatura_pdf"
                                  ? "📄 Fatura"
                                  : "✏️ Manual"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
