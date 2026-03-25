import ErrorMessage from "@/Shared/components/atoms/typography/ErrorMessage";
import LabelPrimary from "@/Shared/components/molecules/label/Primary";
import * as React from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./InputOTP";

export interface OtpPrimaryProps
  extends Omit<
    React.ComponentProps<typeof InputOTP>,
    "value" | "onChange" | "children" | "render" | "maxLength"
  > {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  label?: string;
  /** Number of OTP digits (default 6) */
  length?: number;
  /** Insert a separator after these indexes (e.g., [3] for 3-3 split) */
  separatorsAfter?: number[];
}

export default function OtpPrimary({
  value,
  onChange,
  error,
  label,
  length = 6,
  separatorsAfter = [],
  ...props
}: OtpPrimaryProps) {
  return (
    <div className="flex flex-col items-start gap-1">
      {label ? <LabelPrimary>{label}</LabelPrimary> : null}

      <InputOTP
        {...props} // spread first, we control discriminant + computed props below
        value={value}
        onChange={onChange}
        maxLength={length}
        aria-invalid={error ? true : undefined}
      >
        <InputOTPGroup>
          {Array.from({ length }, (_, i) => {
            const withSep = separatorsAfter.includes(i);
            return (
              <React.Fragment key={i}>
                <InputOTPSlot index={i} />
                {withSep ? <InputOTPSeparator className="mx-1" /> : null}
              </React.Fragment>
            );
          })}
        </InputOTPGroup>
      </InputOTP>

      <ErrorMessage message={error} />
    </div>
  );
}
