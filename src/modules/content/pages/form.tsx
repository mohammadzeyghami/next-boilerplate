"use client";
import CheckBoxR from "@/shared/components/molecules/check-box/CheckboxR";
import InputR from "@/shared/components/molecules/inputs/Controllerd";
import SelectR from "@/shared/components/molecules/select/selectR";
import { ContentAccessOptions, ContentTypeOptions } from "../interfaces/Enums";
import Collapse from "@/shared/components/molecules/collapse/Primary";
import MetadataEditorR from "@/shared/components/molecules/inputs/MetadataEditorR";
import type { ContentFormValues } from "../interfaces/content.schema";

const ContentForm = ({ needsFileUrl }: { needsFileUrl: boolean }) => {
  return (
    <div className="flex flex-col gap-4">
      <InputR
        name="name"
        label="Name"
        placeholder="Enter content name"
        required
      />

      <InputR
        name="text"
        label="Text"
        placeholder="Enter content text"
        required
      />

      <SelectR
        name="access"
        label="Access"
        placeholder="Select content access"
        required
        options={ContentAccessOptions}
      />

      <SelectR
        name="type"
        label="Type"
        placeholder="Select content type"
        required
        options={ContentTypeOptions}
      />

      {needsFileUrl && (
        <InputR name="contentUrl" label="Content File" type="file" required />
      )}

      <Collapse trigger="Advanced Settings">
        <div className="flex flex-col gap-4 pt-4">
          <MetadataEditorR<ContentFormValues>
            name="metadataEntries"
            label="Metadata"
            addLabel="Add field"
            keyPlaceholder="Key"
            valuePlaceholder="Value"
          />

          <CheckBoxR name="isEarnable" label="Is Earnable" />
        </div>
      </Collapse>
    </div>
  );
};

export default ContentForm;
