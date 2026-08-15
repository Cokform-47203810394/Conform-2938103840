import { X } from "lucide-react";

export function Popover({ onClose, children, width = "w-72" }) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className={`absolute right-0 top-12 z-40 ${width} overflow-hidden rounded-xl bg-white p-4 shadow-[0_4px_8px_3px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.3)]`}
      >
        {children}
      </div>
    </>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-medium text-[#17251F]">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-[#78837C] hover:bg-[#17251F]/[0.06]">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
