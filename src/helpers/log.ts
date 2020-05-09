import chalk from 'chalk';

export const logColorNew = (message:string): string => chalk.green(message);
export const logColorSuccess = (message:string): string => chalk.green(message);
export const logColorCommand = (message:string): string => chalk.blue(message);
export const logColorError = (message:string): string => chalk.red(message);
export const logColorServer = (message:string): string => chalk.yellow(message);

export const logNew = (message: string) => console.log(logColorNew(message));
export const logSuccess = (message: string) => console.log(logColorSuccess(message));
export const logError = (message: string) => console.log(logColorError(message));
