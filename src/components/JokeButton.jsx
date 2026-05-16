import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { buttonReactions } from "../data/buttonReactions";
import { pickRandom } from "../utils/helpers";
import ReactionOverlay from "./ReactionOverlay";

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
  const [buttonRect, setButtonRect] = useState(null);
  const fallbackType = useMemo(() => reactionType || pickRandom(reactionTypes), [reactionType]);

  function handleClick(event) {
    if (disabled || reacting) return;

    const chosen = buttonReactions[fallbackType] || buttonReactions.happy;
    const message = reactionText || pickRandom(chosen.messages);
    setReaction({ ...chosen, message });
    setButtonRect(buttonRef.current?.getBoundingClientRect?.() || null);
    setReacting(true);
    window.dispatchEvent(new window.CustomEvent("twtaf:joke-button"));

    const shouldDelay = dismissAfterReaction ?? delayClose;
    const reactionDuration = chosen.duration || 620;
    const finish = () => {
      setReacting(false);
      onClick?.(event);
    };

    if (shouldDelay) {
      window.setTimeout(finish, reactionDuration);
    } else {
      onClick?.(event);
      window.setTimeout(() => setReacting(false), reactionDuration);
    }
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
      {reacting ? <ReactionOverlay reaction={reaction} rect={buttonRect} /> : null}
    </span>
  );
}
