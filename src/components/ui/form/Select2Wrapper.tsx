// import React, { useState, useEffect } from 'react';
// import Select, { components } from 'react-select';
// import CreatableSelect from 'react-select/creatable';
// import type { MultiValue, StylesConfig, GroupBase } from 'react-select';
// import dropdownIcon from "@images/chevron-down-icon.svg"
// import dropUpIcon from "@images/chevron-up-icon.svg";
// import removeIcon from "@images/close-icon.svg";
// import SimpleBar from 'simplebar-react';

// // ---------- helper hook ----------
// const useIsMobile = (breakpoint: number = 575) => {
//   const [isMobile, setIsMobile] = useState(
//     typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
//   );

//   useEffect(() => {
//     const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
//     window.addEventListener('resize', handleResize);
//     handleResize();
//     return () => window.removeEventListener('resize', handleResize);
//   }, [breakpoint]);

//   return isMobile;
// };

// export const getSelectStyles = (
//   type: string,
//   moduleName?: string,
//   isInModal: boolean = false
// ): StylesConfig<MultiOption, true, GroupBase<MultiOption>> => {

//   const isMultiple = type === "multiple";
//   return {

//     container: (base) => ({
//       ...base,
//       width: '100%'
//     }),

//     // moduleName = select2ColorOption
//     /** Main visible input box */
//     control: (base, state) => ({
//       ...base,
//       width: moduleName === "select2ColorOption" ? '71px' : '',
//       minHeight: moduleName === "compose" ? '22px' : (isInModal ? '30px' : '32px'),
//       borderRadius: '5px',
//       border: moduleName === "datepickermodal" ? 'none' : moduleName === "compose" ? 'none' : state.isFocused ? '1px solid #0097EF' : '1px solid #BBC0C4',
//       ':hover': {
//         border: moduleName === "datepickermodal" ? 'none' : moduleName === "compose" ? 'none' : state.isFocused ? '1px solid #0097EF' : '1px solid #BBC0C4',
//       },
//       boxShadow: moduleName == "datepickermodal" ? (state.isFocused ? 'none' : '') : moduleName === "compose" ? 'none' : (state.isFocused ? '0 0 0 3px #E3F2FB' : `0px 1px 3px 0px #0000001F ${isMultiple ? "inset" : ""}`),
//       backgroundColor: state.isDisabled ? '#F5F6F7' : '#fff',
//       opacity: state.isDisabled ? 0.65 : 1,
//       cursor: state.isDisabled ? 'not-allowed' : 'text',
//       '.input-icon-add &': {
//         paddingLeft: '28px !important',
//       },

//     }),

//     /** Holds values + input */
//     valueContainer: (base) => ({
//       ...base,
//       padding: moduleName === "compose" ? '0' : '2px 4px',
//       backgroundColor: '',
//       color: '#212121',
//       fontSize: '13px',
//       fontWeight: '400',
//       fontFamily: "`DM Sans`, sans-serif",
//       gap: '2px',
//       justifyContent: moduleName === "select2ColorOption" ? 'center' : '',
//     }),

//     /** Actual text input */
//     input: (base) => ({
//       ...base,
//       margin: 0,
//       padding: 0,
//       backgroundColor: '',
//       color: '#212121',
//       fontSize: '13px',
//       fontWeight: '400',
//       fontFamily: "`DM Sans`, sans-serif",
//     }),

//     /** Placeholder */
//     placeholder: (base, state) => ({
//       ...base,
//       backgroundColor: '',
//       color: state.isDisabled ? '#9AA0A6' : '#212121',
//       fontSize: '13px',
//       fontWeight: '400',
//       fontFamily: "`DM Sans`, sans-serif",
//     }),

//     /** Single value (mostly irrelevant for isMulti) */
//     singleValue: (base, state) => ({
//       ...base,
//       color: state.isDisabled ? '#9AA0A6' : '#212121',
//       fontSize: '13px',
//       fontWeight: '400',
//       fontFamily: "`DM Sans`, sans-serif",
//       lineHeight: '14px',
//       textAlign: moduleName === "datepickermodal" ? ('start' as const) : undefined,
//     }),

//     /** Multi-value pill */
//     multiValue: (base) => ({
//       ...base,
//       backgroundColor: '#F0F7FB',
//       color: '#212121',
//       border: '1px solid #0073B6',
//       margin: moduleName === "compose" ? '0' : '0',
//       borderRadius: '3px',
//       alignItems: 'center',
//       '& .profile-main': {
//         display: 'flex !important',
//         alignItems: 'center !important',
//         padding: '0 5px  0 3px !important',
//       },
//       '& .profile': {
//         minWidth: '16px !important',
//         maxWidth: '16px !important',
//         height: '16px !important',
//         display: 'flex !important',
//         alignItems: 'center !important',
//         justifyContent: 'center !important',
//         borderRadius: '2px !important',
//       },
//     }),

//     /** Text inside pill */
//     multiValueLabel: (base) => ({
//       ...base,
//       fontSize: '12px',
//       padding: '1px 0',
//       paddingLeft: '0',
//       color: '#212121',
//       fontWeight: '500',
//       fontFamily: "`DM Sans`, sans-serif",
//       display: 'flex',
//       alignItems: 'center',
//     }),

//     /** × button in pill */
//     multiValueRemove: (base) => ({
//       ...base,
//       cursor: 'pointer',
//       ':hover': {
//         backgroundColor: 'transparent',
//         color: '#000000',
//       },
//       backgroundColor: 'transparent',
//       minWidth: '16px',
//       paddingLeft: '0',
//       paddingRight: '1px',
//     }),

//     /** Right-side icons container */
//     indicatorsContainer: (base) => ({
//       ...base,
//       height: moduleName === "compose" ? '22px' : (isInModal ? '28px' : '29px'),
//     }),

//     /** Dropdown arrow */
//     dropdownIndicator: (base) => ({
//       ...base,
//       padding: '5px',
//       backgroundColor: 'transparent',
//     }),

//     /** Clear indicator */
//     clearIndicator: (base) => ({
//       ...base,
//       padding: '0',
//     }),

//     /** Vertical separator */
//     indicatorSeparator: (base) => ({
//       ...base,
//       backgroundColor: '#D0D9DE',
//       border: '',
//       width: '1px',
//       height: '16px',
//       position: 'absolute',
//       marginTop: '0',
//       top: '50%',
//       transform: 'translate(0, -50%)',
//       display: moduleName === "datepickermodal" ? 'none' : '',
//     }),

//     /** Dropdown menu */
//     menu: (base) => ({
//       ...base,
//       borderRadius: '5px',
//       marginTop: '5px',
//       boxShadow: '0px 1px 6px 0px rgba(0, 0, 0, 0.12)',
//       backgroundColor: '#ffff',
//       border: '1px solid #BBC0C4',
//       overflow: 'hidden',
//       zIndex: 99999,
//     }),

