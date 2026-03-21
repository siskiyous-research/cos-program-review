'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface SettingRow {
  key: string;
  value: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Notification settings
  const [notifyName, setNotifyName] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');

  // Reminder settings
  const [deanEmails, setDeanEmails] = useState('');
  const [vpEmails, setVpEmails] = useState('');
  const [savingReminders, setSavingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');

  // AI Provider state
  const [mode, setMode] = useState<'cloud' | 'local'>('local');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [localUrl, setLocalUrl] = useState('');
  const [localModel, setLocalModel] = useState('');
  const [localModels, setLocalModels] = useState<{ name: string; size?: number }[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [savingNotify, setSavingNotify] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const data: SettingRow[] = await res.json();
      const map: Record<string, string> = {};
      for (const row of data) {
        map[row.key] = row.value;
      }
      setSettings(map);
      setMode((map.ai_mode as 'cloud' | 'local') || 'local');
      if (map.openrouter_api_key) setApiKey(map.openrouter_api_key);
      if (map.local_ai_url) setLocalUrl(map.local_ai_url);
      if (map.local_ai_model) setLocalModel(map.local_ai_model);
      if (map.notify_name) setNotifyName(map.notify_name);
      if (map.notify_email) setNotifyEmail(map.notify_email);
      if (map.dean_emails) setDeanEmails(map.dean_emails);
      if (map.vp_emails) setVpEmails(map.vp_emails);
    } catch {
      // Settings not available yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const fetchModels = async () => {
    if (!localUrl) return;
    setFetchingModels(true);
    setLocalModels([]);

    try {
      // Try Ollama /api/tags first
      const baseUrl = localUrl.replace(/\/v1\/?$/, '');
      let models: { name: string; size?: number }[] = [];

      try {
        const res = await fetch(`${baseUrl}/api/tags`);
        if (res.ok) {
          const data = await res.json();
          models = (data.models || []).map((m: { name: string; size?: number }) => ({
            name: m.name,
            size: m.size,
          }));
        }
      } catch {
        // Not Ollama, try OpenAI-compatible
      }

      if (models.length === 0) {
        try {
          const endpoint = localUrl.endsWith('/v1') ? localUrl : `${localUrl}/v1`;
          const res = await fetch(`${endpoint}/models`);
          if (res.ok) {
            const data = await res.json();
            models = (data.data || []).map((m: { id: string }) => ({ name: m.id }));
          }
        } catch {
          // Server not reachable
        }
      }

      setLocalModels(models);
      // Auto-select largest QWEN model, or first model
      const qwenModels = models.filter(m => m.name.toLowerCase().includes('qwen'));
      if (qwenModels.length > 0) {
        // Sort by size descending (largest first)
        const sorted = [...qwenModels].sort((a, b) => (b.size || 0) - (a.size || 0));
        setLocalModel(sorted[0].name);
      } else if (models.length > 0 && !localModel) {
        setLocalModel(models[0].name);
      }
    } finally {
      setFetchingModels(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      if (mode === 'local') {
        // Try client-side first (faster for LAN)
        try {
          const endpoint = localUrl.endsWith('/v1') ? localUrl : `${localUrl}/v1`;
          const res = await fetch(`${endpoint}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: localModel,
              messages: [{ role: 'user', content: 'Say hello' }],
              max_tokens: 10,
            }),
          });
          if (res.ok) {
            setTestResult({ valid: true });
            return;
          }
        } catch {
          // CORS or network — fall through to server-side test
        }
      }

      const res = await fetch('/api/settings/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          apiKey: mode === 'cloud' ? apiKey : undefined,
          localUrl: mode === 'local' ? localUrl : undefined,
          localModel: mode === 'local' ? localModel : undefined,
        }),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ valid: false, error: String(err) });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      const saves = [
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'ai_mode', value: mode }),
        }),
      ];

      if (mode === 'cloud' && apiKey && !apiKey.includes('...')) {
        saves.push(
          fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'openrouter_api_key', value: apiKey }),
          })
        );
      }

      if (mode === 'local') {
        saves.push(
          fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'local_ai_url', value: localUrl }),
          }),
          fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'local_ai_model', value: localModel }),
          })
        );
      }

      await Promise.all(saves);
      setSaveMessage('AI settings saved successfully');
      await loadSettings();
    } catch {
      setSaveMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotify = async () => {
    setSavingNotify(true);
    setNotifyMessage('');
    try {
      await Promise.all([
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'notify_name', value: notifyName }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'notify_email', value: notifyEmail }),
        }),
      ]);
      setNotifyMessage('Notification settings saved successfully');
    } catch {
      setNotifyMessage('Failed to save notification settings');
    } finally {
      setSavingNotify(false);
    }
  };

  const handleSaveReminders = async () => {
    setSavingReminders(true);
    setReminderMessage('');
    try {
      await Promise.all([
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'dean_emails', value: deanEmails }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'vp_emails', value: vpEmails }),
        }),
      ]);
      setReminderMessage('Reminder settings saved successfully');
    } catch {
      setReminderMessage('Failed to save reminder settings');
    } finally {
      setSavingReminders(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const gb = bytes / 1e9;
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1e6).toFixed(0)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
          <Link
            href="/"
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
          >
            ← Back to App
          </Link>
        </div>

        {/* AI Provider Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">AI Provider</h2>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('local')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                mode === 'local'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Local AI
            </button>
            <button
              onClick={() => setMode('cloud')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                mode === 'cloud'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Cloud AI
            </button>
          </div>

          {/* Local AI Config */}
          {mode === 'local' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Endpoint URL
                </label>
                <input
                  type="text"
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                  placeholder="http://192.168.1.100:11434/v1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Supports Ollama, LM Studio, vLLM, or any OpenAI-compatible server
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Model</label>
                  <button
                    onClick={fetchModels}
                    disabled={!localUrl || fetchingModels}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:text-slate-400 flex items-center gap-1"
                  >
                    <svg className={`w-3 h-3 ${fetchingModels ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {fetchingModels ? 'Fetching...' : 'Fetch Models'}
                  </button>
                </div>

                {localModels.length > 0 ? (
                  <select
                    value={localModel}
                    onChange={(e) => setLocalModel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {localModels.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} {m.size ? `(${formatSize(m.size)})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={localModel}
                    onChange={(e) => setLocalModel(e.target.value)}
                    placeholder="qwen2.5:72b"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> If this app is hosted (e.g., Vercel), your local AI server must be reachable from the internet.
                  Use a Cloudflare Tunnel or ngrok to expose it, or run the app locally.
                </p>
              </div>
            </div>
          )}

          {/* Cloud AI Config */}
          {mode === 'cloud' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-..."
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {settings.openrouter_api_key && (
                  <p className="text-xs text-slate-500 mt-1">
                    Current key: {settings.openrouter_api_key}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Test & Save */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleTest}
              disabled={testing || (mode === 'local' && (!localUrl || !localModel)) || (mode === 'cloud' && !apiKey)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Status messages */}
          {testResult && (
            <div className={`mt-3 p-3 rounded-md text-sm ${
              testResult.valid
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {testResult.valid ? 'Connection successful!' : `Connection failed: ${testResult.error}`}
            </div>
          )}
          {saveMessage && (
            <div className={`mt-3 p-3 rounded-md text-sm ${
              saveMessage.includes('success')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">SharePoint Notifications</h2>
          <p className="text-sm text-slate-500 mb-4">
            When a program review is saved to SharePoint, an email notification will be sent via Power Automate (Office 365).
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notification Recipients
              </label>
              <input
                type="text"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder="jsmith@siskiyous.edu, jdoe@siskiyous.edu"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Separate multiple emails with commas
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Greeting Name (used in email body)
              </label>
              <input
                type="text"
                value={notifyName}
                onChange={(e) => setNotifyName(e.target.value)}
                placeholder="Program Review Committee"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Used as &quot;Hello [name]&quot; in the notification email
              </p>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleSaveNotify}
              disabled={savingNotify}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {savingNotify ? 'Saving...' : 'Save Notification Settings'}
            </button>
          </div>

          {notifyMessage && (
            <div className={`mt-3 p-3 rounded-md text-sm ${
              notifyMessage.includes('success')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {notifyMessage}
            </div>
          )}
        </div>

        {/* Scheduled Reminder Settings */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Scheduled Reminders</h2>
          <p className="text-sm text-slate-500 mb-4">
            Automated reminders for outstanding program reviews. Deans receive instructional program statuses, VPs receive non-instructional.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Instructional Dean(s)
              </label>
              <input
                type="text"
                value={deanEmails}
                onChange={(e) => setDeanEmails(e.target.value)}
                placeholder="dean1@siskiyous.edu, dean2@siskiyous.edu"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Receives status updates for all instructional programs. Comma-separate multiple emails.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Non-Instructional VP(s)
              </label>
              <input
                type="text"
                value={vpEmails}
                onChange={(e) => setVpEmails(e.target.value)}
                placeholder="vp1@siskiyous.edu, vp2@siskiyous.edu"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Receives status updates for all non-instructional programs. Comma-separate multiple emails.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleSaveReminders}
              disabled={savingReminders}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {savingReminders ? 'Saving...' : 'Save Reminder Settings'}
            </button>
          </div>

          {reminderMessage && (
            <div className={`mt-3 p-3 rounded-md text-sm ${
              reminderMessage.includes('success')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {reminderMessage}
            </div>
          )}

          {/* Power Automate Setup Instructions */}
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-md p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Power Automate Setup</h3>
            <p className="text-xs text-slate-600 mb-3">
              Create a scheduled flow in Power Automate to send monthly reminders:
            </p>
            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://make.powerautomate.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">make.powerautomate.com</a></li>
              <li>Create → Scheduled cloud flow → set to run monthly (e.g., 1st of each month)</li>
              <li>Add action: <strong>HTTP</strong> → Method: GET → URL:<br />
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] break-all">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://your-app-url'}/api/tracking/reminders
                </code>
              </li>
              <li>Add action: <strong>Parse JSON</strong> → Content: Body from HTTP step → Schema:
                <pre className="bg-slate-200 p-2 rounded text-[10px] mt-1 overflow-x-auto">{`{
  "type": "object",
  "properties": {
    "deanEmails": { "type": "string" },
    "vpEmails": { "type": "string" },
    "instructionalHtml": { "type": "string" },
    "nonInstructionalHtml": { "type": "string" }
  }
}`}</pre>
              </li>
              <li>Add <strong>Condition</strong>: if <code>deanEmails</code> is not empty →<br />
                <strong>Send an email (V2)</strong> → To: <code>deanEmails</code>, Subject: &quot;Program Review Status - Instructional&quot;, Body: <code>instructionalHtml</code> (set body to HTML mode)</li>
              <li>Add another <strong>Condition</strong>: if <code>vpEmails</code> is not empty →<br />
                <strong>Send an email (V2)</strong> → To: <code>vpEmails</code>, Subject: &quot;Program Review Status - Non-Instructional&quot;, Body: <code>nonInstructionalHtml</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
