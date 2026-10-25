"use client";

import { useState } from "react";
import { CircleNotchIcon } from "@/components/icons";
import type { ProfileFormValue } from "./profile-value";
import { updateProfile } from "@/server/actions/profile";
import { useAction } from "@/components/use-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";

export function ProfileForm({ initial }: { initial: ProfileFormValue }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, run] = useAction();
  const set = (p: Partial<ProfileFormValue>) => setV((s) => ({ ...s, ...p }));
  const size = (k: keyof ProfileFormValue["sizes"], value: string) =>
    setV((s) => ({ ...s, sizes: { ...s.sizes, [k]: value } }));
  const addr = (k: keyof ProfileFormValue["address"], value: string) =>
    setV((s) => ({ ...s, address: { ...s.address, [k]: value } }));

  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          async () => {
            const res = await updateProfile(v);
            setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
            return res;
          },
          { success: "Profile saved" },
        );
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>About you</CardTitle>
          <CardDescription>Your Santa sees this alongside your wishlist.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Name" htmlFor="p-name" error={errors.name}>
            <Input
              id="p-name"
              value={v.name}
              onChange={(e) => set({ name: e.target.value })}
              maxLength={60}
              autoComplete="name"
            />
          </Field>
          <Field label="A little about you" htmlFor="p-about" error={errors.aboutMe}>
            <Textarea
              id="p-about"
              rows={2}
              placeholder="Weekend gardener, always cold, drinks too much tea."
              value={v.aboutMe}
              onChange={(e) => set({ aboutMe: e.target.value })}
              maxLength={500}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gift preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Things I love" htmlFor="p-likes" error={errors.likes}>
            <Textarea
              id="p-likes"
              rows={2}
              placeholder="Pottery, mystery novels, good olive oil"
              value={v.likes}
              onChange={(e) => set({ likes: e.target.value })}
              maxLength={500}
            />
          </Field>
          <Field
            label="Please no"
            htmlFor="p-dislikes"
            hint="Allergies, scents, clutter — anything to avoid."
            error={errors.dislikes}
          >
            <Textarea
              id="p-dislikes"
              rows={2}
              placeholder="Scented candles, anything with nuts"
              value={v.dislikes}
              onChange={(e) => set({ dislikes: e.target.value })}
              maxLength={500}
            />
          </Field>
          <Field label="Favorite colors" htmlFor="p-colors" error={errors.favoriteColors}>
            <Input
              id="p-colors"
              placeholder="Forest green, mustard"
              value={v.favoriteColors}
              onChange={(e) => set({ favoriteColors: e.target.value })}
              maxLength={200}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sizes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Tops" htmlFor="p-top">
            <Input
              id="p-top"
              placeholder="M"
              value={v.sizes.top}
              onChange={(e) => size("top", e.target.value)}
              maxLength={40}
            />
          </Field>
          <Field label="Bottoms" htmlFor="p-bottom">
            <Input
              id="p-bottom"
              placeholder="32x30"
              value={v.sizes.bottom}
              onChange={(e) => size("bottom", e.target.value)}
              maxLength={40}
            />
          </Field>
          <Field label="Shoes" htmlFor="p-shoe">
            <Input
              id="p-shoe"
              placeholder="9"
              value={v.sizes.shoe}
              onChange={(e) => size("shoe", e.target.value)}
              maxLength={40}
            />
          </Field>
          <Field label="Ring" htmlFor="p-ring">
            <Input
              id="p-ring"
              placeholder="7"
              value={v.sizes.ring}
              onChange={(e) => size("ring", e.target.value)}
              maxLength={40}
            />
          </Field>
          <Field label="Anything else" htmlFor="p-other" className="col-span-2 sm:col-span-4">
            <Input
              id="p-other"
              placeholder="Hat: L, gloves: M"
              value={v.sizes.other}
              onChange={(e) => size("other", e.target.value)}
              maxLength={200}
            />
          </Field>
        </CardContent>
      </Card>

      <Card id="shipping-address" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Shipping address</CardTitle>
          <CardDescription>
            Only shown to your Santa — and only in exchanges where gifts are shipped, or in-person exchanges where
            you&apos;ve asked to have yours shipped.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="a-name" className="sm:col-span-2">
            <Input
              id="a-name"
              autoComplete="shipping name"
              value={v.address.name}
              onChange={(e) => addr("name", e.target.value)}
            />
          </Field>
          <Field label="Address" htmlFor="a-line1" className="sm:col-span-2">
            <Input
              id="a-line1"
              autoComplete="shipping address-line1"
              value={v.address.line1}
              onChange={(e) => addr("line1", e.target.value)}
            />
          </Field>
          <Field label="Apartment, suite, etc." htmlFor="a-line2" className="sm:col-span-2">
            <Input
              id="a-line2"
              autoComplete="shipping address-line2"
              value={v.address.line2}
              onChange={(e) => addr("line2", e.target.value)}
            />
          </Field>
          <Field label="City" htmlFor="a-city">
            <Input
              id="a-city"
              autoComplete="shipping address-level2"
              value={v.address.city}
              onChange={(e) => addr("city", e.target.value)}
            />
          </Field>
          <Field label="State / region" htmlFor="a-region">
            <Input
              id="a-region"
              autoComplete="shipping address-level1"
              value={v.address.region}
              onChange={(e) => addr("region", e.target.value)}
            />
          </Field>
          <Field label="Postal code" htmlFor="a-postal">
            <Input
              id="a-postal"
              autoComplete="shipping postal-code"
              value={v.address.postalCode}
              onChange={(e) => addr("postalCode", e.target.value)}
            />
          </Field>
          <Field label="Country" htmlFor="a-country">
            <Input
              id="a-country"
              autoComplete="shipping country-name"
              value={v.address.country}
              onChange={(e) => addr("country", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="sticky bottom-20 z-10 flex justify-end sm:bottom-4">
        <Button type="submit" size="lg" disabled={pending} className="shadow-lg">
          {pending ? <CircleNotchIcon className="animate-spin" /> : null}
          Save profile
        </Button>
      </div>
    </form>
  );
}
