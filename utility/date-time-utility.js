const { logger } = require("../logger/logger");
const moment = require("moment-timezone");

// Use server's local timezone for all date/time operations
const SERVER_TZ = moment.tz.guess();

// function getMomentCurrent() {
//   return moment.tz(SERVER_TZ);
// }

function getCurrentDateTime() {
  return moment.tz(SERVER_TZ).toDate();
}

function getCurrentDateTimeISO() {
  return moment.tz(SERVER_TZ).toISOString();
}

function getCurrentDate() {
  return moment.tz(SERVER_TZ).format("YYYY-MM-DD");
}

function getCurrentTime() {
  return moment.tz(SERVER_TZ).format("HH:mm:ss");
}

function getUnixTimestamp() {
  return moment.tz(SERVER_TZ).unix();
}

function getUnixMilli() {
  return moment.tz(SERVER_TZ).valueOf();
}

function formatToISOStringZ(inputDateTime) {
  return moment.tz(inputDateTime, SERVER_TZ).toISOString();
}

function formatDate(date) {
  return moment.tz(date, SERVER_TZ).format("YYYY-MM-DD");
}

function convertIntoDateTime(date) {
  return moment.tz(date, SERVER_TZ).format("YYYY-MM-DD HH:mm:ss");
}

function formatDateTimeToYYYYMMDD(input) {
  return moment.tz(input, SERVER_TZ).format("YYYY-MM-DD");
}

/**
 * Calculate hours difference
 */
function getHoursDifference(start_datetime, end_datetime) {
  const start = moment.tz(start_datetime, SERVER_TZ);
  const end = moment.tz(end_datetime, SERVER_TZ);

  const hourDiff = Math.abs(end.diff(start, "hours"));

  logger.info("Total hours: " + hourDiff);

  return hourDiff;
}

/**
 * Calculate days difference
 */
function getDaysDifference(start_datetime, end_datetime) {
  const startOfDay = moment.tz(start_datetime, SERVER_TZ).startOf("day");
  const endOfDay = moment.tz(end_datetime, SERVER_TZ).startOf("day");

  const dayDiff = endOfDay.diff(startOfDay, "days");

  if (dayDiff > 1) {
    logger.info("Total Days: " + dayDiff);
    return dayDiff;
  }

  return 0;
}

/**
 * Add days to a date
 */
function addDates(dateStr, numberOfDatesToAdd) {

  logger.info("Start Date " + dateStr + ", numberOfDatesToAdd: " + numberOfDatesToAdd);

  const inputDate = moment.tz(dateStr, "YYYY-MM-DD", SERVER_TZ);

  const increasedDate = inputDate.add(numberOfDatesToAdd, "days");

  return increasedDate.format("YYYY-MM-DD");
}

/**
 * Format datetime for UI
 */
function formatDateTimeDDMmmYYYYHHmmAMPM(dateTime) {

  if (!dateTime) return "N/A";

  const date = moment.tz(dateTime, SERVER_TZ);

  if (!date.isValid()) {
    logger.warn("Invalid datetime provided:", dateTime);
    return "N/A";
  }

  return date.format("DD-MMM-YYYY hh:mm A");
}

// function convertServerToUserTime(date, userTimezone, format = "YYYY-MM-DD hh:mm A") {
//   return moment.tz(date, "YYYY-MM-DD HH:mm:ss", SERVER_TZ).tz(userTimezone).format(format);
// }

module.exports = {
  // convertServerToUserTime,
  // getMomentCurrent,
  getCurrentDateTime,
  getCurrentDateTimeISO,
  getCurrentDate,
  getCurrentTime,
  getUnixTimestamp,
  getUnixMilli,
  formatToISOStringZ,
  formatDate,
  convertIntoDateTime,
  formatDateTimeToYYYYMMDD,
  getHoursDifference,
  getDaysDifference,
  addDates,
  formatDateTimeDDMmmYYYYHHmmAMPM,
};
