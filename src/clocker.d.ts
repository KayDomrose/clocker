export {};

declare global {
    namespace NodeJS {
        interface Global {
            verbose: boolean;
        }
    }
}
