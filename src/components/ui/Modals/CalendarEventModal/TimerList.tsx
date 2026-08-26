import { useState, useRef, useEffect } from 'react';
import SimpleBar from 'simplebar-react';

const restrictAndFormatInput = (raw: string): string => {
  let cleaned = raw
    .replace(/[^0-9:\sAPMapm]/gi, '')
    .replace(/:+/g, ':')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (/^\d{1,2}$/.test(cleaned) && cleaned.length === 2 && !cleaned.includes(':')) {
    cleaned += ':';
  }

  if (/^\d{3,4}$/.test(cleaned) && !cleaned.includes(':')) {
    const padded = cleaned.padStart(4, '0');
    cleaned = `${padded.slice(0, 2)}:${padded.slice(2)}`;
  }

  return cleaned.slice(0, 8);
};

interface CustomTimeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  minSequence?: number;
}

function CustomTimeSelector({
  value,
  onChange,
  options,
  placeholder = 'Select time ',
  className = '',
  minSequence
}: CustomTimeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value || ''); // ✅ value is already in 12-hour format
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        snapAndCommit();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, value]);

  const filteredOptions = options
    .map((time, index) => ({
      time,
      sequence: index + 1,
    }))
    .filter(item => minSequence === undefined ? true : item.sequence > minSequence);

  const parseToMinutes = (str: string): number | null => {
    if (!str) return null;

    const upper = str.trim().toUpperCase();

    // 12-hour format
    if (upper.includes("AM") || upper.includes("PM")) {
      const match = upper.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
      if (!match) return null;

      let [_, hStr, mStr, period] = match;
      let h = Number(hStr);
      const m = Number(mStr);

      if (h === 12) h = 0;
      if (period === "PM") h += 12;

      if (h > 23 || m > 59) return null;

      return h * 60 + m;
    }

    // 24-hour format
    const match24 = upper.match(/^(\d{1,2}):(\d{2})$/);
    if (!match24) return null;

    const hh = Number(match24[1]);
    const mm = Number(match24[2]);

    if (hh > 23 || mm > 59) return null;

    return hh * 60 + mm;
  };

  const roundToNearest15 = (minutes: number): number => {
    return Math.round(minutes / 15) * 15;
  };

  const findNearestOption = (targetMinutes: number): string | null => {
    let closest: string | null = null;
    let minDiff = Infinity;
    for (const opt of options) {
      const m = parseToMinutes(opt);
      if (m === null) continue;
      const diff = Math.abs(m - targetMinutes);
      if (diff < minDiff) {
        minDiff = diff;
        closest = opt;
      }
    }
    return closest;
  };

  const snapAndCommit = () => {
    let time24 = to24Hour(inputValue);

    if (!time24) {
      setInputValue(value || '');
      return;
    }

    const minutes = parseToMinutes(time24);
    if (minutes === null) {
      setInputValue(value || '');
      return;
    }

    const rounded = roundToNearest15(minutes);
    let nearest = findNearestOption(rounded);

    if (!nearest) {
      // Convert back to 12-hour format for display
      const hour24 = Math.floor(rounded / 60);
      const minute = rounded % 60;
      const hour12 = hour24 % 12 || 12;
      const ampm = hour24 < 12 ? 'AM' : 'PM';
      nearest = `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
    }

    onChange(nearest);
    setInputValue(nearest);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = restrictAndFormatInput(e.target.value);
    setInputValue(formatted);
  };

  const handleBlur = () => {
    snapAndCommit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      snapAndCommit();
      setIsOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue(value || '');
      inputRef.current?.blur();
    }
  };

  const handleSelect = (time12: string) => {
    onChange(time12);
    setInputValue(time12);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const to24Hour = (input: string): string | null => {
    const trimmed = input.trim().toUpperCase();

    if (trimmed.includes('AM') || trimmed.includes('PM')) {
      const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
      if (!match) return null;

      let [_, hStr, mStr = '00', period] = match;
      let h = Number(hStr);
      const m = Number(mStr);

      if (h === 12) h = 0;
      if (period === 'PM') h += 12;

      if (h > 23 || m > 59) return null;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    let cleaned = trimmed.replace(/[^0-9]/g, '');

    if (cleaned.length === 0) return null;

    let hh: number, mm: number;

    if (cleaned.length <= 2) {

      hh = Number(cleaned);
      mm = 0;
    } else if (cleaned.length === 3) {

      hh = Number(cleaned.slice(0, 1));
      mm = Number(cleaned.slice(1));
    } else if (cleaned.length >= 4) {

      hh = Number(cleaned.slice(-4, -2));
      mm = Number(cleaned.slice(-2));
    } else {
      return null;
    }

    if (hh === 24 && mm === 0) {
      return '00:00';
    }

    if (hh > 23 || mm > 59) return null;

    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="position-relative">
      <input
        ref={inputRef}
        type="text"
        className={`form-control ${className}`.trim()}
        max={4}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        maxLength={8}
      />

      {isOpen && (
        <div
          className="position-absolute w-100 mt-1 time-dropdown-custom-react"
          style={{ zIndex: 1050, maxHeight: '236px', overflow: 'hidden' }}
        >
          <SimpleBar style={{ maxHeight: 220 }}>
            {/* <ul className="list-unstyled m-0 p-0">
              {options.map((time24) => (
                <li
                  key={time24}
                  className={`time-option ${time24 === value ? 'active' : ''}`}
                  data-sequence={options.indexOf}
                  style={{
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    backgroundColor: time24 === value ? '#f0f0f0' : undefined,
                  }}
                  onClick={() => handleSelect(time24)}
                >
                  {to12Hour(time24)}
                </li>
              ))}
            </ul> */}
            <ul className="list-unstyled m-0 p-0">
              {filteredOptions.map(({ time, sequence }) => (
                <li
                  key={time}
                  data-sequence={sequence}
                  className={`time-option ${time === value ? 'active' : ''}`}
                  style={{
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    backgroundColor: time === value ? '#f0f0f0' : undefined,
                  }}
                  onClick={() => handleSelect(time)}
                >
                  {time}
                </li>
              ))}
            </ul>
          </SimpleBar>
        </div>
      )}
    </div>
  );
}

export default CustomTimeSelector;
