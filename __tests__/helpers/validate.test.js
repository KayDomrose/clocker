import { validateId } from "../../src/helpers/validator";

describe('validateId', () => {
    it('allow  ', () => {
        const result = validateId('aA0-_');

        expect(result).toBe(true);
    });

    it('doesn\'t allow /', () => {
        const result = validateId('/');

        expect(result).toBe(false);
    });

    it('doesn\'t allow white space', () => {
        const result = validateId('hello world');

        expect(result).toBe(false);
    });
});
