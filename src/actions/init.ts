import fs from 'fs';
import { BASE_PATH } from '../variables';
import { logColorCommand, logColorSuccess, logNew, logSuccess } from '../helpers/log';
import { writeJson } from '../helpers/file';
import checkInit from '../helpers/check-init';

export interface BaseConfig {
    id: string;
    provider: string;
    ip: string | null;
}

const createHomeDir = (): boolean => {
    if (fs.existsSync(BASE_PATH)) {
        return true;
    }

    fs.mkdirSync(BASE_PATH);
    fs.mkdirSync(`${BASE_PATH}/servers`);
    logNew(`Clocker base dir created at ${BASE_PATH}`);

    writeJson('servers', []);

    return true;
};

const init = async () => {
    if (checkInit()) {
        console.log(`
${logColorSuccess('Clocker is already initialized.')}

Next Steps:
    ${logColorCommand('clocker list')}      Get all configured servers
    ${logColorCommand('clocker add')}       Add a new server
        `);
        return;
    }
    createHomeDir();
};

export default init;
