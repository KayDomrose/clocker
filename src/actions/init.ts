import fs from 'fs';
import {BASE_PATH} from "../variables";
import {logColorCommand, logColorSuccess, logNew, logSuccess} from "../helpers/log";
import {writeJson} from "../helpers/file";
import checkInit from "../helpers/check-init";

export interface BaseConfig {
    id: string;
    provider: string;
    ip: string | null
}

const createHomeDir = ():boolean => {
    if (fs.existsSync(BASE_PATH)) {
        return true;
    }

    fs.mkdirSync(BASE_PATH);
    fs.mkdirSync(`${BASE_PATH}/servers`);
    logNew(`Clocker base dir created at ${BASE_PATH}`);

    writeJson('servers', []);

    return true;
}

const init = async () => {
    if (checkInit()) {
        console.log(`
${logColorSuccess('Clocker is already initialized and ready to be uses.')}

Next Steps:
    ${logColorCommand('clocker servers')}       Get all configured servers
    ${logColorCommand('clocker servers add')}   Add a new server
        `);
        return;
    }
    createHomeDir();


//     if (fs.existsSync('config.json') || fs.existsSync('.env.clocker')) {
//         console.log(chalk.red('Found previous clocker configuration.'));
//         console.log(`These files will be overwritten when you continue:
//     - clocker.json
//     - .env.clocker
// `);
//         const r = await prompts({
//             type: 'confirm',
//             name: 'overwrite',
//             message: 'Do you want to continue?',
//             initial: false
//         });
//
//         if (!r.overwrite) {
//             console.log('Skip initialization');
//             return;
//         }
//     }
//
//
//     console.log('Answer these questions to create your clocker config.\nNothing will be created yet!\n');
//     const config = await requestConfig();
//
//     const c = saveConfig(config);
//     saveEnv(config);
//     copyTerraformConfig(c);
//
//     console.log(`
// ${chalk.green('clocker initialized!')}
//
// Created files:
//     ${chalk.green('terraform.tf')}      Terraform configuration
//     ${chalk.green('clocker.json')}      Containing configuration for version control
//     ${chalk.green('.env.docker')}       Containing secrets
//
// Run ${chalk.blue('clocker up')} to create the server and deploy your docker-compose.yml.
// `)
};

export default init;
