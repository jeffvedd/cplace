import { motion } from 'framer-motion';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LivePriceStatusProps {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export const LivePriceStatus = ({ 
  isLoading, 
  error, 
  lastUpdated, 
  onRefresh 
}: LivePriceStatusProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Status Indicator */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
        {error ? (
          <>
            <WifiOff className="h-4 w-4 text-destructive" />
            <span className="text-xs text-destructive font-medium">Offline</span>
          </>
        ) : (
          <>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-success"
            />
            <Wifi className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">
              Live prices
            </span>
          </>
        )}
      </div>

      {/* Last Updated */}
      {lastUpdated && !error && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Updated {formatTime(lastUpdated)}
        </span>
      )}

      {/* Refresh Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
        className="h-8 w-8"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};
