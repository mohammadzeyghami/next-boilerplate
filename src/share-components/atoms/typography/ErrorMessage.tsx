import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import P from "./P";

interface ErrorMessageProps {
  message?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {message && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="w-full"
          role="alert"
          aria-live="polite"
        >
          <P variant="danger">{message}</P>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorMessage;
