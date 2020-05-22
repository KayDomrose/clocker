export default abstract class Exception {
    protected readonly _messageParts: string[];

    constructor(_messageParts: string[]) {
        this._messageParts = _messageParts;
    }

    public printErrors(): void {
        this._messageParts.forEach((error) => {
            console.log(error);
        });
    }
}
