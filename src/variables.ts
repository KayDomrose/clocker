require('dotenv').config();

export const BASE_PATH =
    process.env?.ENVIRONMENT === 'local'
        ? process.env.DEV_CLOCKER_DIR!
        : `${process.env.HOME}/.clocker`;
export const SERVERS_PATH = `${BASE_PATH}/servers`;
export const HOSTERS_PATH = `${BASE_PATH}/hosters`;
export const VERSION = '0.1.0';

export const TEST_INTERVAL_SECONDS = 10;
export const TEST_INTERVAL_TRIES = 30;
export const TEST_DOCKER_CONTAINER_PORT = 11111;

export const SERVER_USER = 'worker';
