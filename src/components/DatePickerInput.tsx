import * as React from "react";
import { parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { InputGroupButton } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerInputProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  allowFutureDate?: boolean;
  placeholder?: string;
}

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }

  return !isNaN(date.getTime());
}

export function DatePickerInput({
  value: controlledValue,
  onChange,
  allowFutureDate = true,
  placeholder = "dd/mm/yyyy",
}: Readonly<DatePickerInputProps>) {
  const [open, setOpen] = React.useState(false);

  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    controlledValue,
  );

  const date = controlledValue ?? internalDate;

  const [month, setMonth] = React.useState<Date | undefined>(date);

  const [inputValue, setInputValue] = React.useState(formatDate(date));

  React.useEffect(() => {
    setInputValue(formatDate(date));
  }, [date]);

  const handleSelectDate = (selectedDate: Date | undefined) => {
    if (!allowFutureDate && selectedDate) {
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        return;
      }
    }

    setInternalDate(selectedDate);
    setMonth(selectedDate);
    onChange?.(selectedDate);
  };

  return (
    <Input
      value={inputValue}
      placeholder={placeholder}
      iconRight={
        <Popover
          open={open}
          onOpenChange={setOpen}
        >
          <PopoverTrigger asChild>
            <InputGroupButton
              variant="ghost"
              size="icon-xs"
              aria-label="Select date"
            >
              <CalendarIcon />
              <span className="sr-only">Chọn ngày</span>
            </InputGroupButton>
          </PopoverTrigger>

          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              defaultMonth={month}
              captionLayout="dropdown"
              disabled={
                allowFutureDate
                  ? undefined
                  : (date) => {
                      const today = new Date();

                      today.setHours(0, 0, 0, 0);

                      return date > today;
                    }
              }
              onSelect={(selectedDate) => {
                handleSelectDate(selectedDate);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      }
      onChange={(e) => {
        const rawValue = e.target.value;

        setInputValue(rawValue);

        const formatString = "dd/MM/yyyy";
        const parsedDate = parse(rawValue, formatString, new Date());

        if (isValidDate(parsedDate) && rawValue.length === 10) {
          handleSelectDate(parsedDate);
          setMonth(parsedDate);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
        }
      }}
    />
  );
}
