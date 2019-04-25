import { ValidationError } from 'yup';

export const isValidationError = (err: any): err is ValidationError => {
  if (!err || typeof err !== 'object') {
    return false;
  }
  return err.name === 'ValidationError';
};