//     /** Scrollable menu list */
//     menuList: (base: any) => ({
//       ...base,
//       padding: '7px 0',
//       backgroundColor: '#ffff',
//       borderRadius: '5px',
//       display: moduleName === "select2ColorOption" ? 'flex' : '',
//       flexWrap: moduleName === "select2ColorOption" ? 'wrap' : '',
//       justifyContent: moduleName === "select2ColorOption" ? 'center' : '',
//       gap: moduleName === "select2ColorOption" ? '4px' : '',
//     }),

//     /** Each option row */
//     option: (base, state) => ({
//       ...base,
//       cursor: 'pointer',
//       backgroundColor: state.isSelected
//         ? '#e5e8ea'
//         : 'transparent',
//       color: '#212121',
//       fontSize: '13px',
//       fontWeight: '400',
//       fontFamily: "'DM Sans', sans-serif",
//       padding: moduleName === "select2ColorOption" ? '2px' : '7px',
//       width: moduleName === "select2ColorOption" ? '24px' : '',
//       height: moduleName === "select2ColorOption" ? '24px' : '',
//       display: moduleName === "select2ColorOption" ? 'flex' : '',
//       alignItems: moduleName === "select2ColorOption" ? 'center' : '',
//       justifyContent: moduleName === "select2ColorOption" ? 'center' : '',
//       borderRadius: moduleName === "select2ColorOption" ? '50px' : '',
//       overflow: 'hidden',
//       textOverflow: 'ellipsis',
//       whiteSpace: 'nowrap',
//       maxWidth: '100%',
//       ':hover': {
//         backgroundColor: '#e5e8ea',
//       },
//       ':active': {
//         backgroundColor: '#e5e8ea',
//       },
//       '& .profile-main': {
//         display: 'flex !important',
//         alignItems: 'center !important',
//       },
//       '& .profile': {
//         minWidth: '30px !important',
//         maxWidth: '30px !important',
//         height: '30px !important',
//         display: 'flex !important',
//         alignItems: 'center !important',
//         justifyContent: 'center !important',
//         borderRadius: '2px !important',
//       },

//     }),

//     /** Menu portal (important for modals) */
//     menuPortal: (base) => ({
//       ...base,
//       zIndex: 99999,
//     }),

//     /** No options text */
//     noOptionsMessage: (base) => ({
//       ...base,
//       color: '#212121',
//       fontSize: '13px',
//     }),

//     /** Loading message */
//     loadingMessage: (base) => ({
//       ...base,
//     }),

//     /** Option groups (if used later) */
//     group: (base) => ({
//       ...base,
//     }),

//     groupHeading: (base) => ({
//       ...base,
//     }),
//   };
// };

// export interface MultiOption {
//   value: string;
//   label?: string;
//   name?: string;
//   email?: string;
//   __isNew__?: boolean;
// }

// export interface SingleOption {
//   value: string;
//   label: string;
// }

// type MultiSelectProps = {
//   value: string[];
//   onChange: (val: string[]) => void;
//   options: MultiOption[];
//   placeholder?: string;
//   isMulti: true;
//   moduleName?: string;
//   isModal?: boolean | false;
//   isEmail?: boolean | false;
//   typeable?: boolean | true;
// };

// type SingleSelectProps = {
//   value: string | null;
//   onChange: (val: string | null) => void;
//   options: SingleOption[];
//   placeholder?: string;
//   isMulti?: false;
//   moduleName?: string;
//   isModal?: boolean | false;
//   typeable?: boolean | true;
//   isDisabled?: boolean;
//   formatOptionLabel?: (option: any, meta?: { context: 'menu' | 'value' }) => React.ReactNode;
// };

// type Select2WrapperProps = MultiSelectProps | SingleSelectProps;

// // START:: Select2 box icon
// export const DropdownIndicator = (props: any) => {
//   return (
//     <components.DropdownIndicator {...props}>
//       <img src={props.selectProps.menuIsOpen ? dropUpIcon : dropdownIcon} alt="" width={20} height={20} />
//     </components.DropdownIndicator>
//   );
// };

// export const MenuList = (props: any) => {
//   return (
//     <SimpleBar
//       style={{ maxHeight: 200, scrollBehavior: 'smooth' }}
//       autoHide={false}
//       forceVisible="y"
//       scrollableNodeProps={{
//         ref: props.innerRef,
//         style: { scrollBehavior: 'smooth' }
//       }}
//     >
//       <div
//         className="react-select__menu-list"
//         style={{ padding: 0 }}
//       >
//         {props.children}
//       </div>
//     </SimpleBar>
//   );
// };


// export const RemoveItemIndicator = (props: any) => {
//   return (
//     <components.MultiValueRemove {...props}>
//       <img src={removeIcon} alt="" width={16} height={16} />
//     </components.MultiValueRemove>
//   );
// };
// // ---------- helpers ----------

// interface MappedOption extends Omit<MultiOption, 'label'> {
//   value: string;
//   label: string;
// }

// const mapMultiOptions = (options: MultiOption[]): MappedOption[] =>
//   options
//     .map(opt => {
//       const value = opt.email || opt.value || '';
//       const label = opt.name || opt.email || opt.label || '';
//       return {
//         ...opt,
//         value,
//         label,
//       };
//     })
//     .filter((opt): opt is MappedOption =>
//       Boolean(opt.value) && Boolean(opt.label)
//     );

// const getSelectedMultiOptions = (
//   allOptions: MappedOption[],
//   values: string[]
// ): MappedOption[] => {
//   return values.map((emailStr) => {
//     const match = allOptions
//       .flatMap((o: any) => o.options ?? [o])
//       .find((o: MappedOption) => o.value === emailStr || o.email === emailStr);

//     if (match) return match;

//     // Fallback for manually typed / draft emails not in contacts
//     return {
//       value: emailStr,
//       label: emailStr,
//       email: emailStr,
//       name: emailStr,
//     };
//   });
// };

// const getSelectedSingleOption = (
//   options: SingleOption[],
//   value: string | null
// ) => {
//   return value ? options.find(opt => opt.value === value) ?? null : null;
// }

// const isValidEmail = (email: string) =>
//   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// const renderMultiSelect = ({
//   value,
//   onChange,
//   options,
//   placeholder,
//   moduleName,
//   isModal = false,
//   isEmail,
// }: MultiSelectProps, isMobile: boolean) => {
//   const handleChange = (selected: MultiValue<MappedOption>) => {
//     onChange(selected.map((opt) => opt.value));
//   };

//   const transformedOptions = mapMultiOptions(options);

//   const createdOptions: MappedOption[] = value
//     .filter((val): val is string => Boolean(val))
//     .filter(val => !transformedOptions.some(opt => opt.value === val))
//     .map(val => ({
//       value: val,
//       label: val,
//       __isNew__: true,
//     }));

//   const allOptions: MappedOption[] = [...transformedOptions, ...createdOptions];
//   const selectedOptions = getSelectedMultiOptions(allOptions, value);

//   const isValidNewValue = (input: string) => {
//     if (!input.trim()) return false;
//     if (isEmail) return isValidEmail(input);
//     return true;
//   };

