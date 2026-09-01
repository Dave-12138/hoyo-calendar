import { DayData } from "./data";

export function dateOrMonthToShow({ date, month, str }: DayData) {
    if (date == 1) {
        return month == 1 ? str.replace(/(?<=^\d{4}).*/, "年") : `${month}月`;
    }
    return date;
}