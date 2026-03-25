import {
  useFieldArray,
  useFormContext,
  type FieldArrayPath,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import InputR from "./Controllerd";
import { Button } from "../../atoms/button/button";
import ErrorMessage from "../../atoms/typography/ErrorMessage";

export type MetadataEntry = { key: string; value: string };

export type MetadataEditorRProps<TFieldValues extends FieldValues> = {
  name: FieldArrayPath<TFieldValues>;
  label?: string;
  helperText?: string;
  addLabel?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  disabled?: boolean;
  createEmpty?: () => unknown;
  maxItems?: number;
};

function getErrorMessage(val: unknown): string | undefined {
  if (!val || typeof val !== "object") return undefined;
  if (!("message" in val)) return undefined;
  const message = (val as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

export default function MetadataEditorR<TFieldValues extends FieldValues>({
  name,
  label = "Metadata",
  helperText = 'Add rows to build an object. Values can be plain text or JSON literals (e.g. 123, true, null, {"a":1}).',
  addLabel = "Add",
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  disabled,
  createEmpty = () => ({ key: "", value: "" }),
  maxItems,
}: MetadataEditorRProps<TFieldValues>) {
  const { control, formState } = useFormContext<TFieldValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const arrayErrorMessage = getErrorMessage(
    (formState.errors as Record<string, unknown>)[name]
  );

  const reachedMaxItems = typeof maxItems === "number" && fields.length >= maxItems;

  return (
    <div className="grid gap-2" data-slot="metadata-editor">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-0.5">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{helperText}</div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append(createEmpty() as never)}
          disabled={disabled || reachedMaxItems}
        >
          {addLabel}
        </Button>
      </div>

      {arrayErrorMessage ? <ErrorMessage message={arrayErrorMessage} /> : null}

      <div className="grid gap-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-row gap-2">
            <InputR<TFieldValues>
              name={`${name}.${index}.key` as FieldPath<TFieldValues>}
              placeholder={keyPlaceholder}
              autoComplete="off"
              disabled={disabled}
            />

            <InputR<TFieldValues>
              name={`${name}.${index}.value` as FieldPath<TFieldValues>}
              placeholder={valuePlaceholder}
              autoComplete="off"
              disabled={disabled}
            />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full md:w-auto"
              onClick={() => remove(index)}
              disabled={disabled || fields.length === 1}
              aria-label="Remove metadata row"
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
