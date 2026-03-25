import { cn } from "@/lib/utils";
import P from "@/shared/atoms/typography/P";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/molecules/drawer/Defualt";

type direction = "top" | "bottom" | "left" | "right";

type drawerClosePosition = "header" | "footer";

interface classNames {
  header?: string;
  content?: string;
  trigger?: string;
  title?: string;
  description?: string;
  footer?: string;
  triggerP?: string;
  titleP?: string;
  descriptionP?: string;
  footerP?: string;
  close?: string;
  closeP?: string;
}

interface DrawerProps {
  direction?: direction;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  trigger?: React.ReactNode | string;
  title?: React.ReactNode | string;
  description?: React.ReactNode | string;
  footer?: React.ReactNode | string;
  classNames?: classNames;
  close?: React.ReactNode | string;
  drawerClosePosition?: drawerClosePosition;
}

export default function DrawerPrimary({
  direction = "bottom",
  isOpen,
  setIsOpen,
  trigger,
  title,
  description,
  footer,
  classNames,
  drawerClosePosition = "header",
  close,
}: DrawerProps) {
  const onClose = () => {
    setIsOpen?.(false);
  };

  return (
    <Drawer direction={direction} open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger className={cn(classNames?.trigger)}>
        {typeof trigger === "string" ? (
          <P className={cn(classNames?.triggerP)}>{trigger}</P>
        ) : (
          trigger
        )}
      </DrawerTrigger>
      <DrawerContent className={cn(classNames?.content)}>
        <DrawerHeader className={cn("flex", classNames?.header)}>
          <DrawerTitle className={cn(classNames?.title)}>
            {typeof title === "string" ? (
              <P className={cn(classNames?.titleP)}>{title}</P>
            ) : (
              title
            )}
          </DrawerTitle>
          {drawerClosePosition === "header" && (
            <DrawerClose
              className={cn(classNames?.close)}
              onClick={() => onClose()}
            >
              {typeof close === "string" ? (
                <P className={cn(classNames?.closeP)}>{close}</P>
              ) : (
                close
              )}
            </DrawerClose>
          )}
        </DrawerHeader>
        <DrawerDescription className={cn(classNames?.description)}>
          {typeof description === "string" ? (
            <P className={cn(classNames?.descriptionP)}>{description}</P>
          ) : (
            description
          )}
        </DrawerDescription>
        <DrawerFooter className={cn(classNames?.footer)}>
          {typeof footer === "string" ? (
            <P className={cn(classNames?.footerP)}>{footer}</P>
          ) : (
            footer
          )}
          {drawerClosePosition === "footer" && (
            <DrawerClose className={cn(classNames?.close)} onClick={onClose}>
              {typeof close === "string" ? (
                <P className={cn(classNames?.closeP)}>{close}</P>
              ) : (
                close
              )}
            </DrawerClose>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
