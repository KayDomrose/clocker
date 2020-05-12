import minimist from 'minimist';
import { logColorCommand, logColorServer, logError, logHint, logSuccess } from '../helpers/log';
import { TEST_INTERVAL_SECONDS, TEST_INTERVAL_TRIES } from '../variables';
import { checkInitOrFail } from '../helpers/check-init';
import { Server } from '../classes/Server';

const waitForServer = async (server: Server) => {
    let times = 0;
    while (times < TEST_INTERVAL_TRIES) {
        console.log(`Waiting  ... ${(times + 1) * TEST_INTERVAL_SECONDS}s`);
        if (await server.isReady()) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, TEST_INTERVAL_SECONDS * 1000));
        times++;
    }

    return false;
};

const start = async (args: minimist.ParsedArgs) => {
    if (!checkInitOrFail()) {
        return;
    }

    const serverId: string = args._[1];
    let server: Server | null = null;
    try {
        server = Server.buildFromId(serverId);
    } catch (e) {
        logError(`Can't find server with id ${serverId}`);
        console.log(`Run ${logColorCommand('clocker list')} to get all servers.`);
        return;
    }

    console.log(`Starting ${logColorServer(serverId)} ...`);

    console.log('\n');
    console.log('Initialize terraform ...');
    if (!(await server.initializeTerraform())) {
        logError('Failed');
        return;
    }
    logSuccess('Initialized');

    console.log('\n');
    console.log('Creating server ...');
    if (!(await server.start())) {
        logError('Failed');
        return false;
    }
    logSuccess(`Created with IP ${server.getIpAddress()}`);

    console.log('\n');
    console.log('Waiting for server to finish setup ...');
    logHint('This may take some minutes.');
    if (!(await waitForServer(server))) {
        logError(`Server is not set up ${TEST_INTERVAL_SECONDS * TEST_INTERVAL_TRIES} seconds.`);
        return;
    }
    logSuccess('Ready');

    console.log('\n');
    console.log('Checking ssh fingerprint...');
    server.checkSSH();

    console.log('\n');
    logSuccess(`Server ${logColorServer(serverId)} successfully started`);
    console.log(`Server ip is ${logColorServer(server.getIpAddress()!)}.`);
    logError('You will now be charged by your server provider while this server is running.');
    console.log('\n');
    console.log(`Run ${logColorCommand(`clocker deploy ${serverId} DOCKER-COMPOSE-FILE`)}.`);
    console.log(`Run ${logColorCommand(`clocker stop ${serverId}`)} to stop the server.`);
};

export default start;
