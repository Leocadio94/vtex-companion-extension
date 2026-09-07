/**
 * Escrita do cookie `vtex_segment`.
 *
 * Fica fora de `lib/auth/cookie.ts` porque aquele arquivo é o único que grava
 * credencial, e o segmento não é uma. A diferença que não pode ser copiada de
 * lá está no `httpOnly` abaixo.
 *
 * @see docs/segment.md
 */

import { cookieAttributes, type CookieResult } from '../browser/cookies';
import { SEGMENT_COOKIE, encodeSegment, type SegmentPayload } from './segment';

export async function writeSegment(
  url: string,
  payload: SegmentPayload,
): Promise<CookieResult> {
  const target = cookieAttributes(url, SEGMENT_COOKIE);
  if (!target) return { ok: false, message: 'URL da aba não aceita cookie.' };

  try {
    await browser.cookies.set({
      url: target.url,
      name: target.name,
      value: encodeSegment(payload),
      path: '/',
      secure: target.secure,
      // Sem `httpOnly`, ao contrário do cookie de sessão: o JavaScript da
      // vitrine lê o `vtex_segment` para montar preço e catálogo, e gravá-lo
      // httpOnly deixa a loja cega para o próprio segmento.
      sameSite: target.sameSite,
    });

    return { ok: true, message: `Segmento gravado em ${target.url}.` };
  } catch (error) {
    return {
      ok: false,
      message: `Não foi possível gravar: ${(error as Error)?.message ?? error}`,
    };
  }
}
