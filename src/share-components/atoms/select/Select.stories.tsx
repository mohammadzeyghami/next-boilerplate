import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormProvider, useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Default";
import { PrimarySelect } from "./Primary";
import SelectR from "./SelectR";

const meta: Meta<typeof Select> = {
  title: "Atoms/Select",
  component: Select,
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select defaultValue="apple">
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Searchable: Story = {
  render: () => (
    <PrimarySelect
      placeholder="Select a fruit"
      searchable
      options={[
        { value: "apple", label: "Apple" },
        { value: "banana", label: "Banana" },
        { value: "orange", label: "Orange" },
        { value: "grape", label: "Grape" },
      ]}
      label="Fruits"
    />
  ),
};

export const ControlledForm: Story = {
  render: () => {
    const methods = useForm<{ fruit: string }>({
      defaultValues: { fruit: "" },
    });

    return (
      <FormProvider {...methods}>
        <form className="space-y-4">
          <SelectR
            name="fruit"
            label="Choose a fruit"
            options={[
              { value: "apple", label: "Apple" },
              { value: "banana", label: "Banana" },
              { value: "orange", label: "Orange" },
            ]}
          />
          <button
            type="button"
            onClick={() => alert(JSON.stringify(methods.getValues(), null, 2))}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Show Value
          </button>
        </form>
      </FormProvider>
    );
  },
};
