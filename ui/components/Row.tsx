import { useCopy } from '../useCopy';

/** `hint` é nota de rodapé, `empty` é ausência esperada, `error` é falha. */
export type Tone = 'hint' | 'empty' | 'error';

export function Row({
  label,
  value,
  copy,
}: {
  label: string;
  value: React.ReactNode;
  /** Presente = a linha vira um botão que copia este texto. */
  copy?: string;
}) {
  const clipboard = useCopy();

  if (!copy) {
    return (
      <div className="row">
        <span className="row-label">{label}</span>
        <span className="row-value">{value}</span>
      </div>
    );
  }

  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <button
        type="button"
        className="row-value row-copy"
        aria-label={`Copiar ${label}`}
        onClick={() => void clipboard.copy(copy)}
      >
        {value}
        <span className="row-copy-flag" aria-live="polite">
          {clipboard.isCopied() ? 'copiado' : ''}
        </span>
      </button>
    </div>
  );
}

export function Empty({
  children,
  tone = 'hint',
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return <p className={`muted tone-${tone}`}>{children}</p>;
}
