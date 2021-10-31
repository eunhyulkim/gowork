import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import { searchDirectory } from './util';

const copy = promisify(ncp);
const exists = fs.existsSync;
const read = fs.readFileSync;

async function copyDirectory(source, target) {
  await copy(source, target, {
    clobber: false,
  });
}

async function createConfigDirectory(rootDirectory) {
  const currentFileUrl = import.meta.url;
  const sourceDirectory = path.resolve(
    new URL(currentFileUrl).pathname,
    '../templates'
  );
  await copyDirectory(sourceDirectory, rootDirectory);
  return;
}

export default async function parseConfig() {
  const rootDirectory = searchDirectory('package.json');
  const exist = exists(rootDirectory + '/templates');
  if (!exist) {
    await createConfigDirectory(rootDirectory);
  }
  const data = JSON.parse(read(rootDirectory + '/templates/config.json'));
  return data;
}
