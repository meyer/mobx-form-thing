import { action, computed, observable, runInAction, toJS, IComputedValue, decorate } from 'mobx';
import React from 'react';
import { ReactChild } from 'react';
import { ObjectSchema } from 'yup';
import { isValidationError } from './utils';

interface FormStatus {
  appearance?: 'info' | 'warning' | 'danger' | 'success';
  message: ReactChild;
  hideAfter?: number;
}

type ValidationState = 'warning' | 'success' | 'error';

// These field props are usually handled by methods and values on the field context.
type OmittedProps = 'validationState' | 'onChange' | 'onBlur' | 'name' | 'value' | 'defaultValue';

/** Exclude common handled field props from an interface */
export type OmitFieldProps<T> = Pick<T, Exclude<keyof T, OmittedProps>>;

/** Handler passed as the `onSubmit` prop */
export type SubmitHandler<T extends object> = (values: T) => Promise<FormStatus | undefined>;

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

export class FormDomain<T extends Record<string, any>> {
  constructor(props: FormDomainProps<T>) {
    this.schema = props.validationSchema;
    this.initialValues = toJS(props.initialValues);
    this.userHandleSubmit = props.onSubmit;

    // using an observable object instead of observable map because:
    // - observable.map value types are weak
    // - yup expects an object when validating, so we'd be converting back and forth from map to object
    this.fieldValues = Object.assign({}, this.initialValues);

    // NOTE(meyer) the validate function call will never throw (exceptions are all handled internally)
    // tslint:disable-next-line: no-floating-promises
    this.validate();
  }

  public readonly errorMap = observable.map<keyof T, string>(undefined, {
    name: 'FormDomain.errorMap',
  });
  public readonly touchedFields = observable.map<keyof T, boolean>(undefined, {
    name: 'FormDomain.touchedFields',
  });
  public readonly userHandleSubmit: SubmitHandler<T>;

  private validationCounter = 0;
  private readonly initialValues: T;
  private readonly schema: ObjectSchema<T>;
  private readonly fieldContextObjs: Record<string, FieldContextObj<any>> = {};

  public fieldValues: T;
  public formIsSubmitting = false;
  public formIsValid: boolean | null = null;
  public formIsValidating = false;
  public formStatus: FormStatus | null = null;

  public get formIsDirty() {
    return Object.is(this.initialValues, this.fieldValues);
  }

  public getFieldContextObject = <K extends any = any>(name: Extract<keyof T, string>): FieldContextObj<K> => {
    if (!this.fieldContextObjs[name]) {
      const handleValueChange = (newValue: any) => this.setField(name, newValue);

      const handleChangeEvent: React.ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      > = e => this.setField(name, e.target.value as any);

      const handleCheckboxChange: React.ChangeEventHandler<HTMLInputElement> = e =>
        this.setField(name, e.target.checked as any);

      const handleFocus = () => this.setTouched(name);

      const handleBlur = () => this.setTouched(name);

      this.fieldContextObjs[name] = {
        name,

        handleFocus,
        handleBlur,
        handleCheckboxChange,
        handleChangeEvent,
        handleValueChange,

        // we use computed values here so that the individual values can be observed
        error: computed(() => (this.touchedFields.has(name) ? this.errorMap.get(name) : undefined), { name: 'error' }),
        formIsSubmitting: computed(() => this.formIsSubmitting),
        isTouched: computed(() => this.touchedFields.has(name), {
          name: 'isTouched',
        }),
        validationState: computed<ValidationState | undefined>(
          () => {
            const isTouched = this.touchedFields.has(name);
            const hasError = this.errorMap.has(name);

            if (!isTouched) {
              return hasError ? 'warning' : undefined;
            }

            return hasError ? 'error' : 'success';
          },
          { name: 'validationState' }
        ),
        value: computed(() => this.fieldValues[name], { name: 'value' }),
      };
    }

    return this.fieldContextObjs[name];
  };

  public handleSubmit: React.FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault();

    if (this.formIsSubmitting) {
      console.error('Form is already submitting');
      return;
    }
    this.formIsSubmitting = true;

    const handleError = (err: any): FormStatus => {
      return {
        appearance: 'danger',
        message: err + '',
      };
    };

    this.userHandleSubmit(toJS(this.fieldValues))
      // handle errors
      .then(undefined, handleError)
      .catch(handleError)
      // set status
      .then(formStatus => {
        runInAction('handleSubmit async', () => {
          if (formStatus && formStatus.hideAfter) {
            const { hideAfter } = formStatus;
            this.formStatus = formStatus;
            setTimeout(() => {
              runInAction('handleSubmit hideAfter', () => {
                this.formStatus = null;
                this.formIsSubmitting = false;
              });
            }, hideAfter);
          } else {
            this.formStatus = formStatus || null;
            this.formIsSubmitting = false;
          }
        });
      });
  };

  public handleReset = (): void => {
    this.fieldValues = Object.assign({}, this.initialValues);
  };

  public validate = (): Promise<boolean | null> => {
    this.formIsValidating = true;
    this.formIsValid = null;
    this.formStatus = null;

    const counter = ++this.validationCounter;

    const handleValidationError = (err: unknown): boolean | null => {
      if (this.validationCounter !== counter) {
        return null;
      }

      console.log(err);

      const errorObj: Record<string, string> = {};
      let formStatus: FormStatus | null = null;

      if (isValidationError(err)) {
        if (err.inner.length === 0) {
          errorObj[err.path] = err.message;
        } else {
          for (const innerErr of err.inner) {
            if (innerErr.path === '') {
              formStatus = {
                appearance: 'danger',
                message: innerErr.message,
              };
            } else {
              errorObj[innerErr.path] = innerErr.message;
            }
          }
        }
      } else {
        // treat non-ValidationErrors as general (not field-specific) errors
        formStatus = {
          appearance: 'danger',
          message: err + '',
        };
      }

      runInAction('validate failure', () => {
        this.formIsValidating = false;
        this.formIsValid = false;
        this.formStatus = formStatus;
        this.errorMap.replace(errorObj);
      });

      return false;
    };

    return this.schema
      .validate(this.fieldValues, {
        // This option causes validation to stop upon first error. It defaults to true.
        //   We want validation to run for every field, so we disable it.
        abortEarly: false,
      })
      .then(() => {
        // this is gross but it's easier than using object equality
        if (this.validationCounter !== counter) {
          return null;
        }

        runInAction('validate success', () => {
          this.formIsValid = true;
          this.formIsValidating = false;
        });

        return true;
      }, handleValidationError)
      .catch(handleValidationError);
  };

  public setField = <K extends keyof T>(field: K, value: T[K]): void => {
    // NOTE(meyer) the validate function call will never throw (exceptions are all handled internally)
    // tslint:disable-next-line: no-floating-promises
    this.errorMap.delete(field);
    this.validate();
    this.fieldValues[field] = value;
  };

  public setTouched = <K extends keyof T>(field: K, touched: boolean = true): void => {
    if (this.touchedFields.get(field) !== touched) {
      this.touchedFields.set(field, touched);
    }
    if (touched) {
      this.errorMap.delete(field);
    }
    // NOTE(meyer) the validate function call will never throw (exceptions are all handled internally)
    // tslint:disable-next-line: no-floating-promises
    this.validate();
  };
}

// using decorate here because decorator output is hella nasty
decorate(FormDomain, {
  formIsDirty: computed,

  handleSubmit: action,
  handleReset: action,
  validate: action,
  setField: action,
  setTouched: action,

  fieldValues: observable,
  formIsSubmitting: observable,
  formIsValid: observable,
  formIsValidating: observable,
  formStatus: observable,
});
