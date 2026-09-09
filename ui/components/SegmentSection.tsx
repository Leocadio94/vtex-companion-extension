import { useState } from 'react';
import type { CookieResult } from '@/lib/browser/cookies';
import type { TabContext } from '@/lib/collect';
import type { DetectionResult } from '@/lib/detect/signals';
import {
  SEGMENT_FIELDS,
  applyEdits,
  parseSegmentJson,
  type SegmentField,
  type SegmentPayload,
} from '@/lib/segment/segment';
import { writeSegment } from '@/lib/segment/write';
import { Empty } from './Row';

function asText(value: unknown): string {
  return value == null ? '' : String(value);
}

export function SegmentSection({
  context,
  result,
  onChanged,
}: {
  context: TabContext;
  result: DetectionResult;
  onChanged: () => void;
}) {
  // Só o que o usuário digitou; o resto sai do segmento atual. Assim a volta da
  // gravação — que recarrega a aba e recoleta — reaparece sozinha nos campos,
  // sem um efeito para sincronizar estado com prop.
  const [edits, setEdits] = useState<Partial<Record<SegmentField, string>>>({});
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<CookieResult | null>(null);
  const [busy, setBusy] = useState(false);

  if (!result.isVtex) return null;

  const current = result.segment;

  const run = async (payload: SegmentPayload) => {
    setBusy(true);
    const outcome = await writeSegment(context.url, payload);
    setStatus(outcome);
    setBusy(false);

    if (outcome.ok) {
      setEdits({});
      setDraft(null);
      onChanged();
    }
  };

  if (!current) {
    return (
      <section>
        <h2>Segmento</h2>
        <Empty tone="empty">
          {context.hasHostPermission ? (
            <>
              Nenhum <code>vtex_segment</code> legível nesta origem. A loja grava
              o cookie na primeira navegação.
            </>
          ) : (
            <>
              Sem permissão para ler os cookies de{' '}
              <strong>{context.origin}</strong>.
            </>
          )}
        </Empty>
      </section>
    );
  }

  const rawJson = draft ?? JSON.stringify(current, null, 2);

  const applyRaw = () => {
    const parsed = parseSegmentJson(rawJson);
    if (!parsed.ok) {
      setStatus({ ok: false, message: parsed.error });
      return;
    }
    void run(parsed.payload);
  };

  return (
    <section>
      <h2>Segmento</h2>

      {SEGMENT_FIELDS.map((field) => (
        <label className="field" key={field.key}>
          <span>{field.label}</span>
          <input
            type="text"
            spellCheck={false}
            placeholder={field.placeholder}
            value={edits[field.key] ?? asText(current[field.key])}
            onChange={(event) =>
              setEdits((previous) => ({
                ...previous,
                [field.key]: event.target.value,
              }))
            }
          />
        </label>
      ))}

      <div className="actions">
        <button
          type="button"
          disabled={busy || Object.keys(edits).length === 0}
          onClick={() => void run(applyEdits(current, edits))}
        >
          Aplicar
        </button>
      </div>

      {status && (
        <Empty tone={status.ok ? 'hint' : 'error'}>{status.message}</Empty>
      )}

      <Empty>
        A troca vale para a próxima navegação, e a Session Manager pode
        reescrever o cookie — se o valor voltar ao anterior, foi a loja.
      </Empty>

      <details className="advanced">
        <summary>JSON cru</summary>

        <textarea
          rows={10}
          spellCheck={false}
          value={rawJson}
          onChange={(event) => setDraft(event.target.value)}
        />

        <div className="actions">
          <button type="button" disabled={busy || draft === null} onClick={applyRaw}>
            Gravar JSON
          </button>
        </div>

        <Empty>
          O que os campos acima não cobrem: <code>priceTables</code>,{' '}
          <code>campaigns</code>, <code>utm_*</code> e o que a plataforma
          acrescentar.
        </Empty>
      </details>
    </section>
  );
}
