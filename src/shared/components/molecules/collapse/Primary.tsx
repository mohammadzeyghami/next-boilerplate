import { cn } from "@/lib/utils";
import P from "@/shared/components/atoms/typography/P";
import {
  CollapseDefault,
  CollapseDefaultContent,
  CollapseDefaultTrigger,
} from "./Default";

export interface CollapseClassNames {
  trigger?: string;
  triggerP?: string;
  content?: string;
  contentP?: string;
}

export interface CollapseProps {
  children: React.ReactNode;
  trigger: React.ReactNode | string;
  classNames: CollapseClassNames;
}

const Collapse = ({ children, trigger, classNames }: CollapseProps) => {
  return (
    <CollapseDefault>
      <CollapseDefaultTrigger
        className={cn("cursor-pointer", classNames?.trigger)}
      >
        {typeof trigger === "string" ? (
          <P className={cn(classNames?.triggerP)}>{trigger}</P>
        ) : (
          trigger
        )}
      </CollapseDefaultTrigger>
      <CollapseDefaultContent className={cn(classNames?.content)}>
        {typeof children === "string" ? (
          <P className={cn(classNames.contentP)}>{children}</P>
        ) : (
          children
        )}
      </CollapseDefaultContent>
    </CollapseDefault>
  );
};

export default Collapse;
