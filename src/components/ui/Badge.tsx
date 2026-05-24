type BadgeProps = {
  variant: "HEALTHY" | "AT RISK" | "Critical";
};

function getTone(variant: BadgeProps["variant"]) {
  if (variant === "HEALTHY") {
    return "bg-[rgba(45,74,62,0.10)] text-[#2D4A3E]";
  }

  if (variant === "AT RISK") {
    return "bg-[rgba(194,136,64,0.12)] text-[#8C5D1E]";
  }

  return "bg-[rgba(158,59,46,0.10)] text-[#9E3B2E]";
}

export function Badge({ variant }: BadgeProps) {
  const label = variant === "AT RISK" ? "At risk" : variant.toLowerCase();

  return (
    <span className={`inline-flex rounded-full px-3 py-1 font-sans text-[13px] font-medium leading-[1.45] ${getTone(variant)}`}>
      {label}
    </span>
  );
}
