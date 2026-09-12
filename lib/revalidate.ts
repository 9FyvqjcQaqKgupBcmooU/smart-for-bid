import { revalidatePath } from "next/cache";

export function revalidateS2P() {
  revalidatePath("/", "layout");
  revalidatePath("/appels-offres");
  revalidatePath("/demandes");
  revalidatePath("/commandes");
  revalidatePath("/receptions");
  revalidatePath("/factures");
  revalidatePath("/paiements");
}
