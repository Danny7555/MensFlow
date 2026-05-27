"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/buttonVariants"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center mb-4 h-9",
        caption_label: "text-sm font-medium",
        nav: "absolute left-0 right-0 top-0 bottom-0 flex items-center justify-between px-1 pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 z-10 pointer-events-auto"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 z-10 pointer-events-auto"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex justify-between",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2 justify-between",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal aria-selected:opacity-100 text-center"
        ),
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Nav: (props) => {
          const { onPreviousClick, onNextClick, className } = props;
          return (
            <div className={cn("absolute inset-x-0 top-0 flex items-center justify-between px-2 h-9 pointer-events-none", className)}>
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto"
                )}
                disabled={!onPreviousClick}
                onClick={onPreviousClick}
                aria-label="Go to previous month"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto"
                )}
                disabled={!onNextClick}
                onClick={onNextClick}
                aria-label="Go to next month"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          );
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
