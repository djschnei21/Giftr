import type { Address, Sizes } from "@/db/schema";

export type ProfileFormValue = {
  name: string;
  aboutMe: string;
  likes: string;
  dislikes: string;
  favoriteColors: string;
  sizes: Required<{ [K in keyof Sizes]: string }>;
  address: Required<{ [K in keyof Address]: string }>;
};

export function toProfileFormValue(
  name: string,
  p: { aboutMe: string | null; likes: string | null; dislikes: string | null; favoriteColors: string | null; sizes: Sizes; address: Address | null } | null,
): ProfileFormValue {
  const s = p?.sizes ?? {};
  const a = p?.address ?? {};
  return {
    name,
    aboutMe: p?.aboutMe ?? "",
    likes: p?.likes ?? "",
    dislikes: p?.dislikes ?? "",
    favoriteColors: p?.favoriteColors ?? "",
    sizes: { top: s.top ?? "", bottom: s.bottom ?? "", shoe: s.shoe ?? "", ring: s.ring ?? "", other: s.other ?? "" },
    address: {
      name: a.name ?? "",
      line1: a.line1 ?? "",
      line2: a.line2 ?? "",
      city: a.city ?? "",
      region: a.region ?? "",
      postalCode: a.postalCode ?? "",
      country: a.country ?? "",
    },
  };
}
