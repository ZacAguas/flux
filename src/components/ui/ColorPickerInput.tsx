/**
 * Color Picker Input Component
 *
 * Reusable color picker using HeroUI components.
 */

import type { Color, ColorChannel, ColorSpace } from '@heroui/react';
import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  Label,
  ListBox,
  Select,
} from '@heroui/react';
import { useState } from 'react';

interface ColorPickerInputProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}

const colorChannelsByColorSpace: Record<ColorSpace, ColorChannel[]> = {
  hsb: ['hue', 'saturation', 'brightness'],
  hsl: ['hue', 'saturation', 'lightness'],
  rgb: ['red', 'green', 'blue'],
};

export function ColorPickerInput({ value, onChange, label }: ColorPickerInputProps) {
  const [colorSpace, setColorSpace] = useState<ColorSpace>('hsb');

  return (
    <ColorPicker value={value} onChange={(color: Color) => onChange(color.toString('hex'))}>
      <ColorPicker.Trigger className="flex items-center gap-2 cursor-pointer outline-none group !bg-transparent !border-0 !shadow-none !p-0 !rounded-none">
        <ColorSwatch size="sm" className="rounded-md shrink-0" />
        {label && (
          <span className="text-white/50 text-xs font-medium group-hover:text-white/70 transition-colors duration-200">
            {label}
          </span>
        )}
      </ColorPicker.Trigger>
      <ColorPicker.Popover className="max-w-62 gap-2 bg-black/80 backdrop-blur-md border border-white/15 rounded-xl p-3 shadow-xl">
        <ColorArea
          className="max-w-full rounded-lg overflow-hidden"
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
        >
          <ColorArea.Thumb className="border-2 border-white shadow-md" />
        </ColorArea>
        <ColorSlider channel="hue" className="gap-1 px-1" colorSpace="hsb">
          <Label className="text-white/50 text-xs font-medium">Hue</Label>
          <ColorSlider.Output className="text-white/40 text-xs" />
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
        <Select
          aria-label="Color space"
          value={colorSpace}
          variant="secondary"
          className="w-full"
          onChange={(val) => setColorSpace(val as ColorSpace)}
        >
          <Select.Trigger className="bg-white/10 border border-white/15 rounded-lg text-white/70 text-xs px-2 py-1.5 h-auto">
            <Select.Value className="uppercase text-xs text-white/70" />
            <Select.Indicator className="text-white/40" />
          </Select.Trigger>
          <Select.Popover className="bg-black/80 backdrop-blur-md border border-white/15 rounded-lg overflow-hidden">
            <ListBox className="bg-transparent p-1">
              {Object.keys(colorChannelsByColorSpace).map((space) => (
                <ListBox.Item
                  key={space}
                  id={space}
                  textValue={space}
                  className="uppercase text-xs text-white/70 rounded-md px-2 py-1.5 cursor-pointer hover:bg-white/10 data-[focused=true]:bg-white/10 outline-none"
                >
                  {space}
                  <ListBox.ItemIndicator className="text-white/50" />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <div className="grid w-full grid-cols-3 gap-2">
          {colorChannelsByColorSpace[colorSpace].map((channel) => (
            <ColorField
              key={channel}
              aria-label={channel}
              channel={channel}
              colorSpace={colorSpace}
            >
              <ColorField.Group
                variant="secondary"
                className="bg-white/10 border border-white/15 rounded-lg overflow-hidden"
              >
                <ColorField.Input className="text-white/70 text-xs text-center bg-transparent px-1 py-1.5 w-full outline-none" />
              </ColorField.Group>
            </ColorField>
          ))}
        </div>
      </ColorPicker.Popover>
    </ColorPicker>
  );
}
