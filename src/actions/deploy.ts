import minimist from 'minimist';
import { logColorCommand, logColorServer, logError, logSuccess } from '../helpers/log';
import * as fs from 'fs';
// @ts-ignore
import spawn from 'await-spawn';
import { SERVER_USER } from '../variables';
import { Server } from '../classes/Server';
import { checkInitOrFail } from '../helpers/check-init';

const validateDockerComposeFile = async (path: string): Promise<boolean> => {
    const command = 'docker-compose';
    const args = ['--file', path, 'config'];
    if (global.verbose) {
        console.log(`>> ${logColorCommand(command + ' ' + args.join(' '))}`);
    }
    try {
        const stdOut: Buffer = await spawn(command, args);
        if (global.verbose) {
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

const deployFile = async (filePath: string, serverIp: string) => {
    const command = 'docker-compose';
    const args = [
        '--host',
        `ssh://${SERVER_USER}@${serverIp}`,
        '--file',
        filePath,
        'up',
        '--detach',
    ];
    if (global.verbose) {
        console.log(`>> ${logColorCommand(command + ' ' + args.join(' '))}`);
    }
    try {
        const stdOut: Buffer = await spawn(command, args);
        if (global.verbose) {
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

    const serverId: string = args._[1];
    let server: Server | null = null;
    try {
        server = Server.buildFromId(serverId);
    } catch (e) {
        console.error(e);
        return;
    }

    const dockerComposeFile = args._[2];
    console.log(`Deploying ${dockerComposeFile} to ${logColorServer(serverId)} ...`);

    if (!fs.existsSync(dockerComposeFile)) {
        logError(`Can't find file at ${dockerComposeFile}`);
        return;
    }

    console.log('\n');
    console.log('Validating docker-compose file ...');
    if (!(await validateDockerComposeFile(dockerComposeFile))) {
        logError('Invalid');
        return;
    } else {
        logSuccess('Valid');
    }

    console.log('\n');
    console.log('Checking server status ...');
    if (!(await server.isReady())) {
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

    console.log('\n');
    console.log('Checking ssh connection ...');
    if (!server.checkSSH()) {
        return;
    } else {
        logSuccess('OK');
    }

    console.log('\n');
    console.log('Deploying ...');
    if (!(await deployFile(dockerComposeFile, server.getIpAddress()))) {
        return;
    } else {
        logSuccess('Docker-compose file deployed');
        console.log(`Your services are now ready at http://${server.getIpAddress()}.`);
    }
};

export default deploy;
