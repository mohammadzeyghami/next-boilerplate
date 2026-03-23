import P from "@/share-components/atoms/typography/P";
import React from "react";
interface LabelProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLParagraphElement>,
    HTMLParagraphElement
  > {
  required?: string;
}

const LabelPrimary = ({ children, required }: LabelProps) => {
  return (
    <P className="font-semibold">
      {children} {required ? <span className="text-red-500">*</span> : null} :
    </P>
  );
};

export default LabelPrimary;
