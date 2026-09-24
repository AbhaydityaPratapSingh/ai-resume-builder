import { useRef } from "react";

// Tilts toward the mouse by writing CSS variables straight to the element,
// so pointer moves never trigger a React re-render. Styles live in index.css.
export function useTilt(max) {
  const ref = useRef(null);

  function onPointerMove(e) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * max).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
  }

  function onPointerLeave() {
    const el = ref.current;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return { ref, onPointerMove, onPointerLeave };
}

export default function Tilt({ as: Tag = "div", max = 10, className = "", children, ...props }) {
  const tilt = useTilt(max);
  return (
    <Tag {...props} {...tilt} className={`tilt ${className}`}>
      {children}
      <span className="tilt-glare" aria-hidden="true" />
    </Tag>
  );
}
