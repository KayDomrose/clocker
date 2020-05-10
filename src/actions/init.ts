import fs from 'fs';
import { BASE_PATH } from '../variables';
import { logColorCommand, logSuccess } from '../helpers/log';
import checkInit from '../helpers/check-init';

const createHomeDir = (): boolean => {
    fs.mkdirSync(BASE_PATH);
    fs.mkdirSync(`${BASE_PATH}/servers`);

    return true;
};

const init = async () => {
    if (checkInit()) {
        logSuccess(`clocker is already initialized at ${BASE_PATH}`);
    } else {
        createHomeDir();
        logSuccess(`clocker initialized`);
        console.log(`clocker dir created at ${BASE_PATH}.`);
    }

    console.log('\n');
    console.log(`Run ${logColorCommand('clocker list')} to see all servers.`);
    console.log(`Run ${logColorCommand('clocker add')} to add a server.`);
};

export default init;
