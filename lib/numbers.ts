import { prisma } from "./prisma";

async function nextSeq(prefix: string, field: "requisition" | "po" | "gr" | "tender" | "pay") {
  const year = new Date().getFullYear();
  const start = `${prefix}-${year}-`;
  if (field === "requisition") {
    const last = await prisma.requisition.findFirst({
      where: { number: { startsWith: start } },
      orderBy: { number: "desc" },
    });
    const n = last ? parseInt(last.number.slice(-4), 10) + 1 : 1;
    return `${start}${String(n).padStart(4, "0")}`;
  }
  if (field === "po") {
    const last = await prisma.purchaseOrder.findFirst({
      where: { number: { startsWith: start } },
      orderBy: { number: "desc" },
    });
    const n = last ? parseInt(last.number.slice(-4), 10) + 1 : 1;
    return `${start}${String(n).padStart(4, "0")}`;
  }
  if (field === "gr") {
    const last = await prisma.goodsReceipt.findFirst({
      where: { number: { startsWith: start } },
      orderBy: { number: "desc" },
    });
    const n = last ? parseInt(last.number.slice(-4), 10) + 1 : 1;
    return `${start}${String(n).padStart(4, "0")}`;
  }
  if (field === "tender") {
    const last = await prisma.tender.findFirst({
      where: { number: { startsWith: start } },
      orderBy: { number: "desc" },
    });
    const n = last ? parseInt(last.number.slice(-4), 10) + 1 : 1;
    return `${start}${String(n).padStart(4, "0")}`;
  }
  const last = await prisma.payment.findFirst({
    where: { runNumber: { startsWith: start } },
    orderBy: { runNumber: "desc" },
  });
  const n = last ? parseInt(last.runNumber.slice(-4), 10) + 1 : 1;
  return `${start}${String(n).padStart(4, "0")}`;
}

export const nextDA = () => nextSeq("DA", "requisition");
export const nextBC = () => nextSeq("BC", "po");
export const nextBR = () => nextSeq("BR", "gr");
export const nextAO = () => nextSeq("AO", "tender");
export const nextPAY = () => nextSeq("PAY", "pay");
