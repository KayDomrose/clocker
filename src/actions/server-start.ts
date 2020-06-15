import {
    logColorCommand,
    logColorServer,
    logCommand,
    logError,
    logHint,
    logSuccess,
} from '../helpers/log';
import { SERVER_USER, TEST_INTERVAL_SECONDS, TEST_INTERVAL_TRIES } from '../variables';
import { Server } from '../classes/Server';
import { addFingerprintToKnownHosts } from '../helpers/fingerprint';
import { ServerArgBag } from '../clocker';
import ArgsType = jest.ArgsType;
import { strict } from 'assert';

const waitForServer = async (server: Server) => {
    let times = 0;
    while (times < TEST_INTERVAL_TRIES) {
        console.log(`Waiting ... ${(times + 1) * TEST_INTERVAL_SECONDS}s`);
        if (await server.isReady()) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, TEST_INTERVAL_SECONDS * 1000));
        times++;
    }

    return false;
};

const serverStart = async (args: ServerArgBag) => {
    const server = Server.buildFromId(args.serverId);

    console.log(`Starting ${logColorServer(server.getId())} ...`);

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
    console.log('Updating ssh fingerprint ...');
    if (!(await addFingerprintToKnownHosts(server.getIpAddress()))) {
        logError('Error while adding finterprints');
        console.log('Please handle ssh fingerprints yourself by running');
        logCommand(`ssh ${SERVER_USER}@${server.getIpAddress()} exit`);
        return;
    }
    logSuccess('Fingerprints updated');

    console.log('\n');
    console.log('Copy data to remote server ...');
    if (!(await server.copyDataToRemote())) {
    }
    logSuccess(`Data copied to ${server.remote_data_path} on ${server.getIpAddress()}`);

    console.log('\n');
    logSuccess(`Server ${logColorServer(server.getId())} successfully started`);
    console.log(`Server ip is ${logColorServer(server.getIpAddress()!)}.`);
    const command = `ssh ${SERVER_USER}@${server.getIpAddress()}`;
    console.log(`You can access server by running ${logColorCommand(command)}.`);
    logError('You will now be charged by your server provider while this server is running.');
    console.log('\n');
    console.log(`Run ${logColorCommand(`clocker deploy ${server.getId()} DOCKER-COMPOSE-FILE`)}.`);
    console.log(`Run ${logColorCommand(`clocker stop ${server.getId()}`)} to stop the server.`);
};

export default serverStart;
