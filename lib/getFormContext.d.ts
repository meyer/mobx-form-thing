import { IObservableObject } from 'mobx';
import React from 'react';
import { ObjectSchema } from 'yup';
import { FormStatus, ValidationResult, PromiseBasedObservable } from './validationHandlers';
declare type OmittedProps = 'validationState' | 'onChange' | 'onBlur' | 'name' | 'value' | 'defaultValue';
/** Exclude common handled field props from an interface */
export declare type OmitFieldProps<T> = Pick<T, Exclude<keyof T, OmittedProps>>;
/** Handler passed as the `onSubmit` prop */
export declare type FormSubmitHandler<T extends object> = (values: T) => Promise<FormStatus | undefined>;
export interface FormContextProps<T extends object> {
    initialValues: T;
    validationSchema: ObjectSchema<T>;
    onSubmit: FormSubmitHandler<T>;
}
export interface FieldContextObj<T extends any> {
    name: string;
    handleFocus: () => void;
    handleBlur: () => void;
    handleCheckboxChange: React.ChangeEventHandler<HTMLInputElement>;
    handleChangeEvent: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
    handleValueChange: (newValue: T) => void;
    error: string | undefined;
    formIsSubmitting: boolean;
    isTouched: boolean | undefined;
    validationState: 'error' | 'warning' | 'success' | undefined;
    value: T;
}
interface FormState<T extends object> {
    errors: Partial<Record<keyof T, string | undefined>> | null;
    formStatus: FormStatus | null;
    isDirty: boolean;
    isSubmitting: boolean;
    isValid: boolean | null;
    isValidating: boolean;
    setField<K extends keyof T>(field: K, value: T[K]): void;
    setTouched<K extends keyof T>(field: K, touched?: boolean): void;
    touchedFields: Partial<Record<keyof T, boolean>>;
    handleReset: () => void;
    handleSubmit: React.FormEventHandler<HTMLFormElement>;
    validationResult: PromiseBasedObservable<ValidationResult<T>>;
    values: T;
}
export interface FormContextObj<T extends object> {
    formState: FormState<T> & IObservableObject;
    getFieldContextObject: <K extends any = any>(name: Extract<keyof T, string>) => FieldContextObj<K>;
}
export declare function getFormContext<T extends Record<string, any>>(props: FormContextProps<T>): FormContextObj<T>;
export {};
//# sourceMappingURL=getFormContext.d.ts.map