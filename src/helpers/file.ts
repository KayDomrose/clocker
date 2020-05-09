import * as fs from 'fs';
import { BASE_PATH } from '../variables';

export const writeJson = (name: string, content: any, inWorkingDir: boolean = false) => {
    const path = `${inWorkingDir ? '.' : BASE_PATH}/${name}.json`;
    fs.writeFileSync(path, JSON.stringify(content));
};

export const readJson = (name: string): any => {
    const content = fs.readFileSync(`${BASE_PATH}/${name}.json`);
    return JSON.parse(content.toString());
};
