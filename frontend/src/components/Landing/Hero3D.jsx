import { useTilt } from "./Tilt.jsx";

function Layer({ z, className = "", children }) {
  return (
    <div className={`absolute ${className}`} style={{ transform: `translateZ(${z}px)` }}>
      {children}
    </div>
  );
}

function ResumeSheet() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="h-3 w-40 rounded bg-slate-900" />
      <div className="mt-2 h-2 w-56 max-w-full rounded bg-slate-200" />
      {["Education", "Skills", "Projects"].map((section) => (
        <div key={section} className="mt-6">
          <div className="text-[10px] font-semibold tracking-widest text-indigo-600 uppercase">
            {section}
          </div>
          <div className="mt-2 h-px bg-slate-200" />
          <div className="mt-3 space-y-2">
            <div className="h-2 w-full rounded bg-slate-100" />
            <div className="h-2 w-11/12 rounded bg-slate-100" />
            <div className="h-2 w-4/6 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Sits right behind the resume. Its content is packed into the top-right
// corner, which is the part the peel uncovers.
function JDSheet() {
  return (
    <div className="h-full rounded-xl border border-indigo-100 bg-indigo-50 p-4">
      <div className="ml-auto w-36 text-right">
        <div className="text-[9px] font-semibold tracking-widest text-indigo-500 uppercase">
          Job description
        </div>
        <div className="mt-0.5 text-xs font-semibold text-slate-800">SDE Trainee</div>
        <div className="mt-2 flex flex-wrap justify-end gap-1">
          {["SQL", "React", "Docker"].map((k) => (
            <span
              key={k}
              className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-indigo-700"
            >
              {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// A stack of resume pages in perspective, with the analysis cards floating at
// different depths. The whole scene leans toward the mouse, and the front
// page periodically peels back to show the JD it is being compared against.
export default function Hero3D() {
  const tilt = useTilt(14);

  return (
    <div {...tilt} className="hero3d relative mx-auto w-full max-w-md py-10">
      <div className="hero3d-shadow" aria-hidden="true" />
      <div className="hero3d-float">
        <div className="hero3d-scene relative">
          <div
            className="absolute inset-0 rounded-xl border border-slate-200 bg-slate-50"
            style={{ transform: "translate3d(36px, -30px, -110px)" }}
          />
          <div className="absolute inset-0" style={{ transform: "translate3d(10px, -8px, -40px)" }}>
            <JDSheet />
          </div>

          <div className="hero3d-front relative">
            <div className="hero3d-peel-page">
              <ResumeSheet />
            </div>
            <div className="hero3d-peel-flap rounded-bl-sm" aria-hidden="true" />
          </div>

          <Layer z={70} className="-top-5 -left-4 sm:-left-10">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
              ✓ ATS-safe
            </div>
          </Layer>

          <Layer z={50} className="top-1/2 -left-6 sm:-left-14">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
              <div className="text-[10px] font-medium text-slate-400">Bullet tip</div>
              <div className="text-xs font-medium text-slate-700">Add a number</div>
            </div>
          </Layer>

          <Layer z={100} className="-right-3 -bottom-8 w-56 sm:-right-12">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-500">JD match</span>
                <span className="text-2xl font-semibold text-slate-900">82%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 w-[82%] rounded-full bg-indigo-600" />
              </div>
              <div className="mt-3 text-[11px] font-medium text-slate-500">Missing skills</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] text-red-700">
                  Docker
                </span>
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
                  Kubernetes
                </span>
              </div>
            </div>
          </Layer>
        </div>
      </div>
    </div>
  );
}
