import { cn } from "@/lib/utils";
import PropTypes from "prop-types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function TableIdentity({
  title,
  description,
  image,
  imageFit = "contain",
}) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const initials =
    (words.length > 1
      ? words
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
      : words[0]?.slice(0, 2)
    )?.toUpperCase() || "—";
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 shrink-0 rounded-md after:rounded-md">
        <AvatarImage
          src={image || undefined}
          alt={title}
          className={cn(
            "rounded-md",
            imageFit === "cover" ? "object-cover" : "object-contain",
          )}
        />
        <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="block max-w-72 truncate font-medium" title={title}>
          {title}
        </span>
        <span
          className="block max-w-72 truncate text-xs text-muted-foreground"
          title={description || undefined}
        >
          {description || "—"}
        </span>
      </div>
    </div>
  );
}
TableIdentity.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  image: PropTypes.string,
  imageFit: PropTypes.oneOf(["cover", "contain"]),
};
