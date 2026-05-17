import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { buttonReactions } from "../data/buttonReactions";
import { pickRandom } from "../utils/helpers";

const reactionTypes = Object.keys(buttonReactions);

export default function JokeButton({
  children,
  className,
  reactionType,
  reactionText,
  onClick,
  disabled = false,
  delayClose = true,
  dismissAfterReaction,
  type = "button",
  ...props
}) {
  const buttonRef = useRef(null);
  const [reacting, setReacting] = useState(false);
  const [reaction, setReaction] = useState(null);
  const timers = useRef([]);
  const fallbackType = useMemo(() => reactionType || pickRandom(reactionTypes), [reactionType]);

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
  }, []);

  function handleClick(event) {
    if (disabled || reacting) return;

    const chosen = buttonReactions[fallbackType] || buttonReactions.happy;
    const message = reactionText || pickRandom(chosen.messages);
    const nextReaction = {
      ...chosen,
      message,
      overlayDuration: chosen.overlayDuration || 1900,
    };
    const buttonRect = buttonRef.current?.getBoundingClientRect?.() || null;
    setReaction(nextReaction);
    setReacting(true);
    window.dispatchEvent(new window.CustomEvent("twtaf:joke-button"));
    window.dispatchEvent(
      new window.CustomEvent("twtaf:reaction-overlay", {
        detail: { reaction: nextReaction, rect: buttonRect },
      }),
    );

    const shouldDelay = dismissAfterReaction ?? delayClose;
    const buttonDuration = chosen.duration || 620;
    const actionDelay = shouldDelay ? chosen.actionDelay || 520 : 0;
    const finishButton = () => {
      setReacting(false);
    };

    if (shouldDelay) {
      timers.current.push(window.setTimeout(() => onClick?.(event), actionDelay));
    } else {
      onClick?.(event);
    }
    timers.current.push(window.setTimeout(finishButton, buttonDuration));
  }

  return (
    <span className="relative inline-flex min-w-0 flex-col">
      <motion.button
        ref={buttonRef}
        type={type}
        onClick={handleClick}
        disabled={disabled || reacting}
        animate={reacting ? reaction?.motion : undefined}
        transition={{ duration: (reaction?.duration || 620) / 1000, ease: "easeInOut" }}
        className={className}
        {...props}
      >
        {children}
      </motion.button>
    </span>
  );
}
