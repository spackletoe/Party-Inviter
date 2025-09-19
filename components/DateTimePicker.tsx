import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { CalendarIcon } from './icons';

interface CustomInputProps {
  value?: string;
  onClick?: () => void;
  placeholder: string;
  disabled?: boolean;
}

// Using forwardRef is good practice for custom inputs with libraries like this
const CustomInput = forwardRef<HTMLButtonElement, CustomInputProps>(({ value, onClick, placeholder, disabled }, ref) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref}
    disabled={disabled}
    className="w-full flex items-center text-left px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition disabled:bg-slate-100 disabled:cursor-not-allowed"
  >
    <CalendarIcon className="h-5 w-5 text-slate-400 mr-3 flex-shrink-0" />
    <span className={`truncate ${value ? 'text-slate-800' : 'text-slate-400'}`}>
      {value || placeholder}
    </span>
  </button>));


interface DateTimePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date | null;
  placeholderText: string;
  isOptional?: boolean;
  disabled?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ selectedDate, onChange, minDate, placeholderText, isOptional = false, disabled = false }) => {
  return (
    <DatePicker
      selected={selectedDate}
      onChange={onChange}
      minDate={minDate}
      showTimeSelect
      dateFormat="MMMM d, yyyy 'at' h:mm aa"
      placeholderText={placeholderText}
      required={!isOptional}
      autoComplete="off"
      disabled={disabled}
      customInput={<CustomInput placeholder={placeholderText} disabled={disabled} />}
      popperPlacement="bottom-start"
      isClearable={isOptional}
    />
  );
};

export default DateTimePicker;
