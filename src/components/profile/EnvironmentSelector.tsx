
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface EnvironmentSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showPreview?: boolean;
}

interface EnvironmentOption {
  value: string;
  label: string;
  badgeClass: string;
  borderClass: string;
  description?: string;
}

const environmentOptions: EnvironmentOption[] = [
  {
    value: 'office',
    label: 'Office',
    badgeClass: 'bg-blue-600 text-white',
    borderClass: 'border-blue-300',
    description: 'Professional environment with minimal distractions'
  },
  {
    value: 'park',
    label: 'Park',
    badgeClass: 'bg-green-800 text-white',
    borderClass: 'border-green-600',
    description: 'Natural, open space with refreshing atmosphere'
  },
  {
    value: 'home',
    label: 'Home',
    badgeClass: 'bg-orange-500 text-white',
    borderClass: 'border-orange-300',
    description: 'Comfortable and familiar setting'
  },
  {
    value: 'coffee-shop',
    label: 'Coffee Shop',
    badgeClass: 'bg-amber-800 text-white',
    borderClass: 'border-amber-700',
    description: 'Ambient background noise with creative atmosphere'
  },
  {
    value: 'library',
    label: 'Library',
    badgeClass: 'bg-gray-600 text-white',
    borderClass: 'border-gray-300',
    description: 'Quiet, focused environment for deep concentration'
  }
];

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  showPreview = true
}) => {
  const [selectedOption, setSelectedOption] = useState<EnvironmentOption | undefined>(() => 
    environmentOptions.find(option => option.value === value)
  );
  
  const { shouldApplyEnvironmentTheming } = useTheme();
  const [canShowPreview, setCanShowPreview] = useState(false);
  
  useEffect(() => {
    // Update the selected option when value changes externally
    const option = environmentOptions.find(opt => opt.value === value);
    setSelectedOption(option);
  }, [value]);
  
  useEffect(() => {
    // Only show preview if we're on a route that supports environment theming
    setCanShowPreview(showPreview && shouldApplyEnvironmentTheming());
  }, [showPreview, shouldApplyEnvironmentTheming]);
  
  const handleChange = useCallback((newValue: string) => {
    const option = environmentOptions.find(opt => opt.value === newValue);
    setSelectedOption(option);
    onChange(newValue);
  }, [onChange]);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="environment-select">Study Environment</Label>
        {selectedOption && canShowPreview && (
          <Badge variant="outline" className={`${selectedOption.badgeClass} text-xs`}>
            {selectedOption.label}
          </Badge>
        )}
      </div>
      
      <Select 
        value={value} 
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger 
          id="environment-select" 
          className={selectedOption ? `${selectedOption.borderClass}` : ''}
        >
          <SelectValue placeholder="Select an environment" />
        </SelectTrigger>
        <SelectContent>
          {environmentOptions.map(option => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="flex items-center"
            >
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                <Badge variant="outline" className={`ml-2 ${option.badgeClass} text-xs`}>
                  Preview
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedOption?.description && (
        <p className="text-xs text-muted-foreground">{selectedOption.description}</p>
      )}
      
      {!canShowPreview && showPreview && (
        <p className="text-xs text-muted-foreground italic">
          Environment preview not available on this page. Changes will be visible on dashboard and other main pages.
        </p>
      )}
    </div>
  );
};

export default EnvironmentSelector;
