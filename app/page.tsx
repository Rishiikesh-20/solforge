import { SolForgeLanding } from "@/components/HomePage";
import { Buffer } from "buffer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).Buffer = Buffer;
export default function Home() {
  return <SolForgeLanding />;
}
