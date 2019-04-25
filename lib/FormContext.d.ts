import { PropsWithChildren, ReactElement } from 'react';
import { FormDomain, FormDomainProps } from './FormDomain';
export declare const FormContext: import("react").Context<FormDomain<any>>;
export declare const useFormContext: <T extends object>() => FormDomain<T>;
export declare const FormContextProvider: <T extends object>(props: PropsWithChildren<FormDomainProps<T>>) => ReactElement<any, string | ((props: any) => ReactElement<any, string | any | (new (props: any) => import("react").Component<any, any, any>)> | null) | (new (props: any) => import("react").Component<any, any, any>)> | null;
//# sourceMappingURL=FormContext.d.ts.map