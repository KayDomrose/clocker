#!/usr/bin/env node

import minimist from "minimist";
import add from "./src/actions/add";
import init from "./src/actions/init";
import {VERSION} from "./src/variables";
import {logColorCommand} from "./src/helpers/log";
import list from "./src/actions/list";
import start from "./src/actions/start";
import stop from "./src/actions/stop";

const actions: {[k: string]: {(args: minimist.ParsedArgs):void}} = {
    'init': init,
    'add': add,
    'list': list,
    'start': start,
    'stop': stop,
}

const run = (args: minimist.ParsedArgs) => {
    if (args._.length === 0 || !Object.keys(actions).includes(args._[0])) {
        console.log(
`clocker - CLoud doCKER 
v${VERSION}

Usage: ${logColorCommand('clocker ACTION')}

Actions:
    ${logColorCommand('init')}                              Initialize clocker config
    ${logColorCommand('list')}                              List all servers with state
    ${logColorCommand('add')}                               Configure a new remote cloud server
    ${logColorCommand('start ID')}                          Create and provision a server
    ${logColorCommand('stop ID')}                           Destroy a server
    ${logColorCommand('deploy ID DOCKER-COMPOSE-FILE')}     Deploy a docker-compose file to a server
`)
        return;
    }

    actions[args._[0]](args);
};

const argv = minimist(process.argv.slice(2));
run(argv);
