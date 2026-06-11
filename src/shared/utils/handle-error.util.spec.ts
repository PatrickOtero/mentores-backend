import { UnprocessableEntityException } from '@nestjs/common';
import { handleError } from 'src/shared/utils/handle-error.util';
import { describe, expect, it } from 'vitest';

describe('handleError', () => {
  it('Deve lançar uma UnprocessableEntityException a partir de um erro simples', () => {
    const msg = 'An error occurred while performing the operation.';
    const error = new Error(msg);

    expect(() => handleError(error)).toThrow(UnprocessableEntityException);
    expect(() => handleError(error)).toThrow(msg);
  });
});

describe('handleError', () => {
  it('Deve lançar UnprocessableEntityException usando a última linha de uma mensagem com várias linhas', () => {
    const msg =
      'Invalid `prisma.user.create()`\n invocation:Unique constraint failed on the fields: (`email`)';

    const errorLines = msg.split('\n');
    const lastErrorLine = errorLines[errorLines.length - 1]?.trim();
    const error = new Error(msg);

    expect(() => handleError(error)).toThrow(UnprocessableEntityException);
    expect(() => handleError(error)).toThrow(lastErrorLine);
  });
});
