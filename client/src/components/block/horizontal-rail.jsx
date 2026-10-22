import PropTypes from "prop-types";
import { Children } from "react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function HorizontalRail({ label, children, banner = false }) {
  return (
    <Carousel
      tabIndex={0}
      aria-label={label}
      opts={{
        align: "start",
        loop: banner,
        slidesToScroll: banner ? 1 : "auto",
      }}
      className="group/rail min-w-0"
    >
      <CarouselContent className={cn(banner && "ml-0")}>
        {Children.toArray(children).map((child) => (
          <CarouselItem
            key={child.key}
            className={cn(
              banner ? "pl-0" : "basis-[85%] sm:basis-1/2 lg:basis-1/5",
            )}
          >
            {child}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious
        aria-label={`${label}: cuộn trước`}
        className="left-2 pointer-events-none opacity-0 transition-opacity group-hover/rail:pointer-events-auto group-hover/rail:opacity-100 group-focus-within/rail:pointer-events-auto group-focus-within/rail:opacity-100"
      />
      <CarouselNext
        aria-label={`${label}: cuộn sau`}
        className="right-2 pointer-events-none opacity-0 transition-opacity group-hover/rail:pointer-events-auto group-hover/rail:opacity-100 group-focus-within/rail:pointer-events-auto group-focus-within/rail:opacity-100"
      />
    </Carousel>
  );
}
HorizontalRail.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
  banner: PropTypes.bool,
};
