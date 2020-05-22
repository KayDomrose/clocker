export default abstract class Exception {
    public readonly message: string;

    constructor(message: string) {
        this.message = message;
    }
}
