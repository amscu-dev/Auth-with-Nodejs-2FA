import { Controller, useFormContext } from "react-hook-form";
import { Input } from "../ui/input";
import { forwardRef, useState } from "react";
import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { MdError } from "react-icons/md";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { cn } from "@/lib/utils";

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
    const [isVisibleError, setIsVisibleError] = useState<boolean>(false);
    return (
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className={formItemClass}>
            {label ? (
              <FieldLabel htmlFor={field.name} className={labelClass}>
                {label}
              </FieldLabel>
            ) : null}

            <div className="relative">
              <Input
                id={field.name}
                aria-describedby={`${field.name}-error`}
                placeholder={placeholder}
                className={cn("z-40 relative", inputClass)}
                {...props}
                {...field}
                ref={(el) => {
                  field.ref(el);
                  if (typeof ref === "function") ref(el);
                  else if (ref) ref.current = el;
                }}
                key={22}
                onBlur={() => {
                  field.onBlur();
                  setIsVisibleError(false);
                }}
                onFocus={() => {
                  setIsVisibleError(true);
                }}
              />
              {fieldState.isTouched && fieldState.invalid ? (
                <MdError className="absolute text-primary top-1/2 right-2 -translate-y-1/2 z-50" />
              ) : null}
              {fieldState.isTouched && !fieldState.invalid ? (
                <FaCheckCircle className="absolute text-green-500 top-1/2 right-2 -translate-y-1/2 z-50" />
              ) : null}

              <FieldError
                id={`${field.name}-error`}
                className={cn(
                  "bg-card border rounded-[4px] px-4 py-2 text-xs absolute bottom-0 z-50",
                  fieldState.invalid && isVisibleError
                    ? "show-error"
                    : "hidden opacity-0",
                  errorClass
                )}
                errors={[fieldState.error]}
              />
            </div>
          </Field>
        )}
      />
    );
  }
);
FormInput.displayName = "FormInput";
export default React.memo(FormInput);
