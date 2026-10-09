import { useCallback, useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';

/**
 * Height for the fixed produce photo behind a screen whose hero area is
 * flexible (it grows to fill whatever the card below doesn't use).
 *
 * Derived from the CARD's measured height, never the hero's: the hero is
 * briefly measured while the card's entering animation hasn't mounted yet,
 * which reports a screen-tall hero and would permanently over-zoom the photo.
 * The card height, window height and keyboard state are all stable, so the
 * photo never re-crops when the keyboard opens.
 *
 * @param windowHeight - `useWindowDimensions().height`
 * @param heroMinHeight - the hero's `minHeight` (small screens)
 * @param overlap - how far the card's rounded top overlaps the photo
 * @param initialCardHeight - first-frame estimate until the card is measured
 */
export function useHeroPhotoHeight(
  windowHeight: number,
  heroMinHeight: number,
  overlap: number,
  initialCardHeight: number,
) {
  const [cardHeight, setCardHeight] = useState(initialCardHeight);

  const onCardLayout = useCallback((event: LayoutChangeEvent) => {
    // Keep the smallest height seen: keyboard padding grows the card and
    // must not shrink/re-crop the photo.
    const measured = Math.round(event.nativeEvent.layout.height);
    setCardHeight(current => Math.min(current, measured));
  }, []);

  // hero = window - card (+ the overlap the card re-claims), never below its
  // minimum; a little slack keeps sub-pixel seams from showing at the corners.
  const photoHeight =
    Math.max(windowHeight - cardHeight + overlap, heroMinHeight) + 16;

  return { photoHeight, onCardLayout };
}
