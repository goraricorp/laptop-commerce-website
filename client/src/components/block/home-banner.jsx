import { useCallback, useMemo, useSyncExternalStore } from "react";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useCarousel } from "@/hooks/use-carousel";
import macbook from "@/assets/image/overviews/macbook.png";
import xps from "@/assets/image/overviews/xps.jpeg";
import surface from "@/assets/image/overviews/sfc.jpeg";
import purple from "@/assets/image/overviews/purple.jpeg";
import yoga from "@/assets/image/overviews/yogabook.jpeg";
import shop from "@/assets/image/overviews/jp.jpeg";

const banners = [
  { src: macbook, title: "MacBook", description: "Developer love Mac" },
  { src: xps, title: "Dell XPS", description: "Most beautiful Ultrabook" },
  {
    src: surface,
    title: "Microsoft Surface",
    description: "Surface x Copilot",
  },
  { src: purple, title: "Bộ sưu tập laptop", description: "Products" },
  { src: yoga, title: "Lenovo Yoga Book", description: "Double Display" },
  { src: shop, title: "Laptop Commerce", description: "Powered by Gorth inc." },
];

function BannerControls() {
  const { api } = useCarousel();
  const subscribe = useCallback(
    (notify) => {
      if (!api) return () => {};
      api.on("select", notify).on("reInit", notify);
      return () => {
        api.off("select", notify).off("reInit", notify);
      };
    },
    [api],
  );
  const snapshot = useCallback(() => api?.selectedScrollSnap() ?? 0, [api]);
  const selected = useSyncExternalStore(subscribe, snapshot, () => 0);
  return (
    <>
      <CarouselPrevious
        aria-label="Banner sản phẩm: cuộn trước"
        className="left-4"
      />
      <CarouselNext
        aria-label="Banner sản phẩm: cuộn sau"
        className="right-4"
      />
      <nav
        aria-label="Chọn banner"
        className="absolute inset-x-0 bottom-4 flex justify-center gap-2"
      >
        {banners.map((banner, index) => (
          <Button
            key={banner.src}
            type="button"
            size="icon-xs"
            variant={selected === index ? "default" : "outline"}
            className="h-1.5 w-8 rounded-none p-0"
            aria-label={`Chọn banner ${index + 1}`}
            aria-current={selected === index ? "true" : undefined}
            onClick={() => api?.scrollTo(index)}
          />
        ))}
      </nav>
    </>
  );
}

export function HomeBanner() {
  const plugins = useMemo(
    () => [
      Fade(),
      Autoplay({
        delay: 5000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        stopOnFocusIn: true,
        rootNode: (viewport) => viewport.parentElement,
        breakpoints: { "(prefers-reduced-motion: reduce)": { active: false } },
      }),
    ],
    [],
  );
  return (
    <Carousel
      aria-label="Banner sản phẩm"
      tabIndex={0}
      opts={{ loop: true }}
      plugins={plugins}
      className="min-w-0 overflow-hidden rounded-xl"
    >
      <CarouselContent className="ml-0">
        {banners.map((banner, index) => (
          <CarouselItem
            key={banner.src}
            className="relative pl-0"
            aria-label={`${index + 1} / ${banners.length}`}
          >
            <img
              src={banner.src}
              alt={banner.title}
              loading={index ? "lazy" : "eager"}
              className="h-[min(500px,65svh)] min-h-64 w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-16 bottom-12 flex flex-col gap-2 text-center text-white [text-shadow:0_1px_4px_rgb(0_0_0/90%)]">
              <h2 className="text-xl font-semibold sm:text-3xl">
                {banner.title}
              </h2>
              <p className="text-sm sm:text-base">{banner.description}</p>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <BannerControls />
    </Carousel>
  );
}
