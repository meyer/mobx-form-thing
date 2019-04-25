import { isValidationError } from './utils';
import { ReactChild } from 'react';
import { observable, action } from 'mobx';
import { ObjectSchema } from 'yup';

export interface FormStatus {
  appearance?: 'info' | 'warning' | 'danger' | 'success';
  message: ReactChild;
  hideAfter?: number;
}

export interface ValidationResult<T extends object> {
  isValid: boolean | null;
  status: FormStatus | null;
  errors: Partial<Record<keyof T, string>> | null;
}

interface PendingPromise<T> {
  state: 'pending';
  value: T;
}

interface FulfilledPromise<T> {
  state: 'fulfilled';
  value: T;
}

interface RejectedPromise<T> {
  state: 'rejected';
  value: T;
}

export type PromiseBasedObservable<T> = PendingPromise<T> | FulfilledPromise<T> | RejectedPromise<T>;

export const getValidationResultForValues = <T extends object>(
  schema: ObjectSchema<T>,
  values: T
): PromiseBasedObservable<ValidationResult<T>> => {
  const obj = observable.object<PromiseBasedObservable<ValidationResult<T>>>(
    {
      value: {
        errors: null,
        isValid: null,
        status: null,
      },
      state: 'pending',
    },
    undefined,
    { deep: false }
  );

  schema
    .validate(values, {
      // This option causes validation to stop upon first error. It defaults to true.
      //   We want validation to run for every field, so we disable it.
      abortEarly: false,
    })
    .then(handleValidationSuccess, handleValidationError)
    .catch(handleValidationError)
    .then(
      action((value: any) => {
        obj.value = value;
        obj.state = 'fulfilled';
      }),
      action(reason => {
        console.error(reason);
        obj.value = {
          errors: null,
          isValid: false,
          status: {
            appearance: 'danger',
            message: reason + '',
          },
        };
        obj.state = 'rejected';
      })
    );

  return obj;
};

const handleValidationSuccess = <T extends object>(): ValidationResult<T> => ({
  isValid: true,
  status: null,
  errors: null,
});

const handleValidationError = <T extends object>(err: unknown): ValidationResult<T> => {
  const errorObj: Partial<Record<keyof T | string, string>> = {};
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

  return {
    isValid: false,
    errors: errorObj,
    status: formStatus,
  };
};
