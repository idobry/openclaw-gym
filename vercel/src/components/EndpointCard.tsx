interface EndpointCardProps {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
}

export function EndpointCard({ method, path, description }: EndpointCardProps) {
  const badgeClass = `badge-${method.toLowerCase()}`;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <span className={`${badgeClass} px-2 py-0.5 rounded text-xs font-mono font-semibold shrink-0 mt-0.5`}>
        {method}
      </span>
      <div>
        <code className="text-text-primary text-sm font-mono">{path}</code>
        <p className="text-text-secondary text-xs mt-0.5">{description}</p>
      </div>
    </div>
  );
}
