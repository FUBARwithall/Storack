
export interface MonthConfig {
    name: string;
    days: number;
}

export interface WeekDayConfig {
    name: string;
}

export interface CalendarConfig {
    id: string;
    name: string;
    description?: string;
    months: MonthConfig[];
    weekDays: WeekDayConfig[];
    yearSuffix: string; // e.g. "AE", "Before Comet"
    hasLeapYear: boolean;
    leapYearInterval?: number; // e.g. every 4 years
    leapYearMonthIndex?: number; // which month gets the extra day (0-based)
    hoursInDay?: number; // Default 24
    minutesInHour?: number; // Default 60
    recurringEvents?: RecurringEvent[];
    isGregorian?: boolean;
}

export interface RecurringEvent {
    id: string;
    name: string;
    type: 'holiday' | 'season';
    monthIndex: number;
    day: number;
    description?: string;
    color?: string; // Optional color override
}

export interface CustomDate {
    year: number;
    monthIndex: number; // 0-based
    day: number; // 1-based
}

// Default Gregorian-ish Calendar for reference
export const DEFAULT_CALENDAR: CalendarConfig = {
    id: 'default-gregorian',
    name: 'Standard Earth Calendar',
    months: [
        { name: 'January', days: 31 },
        { name: 'February', days: 28 }, // Leap year logic handles 29
        { name: 'March', days: 31 },
        { name: 'April', days: 30 },
        { name: 'May', days: 31 },
        { name: 'June', days: 30 },
        { name: 'July', days: 31 },
        { name: 'August', days: 31 },
        { name: 'September', days: 30 },
        { name: 'October', days: 31 },
        { name: 'November', days: 30 },
        { name: 'December', days: 31 },
    ],
    weekDays: [
        { name: 'Monday' },
        { name: 'Tuesday' },
        { name: 'Wednesday' },
        { name: 'Thursday' },
        { name: 'Friday' },
        { name: 'Saturday' },
        { name: 'Sunday' },
    ],
    yearSuffix: 'AD',
    hasLeapYear: true,
    leapYearInterval: 4,
    leapYearMonthIndex: 1, // February
    isGregorian: true,
};

export class CalendarEngine {
    private config: CalendarConfig;
    private totalDaysInYear: number;

    constructor(config: CalendarConfig) {
        this.config = config;
        this.totalDaysInYear = config.months.reduce((acc, month) => acc + month.days, 0);
    }

    private isGregorianCalendar(): boolean {
        return !!(this.config.isGregorian || this.config.id === 'default-gregorian' || this.config.name === 'Standard Earth Calendar');
    }

    // Check if a specific year is a leap year
    isLeapYear(year: number): boolean {
        if (this.isGregorianCalendar()) {
            return new Date(year, 1, 29).getMonth() === 1;
        }
        if (!this.config.hasLeapYear || !this.config.leapYearInterval) return false;
        // Simple leap year logic: divisible by interval. 
        // Complex logic (like "not 100 unless 400") is optional for custom calendars, sticking to simple for now.
        return year % this.config.leapYearInterval === 0;
    }

    // Get days in a specific month for a specific year
    getDaysInMonth(monthIndex: number, year: number): number {
        if (this.isGregorianCalendar()) {
            return new Date(year, monthIndex + 1, 0).getDate();
        }
        const month = this.config.months[monthIndex];
        if (!month) return 0;

        let days = month.days;
        if (this.isLeapYear(year) && monthIndex === this.config.leapYearMonthIndex) {
            days += 1;
        }
        return days;
    }

    getDaysInYear(year: number): number {
        if (this.isGregorianCalendar()) {
            return this.isLeapYear(year) ? 366 : 365;
        }
        return this.isLeapYear(year) ? this.totalDaysInYear + 1 : this.totalDaysInYear;
    }

