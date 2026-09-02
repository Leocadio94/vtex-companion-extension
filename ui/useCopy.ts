/**
 * Estado de "Copiado" com volta automática, compartilhado por quem copia.
 *
 * A `key` existe porque um mesmo painel tem vários botões de copiar e só o que
 * foi clicado deve mudar de rótulo.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_KEY = 'default';

export function useCopy(resetMs = 1500) {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string, key: string = DEFAULT_KEY) => {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(null), resetMs);
    },
    [resetMs],
  );

  const isCopied = useCallback(
    (key: string = DEFAULT_KEY) => copied === key,
    [copied],
  );

  return { copied, copy, isCopied };
}
