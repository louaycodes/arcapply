"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Lightbulb,
  AlertCircle,
  Loader2,
  Sliders,
  Compass,
  ArrowRight,
} from "lucide-react";
import {
  AgentPlaybookRule,
  fetchPlaybookRules,
  createPlaybookRule,
  updatePlaybookRule,
  deletePlaybookRule,
} from "@/lib/api";

export default function PlaybookPage() {
  const [rules, setRules] = useState<AgentPlaybookRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("custom");
  const [conditionTrigger, setConditionTrigger] = useState("");
  const [actionInstruction, setActionInstruction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);


  const loadRules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchPlaybookRules();
      setRules(data);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement des directives");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (rule: AgentPlaybookRule) => {
    try {
      const updated = await updatePlaybookRule(rule.id, { is_active: !rule.is_active });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch (err: any) {
      alert("Échec de mise à jour de la directive");
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Voulez-vous supprimer cette directive de l'agent ?")) return;
    try {
      await deletePlaybookRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err: any) {
      alert("Échec de suppression");
    }
  };



  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !conditionTrigger.trim() || !actionInstruction.trim()) return;

    try {
      setIsSubmitting(true);
      const newRule = await createPlaybookRule({
        title,
        category,
        condition_trigger: conditionTrigger,
        action_instruction: actionInstruction,
        is_active: true,
      });
      setRules((prev) => [...prev, newRule]);
      setIsModalOpen(false);
      setTitle("");
      setConditionTrigger("");
      setActionInstruction("");
      setCategory("custom");
    } catch (err: any) {
      alert(err.message || "Erreur lors de la création de la directive");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = rules.filter((r) => r.is_active).length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-orange-950 p-6 sm:p-8 text-white shadow-artisan border border-stone-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold border border-orange-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Pilotage Agentique & Intelligence Métier
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-stone-100">
              Directives Stratégiques de l'Agent
            </h1>
            <p className="text-sm text-stone-300 max-w-2xl leading-relaxed">
              Donnez vos règles en langage naturel à l'Agent Rédacteur. Il consultera ce playbook
              lors de la phase de réflexion (Thinking) pour aligner ses arguments et valoriser les projets exacts que vous souhaitez mettre en avant.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-orange-600 text-white font-semibold text-sm transition-all shadow-md shadow-orange-600/30 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Directive
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Directives Actives</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-display mt-1">
              {activeCount} <span className="text-xs font-normal text-stone-500 dark:text-stone-400">/ {rules.length}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Moteur de Décision</p>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display mt-1">
              LangGraph + Groq 70B
            </p>
            <p className="text-[11px] text-stone-400">Thinking &gt; Drafting</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Invariant Garanti</p>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display mt-1">
              Zéro Hallucination
            </p>
            <p className="text-[11px] text-stone-400">100% Master Profile réel</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-display flex items-center gap-2">
            Directives de l'Agent
            <span className="text-xs font-normal text-stone-500 dark:text-stone-400">({rules.length})</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-stone-500 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm">Chargement des directives stratégiques...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700 rounded-2xl space-y-3">
            <Lightbulb className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200">Aucune directive enregistree</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Toutes les directives ont ete supprimees. Vous pouvez en creer une personnalisee.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter une directive
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-2xl p-5 space-y-4 transition-all shadow-sm ${
                  rule.is_active
                    ? "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-orange-300 dark:hover:border-orange-500"
                    : "border-stone-200/60 dark:border-stone-800/60 opacity-60 bg-stone-50/50 dark:bg-stone-900/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {rule.category}
                      </span>
                      {rule.is_active && (
                        <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          Active
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base leading-snug font-display">
                      {rule.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggle(rule)}
                      title={rule.is_active ? "Désactiver" : "Activer"}
                      className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                    >
                      {rule.is_active ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-stone-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      title="Supprimer"
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Condition Box */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-800 dark:text-orange-300">
                    Condition de declenchement :
                  </p>
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-mono">
                    {rule.condition_trigger}
                  </p>
                </div>

                {/* Action Box */}
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Action de l'Agent Redacteur :
                  </p>
                  <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
                    {rule.action_instruction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 font-display">
                  Nouvelle Directive Stratégique
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg font-bold cursor-pointer"
              >
                x
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Titre de la directive
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. Focus Cloud & Kubernetes"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Catégorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 dark:text-stone-100"
                >
                  <option value="devops">DevOps & Cloud</option>
                  <option value="backend">Backend & Architecture</option>
                  <option value="ai">IA & Data Engineering</option>
                  <option value="tone">Tonalité & Style</option>
                  <option value="custom">Sur-mesure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Condition de déclenchement (Quand appliquer)
                </label>
                <textarea
                  required
                  rows={2}
                  value={conditionTrigger}
                  onChange={(e) => setConditionTrigger(e.target.value)}
                  placeholder="Ex. Si l'offre mentionne Docker, Kubernetes, CI/CD ou Terraform..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 dark:text-stone-100 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Instruction d'action pour l'agent (Ce qu'il doit faire)
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionInstruction}
                  onChange={(e) => setActionInstruction(e.target.value)}
                  placeholder="Ex. Mettre impérativement en avant mon projet ArcApply et mon expérience microservices. Insister sur la rigueur de déploiement..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 dark:text-stone-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-orange-600 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Enregistrer la directive
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
