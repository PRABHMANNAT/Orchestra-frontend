import { TbMinus, TbPlus, TbRefresh } from "react-icons/tb";

export function CameraControlButtons({ onZoomIn, onZoomOut, onReset }: { onZoomIn: () => void; onZoomOut: () => void; onReset: () => void }) {
  const buttonClass = "flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(26,22,18,0.08)] bg-white text-[#1A1612] transition-colors hover:border-[#B8543D] hover:text-[#B8543D]";

  return (
    <div className="flex flex-col gap-2">
      <button type="button" className={buttonClass} onClick={onZoomIn} aria-label="Zoom in">
        <TbPlus size={17} strokeWidth={1.6} />
      </button>
      <button type="button" className={buttonClass} onClick={onZoomOut} aria-label="Zoom out">
        <TbMinus size={17} strokeWidth={1.6} />
      </button>
      <button type="button" className={buttonClass} onClick={onReset} aria-label="Reset camera">
        <TbRefresh size={17} strokeWidth={1.6} />
      </button>
    </div>
  );
}
