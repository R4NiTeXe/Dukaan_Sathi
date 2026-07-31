export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

export const cardHover = {
  rest: { scale: 1, y: 0, boxShadow: "var(--shadow-soft)" },
  hover: { 
    scale: 1.01, 
    y: -4, 
    boxShadow: "var(--shadow-hover)",
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

export const buttonTap = {
  tap: { scale: 0.97, transition: { duration: 0.1 } }
};

export const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

export const listItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};
