// @ts-ignore
import spawn from 'await-spawn';
import { logColorCommand, logVerbose } from './log';

export type RunResult = string | null;

const run = async (command: string, args: string[] = [], options: any = {}): Promise<RunResult> => {
    logVerbose(`>> Running ${logColorCommand(`${command} ${args.join(' ')}`)}`);
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
