
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, House } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

export function NotFoundView() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      {/* Immersive Background */}
      <div className="absolute inset-0">
        <img 
          src="/images/lady.png" 
          alt="Brand Background" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Area */}
      <div className="relative z-10 max-w-sm w-full px-6 text-center">
        <div className="bg-white/95 dark:bg-card/95 p-6 rounded-[32px] border border-border space-y-8">
          <div className="space-y-4">
            <div className="relative inline-block">
              <h1 className="text-[100px] font-medium leading-none tracking-tight text-[var(--mf-accent)] opacity-60 select-none">
                404
              </h1>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-medium text-foreground tracking-tight">
                Lost in the Flow?
              </h2>
              <p className="text-muted-foreground text-sm max-w-[28ch] mx-auto leading-relaxed font-normal">
                The page you're looking for has moved or doesn't exist yet.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button 
              variant="default" 
              size="lg" 
              onClick={() => navigate('/')}
              className="rounded-full h-11 px-6 bg-[var(--mf-accent)] hover:bg-[var(--mf-accent-hover)] text-white min-w-[130px] font-medium text-xs transition-transform active:scale-95 shadow-none"
            >
              <House className="mr-2 size-4" />
              Go Home
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate(-1)}
              className="rounded-full h-11 px-6 border-border bg-white/5 hover:bg-white/10 text-foreground min-w-[130px] font-medium text-xs transition-transform active:scale-95 shadow-none"
            >
              <ArrowLeft className="mr-2 size-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
