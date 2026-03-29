import { ChevronDownIcon } from "lucide-react";

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
  classNames?: CollapseClassNames;
}

const Collapse = ({ children, trigger, classNames }: CollapseProps) => {
  return (
    <CollapseDefault>
      <CollapseDefaultTrigger
        className={cn(
          "group flex w-full cursor-pointer items-center justify-between gap-2 border-b-0 border-x-0 border-t border-gray-200 px-4 py-2 text-start text-sm font-medium",
          classNames?.trigger,
        )}
      >
        <div className="min-w-0 flex-1">
          {typeof trigger === "string" ? (
            <P className={cn(classNames?.triggerP)}>{trigger}</P>
          ) : (
            trigger
          )}
        </div>
        <ChevronDownIcon
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapseDefaultTrigger>
      <CollapseDefaultContent
        className={cn(
          "overflow-hidden duration-200 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
          classNames?.content,
        )}
      >
        {typeof children === "string" ? (
          <P className={cn(classNames?.contentP)}>{children}</P>
        ) : (
          children
        )}
      </CollapseDefaultContent>
    </CollapseDefault>
  );
};

export default Collapse;
