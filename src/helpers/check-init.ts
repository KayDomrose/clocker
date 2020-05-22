import * as fs from 'fs';
import { BASE_PATH, SERVERS_PATH } from '../variables';

const checkInit = (): boolean => {
    return fs.existsSync(BASE_PATH) && fs.existsSync(SERVERS_PATH);
};

export default checkInit;
