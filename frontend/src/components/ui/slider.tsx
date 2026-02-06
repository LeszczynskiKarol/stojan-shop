// src/components/ui/slider.tsx
"use client";
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  value: number[];
  min: number;
  max: number;
  step: number;
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  onThumbDrag?: (value: number, index: number) => void;
}
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      min,
      max,
      step,
      onValueChange,
      onValueCommit,
      onThumbDrag,
      value,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = React.useState(value);
    const isDraggingRef = React.useRef(false);
    const prevValueRef = React.useRef(value);
    const activeThumbRef = React.useRef<number | null>(null);
    React.useEffect(() => {
      if (
        !isDraggingRef.current ||
        value[0] !== prevValueRef.current[0] ||
        value[1] !== prevValueRef.current[1]
      ) {
        setLocalValue(value);
        prevValueRef.current = value;
      }
    }, [value]);
    const handleValueChange = React.useCallback(
      (newValue: number[]) => {
        setLocalValue(newValue);
        onValueChange?.(newValue);
        if (isDraggingRef.current && activeThumbRef.current !== null) {
          onThumbDrag?.(
            newValue[activeThumbRef.current],
            activeThumbRef.current
          );
        }
      },
      [onValueChange, onThumbDrag]
    );
    const handleValueCommit = React.useCallback(
      (newValue: number[]) => {
        isDraggingRef.current = false;
        setLocalValue(newValue);
        prevValueRef.current = newValue;
        activeThumbRef.current = null;
        onValueCommit?.(newValue);
      },
      [onValueCommit]
    );
    const handlePointerDown = React.useCallback((index: number) => {
      isDraggingRef.current = true;
      activeThumbRef.current = index;
    }, []);
    const handlePointerUp = React.useCallback(() => {
      isDraggingRef.current = false;
      activeThumbRef.current = null;
    }, []);
    return (
      <SliderPrimitive.Root
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={localValue}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        className="relative flex h-5 w-full touch-none items-center"
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-gray-200">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-blue-600" />
        </SliderPrimitive.Track>
        {localValue.map((v, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className="block h-4 w-4 rounded-full border border-blue-600 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            onPointerDown={() => handlePointerDown(i)}
            onPointerUp={handlePointerUp}
          />
        ))}
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = "Slider";
export { Slider };
