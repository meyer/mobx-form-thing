import { createElement, PropsWithChildren, ReactElement, useRef, useContext, createContext } from 'react';
import { getFormContext, FormContextObj, FormContextProps } from './getFormContext';

export const FormContext = createContext<FormContextObj<any>>(undefined as any);

export const useFormContext = <T extends object>() => useContext<FormContextObj<T>>(FormContext);

// This provider component abstracts away the FormDomain creation logic. We use a custom type def here
//   instead of React.FC because the `initialProps` type needs to be inferrable.
export const FormContextProvider = <T extends object>(
  props: PropsWithChildren<FormContextProps<T>>
): ReactElement | null => {
  const formDomainRef = useRef<FormContextObj<T>>();

  if (!formDomainRef.current) {
    formDomainRef.current = getFormContext(props);
  }

  return createElement(FormContext.Provider, { value: formDomainRef.current }, props.children);
};
