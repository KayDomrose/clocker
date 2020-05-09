import minimist from 'minimist';
import { checkInitOrFail } from '../helpers/check-init';
import {
    logColorCommand,
    logColorServer,
    logColorSuccess,
    logError,
    logSuccess,
} from '../helpers/log';
import { getServerDir, getServers, serverIds } from '../helpers/servers';
import { BaseConfig } from './init';
// @ts-ignore
import spawn from 'await-spawn';

const destroyTerraform = async (path: string, verbose: boolean = false): Promise<boolean> => {
    try {
        const stdOut: Buffer = await spawn('terraform', ['destroy', '--auto-approve'], {
            cwd: path,
        });
        console.log(verbose ? stdOut.toString() : logColorSuccess('Server stopped.'));
        return true;
    } catch (e) {
        console.error(e.stderr.toString());
        return false;
    }
};

const stop = async (args: minimist.ParsedArgs) => {
    if (!checkInitOrFail()) {
        return;
    }

    if (args._.length < 2) {
        logError('Please provide a server id');
        console.log(logColorCommand('clocker start ID'));
        return;
    }

    const serverId: string = args._[1];

    if (!serverIds().includes(serverId)) {
        logError(`Can't find sever with id ${logColorServer(serverId)}`);
        console.log(`Run ${logColorCommand('clocker list')} to see all configured servers.`);
        return;
    }

    const verbose: boolean = args?.v || args?.verbose;
    const serverConfig: BaseConfig = getServers().find((server) => server.id === serverId)!;
    const serverPath = getServerDir(serverConfig);

    console.log(`Stopping ${logColorServer(serverId)}`);

    await destroyTerraform(serverPath, verbose);
};

export default stop;
