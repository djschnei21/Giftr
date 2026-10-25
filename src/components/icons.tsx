import type { Icon, IconProps } from "@phosphor-icons/react";
import {
  AirplaneTiltIcon as PAirplaneTiltIcon,
  ArrowCounterClockwiseIcon as PArrowCounterClockwiseIcon,
  ArrowLeftIcon as PArrowLeftIcon,
  ArrowRightIcon as PArrowRightIcon,
  ArrowSquareOutIcon as PArrowSquareOutIcon,
  ArrowUpRightIcon as PArrowUpRightIcon,
  ArrowsClockwiseIcon as PArrowsClockwiseIcon,
  ArrowsLeftRightIcon as PArrowsLeftRightIcon,
  BagSimpleIcon as PBagSimpleIcon,
  BellSlashIcon as PBellSlashIcon,
  BuildingsIcon as PBuildingsIcon,
  CalendarBlankIcon as PCalendarBlankIcon,
  CalendarCheckIcon as PCalendarCheckIcon,
  CalendarDotsIcon as PCalendarDotsIcon,
  CaretDownIcon as PCaretDownIcon,
  CaretLeftIcon as PCaretLeftIcon,
  ChatCircleIcon as PChatCircleIcon,
  CheckCircleIcon as PCheckCircleIcon,
  CheckIcon as PCheckIcon,
  CheckSquareIcon as PCheckSquareIcon,
  CircleNotchIcon as PCircleNotchIcon,
  ClockCounterClockwiseIcon as PClockCounterClockwiseIcon,
  CoffeeIcon as PCoffeeIcon,
  ConfettiIcon as PConfettiIcon,
  CopyIcon as PCopyIcon,
  CrownIcon as PCrownIcon,
  DetectiveIcon as PDetectiveIcon,
  DeviceMobileIcon as PDeviceMobileIcon,
  DotsSixVerticalIcon as PDotsSixVerticalIcon,
  DotsThreeIcon as PDotsThreeIcon,
  EnvelopeSimpleIcon as PEnvelopeSimpleIcon,
  EnvelopeSimpleOpenIcon as PEnvelopeSimpleOpenIcon,
  EyeIcon as PEyeIcon,
  EyeSlashIcon as PEyeSlashIcon,
  GiftIcon as PGiftIcon,
  HandshakeIcon as PHandshakeIcon,
  HeartIcon as PHeartIcon,
  HourglassIcon as PHourglassIcon,
  HouseIcon as PHouseIcon,
  LinkIcon as PLinkIcon,
  LinkSimpleIcon as PLinkSimpleIcon,
  ListChecksIcon as PListChecksIcon,
  ListIcon as PListIcon,
  LockIcon as PLockIcon,
  MagicWandIcon as PMagicWandIcon,
  MapPinIcon as PMapPinIcon,
  MonitorIcon as PMonitorIcon,
  MoonIcon as PMoonIcon,
  PackageIcon as PPackageIcon,
  PaletteIcon as PPaletteIcon,
  PaperPlaneRightIcon as PPaperPlaneRightIcon,
  PaperPlaneTiltIcon as PPaperPlaneTiltIcon,
  PencilSimpleIcon as PPencilSimpleIcon,
  PlusIcon as PPlusIcon,
  QuestionIcon as PQuestionIcon,
  RepeatIcon as PRepeatIcon,
  RulerIcon as PRulerIcon,
  SealCheckIcon as PSealCheckIcon,
  ShareNetworkIcon as PShareNetworkIcon,
  ShieldCheckIcon as PShieldCheckIcon,
  ShootingStarIcon as PShootingStarIcon,
  ShoppingBagIcon as PShoppingBagIcon,
  ShuffleIcon as PShuffleIcon,
  SignOutIcon as PSignOutIcon,
  SlidersHorizontalIcon as PSlidersHorizontalIcon,
  SnowflakeIcon as PSnowflakeIcon,
  SparkleIcon as PSparkleIcon,
  StarIcon as PStarIcon,
  SunIcon as PSunIcon,
  ThumbsDownIcon as PThumbsDownIcon,
  TrashIcon as PTrashIcon,
  TreeEvergreenIcon as PTreeEvergreenIcon,
  TruckIcon as PTruckIcon,
  UserCheckIcon as PUserCheckIcon,
  UserCircleMinusIcon as PUserCircleMinusIcon,
  UserIcon as PUserIcon,
  UserMinusIcon as PUserMinusIcon,
  UserPlusIcon as PUserPlusIcon,
  UsersIcon as PUsersIcon,
  UsersThreeIcon as PUsersThreeIcon,
  WalletIcon as PWalletIcon,
  WarningIcon as PWarningIcon,
  XCircleIcon as PXCircleIcon,
  XIcon as PXIcon,
} from "@phosphor-icons/react/ssr";

export type { IconProps };

/* The hook free SSR build is the one that renders inside Server Components. */
function bold(Glyph: Icon) {
  function BoldIcon({ weight = "bold", size = 24, ...props }: IconProps) {
    const labelled = Boolean(props["aria-label"] || props.alt);
    return <Glyph weight={weight} size={size} aria-hidden={labelled ? undefined : true} {...props} />;
  }
  BoldIcon.displayName = Glyph.displayName;
  return BoldIcon;
}

