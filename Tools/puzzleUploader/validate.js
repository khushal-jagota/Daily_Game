// validate.js

const fs   = require('fs');
const path = require('path');

// 1. Locate puzzles folder
const PUZZLE_DIR = path.join(__dirname, 'puzzles');
if (!fs.existsSync(PUZZLE_DIR)) {
  console.error(`❌ puzzles directory not found at ${PUZZLE_DIR}`);
  process.exit(1);
}

// 2. Utility to check a clue-entry object
function checkEntry(file, direction, key, obj) {
  const errs = [];
  if (typeof obj.row !== 'number')    errs.push(`"${direction}.${key}.row" must be a number`);
  if (typeof obj.col !== 'number')    errs.push(`"${direction}.${key}.col" must be a number`);
  if (typeof obj.clue !== 'string')   errs.push(`"${direction}.${key}.clue" must be a string`);
  if (typeof obj.answer !== 'string') errs.push(`"${direction}.${key}.answer" must be a string`);
  if (errs.length) {
    console.error(`❌ ${file}: ${errs.join('; ')}`);
    return false;
  }
  return true;
}

let hasErrors = false;

// 3. Iterate and validate
fs.readdirSync(PUZZLE_DIR)
  .filter(f => f.endsWith('.json'))
  .forEach(file => {
    const fullPath = path.join(PUZZLE_DIR, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (err) {
      console.error(`❌ ${file}: invalid JSON (${err.message})`);
      hasErrors = true;
      return;
    }

    // Top-level keys
    const requiredTop = ['themeTitle','themeDescription','puzzleData'];
    requiredTop.forEach(k => {
      if (!(k in data)) {
        console.error(`❌ ${file}: missing top-level key "${k}"`);
        hasErrors = true;
      }
    });

    // puzzleData structure
    if (data.puzzleData && typeof data.puzzleData === 'object') {
      ['across','down'].forEach(dir => {
        if (!(dir in data.puzzleData)) {
          console.error(`❌ ${file}: puzzleData missing "${dir}" map`);
          hasErrors = true;
          return;
        }
        const map = data.puzzleData[dir];
        if (typeof map !== 'object') {
          console.error(`❌ ${file}: puzzleData.${dir} is not an object`);
          hasErrors = true;
          return;
        }
        Object.entries(map).forEach(([key, obj]) => {
          if (typeof obj !== 'object') {
            console.error(`❌ ${file}: ${dir}.${key} is not an object`);
            hasErrors = true;
          } else if (!checkEntry(file, dir, key, obj)) {
            hasErrors = true;
          }
        });
      });
    }
  });

// 4. Finish
if (hasErrors) {
  console.error('\nValidation failed. Fix the above errors and rerun.');
  process.exit(1);
} else {
  console.log('✅ All puzzle JSONs passed validation.');
  process.exit(0);
}