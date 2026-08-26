import { tokenizeJson } from '@/lib/runner/format';

export function JsonView({ text }: { text: string }) {
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
}
