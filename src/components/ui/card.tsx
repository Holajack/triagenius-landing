
import * as React from "react"
import { useOnboarding } from "@/contexts/OnboardingContext"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state } = useOnboarding();
  
  // Get environment-specific border color with more vibrant colors
  const getEnvBorderColor = () => {
    if (!state || !state.environment) return "";
    
    switch (state.environment) {
      case 'office': return "hover:border-blue-500 border-blue-300 transition-colors duration-300";
      case 'park': return "hover:border-green-600 border-green-500 transition-colors duration-300"; // More vibrant green
      case 'home': return "hover:border-orange-500 border-orange-300 transition-colors duration-300"; // More vibrant orange
      case 'coffee-shop': return "hover:border-amber-600 border-amber-500 transition-colors duration-300"; // More vibrant amber
      case 'library': return "hover:border-gray-500 border-gray-300 transition-colors duration-300";
      default: return "hover:border-purple-500 border-purple-300 transition-colors duration-300";
    }
  };

  // Get environment-specific background gradient with more pronounced colors
  const getEnvBackground = () => {
    if (!state || !state.environment) return "";
    
    switch (state.environment) {
      case 'office': return "bg-gradient-to-br from-blue-100/90 to-white";
      case 'park': return "bg-gradient-to-br from-green-100/90 to-white"; // More opacity for better visibility
      case 'home': return "bg-gradient-to-br from-orange-100/90 to-white"; // More opacity for better visibility
      case 'coffee-shop': return "bg-gradient-to-br from-amber-100/90 to-white"; // More opacity for better visibility
      case 'library': return "bg-gradient-to-br from-gray-100/90 to-white";
      default: return "bg-gradient-to-br from-purple-100/90 to-white";
    }
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300",
        getEnvBorderColor(),
        getEnvBackground(),
        className
      )}
      {...props}
    />
  );
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
