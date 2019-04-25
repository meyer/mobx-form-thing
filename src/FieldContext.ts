import { createContext, useContext } from 'react';
import { FieldContextObj } from './FormDomain';
import { FormContext } from './FormContext';

export const FieldNameContext = createContext<string>(undefined as any);

export const useFieldContext = <T extends any = any>(fieldName?: string): FieldContextObj<T> => {
  const formContext = useContext(FormContext);
  const ctxFieldName = useContext(FieldNameContext);

  // Allow the user to override the fieldName (hmmmmmmmm...)
  return formContext.getFieldContextObject(fieldName || ctxFieldName);
};