export const AirplaneTiltIcon = bold(PAirplaneTiltIcon);
export const ArrowCounterClockwiseIcon = bold(PArrowCounterClockwiseIcon);
export const ArrowLeftIcon = bold(PArrowLeftIcon);
export const ArrowRightIcon = bold(PArrowRightIcon);
export const ArrowSquareOutIcon = bold(PArrowSquareOutIcon);
export const ArrowUpRightIcon = bold(PArrowUpRightIcon);
export const ArrowsClockwiseIcon = bold(PArrowsClockwiseIcon);
export const ArrowsLeftRightIcon = bold(PArrowsLeftRightIcon);
export const BagSimpleIcon = bold(PBagSimpleIcon);
export const BellSlashIcon = bold(PBellSlashIcon);
export const BuildingsIcon = bold(PBuildingsIcon);
export const CalendarBlankIcon = bold(PCalendarBlankIcon);
export const CalendarCheckIcon = bold(PCalendarCheckIcon);
export const CalendarDotsIcon = bold(PCalendarDotsIcon);
export const CaretDownIcon = bold(PCaretDownIcon);
export const CaretLeftIcon = bold(PCaretLeftIcon);
export const ChatCircleIcon = bold(PChatCircleIcon);
export const CheckCircleIcon = bold(PCheckCircleIcon);
export const CheckIcon = bold(PCheckIcon);
export const CheckSquareIcon = bold(PCheckSquareIcon);
export const CircleNotchIcon = bold(PCircleNotchIcon);
export const ClockCounterClockwiseIcon = bold(PClockCounterClockwiseIcon);
export const CoffeeIcon = bold(PCoffeeIcon);
export const ConfettiIcon = bold(PConfettiIcon);
export const CopyIcon = bold(PCopyIcon);
export const CrownIcon = bold(PCrownIcon);
export const DetectiveIcon = bold(PDetectiveIcon);
export const DeviceMobileIcon = bold(PDeviceMobileIcon);
export const DotsSixVerticalIcon = bold(PDotsSixVerticalIcon);
export const DotsThreeIcon = bold(PDotsThreeIcon);
export const EnvelopeSimpleIcon = bold(PEnvelopeSimpleIcon);
export const EnvelopeSimpleOpenIcon = bold(PEnvelopeSimpleOpenIcon);
export const EyeIcon = bold(PEyeIcon);
export const EyeSlashIcon = bold(PEyeSlashIcon);
export const GiftIcon = bold(PGiftIcon);
export const HandshakeIcon = bold(PHandshakeIcon);
export const HeartIcon = bold(PHeartIcon);
export const HourglassIcon = bold(PHourglassIcon);
export const HouseIcon = bold(PHouseIcon);
export const LinkIcon = bold(PLinkIcon);
export const LinkSimpleIcon = bold(PLinkSimpleIcon);
export const ListChecksIcon = bold(PListChecksIcon);
export const ListIcon = bold(PListIcon);
export const LockIcon = bold(PLockIcon);
export const MagicWandIcon = bold(PMagicWandIcon);
export const MapPinIcon = bold(PMapPinIcon);
export const MonitorIcon = bold(PMonitorIcon);
export const MoonIcon = bold(PMoonIcon);
export const PackageIcon = bold(PPackageIcon);
export const PaletteIcon = bold(PPaletteIcon);
export const PaperPlaneRightIcon = bold(PPaperPlaneRightIcon);
export const PaperPlaneTiltIcon = bold(PPaperPlaneTiltIcon);
export const PencilSimpleIcon = bold(PPencilSimpleIcon);
export const PlusIcon = bold(PPlusIcon);
export const QuestionIcon = bold(PQuestionIcon);
export const RepeatIcon = bold(PRepeatIcon);
export const RulerIcon = bold(PRulerIcon);
export const SealCheckIcon = bold(PSealCheckIcon);
export const ShareNetworkIcon = bold(PShareNetworkIcon);
export const ShieldCheckIcon = bold(PShieldCheckIcon);
export const ShootingStarIcon = bold(PShootingStarIcon);
export const ShoppingBagIcon = bold(PShoppingBagIcon);
export const ShuffleIcon = bold(PShuffleIcon);
export const SignOutIcon = bold(PSignOutIcon);
export const SlidersHorizontalIcon = bold(PSlidersHorizontalIcon);
export const SnowflakeIcon = bold(PSnowflakeIcon);
export const SparkleIcon = bold(PSparkleIcon);
export const StarIcon = bold(PStarIcon);
export const SunIcon = bold(PSunIcon);
export const ThumbsDownIcon = bold(PThumbsDownIcon);
export const TrashIcon = bold(PTrashIcon);
export const TreeEvergreenIcon = bold(PTreeEvergreenIcon);
export const TruckIcon = bold(PTruckIcon);
export const UserCheckIcon = bold(PUserCheckIcon);
export const UserCircleMinusIcon = bold(PUserCircleMinusIcon);
export const UserIcon = bold(PUserIcon);
export const UserMinusIcon = bold(PUserMinusIcon);
export const UserPlusIcon = bold(PUserPlusIcon);
export const UsersIcon = bold(PUsersIcon);
export const UsersThreeIcon = bold(PUsersThreeIcon);
export const WalletIcon = bold(PWalletIcon);
export const WarningIcon = bold(PWarningIcon);
export const XCircleIcon = bold(PXCircleIcon);
export const XIcon = bold(PXIcon);
