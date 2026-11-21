import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.header
        className="ancestra-navbar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <Link to="/" className="navbar-logo">
          ANCESTRA
        </Link>

        <nav className="navbar-links">
          <Link to="/journey">THE JOURNEY</Link>

          
        </nav>

        <button
          className="navbar-menu"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={20} strokeWidth={1} />
        </button>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="mobile-menu__close"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X size={24} strokeWidth={1} />
            </button>

            <nav>

                THE JOURNEY
              

              
                CHARACTERS
              

              
                DISCOVER THE WORLDS
              
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;