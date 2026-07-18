import { format } from "date-fns";

/**
 * @description
 * @returns
 */
export const dateToDateOnlyString = (date: Date) => {
  return format(date, "yyyy-MM-dd");
};

/**
 *
 * @returns er
 */
export const dateToISOLikeLocal = (date: Date) => {
  let offsetMins = date.getTimezoneOffset();

  const d = new Date(date.getTime() - offsetMins * 6e4);

  const offsetSign = offsetMins > 0 ? "-" : "+";

  offsetMins = Math.abs(offsetMins);

  const offsetHr = String((offsetMins / 60) | 0).padStart(2, "0");

  const offsetMin = String(offsetMins % 60).padStart(2, "0");
  return d.toISOString().replace("Z", `${offsetSign}${offsetHr}:${offsetMin}`);
};
