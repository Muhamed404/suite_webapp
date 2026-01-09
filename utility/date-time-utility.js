const { logger } = require("../logger/logger");
const moment = require("moment-timezone");

// Detect system timezone
const localTimezone = moment.tz.guess();

function getDaysDifference(start_datetime, end_datetime) {
  const startOfDay = moment.tz(start_datetime, localTimezone).startOf('day');
  const endOfDay = moment.tz(end_datetime, localTimezone).startOf('day');

  const dayDiff = endOfDay.diff(startOfDay, 'days');
  if (dayDiff > 1) {
    logger.info('Total Days:' + dayDiff)
    return dayDiff;
  }

  return 0;
}

function getHoursDifference(start_datetime, end_datetime) {
  // If less than 1 day difference, calculate in hours using full datetime
  const start = moment.tz(start_datetime, localTimezone);
  const end = moment.tz(end_datetime, localTimezone);
  const hourDiff = Math.abs(end.diff(start, 'hours'));
  logger.info('Total hours:' + hourDiff)
  return hourDiff;
}
// Detect system timezone once (no need to recalculate each time)
function getMomentCurrent() {
  return moment().tz(localTimezone);
}

function getCurrentDateTime() {
  return new Date();
}

function getCurrentDateTimeISO() {
  return getMomentCurrent().format('YYYY-MM-DDTHH:mm:ss[Z]');
}

function getCurrentDate() {
  const today = new Date();
  // Return only YYYY-MM-DD format
  return today.toISOString().split('T')[0];
}

function getCurrentTime() {
  return getMomentCurrent().format('HH:mm:ss');
}

function getUnixTimestamp() {
  return getMomentCurrent().unix();
}

function getUnixMilli() {
  return getMomentCurrent().valueOf();
}

function formatToISOStringZ(inputDateTime) {
  return moment(inputDateTime).format('YYYY-MM-DDTHH:mm:ss') + 'Z';
}

const formatDate = (date) => {
  return moment(date).format('YYYY-MM-DD');
};

const convertIntoDateTime = (date) => {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

const formatDateTimeToYYYYMMDD = (input) => {
  return moment(input).format('YYYY-MM-DD');
};

function getHoursDifference(start_datetime, end_datetime) {
  // If less than 1 day difference, calculate in hours using full datetime
  const start = moment.tz(start_datetime, localTimezone);
  const end = moment.tz(end_datetime, localTimezone);
  const hourDiff = Math.abs(end.diff(start, 'hours'));
  logger.info('Total hours:' + hourDiff)
  return hourDiff;
}

function getDaysDifference(start_datetime, end_datetime) {
  const startOfDay = moment.tz(start_datetime, localTimezone).startOf('day');
  const endOfDay = moment.tz(end_datetime, localTimezone).startOf('day');

  const dayDiff = endOfDay.diff(startOfDay, 'days');
  if (dayDiff > 1) {
    logger.info('Total Days:' + dayDiff)
    return dayDiff;
  }

  return 0;
}

function addDates(dateStr, numberOfDatesToAdd) {
  // Parse input date using moment.js
  logger.info('Start Date' + dateStr + ', numberOfDatesToAdd:' + numberOfDatesToAdd)
  const inputDate = moment(dateStr, "YYYY-MM-DD");

  // Add 10 days to the input date
  const increasedDate = inputDate.add(numberOfDatesToAdd, "days");

  // Format the increased date as 'DD/MM/YYYY' and return
  return increasedDate.format("YYYY-MM-DD");
}

function formatDateTimeDDMmmYYYYHHmmAMPM(dateTime) {
  if (!dateTime) return 'N/A';
  
  const date = moment(dateTime);
  
  if (!date.isValid()) {
    logger.warn('Invalid datetime provided to formatDateTimeDDMmmYYYYHHmmAMPM:', dateTime);
    return 'N/A';
  }
  
  return date.format('DD-MMM-YYYY hh:mm A');
}


module.exports = {
  getDaysDifference,
  getCurrentDateTime,
  getCurrentDateTimeISO,
  getCurrentDate,
  getCurrentTime,
  getUnixTimestamp,
  getUnixMilli,
  formatToISOStringZ,
  formatDate,
  getHoursDifference,
  getDaysDifference,
  getHoursDifference,
  addDates,
  formatDateTimeToYYYYMMDD,
  convertIntoDateTime,
  formatDateTimeDDMmmYYYYHHmmAMPM
};
