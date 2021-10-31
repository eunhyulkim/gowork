import fs from 'fs';
const exists = fs.existsSync;

export function searchDirectory(file, path = process.cwd()) {
  if (path === '') {
    return path;
  }

  const exist = exists(`${path}/${file}`);
  if (!exist) {
    return searchDirectory(file, path.substring(0, path.lastIndexOf('/')));
  } else {
    return path;
  }
}
