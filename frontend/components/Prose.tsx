export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[68ch] space-y-4 [&_a]:underline [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ul]:list-disc [&_ul]:space-y-2">
      {children}
    </div>
  );
}
