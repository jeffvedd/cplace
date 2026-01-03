import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useCryptoStore } from '@/store/cryptoStore';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Moon, 
  Sun, 
  Bell, 
  Globe,
  Download,
  Info,
  Database
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';

const Settings = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useCryptoStore();
  const [notifications, setNotifications] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 max-w-3xl"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        {/* Language */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{t('settings.language')}</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>{t('settings.language')}</Label>
              <p className="text-sm text-muted-foreground mt-1">{t('settings.languageDescription')}</p>
            </div>
            <LanguageSelector />
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            {theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            <h3 className="text-lg font-semibold">{t('settings.appearance')}</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="theme">{t('settings.darkMode')}</Label>
              <p className="text-sm text-muted-foreground mt-1">{t('settings.darkModeDescription')}</p>
            </div>
            <Switch
              id="theme"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{t('settings.notifications')}</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">{t('settings.priceAlerts')}</Label>
              <p className="text-sm text-muted-foreground mt-1">{t('settings.priceAlertsDescription')}</p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
        </motion.div>

        {/* PWA Install */}
        {!isInstalled && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Download className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('settings.installApp')}</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {t('settings.installDescription')}
            </p>

            <Button 
              onClick={handleInstall}
              disabled={!deferredPrompt}
              variant="outline" 
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              {t('settings.installCryptoPlace')}
            </Button>
          </motion.div>
        )}

        {/* About */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{t('settings.about')}</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {t('settings.aboutDescription')}
          </p>

          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
            <Database className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">{t('settings.dataSource')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.dataSourceDescription')}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Settings;
