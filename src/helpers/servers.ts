import { BaseConfig } from '../actions/init';
import { readJson, writeJson } from './file';
import { BASE_PATH, TEST_DOCKER_CONTAINER_PORT } from '../variables';
import axios, { AxiosResponse } from 'axios';
import axiosRequest from '@nelsonomuto/axios-request-timeout';

export const getServers = (): BaseConfig[] => {
    return readJson('servers');
};

export const addServer = (config: BaseConfig) => {
    const servers: BaseConfig[] = readJson('servers');
    writeJson('servers', [...servers, config]);
};

export const serverIds = (): string[] => {
    return getServers().map((s) => s.id);
};

export const getServerDir = (config: BaseConfig): string => `${BASE_PATH}/servers/${config.id}`;

export const updateServer = (serverId: string, key: 'ip', value: string) => {
    const servers = getServers();
    servers.map((s) => {
        if (s.id === serverId) {
            s[key] = value;
        }
        return s;
    });
    writeJson('servers', servers);
};

export const isServerReady = async (ip: string): Promise<boolean> => {
    const url = `http://${ip}:${TEST_DOCKER_CONTAINER_PORT}`;

    try {
        const result: AxiosResponse = await axiosRequest({
            url,
            method: 'GET',
            timeout: 1000,
        });
        return result.status === 200;
    } catch (e) {
        return false;
    }
};
