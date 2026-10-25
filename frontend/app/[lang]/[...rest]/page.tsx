import { notFound } from "next/navigation";

// The layout's dynamicParams = false would 404 here before the language's not-found page can render.
export const dynamicParams = true;

// Any path under a language that isn't a page: render that language's not-found page inside the layout.
export default function CatchAll() {
  notFound();
}
