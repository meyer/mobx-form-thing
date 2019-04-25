import { ReactChild } from 'react';
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
export declare type PromiseBasedObservable<T> = PendingPromise<T> | FulfilledPromise<T> | RejectedPromise<T>;
export declare const getValidationResultForValues: <T extends object>(schema: ObjectSchema<T>, values: T) => PromiseBasedObservable<ValidationResult<T>>;
export {};
//# sourceMappingURL=validationHandlers.d.ts.map