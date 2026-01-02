import { Layout } from '@/components/layout/Layout';
import { useCryptoStore } from '@/store/cryptoStore';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Moon, 
  Sun, 
  Key, 
  Shield, 
  Bell, 
  Globe,
  Download
} from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';

const Settings = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useCryptoStore();
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSaveApiKey = () => {
    toast({
      title: t('settings.apiKeyUpdated'),
      description: t('settings.apiKeyUpdatedMessage'),
    });
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

        {/* API Configuration */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Key className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{t('settings.apiConfiguration')}</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning font-medium">⚠️ {t('settings.securityNotice')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('settings.securityMessage')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">{t('settings.apiKeyName')}</Label>
              <Input
                id="api-key"
                type="text"
                placeholder={t('settings.enterApiKeyName')}
                className="bg-muted/50"
              />
            </div>

            <div className="flex items-center justify-between py-4 border-t border-border/50">
              <div>
                <Label htmlFor="readonly">{t('settings.readOnlyMode')}</Label>
                <p className="text-sm text-muted-foreground mt-1">{t('settings.readOnlyDescription')}</p>
              </div>
              <Switch
                id="readonly"
                checked={readOnlyMode}
                onCheckedChange={setReadOnlyMode}
              />
            </div>

            <Button onClick={handleSaveApiKey} className="w-full gradient-primary">
              {t('settings.saveApiConfiguration')}
            </Button>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{t('settings.security')}</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-border/50">
              <div>
                <Label>{t('settings.twoFactor')}</Label>
                <p className="text-sm text-muted-foreground mt-1">{t('settings.twoFactorDescription')}</p>
              </div>
              <Button variant="outline" size="sm">{t('settings.enable2fa')}</Button>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <Label>{t('settings.sessionManagement')}</Label>
                <p className="text-sm text-muted-foreground mt-1">{t('settings.sessionDescription')}</p>
              </div>
              <Button variant="outline" size="sm">{t('settings.viewSessions')}</Button>
            </div>
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

          <Button variant="outline" className="w-full gap-2">
            <Globe className="h-4 w-4" />
            {t('settings.installCryptoPlace')}
          </Button>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Settings;
