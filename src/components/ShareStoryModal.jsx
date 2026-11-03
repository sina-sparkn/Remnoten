import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Flame,
  Download,
  Copy,
  Sparkles,
  Share2,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import HabitIcon from './Icons.jsx';
import {
  hapticMedium,
  hapticSuccess,
  hapticError,
  playSuccessSound,
  playTapSound,
  playToggleSound,
  callEndpoint,
} from '../api.js';
import { useI18n } from '../lib/i18n.jsx';
import { useTheme } from '../lib/theme.jsx';

const STORY_THEMES = [
  {
    id: 'obsidian',
    labelKey: 'share_theme_obsidian',
    accent: '#8B5CF6',
    accentGradient: 'from-purple-500 to-indigo-600',
    bg: '#0F0F14',
    bgCanvas: ['#0B0B10', '#161622'],
    cardBorder: '#29293C',
    glow: 'rgba(139, 92, 246, 0.4)',
  },
  {
    id: 'flame',
    labelKey: 'share_theme_flame',
    accent: '#FF5722',
    accentGradient: 'from-amber-500 to-red-600',
    bg: '#140A07',
    bgCanvas: ['#0E0604', '#26110A'],
    cardBorder: '#421E14',
    glow: 'rgba(255, 87, 34, 0.4)',
  },
  {
    id: 'emerald',
    labelKey: 'share_theme_emerald',
    accent: '#10B981',
    accentGradient: 'from-emerald-400 to-teal-600',
    bg: '#08140D',
    bgCanvas: ['#050E09', '#0E2418'],
    cardBorder: '#163E28',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  {
    id: 'violet',
    labelKey: 'share_theme_violet',
    accent: '#EC4899',
    accentGradient: 'from-pink-500 to-rose-600',
    bg: '#140912',
    bgCanvas: ['#0E050D', '#280F23'],
    cardBorder: '#421838',
    glow: 'rgba(236, 72, 153, 0.4)',
  },
  {
    id: 'cyan',
    labelKey: 'share_theme_cyan',
    accent: '#06B6D4',
    accentGradient: 'from-cyan-400 to-blue-600',
    bg: '#081219',
    bgCanvas: ['#040B10', '#0E2230'],
    cardBorder: '#133547',
    glow: 'rgba(6, 182, 212, 0.4)',
  },
];

export function getStoryBannerUrl(streak = 0, themeId = 'obsidian') {
  const validThemes = ['obsidian', 'flame', 'emerald', 'violet', 'cyan'];
  const theme = validThemes.includes(themeId) ? themeId : 'obsidian';

  let tier = '0';
  const num = Number(streak) || 0;
  if (num >= 30) tier = '30';
  else if (num >= 7) tier = '7';
  else if (num >= 1) tier = 'active';
  else tier = '0';

  return `https://app8837501303.tgcloud.ai/story-${theme}-${tier}.png`;
}

export default function ShareStoryModal({
  open = false,
  onClose,
  streak = 0,
  user = null,
  habits = [],
  weekDays = [],
  habit = null, // optional habit if sharing single habit
}) {
  const { t } = useI18n();
  const { currentTheme } = useTheme();
  const [selectedThemeId, setSelectedThemeId] = useState('obsidian');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const canvasRef = useRef(null);

  const activeStoryTheme =
    STORY_THEMES.find((th) => th.id === selectedThemeId) || STORY_THEMES[0];

  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  const tgUser = user || tg?.initDataUnsafe?.user;
  const displayName = tgUser?.first_name
    ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`
    : 'Remnoten Achiever';
  const displayHandle = tgUser?.username ? `@${tgUser.username}` : '@remnotenbot';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  const numStreak = Number(streak) || 0;

  // Derive week display
  const daysShort = t('days_short') || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const normalizedWeek = weekDays.length === 7
    ? weekDays.map((wd, i) => ({
        ...wd,
        label: Array.isArray(daysShort) && daysShort[i] ? daysShort[i] : wd.dayName || 'Day',
      }))
    : daysShort.map((label, idx) => ({
        label,
        completed: numStreak > 0 && idx < Math.min(numStreak, 6),
      }));

  // Derive badge text matching real streak
  let badgeText = t('share_badge_day1') || 'DAY 1 STARTS TODAY';
  if (numStreak >= 30) badgeText = t('share_badge_champion');
  else if (numStreak >= 7) badgeText = t('share_badge_unstoppable');
  else if (numStreak >= 1) badgeText = t('share_badge_onfire');
  else badgeText = t('share_badge_day1') || 'DAY 1 STARTS TODAY';

  // Share message text
  const shareText = habit
    ? t('share_habit_text').replace('{name}', habit.name)
    : t('share_streak_text').replace('{streak}', String(numStreak));

  /**
   * Render high-resolution 1080x1920 Story Canvas matching App Preview 1:1
   */
  const renderCanvasImage = () => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      const W = 1080;
      const H = 1920;

      // 1. Full-bleed background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, activeStoryTheme.bgCanvas[0]);
      bgGrad.addColorStop(1, activeStoryTheme.bgCanvas[1]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Ambient Radial Lighting in Center (matching blur-2xl radial-gradient)
      const radial = ctx.createRadialGradient(W / 2, H * 0.45, 60, W / 2, H * 0.45, 750);
      radial.addColorStop(0, activeStoryTheme.glow);
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, W, H);

      // 3. Story Card Frame (Compensated for Telegram Story safe zones: top 240px, bottom 320px)
      const cardX1 = 64;
      const cardY1 = 250;
      const cardX2 = W - 64;
      const cardY2 = 1570;
      const cardW = cardX2 - cardX1;
      const cardH = cardY2 - cardY1;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX1, cardY1, cardW, cardH, 48);
      ctx.fillStyle = activeStoryTheme.bg;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = activeStoryTheme.cardBorder;
      ctx.stroke();

      // Top edge ambient accent line
      ctx.beginPath();
      ctx.roundRect(cardX1 + 4, cardY1 + 4, cardW - 8, 6, 3);
      ctx.fillStyle = activeStoryTheme.accent;
      ctx.globalAlpha = 0.4;
      ctx.fill();
      ctx.restore();

      // 4. Top Bar Branding (Left: Logo + Tagline, Right: @Handle)
      const contentX = cardX1 + 48;
      const rightX = cardX2 - 48;
      const topY = cardY1 + 52;

      ctx.save();
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.font = '900 46px "Plus Jakarta Sans", system-ui, sans-serif';

      const remText = t('app_name_rem') || 'Rem';
      const notenText = t('app_name_noten') || 'noten';
      const remW = ctx.measureText(remText).width;

      // "Rem" in pure white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(remText, contentX, topY);

      // "noten" in theme accent
      ctx.fillStyle = activeStoryTheme.accent;
      ctx.fillText(notenText, contentX + remW, topY);

      // Tagline under logo
      ctx.font = '600 20px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = '#8E8E93';
      ctx.fillText('HABIT TRACKER & STREAKS', contentX, topY + 54);

      // Right-aligned User Handle
      ctx.textAlign = 'right';
      ctx.font = '700 24px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = '#D4D4D8';
      ctx.fillText(displayHandle, rightX, topY + 12);

      // Header Divider
      ctx.beginPath();
      ctx.moveTo(contentX, topY + 95);
      ctx.lineTo(rightX, topY + 95);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // 5. Center Hero Flame Circle
      ctx.save();
      const heroCenterY = cardY1 + 410;
      const circleR = 110;

      // Outer radial glow halo around circle
      const haloGrad = ctx.createRadialGradient(W / 2, heroCenterY, circleR * 0.6, W / 2, heroCenterY, circleR * 1.8);
      haloGrad.addColorStop(0, activeStoryTheme.glow);
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(W / 2, heroCenterY, circleR * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Inner Circle Container
      ctx.beginPath();
      ctx.arc(W / 2, heroCenterY, circleR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(24, 24, 34, 0.95)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = activeStoryTheme.accent;
      ctx.stroke();

      // Draw Vector Lucide Flame Icon inside circle
      if (habit) {
        ctx.font = '84px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎯', W / 2, heroCenterY);
      } else {
        const flamePath = new Path2D(
          'M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4'
        );
        ctx.save();
        ctx.translate(W / 2, heroCenterY - 4);
        const flameScale = 5.2;
        ctx.scale(flameScale, flameScale);
        ctx.translate(-12, -12); // Center 24x24 Lucide viewBox
        ctx.fillStyle = activeStoryTheme.accent;
        ctx.fill(flamePath);
        ctx.restore();
      }
      ctx.restore();

      // 6. Streak Number & Title
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (habit) {
        ctx.font = '900 64px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(habit.name, W / 2, heroCenterY + 180);

        ctx.font = '700 28px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillStyle = activeStoryTheme.accent;
        ctx.fillText(
          `${habit.frequency || t('freq_daily')} • ${habit.target || 1} ${habit.unit || ''}`.trim(),
          W / 2,
          heroCenterY + 240
        );
      } else if (numStreak === 0) {
        ctx.font = '900 80px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('DAY 1', W / 2, heroCenterY + 180);

        ctx.font = '700 30px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillStyle = activeStoryTheme.accent;
        ctx.fillText('STARTS TODAY', W / 2, heroCenterY + 240);
      } else {
        ctx.font = '900 130px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillStyle = activeStoryTheme.accent;
        ctx.fillText(String(numStreak), W / 2, heroCenterY + 180);

        ctx.font = '900 32px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(t('streak_days').toUpperCase(), W / 2, heroCenterY + 260);
      }

      // Badge Pill ("ON FIRE" / "UNSTOPPABLE")
      const pillW = 320;
      const pillH = 52;
      const pillX = W / 2 - pillW / 2;
      const pillY = heroCenterY + 300;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 26);
      ctx.fillStyle = activeStoryTheme.accent;
      ctx.fill();

      ctx.font = '900 22px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText(badgeText, W / 2, pillY + pillH / 2 + 1);
      ctx.restore();

      // 7. 7-Day Consistency Dots Row
      ctx.save();
      const dotY = heroCenterY + 440;
      const dotSpacing = 110;
      const dotStartX = W / 2 - 3 * dotSpacing;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      normalizedWeek.forEach((day, idx) => {
        const x = dotStartX + idx * dotSpacing;
        const isDone = day.completed;

        // Day label initial (M, T, W, T, F, S, S)
        ctx.font = '700 20px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillStyle = '#8E8E93';
        ctx.fillText(day.label.slice(0, 1).toUpperCase(), x, dotY - 30);

        // Dot circle
        ctx.beginPath();
        ctx.arc(x, dotY, 18, 0, Math.PI * 2);
        if (isDone) {
          ctx.fillStyle = activeStoryTheme.accent;
          ctx.fill();
        } else {
          ctx.fillStyle = '#262634';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.stroke();
        }
      });
      ctx.restore();

      // 8. Call to Action & Slogan
      ctx.save();
      const ctaY = cardY2 - 170;

      // CTA Box
      const btnW = cardW - 96;
      const btnH = 80;
      const btnX = W / 2 - btnW / 2;
      ctx.beginPath();
      ctx.roundRect(btnX, ctaY, btnW, btnH, 24);
      ctx.fillStyle = 'rgba(26, 26, 38, 0.9)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = activeStoryTheme.accent;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 26px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('🚀 Track your streak on Telegram • @remnotenbot', W / 2, ctaY + btnH / 2);

      // Slogan Footer
      ctx.font = '500 22px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = '#71717A';
      ctx.fillText(t('slogan') || 'Better habits. A sharper you.', W / 2, cardY2 - 40);
      ctx.restore();

      // Convert to Blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas export failed'));
        }
      }, 'image/png');
    });
  };

  /**
   * Action 1: Share directly to Telegram Story
   */
  const handleShareToStory = async () => {
    hapticMedium();
    setIsGenerating(true);

    try {
      const blob = await renderCanvasImage();
      const file = new File([blob], 'remnoten-story.png', { type: 'image/png' });

      // First check: Mobile Web Share API with file support
      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        navigator.share
      ) {
        await navigator.share({
          files: [file],
          title: 'Remnoten Streak',
          text: shareText,
        });
        playSuccessSound();
        hapticSuccess();
        showToast(t('share_saved_toast'));
        setIsGenerating(false);
        return;
      }

      // Second check: Telegram WebApp Bot API 7.8+ shareToStory
      if (tg?.isVersionAtLeast?.('7.8') && typeof tg?.shareToStory === 'function') {
        const hostedMediaUrl = getStoryBannerUrl(numStreak, selectedThemeId);
        tg.shareToStory(hostedMediaUrl, {
          text: shareText,
          widget_link: {
            url: 'https://t.me/remnotenbot',
            name: 'Check Streak',
          },
        });
        playSuccessSound();
        hapticSuccess();
        setIsGenerating(false);
        return;
      }

      // Fallback: download high-res PNG and guide user
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `remnoten-story-streak-${streak}d.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      playSuccessSound();
      hapticSuccess();
      showToast(t('share_story_not_supported'));
    } catch (err) {
      console.warn('Share to story failed:', err);
      // If error or canceled, gracefully trigger image download
      handleDownloadImage();
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Action 2: Share to Telegram Chats / Groups / Status
   */
  const handleShareToChats = () => {
    hapticMedium();
    playSuccessSound();
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent('https://t.me/remnotenbot')}&text=${encodeURIComponent(shareText)}`;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(telegramShareUrl);
    } else {
      window.open(telegramShareUrl, '_blank');
    }
  };

  /**
   * Action: Save / Download high-resolution PNG Story Image
   */
  const handleDownloadImage = async () => {
    hapticMedium();
    setIsGenerating(true);

    try {
      const blob = await renderCanvasImage();
      const filename = `remnoten-story-${streak}d.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      let deliveredToChat = false;

      // 1. In Telegram Mini App: deliver full high-res photo to user's Telegram chat
      // This allows the user to 1-tap "Save to Gallery" from their chat with @remnotenbot
      if (window.Telegram?.WebApp?.initData) {
        try {
          const reader = new FileReader();
          const base64Data = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          await callEndpoint('sendStoryPhoto', {
            imageData: base64Data,
            streak,
          });
          deliveredToChat = true;
          showToast(t('share_sent_to_chat_toast'));
        } catch (apiErr) {
          console.warn('sendStoryPhoto endpoint error:', apiErr);
        }
      }

      // 2. Try native mobile share sheet (iOS Safari & Android Chrome in WebViews support "Save Image" to Photos/Gallery)
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Remnoten Story',
          });
          if (!deliveredToChat) showToast(t('share_saved_toast'));
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.warn('Native file share failed:', shareErr);
          }
        }
      }

      // 3. Fallback: Browser download anchor
      try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        if (!deliveredToChat) showToast(t('share_saved_toast'));
      } catch (dlErr) {
        console.warn('Anchor download failed:', dlErr);
      }

      playSuccessSound();
      hapticSuccess();
    } catch (err) {
      console.error('Failed to save image:', err);
      hapticError();
      showToast(t('share_failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Action 5: Copy Link to Clipboard
   */
  const handleCopyLink = () => {
    hapticMedium();
    const copyContent = `${shareText}\nhttps://t.me/remnotenbot`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(copyContent).then(() => {
        playSuccessSound();
        hapticSuccess();
        showToast(t('share_copied_toast'));
      }).catch(() => {
        fallbackCopy(copyContent);
      });
    } else {
      fallbackCopy(copyContent);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      playSuccessSound();
      hapticSuccess();
      showToast(t('share_copied_toast'));
    } catch {
      hapticError();
    }
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="max-h-[92vh] overflow-y-auto max-w-[440px] mx-auto w-full px-6 pb-8 pt-2.5 bg-[#121214] border-t border-[#1C1C20] select-none">
        {/* Swipe bar indicator */}
        <div className="mx-auto w-12 h-52s rounded-full bg-red-500 mb-3" />

        {/* Hidden Canvas used for high-res 1080x1920 export */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Toast Feedback Banner */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#1C1C24] border border-[#2A2A38] shadow-2xl text-white text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <Sparkles size={16} className="text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <DrawerHeader className="p-0 mb-4 flex items-center justify-between">
          <div>
            <DrawerTitle className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Share2 size={18} style={{ color: activeStoryTheme.accent }} />
              <span className=''>{t('share_story_modal_title')}</span>
            </DrawerTitle>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              {t('share_story_modal_subtitle')}
            </p>
          </div>

        </DrawerHeader>

        {/* Story Live Preview (9:16 vertical card) */}
        <div className="flex justify-center my-2">
          <div
            className="w-[230px] h-[408px] rounded-lg p-3.5 flex flex-col justify-between relative shadow-2xl transition-all duration-300 border overflow-hidden"
            style={{
              backgroundColor: activeStoryTheme.bg,
              borderColor: activeStoryTheme.cardBorder,
              boxShadow: `0 12px 36px ${activeStoryTheme.glow}`,
            }}
          >
            {/* Top Bar Branding - Same Design as Main Tab Logo */}
            <div className="flex items-start justify-between z-10 w-full">
              <div className="text-start">
                <h1 className="text-[14px] font-black tracking-tight leading-tight">
                  <span className="text-white">{t('app_name_rem')}</span>
                  <span style={{ color: activeStoryTheme.accent }}>{t('app_name_noten')}</span>
                </h1>
                <p className="text-[8px] font-medium text-[#8E8E93] mt-0.5 leading-none">
                  {t('slogan')}
                </p>
              </div>
              <span className="text-[9px] font-semibold text-[#8E8E93] truncate max-w-[85px] mt-0.5">
                {displayHandle}
              </span>
            </div>

            {/* Ambient Radial Lighting in Center */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 blur-2xl"
              style={{
                background: `radial-gradient(circle at 50% 45%, ${activeStoryTheme.accent} 0%, transparent 70%)`,
              }}
            />

            {/* Center Hero Streak Box */}
            <div className="my-auto text-center flex flex-col items-center z-10">
              {/* Flame / Target Halo */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-1.5 transition-transform duration-300 border-2"
                style={{
                  backgroundColor: 'rgba(24, 24, 30, 0.8)',
                  borderColor: activeStoryTheme.accent,
                }}
              >
                {habit ? (
                  <span className="text-2xl">🎯</span>
                ) : (
                  <Flame
                    size={32}
                    style={{
                      color: activeStoryTheme.accent,
                      fill: activeStoryTheme.accent,
                    }}
                  />
                )}
              </div>

              {/* Number / Habit Name */}
              {habit ? (
                <div className="px-2">
                  <h4 className="text-sm font-black text-white truncate max-w-[190px]">
                    {habit.name}
                  </h4>
                  <p
                    className="text-[10px] font-bold mt-0.5"
                    style={{ color: activeStoryTheme.accent }}
                  >
                    {habit.target} {habit.unit || ''}
                  </p>
                </div>
              ) : numStreak === 0 ? (
                <>
                  <span
                    className="text-2xl font-black tracking-tight leading-none text-white"
                  >
                    DAY 1
                  </span>
                  <span
                    className="text-[10px] font-extrabold tracking-widest uppercase mt-0.5"
                    style={{ color: activeStoryTheme.accent }}
                  >
                    STARTS TODAY
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="text-4xl font-black tracking-tight leading-none"
                    style={{ color: activeStoryTheme.accent }}
                  >
                    {numStreak}
                  </span>
                  <span className="text-[10px] font-extrabold text-white tracking-widest uppercase mt-0.5">
                    {t('streak_days')}
                  </span>
                </>
              )}

              {/* Badge Pill */}
              <div
                className="mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-black"
                style={{ backgroundColor: activeStoryTheme.accent }}
              >
                {badgeText}
              </div>

              {/* 7-Day Consistency Dots */}
              <div className="flex items-center gap-1.5 mt-3 px-1">
                {normalizedWeek.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-0.5">
                    <span className="text-[7px] font-semibold text-[#8E8E93]">
                      {day.label.slice(0, 1)}
                    </span>
                    <div
                      className="w-2.5 h-2.5 rounded-full transition-colors"
                      style={{
                        backgroundColor: day.completed
                          ? activeStoryTheme.accent
                          : '#282830',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Slogan & Link */}
            <div className="text-center z-10 pt-1 border-t border-white/5">
              <p className="text-[9px] text-[#A1A1AA] font-medium leading-tight">
                {t('slogan')}
              </p>
              <p className="text-[8px] text-[#71717A] mt-0.5">
                {t('share_track_on_remnoten')}
              </p>
            </div>
          </div>
        </div>

        {/* Story Theme Selector */}
        <div className="mt-4 mb-5">
          <label className="block text-xs font-semibold text-[#8E8E93] mb-2 text-start">
            {t('share_theme_label')}
          </label>
          <div className="grid grid-cols-5 gap-2.5">
            {STORY_THEMES.map((themeItem) => {
              const isSelected = selectedThemeId === themeItem.id;
              return (
                <button
                  key={themeItem.id}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    hapticMedium();
                    setSelectedThemeId(themeItem.id);
                  }}
                  className={`py-2 px-1 rounded-md flex flex-col items-center gap-1.5 transition-all border ${
                    isSelected
                      ? 'border-white bg-[#1C1C24] shadow-md ring-1 ring-white/20'
                      : 'border-[#222228] bg-[#141418] opacity-75 hover:opacity-100'
                  }`}
                >
                  <div
                    className="w-4.5 h-4.5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: themeItem.accent }}
                  />
                  <span className="text-[10px] font-bold text-white truncate max-w-full">
                    {t(themeItem.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="space-y-2.5">
          {/* 1. Share to Telegram Story (Primary) */}
          <Button
            onClick={handleShareToStory}
            disabled={isGenerating}
            variant="default"
            size="xl"
            className="w-full relative overflow-hidden font-bold flex items-center justify-center gap-2 rounded-xl"
            style={{
              backgroundColor: activeStoryTheme.accent,
              color: '#000000',
            }}
          >
            <span>
              {isGenerating
                ? t('share_generating_image')
                : t('share_to_story_btn')}
            </span>
          </Button>

          {/* 2. Share to Telegram Chats & Status (Secondary) */}
          <Button
            onClick={handleShareToChats}
            variant="outline"
            size="xl"
            className="w-full font-bold flex items-center justify-center gap-2 border-[#2A2A34] hover:bg-[#181820] rounded-xl"
          >
            <Send size={18} className="-rotate-12 translate-x-[-1px] text-sky-400" />
            <span>{t('share_to_chats_btn')}</span>
          </Button>

          {/* 3. Row of 2 Actions: Save Image & Copy Link */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Save Image */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="h-12 rounded-xl bg-[#16161B] hover:bg-[#1E1E26] border border-[#22222A] flex flex-row items-center justify-center gap-2 transition-all active:scale-95"
              title={t('share_download_btn')}
            >
              <Download size={17} className="text-emerald-400" />
              <span className="text-xs font-bold text-white truncate">
                {t('share_download_btn')}
              </span>
            </button>

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="h-12 rounded-xl bg-[#16161B] hover:bg-[#1E1E26] border border-[#22222A] flex flex-row items-center justify-center gap-2 transition-all active:scale-95"
              title={t('share_copy_link_btn')}
            >
              <Copy size={17} className="text-purple-400" />
              <span className="text-xs font-bold text-white truncate">
                {t('share_copy_link_btn')}
              </span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
