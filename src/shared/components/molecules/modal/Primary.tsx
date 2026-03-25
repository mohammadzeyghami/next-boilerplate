import { cn } from "@/lib/utils";
import P from "@/shared/atoms/typography/P";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/molecules/modal/Defualt";

type classNames = {
  trigger?: string;
  triggerP?: string;
  header?: string;
  headerP?: string;
  content?: string;
  contentP?: string;
  footer?: string;
  title?: string;
  description?: string;
  footerP?: string;
};

interface ModalPrimaryProps {
  trigger?: React.ReactNode | string | null;
  header: React.ReactNode | string;
  content: React.ReactNode;
  footer: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  classNames?: classNames;
}

export default function ModalPrimary({
  trigger,
  header,
  content,
  footer,
  isOpen,
  setIsOpen,
  classNames,
}: ModalPrimaryProps) {
  const onClose = () => {
    setIsOpen?.(false);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && (
        <DialogTrigger className={cn(classNames?.trigger)}>
          {typeof trigger === "string" ? (
            <P className={cn(classNames?.triggerP)}>{trigger}</P>
          ) : (
            trigger
          )}
        </DialogTrigger>
      )}
      <DialogContent
        onCloseAutoFocus={onClose}
        className={cn(classNames?.content)}
      >
        <DialogHeader className={cn(classNames?.header)}>
          <DialogTitle className={cn(classNames?.title)}>
            {typeof header === "string" ? (
              <P className={cn(classNames?.headerP)}>{header}</P>
            ) : (
              header
            )}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className={cn(classNames?.description)}>
          {typeof content === "string" ? (
            <P className={cn(classNames?.contentP)}>{content}</P>
          ) : (
            content
          )}
        </DialogDescription>
        <DialogFooter className={cn(classNames?.footer)}>
          {typeof footer === "string" ? (
            <P className={cn(classNames?.footerP)}>{footer}</P>
          ) : (
            footer
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
