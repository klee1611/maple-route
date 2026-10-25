import type { Metadata } from "next";
import { Checker } from "@/components/Checker";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({ path: "/" });

export default function Home() {
  return <Checker />;
}
