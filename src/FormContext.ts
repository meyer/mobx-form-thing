import { createElement, PropsWithChildren, ReactElement, useRef, useContext, createContext } from 'react';
import { FormDomain, FormDomainProps } from './FormDomain';

export const FormContext = createContext<FormDomain<any>>(undefined as any);

export const useFormContext = <T extends object>() => useContext<FormDomain<T>>(FormContext);

// This provider component abstracts away the FormDomain creation logic. We use a custom type def here
//   instead of React.FC because the `initialProps` type needs to be inferrable.
export const FormContextProvider = <T extends object>(
  props: PropsWithChildren<FormDomainProps<T>>
): ReactElement | null => {
  const formDomainRef = useRef<FormDomain<T>>();

  if (!formDomainRef.current) {
    formDomainRef.current = new FormDomain(props);
  }

  return createElement(FormContext.Provider, { value: formDomainRef.current }, props.children);
};
