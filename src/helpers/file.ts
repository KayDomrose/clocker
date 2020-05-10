import * as fs from 'fs';

export const writeJson = (path: string, name: string, content: any) => {
    fs.writeFileSync(`${path}/${name}.json`, JSON.stringify(content));
};

export const readJson = (path: string, name: string): any => {
    const content = fs.readFileSync(`${path}/${name}.json`);
    return JSON.parse(content.toString());
};
