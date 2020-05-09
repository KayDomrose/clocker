require('dotenv').config();

export const BASE_PATH = process.env.DEV_CLOCKER_DIR || `${process.env.HOME}/.clocker`;
export const VERSION = '0.1';

export const TEST_INTERVAL_SECONDS = 10;
export const TEST_INTERVAL_TRIES = 12;
