import Hoster from '../classes/Hoster';
import fs from 'fs';
import { HOSTERS_PATH } from '../variables';
import { logError, logVerbose } from './log';

export const allHosters = (): Hoster[] => {
    const files = fs.readdirSync(HOSTERS_PATH);
    const hosterDirs = files.filter((file) =>
        fs.lstatSync(`${HOSTERS_PATH}/${file}`).isDirectory()
    );

    const hosters = hosterDirs.map((id) => {
        try {
            return Hoster.buildFromId(id);
        } catch (e) {
            console.log(e);
            logVerbose(`Cannot find hoster configuration for "${id}"`);
            return null;
        }
    });

    return hosters.filter((s) => s instanceof Hoster) as Hoster[];
};
