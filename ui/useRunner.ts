/**
 * Estado do fetch runner, compartilhado entre o popup e o painel de DevTools.
 *
 * O que muda entre os dois é só de onde vem o `TabContext` — a aba ativa, no
 * popup; a aba inspecionada, no DevTools. Tudo o mais é idêntico, inclusive o
 * histórico, que é o mesmo armazenamento nos dois.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TabContext } from '@/lib/collect';
import { remember, type HistoryEntry } from '@/lib/runner/history';
import { runRequest, type RunnerResponse } from '@/lib/runner/probe';
import {
  buildRequest,
  defaultRequest,
  type RunnerInput,
} from '@/lib/runner/request';
import { runnerHistory, runnerInput } from '@/lib/settings';

/**
 * @param isVtex `undefined` enquanto a detecção não respondeu. O formulário só
 * é preenchido depois disso, porque o caminho padrão depende da resposta.
 */
export function useRunner(context: TabContext | null, isVtex?: boolean) {
  const [input, setInput] = useState<RunnerInput>(defaultRequest(false));
  const [response, setResponse] = useState<RunnerResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [running, setRunning] = useState(false);
  const restored = useRef(false);

  useEffect(() => {
    if (isVtex === undefined || restored.current) return;
    restored.current = true;

    void (async () => {
      const [stored, storedHistory] = await Promise.all([
        runnerInput.getValue(),
        runnerHistory.getValue(),
      ]);
      setInput(stored ?? defaultRequest(isVtex));
      setHistory(storedHistory);
    })();
  }, [isVtex]);

  const change = useCallback((next: RunnerInput) => {
    setInput(next);
    void runnerInput.setValue(next);
  }, []);

  const send = useCallback(async () => {
    if (!context) return;

    const built = buildRequest(input, context.origin);
    if (!built.ok) return;

    setRunning(true);
    const result = await runRequest(context.tabId, built.request);
    setResponse(result);
    setRunning(false);

    setHistory((current) => {
      const next = remember(current, {
        at: Date.now(),
        status: result.status,
        durationMs: result.durationMs,
        input,
      });
      void runnerHistory.setValue(next);
      return next;
    });
  }, [context, input]);

  return { input, response, history, running, change, send };
}
