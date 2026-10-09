/**
 * Single barrel for all common (feature-agnostic) UI components.
 * Feature-specific components live in their own `features/<feature>/components`
 * and are not re-exported here.
 */
export { AppImage, type AppImageProps } from './AppImage';
export { BottomSheet, type BottomSheetProps } from './BottomSheet';
export { Button, type ButtonProps, type ButtonVariant } from './Button';
export { CartBar, type CartBarProps } from './CartBar';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { ErrorView, type ErrorViewProps } from './ErrorView';
export { Header, type HeaderProps } from './Header';
export { Loader, type LoaderProps, type LoaderSize } from './Loader';
export { OfferBadge, type OfferBadgeProps } from './OfferBadge';
export { PriceStack, type PriceStackProps } from './PriceStack';
export {
  ProductCard,
  type Product,
  type ProductVariant,
  type ProductDiscount,
} from './ProductCard';
export {
  ProductOptionsSheet,
  type ProductOptionsSheetProps,
} from './ProductOptionsSheet';
export { OTPInput, type OTPInputHandle, type OTPInputProps } from './OTPInput';
export { ScreenContainer, type ScreenContainerProps } from './ScreenContainer';
export { Skeleton, type SkeletonProps } from './Skeleton';
export { TextInput, type TextInputProps } from './TextInput';