    // Convert Date to Total Absolute Days (simplifies timeline math)
    // Epoch is Year 1, Month 0, Day 1 = Day 1.
    // Negative years/days supported roughly, but let's assume Year 1 start for now.
    dateToAbsoluteDays(date: CustomDate): number {
        if (this.isGregorianCalendar()) {
            const d = new Date(0);
            d.setUTCFullYear(date.year, date.monthIndex, date.day);
            d.setUTCHours(0, 0, 0, 0);
            return Math.floor(d.getTime() / 86400000);
        }

        let totalDays = 0;

        // Add days for full past years
        // Optimization: rough calc then refine? No, precise loop is safer for custom logic unless years are huge.
        // For huge years, we'd need constant checks. Let's do a loop for year 1 to current.
        // Optimization: (Year-1) * StandardDays + LeapDaysCount

        const pastYears = date.year - 1;
        totalDays += pastYears * this.totalDaysInYear;

        if (this.config.hasLeapYear && this.config.leapYearInterval) {
            const leapYearsPassed = Math.floor(pastYears / this.config.leapYearInterval);
            totalDays += leapYearsPassed;
        }

        // Add days for full past months in current year
        for (let i = 0; i < date.monthIndex; i++) {
            totalDays += this.getDaysInMonth(i, date.year);
        }

        // Add days in current month
        totalDays += (date.day - 1); // If it's the 1st, we add 0 extra days.

        return totalDays;
    }

    // Convert Absolute Days back to Date
    absoluteDaysToDate(totalDays: number): CustomDate {
        if (this.isGregorianCalendar()) {
            const d = new Date(totalDays * 86400000);
            return {
                year: d.getUTCFullYear(),
                monthIndex: d.getUTCMonth(),
                day: d.getUTCDate()
            };
        }

        let remainingDays = totalDays;
        let year = 1;

        // Determine Year
        // Approximate jump calculation could be faster, but loop is safer for correctness first.
        while (true) {
            const daysInThisYear = this.getDaysInYear(year);
            if (remainingDays < daysInThisYear) {
                break;
            }
            remainingDays -= daysInThisYear;
            year++;
        }

        // Determine Month
        let monthIndex = 0;
        while (true) {
            const daysInThisMonth = this.getDaysInMonth(monthIndex, year);
            if (remainingDays < daysInThisMonth) {
                break;
            }
            remainingDays -= daysInThisMonth;
            monthIndex++;
            if (monthIndex >= this.config.months.length) {
                // Should theoretically not happen if logic matches total days
                break;
            }
        }

        // Determine Day (remainingDays 0-indexed count becomes 1-indexed Day)
        const day = remainingDays + 1;

        return { year, monthIndex, day };
    }

    // Format string: "Summary" or custom
    formatDate(date: CustomDate): string {
        const monthName = this.config.months[date.monthIndex]?.name || 'Unknown Month';
        return `${date.day} ${monthName}, ${date.year} ${this.config.yearSuffix}`;
    }

    // Get Day of Week
    getDayOfWeek(date: CustomDate): string {
        if (this.config.weekDays.length === 0) return '';
        if (this.isGregorianCalendar()) {
            const d = new Date(0);
            d.setUTCFullYear(date.year, date.monthIndex, date.day);
            const dayIndex = (d.getUTCDay() + 6) % 7;
            return this.config.weekDays[dayIndex].name;
        }
        const absDays = this.dateToAbsoluteDays(date);
        const dayIndex = absDays % this.config.weekDays.length;
        return this.config.weekDays[dayIndex].name;
    }

    // Get starting empty cells count for calendar rendering
    getStartOfMonthPadding(date: CustomDate): number {
        if (this.isGregorianCalendar()) {
            const d = new Date(0);
            d.setUTCFullYear(date.year, date.monthIndex, 1);
            return (d.getUTCDay() + 6) % 7;
        }
        const firstDayDate = { year: date.year, monthIndex: date.monthIndex, day: 1 };
        const absDays = this.dateToAbsoluteDays(firstDayDate);
        return absDays % this.config.weekDays.length;
    }

    // Compare two dates: -1 if a < b, 0 if equal, 1 if a > b
    compareDates(a: CustomDate, b: CustomDate): number {
        const absA = this.dateToAbsoluteDays(a);
        const absB = this.dateToAbsoluteDays(b);
        return absA < absB ? -1 : absA > absB ? 1 : 0;
    }

    // Get duration in days between two dates
    getDuration(start: CustomDate, end: CustomDate): number {
        return this.dateToAbsoluteDays(end) - this.dateToAbsoluteDays(start);
    }
}
