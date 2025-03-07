"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Learn() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is a blockchain?</AccordionTrigger>
        <AccordionContent>
          A blockchain is a distributed digital ledger that stores data in blocks that are linked together chronologically and secured using cryptography.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do smart contracts work?</AccordionTrigger>
        <AccordionContent>
          Smart contracts are self-executing contracts with the terms directly written into code. They automatically execute when predetermined conditions are met.
        </AccordionContent>
      </AccordionItem>
      {/* Add more educational content */}
    </Accordion>
  );
}