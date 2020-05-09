import minimist from "minimist";
import {getServerDir, getServers, isServerReady, serverIds, updateServer} from "../helpers/servers";
import {logColorCommand, logColorServer, logColorSuccess, logError, logSuccess} from "../helpers/log";
import {BaseConfig} from "./init";
import {Provider} from "../providers/Provider";
import {getProvider} from "../provider";
// @ts-ignore
import spawn from 'await-spawn';
import {TEST_INTERVAL_SECONDS, TEST_INTERVAL_TRIES} from "../variables";
import {checkInitOrFail} from "../helpers/check-init";

const waitForServer = async (ip: string) => {
    console.log(`\nWaiting for server to be ready ...`);
    console.log('This may take a few minutes.');

    let times = 0;
    while (times < TEST_INTERVAL_TRIES) {
        console.log(`Try ${times + 1} ...`);
        const isReady = await isServerReady(ip);
        if (isReady) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, TEST_INTERVAL_SECONDS * 1000));
        times++;
    }

    return false;


};

const getServerIpFromTerraform = async (path: string): Promise<string> => {
    try {
        const stdOut:Buffer = await spawn('terraform', ['output', 'ip_address'], {cwd: path});
        return stdOut.toString().replace('\n', '');
    } catch (e) {
        console.error(e.stderr.toString());
        return '';
    }
};

const startAndProvisionTerraform = async (path: string, config:BaseConfig, provider: Provider, verbose: boolean = false) => {
    if (!verbose) {
        console.log('\nCreating server ...');
    }

    const args = [
        'apply',
        '--auto-approve',
        '--input=false',
        path
    ];

    const stdOut:Buffer = await spawn('terraform', args, {
        cwd: path,
        shell: true
    });
    console.log(verbose ? stdOut.toString() : logColorSuccess('Created'));
}

const initTerraform = async (path: string, verbose: boolean = false) => {
    if (!verbose) {
        console.log('\nInitializing terraform ...');
    }

    const stdOut:Buffer = await spawn('terraform', ['init'], {cwd: path});
    console.log(verbose ? stdOut.toString() : logColorSuccess('Initialized'));
}

const start = async (args: minimist.ParsedArgs) => {
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

    const verbose:boolean = args?.v || args?.verbose;
    const serverConfig: BaseConfig = getServers().find(server => server.id === serverId)!;
    const serverPath = getServerDir(serverConfig);
    const provider = getProvider(serverConfig.provider);

    console.log(`Starting ${logColorServer(serverId)}`);

    try {
        await initTerraform(serverPath, verbose);
        await startAndProvisionTerraform(serverPath, serverConfig, provider, verbose);
    } catch (e) {
        console.error(e.stderr.toString());
        return;
    }

    const ip: string = await getServerIpFromTerraform(serverPath);

    if (!await waitForServer(ip)) {
        logError(`Server is not ready after ${TEST_INTERVAL_SECONDS * TEST_INTERVAL_TRIES} seconds.`);
        return;
    }
    logSuccess('Server ready');
    updateServer(serverId, 'ip', ip);

    logSuccess(`\nServer ${logColorServer(serverId)} (${logColorServer(ip)}) started!`);
    logError('You will now be charged by your server provider while this server is running.');
    console.log(`\nTo deploy your docker containers, run ${logColorCommand(`clocker deploy ${serverConfig.id} DOCKER-COMPOSE-FILE`)}`);
    console.log(`To stop the server, run ${logColorCommand(`clocker stop ${serverConfig.id}`)}`);
}

export default start;
