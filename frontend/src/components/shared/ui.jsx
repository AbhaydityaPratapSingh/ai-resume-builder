const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ label, hint, ...props }) {
  const input = <input className={inputClass} {...props} />;
  return label ? <Field label={label} hint={hint}>{input}</Field> : input;
}

export function TextArea({ label, hint, rows = 3, ...props }) {
  const area = <textarea rows={rows} className={`${inputClass} resize-y`} {...props} />;
  return label ? <Field label={label} hint={hint}>{area}</Field> : area;
}

export function Button({ variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    danger: "text-red-500 hover:bg-red-50",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function FormSection({ title, children, onAdd, addLabel }) {
  return (
    <section className="border-b border-slate-200 px-5 py-5 last:border-b-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">
          {title}
        </h3>
        {onAdd ? (
          <Button variant="secondary" onClick={onAdd} className="px-2 py-1 text-xs">
            + {addLabel || "Add"}
          </Button>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function ItemCard({ children, onRemove }) {
  return (
    <div className="relative rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      {onRemove ? (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-500"
          aria-label="Remove"
        >
          Remove
        </button>
      ) : null}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function EmptyHint({ children }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}
