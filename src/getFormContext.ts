import { computed, observable, toJS, IObservableObject, action } from 'mobx';
import React from 'react';
import { ObjectSchema } from 'yup';
import {
  FormStatus,
  ValidationResult,
  PromiseBasedObservable,
  getValidationResultForValues,
} from './validationHandlers';

type ValidationState = 'warning' | 'success' | 'error';

// These field props are usually handled by methods and values on the field context.
type OmittedProps = 'validationState' | 'onChange' | 'onBlur' | 'name' | 'value' | 'defaultValue';

/** Exclude common handled field props from an interface */
export type OmitFieldProps<T> = Pick<T, Exclude<keyof T, OmittedProps>>;

/** Handler passed as the `onSubmit` prop */
export type FormSubmitHandler<T extends object> = (values: T) => Promise<FormStatus | undefined>;

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

export function getFormContext<T extends Record<string, any>>(props: FormContextProps<T>): FormContextObj<T> {
  const schema: ObjectSchema<T> = props.validationSchema;
  const initialValues: T = toJS(props.initialValues);
  const userHandleSubmit: FormSubmitHandler<T> = props.onSubmit;

  const fieldContextObjs: Record<string, FieldContextObj<any>> = {};

  const formState = observable.object<FormState<T>>(
    {
      values: Object.assign({}, initialValues),
      isSubmitting: false,
      touchedFields: {},

      get validationResult(): PromiseBasedObservable<ValidationResult<T>> {
        return getValidationResultForValues(schema, this.values);
      },

      get isValid(): null | boolean {
        return this.validationResult.value.isValid;
      },

      get isValidating(): boolean {
        return this.validationResult.state === 'pending';
      },

      get formStatus(): FormStatus | null {
        return this.validationResult.value.status;
      },

      get errors(): Partial<Record<keyof T, string>> | null {
        return this.validationResult.value.errors;
      },

      get isDirty() {
        return Object.is(initialValues, this.values);
      },

      setField<K extends keyof T>(field: K, value: T[K]): void {
        if (this.errors) {
          this.errors[field] = undefined;
        }
        this.values[field] = value;
      },

      setTouched<K extends keyof T>(field: K, touched: boolean = true): void {
        if (this.touchedFields[field] !== touched) {
          this.touchedFields[field] = touched;
        }
        if (touched && this.errors) {
          this.errors[field] = undefined;
        }
      },

      handleReset(): void {
        this.values = Object.assign({}, initialValues);
      },

      handleSubmit(e) {
        e.preventDefault();

        if (this.isSubmitting) {
          console.error('Form is already submitting');
          return;
        }

        this.isSubmitting = true;

        const handleError = (err: any): FormStatus => ({
          appearance: 'danger',
          message: err + '',
        });

        userHandleSubmit(toJS(this.values))
          // convert error to FormStatus
          .then(undefined, handleError)
          .catch(handleError)
          // set status
          .then(
            action<(s: FormStatus | undefined) => void>('handleSubmit async', formStatus => {
              this.formStatus = formStatus || null;
              const hideAfter = formStatus && formStatus.hideAfter;
              if (hideAfter) {
                setTimeout(
                  action('handleSubmit hideAfter', () => {
                    this.formStatus = null;
                    this.isSubmitting = false;
                  }),
                  hideAfter
                );
              } else {
                this.isSubmitting = false;
              }
            })
          );
      },
    },
    {
      isDirty: computed,
      setField: action,
      setTouched: action,
      handleReset: action,
      handleSubmit: action,
    }
  );

  const getFieldContextObject = <K extends any = any>(name: Extract<keyof T, string>): FieldContextObj<K> => {
    if (!fieldContextObjs[name]) {
      const handleValueChange = (newValue: any) => formState.setField(name, newValue);

      const handleChangeEvent: React.ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      > = e => formState.setField(name, e.target.value as any);

      const handleCheckboxChange: React.ChangeEventHandler<HTMLInputElement> = e =>
        formState.setField(name, e.target.checked as any);

      const handleFocus = () => formState.setTouched(name);

      const handleBlur = () => formState.setTouched(name);

      fieldContextObjs[name] = observable.object(
        {
          name,

          handleFocus,
          handleBlur,
          handleCheckboxChange,
          handleChangeEvent,
          handleValueChange,

          // we use computed values here so that the individual values can be observed
          get error(): string | undefined {
            // const isTouched = ret.touchedFields[name];
            return (formState.errors && formState.errors[name]) || undefined;
          },

          get formIsSubmitting(): boolean {
            return formState.isSubmitting;
          },

          get isTouched(): boolean {
            return !!formState.touchedFields[name];
          },

          get validationState(): ValidationState | undefined {
            const isTouched = formState.touchedFields[name];
            const hasError = formState.errors && !!formState.errors[name];

            if (!isTouched) {
              return hasError ? 'warning' : undefined;
            }

            return hasError ? 'error' : 'success';
          },

          get value(): T {
            return formState.values[name];
          },
        },
        {
          error: computed,
          formIsSubmitting: computed,
          isTouched: computed,
          validationState: computed,
          value: computed,
        },
        {
          name: `fieldContext:${name}`,
          deep: false,
        }
      );
    }

    return fieldContextObjs[name];
  };

  return { formState, getFieldContextObject };
}
