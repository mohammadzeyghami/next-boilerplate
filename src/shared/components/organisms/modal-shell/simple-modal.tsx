import { cn } from "@/lib/utils";
import * as React from "react";
import {
  ModalShell,
  type ModalShellActionsProps,
  type ModalShellSize,
} from "./modal-shell";

export type SimpleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: ModalShellSize;
  hideClose?: boolean;

  /** Header content */
  header?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;

  /** Body + footer content */
  children?: React.ReactNode;
  footer?: React.ReactNode;
  actions?: Omit<ModalShellActionsProps, "children">;

  /** Optional class overrides */
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
};

/**
 * SimpleModal
 * - A prop-driven wrapper around ModalShell.
 * - Pass header/body/footer via props without composing slots.
 */
export function SimpleModal({
  open,
  onOpenChange,
  size = "md",
  hideClose,
  header,
  title,
  description,
  icon,
  footer,
  actions,
  contentClassName,
  headerClassName,
  footerClassName,
  children,
}: SimpleModalProps) {
  const headerNode =
    header ||
    (title || description || icon ? (
      <ModalShell.Header
        className={headerClassName}
        title={title}
        description={description}
        icon={icon}
      />
    ) : null);

  const footerNode =
    footer || actions ? (
      <ModalShell.Footer className={footerClassName}>
        {footer ?? <ModalShell.Actions {...actions} />}
      </ModalShell.Footer>
    ) : null;

  return (
    <ModalShell open={open} onOpenChange={onOpenChange}>
      <ModalShell.Content
        size={size}
        hideClose={hideClose}
        className={cn(contentClassName)}
      >
        {headerNode}
        {children}
        {footerNode}
      </ModalShell.Content>
    </ModalShell>
  );
}
