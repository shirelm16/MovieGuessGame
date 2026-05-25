import { useState } from 'react';

const HINT_TRIGGERS = [5, 8]; // show dialog after this many guesses
const MAX_HINTS = 2;
const DISABLED_KEY = 'hintsDisabled';

export function useHints(guessCount, today) {
  const [, forceUpdate] = useState(0);

  const slotsKey = `hintSlots_${today}`;
  const chosenKey = `hintsChosen_${today}`;
  const shownKey = `hintShown_${today}`;

  const getSlotsUsed = () => parseInt(localStorage.getItem(slotsKey) ?? '0', 10);
  const getHintsChosen = () => JSON.parse(localStorage.getItem(chosenKey) ?? '[]');
  const getHintShown = () => JSON.parse(localStorage.getItem(shownKey) ?? '[]');
  const isDisabled = () => localStorage.getItem(DISABLED_KEY) === 'true';

  const slotsUsed = getSlotsUsed();
  const hintsChosen = getHintsChosen();
  const disabled = isDisabled();
  const hintShown = getHintShown();

  const pendingTrigger = disabled ? null :
    (HINT_TRIGGERS.find(t => guessCount >= t && !hintShown.includes(t) && slotsUsed < MAX_HINTS) ?? null);

  // Guesses remaining until the next upcoming (not-yet-reached) hint trigger
  const nextUpcoming = disabled ? null :
    (HINT_TRIGGERS.find(t => guessCount < t && !hintShown.includes(t) && slotsUsed < MAX_HINTS) ?? null);
  const hintsCountdown = nextUpcoming ? nextUpcoming - guessCount : null;

  // Dismissing just closes the dialog — no state change, hint stays available
  function chooseHint(type) {
    const trigger = pendingTrigger;
    if (!trigger) return;
    const chosen = getHintsChosen();
    localStorage.setItem(chosenKey, JSON.stringify([...chosen, type]));
    const slots = getSlotsUsed();
    localStorage.setItem(slotsKey, String(slots + 1));
    const shown = getHintShown();
    if (!shown.includes(trigger)) {
      localStorage.setItem(shownKey, JSON.stringify([...shown, trigger]));
    }
    forceUpdate(n => n + 1);
  }

  function disableHints() {
    localStorage.setItem(DISABLED_KEY, 'true');
    forceUpdate(n => n + 1);
  }

  return {
    slotsUsed,
    slotsLeft: MAX_HINTS - slotsUsed,
    hintsChosen,
    pendingTrigger,
    hintsCountdown,
    disabled,
    chooseHint,
    disableHints,
  };
}
