import type { InboxItem } from "@/lib/inbox";
import { DAPane } from "./DAPane";
import { AOPane } from "./AOPane";
import { FAPane } from "./FAPane";
import { POPane } from "./POPane";
import { PayPane } from "./PayPane";
import { GRPane } from "./GRPane";

export async function InboxRight({ item, tab }: { item: InboxItem; tab?: string }) {
  switch (item.kind) {
    case "da":
      return <DAPane id={item.id} />;
    case "ao":
      return <AOPane id={item.id} tab={tab} />;
    case "fa":
      return <FAPane id={item.id} />;
    case "pay":
      return <PayPane id={item.id} />;
    case "po":
      return <POPane id={item.id} />;
    default:
      return null;
  }
}

export function PaneByKind({ kind, id }: { kind: string; id: string }) {
  switch (kind) {
    case "da":
      return <DAPane id={id} />;
    case "ao":
      return <AOPane id={id} />;
    case "fa":
      return <FAPane id={id} />;
    case "pay":
      return <PayPane id={id} />;
    case "po":
      return <POPane id={id} />;
    case "gr":
      return <GRPane id={id} />;
    default:
      return <DAPane id={id} />;
  }
}
