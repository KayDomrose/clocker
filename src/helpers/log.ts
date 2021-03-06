import chalk from 'chalk';

export const logColorSuccess = (message: string): string => chalk.green(message);
export const logColorCommand = (message: string): string => chalk.blue(message);
export const logColorError = (message: string): string => chalk.red(message);
export const logColorServer = (message: string): string => chalk.yellow(message);
export const logColorHint = (message: string): string => chalk.grey(message);
export const logColorHoster = (message: string): string => chalk.magenta(message);

export const logSuccess = (message: string) => console.log(logColorSuccess(message));
export const logError = (message: string) => console.log(logColorError(message));
export const logHint = (message: string) => console.log(logColorHint(message));
export const logCommand = (message: string) => console.log(logColorCommand(message));
export const logHoster = (message: string) => console.log(logColorHoster(message));
export const logServer = (message: string) => console.log(logColorServer(message));

export const logVerbose = (message: string) => {
    if (!global.verbose) {
        return;
    }
    console.log(`>> ${message}`);
};
