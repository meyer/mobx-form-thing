'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var react = require('react');
var mobx = require('mobx');
var mobxReactLite = require('mobx-react-lite');

const isValidationError = err => {
  if (!err || typeof err !== 'object') {
    return false;
  }

  return err.name === 'ValidationError';
};

class FormDomain {
  constructor(props) {
    this.errorMap = mobx.observable.map(undefined, {
      name: 'FormDomain.errorMap'
    });
    this.touchedFields = mobx.observable.map(undefined, {
      name: 'FormDomain.touchedFields'
    });
    this.validationCounter = 0;
    this.fieldContextObjs = {};
    this.formIsSubmitting = false;
    this.formIsValid = null;
    this.formIsValidating = false;
    this.formStatus = null;

    this.getFieldContextObject = name => {
      if (!this.fieldContextObjs[name]) {
        const handleValueChange = newValue => this.setField(name, newValue);

        const handleChangeEvent = e => this.setField(name, e.target.value);

        const handleCheckboxChange = e => this.setField(name, e.target.checked);

        const handleFocus = () => this.setTouched(name);

        const handleBlur = () => this.setTouched(name);

        this.fieldContextObjs[name] = {
          name,
          handleFocus,
          handleBlur,
          handleCheckboxChange,
          handleChangeEvent,
          handleValueChange,
          // we use computed values here so that the individual values can be observed
          error: mobx.computed(() => this.touchedFields.has(name) ? this.errorMap.get(name) : undefined, {
            name: 'error'
          }),
          formIsSubmitting: mobx.computed(() => this.formIsSubmitting),
          isTouched: mobx.computed(() => this.touchedFields.has(name), {
            name: 'isTouched'
          }),
          validationState: mobx.computed(() => {
            const isTouched = this.touchedFields.has(name);
            const hasError = this.errorMap.has(name);

            if (!isTouched) {
              return hasError ? 'warning' : undefined;
            }

            return hasError ? 'error' : 'success';
          }, {
            name: 'validationState'
          }),
          value: mobx.computed(() => this.fieldValues[name], {
            name: 'value'
          })
        };
      }

      return this.fieldContextObjs[name];
    };

    this.handleSubmit = e => {
      e.preventDefault();

      if (this.formIsSubmitting) {
        console.error('Form is already submitting');
        return;
      }

      this.formIsSubmitting = true;

      const handleError = err => {
        return {
          appearance: 'danger',
          message: err + ''
        };
      };

      this.userHandleSubmit(mobx.toJS(this.fieldValues)) // handle errors
      .then(undefined, handleError).catch(handleError) // set status
      .then(formStatus => {
        mobx.runInAction('handleSubmit async', () => {
          if (formStatus && formStatus.hideAfter) {
            const {
              hideAfter
            } = formStatus;
            this.formStatus = formStatus;
            setTimeout(() => {
              mobx.runInAction('handleSubmit hideAfter', () => {
                this.formStatus = null;
                this.formIsSubmitting = false;
              });
            }, hideAfter);
          } else {
            this.formStatus = formStatus || null;
            this.formIsSubmitting = false;
          }
        });
      });
    };

    this.handleReset = () => {
      this.fieldValues = Object.assign({}, this.initialValues);
    };

    this.validate = () => {
      this.formIsValidating = true;
      this.formIsValid = null;
      this.formStatus = null;
      const counter = ++this.validationCounter;

      const handleValidationError = err => {
        if (this.validationCounter !== counter) {
          return null;
        }

        console.log(err);
        const errorObj = {};
        let formStatus = null;

        if (isValidationError(err)) {
          if (err.inner.length === 0) {
            errorObj[err.path] = err.message;
          } else {
            for (const innerErr of err.inner) {
              if (innerErr.path === '') {
                formStatus = {
                  appearance: 'danger',
                  message: innerErr.message
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
            message: err + ''
          };
        }

        mobx.runInAction('validate failure', () => {
          this.formIsValidating = false;
          this.formIsValid = false;
          this.formStatus = formStatus;
          this.errorMap.replace(errorObj);
        });
        return false;
      };

      return this.schema.validate(this.fieldValues, {
        // This option causes validation to stop upon first error. It defaults to true.
        //   We want validation to run for every field, so we disable it.
        abortEarly: false
      }).then(() => {
        // this is gross but it's easier than using object equality
        if (this.validationCounter !== counter) {
          return null;
        }

        mobx.runInAction('validate success', () => {
          this.formIsValid = true;
          this.formIsValidating = false;
        });
        return true;
      }, handleValidationError).catch(handleValidationError);
    };

    this.setField = (field, value) => {
      // NOTE(meyer) the validate function call will never throw (exceptions are all handled internally)
      // tslint:disable-next-line: no-floating-promises
      this.errorMap.delete(field);
      this.validate();
      this.fieldValues[field] = value;
    };

    this.setTouched = (field, touched = true) => {
      if (this.touchedFields.get(field) !== touched) {
        this.touchedFields.set(field, touched);
      }

      if (touched) {
        this.errorMap.delete(field);
      } // NOTE(meyer) the validate function call will never throw (exceptions are all handled internally)
      // tslint:disable-next-line: no-floating-promises


      this.validate();
    };

    this.schema = props.validationSchema;
    this.initialValues = mobx.toJS(props.initialValues);
    this.userHandleSubmit = props.onSubmit; // using an observable object instead of observable map because:
    // - observable.map value types are weak
    // - yup expects an object when validating, so we'd be converting back and forth from map to object

    this.fieldValues = Object.assign({}, this.initialValues); // NOTE(meyer) the validate function call will never throw (exceptions are all handled internally)
    // tslint:disable-next-line: no-floating-promises

    this.validate();
  }

  get formIsDirty() {
    return Object.is(this.initialValues, this.fieldValues);
  }

} // using decorate here because decorator output is hella nasty

mobx.decorate(FormDomain, {
  formIsDirty: mobx.computed,
  handleSubmit: mobx.action,
  handleReset: mobx.action,
  validate: mobx.action,
  setField: mobx.action,
  setTouched: mobx.action,
  fieldValues: mobx.observable,
  formIsSubmitting: mobx.observable,
  formIsValid: mobx.observable,
  formIsValidating: mobx.observable,
  formStatus: mobx.observable
});

const FormContext = react.createContext(undefined);
const useFormContext = () => react.useContext(FormContext); // This provider component abstracts away the FormDomain creation logic. We use a custom type def here
//   instead of React.FC because the `initialProps` type needs to be inferrable.

const FormContextProvider = props => {
  const formDomainRef = react.useRef();

  if (!formDomainRef.current) {
    formDomainRef.current = new FormDomain(props);
  }

  return react.createElement(FormContext.Provider, {
    value: formDomainRef.current
  }, props.children);
};

const FieldNameContext = react.createContext(undefined);
const useFieldContext = fieldName => {
  const formContext = react.useContext(FormContext);
  const ctxFieldName = react.useContext(FieldNameContext); // Allow the user to override the fieldName (hmmmmmmmm...)

  return formContext.getFieldContextObject(fieldName || ctxFieldName);
};

/**
 * This component runs the provided `predicate` function and renders the `children` only if the return value of the predicate function is `true`.
 *
 * If you would rather have access to the predicate value (to, say, render a different value for `true` and `false` cases),
 *   a child function can be passed that receives the predicate value and returns either a `ReactElement` or `null`.
 */

const FormIf = ({
  predicate,
  children
}) => {
  const formContext = useFormContext(); // since fieldValues is an observable object, we can utilise a computed to prevent unnecessary re-renders

  const computedPredicate = react.useMemo(() => mobx.computed(() => predicate(formContext.fieldValues)), [predicate]);
  return mobxReactLite.useObserver(() => {
    const predicateIsTrue = computedPredicate.get();

    if (typeof children === 'function') {
      return children(predicateIsTrue);
    }

    return predicateIsTrue ? children : null;
  });
};

exports.FieldNameContext = FieldNameContext;
exports.FormContextProvider = FormContextProvider;
exports.FormIf = FormIf;
exports.useFieldContext = useFieldContext;
exports.useFormContext = useFormContext;
//# sourceMappingURL=index.cjs.js.map
