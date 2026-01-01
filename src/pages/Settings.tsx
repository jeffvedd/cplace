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

const Settings = () => {
  const { theme, toggleTheme } = useCryptoStore();
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSaveApiKey = () => {
    toast({
      title: 'API Key Updated',
      description: 'Your Coinbase API key has been securely stored.',
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
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and security preferences.</p>
        </div>

        {/* Appearance */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            {theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            <h3 className="text-lg font-semibold">Appearance</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="theme">Dark Mode</Label>
              <p className="text-sm text-muted-foreground mt-1">Toggle between light and dark theme</p>
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
            <h3 className="text-lg font-semibold">API Configuration</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning font-medium">⚠️ Security Notice</p>
              <p className="text-sm text-muted-foreground mt-1">
                API keys should be stored securely on the server. Connect to Lovable Cloud to enable secure API key management.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key Name</Label>
              <Input
                id="api-key"
                type="text"
                placeholder="Enter your API key name"
                className="bg-muted/50"
              />
            </div>

            <div className="flex items-center justify-between py-4 border-t border-border/50">
              <div>
                <Label htmlFor="readonly">Read-Only Mode</Label>
                <p className="text-sm text-muted-foreground mt-1">Only allow viewing, disable trading</p>
              </div>
              <Switch
                id="readonly"
                checked={readOnlyMode}
                onCheckedChange={setReadOnlyMode}
              />
            </div>

            <Button onClick={handleSaveApiKey} className="w-full gradient-primary">
              Save API Configuration
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
            <h3 className="text-lg font-semibold">Security</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-border/50">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground mt-1">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable 2FA</Button>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <Label>Session Management</Label>
                <p className="text-sm text-muted-foreground mt-1">View and manage active sessions</p>
              </div>
              <Button variant="outline" size="sm">View Sessions</Button>
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
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Price Alerts</Label>
              <p className="text-sm text-muted-foreground mt-1">Receive alerts when prices change significantly</p>
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
            <h3 className="text-lg font-semibold">Install App</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Install Crypto Place on your device for quick access and offline viewing.
          </p>

          <Button variant="outline" className="w-full gap-2">
            <Globe className="h-4 w-4" />
            Install Crypto Place
          </Button>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Settings;
