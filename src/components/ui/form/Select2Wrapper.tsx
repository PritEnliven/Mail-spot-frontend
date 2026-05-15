import Select, { components } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import type { MultiValue, StylesConfig, GroupBase } from 'react-select';
import dropdownIcon from "@images/chevron-down-icon.svg"
import dropUpIcon from "@images/chevron-up-icon.svg";
import removeIcon from "@images/close-icon.svg";
import SimpleBar from 'simplebar-react';

export const getSelectStyles = (
  type: string,
  moduleName?: string,
  isInModal: boolean = false 
): StylesConfig<MultiOption, true, GroupBase<MultiOption>> => {

  const isMultiple = type === "multiple";
  return {

    container: (base) => ({
      ...base,
      width: '100%'
    }),

    // moduleName = select2ColorOption
    /** Main visible input box */
    control: (base, state) => ({
      ...base,
      width: moduleName === "select2ColorOption" ? '71px' : '',
      minHeight: moduleName === "compose" ? '22px' : (isInModal ? '30px' : '32px'),
      borderRadius: '5px',
      border: moduleName === "datepickermodal" ? 'none' : moduleName === "compose" ? 'none' : state.isFocused ? '1px solid #0097EF' : '1px solid #BBC0C4',
      ':hover': {
        border: moduleName === "datepickermodal" ? 'none' : moduleName === "compose" ? 'none' : state.isFocused ? '1px solid #0097EF' : '1px solid #BBC0C4',
      },
      boxShadow: moduleName == "datepickermodal" ? (state.isFocused ? 'none' : '') : moduleName === "compose" ? 'none' : (state.isFocused ? '0 0 0 3px #E3F2FB' : `0px 1px 3px 0px #0000001F ${isMultiple ? "inset" : ""}`),
      backgroundColor: '#fff',
      cursor: 'text',
      '.input-icon-add &': {
        paddingLeft: '28px !important',
      },

    }),

    /** Holds values + input */
    valueContainer: (base) => ({
      ...base,
      padding: moduleName === "compose" ? '0' : '2px 4px',
      backgroundColor: '',
      color: '#212121',
      fontSize: '13px',
      fontWeight: '400',
      fontFamily: "`DM Sans`, sans-serif",
      gap: '2px',
      justifyContent: moduleName === "select2ColorOption" ? 'center' : '',
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
      lineHeight: '14px',
      textAlign: moduleName === "datepickermodal" ? ('start' as const) : undefined,
    }),

    /** Multi-value pill */
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#F0F7FB',
      color: '#212121',
      border: '1px solid #0073B6',
      margin: moduleName === "compose" ? '0' : '0',
      borderRadius: '3px',
      alignItems: 'center',
      '& .profile-main': {
        display: 'flex !important',
        alignItems: 'center !important',
        padding: '0 5px  0 3px !important',
      },
      '& .profile': {
        minWidth: '16px !important',
        maxWidth: '16px !important',
        height: '16px !important',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        borderRadius: '2px !important',
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
      paddingLeft: '0',
      paddingRight: '1px',
    }),

    /** Right-side icons container */
    indicatorsContainer: (base) => ({
      ...base,
      height: moduleName === "compose" ? '22px' : (isInModal ? '28px' : '29px'),
    }),

    /** Dropdown arrow */
    dropdownIndicator: (base) => ({
      ...base,
      padding: '5px',
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
      backgroundColor: '#D0D9DE',
      border: '',
      width: '1px',
      height: '16px',
      position: 'absolute',
      marginTop: '0',
      top: '50%',
      transform: 'translate(0, -50%)',
      display: moduleName === "datepickermodal" ? 'none' : '',
    }),

    /** Dropdown menu */
    menu: (base) => ({
      ...base,
      borderRadius: '5px',
      marginTop: '5px',
      boxShadow: '0px 1px 6px 0px rgba(0, 0, 0, 0.12)',
      backgroundColor: '#ffff',
      border: '1px solid #BBC0C4',
      overflow: 'hidden',
    }),

    /** Scrollable menu list */
    menuList: (base: any) => ({
      ...base,
      padding: '7px 0',
      backgroundColor: '#ffff',
      borderRadius: '5px',
      display: moduleName === "select2ColorOption" ? 'flex' : '',
      flexWrap: moduleName === "select2ColorOption" ? 'wrap' : '',
      justifyContent: moduleName === "select2ColorOption" ? 'center' : '',
      gap: moduleName === "select2ColorOption" ? '4px' : '',
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
      padding: moduleName === "select2ColorOption" ? '2px' : '7px',
      width: moduleName === "select2ColorOption" ? '24px' : '',
      height: moduleName === "select2ColorOption" ? '24px' : '',
      display: moduleName === "select2ColorOption" ? 'flex' : '',
      alignItems: moduleName === "select2ColorOption" ? 'center' : '',
      justifyContent: moduleName === "select2ColorOption" ? 'center' : '',
      borderRadius: moduleName === "select2ColorOption" ? '50px' : '',
      overflow:'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth:'100%',
      ':hover': {
        backgroundColor: '#e5e8ea',
      },
      ':active': {
        backgroundColor: '#e5e8ea',
      },
      '& .profile-main': {
        display: 'flex !important',
        alignItems: 'center !important',
      },
      '& .profile': {
        minWidth: '30px !important',
        maxWidth: '30px !important',
        height: '30px !important',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        borderRadius: '2px !important',
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
};

export interface MultiOption {
  value: string;
  label?: string;
  name?: string;
  email?: string;
  __isNew__?: boolean;
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
  moduleName?: string;
  isModal?: boolean | false;
  isEmail?: boolean | false;
  typeable?: boolean | true;
};

type SingleSelectProps = {
  value: string | null;
  onChange: (val: string | null) => void;
  options: SingleOption[];
  placeholder?: string;
  isMulti?: false;
  moduleName?: string;
  isModal?: boolean | false
  typeable?: boolean | true;
};

type Select2WrapperProps = MultiSelectProps | SingleSelectProps;

// START:: Select2 box icon
export const DropdownIndicator = (props: any) => {
  return (
    <components.DropdownIndicator {...props}>
      <img src={props.selectProps.menuIsOpen ? dropUpIcon : dropdownIcon} alt="" width={20} height={20} />
    </components.DropdownIndicator>
  );
};

export const MenuList = (props: any) => {
  return (
    <SimpleBar
      style={{ maxHeight: 200, scrollBehavior: 'smooth' }}
      autoHide={false}
      forceVisible="y"
      scrollableNodeProps={{ 
        ref: props.innerRef,
        style: { scrollBehavior: 'smooth' } 
      }}
    >
      <div 
        className="react-select__menu-list"
        style={{ padding: 0 }}
      >
        {props.children}
      </div>
    </SimpleBar>
  );
};


export const RemoveItemIndicator = (props: any) => {
  return (
    <components.MultiValueRemove {...props}>
      <img src={removeIcon} alt="" width={16} height={16} />
    </components.MultiValueRemove>
  );
};
// ---------- helpers ----------

interface MappedOption extends Omit<MultiOption, 'label'> {
  value: string;
  label: string;
}

const mapMultiOptions = (options: MultiOption[]): MappedOption[] =>
  options
    .map(opt => {
      const value = opt.email || opt.value || '';
      const label = opt.name || opt.email || opt.label || '';
      return {
        ...opt,
        value,
        label,
      };
    })
    .filter((opt): opt is MappedOption =>
      Boolean(opt.value) && Boolean(opt.label)
    );

const getSelectedMultiOptions = (
  allOptions: MappedOption[],
  values: string[]
) => {
  return allOptions.filter(opt => values.includes(opt.value));
}

const getSelectedSingleOption = (
  options: SingleOption[],
  value: string | null
) => {
  return value ? options.find(opt => opt.value === value) ?? null : null;
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const renderMultiSelect = ({
  value,
  onChange,
  options,
  placeholder,
  moduleName,
  isModal = false,
  isEmail,
}: MultiSelectProps) => {
  const handleChange = (selected: MultiValue<MappedOption>) => {
    onChange(selected.map((opt) => opt.value));
  };

  const transformedOptions = mapMultiOptions(options);

  const createdOptions: MappedOption[] = value
    .filter((val): val is string => Boolean(val))
    .filter(val => !transformedOptions.some(opt => opt.value === val))
    .map(val => ({
      value: val,
      label: val,
      __isNew__: true,
    }));

  const allOptions: MappedOption[] = [...transformedOptions, ...createdOptions];
  const selectedOptions = getSelectedMultiOptions(allOptions, value);

  const isValidNewValue = (input: string) => {
    if (!input.trim()) return false;
    if (isEmail) return isValidEmail(input);
    return true;
  };

  const handleCreate = (inputValue: string) => {
    if (!isValidNewValue(inputValue)) return;
    if (value.includes(inputValue)) return;
    onChange([...value, inputValue]);
  };

  return (
    <CreatableSelect<MappedOption, true, GroupBase<MappedOption>>
      isMulti
      options={allOptions}
      value={selectedOptions}
      placeholder={placeholder}     
      classNamePrefix="react-select"
      isClearable={false}
      onCreateOption={handleCreate}
      isValidNewOption={(inputValue, _, opts) =>
        isValidEmail(inputValue) &&
        !opts.some((o: any) => o.value === inputValue) &&
        !value.includes(inputValue)
      }
      menuPortalTarget={document.body}
      styles={getSelectStyles("multiple", moduleName, isModal) as any}
      captureMenuScroll={false}
      menuShouldBlockScroll={false}
      components={{
        DropdownIndicator: null,
        MenuList,
        MultiValueRemove: RemoveItemIndicator,
        ClearIndicator: () => null,
      }}
      onChange={handleChange}
      createOptionPosition="first"
      formatOptionLabel={(option, { context }) => {
        const displayName = option.name || option.email || option.label || '?';
        const initial = displayName[0].toUpperCase();

        return (
          <div className="profile-main">
            <div className="profile">{initial}</div>
            <div className="user-name">
              <span className="name me-1">{option.name || option.email || option.label}</span>
              {context === 'menu' && option.email && (
                <span className="email">{option.email}</span>
              )}
            </div>
          </div>
        );
      }}
    />
  );
};

const renderSingleSelect = ({
  value,
  onChange,
  options,
  placeholder,
  moduleName,
  isModal = false,
  typeable = false,
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
      styles={getSelectStyles("single", moduleName, isModal) as any}
      components={{
        MenuList,
        DropdownIndicator,
      }}
      onChange={handleChange}
      isSearchable={typeable}
    // menuIsOpen={true}
    />
  );
};

export default function Select2Wrapper(props: Select2WrapperProps) {
  if (props.isMulti) {
    return renderMultiSelect(props);
  }
  return renderSingleSelect(props);
}