//   const handleCreate = (inputValue: string) => {
//     if (!isValidNewValue(inputValue)) return;
//     if (value.includes(inputValue)) return;
//     onChange([...value, inputValue]);
//   };

//   return (
//     <CreatableSelect<MappedOption, true, GroupBase<MappedOption>>
//       isMulti
//       options={allOptions}
//       value={selectedOptions}
//       placeholder={placeholder}
//       classNamePrefix="react-select"
//       isClearable={false}
//       onCreateOption={handleCreate}
//       isValidNewOption={(inputValue, _, opts) =>
//         isValidEmail(inputValue) &&
//         !opts.some((o: any) => o.value === inputValue) &&
//         !value.includes(inputValue)
//       }
//       menuPlacement="bottom"
//       menuPortalTarget={isModal ? (typeof document !== "undefined" ? document.body : undefined) : (isMobile ? null : document.body)}
//       menuPosition="fixed"
//       styles={getSelectStyles("multiple", moduleName, isModal) as any}
//       captureMenuScroll={false}
//       menuShouldBlockScroll={false}
//       components={{
//         DropdownIndicator: null,
//         MenuList,
//         MultiValueRemove: RemoveItemIndicator,
//         ClearIndicator: () => null,
//       }}
//       onChange={handleChange}
//       createOptionPosition="first"
//       formatOptionLabel={(option, { context }) => {
//         const email = option.email || option.value || '';
//         const displayName = option.name || option.label || email;
//         const initial = displayName.charAt(0).toUpperCase();

//         return (
//           <div className="profile-main">
//             <div className="profile">{initial}</div>
//             <div className="user-name">
//               <span className="name me-1">{displayName}</span>
//               {context === 'menu' && email && email !== displayName && (
//                 <span className="email">{email}</span>
//               )}
//             </div>
//           </div>
//         );
//       }}
//     />
//   );
// };

// const renderSingleSelect = ({
//   value,
//   onChange,
//   options,
//   placeholder,
//   moduleName,
//   isModal = false,
//   typeable = false,
//   isDisabled = false,
//   formatOptionLabel,
// }: SingleSelectProps, isMobile: boolean) => {
//   const selectedOption = getSelectedSingleOption(options, value);

//   const handleChange = (selected: SingleOption | null) => {
//     onChange(selected ? selected.value : null);
//   };

//   return (
//     <Select<SingleOption, false>
//       isMulti={false}
//       options={options}
//       value={selectedOption}
//       placeholder={placeholder}
//       classNamePrefix="react-select"
//       isDisabled={isDisabled}
//       menuPlacement="bottom"
//       minMenuHeight={0}
//       menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
//       menuPosition="fixed"
//       styles={getSelectStyles("single", moduleName, isModal) as any}
//       components={{
//         DropdownIndicator,
//       }}
//       onChange={handleChange}
//       isSearchable={typeable}
//       {...(formatOptionLabel ? { formatOptionLabel } : {})}
//     />
//   );
// };

// export default function Select2Wrapper(props: Select2WrapperProps) {
//   const isMobile = useIsMobile();

//   if (props.isMulti) {
//     return renderMultiSelect(props, isMobile);
//   }

//   return renderSingleSelect(props, isMobile);
// }











// import React, { useState, useEffect } from 'react';
// import Select, { components } from 'react-select';
// import CreatableSelect from 'react-select/creatable';
// import type { MultiValue, StylesConfig, GroupBase } from 'react-select';
// import dropdownIcon from "@images/chevron-down-icon.svg"
// import dropUpIcon from "@images/chevron-up-icon.svg";
// import removeIcon from "@images/close-icon.svg";
// import SimpleBar from 'simplebar-react';

// // ---------- helper hook ----------
// const useIsMobile = (breakpoint: number = 575) => {
//   const [isMobile, setIsMobile] = useState(
//     typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
//   );

//   useEffect(() => {
//     const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
//     window.addEventListener('resize', handleResize);
//     handleResize();
//     return () => window.removeEventListener('resize', handleResize);
//   }, [breakpoint]);

//   return isMobile;
// };

// export const getSelectStyles = (
//   type: string,
//   moduleName?: string,
//   isInModal: boolean = false
// ): StylesConfig<MultiOption, true, GroupBase<MultiOption>> => {

//   const isMultiple = type === "multiple";
//   return {

//     container: (base) => ({
//       ...base,
//       width: '100%'
//     }),

//     // moduleName = select2ColorOption
//     /** Main visible input box */
//     control: (base, state) => ({
//       ...base,
//       width: moduleName === "select2ColorOption" ? '71px' : '',
//       minHeight: moduleName === "compose" ? '22px' : (isInModal ? '30px' : '32px'),
//       borderRadius: '5px',
//       border: moduleName === "datepickermodal" ? 'none' : moduleName === "compose" ? 'none' : state.isFocused ? '1px solid #0097EF' : '1px solid #BBC0C4',
//       ':hover': {
//         border: moduleName === "datepickermodal" ? 'none' : moduleName === "compose" ? 'none' : state.isFocused ? '1px solid #0097EF' : '1px solid #BBC0C4',
//       },
//       boxShadow: moduleName == "datepickermodal" ? (state.isFocused ? 'none' : '') : moduleName === "compose" ? 'none' : (state.isFocused ? '0 0 0 3px #E3F2FB' : `0px 1px 3px 0px #0000001F ${isMultiple ? "inset" : ""}`),
//       backgroundColor: state.isDisabled ? '#F5F6F7' : '#fff',
//       opacity: state.isDisabled ? 0.65 : 1,
//       cursor: state.isDisabled ? 'not-allowed' : 'text',
//       '.input-icon-add &': {
//         paddingLeft: '28px !important',
//       },

//     }),

//     /** Holds values + input */
//     valueContainer: (base) => ({
//       ...base,
//       padding: moduleName === "compose" ? '0' : '2px 4px',
//       backgroundColor: '',
//       color: '#212121',
//       fontSize: '13px',
//       fontWeight: '400',
//       fontFamily: "`DM Sans`, sans-serif",
//       gap: '2px',
//       justifyContent: moduleName === "select2ColorOption" ? 'center' : '',
//     }),

//     /** Actual text input */
//     input: (base) => ({
//       ...base,
//       margin: 0,
//       padding: 0,
//       backgroundColor: '',
//       color: '#212121',
//       fontSize: '13px',
//       fontWeight: '400',
//       fontFamily: "`DM Sans`, sans-serif",
//     }),

//     /** Placeholder */
//     placeholder: (base, state) => ({
//       ...base,
//       backgroundColor: '',
//       color: state.isDisabled ? '#9AA0A6' : '#212121',
//       fontSize: '13px',
//       fontWeight: '400',
//       fontFamily: "`DM Sans`, sans-serif",
//     }),

//     /** Single value (mostly irrelevant for isMulti) */
//     singleValue: (base, state) => ({
//       ...base,
//       color: state.isDisabled ? '#9AA0A6' : '#212121',
//       fontSize: '13px',
//       fontWeight: '400',
//       fontFamily: "`DM Sans`, sans-serif",
//       lineHeight: '14px',
//       textAlign: moduleName === "datepickermodal" ? ('start' as const) : undefined,
//     }),

