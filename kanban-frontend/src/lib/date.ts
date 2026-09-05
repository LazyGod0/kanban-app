import dayjs from "dayjs";
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

export function formatLocalDate(value: string | null): string {
  if (!value) return "No due date";

  return dayjs.utc(value).local().format(('D MMM YY HH:mm:ss'))
}
