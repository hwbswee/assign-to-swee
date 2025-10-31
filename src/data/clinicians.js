// Clinician data extracted from clinician_summary.csv
// Using the most recent months (2025_9, 2025_10) and active cases

export const cliniciansData = [
  {
    name: 'Andrew Lim',
    level: 'junior',
    recentHours: 23.5,
    previousHours: 58.5,
    activeCases: 23,
    monthlyHours2025: [0, 0, 8.5, 31.0, 41.0, 39.0, 38.75, 44.5, 58.5, 23.5]
  },
  {
    name: 'Claudia Stefanie',
    level: 'senior',
    recentHours: 6.0,
    previousHours: 13.0,
    activeCases: 6,
    monthlyHours2025: [0, 0, 0, 0, 0, 0, 6.0, 19.0, 13.0, 6.0]
  },
  {
    name: 'Dominic Yeo',
    level: 'senior',
    recentHours: 3.5,
    previousHours: 12.5,
    activeCases: 9,
    monthlyHours2025: [14.42, 9.17, 13.67, 10.42, 8.25, 11.5, 8.75, 6.0, 12.5, 3.5]
  },
  {
    name: 'Haikel',
    level: 'lead',
    recentHours: 2.5,
    previousHours: 0.0,
    activeCases: 2,
    monthlyHours2025: [0, 0, 0.25, 0, 0, 0, 0, 1.0, 0, 2.5]
  },
  {
    name: 'Kirsty Png',
    level: 'senior',
    recentHours: 19.5,
    previousHours: 35.0,
    activeCases: 17,
    monthlyHours2025: [31.5, 37.5, 27.83, 35.0, 33.0, 25.5, 25.5, 18.5, 35.0, 19.5]
  },
  {
    name: 'Janice',
    level: 'junior',
    fullName: 'Janice Leong',
    recentHours: 24.5,
    previousHours: 54.0,
    activeCases: 28,
    monthlyHours2025: [28.0, 34.0, 42.5, 57.5, 37.0, 30.0, 37.0, 9.0, 54.0, 24.5]
  },
  {
    name: 'Xiao Hui',
    level: 'junior',
    fullName: 'Ng Xiao Hui',
    recentHours: 24.0,
    previousHours: 35.5,
    activeCases: 22,
    monthlyHours2025: [0, 0, 0, 0, 0, 5.0, 15.0, 26.5, 35.5, 24.0]
  },
  {
    name: 'Oliver Tan',
    level: 'junior',
    recentHours: 29.0,
    previousHours: 42.0,
    activeCases: 25,
    monthlyHours2025: [43.0, 41.0, 41.5, 40.0, 45.5, 33.5, 41.5, 42.0, 42.0, 29.0]
  },
  {
    name: 'Seanna Neo',
    level: 'junior',
    recentHours: 20.5,
    previousHours: 29.5,
    activeCases: 21,
    monthlyHours2025: [0, 0, 0, 0, 0, 5.0, 26.5, 35.0, 29.5, 20.5]
  },
  {
    name: 'Jiaying',
    level: 'senior',
    fullName: 'Soon Jiaying',
    recentHours: 19.0,
    previousHours: 24.5,
    activeCases: 21,
    monthlyHours2025: [33.0, 29.0, 31.25, 42.0, 43.0, 18.0, 14.0, 16.0, 24.5, 19.0]
  },
  {
    name: 'Joanna',
    level: 'lead',
    fullName: 'Joanna Tan',
    recentHours: 3.0,
    previousHours: 0.0,
    activeCases: 2,
    monthlyHours2025: [0, 0, 0, 0, 0, 0, 0, 0, 0, 3.0]
  }
];

export const levelLabels = {
  junior: 'Junior',
  senior: 'Senior',
  lead: 'Lead'
};

// Month labels for 2025 (Jan-Oct)
export const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
