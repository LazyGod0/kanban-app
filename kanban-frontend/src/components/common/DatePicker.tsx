import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { DateTimePicker } from "@mui/x-date-pickers";
interface DatePickerComponentProps {
  onChange: (date: Dayjs | null) => void;
  value: Dayjs | null;
  label?: string;
}

export default function DatePickerComponent({
  onChange,
  value,
  label,
}: DatePickerComponentProps) {
  return (
    <DateTimePicker
      slotProps={{
        popper: {
          placement: "bottom",
        },
      }}
      label={label}
      onChange={onChange}
      defaultValue={dayjs()}
      value={value}
    />
  );
}
