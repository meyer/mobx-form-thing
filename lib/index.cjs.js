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

const getValidationResultForValues = (schema, values) => {
  const obj = mobx.observable.object({
    value: {
      errors: null,
      isValid: null,
      status: null
    },
    state: 'pending'
  }, undefined, {
    deep: false
  });
  schema.validate(values, {
    // This option causes validation to stop upon first error. It defaults to true.
    //   We want validation to run for every field, so we disable it.
    abortEarly: false
  }).then(handleValidationSuccess, handleValidationError).catch(handleValidationError).then(mobx.action(value => {
    obj.value = value;
    obj.state = 'fulfilled';
  }), mobx.action(reason => {
    console.error(reason);
    obj.value = {
      errors: null,
      isValid: false,
      status: {
        appearance: 'danger',
        message: reason + ''
      }
    };
    obj.state = 'rejected';
  }));
  return obj;
};

const handleValidationSuccess = () => ({
  isValid: true,
  status: null,
  errors: null
});

const handleValidationError = err => {
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

  return {
    isValid: false,
    errors: errorObj,
    status: formStatus
  };
};

function getFormContext(props) {
  const schema = props.validationSchema;
  const initialValues = mobx.toJS(props.initialValues);
  const userHandleSubmit = props.onSubmit;
  const fieldContextObjs = {};
  const formState = mobx.observable.object({
    values: Object.assign({}, initialValues),
    isSubmitting: false,
    touchedFields: {},

    get validationResult() {
      return getValidationResultForValues(schema, this.values);
    },

    get isValid() {
      return this.validationResult.value.isValid;
    },

    get isValidating() {
      return this.validationResult.state === 'pending';
    },

    get formStatus() {
      return this.validationResult.value.status;
    },

    get errors() {
      return this.validationResult.value.errors;
    },

    get isDirty() {
      return Object.is(initialValues, this.values);
    },

    setField(field, value) {
      if (this.errors) {
        this.errors[field] = undefined;
      }

      this.values[field] = value;
    },

    setTouched(field, touched = true) {
      if (this.touchedFields[field] !== touched) {
        this.touchedFields[field] = touched;
      }

      if (touched && this.errors) {
        this.errors[field] = undefined;
      }
    },

    handleReset() {
      this.values = Object.assign({}, initialValues);
    },

    handleSubmit(e) {
      e.preventDefault();

      if (this.isSubmitting) {
        console.error('Form is already submitting');
        return;
      }

      this.isSubmitting = true;

      const handleError = err => ({
        appearance: 'danger',
        message: err + ''
      });

      userHandleSubmit(mobx.toJS(this.values)) // convert error to FormStatus
      .then(undefined, handleError).catch(handleError) // set status
      .then(mobx.action('handleSubmit async', formStatus => {
        this.formStatus = formStatus || null;
        const hideAfter = formStatus && formStatus.hideAfter;

        if (hideAfter) {
          setTimeout(mobx.action('handleSubmit hideAfter', () => {
            this.formStatus = null;
            this.isSubmitting = false;
          }), hideAfter);
        } else {
          this.isSubmitting = false;
        }
      }));
    }

  }, {
    validationResult: mobx.computed,
    isValid: mobx.computed,
    isValidating: mobx.computed,
    formStatus: mobx.computed,
    errors: mobx.computed,
    isDirty: mobx.computed,
    setField: mobx.action,
    setTouched: mobx.action,
    handleReset: mobx.action,
    handleSubmit: mobx.action
  });

  const getFieldContextObject = name => {
    if (!fieldContextObjs[name]) {
      const handleValueChange = newValue => formState.setField(name, newValue);

      const handleChangeEvent = e => formState.setField(name, e.target.value);

      const handleCheckboxChange = e => formState.setField(name, e.target.checked);

      const handleFocus = () => formState.setTouched(name);

      const handleBlur = () => formState.setTouched(name);

      fieldContextObjs[name] = mobx.observable.object({
        name,
        handleFocus,
        handleBlur,
        handleCheckboxChange,
        handleChangeEvent,
        handleValueChange,

        get error() {
          // const isTouched = ret.touchedFields[name];
          return formState.errors && formState.errors[name] || undefined;
        },

        get formIsSubmitting() {
          return formState.isSubmitting;
        },

        get isTouched() {
          return !!formState.touchedFields[name];
        },

        get validationState() {
          if (!this.isTouched) {
            return this.error ? 'warning' : undefined;
          }

          return this.error ? 'error' : 'success';
        },

        get value() {
          return formState.values[name];
        }

      }, {
        error: mobx.computed,
        formIsSubmitting: mobx.computed,
        isTouched: mobx.computed,
        validationState: mobx.computed,
        value: mobx.computed
      }, {
        name: "fieldContext:" + name,
        deep: false
      });
    }

    return fieldContextObjs[name];
  };

  return {
    formState,
    getFieldContextObject
  };
}

const FormContext = react.createContext(undefined);

if (process.env.NODE_ENV === "development") {
  FormContext.displayName = "FormContext";
}

const useFormContext = () => react.useContext(FormContext); // This provider component abstracts away the FormDomain creation logic. We use a custom type def here
//   instead of React.FC because the `initialProps` type needs to be inferrable.

const FormContextProvider = props => {
  const formDomainRef = react.useRef();

  if (!formDomainRef.current) {
    formDomainRef.current = getFormContext(props);
  }

  return react.createElement(FormContext.Provider, {
    value: formDomainRef.current
  }, props.children);
};

const FieldNameContext = react.createContext(undefined);

if (process.env.NODE_ENV === "development") {
  FieldNameContext.displayName = "FieldNameContext";
}

const useFieldContext = fieldName => {
  const {
    getFieldContextObject
  } = react.useContext(FormContext);
  const ctxFieldName = react.useContext(FieldNameContext); // Allow the user to override the fieldName (hmmmmmmmm...)

  return getFieldContextObject(fieldName || ctxFieldName);
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
  const {
    formState
  } = useFormContext(); // since fieldValues is an observable object, we can utilise a computed to prevent unnecessary re-renders

  const computedPredicate = react.useMemo(() => mobx.computed(() => predicate(formState.values)), [predicate]);
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
