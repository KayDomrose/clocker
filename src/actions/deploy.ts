import minimist from 'minimist';
import { checkInitOrFail } from '../helpers/check-init';
import { logColorCommand, logColorServer, logError, logSuccess } from '../helpers/log';
import { getServerDir, getServers, isServerReady, serverIds } from '../helpers/servers';
import { BaseConfig } from './init';
import { getProvider } from '../provider';
import * as fs from 'fs';
// @ts-ignore
import spawn from 'await-spawn';
import { SERVER_USER, TEST_DOCKER_CONTAINER_PORT } from '../variables';

const validateDockerComposeFile = async (
    path: string,
    verbose: boolean = false
): Promise<boolean> => {
    const command = 'docker-compose';
    const args = ['--file', path, 'config'];
    console.log(`>> ${logColorCommand(command + ' ' + args.join(' '))}`);
    try {
        const stdOut: Buffer = await spawn(command, args);
        if (verbose) {
            console.log('>>');
            console.log(stdOut.toString());
            console.log('<<');
        }
        return true;
    } catch (e) {
        logError(e.stderr.toString());
        return false;
    }
};

const checkSSH = (ip: string, verbose: boolean = false): boolean => {
    const knownHostsFile = `${process.env.HOME}/.ssh/known_hosts`;
    if (verbose) {
        console.log(`>> Locking for known_hosts at ${knownHostsFile}.`);
    }
    if (!fs.existsSync(knownHostsFile)) {
        logError(`known_hosts file missing at ${knownHostsFile}.`);
        return false;
    }

    const knownHostContent: Buffer = fs.readFileSync(knownHostsFile);
    if (verbose) {
        console.log(`>> Checking if ip ${ip} exists in known_hosts.`);
    }
    if (!knownHostContent.toString().includes(ip)) {
        logError(`Fingerprint for ${ip} not found in ${knownHostsFile}`);
        console.log(
            `Please run ${logColorCommand(
                `ssh ${SERVER_USER}@${ip} exit`
            )} and confirm, then deploy again.`
        );
        return false;
    }

    return true;
};

const deployFile = async (filePath: string, serverIp: string, verbose: boolean = false) => {
    const command = 'docker-compose';
    const args = [
        '--host',
        `ssh://${SERVER_USER}@${serverIp}`,
        '--file',
        filePath,
        'up',
        '--detach',
    ];
    if (verbose) {
        console.log(`>> ${logColorCommand(command + ' ' + args.join(' '))}`);
    }
    try {
        const stdOut: Buffer = await spawn(command, args);
        if (verbose) {
            console.log(stdOut.toString());
        }
        return true;
    } catch (e) {
        logError(e.stderr.toString());
        return false;
    }
};

const deploy = async (args: minimist.ParsedArgs) => {
    if (!checkInitOrFail()) {
        return;
    }

    const verbose: boolean = args?.v || args?.verbose || args._.includes('verbose');
    if (verbose) {
        console.log('>> Verbose mode');
    }

    if (args._.length < 2) {
        logError('Please provide a server id');
        console.log(logColorCommand(`clocker deploy ID DOCKER-COMPOSE-FILE`));
        return;
    }

    const serverId: string = args._[1];

    if (!serverIds().includes(serverId)) {
        logError(`Can't find sever with id ${logColorServer(serverId)}`);
        console.log(`Run ${logColorCommand('clocker list')} to see all configured servers.`);
        return;
    }

    if (args._.length < 3) {
        logError('Please provide a valid path to your docker-compose file');
        console.log(
            logColorCommand(`clocker deploy ${logColorServer(serverId)} docker-compose.yml`)
        );
        return;
    }

    const dockerComposeFile = args._[2];
    console.log(`Deploying ${dockerComposeFile} to ${logColorServer(serverId)} ...\n`);

    if (!fs.existsSync(dockerComposeFile)) {
        logError(`Can't find file at ${dockerComposeFile}`);
        return;
    }

    console.log('Validating docker-compose file ...');
    if (!(await validateDockerComposeFile(dockerComposeFile, verbose))) {
        logError('Invalid');
        return;
    } else {
        logSuccess('Valid');
    }

    const serverConfig: BaseConfig = getServers().find((server) => server.id === serverId)!;
    const serverPath = getServerDir(serverConfig);
    const provider = getProvider(serverConfig.provider);

    console.log('\nChecking server ...');
    if (verbose) {
        console.log(
            `>> Checking for HTTP 200: http://${serverConfig.ip}:${TEST_DOCKER_CONTAINER_PORT}`
        );
    }
    if (!serverConfig.ip || !(await isServerReady(serverConfig.ip))) {
        logError('Server is not running');
        console.log(
            `Run ${logColorCommand(
                `clocker start ${logColorServer(serverId)}`
            )} to start the server.`
        );
        return;
    } else {
        logSuccess('Server is running');
    }

    console.log('\nChecking ssh connection ...');
    if (!checkSSH(serverConfig.ip, verbose)) {
        return;
    } else {
        logSuccess('OK');
    }

    console.log('\nDeploying ...');
    if (!(await deployFile(dockerComposeFile, serverConfig.ip, verbose))) {
        return;
    } else {
        logSuccess('Docker-compose file deployed');
        console.log(`Your services are now ready at http://${serverConfig.ip}.`);
    }
};

export default deploy;
