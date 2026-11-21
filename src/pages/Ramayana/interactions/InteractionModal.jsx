import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import "./InteractionModal.css";

export default function InteractionModal({
  isOpen,
  onClose,
  children,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="interaction-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >

          {/* BACKDROP */}

          <motion.div
            className="interaction-modal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* MODAL */}

          <motion.div
            className="interaction-modal__window"

            initial={{
              opacity: 0,
              scale: 0.94,
              y: 35,
            }}

            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}

            exit={{
              opacity: 0,
              scale: 0.96,
              y: 20,
            }}

            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}

            onClick={(event) => event.stopPropagation()}
          >

            {/* TOP DECORATION */}

            <div className="interaction-modal__top-line">
              <span />
              <i>✦</i>
              <span />
            </div>

            

            <div className="interaction-modal__content">
              {children}
            </div>

          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}