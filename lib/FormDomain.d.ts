import { IComputedValue } from 'mobx';
import React from 'react';
import { ReactChild } from 'react';
import { ObjectSchema } from 'yup';
interface FormStatus {
    appearance?: 'info' | 'warning' | 'danger' | 'success';
    message: ReactChild;
    hideAfter?: number;
}
declare type OmittedProps = 'validationState' | 'onChange' | 'onBlur' | 'name' | 'value' | 'defaultValue';
/** Exclude common handled field props from an interface */
export declare type OmitFieldProps<T> = Pick<T, Exclude<keyof T, OmittedProps>>;
/** Handler passed as the `onSubmit` prop */
export declare type SubmitHandler<T extends object> = (values: T) => Promise<FormStatus | undefined>;
export interface FormDomainProps<T extends object> {
    initialValues: T;
    validationSchema: ObjectSchema<T>;
    onSubmit: SubmitHandler<T>;
}
export interface FieldContextObj<T extends any> {
    name: string;
    handleFocus: () => void;
    handleBlur: () => void;
    handleCheckboxChange: React.ChangeEventHandler<HTMLInputElement>;
    handleChangeEvent: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
    handleValueChange: (newValue: T) => void;
    error: IComputedValue<string | undefined>;
    formIsSubmitting: IComputedValue<boolean>;
    isTouched: IComputedValue<boolean | undefined>;
    validationState: IComputedValue<'error' | 'warning' | 'success' | undefined>;
    value: IComputedValue<T>;
}
export declare class FormDomain<T extends Record<string, any>> {
    constructor(props: FormDomainProps<T>);
    readonly errorMap: import("mobx").ObservableMap<keyof T, string>;
    readonly touchedFields: import("mobx").ObservableMap<keyof T, boolean>;
    readonly userHandleSubmit: SubmitHandler<T>;
    private validationCounter;
    private readonly initialValues;
    private readonly schema;
    private readonly fieldContextObjs;
    fieldValues: T;
    formIsSubmitting: boolean;
    formIsValid: boolean | null;
    formIsValidating: boolean;
    formStatus: FormStatus | null;
    readonly formIsDirty: boolean;
    getFieldContextObject: <K extends any = any>(name: Extract<keyof T, string>) => FieldContextObj<K>;
    handleSubmit: React.FormEventHandler<HTMLFormElement>;
    handleReset: () => void;
    validate: () => Promise<boolean | null>;
    setField: <K extends keyof T>(field: K, value: T[K]) => void;
    setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
}
export {};
//# sourceMappingURL=FormDomain.d.ts.map