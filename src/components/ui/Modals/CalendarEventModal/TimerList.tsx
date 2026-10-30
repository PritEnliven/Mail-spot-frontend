import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import SimpleBar from 'simplebar-react';

const DROPDOWN_MAX_HEIGHT = 220;
const DROPDOWN_GAP = 4;

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

interface DropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
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
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const skipBlurSnapRef = useRef(false);
  const inputValueRef = useRef(value || '');

  useEffect(() => {
    setInputValue(value || ''); // ✅ value is already in 12-hour format
    inputValueRef.current = value || '';
  }, [value]);

  const updateDropdownPosition = () => {
    const input = inputRef.current;
    if (!input) return;

    const rect = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < DROPDOWN_MAX_HEIGHT + DROPDOWN_GAP;

    setDropdownPosition(
      openUp
        ? {
            bottom: window.innerHeight - rect.top + DROPDOWN_GAP,
            left: rect.left,
            width: rect.width,
          }
        : {
            top: rect.bottom + DROPDOWN_GAP,
            left: rect.left,
            width: rect.width,
          },
    );
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setDropdownPosition(null);
      return;
    }

    updateDropdownPosition();

    const handleReposition = () => updateDropdownPosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInput = Boolean(containerRef.current?.contains(target));
      const clickedDropdown = Boolean(dropdownRef.current?.contains(target));
      if (clickedInput || clickedDropdown) return;
      setIsOpen(false);
      snapAndCommit();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, inputValue, value]);

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

  const snapAndCommit = (rawValue = inputValueRef.current) => {
    let time24 = to24Hour(rawValue);

    if (!time24) {
      setInputValue(value || '');
      inputValueRef.current = value || '';
      return;
    }

    const minutes = parseToMinutes(time24);
    if (minutes === null) {
      setInputValue(value || '');
      inputValueRef.current = value || '';
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
    inputValueRef.current = nearest;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = restrictAndFormatInput(e.target.value);
    setInputValue(formatted);
    inputValueRef.current = formatted;
  };

  const handleBlur = () => {
    if (skipBlurSnapRef.current) {
      skipBlurSnapRef.current = false;
      return;
    }
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
    skipBlurSnapRef.current = true;
    onChange(time12);
    setInputValue(time12);
    inputValueRef.current = time12;
    setIsOpen(false);
    // Blur after commit so onBlur does not snap back to the previous value.
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

  const dropdown = isOpen && dropdownPosition && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={dropdownRef}
          className="time-dropdown-custom-react"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            bottom: dropdownPosition.bottom,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 10060,
            maxHeight: DROPDOWN_MAX_HEIGHT,
            overflow: 'hidden',
          }}
          onMouseDown={(event) => {
            // Keep focus on the input so blur/snap does not fight option clicks.
            event.preventDefault();
          }}
        >
          <SimpleBar style={{ maxHeight: DROPDOWN_MAX_HEIGHT - 14 }}>
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
        </div>,
        document.body,
      )
    : null;

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
      {dropdown}
    </div>
  );
}

export default CustomTimeSelector;
