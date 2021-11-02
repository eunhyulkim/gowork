import fs from 'fs';
import arg from 'arg';
import ncp from 'ncp';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { searchDirectory } from './util';
import { promisify } from 'util';
import parseConfig from './config';

const access = promisify(fs.access);
const copy = promisify(ncp);
const exists = fs.existsSync;
const read = fs.readFileSync;
const readDir = fs.readdirSync;

function root() {
  return searchDirectory('package.json');
}

function existsTargetDirectory(resolvePath) {
  if (!resolvePath) {
    return [false, null];
  }

  const rootPath = root();
  const targetPath = path.resolve(rootPath, resolvePath);
  const exist = exists(targetPath);
  return [exist, exist ? targetPath : null];
}

function parseArgumentsIntoOptions(rawArgs, config) {
  const args = arg(
    {
      '--yes': Boolean,
      '-y': '--yes',
    },
    {
      argv: rawArgs.slice(2),
    }
  );
  return {
    skipPrompts: args['--yes'] || false,
    template: args['--yes'] ? config.defaultTemplate : args._[0],
    targetDirectory: args['--yes'] ? config.defaultTargetDirectory : args._[1],
    fileName: args['--yes'] ? args._[0] : args._[2],
    properties: args['--yes'] ? args._.slice(1) : args._.slice(3),
    data: null,
  };
}

async function askTemplate(options) {
  const templatesPath = root() + '/templates';
  const files = readDir(templatesPath);
  const templateChoices = files
    .map((file) => file.substring(0, file.indexOf('.')))
    .filter((file) => file !== 'config');

  if (templateChoices.length <= 1) {
    return templateChoices[0];
  }

  if (options.template && templateChoices.includes(options.template)) {
    return options.template;
  }

  const defaultTemplate = templateChoices[0];
  const answer = await inquirer.prompt({
    type: 'list',
    name: 'template',
    message: 'Please choose which template to use',
    choices: templateChoices,
    default: defaultTemplate,
  });

  return answer.template;
}

async function askTargetDirectory(template, options, config) {
  let [exists, targetPath] = existsTargetDirectory(options.targetDirectory);
  if (exists) {
    return targetPath;
  }

  [exists, targetPath] = existsTargetDirectory(config.templates[template]);
  if (exists) {
    return targetPath;
  }

  let answer;
  while (!exists) {
    answer = await inquirer.prompt({
      type: 'input',
      name: 'target_directory',
      message: 'Please input which target directory to create',
    });
    [exists, targetPath] = existsTargetDirectory(answer.target_directory);
    if (!exists) {
      console.error(chalk.red('Error: directory path is not exists.'));
    }
  }

  return targetPath;
}

async function askFileName(options) {
  if (options.fileName) {
    return options.fileName;
  }

  const answer = await inquirer.prompt({
    type: 'input',
    name: 'file_name',
    message: 'Please input which file name to create',
  });

  return answer.file_name;
}

function readTemplate(template) {
  const suffix = ['js', 'ts', 'jsx', 'tsx'];
  const data = suffix.reduce((d, t) => {
    if (d) {
      return d;
    }
    const path = `${root()}/templates/${template}.${t}`;
    if (exists(path)) {
      return read(path, 'utf8');
    }
    return null;
  }, null);

  return data;
}

function existsPlaceHolder(data, i) {
  return data.indexOf(`$${i}`) !== -1;
}

function parseHolder(data, i) {
  const token = `/$${i}:`;
  const length = data.length;
  const startIndex = data.indexOf(token) + token.length;

  if (startIndex === token.length - 1) {
    return null;
  }

  let lastIndex = startIndex;
  let holder = '';
  while (data[lastIndex] !== '/') {
    if (lastIndex === length) {
      break;
    }
    holder += data[lastIndex];
    lastIndex++;
  }

  return holder;
}

function replace(data, source, i) {
  const holder = parseHolder(data, i);
  const targetToken = holder ? `/$${i}:${holder}/` : `$${i}`;

  while (data.indexOf(targetToken) !== -1) {
    data = data.replace(targetToken, source);
  }

  return data;
}

function getLastHolderNumber(data) {
  let i = 0;
  while (existsPlaceHolder(data, i + 1)) {
    i += 1;
  }
  return i;
}

async function askProperties(template, options) {
  const data = readTemplate(template);
  const lastHolderNumber = getLastHolderNumber(data);
  const properties = options.properties;

  let i = properties.length;
  while (i < lastHolderNumber) {
    const holder = parseHolder(data, i + 1) || `no.${i + 1} parameter`;
    const answer = await inquirer.prompt({
      type: 'input',
      name: 'property',
      message: `Please input for ${holder}`,
    });
    properties.push(answer.property);
    i++;
  }
  return properties;
}

async function promptForMissingOptions(options, config) {
  const template = await askTemplate(options);
  if (!template) {
    console.error(chalk.red('Error: templates directory is empty'));
    return;
  }
  const targetDirectory = await askTargetDirectory(template, options, config);
  const fileName = await askFileName(options);
  const properties = await askProperties(template, options);

  return {
    ...options,
    template,
    targetDirectory,
    fileName,
    properties,
  };
}

function convertPlaceHolderToProperty(options) {
  let data = readTemplate(options.template);

  if (existsPlaceHolder(data, 0)) {
    let fileName = options.fileName;
    const i = fileName.indexOf('.');
    fileName = i !== -1 ? fileName.substring(0, i) : fileName;
    data = replace(data, fileName, 0);
  }

  let i = options.properties.length;
  while (i > 0) {
    data = replace(data, options.properties[i - 1], i);
    i--;
  }
  return data;
}

function createFile(data, options, config) {
  const file = path.resolve(root(), options.targetDirectory, options.fileName);
  const suffixes = ['js', 'ts', 'jsx', 'tsx'];
  fs.writeFileSync(
    suffixes.some((t) => file.endsWith(`.${t}`))
      ? file
      : `${file}.${config.suffix || 'jsx'}`,
    data
  );
}

export async function cli(args) {
  const config = await parseConfig();

  if (args[2] === 'init') {
    return;
  }

  let options = await parseArgumentsIntoOptions(args, config);
  options = await promptForMissingOptions(options, config);
  const data = convertPlaceHolderToProperty(options);
  createFile(data, options, config);
}
