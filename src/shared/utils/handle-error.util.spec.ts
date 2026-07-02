import { UnprocessableEntityException } from '@nestjs/common';
import { handleError } from 'src/shared/utils/handle-error.util';
import { describe, expect, it } from 'vitest';

describe('handleError', () => {
  it('deve converter um erro em UnprocessableEntityException', () => {
    const error = new Error('An error occurred while performing the operation.');

    expect(() => handleError(error)).toThrow(UnprocessableEntityException);
  });

  it('deve manter a mensagem original quando o erro possui uma unica linha', () => {
    const msg = 'An error occurred while performing the operation.';
    const error = new Error(msg);

    expect(() => handleError(error)).toThrow(msg);
  });

  it('deve usar a ultima linha da mensagem quando o erro possui varias linhas', () => {
    const expectedMessage =
      'Unique constraint failed on the fields: (email)';
    const error = new Error(
      [
        'Invalid prisma.user.create() invocation:',
        expectedMessage,
      ].join('\n'),
    );

    expect.assertions(2);

    try {
      handleError(error);
    } catch (exception) {
      expect(exception).toBeInstanceOf(UnprocessableEntityException);
      expect((exception as UnprocessableEntityException).message).toBe(
        expectedMessage,
      );
    }
  });
});
