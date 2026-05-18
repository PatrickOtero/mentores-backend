import { describe, it, expect, beforeEach } from 'vitest';
import { GenerateCodeUtil } from './generate-code.util';

describe('GenerateCodeUtil', () => {

    let generateCodeUtil: GenerateCodeUtil;
    beforeEach(() => {
        generateCodeUtil = new GenerateCodeUtil();
    });

    it('deve conter apenas letras maiúsculas e números em múltiplas gerações', () => {
        for (let i = 0; i < 100; i++) {
            const code = generateCodeUtil.create();
            expect(code).toMatch(/^[A-Z0-9]{6}$/);
        }
    });

    it('deve gerar códigos diferentes em chamadas consecutivas', () => {
        for (let i = 0; i < 100; i++) {
            const code1 = generateCodeUtil.create();
            const code2 = generateCodeUtil.create();
            expect(code1).not.toBe(code2);
        }
    });
});