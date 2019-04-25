import { useObserver } from 'mobx-react-lite';
import { ReactElement, ReactNode, useMemo } from 'react';
import { computed } from 'mobx';
import { useFormContext } from './FormContext';

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

type FormIfProps<T extends object> = FormIfFunctionProps<T> | FormIfChildProps<T>;

/**
 * This component runs the provided `predicate` function and renders the `children` only if the return value of the predicate function is `true`.
 *
 * If you would rather have access to the predicate value (to, say, render a different value for `true` and `false` cases),
 *   a child function can be passed that receives the predicate value and returns either a `ReactElement` or `null`.
 */
export const FormIf = <T extends object>({ predicate, children }: FormIfProps<T>): ReactElement | null => {
  const formContext = useFormContext<T>();
  // since fieldValues is an observable object, we can utilise a computed to prevent unnecessary re-renders
  const computedPredicate = useMemo(() => computed(() => predicate(formContext.fieldValues)), [predicate]);

  return useObserver(() => {
    const predicateIsTrue = computedPredicate.get();
    if (typeof children === 'function') {
      return children(predicateIsTrue);
    }
    return predicateIsTrue ? children : null;
  });
};
