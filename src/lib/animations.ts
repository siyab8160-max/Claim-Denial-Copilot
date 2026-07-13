import { useReducedMotion, type Variants } from "framer-motion";

/**
 * Reusable custom hook returning motion variants that respect the user's
 * `prefers-reduced-motion` system settings to improve accessibility.
 */
export function useMotionVariants() {
  const shouldReduce = useReducedMotion();

  const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: shouldReduce ? 0 : 0.25 } },
  };

  const slideUp: Variants = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 15 },
    visible: { opacity: 1, y: 0, transition: { duration: shouldReduce ? 0 : 0.3, ease: "easeOut" as const } },
  };

  const scaleIn: Variants = {
    hidden: { opacity: 0, scale: shouldReduce ? 1 : 0.98 },
    visible: { opacity: 1, scale: 1, transition: { duration: shouldReduce ? 0 : 0.3, ease: "easeOut" as const } },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduce ? 0 : 0.08,
      },
    },
  };

  return { fadeIn, slideUp, scaleIn, staggerContainer };
}