//     /** Multi-value pill */
//     multiValue: (base) => ({
//       ...base,
//       backgroundColor: '#F0F7FB',
//       color: '#212121',
//       border: '1px solid #0073B6',
//       margin: moduleName === "compose" ? '0' : '0',
//       borderRadius: '3px',
//       alignItems: 'center',
//       '& .profile-main': {
//         display: 'flex !important',
//         alignItems: 'center !important',
//         padding: '0 5px  0 3px !important',
//       },
//       '& .profile': {
//         minWidth: '16px !important',
//         maxWidth: '16px !important',
//         height: '16px !important',
//         display: 'flex !important',
//         alignItems: 'center !important',
//         justifyContent: 'center !important',
//         borderRadius: '2px !important',
//       },
//     }),

//     /** Text inside pill */
//     multiValueLabel: (base) => ({
//       ...base,
//       fontSize: '12px',
//       padding: '1px 0',
//       paddingLeft: '0',
//       color: '#212121',
//       fontWeight: '500',
//       fontFamily: "`DM Sans`, sans-serif",
//       display: 'flex',
//       alignItems: 'center',
//     }),

//     /** × button in pill */
//     multiValueRemove: (base) => ({
//       ...base,
//       cursor: 'pointer',
//       ':hover': {
//         backgroundColor: 'transparent',
//         color: '#000000',
//       },
//       backgroundColor: 'transparent',
//       minWidth: '16px',
//       paddingLeft: '0',
//       paddingRight: '1px',
//     }),

//     /** Right-side icons container */
//     indicatorsContainer: (base) => ({
//       ...base,
//       height: moduleName === "compose" ? '22px' : (isInModal ? '28px' : '29px'),
//     }),

//     /** Dropdown arrow */
//     dropdownIndicator: (base) => ({
//       ...base,
//       padding: '5px',
//       backgroundColor: 'transparent',
//     }),

//     /** Clear indicator */
//     clearIndicator: (base) => ({
//       ...base,
//       padding: '0',
//     }),

//     /** Vertical separator */
//     indicatorSeparator: (base) => ({
//       ...base,
//       backgroundColor: '#D0D9DE',
//       border: '',
//       width: '1px',
//       height: '16px',
//       position: 'absolute',
//       marginTop: '0',
//       top: '50%',
//       transform: 'translate(0, -50%)',
//       display: moduleName === "datepickermodal" ? 'none' : '',
//     }),

//     /** Dropdown menu */
//     menu: (base) => ({
//       ...base,
//       borderRadius: '5px',
//       marginTop: '5px',
//       boxShadow: '0px 1px 6px 0px rgba(0, 0, 0, 0.12)',
//       backgroundColor: '#ffff',
//       border: '1px solid #BBC0C4',
//       overflow: 'hidden',
//       zIndex:'999',
//     }),

//     /** Scrollable menu list */
//     menuList: (base: any) => ({
//       ...base,
//       padding: '7px 0',
//       backgroundColor: '#ffff',
//       borderRadius: '5px',
//       display: moduleName === "select2ColorOption" ? 'flex' : '',
//       flexWrap: moduleName === "select2ColorOption" ? 'wrap' : '',
//       justifyContent: moduleName === "select2ColorOption" ? 'center' : '',
//       gap: moduleName === "select2ColorOption" ? '4px' : '',
//     }),

//     /** Each option row */
//     option: (base, state) => ({
//       ...base,
//       cursor: 'pointer',
//       backgroundColor: state.isSelected
//         ? '#e5e8ea'
//         : 'transparent',
//       color: '#212121',
//       fontSize: '13px',
//       fontWeight: '400',
//       fontFamily: "'DM Sans', sans-serif",
//       padding: moduleName === "select2ColorOption" ? '2px' : '7px',
//       width: moduleName === "select2ColorOption" ? '24px' : '',
//       height: moduleName === "select2ColorOption" ? '24px' : '',
//       display: moduleName === "select2ColorOption" ? 'flex' : '',
//       alignItems: moduleName === "select2ColorOption" ? 'center' : '',
//       justifyContent: moduleName === "select2ColorOption" ? 'center' : '',
//       borderRadius: moduleName === "select2ColorOption" ? '50px' : '',
//       overflow: 'hidden',
//       textOverflow: 'ellipsis',
//       whiteSpace: 'nowrap',
//       maxWidth: '100%',
//       ':hover': {
//         backgroundColor: '#e5e8ea',
//       },
//       ':active': {
//         backgroundColor: '#e5e8ea',
//       },
//       '& .profile-main': {
//         display: 'flex !important',
//         alignItems: 'center !important',
//       },
//       '& .profile': {
//         minWidth: '30px !important',
//         maxWidth: '30px !important',
//         height: '30px !important',
//         display: 'flex !important',
//         alignItems: 'center !important',
//         justifyContent: 'center !important',
//         borderRadius: '2px !important',
//       },

//     }),

//     /** Menu portal (important for modals) */
//     menuPortal: (base) => ({
//       ...base,
//       zIndex: 9999,
//     }),

//     /** No options text */
//     noOptionsMessage: (base) => ({
//       ...base,
//       color: '#212121',
//       fontSize: '13px',
//     }),

//     /** Loading message */
//     loadingMessage: (base) => ({
//       ...base,
//     }),

//     /** Option groups (if used later) */
//     group: (base) => ({
//       ...base,
//     }),

//     groupHeading: (base) => ({
//       ...base,
//     }),
//   };
// };

// export interface MultiOption {
//   value: string;
//   label?: string;
//   name?: string;
//   email?: string;
//   __isNew__?: boolean;
// }

// export interface SingleOption {
//   value: string;
//   label: string;
//   isDisabled?: boolean;
//   depth?: number;
// }

// type MultiSelectProps = {
//   value: string[];
//   onChange: (val: string[]) => void;
//   options: MultiOption[];
//   placeholder?: string;
//   isMulti: true;
//   moduleName?: string;
//   isModal?: boolean | false;
//   isEmail?: boolean | false;
//   typeable?: boolean | true;
// };

// type SingleSelectProps = {
//   value: string | null;
//   onChange: (val: string | null) => void;
//   options: SingleOption[];
//   placeholder?: string;
//   isMulti?: false;
//   moduleName?: string;
//   isModal?: boolean | false;
//   typeable?: boolean | true;
//   isDisabled?: boolean;
//   formatOptionLabel?: (option: any, meta?: { context: 'menu' | 'value' }) => React.ReactNode;
// };

// type Select2WrapperProps = MultiSelectProps | SingleSelectProps;

// // START:: Select2 box icon
// export const DropdownIndicator = (props: any) => {
//   return (
//     <components.DropdownIndicator {...props}>
//       <img src={props.selectProps.menuIsOpen ? dropUpIcon : dropdownIcon} alt="" width={20} height={20} />
//     </components.DropdownIndicator>
//   );
// };

