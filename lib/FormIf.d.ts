import { ReactElement, ReactNode } from 'react';
interface BaseFormIfProps<T extends object> {
    /**
     * Function that takes the current observable form values and returns a boolean
     * indicating whether or not the component's children should be rendered.
     */
    predicate: (values: T) => boolean;
}
interface FormIfFunctionProps<T extends object> extends BaseFormIfProps<T> {
    children: (predicateIsTrue: boolean) => ReactNode;
}
interface FormIfChildProps<T extends object> extends BaseFormIfProps<T> {
    children?: ReactNode;
}
declare type FormIfProps<T extends object> = FormIfFunctionProps<T> | FormIfChildProps<T>;
/**
 * This component runs the provided `predicate` function and renders the `children` only if the return value of the predicate function is `true`.
 *
 * If you would rather have access to the predicate value (to, say, render a different value for `true` and `false` cases),
 *   a child function can be passed that receives the predicate value and returns either a `ReactElement` or `null`.
 */
export declare const FormIf: <T extends object>({ predicate, children }: FormIfProps<T>) => ReactElement<any, string | ((props: any) => ReactElement<any, string | any | (new (props: any) => import("react").Component<any, any, any>)> | null) | (new (props: any) => import("react").Component<any, any, any>)> | null;
export {};
//# sourceMappingURL=FormIf.d.ts.map