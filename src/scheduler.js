const schedule = require('node-schedule');
const Holidays = require('date-holidays');
const { getAllConfigs } = require('./store');
const { generateBark } = require('./barkGenerator');

const hd = new Holidays('KR'); // Initialize for South Korea

// Keep track of scheduled jobs: { userId: job }
const jobs = {};

function scheduleJobForUser(app, userId, config) {
  // Cancel existing job if any
  if (jobs[userId]) {
    jobs[userId].cancel();
  }

  const { time, days } = config; // time: "HH:mm", days: [1, 3, 5] (0=Sun, 1=Mon...)
  const [hour, minute] = time.split(':').map(Number);

  // Create a recurrence rule
  const rule = new schedule.RecurrenceRule();
  rule.hour = hour;
  rule.minute = minute;
  rule.dayOfWeek = days; // Array of numbers 0-6
  rule.tz = 'Asia/Seoul'; // Explicitly set timezone if needed, or rely on system time

  const job = schedule.scheduleJob(rule, async function () {
    try {
      // Check for holidays if skipHolidays is enabled
      if (config.skipHolidays) {
        const now = new Date();
        if (hd.isHoliday(now)) {
          console.log(`Skipping bark for ${userId} because today is a holiday.`);
          return;
        }
      }

      const message = generateBark();
      await app.client.chat.postMessage({
        channel: userId, // Send DM to user
        text: message
      });
      console.log(`Sent bark to ${userId} at ${new Date().toString()}`);
    } catch (error) {
      console.error(`Failed to send message to ${userId}:`, error);
    }
  });

  jobs[userId] = job;
  console.log(`Scheduled bark for user ${userId} at ${time} on days ${days}`);
}

function initScheduler(app) {
  const allConfigs = getAllConfigs();
  for (const [userId, config] of Object.entries(allConfigs)) {
    if (config && config.time && config.days) {
      scheduleJobForUser(app, userId, config);
    }
  }
}

function cancelJobForUser(userId) {
  if (jobs[userId]) {
    jobs[userId].cancel();
    delete jobs[userId];
    console.log(`Cancelled bark schedule for user ${userId}`);
    return true;
  }
  return false;
}

module.exports = {
  initScheduler,
  scheduleJobForUser,
  cancelJobForUser
};
