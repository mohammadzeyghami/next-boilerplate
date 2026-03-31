"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import type { LanguageFormValues } from "@/modules/language/interfaces/language.schema";
import { Button } from "@/shared/components/atoms/button";
import P from "@/shared/components/atoms/typography/P";
import { Checkbox } from "@/shared/components/molecules/check-box/Default";
import { SimpleModal } from "@/shared/components/organisms/modal-shell/simple-modal";

type PickerItem = {
  id: string;
  name: string;
};

type LanguageArrayPickerModalFieldProps = {
  value: string[];
  onChange: (next: string[]) => void;
  name: string;
  helperText: string;
  buttonText: string;
  modalTitle: string;
  modalDescription: string;
  emptyText: string;
  availableText: string;
  items: PickerItem[];
  headerAction?: React.ReactNode;
};

function LanguageArrayPickerModalField({
  value,
  onChange,
  name,
  helperText,
  buttonText,
  modalTitle,
  modalDescription,
  emptyText,
  availableText,
  items,
  headerAction,
}: LanguageArrayPickerModalFieldProps) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState<string[]>(value);

  const selectedCount = draftValue.length;

  const selectedNames = useMemo(
    () =>
      items.filter((item) => value.includes(item.id)).map((item) => item.name),
    [items, value],
  );

  const toggleItem = (itemId: string, checked: boolean) => {
    setDraftValue((current) =>
      checked
        ? [...current, itemId]
        : current.filter((id) => id !== itemId),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <P className="text-muted-foreground text-xs">{helperText}</P>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDraftValue(value);
            setOpen(true);
          }}
        >
          {buttonText}
        </Button>
      </div>

      <div className="min-h-11 rounded-md border px-3 py-2">
        {selectedNames.length > 0 ? (
          <div className="flex flex-col gap-2">
            {selectedNames.map((selectedName) => (
              <span
                key={selectedName}
                className="rounded-full bg-muted px-2 py-1 text-xs text-foreground"
              >
                {selectedName}
              </span>
            ))}
          </div>
        ) : (
          <P className="text-muted-foreground text-sm">{emptyText}</P>
        )}
      </div>

      <SimpleModal
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title={modalTitle}
        description={modalDescription}
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <P className="text-muted-foreground text-sm">
              {selectedCount} selected
            </P>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDraftValue(value);
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onChange(draftValue);
                  setOpen(false);
                }}
              >
                <Check className="size-4" aria-hidden />
                Apply
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <P className="text-muted-foreground text-sm">{availableText}</P>
            {headerAction}
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-3">
            {items.length === 0 ? (
              <P className="text-muted-foreground text-sm">{emptyText}</P>
            ) : (
              items.map((item) => {
                const checked = draftValue.includes(item.id);

                return (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleItem(item.id, value === true)
                      }
                    />
                    <span className="truncate">{item.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}

type LanguageArrayPickerModalProps = {
  fieldName: "categoryIds" | "contentIds" | "tagIds";
  name: string;
  helperText: string;
  buttonText: string;
  modalTitle: string;
  modalDescription: string;
  emptyText: string;
  availableText: string;
  items: PickerItem[];
  headerAction?: React.ReactNode;
};

export function LanguageArrayPickerModal({
  fieldName,
  ...props
}: LanguageArrayPickerModalProps) {
  const { control } = useFormContext<LanguageFormValues>();

  return (
    <Controller
      name={fieldName}
      control={control}
      render={({ field }) => (
        <LanguageArrayPickerModalField
          {...props}
          value={field.value}
          onChange={field.onChange}
        />
      )}
    />
  );
}
