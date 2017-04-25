const fs = require('fs-extra');
const path = require('path');
const walkdir = require('walkdir');
const nunjucks = require('nunjucks');
const YAML = require('yamljs');
const waterfall = require('async/waterfall');
const parallel = require('async/parallel');

// CREATE AND INIT STACK

nunjucks.configure(path.join(__dirname, '../src/views'));

const tasks = [
  readDataFiles,
  compileTemplates,
  createDistFiles
];

waterfall(tasks, finishTasks);


// DEFINE FUNCTIONS

function readDataFiles (next) {
  const dataPath = path.join(__dirname, '../src/data');
  const filePaths = walkdir.sync(dataPath);
  const dataFiles = filePaths
    .filter(fpath => fpath.includes('.yml'))
    .map(fpath => YAML.load(fpath));

  next(null, dataFiles);
}

function compileTemplates (files, next) {

  const htmlFiles = files.map(file => {
    const html = nunjucks.render(file._settings.template, file);

    return Object.assign({}, file, { html });
  });

  next(null, htmlFiles);
}

function createDistFiles (files, next) {
  const fileTasks = files.map(file => {
    return (done) => {
      const filePath = path.join(__dirname, `../dist${file._settings.slug}/index.html`);

      fs.outputFile(filePath, file.html, done);
    };
  });

  parallel(fileTasks, next)
}

function finishTasks (err) {
  if (err) {
    throw err;
  }

  console.log('Ready!');
}
