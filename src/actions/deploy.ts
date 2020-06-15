import { logColorCommand, logColorServer, logError, logSuccess } from '../helpers/log';
import * as fs from 'fs';
import { SERVER_USER } from '../variables';
import { Server } from '../classes/Server';
import * as os from 'os';
import path from 'path';
import run from '../helpers/command';
import { ServerDeployArgBag } from '../clocker';

const validateDockerComposeFile = async (path: string): Promise<boolean> => {
    const output = await run('docker-compose', ['--file', path, 'config']);
    return output !== null;
};

const getAbsolutePath = (filepath: string, delim = '/'): string => {
    const homedir = os.homedir();
    filepath = filepath.replace(/\~/g, homedir + delim);
    return path.resolve(filepath);
};

const deployFile = async (filePath: string, server: Server) => {
    const output = await run('docker-compose', [
        '--host',
        `ssh://${SERVER_USER}@${server.getIpAddress()}`,
        '--file',
        filePath,
        'up',
        '--detach',
    ]);

    if (output === null) {
        logError('Error while deploying docker-compose file');
        return null;
    }

    server.addDeployment({
        composePath: getAbsolutePath(filePath),
        lastDeployment: new Date(),
    });
    server.save();
    return true;
};

const deploy = async (args: ServerDeployArgBag) => {
    const server = Server.buildFromId(args.serverId);

    const dockerComposeFile = args.composeFile;
    console.log(`Deploying ${dockerComposeFile} to ${logColorServer(server.getId())} ...`);

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
                `clocker start ${logColorServer(server.getId())}`
            )} to start the server.`
        );
        return;
    } else {
        logSuccess('Server is running');
    }

    console.log('\n');
    console.log('Deploying ...');
    if (!(await deployFile(dockerComposeFile, server))) {
        return;
    } else {
        logSuccess('Docker-compose file deployed');
        console.log(
            `Your services are now ready at ${server.getIpAddress()} (http://${server.getIpAddress()}).`
        );
    }
};

export default deploy;
