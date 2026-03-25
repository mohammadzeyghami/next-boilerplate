import React from "react";
import P from "../../atoms/typography/P";
import { useRequiredSection } from "../../../contexts/required-section-context";

interface LabelProps extends React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLParagraphElement>,
  HTMLParagraphElement
> {
  required?: boolean;
}

const LabelPrimary = ({
  children,
  required,
  className,
  ...rest
}: LabelProps) => {
  const requiredFromSection = useRequiredSection();
  const isRequired = Boolean(required || requiredFromSection);

  return (
    <P
      className={["font-semibold", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children} {isRequired ? <span className="text-red-500">*</span> : null} :
    </P>
  );
};

export default LabelPrimary;
