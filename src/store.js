const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');

// Initialize DB file if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
}

function loadData() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading DB:", error);
    return { users: {} };
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving DB:", error);
  }
}

/**
 * Save user config
 * @param {string} userId 
 * @param {string} time - Format "HH:mm"
 * @param {string[]} days - Array of day numbers (0-6, 0 is Sunday) or names
 * @param {boolean} skipHolidays - Whether to skip barking on public holidays
 */
function setUserConfig(userId, time, days, skipHolidays = false) {
  const data = loadData();
  data.users[userId] = { time, days, skipHolidays };
  saveData(data);
}

function getUserConfig(userId) {
  const data = loadData();
  return data.users[userId];
}

function getAllConfigs() {
  const data = loadData();
  return data.users;
}

module.exports = {
  setUserConfig,
  getUserConfig,
  getAllConfigs
};
