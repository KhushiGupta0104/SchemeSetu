import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bot, Info, Languages, Send, Sparkles } from 'lucide-react';
import { AiApi } from '@/services/endpoints';
import { errorMessage } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useAiStatus } from '@/hooks/queries';
import type { AiAnswer } from '@/types';
import { Spinner } from '@/components/common/States';
import { cn } from '@/utils/cn';

const PRESETS = [
  { id: 'overview', label: 'What is this scheme?' },
  { id: 'eligibility', label: 'Am I eligible?' },
  { id: 'documents', label: 'What documents are required?' },
  { id: 'apply', label: 'How do I apply?' },
  { id: 'benefits', label: 'Summarise the benefits' },
  { id: 'hindi', label: 'Explain in simple Hindi', icon: Languages },
];

/** Renders plain-text AI output safely (no HTML): paragraphs, "- " bullets and **bold**. */
export function SafeText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
    );
  return (
    <div className="space-y-3 text-[0.9375rem] leading-relaxed text-ink-soft">
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter(Boolean);
        if (lines.length && lines.every((l) => /^\s*(-|\*|•|\d+\.)\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*(-|\*|•|\d+\.)\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function AiExplainer({ schemeId }: { schemeId: string }) {
  const { user } = useAuth();
  const location = useLocation();
  const { data: status } = useAiStatus();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<(AiAnswer & { asked: string; hindi: boolean }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (v: { preset?: string; question?: string; asked: string }) => AiApi.explain({ schemeId, preset: v.preset, question: v.question }),
    onMutate: () => setError(null),
    onSuccess: (data, v) => setAnswer({ ...data, asked: v.asked, hindi: v.preset === 'hindi' && data.source === 'ai' }),
    onError: (err) => setError(errorMessage(err)),
  });

  if (!user)
    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
        <p className="flex items-center gap-2 font-semibold text-indigo-700">
          <Sparkles className="h-5 w-5" aria-hidden /> Scheme Explainer
        </p>
        <p className="mt-1 text-sm text-ink-soft">Log in to ask questions about this scheme in plain language, including in Hindi.</p>
        <Link to="/login" state={{ from: location.pathname }} className="btn-indigo btn-sm mt-3">
          Log in to use the explainer
        </Link>
      </div>
    );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (q.length < 3) {
      setError('Please type a question of at least 3 characters.');
      return;
    }
    mutation.mutate({ question: q, asked: q });
  };

  return (
    <div>
      {status && !status.available && (
        <p className="mb-3 flex gap-2 rounded-xl bg-slate-50 p-3 text-xs text-ink-muted">
          <Info className="h-4 w-4 shrink-0" aria-hidden />
          AI is not configured on this server, so answers are built directly from the stored scheme details.
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested questions">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ preset: p.id, asked: p.label })}
            className="chip min-h-[2.25rem] border border-indigo-100 bg-white px-3 text-[0.8125rem] text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-60"
          >
            {p.icon && <p.icon className="h-3.5 w-3.5" aria-hidden />}
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label htmlFor="ai-question" className="sr-only">
          Ask your own question about this scheme
        </label>
        <input
          id="ai-question"
          className="input"
          maxLength={500}
          placeholder="Ask your own question about this scheme…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className="btn-indigo shrink-0 px-3.5" disabled={mutation.isPending} aria-label="Ask">
          {mutation.isPending ? <Spinner /> : <Send className="h-4 w-4" aria-hidden />}
        </button>
      </form>
      <p className="mt-1.5 text-xs text-ink-muted">Never share Aadhaar, bank or OTP details here. Max 500 characters.</p>

      <div aria-live="polite" className="mt-4">
        {mutation.isPending && (
          <div className="flex items-center gap-3 rounded-2xl border border-line p-4 text-sm text-ink-muted">
            <Spinner className="text-indigo-600" /> Preparing an explanation from the scheme record…
          </div>
        )}
        {error && !mutation.isPending && (
          <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
        {answer && !mutation.isPending && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">“{answer.asked}”</p>
              <span className={cn('chip', answer.source === 'ai' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-ink-muted')}>
                {answer.source === 'ai' ? (
                  <>
                    <Bot className="h-3.5 w-3.5" aria-hidden /> AI explanation
                  </>
                ) : (
                  'Summary from scheme record'
                )}
              </span>
            </div>
            {answer.notice && <p className="mb-3 rounded-lg bg-warning-soft/70 p-2.5 text-xs text-warning">{answer.notice}</p>}
            <div lang={answer.hindi ? 'hi' : undefined}>
              <SafeText text={answer.answer} />
            </div>
            {answer.source === 'ai' && (
              <p className="mt-4 border-t border-indigo-100 pt-3 text-xs text-ink-muted">
                AI-generated from SchemeSetu&apos;s scheme record. It can make mistakes — confirm on the official source before applying.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
