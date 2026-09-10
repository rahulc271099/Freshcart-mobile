/**
 * Shared layout numbers between `TabBarBackground` (the notched bar shape)
 * and `AppTabs`' floating Cart button. Both need to agree on the same bar
 * height / notch size for the button to actually sit inside the notch cut
 * into the bar - hence pulling these into one file instead of duplicating
 * magic numbers in two places that could drift apart.
 */
export const BAR_HEIGHT = 70;
export const CORNER_RADIUS = 28;
export const NOTCH_RADIUS = 38;
export const CIRCLE_SIZE = 60;
/** How far the circle's top edge sits above the bar's top edge (y = 0). */
export const CIRCLE_LIFT = 26;
