import { LoadingSpinner } from "./LoadingSpinner";

interface ActionButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export const ActionButton = ({
  onClick,
  disabled = false,
  isLoading = false,
  loadingText,
  children,
  className = '',
  variant = 'primary'
}: ActionButtonProps) => {
  const baseStyles = "px-4 py-2 rounded-xl shadow-lg transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3";
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98]",
    secondary: "bg-white text-gray-800 hover:bg-gray-100"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className={`animate-spin w-4 h-4 border-2 ${variant === 'primary' ? 'border-white' : 'border-gray-500'} border-t-transparent rounded-full mr-2`} />
          {loadingText}
        </div>
      ) : (
        children
      )}
    </button>
  );
}; 