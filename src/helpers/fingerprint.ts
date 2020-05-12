import run from './command';
import { logError } from './log';
import * as fs from 'fs';

export const addFingerprintToKnownHosts = async (ip: string): Promise<boolean> => {
    await removeFingerprintFromKnownHosts(ip);

    if (global.verbose) {
        console.log(`>> Get fingerprints for ${ip}.`);
    }
    const result = await run('ssh-keyscan', [ip]);
    if (result === null) {
        logError('Error getting fingerprints');
        return false;
    }

    const knownHostsFile = `${process.env.HOME}/.ssh/known_hosts`;
    const content = fs.readFileSync(knownHostsFile).toString() || '';
    const contentWithFingerprints = content + result;
    if (global.verbose) {
        console.log(`>> Add fingerprints to ${knownHostsFile}.`);
        console.log(contentWithFingerprints);
    }
    fs.writeFileSync(knownHostsFile, contentWithFingerprints);
    return true;
};

export const removeFingerprintFromKnownHosts = async (ip: string): Promise<boolean> => {
    if (global.verbose) {
        console.log(`>> Remove old fingerprints for ${ip} from known_hosts.`);
    }
    const result = await run('ssh-keygen', ['-R', ip]);
    return result !== null;
};
