import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import { useFlatpickrMonthDropdown } from '@components/ui/useFlatpickrMonthDropdown';
import { ATTACHMENT_SIZE_OPTIONS } from '@constants/attachmentSizeOptions';
import dateIcon from '@images/date-icon-16.svg';
import { lazy, Suspense, useMemo, useRef } from 'react';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { EditRuleFormValues } from './editRule.schema';

const Flatpickr = lazy(() => import('react-flatpickr'));

interface EditRuleConditionsFieldsProps {
    control: Control<EditRuleFormValues>;
    contacts: any[];
}

const EditRuleConditionsFields = ({ control, contacts }: EditRuleConditionsFieldsProps) => {
    const mountFilterMonthDropdown = useFlatpickrMonthDropdown(0);
    const mountFilterMonthDropdownRef = useRef(mountFilterMonthDropdown);
    mountFilterMonthDropdownRef.current = mountFilterMonthDropdown;

    const datePickerOptions = useMemo(() => ({
        mode: 'range' as const,
        dateFormat: 'd-m-Y',
        allowInput: true,
        closeOnSelect: false,
        onReady: (_dates: Date[], _str: string, instance: any) => {
            mountFilterMonthDropdownRef.current(instance);
        },
        onChange: (dates: Date[], _str: string, instance: any) => {
            if (dates.length === 2) {
                instance.close();
            }
        },
    }), []);

    return (
        <>
            <div className="form-group form-row select2-profile">
                <label className="control-label">From</label>
                <Controller
                    name="from"
                    control={control}
                    render={({ field }) => (
                        <Select2Wrapper
                            value={field.value || []}
                            onChange={field.onChange}
                            options={contacts}
                            placeholder="Select or type to add"
                            isMulti={true}
                            isModal={true}
                            isEmail={true}
                        />
                    )}
                />
            </div>

            <div className="form-group form-row select2-profile">
                <label className="control-label">To</label>
                <Controller
                    name="to"
                    control={control}
                    render={({ field }) => (
                        <Select2Wrapper
                            value={field.value || []}
                            onChange={field.onChange}
                            options={contacts}
                            placeholder="Select or type to add"
                            isMulti={true}
                            isModal={true}
                            isEmail={true}
                        />
                    )}
                />
            </div>

            <div className="form-group form-row">
                <label className="control-label">Subject</label>
                <Controller
                    name="subject"
                    control={control}
                    render={({ field }) => (
                        <input
                            type="text"
                            className="form-control"
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                        />
                    )}
                />
            </div>

            <div className="form-group form-row">
                <label className="control-label">Attachment Size</label>
                <div className="input-control">
                    <Controller
                        name="attachmentSize"
                        control={control}
                        render={({ field }) => (
                            <Select2Wrapper
                                value={field.value || null}
                                onChange={(value) => field.onChange(value || undefined)}
                                options={[
                                    { label: 'Select one', value: '' },
                                    ...ATTACHMENT_SIZE_OPTIONS.map((opt) => ({
                                        label: opt.label,
                                        value: opt.value,
                                    })),
                                ]}
                                placeholder="Select one"
                                isMulti={false}
                                isModal={true}
                            />
                        )}
                    />
                </div>
            </div>

            <div className="form-group">
                <label className="control-label">Date</label>
                <div className="input-icon-add">
                    <img src={dateIcon} alt="" className="input-icon-1" />
                    <Controller
                        name="dateRange"
                        control={control}
                        render={({ field }) => (
                            <Suspense fallback={<input className="form-control" placeholder="Loading date picker..." readOnly />}>
                                <Flatpickr
                                    value={field.value as Date[] | undefined}
                                    onChange={(dates: Date[]) => field.onChange(dates)}
                                    options={datePickerOptions}
                                    className="form-control DateRangePickerStaticTop"
                                    placeholder="Select date range"
                                />
                            </Suspense>
                        )}
                    />
                </div>
            </div>
        </>
    );
};

export default EditRuleConditionsFields;
