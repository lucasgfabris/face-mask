function LoadingSpinner() {
  return (
    <div
      className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary"
      role="status"
      aria-label="Carregando"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

export default LoadingSpinner;
