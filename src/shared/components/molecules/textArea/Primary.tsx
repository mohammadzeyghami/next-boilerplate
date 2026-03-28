import ErrorMessage from "@/shared/components/atoms/typography/ErrorMessage";
import { forwardRef, type TextareaHTMLAttributes } from "react";
import LabelPrimary from "../label/Primary";
import { Textarea } from "./Default";

export interface TextareaPrimaryProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const TextareaPrimary = forwardRef<HTMLTextAreaElement, TextareaPrimaryProps>(
  ({ error, label, ...props }, ref) => {
    return (
      <div className="flex flex-col items-start gap-1">
        {label ? <LabelPrimary>{label}</LabelPrimary> : null}
        <Textarea ref={ref} {...props} />
        <ErrorMessage message={error} />
      </div>
    );
  },
);

TextareaPrimary.displayName = "TextareaPrimary";

export default TextareaPrimary;
