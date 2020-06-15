import * as fs from 'fs';

export const writeJson = (path: string, content: any) => {
    fs.writeFileSync(`${path}.json`, JSON.stringify(content));
};

export const readJson = <T>(path: string): T => {
    const content = fs.readFileSync(`${path}.json`);
    return JSON.parse(content.toString());
};

export const writeTfVars = (path: string, values: any) => {
    const tfVarTemplate = Object.keys(values)
        .map((key) => `${key}="${values[key as any]}"`)
        .join('\n');
    fs.writeFileSync(path, tfVarTemplate);
};

export const readTfVars = (path: string): any => {
    const content: Buffer = fs.readFileSync(path);
    return content
        .toString()
        .split('\n')
        .reduce((object: any, part) => {
            const positionEqual = part.indexOf('=');
            object[part.slice(0, positionEqual)] = part.slice(positionEqual + 2, -1);
            return object;
        }, {});
};
