import { Input } from "@/shared/components/atoms/input";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDebouncedValue } from "../../hooks/useSearchFilter";
import InputPrimary from "../inputs/Primary";

type InputUrlProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange"
> & {
  /** Query string key to read/write. */
  param: string;
  /** Local fallback when the param is missing. */
  defaultValue?: string;
  /** Optional side effect for consumers who still want the value. */
  onValueChange?: (value: string) => void;
  /** Debounce delay (ms) before syncing value to URL. */
  debounceMs?: number;
};

export function InputUrl({
  param,
  defaultValue = "",
  onValueChange,
  debounceMs = 400,
  ...props
}: InputUrlProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = useMemo(
    // @ts-ignore
    () => searchParams.get(param) ?? defaultValue,
    [defaultValue, param, searchParams]
  );

  const [inputValue, setInputValue] = useState(value);
  const debouncedValue = useDebouncedValue(inputValue, debounceMs);
  const skipNextCommitRef = useRef(false);

  useEffect(() => {
    skipNextCommitRef.current = true;
    setInputValue(value);
  }, [value]);

  const commitValue = useCallback(
    (nextValue: string) => {
      if (nextValue === value) return;

      onValueChange?.(nextValue);
      // @ts-ignore
      setSearchParams((prev) => {
        const sp = new URLSearchParams(prev);
        if (!nextValue) {
          sp.delete(param);
        } else {
          sp.set(param, nextValue);
        }
        return sp;
      });
    },
    [onValueChange, param, setSearchParams, value]
  );

  useEffect(() => {
    // Avoid re-applying stale values when URL changes (e.g. reset filters).
    if (skipNextCommitRef.current) {
      skipNextCommitRef.current = false;
      return;
    }
    if (debouncedValue !== inputValue) return;
    commitValue(debouncedValue);
  }, [commitValue, debouncedValue, inputValue]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value);
    },
    []
  );

  return <InputPrimary {...props} value={inputValue} onChange={handleChange} />;
}
