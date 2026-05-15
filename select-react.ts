import Select, { components } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import type { MultiValue, StylesConfig, GroupBase, ClearIndicatorProps } from 'react-select';
import dropdownIcon from "@images/chevron-down-icon-hover.svg"
import clearIcon from "@images/close-icon.svg"
import removeIcon from "@images/close-icon.svg"

const selectStyles: StylesConfig<MultiOption, true, GroupBase<MultiOption>> = {
  /** Outer wrapper */
  // container: (base) => ({
  //   ...base,
  //   width: '100%',

  // }),

  /** Main visible input box */
  control: (base, state) => ({
    ...base,
    width: '100%',
    minHeight: '30px',
    borderRadius: '5px',
    border: state.isFocused ? '1px solid #0097EF' : '1px solid #BBC0C4',
    boxShadow: state.isFocused
      ? '0 0 0 3px #E3F2FB'
      : '0px 1px 3px 0px #0000001F',
    backgroundColor: '#FFFF',
  }),

  /** Holds values + input */
  valueContainer: (base) => ({
    ...base,
    padding: '2px 4px',
    backgroundColor: '',
    color: '#212121',
    fontSize: '13px',
    fontWeight: '400',
    fontFamily: "`DM Sans`, sans-serif",
  }),

  /** Actual text input */
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    backgroundColor: '',
    color: '#212121',
    fontSize: '13px',
    fontWeight: '400',
    fontFamily: "`DM Sans`, sans-serif",
  }),

  /** Placeholder */
  placeholder: (base) => ({
    ...base,
    backgroundColor: '',
    color: '#212121',
    fontSize: '13px',
    fontWeight: '400',
    fontFamily: "`DM Sans`, sans-serif",
  }),

  /** Single value (mostly irrelevant for isMulti) */
  singleValue: (base) => ({
    ...base,
    color: '#212121',
    fontSize: '13px',
    fontWeight: '400',
    fontFamily: "`DM Sans`, sans-serif",
  }),

  /** Multi-value pill */
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#F0F7FB',
    color: '#212121',
    border: '1px solid #0073B6',
    borderRadius: '3px',
    alignItems: 'center',
    '& .profile-main': {
      display: 'flex',
      alignItems: 'center',
      padding: '0 5px  0 3px',
    },
    '& .profile': {
      minWidth: '16px',
      maxWidth: '16px',
      height: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '2px',
    },
  }),

  /** Text inside pill */
  multiValueLabel: (base) => ({
    ...base,
    fontSize: '12px',
    padding: '1px 0',
    paddingLeft: '0',
    color: '#212121',
    fontWeight: '500',
    fontFamily: "`DM Sans`, sans-serif",
    display: 'flex',
    alignItems: 'center',
  }),

  /** × button in pill */
  multiValueRemove: (base) => ({
    ...base,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: 'transparent',
      color: '#000000',
    },
    backgroundColor: 'transparent',
    minWidth: '16px',
    paddingLeft: '4px',
    paddingRight: '2px',
  }),

  /** Right-side icons container */
  indicatorsContainer: (base) => ({
    ...base,
    height: '28px',
    color: '',
  }),

  /** Dropdown arrow */
  dropdownIndicator: (base) => ({
    ...base,
    padding: '4px',
    ':hover': {
      color: '',
    },
    backgroundColor: 'transparent',
  }),

  /** Clear indicator */
  clearIndicator: (base) => ({
    ...base,
    padding: '0',
  }),

  /** Vertical separator */
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: '',
    color: '',
    border: '0.6px solid #D0D9DE',
  }),

  /** Dropdown menu */
  menu: (base) => ({
    ...base,
    borderRadius: '5px',
    marginTop: '5px',
    boxShadow: '0px 1px 6px 0px rgba(0, 0, 0, 0.12)',
    backgroundColor: '#ffff',
    border: '1px solid #BBC0C4',
  }),

  /** Scrollable menu list */
  menuList: (base) => ({
    ...base,
    padding: '7px 0',
    backgroundColor: '#ffff',
    borderRadius: '5px',
  }),

  /** Each option row */
  option: (base, state) => ({
    ...base,
    cursor: 'pointer',
    backgroundColor: state.isSelected
      ? '#e5e8ea'
      : 'transparent',
    color: '#212121',
    fontSize: '13px',
    fontWeight: '400',
    fontFamily: "'DM Sans', sans-serif",
    padding: '7px',
    ':hover': {
      backgroundColor: '#e5e8ea',
    },
    ':active': {
      backgroundColor: '#e5e8ea',
    },
    '& .profile-main': {
      display: 'flex',
      alignItems: 'center',
    },
    '& .profile': {
      minWidth: '30px',
      maxWidth: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '2px',
      outlineOffset: '-1px', 
    
    // Note: outlineOffset only works if an 'outline' is actually defined
    outline: state.isFocused ? '1px solid #7fff00' : 'none',
    },

  }),

  /** Menu portal (important for modals) */
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),

  /** No options text */
  noOptionsMessage: (base) => ({
    ...base,
    color: '#212121',
    fontSize: '13px',
  }),

  /** Loading message */
  loadingMessage: (base) => ({
    ...base,
  }),

  /** Option groups (if used later) */
  group: (base) => ({
    ...base,
  }),

  groupHeading: (base) => ({
    ...base,
  }),
};
export interface MultiOption {
  value: string;
  name: string;
  email: string;
}

