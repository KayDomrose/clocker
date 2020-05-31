import { getActionArgBag, findAction } from "../../src/helpers/actions";

describe('findAction', () => {
    it("should not find action on empty args", () => {
        const args = [''];

        const action = findAction(args);

        expect(action).toBeNull();
    });

    it("should not find action on invalid", () => {
        const args = ['invalid'];

        const action = findAction(args);

        expect(action).toBeNull();
    });

    it("should find simple action", () => {
        const args = ['init'];

        const action = findAction(args);

        expect(action?.name).toBe('init');
    });

    it("should find namespaced action", () => {
        const args = ['server', 'add'];

        const action = findAction(args);

        expect(action.name).toBe('add');
    });
});

describe("getActionArgs", () => {
    it("should return empty object on action without args", () => {
        const action = {
            args: []
        }
        const args = [];

        const result = getActionArgBag(args, action);

        expect(result).toMatchObject({});
    });

    it("should return null on missing args", () => {
        console.log = jest.fn();

        const action = {
            name: 'test',
            args: ['id']
        }
        const args = ['test'];

        const result = getActionArgBag(args, action);

        expect(result).toBeNull();
    });

    it("should return bag on correct single args", () => {
        const action = {
            name: 'test',
            args: ['id']
        }
        const args = ['test', 'test-id'];

        const result = getActionArgBag(args, action);

        expect(result).toMatchObject({
            id: 'test-id'
        });
    });

    it("should return bag on correct multiple args", () => {
        const action = {
            name: 'test',
            args: ['a', 'b', 'c']
        }
        const args = ['test', '1', '2', '3'];

        const result = getActionArgBag(args, action);

        expect(result).toMatchObject({
            a: '1',
            b: '2',
            c: '3'
        });
    });
});
