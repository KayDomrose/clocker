import minimist from 'minimist';
import { checkInitOrFail } from '../helpers/check-init';
import { logColorCommand, logColorServer, logError, logSuccess } from '../helpers/log';
import { Server } from '../classes/Server';

const stop = async (args: minimist.ParsedArgs) => {
    if (!checkInitOrFail()) {
        return;
    }

    const serverId: string = args._[1];
    let server: Server | null = null;
    try {
        server = Server.buildFromId(serverId);
    } catch (e) {
        console.error(e);
        return;
    }

    console.log(`Stopping ${logColorServer(serverId)} ...`);
    if (await server.stop()) {
        logSuccess('Server stopped');
    }
};

export default stop;
