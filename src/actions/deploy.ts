import minimist from 'minimist';
import { logColorCommand, logColorServer, logError, logSuccess } from '../helpers/log';
import * as fs from 'fs';
// @ts-ignore
import spawn from 'await-spawn';
import { SERVER_USER } from '../variables';
import { Server } from '../classes/Server';
import { checkInitOrFail } from '../helpers/check-init';
import * as os from 'os';
import path from 'path';

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

const getAbsolutePath = (filepath: string, delim = '/'): string => {
    const homedir = os.homedir();
    filepath = filepath.replace(/\~/g, homedir + delim);
    return path.resolve(filepath);
};

const deployFile = async (filePath: string, server: Server) => {
    const command = 'docker-compose';
    const args = [
        '--host',
        `ssh://${SERVER_USER}@${server.getIpAddress()}`,
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
        server.addDeployment({
            composePath: getAbsolutePath(filePath),
            lastDeployment: new Date(),
        });
        server.save();
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
    if (!(await deployFile(dockerComposeFile, server))) {
        return;
    } else {
        logSuccess('Docker-compose file deployed');
        console.log(`Your services are now ready at http://${server.getIpAddress()}.`);
    }
};

export default deploy;
