interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language = "bash", title }: CodeBlockProps) {
  return (
    <div className="code-block">
      {title && (
        <div className="px-4 py-2 border-b border-border flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-text-secondary text-xs ml-2">{title}</span>
        </div>
      )}
      <pre className="p-4 text-sm leading-relaxed overflow-x-auto">
        <code className="text-text-primary">{code}</code>
      </pre>
    </div>
  );
}
