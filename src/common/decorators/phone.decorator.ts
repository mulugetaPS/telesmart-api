import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { TransformFnParams, Transform } from 'class-transformer';

export function EthiopianPhone(validationOptions?: ValidationOptions) {
  return function (target: object, propertyKey: string | symbol) {
    // Validation
    registerDecorator({
      name: 'EthiopianPhone',
      target: target.constructor,
      propertyName: propertyKey.toString(),
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && /^(251|0)\d{9}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Ethiopian phone number starting with +251 or 09`;
        },
      },
    });

    // Transformation: always convert 09XXXXXXXX -> 251XXXXXXXX
    Transform(({ value }: TransformFnParams) => {
      if (typeof value === 'string' && value.startsWith('0')) {
        return '251' + value.slice(1);
      }
      if (typeof value === 'string') {
        return value;
      }
      return '';
    })(target, propertyKey);
  };
}
