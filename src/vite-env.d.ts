
/// <reference types="vite/client" />

// Declare clooned-object as a valid JSX element
declare namespace JSX {
  interface IntrinsicElements {
    'clooned-object': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      features?: string;
      oid?: string;
    };
  }
}