export interface SingleOption {
  value: string;
  label: string;
}

type MultiSelectProps = {
  value: string[];
  onChange: (val: string[]) => void;
  options: MultiOption[];
  placeholder?: string;
  isMulti: true;
};

type SingleSelectProps = {
  value: string | null;
  onChange: (val: string | null) => void;
  options: SingleOption[];
  placeholder?: string;
  isMulti?: false;
};

type Select2WrapperProps = MultiSelectProps | SingleSelectProps;

// START:: Select2 box icon

const DropdownIndicator = (props: any) => (
  <components.DropdownIndicator {...props}>
    <img src={dropdownIcon} alt="" width={20} height={20} />
  </components.DropdownIndicator>
);

const ClearIndicator = (props: any) => (
  <components.ClearIndicator {...props}>
    <img src={clearIcon} alt="" width={20} height={20} />
  </components.ClearIndicator>
);

const ClearIndicatorSingle = (props: any) => (
  <components.ClearIndicator {...props}>
    <img src={clearIcon} alt="" width={20} height={20} />
  </components.ClearIndicator>
);

const MultiValueRemove = (props: any) => (
  <components.MultiValueRemove {...props}>
    <img src={removeIcon} alt="" width={16} height={16} />
  </components.MultiValueRemove>
);

const MenuList = (props: any) => {
  const { children, ...rest } = props;
  return (
    <components.MenuList {...rest}>
      <div 
        data-simplebar="true" 
        data-simplebar-auto-hide="false"
        style={{ maxHeight: '200px' }}
        onMouseDown={(e) => e.preventDefault()}
      >
        {children}
      </div>
    </components.MenuList>
  );
};

// END:: Select2 box icon

// ---------- helpers ----------

const mapMultiOptions = (options: MultiOption[]) =>
  options.map(opt => ({
    ...opt,
    value: opt.email,
    label: opt.name || opt.email,
  }));

const getSelectedMultiOptions = (
  allOptions: MultiOption[],
  values: string[]
) => {
  return allOptions.filter(opt => values.includes(opt.email));
}

const getSelectedSingleOption = (
  options: SingleOption[],
  value: string | null
) => {
  return value ? options.find(opt => opt.value === value) ?? null : null;
}

const renderMultiSelect = ({
  value,
  onChange,
  options,
  placeholder,
}: MultiSelectProps) => {
  const transformedOptions = mapMultiOptions(options);
  const selectedOptions = getSelectedMultiOptions(transformedOptions, value);

  const handleChange = (selected: MultiValue<MultiOption>) => {
    onChange(selected.map(opt => opt.email));
  };

  const handleCreate = (inputValue: string) => {
    onChange([...value, inputValue]);
  };

  return (
    <CreatableSelect<MultiOption, true>
      isMulti
      options={transformedOptions}
      value={selectedOptions}
      placeholder={placeholder}
      classNamePrefix="react-select"
      menuPortalTarget={document.body}
      styles={selectStyles}
      components={{
        DropdownIndicator: null,
        ClearIndicator,
        MultiValueRemove,
        MenuList,
      }}
      onChange={handleChange}
      onCreateOption={handleCreate}
      menuIsOpen
      createOptionPosition="first"
      getNewOptionData={(inputValue, optionLabel) => ({
        value: inputValue,
        email: inputValue,
        name: inputValue,
        label: optionLabel,
      })}
      formatOptionLabel={(option, { context }) => (
        context === 'value' ? (
          <div className="profile-main">
            <div className="profile">
              {(option.name || option.email || "?").charAt(0).toUpperCase()}
            </div>
            <div className="user-name">
              <span className="name">{option.name || option.email}</span>
            </div>
          </div>
        ) : (
          <div className="profile-main">
            <div className="profile">
              {(option.name || option.email || "?").charAt(0).toUpperCase()}
            </div>
            <div className="user-name">
              <span className="name">{option.name || option.email}</span>
              <span className="email">{option.email}</span>
            </div>
          </div>
        )
      )}
    />
  );
};

const renderSingleSelect = ({
  value,
  onChange,
  options,
  placeholder,
}: SingleSelectProps) => {
  const selectedOption = getSelectedSingleOption(options, value);

  const handleChange = (selected: SingleOption | null) => {
    onChange(selected ? selected.value : null);
  };

  return (
    <Select<SingleOption, false>
      isMulti={false}
      options={options}
      value={selectedOption}
      placeholder={placeholder}
      classNamePrefix="react-select"
      menuPortalTarget={document.body}
      styles={selectStyles as any}
      components={{
        DropdownIndicator,
        ClearIndicator: ClearIndicatorSingle,
      }}
      onChange={handleChange}
      isClearable
    />
  );
};

export default function Select2Wrapper(props: Select2WrapperProps) {
  if (props.isMulti) {
    return renderMultiSelect(props);
  }
  return renderSingleSelect(props);
}
