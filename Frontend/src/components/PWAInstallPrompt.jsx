import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { RiDownloadCloud2Line, RiCloseLine } from '@remixicon/react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4 max-w-sm w-full">
          <div className="bg-primary/10 p-3 rounded-full shrink-0">
            <RiDownloadCloud2Line className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h3 className="font-semibold leading-none">Install EMS App</h3>
            <p className="text-sm text-muted-foreground">Add to home screen for quick access.</p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
            <Button onClick={handleInstallClick} className="flex-1 sm:flex-none">
              Install
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0">
              <RiCloseLine className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
