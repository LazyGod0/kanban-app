import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { DateTimePicker } from "@mui/x-date-pickers";
interface DatePickerComponentProps {
  onChange: (date: Dayjs | null) => void;
  value: Dayjs | null;
  label?: string;
  readOnly?: boolean;
}

export default function DatePickerComponent({
  onChange,
  value,
  label,
  readOnly = false,
}: DatePickerComponentProps) {
  return (
    <DateTimePicker
      slotProps={{
        popper: {
          placement: "bottom",
        },
      }}
      label={label}
      readOnly={readOnly}
      onChange={onChange}
      defaultValue={dayjs()}
      value={value}
    />
  );
}
