export type ErrorFallbackProps = {
  error?: Error;
  onReset?: () => void;
};

export const ErrorFallback = ({ error, onReset }: ErrorFallbackProps) => (
  <div role="alert">
    <p>Something went wrong.</p>
    {error && <pre>{error.message}</pre>}
    {onReset && <button onClick={onReset}>Try again</button>}
  </div>
);
