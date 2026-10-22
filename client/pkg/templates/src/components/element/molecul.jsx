/* eslint-disable react/prop-types */
import { Carousel as ShadcnCarousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

export function Carousel({ items = [], dark = false }) {
  return (
    <ShadcnCarousel className={dark ? 'text-foreground' : undefined}>
      <CarouselContent>
        {items.map((item, index) => (
          <CarouselItem key={item.id ?? index}>
            <figure className="relative overflow-hidden rounded-xl">
              <img src={item.src ?? item.image} alt={item.alt ?? item.title ?? `Slide ${index + 1}`} className="aspect-video w-full object-cover" />
              {(item.title || item.description) && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-16 text-white">
                  {item.title && <h3 className="font-semibold">{item.title}</h3>}
                  {item.description && <p className="text-sm text-white/80">{item.description}</p>}
                </figcaption>
              )}
            </figure>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious /><CarouselNext />
    </ShadcnCarousel>
  )
}
