export interface FormData {
  emailAddress: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}