/* eslint-disable react/prop-types */
import { Accordion, AccordionContent, AccordionItem as ShadcnAccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function AccordionItem({ id, title, content, isActive, onToggle }) {
  return (
    <ShadcnAccordionItem value={String(id)}>
      <AccordionTrigger onClick={() => onToggle?.(id)}>{title}</AccordionTrigger>
      <AccordionContent forceMount={isActive || undefined}>{content}</AccordionContent>
    </ShadcnAccordionItem>
  )
}

export function AccordionContainer({ title, items = [] }) {
  return (
    <section className="flex flex-col gap-3">
      {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, index) => (
          <AccordionItem key={item.id ?? index} id={item.id ?? index} {...item} />
        ))}
      </Accordion>
    </section>
  )
}
