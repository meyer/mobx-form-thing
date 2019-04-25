import { PropsWithChildren, ReactElement } from 'react';
import { FormContextObj, FormContextProps } from './getFormContext';
export declare const FormContext: import("react").Context<FormContextObj<any>>;
export declare const useFormContext: <T extends object>() => FormContextObj<T>;
export declare const FormContextProvider: <T extends object>(props: PropsWithChildren<FormContextProps<T>>) => ReactElement<any, string | ((props: any) => ReactElement<any, string | any | (new (props: any) => import("react").Component<any, any, any>)> | null) | (new (props: any) => import("react").Component<any, any, any>)> | null;
//# sourceMappingURL=FormContext.d.ts.map