// export const MenuList = (props: any) => {
//   return (
//     <SimpleBar
//       style={{ maxHeight: 200, scrollBehavior: 'smooth' }}
//       autoHide={false}
//       forceVisible="y"
//       scrollableNodeProps={{
//         ref: props.innerRef,
//         style: { scrollBehavior: 'smooth' }
//       }}
//     >
//       <div
//         className="react-select__menu-list"
//         style={{ padding: 0 }}
//       >
//         {props.children}
//       </div>
//     </SimpleBar>
//   );
// };


// export const RemoveItemIndicator = (props: any) => {
//   return (
//     <components.MultiValueRemove {...props}>
//       <img src={removeIcon} alt="" width={16} height={16} />
//     </components.MultiValueRemove>
//   );
// };
// // ---------- helpers ----------

// interface MappedOption extends Omit<MultiOption, 'label'> {
//   value: string;
//   label: string;
// }

// const mapMultiOptions = (options: MultiOption[]): MappedOption[] =>
//   options
//     .map(opt => {
//       const value = opt.email || opt.value || '';
//       const label = opt.name || opt.email || opt.label || '';
//       return {
//         ...opt,
//         value,
//         label,
//       };
//     })
//     .filter((opt): opt is MappedOption =>
//       Boolean(opt.value) && Boolean(opt.label)
//     );

// const getSelectedMultiOptions = (
//   allOptions: MappedOption[],
//   values: string[]
// ): MappedOption[] => {
//   return values.map((emailStr) => {
//     const match = allOptions
//       .flatMap((o: any) => o.options ?? [o])
//       .find((o: MappedOption) => o.value === emailStr || o.email === emailStr);

//     if (match) return match;

//     // Fallback for manually typed / draft emails not in contacts
//     return {
//       value: emailStr,
//       label: emailStr,
//       email: emailStr,
//       name: emailStr,
//     };
//   });
// };

// const getSelectedSingleOption = (
//   options: SingleOption[],
//   value: string | null
// ) => {
//   return value ? options.find(opt => opt.value === value) ?? null : null;
// }

// const isValidEmail = (email: string) =>
//   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// const renderMultiSelect = ({
//   value,
//   onChange,
//   options,
//   placeholder,
//   moduleName,
//   isModal = false,
//   isEmail,
// }: MultiSelectProps, isMobile: boolean) => {
//   const handleChange = (selected: MultiValue<MappedOption>) => {
//     onChange(selected.map((opt) => opt.value));
//   };

//   const transformedOptions = mapMultiOptions(options);

//   const createdOptions: MappedOption[] = value
//     .filter((val): val is string => Boolean(val))
//     .filter(val => !transformedOptions.some(opt => opt.value === val))
//     .map(val => ({
//       value: val,
//       label: val,
//       __isNew__: true,
//     }));

//   const allOptions: MappedOption[] = [...transformedOptions, ...createdOptions];
//   const selectedOptions = getSelectedMultiOptions(allOptions, value);

//   const isValidNewValue = (input: string) => {
//     if (!input.trim()) return false;
//     if (isEmail) return isValidEmail(input);
//     return true;
//   };

//   const handleCreate = (inputValue: string) => {
//     if (!isValidNewValue(inputValue)) return;
//     if (value.includes(inputValue)) return;
//     onChange([...value, inputValue]);
//   };

//   return (
//     <CreatableSelect<MappedOption, true, GroupBase<MappedOption>>
//       isMulti
//       options={allOptions}
//       value={selectedOptions}
//       placeholder={placeholder}
//       classNamePrefix="react-select"
//       isClearable={false}
//       onCreateOption={handleCreate}
//       isValidNewOption={(inputValue, _, opts) =>
//         isValidEmail(inputValue) &&
//         !opts.some((o: any) => o.value === inputValue) &&
//         !value.includes(inputValue)
//       }
//       menuPortalTarget={isMobile ? null : document.body}
//       styles={getSelectStyles("multiple", moduleName, isModal) as any}
//       captureMenuScroll={false}
//       menuShouldBlockScroll={false}
//       components={{
//         DropdownIndicator: null,
//         MenuList,
//         MultiValueRemove: RemoveItemIndicator,
//         ClearIndicator: () => null,
//       }}
//       onChange={handleChange}
//       createOptionPosition="first"
//       formatOptionLabel={(option, { context }) => {
//         const email = option.email || option.value || '';
//         const displayName = option.name || option.label || email;
//         const initial = displayName.charAt(0).toUpperCase();

//         return (
//           <div className="profile-main">
//             <div className="profile">{initial}</div>
//             <div className="user-name">
//               <span className="name me-1">{displayName}</span>
//               {context === 'menu' && email && email !== displayName && (
//                 <span className="email">{email}</span>
//               )}
//             </div>
//           </div>
//         );
//       }}
//     />
//   );
// };

// const renderSingleSelect = ({
//   value,
//   onChange,
//   options,
//   placeholder,
//   moduleName,
//   isModal = false,
//   typeable = false,
//   isDisabled = false,
//   formatOptionLabel,
// }: SingleSelectProps, isMobile: boolean) => {
//   const selectedOption = getSelectedSingleOption(options, value);

//   const handleChange = (selected: SingleOption | null) => {
//     onChange(selected ? selected.value : null);
//   };

//   return (
//     <Select<SingleOption, false>
//       isMulti={false}
//       options={options}
//       value={selectedOption}
//       placeholder={placeholder}
//       classNamePrefix="react-select"
//       isDisabled={isDisabled}
//       menuPortalTarget={isMobile ? null : document.body}
//       styles={getSelectStyles("single", moduleName, isModal) as any}
//       components={{
//         MenuList,
//         DropdownIndicator,
//       }}
//       onChange={handleChange}
//       isSearchable={typeable}
//       {...(formatOptionLabel ? { formatOptionLabel } : {})}
//     />
//   );
// };

// export default function Select2Wrapper(props: Select2WrapperProps) {
//   const isMobile = useIsMobile();

//   if (props.isMulti) {
//     return renderMultiSelect(props, isMobile);
//   }

//   return renderSingleSelect(props, isMobile);
// }



import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import Select, { components } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import type { MultiValue, StylesConfig, GroupBase } from 'react-select';
import dropdownIcon from "@images/chevron-down-icon.svg"
import dropUpIcon from "@images/chevron-up-icon.svg";
import removeIcon from "@images/close-icon.svg";
import SimpleBar from 'simplebar-react';
import SearchFadeLoader from '@components/ui/SearchFadeLoader';

// ---------- helper hook ----------
const useIsMobile = (breakpoint: number = 575) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

// ---------- manual menu placement ----------
// react-select's built-in menuPlacement="auto" measures space at mount time,
// which is unreliable inside animated Bootstrap bottom-sheet modals on mobile
// (the modal is still transitioning into position, or the keyboard resizes
// the viewport). This hook measures the real control position the moment the
// menu is about to open, and flips placement to "top" if there isn't enough
// room below.
const MENU_ESTIMATED_HEIGHT = 200; // keep in sync with MenuList's maxHeight

