import { format } from "date-fns";

export function formatDisplayDate(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy");
}
