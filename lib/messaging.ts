/** Mensagens trocadas entre content script, popup e background. */

export interface ArmOneShotMessage {
  type: 'preview:arm-one-shot';
}

export type CompanionMessage = ArmOneShotMessage;
