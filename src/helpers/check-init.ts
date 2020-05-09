import * as fs from "fs";
import {BASE_PATH} from "../variables";
import {logColorCommand, logColorError} from "./log";

const checkInit = ():boolean => {
    const files = [
        'servers.json',
    ]
    return fs.existsSync(BASE_PATH) &&
        files.filter(f => fs.existsSync(`${BASE_PATH}/${f}`)).length === files.length;
}

export const checkInitOrFail = ():boolean => {
    if (checkInit()) {
        return true;
    }

    console.log(`
${logColorError('clocker is not initialized')}

Run ${logColorCommand('clocker init')} to initialize.
    `);
    return false;
}

export default checkInit;
