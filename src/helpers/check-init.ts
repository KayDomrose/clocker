import * as fs from 'fs';
import { BASE_PATH, SERVERS_PATH } from '../variables';
import { logColorCommand, logColorError } from './log';

const checkInit = (): boolean => {
    return fs.existsSync(BASE_PATH) && fs.existsSync(SERVERS_PATH);
};

export const checkInitOrFail = (): boolean => {
    if (checkInit()) {
        return true;
    }

    console.log(`
${logColorError('clocker is not initialized')}

Run ${logColorCommand('clocker init')} to initialize.
    `);
    return false;
};

export default checkInit;
