import React from 'react';
import {
  Palette,
  Check,
  Info,
  Clock,
  User,
  ShieldCheck,
  Globe,
  Volume2,
  Vibrate,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import AutoScrollText from './AutoScrollText.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { useTheme } from '../lib/theme.jsx';
import { useAudioHaptics } from '../lib/sound.js';
import { hapticSuccess, hapticMedium } from '../api.js';

export default function SettingsScreen({ state, onLanguageChange, onOpenTutorial }) {
  const { t, lang, setLang, languages } = useI18n();
  const { theme, setTheme, currentTheme, themes } = useTheme();
  const { soundEnabled, setSoundEnabled, hapticsEnabled, setHapticsEnabled, playCheck } = useAudioHaptics();

  const user = state?.user || window.Telegram?.WebApp?.initDataUnsafe?.user;
  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'User'
    : null;

  return (
    <div className="flex-1 px-5 pt-3 pb-28">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">{t('settings_title')}</h1>
        <p className="text-xs font-medium text-[#8E8E93] mt-0.5">
          {t('settings_subtitle')}
        </p>
      </div>

      {/* ─── Language Section ──────────────────────────────────────── */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: currentTheme.primarySubtle,
              border: `1px solid ${currentTheme.primarySubtleBorder}`,
            }}
          >
            <Globe size={16} color={currentTheme.primary} strokeWidth={2.4} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {t('settings_language_title')}
            </h2>
          </div>
        </div>
        <p className="text-xs text-[#8E8E93] mb-3.5">
          {t('settings_language_desc')}
        </p>

        {/* 3 Languages Segmented Toggle Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {languages.map((l) => {
            const isSelected = l.id === lang;

            return (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  if (l.id !== lang) {
                    hapticSuccess();
                    setLang(l.id);
                    onLanguageChange?.(l.id);
                  }
                }}
                className={`py-3.5 px-2 rounded-[20px] transition-all duration-150 flex flex-col items-center justify-center text-center cursor-pointer select-none active:scale-[0.96] relative ${
                  isSelected
                    ? 'bg-[#18181D] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07]'
                }`}
                style={
                  isSelected
                    ? {
                        border: `1.5px solid ${currentTheme.primary}`,
                        boxShadow: `0 0 16px ${currentTheme.primary}25`,
                      }
                    : undefined
                }
              >
                <div className="relative mb-1.5 flex items-center justify-center">
                  <span className="text-2xl select-none leading-none">{l.flag}</span>
                  {isSelected && (
                    <div
                      className="absolute -top-1.5 -right-3 w-4 h-4 rounded-full flex items-center justify-center shadow-md transition-transform"
                      style={{
                        backgroundColor: currentTheme.primary,
                        color: currentTheme.primaryForeground,
                      }}
                    >
                      <Check size={11} strokeWidth={3.5} />
                    </div>
                  )}
                </div>

                <div className="w-full">
                  <div
                    className={`text-[13px] font-bold tracking-tight truncate ${
                      isSelected ? 'text-white' : 'text-[#8E8E93]'
                    }`}
                  >
                    {l.nativeName}
                  </div>
                  <AutoScrollText className="text-[10px] text-[#636366] font-medium mt-0.5">
                    {t(l.nameKey, l.name)}
                  </AutoScrollText>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Sound & Audio Haptics Section ──────────────────────────── */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: currentTheme.primarySubtle,
              border: `1px solid ${currentTheme.primarySubtleBorder}`,
            }}
          >
            <Volume2 size={16} color={currentTheme.primary} strokeWidth={2.4} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {t('settings_audio_title')}
            </h2>
          </div>
        </div>
        <p className="text-xs text-[#8E8E93] mb-3.5">
          {t('settings_audio_desc')}
        </p>

        <Card className="p-4 bg-[#121214] border-[#1C1C20] divide-y divide-[#1C1C22]">
          {/* Sound Effects Toggle */}
          <div className="pb-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-[#1C1C22] flex items-center justify-center text-white shrink-0">
                <Volume2 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold text-white tracking-tight">
                  {t('settings_sound_effects')}
                </div>
                <AutoScrollText className="text-[11px] text-[#8E8E93] font-medium mt-0.5">
                  {t('settings_sound_effects_desc')}
                </AutoScrollText>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {soundEnabled && (
                <button
                  type="button"
                  onClick={() => playCheck()}
                  className="text-[11px] font-semibold text-[#8E8E93] hover:text-white px-2 py-1 rounded-lg bg-[#18181D] border border-[#26262B] active:scale-95 transition-all cursor-pointer"
                >
                  {t('settings_sound_test')}
                </button>
              )}
              <Switch
                checked={soundEnabled}
                onCheckedChange={(checked) => setSoundEnabled(checked)}
              />
            </div>
          </div>

          {/* Haptic Vibration Toggle */}
          <div className="pt-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-[#1C1C22] flex items-center justify-center text-white shrink-0">
                <Vibrate size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold text-white tracking-tight">
                  {t('settings_haptics')}
                </div>
                <AutoScrollText className="text-[11px] text-[#8E8E93] font-medium mt-0.5">
                  {t('settings_haptics_desc')}
                </AutoScrollText>
              </div>
            </div>

            <Switch
              checked={hapticsEnabled}
              onCheckedChange={(checked) => setHapticsEnabled(checked)}
            />
          </div>
        </Card>
      </div>

      {/* ─── Themes Section ────────────────────────────────────────── */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: currentTheme.primarySubtle,
              border: `1px solid ${currentTheme.primarySubtleBorder}`,
            }}
          >
            <Palette size={16} color={currentTheme.primary} strokeWidth={2.4} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {t('settings_themes_title')}
            </h2>
          </div>
        </div>
        <p className="text-xs text-[#8E8E93] mb-3.5">
          {t('settings_themes_desc')}
        </p>

        {/* 14 Themes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {themes.map((th) => {
            const isSelected = th.id === theme;

            return (
              <button
                key={th.id}
                type="button"
                onClick={() => {
                  hapticSuccess();
                  setTheme(th.id);
                }}
                className={`w-full p-3.5 rounded-[20px] transition-all duration-200 text-left rtl:text-right flex items-center justify-between cursor-pointer select-none active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#18181D] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06]'
                }`}
                style={
                  isSelected
                    ? {
                        border: `1.5px solid ${th.primary}`,
                        boxShadow: `0 0 16px ${th.primary}25`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Swatch Circle */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md relative flex-shrink-0 transition-transform"
                    style={{
                      background: th.previewGradient || th.primary,
                      border: th.isLightContrast ? '1px solid rgba(255,255,255,0.3)' : 'none',
                    }}
                  >
                    {isSelected && (
                      <Check
                        size={19}
                        color={th.primaryForeground}
                        strokeWidth={3.2}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-white tracking-tight truncate flex items-center gap-1.5">
                      <span>{t(th.nameKey, th.name)}</span>
                    </div>
                    <AutoScrollText className="text-[11px] text-[#8E8E93] font-medium">
                      {th.name}
                    </AutoScrollText>
                  </div>
                </div>

                {isSelected ? (
                  <span
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 shadow-sm transition-colors"
                    style={{
                      backgroundColor: th.primary,
                      color: th.primaryForeground,
                    }}
                  >
                    {t('theme_active')}
                  </span>
                ) : (
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-[#2A2A30] shrink-0"
                    style={{ backgroundColor: `${th.primary}40` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Walkthrough Guide ────────────────────────────────────────── */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: currentTheme.primarySubtle,
              border: `1px solid ${currentTheme.primarySubtleBorder}`,
            }}
          >
            <Sparkles size={16} color={currentTheme.primary} strokeWidth={2.4} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {t('settings_tutorial_btn')}
            </h2>
          </div>
        </div>
        <p className="text-xs text-[#8E8E93] mb-3.5">
          {t('settings_tutorial_desc')}
        </p>

        <Card
          onClick={() => {
            hapticMedium();
            onOpenTutorial?.();
          }}
          className="p-4 bg-[#121214] border-[#1C1C20] hover:bg-[#161619] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: currentTheme.primarySubtle }}
            >
              <Sparkles size={18} color={currentTheme.primary} />
            </div>
            <div className="text-start">
              <div className="text-sm font-bold text-white">
                {t('settings_tutorial_btn')}
              </div>
              <div className="text-xs text-[#8E8E93] mt-0.5">
                {t('tutorial_title')}
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#8E8E93] rtl:rotate-180" />
        </Card>
      </div>

      {/* ─── About & Info Section ───────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-[#19191D] flex items-center justify-center">
            <Info size={16} color="#8E8E93" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {t('settings_about_title')}
            </h2>
          </div>
        </div>

        <Card className="p-4 bg-[#121214] border-[#1C1C20] divide-y divide-[#1C1C22]">
          {/* User profile if available */}
          {displayName && (
            <div className="pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1C1C22] flex items-center justify-center text-[#8E8E93]">
                  <User size={16} />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white">{displayName}</div>
                  {user?.username && (
                    <div className="text-[11px] text-[#8E8E93]">@{user.username}</div>
                  )}
                </div>
              </div>
              <ShieldCheck size={18} className="text-[#30D158]" />
            </div>
          )}

          {/* Timezone Info */}
          {state?.user?.tzName && (
            <div className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#8E8E93]">
                <Clock size={15} />
                <span>{t('settings_timezone', 'Timezone')}</span>
              </div>
              <span className="font-semibold text-white">{state.user.tzName}</span>
            </div>
          )}

          {/* App Version */}
          <div className="pt-3 flex items-center justify-between text-xs">
            <span className="text-[#8E8E93]">{t('settings_version')}</span>
            <span className="font-bold text-white tracking-wide">Remnoten</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
