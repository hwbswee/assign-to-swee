/**
 * Date utility for future-proof date calculations
 * Automatically determines current month and calculates dynamic date ranges
 */

/**
 * Get the current date information
 * @returns {Object} Current year, month (1-12), and month index (0-11)
 */
export function getCurrentDate() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // 1-12
    monthIndex: now.getMonth(), // 0-11
  };
}

/**
 * Get the current month index (0-based) relative to January of current year
 * @returns {number} 0 for January, 1 for February, etc.
 */
export function getCurrentMonthIndex() {
  return new Date().getMonth();
}

/**
 * Get the current year
 * @returns {number} Current year (e.g., 2025)
 */
export function getCurrentYear() {
  return new Date().getFullYear();
}

/**
 * Calculate the indices for the last N months (inclusive of current month)
 * @param {number} months - Number of months to include
 * @returns {Object} Start and end indices for slicing monthly data array
 */
export function getLastNMonthsIndices(months = 6) {
  const currentIndex = getCurrentMonthIndex();
  const startIndex = Math.max(0, currentIndex - months + 1);
  const endIndex = currentIndex + 1; // +1 because slice is exclusive

  return {
    startIndex,
    endIndex,
    length: endIndex - startIndex,
  };
}

/**
 * Get indices for recent N months and previous N months for growth comparison
 * @param {number} monthsPerPeriod - Number of months in each period (default 3)
 * @returns {Object} Indices for recent and previous periods
 */
export function getGrowthComparisonIndices(monthsPerPeriod = 3) {
  const currentIndex = getCurrentMonthIndex();

  // Recent period: last N months including current
  const recentEndIndex = currentIndex + 1;
  const recentStartIndex = Math.max(0, currentIndex - monthsPerPeriod + 1);

  // Previous period: N months before the recent period
  const previousEndIndex = recentStartIndex;
  const previousStartIndex = Math.max(0, previousEndIndex - monthsPerPeriod);

  return {
    recent: {
      startIndex: recentStartIndex,
      endIndex: recentEndIndex,
    },
    previous: {
      startIndex: previousStartIndex,
      endIndex: previousEndIndex,
    },
  };
}

/**
 * Get month labels from January to current month
 * @returns {Array<string>} Array of month labels
 */
export function getMonthLabelsUpToCurrent() {
  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentIndex = getCurrentMonthIndex();
  return allMonths.slice(0, currentIndex + 1);
}

/**
 * Get the current month name
 * @returns {string} Full month name (e.g., "October")
 */
export function getCurrentMonthName() {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  return monthNames[getCurrentMonthIndex()];
}

/**
 * Get a date range string (e.g., "May-Oct 2025")
 * @param {number} startMonthIndex - 0-based start month
 * @param {number} endMonthIndex - 0-based end month
 * @param {number} year - Year
 * @returns {string} Formatted date range
 */
export function getDateRangeString(startMonthIndex, endMonthIndex, year) {
  const monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = monthAbbreviations[startMonthIndex];
  const endMonth = monthAbbreviations[endMonthIndex];
  return `${startMonth}-${endMonth} ${year}`;
}

/**
 * Get display string for 6-month average period
 * @returns {string} Formatted string (e.g., "May-Oct 2025 average")
 */
export function get6MonthAverageLabel() {
  const { startIndex, endIndex } = getLastNMonthsIndices(6);
  const year = getCurrentYear();
  return `${getDateRangeString(startIndex, endIndex - 1, year)} average`;
}

/**
 * Get CSV column names for current year up to current month
 * @returns {Array<string>} Array of column names (e.g., ["2025_1", "2025_2", ...])
 */
export function getCSVColumnNames() {
  const year = getCurrentYear();
  const currentMonth = getCurrentMonthIndex() + 1; // 1-based month
  const columns = [];

  for (let month = 1; month <= currentMonth; month++) {
    columns.push(`${year}_${month}`);
  }

  return columns;
}

/**
 * Get the most recent month's CSV column name
 * @returns {string} Column name (e.g., "2025_10")
 */
export function getCurrentMonthColumn() {
  const year = getCurrentYear();
  const month = getCurrentMonthIndex() + 1; // 1-based
  return `${year}_${month}`;
}

/**
 * Get the previous month's CSV column name
 * @returns {string} Column name (e.g., "2025_9")
 */
export function getPreviousMonthColumn() {
  const year = getCurrentYear();
  const currentMonth = getCurrentMonthIndex() + 1; // 1-based
  const previousMonth = currentMonth - 1;

  if (previousMonth < 1) {
    // If current month is January, previous is December of last year
    return `${year - 1}_12`;
  }

  return `${year}_${previousMonth}`;
}
