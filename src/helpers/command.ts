// @ts-ignore
import spawn from 'await-spawn';
import { logColorCommand } from './log';

const run = async (
    command: string,
    args: string[] = [],
    options: any = {}
): Promise<string | null> => {
    if (global.verbose) {
        console.log(`>> Running ${logColorCommand(`${command} ${args.join(' ')}`)}`);
    }
    try {
        const stdOut: Buffer = await spawn(command, args, options);
        if (global.verbose) {
            console.log('OUTPUT >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
            console.log(stdOut.toString());
            console.log('OUTPUT <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
        }
        return stdOut.toString();
    } catch (e) {
        console.error(e.stderr.toString());
        return null;
    }
};

export default run;
