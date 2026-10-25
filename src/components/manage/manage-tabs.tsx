"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";

export type ManageTab = "people" | "invites" | "rules" | "draw" | "settings";

const labels: Record<ManageTab, string> = {
  people: "People",
  invites: "Invite",
  rules: "Households & exclusions",
  draw: "Draw",
  settings: "Settings",
};

export function ManageTabs({
  initial,
  panels,
  badges = {},
}: {
  initial: ManageTab;
  panels: Record<ManageTab, React.ReactNode>;
  badges?: Partial<Record<ManageTab, React.ReactNode>>;
}) {
  const [tab, setTab] = useState<ManageTab>(initial);
  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        setTab(v as ManageTab);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", v);
        window.history.replaceState(null, "", url);
      }}
    >
      <TabsList>
        {(Object.keys(labels) as ManageTab[]).map((key) => (
          <TabsTrigger key={key} value={key}>
            {labels[key]}
            {badges[key] ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{badges[key]}</span>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
      {(Object.keys(labels) as ManageTab[]).map((key) => (
        <TabsContent key={key} value={key} forceMount hidden={tab !== key}>
          {panels[key]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