const useMenuPlacement = () => {
  const selectRef = useRef<any>(null);
  const [menuPlacement, setMenuPlacement] = useState<'top' | 'bottom'>('bottom');

  const handleMenuOpen = () => {
    const instance = selectRef.current;
    const controlEl: HTMLElement | undefined =
      instance?.controlRef ??
      instance?.select?.controlRef ??
      instance?.select?.select?.controlRef;

    if (!controlEl || typeof controlEl.getBoundingClientRect !== 'function') {
      setMenuPlacement('bottom');
      return;
    }

    const rect = controlEl.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    setMenuPlacement(
      spaceBelow < MENU_ESTIMATED_HEIGHT && spaceAbove > spaceBelow ? 'top' : 'bottom'
    );
  };

  return { selectRef, menuPlacement, handleMenuOpen };
};

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
      backgroundColor: state.isDisabled ? '#F5F6F7' : '#fff',
      opacity: state.isDisabled ? 0.65 : 1,
      cursor: state.isDisabled ? 'not-allowed' : 'text',
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
    placeholder: (base, state) => ({
      ...base,
      backgroundColor: '',
      color: state.isDisabled ? '#9AA0A6' : '#212121',
      fontSize: '13px',
      fontWeight: '400',
      fontFamily: "`DM Sans`, sans-serif",
    }),

    /** Single value (mostly irrelevant for isMulti) */
    singleValue: (base, state) => ({
      ...base,
      color: state.isDisabled ? '#9AA0A6' : '#212121',
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

    /** Contact search loader in the control */
    loadingIndicator: (base) => ({
      ...base,
      padding: '0 4px',
      display: 'flex',
      alignItems: 'center',
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
      zIndex: 99999,
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
      // isFocused covers keyboard (↑/↓) highlight; isSelected is the chosen value
      backgroundColor: state.isFocused || state.isSelected
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
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: '100%',
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
      zIndex: 99999,
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
  isSuggestion?: boolean;
  __isNew__?: boolean;
}

export interface SingleOption {
  value: string;
  label: string;
  isDisabled?: boolean;
  depth?: number;
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
  onInputChange?: (inputValue: string) => void;
  /** Called when the suggestion menu opens (e.g. click/focus on To/From). */
  onOpen?: () => void;
  /** Called when the suggestion menu closes — reset pagination, etc. */
  onClose?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  /** Initial / typed contact search in progress */
  isLoading?: boolean;
  showSuggestionBadge?: boolean;
};

type SingleSelectProps = {
  value: string | null;
  onChange: (val: string | null) => void;
  options: SingleOption[];
  placeholder?: string;
  isMulti?: false;
  moduleName?: string;
  isModal?: boolean | false;
  typeable?: boolean | true;
  isDisabled?: boolean;
  formatOptionLabel?: (option: any, meta?: { context: 'menu' | 'value' }) => React.ReactNode;
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

const ContactSearchLoadingMessage = (props: any) => (
  <components.LoadingMessage {...props}>
    <div className="select2-searching-message">
      <div className="subject-search">
        <div className="subject text-center">Searching...</div>
      </div>
    </div>
  </components.LoadingMessage>
);

const MENU_SCROLL_LOAD_THRESHOLD_PX = 64;
const KEYBOARD_LOAD_MORE_REMAINING = 5;

type MenuScrollState = {
  top: number;
  /** Keep list pinned until the user scrolls again after a page append. */
  lockUntilUserScroll: boolean;
  /**
   * Whether the in-flight/most recent "load more" was triggered by manual
   * mouse-wheel scrolling (true → pin `top` while the page loads/appends) or
   * by keyboard/hover reaching the end of the list (false → let the list
   * scroll freely, since react-select natively scrolls the focused option
   * into view as the user holds an arrow key down). Without this split, the
   * pin logic below would keep snapping the list back to a stale scroll
   * position while the user was actively navigating with the keyboard,
   * making it look "stuck" / jumping back up.
   */
  pinOnAppend: boolean;
};

export const MenuList = (props: any) => {
  const { children, innerRef, innerProps, focusedOption, options = [] } = props;
  const listRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRequestedRef = useRef(false);
  const scrollRafRef = useRef<number | null>(null);
  const restoreRafRef = useRef<number | null>(null);
  const prevOptionsLengthRef = useRef(options.length);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const onLoadMore = props.selectProps?.onLoadMore as (() => void) | undefined;
  const hasMore = Boolean(props.selectProps?.hasMore);
  const isLoadingMore = Boolean(props.selectProps?.isLoadingMore);
  const isSearching = Boolean(props.selectProps?.isSearching);
  const scrollState = props.selectProps?.menuScrollState as
    | React.MutableRefObject<MenuScrollState>
    | undefined;

  const onLoadMoreRef = useRef(onLoadMore);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);

  onLoadMoreRef.current = onLoadMore;
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;

  const focusedKey =
    focusedOption?.value ?? focusedOption?.email ?? focusedOption?.label ?? null;

  const setListNode = (node: HTMLDivElement | null) => {
    listRef.current = node;
    if (typeof innerRef === 'function') {
      innerRef(node);
    } else if (innerRef) {
      (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
    // Remount / first paint: put the list back where the user was.
    if (node && scrollState?.current.lockUntilUserScroll) {
      node.scrollTop = scrollState.current.top;
    }
  };

  const restoreScroll = () => {
    const el = listRef.current;
    if (!el || !scrollState?.current.lockUntilUserScroll) return;
    el.scrollTop = scrollState.current.top;
  };

  const scheduleRestoreScroll = () => {
    restoreScroll();
    if (restoreRafRef.current != null) {
      cancelAnimationFrame(restoreRafRef.current);
    }
    restoreRafRef.current = requestAnimationFrame(() => {
      restoreScroll();
      restoreRafRef.current = requestAnimationFrame(() => {
        restoreScroll();
        restoreRafRef.current = null;
      });
    });
  };

  // `pin`: true for manual mouse-wheel scrolling near the bottom (we want to
  // keep the viewport exactly where the user left it while the page loads in).
  // false for keyboard/hover reaching the end of the list (we want the list to
  // stay free to keep scrolling with the focused option instead of snapping
  // back to wherever it was when the fetch started).
  const requestLoadMore = (pin: boolean) => {
    if (!onLoadMoreRef.current) return;
    if (!hasMoreRef.current) return;
    if (isLoadingMoreRef.current) return;
    if (loadMoreRequestedRef.current) return;

    const el = listRef.current;
    if (scrollState) {
      scrollState.current.pinOnAppend = pin;
      if (pin && el) {
        scrollState.current.top = el.scrollTop;
        scrollState.current.lockUntilUserScroll = true;
      } else {
        scrollState.current.lockUntilUserScroll = false;
      }
    }

    loadMoreRequestedRef.current = true;
    try {
      onLoadMoreRef.current();
    } catch {
      loadMoreRequestedRef.current = false;
      if (scrollState) scrollState.current.lockUntilUserScroll = false;
    }
  };

  useEffect(() => {
    if (!isLoadingMore) {
      loadMoreRequestedRef.current = false;
    }
  }, [isLoadingMore]);

  useEffect(() => {
    if (hasMore && !isLoadingMore) {
      loadMoreRequestedRef.current = false;
    }
  }, [hasMore, isLoadingMore, options.length]);

  // After each page append / loader toggle, force the saved scroll position
  // back — but only when the load was a "pinned" (mouse-scroll-triggered)
  // one. Keyboard/hover-triggered loads leave `pinOnAppend` false, so this
  // deliberately no-ops for them and lets the list keep following the
  // focused option instead of yanking it back up mid-navigation.
  useLayoutEffect(() => {
    const el = listRef.current;
    const prevLength = prevOptionsLengthRef.current;
    const nextLength = options.length;
    prevOptionsLengthRef.current = nextLength;

    if (!el || !scrollState || !scrollState.current.pinOnAppend) return;

    const appended = nextLength > prevLength && prevLength > 0;

    if (appended || isLoadingMore || scrollState.current.lockUntilUserScroll) {
      if (appended || isLoadingMore) {
        scrollState.current.lockUntilUserScroll = true;
      }
      scheduleRestoreScroll();
    }
  }, [options.length, isLoadingMore, scrollState]);

  // Hold the lock long enough to beat react-select's delayed focus reset, then unlock
  // so the user can keep arrowing through the list.
  useEffect(() => {
    if (!scrollState?.current.lockUntilUserScroll) return;
    if (isLoadingMore) return;

    const timer = window.setTimeout(() => {
      restoreScroll();
      if (scrollState) {
        scrollState.current.lockUntilUserScroll = false;
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [options.length, isLoadingMore, scrollState]);

  useEffect(() => () => {
    if (restoreRafRef.current != null) {
      cancelAnimationFrame(restoreRafRef.current);
    }
    if (scrollRafRef.current != null) {
      cancelAnimationFrame(scrollRafRef.current);
    }
  }, []);

  const checkNearBottom = (el: HTMLDivElement) => {
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining <= MENU_SCROLL_LOAD_THRESHOLD_PX) {
      requestLoadMore(true);
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    innerProps?.onScroll?.(event);
    const el = event.currentTarget;

    // While locked, keep fighting anything that tries to reset to top.
    if (scrollState?.current.lockUntilUserScroll) {
      const target = scrollState.current.top;
      // Treat tiny drift as restore noise; a real user scroll moves further.
      if (Math.abs(el.scrollTop - target) > 8) {
        scrollState.current.lockUntilUserScroll = false;
        scrollState.current.top = el.scrollTop;
      } else if (el.scrollTop !== target) {
        el.scrollTop = target;
        return;
      }
    } else if (scrollState) {
      scrollState.current.top = el.scrollTop;
    }

    if (scrollRafRef.current != null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      checkNearBottom(el);
    });
  };

  // Prefetch when already sitting at the bottom after a page lands.
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;
    const el = listRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 1) return;
    checkNearBottom(el);
  }, [onLoadMore, hasMore, isLoadingMore, options.length]);

  // If the option that's currently "focused" (via real keyboard nav OR plain
  // mouse hover — react-select doesn't distinguish the two) is near the end
  // of the loaded list, prefetch the next page.
  //
  // NOTE: this used to also force `el.scrollTop` to bring the focused option
  // into view. That was the actual cause of the "scroller jumps back to the
  // top / first suggestion" bug: react-select tracks the focused option by
  // object *reference* (see its internal `getNextFocusedOption`, which uses
  // `Array.prototype.indexOf`). Every time a fresh page of contacts loaded,
  // the options array was rebuilt with brand-new objects, so react-select
  // could no longer find the previously-focused/hovered option by reference
  // and reset focus to `options[0]` — which this effect then dutifully
  // scrolled into view, yanking the list back to the top. React-select
  // already scrolls the focused option into view natively for real keyboard
  // navigation, so we don't need to (and must not) do it ourselves here.
  useEffect(() => {
    if (!focusedKey) return;

    const flatOptions = Array.isArray(optionsRef.current) ? optionsRef.current : [];
    const focusedIndex = flatOptions.findIndex((opt: any) => {
      const key = opt?.value ?? opt?.email ?? opt?.label ?? null;
      return key != null && key === focusedKey;
    });

    if (
      focusedIndex >= 0 &&
      focusedIndex >= flatOptions.length - KEYBOARD_LOAD_MORE_REMAINING
    ) {
      // Don't pin: let the list keep scrolling with the focused option
      // instead of snapping back once the next page lands.
      requestLoadMore(false);
    }
  }, [focusedKey]);

  if (onLoadMore) {
    const { onScroll: _ignored, ...restInnerProps } = innerProps ?? {};
    return (
      <div
        {...restInnerProps}
        ref={setListNode}
        className="react-select__menu-list"
        onScroll={handleScroll}
        style={{
          maxHeight: 200,
          overflowY: 'auto',
          padding: 0,
        }}
      >
        {isSearching && !isLoadingMore ? (
          <div className="select2-searching-message">
            <div className="subject-search">
              <div className="subject text-center">Searching...</div>
            </div>
          </div>
        ) : (
          <>
            {children}
            {isLoadingMore && (
              <div className="d-flex align-items-center justify-content-center py-2">
                <SearchFadeLoader className="search-fade-loader--sm" label="Loading" />
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <SimpleBar
      style={{ maxHeight: 200 }}
      autoHide={false}
      forceVisible="y"
      scrollableNodeProps={{
        ref: innerRef,
      }}
    >
      <div
        className="react-select__menu-list"
        style={{ padding: 0 }}
        {...innerProps}
      >
        {children}
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

// `cache` (optional) is a value -> MappedOption map kept across renders by the
// caller. When provided, options whose relevant fields haven't changed reuse
// their *same* object reference instead of getting a brand-new one.
//
// This matters a lot for react-select: it tracks the currently focused /
// hovered option by object identity (`Array.prototype.indexOf`). If we hand
// it a fresh set of objects on every render (e.g. every time a new page of
// contacts loads in), it can no longer find the previously-focused option in
// the new list and silently resets focus to `options[0]` — which visually
// looks like the highlighted row (and, previously, the scroll position)
// jumping back to the first suggestion. Reusing references for unchanged
// contacts keeps react-select's internal focus tracking stable across pages.
const mapMultiOptions = (
  options: MultiOption[],
  cache?: Map<string, MappedOption>,
): MappedOption[] => {
  const nextCache: Map<string, MappedOption> | null = cache ? new Map() : null;

  const mapped = options
    .map(opt => {
      const value = opt.email || opt.value || '';
      const label = opt.name || opt.email || opt.label || '';
      if (!value || !label) return null;

      if (cache) {
        const prev = cache.get(value);
        const unchanged =
          prev &&
          prev.value === value &&
          prev.label === label &&
          prev.name === opt.name &&
          prev.email === opt.email &&
          prev.isSuggestion === opt.isSuggestion;

        if (unchanged) {
          nextCache!.set(value, prev!);
          return prev!;
        }
      }

      const mappedOpt: MappedOption = { ...opt, value, label };
      nextCache?.set(value, mappedOpt);
      return mappedOpt;
    })
    .filter((opt): opt is MappedOption => Boolean(opt));

  if (cache && nextCache) {
    cache.clear();
    nextCache.forEach((v, k) => cache.set(k, v));
  }

  return mapped;
};

const getSelectedMultiOptions = (
  allOptions: MappedOption[],
  values: string[]
): MappedOption[] => {
  return values.map((emailStr) => {
    const match = allOptions
      .flatMap((o: any) => o.options ?? [o])
      .find((o: MappedOption) => o.value === emailStr || o.email === emailStr);

    if (match) return match;

    // Fallback for manually typed / draft emails not in contacts
    return {
      value: emailStr,
      label: emailStr,
      email: emailStr,
      name: emailStr,
    };
  });
};

const getSelectedSingleOption = (
  options: SingleOption[],
  value: string | null
) => {
  return value ? options.find(opt => opt.value === value) ?? null : null;
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const MultiSelect = ({
  value,
  onChange,
  options,
  placeholder,
  moduleName,
  isModal = false,
  isEmail,
  onInputChange,
  onOpen,
  onClose,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  isLoading = false,
  showSuggestionBadge = false,
}: MultiSelectProps) => {
  const { selectRef, menuPlacement, handleMenuOpen } = useMenuPlacement();
  const menuScrollState = useRef<MenuScrollState>({ top: 0, lockUntilUserScroll: false, pinOnAppend: false });
  const optionsCacheRef = useRef<Map<string, MappedOption>>(new Map());
  const [isActiveSelect, setIsActiveSelect] = useState(false);

  const handleChange = (selected: MultiValue<MappedOption>) => {
    onChange(selected.map((opt) => opt.value));
  };

  // Memoized (and identity-cached, see mapMultiOptions) so that unrelated
  // re-renders — or even a genuine new page of contacts loading in — don't
  // hand react-select a brand-new `options` array/objects unless the
  // underlying data actually changed. See mapMultiOptions for why that
  // matters for keeping the scroll position stable while paginating.
  const transformedOptions = useMemo(() => {
    const mapped = mapMultiOptions(options, optionsCacheRef.current);
    // Defense in depth: keep Suggested rows first even if the parent list is alphabetical.
    const suggestions = mapped.filter((opt) => opt.isSuggestion);
    if (suggestions.length === 0) return mapped;
    const addressBook = mapped.filter((opt) => !opt.isSuggestion);
    return [...suggestions, ...addressBook];
  }, [options]);

  const createdOptions: MappedOption[] = useMemo(
    () =>
      value
        .filter((val): val is string => Boolean(val))
        .filter(val => !transformedOptions.some(opt => opt.value === val))
        .map(val => ({
          value: val,
          label: val,
          __isNew__: true,
        })),
    [value, transformedOptions],
  );

  const allOptions: MappedOption[] = useMemo(
    () => [...transformedOptions, ...createdOptions],
    [transformedOptions, createdOptions],
  );

  const selectedOptions = useMemo(
    () => getSelectedMultiOptions(allOptions, value),
    [allOptions, value],
  );

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

  const handleOpen = () => {
    handleMenuOpen();
    setIsActiveSelect(true);
    menuScrollState.current = { top: 0, lockUntilUserScroll: false, pinOnAppend: false };
    onOpen?.();
  };

  const handleClose = () => {
    setIsActiveSelect(false);
    menuScrollState.current = { top: 0, lockUntilUserScroll: false, pinOnAppend: false };
    onClose?.();
  };

  return (
    <CreatableSelect
      ref={selectRef}
      isMulti
      options={allOptions}
      value={selectedOptions}
      placeholder={placeholder}
      classNamePrefix="react-select"
      isClearable={false}
      isLoading={isLoading && isActiveSelect}
      onCreateOption={handleCreate}
      isValidNewOption={(inputValue: string, _: unknown, opts: any[]) =>
        isValidEmail(inputValue) &&
        !opts.some((o: any) => o.value === inputValue) &&
        !value.includes(inputValue)
      }
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
      menuPlacement={menuPlacement}
      onMenuOpen={handleOpen}
      onMenuClose={handleClose}
      styles={getSelectStyles("multiple", moduleName, isModal) as any}
      captureMenuScroll={false}
      menuShouldBlockScroll={false}
      {...({
        scrollToFocusedOptionOnUpdate: false,
        onLoadMore,
        hasMore,
        isLoadingMore,
        isSearching: isLoading && isActiveSelect,
        menuScrollState,
      } as any)}
      components={{
        DropdownIndicator: null,
        MenuList,
        MultiValueRemove: RemoveItemIndicator,
        ClearIndicator: () => null,
        LoadingIndicator: () => null,
        LoadingMessage: ContactSearchLoadingMessage,
      }}
      onChange={handleChange}
      onInputChange={(inputValue: string, meta: { action: string }) => {
        if (meta.action === 'input-change') {
          onInputChange?.(inputValue);
        }
      }}
      createOptionPosition="first"
      formatOptionLabel={(option: MappedOption, { context }: { context: 'menu' | 'value' }) => {
        const email = option.email || option.value || '';
        const displayName = option.name || option.label || email;
        const initial = displayName.charAt(0).toUpperCase();

        return (
          <div className="profile-main">
            <div className="profile">{initial}</div>
            <div className="user-name">
              <span className="name me-1">{displayName}</span>
              {context === 'menu' && email && email !== displayName && (
                <span className="email">{email}</span>
              )}
              {context === 'menu' && showSuggestionBadge && option.isSuggestion && (
                <span className="badge bg-light text-muted ms-1" style={{ fontSize: '10px' }}>
                  Suggested
                </span>
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
  isDisabled = false,
  formatOptionLabel,
}: SingleSelectProps, _isMobile: boolean) => {
  const selectedOption = getSelectedSingleOption(options, value);
  const { selectRef, menuPlacement, handleMenuOpen } = useMenuPlacement();

  const handleChange = (selected: SingleOption | null) => {
    onChange(selected ? selected.value : null);
  };

  return (
    <Select<SingleOption, false>
      ref={selectRef}
      isMulti={false}
      options={options}
      value={selectedOption}
      placeholder={placeholder}
      classNamePrefix="react-select"
      isDisabled={isDisabled}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
      menuPlacement={menuPlacement}
      onMenuOpen={handleMenuOpen}
      styles={getSelectStyles("single", moduleName, isModal) as any}
      components={{
        MenuList,
        DropdownIndicator,
      }}
      onChange={handleChange}
      isSearchable={typeable}
      {...(formatOptionLabel ? { formatOptionLabel } : {})}
    />
  );
};

export default function Select2Wrapper(props: Select2WrapperProps) {
  const isMobile = useIsMobile();

  if (props.isMulti) {
    return <MultiSelect {...props} />;
  }

  return renderSingleSelect(props, isMobile);
}