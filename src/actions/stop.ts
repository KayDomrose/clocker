import minimist from 'minimist';
import { logColorServer, logCommand, logError, logSuccess } from '../helpers/log';
import { Server } from '../classes/Server';
import { removeFingerprintFromKnownHosts } from '../helpers/fingerprint';

const stop = async (args: minimist.ParsedArgs) => {
    const serverId: string = args._[1];
    let server: Server | null = null;
    try {
        server = Server.buildFromId(serverId);
    } catch (e) {
        console.error(e);
        return;
    }

    console.log(`Stopping ${logColorServer(serverId)} ...`);

    if (!(await server.isReady())) {
        logSuccess('Server already stopped');
        return;
    }

    console.log('\n');
    console.log('Saving data from server ...');
    if (!(await server.copyDataFromRemote())) {
    }
    logSuccess(`Data saved locally to ${server.getDataPath()}`);

    console.log('\n');
    console.log('Stopping ...');
    const serverIp = server.getIpAddress();
    if (!(await server.stop())) {
        logError('Failed to stop');
        return;
    }
    logSuccess('Server stopped');

    console.log('\n');
    console.log('Cleaning up ssh fingerprints ...');
    if (!(await removeFingerprintFromKnownHosts(serverIp))) {
        logError('Error while cleaning up fingerprints');
        console.log('You can remove unused fingerprints yourself by running');
        logCommand(`ssh-keygen -R ${serverIp}`);
        return;
    }
    logSuccess('Fingerprints cleaned up');
};

export default stop;
