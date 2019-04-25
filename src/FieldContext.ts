import { createContext, useContext } from 'react';
import { FormContext } from './FormContext';
import { FieldContextObj } from './getFormContext';

export const FieldNameContext = createContext<string>(undefined as any);

export const useFieldContext = <T extends any = any>(fieldName?: string): FieldContextObj<T> => {
  const { getFieldContextObject } = useContext(FormContext);
  const ctxFieldName = useContext(FieldNameContext);

  // Allow the user to override the fieldName (hmmmmmmmm...)
  return getFieldContextObject(fieldName || ctxFieldName);
};
