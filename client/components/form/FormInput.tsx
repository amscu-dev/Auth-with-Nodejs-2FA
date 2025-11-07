import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { forwardRef } from "react";

type FormInputProps = {
  name: string;
  placeholder: string;
  label?: string;
  labelClass?: string;
  inputClass?: string;
  errorClass?: string;
  formItemClass?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      name,
      placeholder,
      label,
      labelClass,
      inputClass,
      errorClass,
      formItemClass,
      ...props
    }: FormInputProps,
    ref
  ) => {
    const { control } = useFormContext();
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className={formItemClass}>
            {label ? (
              <FormLabel className={labelClass}>{label}</FormLabel>
            ) : null}
            <FormControl>
              <Input
                placeholder={placeholder}
                className={inputClass}
                {...props}
                {...field}
                ref={(el) => {
                  field.ref(el);
                  if (typeof ref === "function") ref(el);
                  else if (ref) ref.current = el;
                }}
              />
            </FormControl>
            <FormMessage className={errorClass} />
          </FormItem>
        )}
      />
    );
  }
);
FormInput.displayName = "FormInput";
export default FormInput;
