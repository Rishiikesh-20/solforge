import { SolForgeLanding } from "@/components/HomePage";
import {Buffer} from "buffer"
import { Suspense } from "react";
import Loading from "./loading";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).Buffer=Buffer
export default function Home() {
  return (
    <Suspense fallback={<Loading/>}>
      <SolForgeLanding />
    </Suspense>
      
  );
}
