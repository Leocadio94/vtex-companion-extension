import { memo } from 'react';
import { tokenizeJson } from '@/lib/runner/format';

/**
 * Realce do corpo JSON. Memoizado: a tokenização devolve milhares de spans e
 * o painel re-renderiza a cada tecla do formulário do runner.
 */
export const JsonView = memo(function JsonView({ text }: { text: string }) {
  return (
    <pre className="response">
      {tokenizeJson(text).map((token, index) =>
        token.type === 'punct' ? (
          // eslint-disable-next-line react/no-array-index-key
          <span key={index}>{token.text}</span>
        ) : (
          <span key={index} className={`json-${token.type}`}>
            {token.text}
          </span>
        ),
      )}
    </pre>
  );
});
