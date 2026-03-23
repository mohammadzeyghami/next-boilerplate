import ErrorMessage from "@/share-components/atoms/typography/ErrorMessage";
import { forwardRef, type InputHTMLAttributes } from "react";
import LabelPrimary from "../label/Primary";
import { Input } from "./Default";

export interface InputPrimaryProps
  extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const InputPrimary = forwardRef<HTMLInputElement, InputPrimaryProps>(
  ({ error, label, ...props }, ref) => {
    return (
      <div className="flex flex-col items-start gap-1">
        {label ? <LabelPrimary>{label}</LabelPrimary> : null}
        <Input ref={ref} {...props} />
        <ErrorMessage message={error} />
      </div>
    );
  }
);

InputPrimary.displayName = "InputPrimary";
export default InputPrimary;
