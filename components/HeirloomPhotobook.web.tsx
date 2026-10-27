import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock,
  Camera,
  Share2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  BookOpen,
  Calendar,
  Pencil,
} from 'lucide-react';
import { useDiary } from '@/contexts/DiaryContext';
import { uid, todayStr, type Entry } from '@/lib/data';

// ============================================================================
// 1. CONSTANTS, LINEN THEMES & STICKER CATALOG (EXACT FROM ARGON)
// ============================================================================
const LINEN_THEMES = [
  { name: 'Terracotta', main: '#D68060', spine: '#B06145', border: '#C26E4F' },
  { name: 'Lavender', main: '#C7C3D4', spine: '#9D97B0', border: '#B5B0C6' },
  { name: 'Sage', main: '#9CAF9E', spine: '#788C7A', border: '#899E8B' },
  { name: 'Oatmeal', main: '#D8CFC2', spine: '#B5AA9B', border: '#C5BBAE' }
];

const STICKER_ASSETS: Record<string, any> = {
  'stk-ghost': require('@/assets/images/stickers/ghost-3d.png'),
  'stk-lollipop': require('@/assets/images/stickers/lollipop-3d.png'),
  'stk-thumbsup': require('@/assets/images/stickers/thumbsup-3d.png'),
  'stk-shield': require('@/assets/images/stickers/shield-3d.png'),
  'stk-star': require('@/assets/images/stickers/star-3d.png'),
  'stk-heart': require('@/assets/images/stickers/heart.png'),
  'stk-hearteyes': require('@/assets/images/stickers/heartEyes.png'),
  'stk-party': require('@/assets/images/stickers/party.png'),
  'stk-sunglasses': require('@/assets/images/stickers/sunglasses.png'),
  'stk-kiss': require('@/assets/images/stickers/kiss.png'),
  'stk-robot': require('@/assets/images/stickers/robot.png'),
  'stk-smile': require('@/assets/images/stickers/smile.png'),
};

const resolveStickerUri = (asset: any) =>
  typeof asset === 'string' ? asset : asset?.uri || asset?.default || asset;

const STICKER_CATALOG = [
  { id: 'stk-ghost', name: 'Spooky Ghost', asset: STICKER_ASSETS['stk-ghost'] },
  { id: 'stk-lollipop', name: 'Swirl Lollipop', asset: STICKER_ASSETS['stk-lollipop'] },
  { id: 'stk-thumbsup', name: 'Thumbs Up', asset: STICKER_ASSETS['stk-thumbsup'] },
  { id: 'stk-shield', name: 'Verified Shield', asset: STICKER_ASSETS['stk-shield'] },
  { id: 'stk-star', name: '3D Star', asset: STICKER_ASSETS['stk-star'] },
  { id: 'stk-heart', name: 'Glossy Heart', asset: STICKER_ASSETS['stk-heart'] },
  { id: 'stk-hearteyes', name: 'Heart Eyes', asset: STICKER_ASSETS['stk-hearteyes'] },
  { id: 'stk-party', name: 'Party Popper', asset: STICKER_ASSETS['stk-party'] },
  { id: 'stk-sunglasses', name: 'Cool Shades', asset: STICKER_ASSETS['stk-sunglasses'] },
  { id: 'stk-kiss', name: 'Blowing Kiss', asset: STICKER_ASSETS['stk-kiss'] },
  { id: 'stk-robot', name: 'Retro Robot', asset: STICKER_ASSETS['stk-robot'] },
  { id: 'stk-smile', name: 'Big Grin', asset: STICKER_ASSETS['stk-smile'] },
].map((item) => ({
  ...item,
  render: (size = 46) => (
    <img
      src={resolveStickerUri(item.asset)}
      alt={item.name}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: 'drop-shadow(0 6px 12px rgba(22, 14, 8, 0.28))',
        pointerEvents: 'none',
        userSelect: 'none',
        display: 'block',
      }}
    />
  ),
}));

// ============================================================================
// 2. SOUND SYNTHESIS ENGINE (EXACT FROM ARGON)
// ============================================================================
let sharedAudioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

function playStickyGlueSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.38);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const grain = Math.sin(i * 0.045) * Math.cos(i * 0.013);
      output[i] = (Math.random() * 2 - 1) * 0.65 + grain * 0.35;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(320, now);
    bandpass.frequency.exponentialRampToValueAtTime(980, now + 0.14);
    bandpass.frequency.exponentialRampToValueAtTime(260, now + 0.35);
    bandpass.Q.setValueAtTime(4.5, now);

    const squishGain = ctx.createGain();
    squishGain.gain.setValueAtTime(0.01, now);
    squishGain.gain.linearRampToValueAtTime(0.34, now + 0.05);
    squishGain.gain.exponentialRampToValueAtTime(0.08, now + 0.18);
    squishGain.gain.linearRampToValueAtTime(0.26, now + 0.24);
    squishGain.gain.exponentialRampToValueAtTime(0.001, now + 0.37);

    whiteNoise.connect(bandpass);
    bandpass.connect(squishGain);
    squishGain.connect(ctx.destination);
    whiteNoise.start(now);

    [0.06, 0.13, 0.21, 0.27].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const popGain = ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = 190 + idx * 55;
      osc.frequency.setValueAtTime(baseFreq, now + offset);
      osc.frequency.exponentialRampToValueAtTime(75, now + offset + 0.045);

      popGain.gain.setValueAtTime(0.18, now + offset);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.048);

      osc.connect(popGain);
      popGain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.05);
    });
  } catch {}
}

function playPaperRustleSound(pitch = 1.0) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.16;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800 * pitch, now);
    filter.frequency.exponentialRampToValueAtTime(1600 * pitch, now + dur);
    filter.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  } catch {}
}

function triggerConfettiStars() {
  if (typeof window !== 'undefined' && typeof (window as any).confetti === 'function') {
    const defaults = {
      spread: 360,
      ticks: 50,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8']
    };

    const shoot = () => {
      (window as any).confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ['star']
      });
      (window as any).confetti({
        ...defaults,
        particleCount: 10,
        scalar: 0.75,
        shapes: ['circle']
      });
    };

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  }
}

// ============================================================================
// 3. MAIN HEIRLOOM PHOTOBOOK WEB COMPONENT
// ============================================================================
interface HeirloomPhotobookProps {
  initialDay?: number;
  monthKey?: string;
}

export function HeirloomPhotobook({ initialDay, monthKey }: HeirloomPhotobookProps) {
  const { getDayLog, upsertDayEntries, getBook, updateBookConfig } = useDiary();

  const today = new Date();
  const currentMonth = today.getMonth(); // 0..11
  const currentYear = today.getFullYear();
  const todayDayNum = today.getDate();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[currentMonth];
  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  // Book & Page State:
  // 0 = Front Cover (0.68x scale), 1..totalDays = Day, totalDays + 1 = Back Cover (0.68x scale)
  const [activePage, setActivePage] = useState(initialDay ?? todayDayNum);
  const [lastViewedDay, setLastViewedDay] = useState(initialDay ?? todayDayNum);
  const [linenIndex, setLinenIndex] = useState(0); // Terracotta default

  // Cover State
  const [coverPhoto, setCoverPhoto] = useState(
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80'
  );
  const [coverTitle, setCoverTitle] = useState(`${monthName} Family Memories`);
  const [coverSubtitle, setCoverSubtitle] = useState('Curated daily • Printed for the living room');
  const [editingCoverField, setEditingCoverField] = useState<'title' | 'subtitle' | null>(null);

  // 3D Animation & Tilt State
  const [flipAnim, setFlipAnim] = useState<{ dir: 'next' | 'prev'; speed: string; isCover: boolean } | null>(null);
  const [cornerTeased, setCornerTeased] = useState(false);
  const [shakingLockSlot, setShakingLockSlot] = useState<number | null>(null);
  const [pulseHeaderLock, setPulseHeaderLock] = useState(false);
  const [gyroTilt, setGyroTilt] = useState({ x: 4, y: -6 });
  const [userDragTilt, setUserDragTilt] = useState<{ x: number; y: number } | null>(null);

  // Long-press Context Menu on Cover
  const [coverMenuVisible, setCoverMenuVisible] = useState(false);
  const [isHoldingCover, setIsHoldingCover] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const longPressTimerRef = useRef<any>(null);
  const didTriggerLongPressRef = useRef(false);

  // Hand Placement & Caption Editor State
  const [handPlacement, setHandPlacement] = useState<{ slotIdx: number; photoUrl: string } | null>(null);
  const [captionEditor, setCaptionEditor] = useState<{ slotIdx: number; text: string } | null>(null);
  const [stickerTrayOpen, setStickerTrayOpen] = useState(false);
  const [pageStickers, setPageStickers] = useState<Record<number, Array<{ uid: string; id: string; x: number; y: number; rot: number }>>>({
    [todayDayNum]: [{ uid: 'init-stk-1', id: 'stk-star', x: 132, y: 210, rot: -6 }]
  });
  const [draggingSticker, setDraggingSticker] = useState<{ uid: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Hidden File Inputs for Direct Device Photo Selection
  const slotFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotIdxRef = useRef<number>(0);

  const bookViewportRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isEntryRunningRef = useRef(false);

  const currentLinen = LINEN_THEMES[linenIndex];
  const isCoverView = activePage === 0 || activePage === totalDays + 1;
  const isFutureDay = activePage > todayDayNum && activePage <= totalDays;

  // Load Google Fonts & confetti script once
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href =
        'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
      document.head.appendChild(fontLink);

      if (!(window as any).confetti) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  // --------------------------------------------------------------------------
  // CONTINUOUS AMBIENT 3D GYROSCOPE SWAY ON COVER
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isCoverView) {
      setCoverMenuVisible(false);
      setUserDragTilt(null);
      return;
    }

    let animFrameId: number;
    const startTime = performance.now();

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        const clampedY = Math.max(-20, Math.min(20, e.gamma * 0.45));
        const clampedX = Math.max(-16, Math.min(18, (e.beta - 45) * 0.35));
        setGyroTilt({ x: clampedX, y: clampedY });
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);

    const animateIdleGyro = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const swayY = -6 + Math.sin(elapsed * 1.55) * 8.5;
      const swayX = 4 + Math.cos(elapsed * 1.15) * 5.2;
      setGyroTilt({ x: swayX, y: swayY });
      animFrameId = requestAnimationFrame(animateIdleGyro);
    };

    animFrameId = requestAnimationFrame(animateIdleGyro);
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isCoverView]);

  // --------------------------------------------------------------------------
  // AUTOMATIC ENTRY FLIP SEQUENCE (COVER -> TODAY WITH REAL PAPER RUSTLE)
  // --------------------------------------------------------------------------
  const playEntryBookFlipSequence = useCallback(() => {
    if (isEntryRunningRef.current) return;
    isEntryRunningRef.current = true;
    setCoverMenuVisible(false);
    setCornerTeased(false);

    setActivePage(0);

    const steps = [
      { delay: 420, day: 1, speed: '0.44s', pitch: 0.9, isCover: true },
      { delay: 780, day: Math.min(10, totalDays), speed: '0.35s', pitch: 1.05, isCover: false },
      { delay: 1040, day: Math.min(19, totalDays), speed: '0.35s', pitch: 1.15, isCover: false },
      { delay: 1300, day: todayDayNum, speed: '0.56s', pitch: 1.0, isCover: false }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setFlipAnim({ dir: 'next', speed: step.speed, isCover: step.isCover });
        playPaperRustleSound(step.pitch);
        setActivePage(step.day);
        setLastViewedDay(step.day);

        setTimeout(() => {
          setFlipAnim(null);
          if (idx === steps.length - 1) {
            isEntryRunningRef.current = false;
          }
        }, parseFloat(step.speed) * 1000);
      }, step.delay);
    });
  }, [todayDayNum, totalDays]);

  useEffect(() => {
    const timer = setTimeout(() => {
      playEntryBookFlipSequence();
    }, 200);
    return () => clearTimeout(timer);
  }, [playEntryBookFlipSequence]);

  // --------------------------------------------------------------------------
  // PAGE FLIP HELPER
  // --------------------------------------------------------------------------
  const triggerFlipToPage = useCallback(
    (targetPage: number, dirOverride: 'next' | 'prev' | null = null) => {
      const clamped = Math.max(0, Math.min(totalDays + 1, targetPage));
      if (clamped === activePage) return;

      const dir = dirOverride || (clamped > activePage ? 'next' : 'prev');
      const isCoverTransition = activePage === 0 || clamped === 0 || activePage === totalDays + 1 || clamped === totalDays + 1;
      const speed = '0.55s';

      setCornerTeased(false);
      setCoverMenuVisible(false);
      setFlipAnim({ dir, speed, isCover: isCoverTransition });
      playPaperRustleSound(dir === 'next' ? 1.05 : 0.92);

      setActivePage(clamped);
      if (clamped >= 1 && clamped <= totalDays) {
        setLastViewedDay(clamped);
      }

      setTimeout(() => {
        setFlipAnim(null);
      }, 550);
    },
    [activePage, totalDays]
  );

  // --------------------------------------------------------------------------
  // DIRECT DEVICE GALLERY SELECTION & 3D HAND PLACEMENT
  // --------------------------------------------------------------------------
  const handleSlotClick = (slotIdx: number) => {
    activeSlotIdxRef.current = slotIdx;
    if (slotFileInputRef.current) {
      slotFileInputRef.current.value = '';
      slotFileInputRef.current.click();
    }
  };

  const handleCoverPhotoClick = () => {
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = '';
      coverFileInputRef.current.click();
    }
  };

  /**
   * Resizes & compresses user-selected images to lightweight JPEG data URLs (~40-60KB).
   * Completely prevents browser QuotaExceededError crashes when persisting to localStorage.
   */
  const compressImageFile = (file: File, maxDim = 800, quality = 0.78): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve('');
      reader.onload = (e) => {
        const raw = e.target?.result as string;
        if (!raw) {
          resolve('');
          return;
        }
        const img = new Image();
        img.onerror = () => resolve(raw);
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(raw);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
          } catch {
            resolve(raw);
          }
        };
        img.src = raw;
      };
      reader.readAsDataURL(file);
    });
  };

  const onSlotFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value so picking the same image repeatedly triggers change
    e.target.value = '';

    const photoUrl = await compressImageFile(file, 800, 0.78);
    if (!photoUrl) return;

    const slotIdx = activeSlotIdxRef.current;
    const targetDay = activePage;

    // 3D Stylized Hand Placement Animation
    setHandPlacement({ slotIdx, photoUrl });

    setTimeout(() => {
      playStickyGlueSound();
    }, 440);

    setTimeout(() => {
      const y = currentYear;
      const m = String(currentMonth + 1).padStart(2, '0');
      const d = String(targetDay).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const existing = getDayLog(dateStr);
      const curEntries: Entry[] = existing ? [...existing.entries] : [];
      while (curEntries.length < slotIdx) {
        curEntries.push({ id: uid(), text: '', photos: [] });
      }
      const existingEntry = curEntries[slotIdx];
      curEntries[slotIdx] = {
        id: existingEntry?.id || uid(),
        text: existingEntry?.text || 'A moment to keep forever.',
        photos: [photoUrl],
      };
      try {
        upsertDayEntries(dateStr, curEntries);
      } catch (err) {
        console.warn('Could not save day entry:', err);
      }

      const filledCount = curEntries.filter(e => e?.photos?.length).length;
      if (filledCount === 4) {
        setTimeout(() => triggerConfettiStars(), 160);
      }
    }, 620);

    setTimeout(() => {
      setHandPlacement(null);
    }, 1120);
  };

  const onCoverFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const photoUrl = await compressImageFile(file, 800, 0.78);
    if (photoUrl) {
      setCoverPhoto(photoUrl);
      playStickyGlueSound();
    }
  };

  // --------------------------------------------------------------------------
  // POINTER & TOUCH GESTURES (SWIPE, 3D TILT, LONG PRESS)
  // --------------------------------------------------------------------------
  const clearCoverLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsHoldingCover(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.placed-sticker') ||
      target.closest('.cover-context-menu') ||
      target.closest('.cover-camera-btn') ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA'
    ) {
      return;
    }

    swipeStartRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    didTriggerLongPressRef.current = false;

    if (isCoverView) {
      setIsHoldingCover(true);
      longPressTimerRef.current = setTimeout(() => {
        didTriggerLongPressRef.current = true;
        setIsHoldingCover(false);
        setCoverMenuVisible(prev => !prev);
        playPaperRustleSound(1.3);
      }, 420);
    } else if (bookViewportRef.current) {
      const rect = bookViewportRef.current.getBoundingClientRect();
      if (e.clientX - rect.left > rect.width * 0.72) {
        setCornerTeased(true);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingSticker && bookViewportRef.current) {
      const dx = e.clientX - draggingSticker.startX;
      const dy = e.clientY - draggingSticker.startY;
      const newX = Math.max(6, Math.min(275, draggingSticker.origX + dx));
      const newY = Math.max(6, Math.min(480, draggingSticker.origY + dy));

      setPageStickers(prev => {
        const cur = prev[activePage] || [];
        return {
          ...prev,
          [activePage]: cur.map(s => s.uid === draggingSticker.uid ? { ...s, x: newX, y: newY } : s)
        };
      });
      return;
    }

    if (!swipeStartRef.current) return;
    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;

    if (Math.hypot(dx, dy) > 10) {
      clearCoverLongPress();
    }

    if (isCoverView && bookViewportRef.current) {
      const rect = bookViewportRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      setUserDragTilt({
        x: Math.max(-22, Math.min(24, -relY * 40)),
        y: Math.max(-28, Math.min(28, relX * 48))
      });
      return;
    }

    if (!isCoverView && dx < -16) {
      setCornerTeased(true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    clearCoverLongPress();
    if (draggingSticker) {
      setDraggingSticker(null);
      return;
    }
    if (!swipeStartRef.current) return;

    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;
    const dt = performance.now() - swipeStartRef.current.time;
    swipeStartRef.current = null;

    if (isCoverView) {
      setUserDragTilt(null);
      if (!didTriggerLongPressRef.current && Math.hypot(dx, dy) < 10 && dt < 350) {
        if (coverMenuVisible) {
          setCoverMenuVisible(false);
        } else {
          triggerFlipToPage(lastViewedDay || todayDayNum, 'next');
        }
      }
      return;
    }

    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        triggerFlipToPage(activePage + 1, 'next');
      } else {
        triggerFlipToPage(activePage - 1, 'prev');
      }
    }
  };

  // Locked future slot tap
  const handleLockedSlotTap = (slotIdx: number) => {
    setShakingLockSlot(slotIdx);
    setPulseHeaderLock(true);
    playPaperRustleSound(0.68);
    setTimeout(() => {
      setShakingLockSlot(null);
      setPulseHeaderLock(false);
    }, 450);
  };

  // Sticker Handlers
  const handleAddSticker = (stickerId: string) => {
    if (isCoverView) {
      triggerFlipToPage(todayDayNum, 'next');
      return;
    }
    if (isFutureDay) {
      handleLockedSlotTap(0);
      return;
    }

    const randomX = 92 + Math.floor(Math.random() * 110);
    const randomY = 140 + Math.floor(Math.random() * 160);
    const randomRot = Math.floor(Math.random() * 18) - 9;

    setPageStickers(prev => {
      const cur = prev[activePage] || [];
      return {
        ...prev,
        [activePage]: [
          ...cur,
          {
            uid: `stk-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            id: stickerId,
            x: randomX,
            y: randomY,
            rot: randomRot
          }
        ]
      };
    });
    playStickyGlueSound();
  };

  const handleRemoveSticker = (uid: string) => {
    setPageStickers(prev => {
      const cur = prev[activePage] || [];
      return {
        ...prev,
        [activePage]: cur.filter(s => s.uid !== uid)
      };
    });
  };

  const [headlineEditor, setHeadlineEditor] = useState<{ text: string } | null>(null);

  // Get current active day's log & entries
  const y = currentYear;
  const m = String(currentMonth + 1).padStart(2, '0');
  const d = String(activePage).padStart(2, '0');
  const activeDateStr = `${y}-${m}-${d}`;
  const currentDayLog = getDayLog(activeDateStr);
  const currentEntries = currentDayLog?.entries ?? [];

  const handleSaveHeadline = async (text: string) => {
    const curEntries = currentDayLog ? [...currentDayLog.entries] : [];
    await upsertDayEntries(activeDateStr, curEntries, [], undefined, undefined, undefined, text.trim());
    setHeadlineEditor(null);
    playPaperRustleSound(1.2);
  };
  const dowName = activePage >= 1 && activePage <= totalDays
    ? daysOfWeek[new Date(currentYear, currentMonth, activePage).getDay()]
    : '';

  const activeTilt = userDragTilt || (isCoverView ? gyroTilt : { x: 2, y: -2.5 });
  const activeScale = isCoverView ? (isHoldingCover ? 0.65 : 0.68) : 0.97;
  const activeTranslateX = isCoverView ? -4 : 0;
  const stickersOnThisPage = pageStickers[activePage] || [];

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Hidden File Inputs for Direct Gallery Picking */}
      <input
        ref={slotFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onSlotFileChosen}
      />
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onCoverFileChosen}
      />

      {/* Embedded CSS Keyframes for Real 3D Page Curl & Natural Hand Arc */}
      <style>{`
        .font-serif-book { font-family: 'Cormorant Garamond', serif; }
        .font-hand { font-family: 'Caveat', cursive; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes realisticCurlForward {
          0% {
            transform: perspective(1800px) rotateY(0deg) skewY(0deg);
            box-shadow: -4px 0 14px rgba(0,0,0,0.12);
            opacity: 1;
          }
          42% {
            transform: perspective(1800px) rotateY(-78deg) skewY(-4.5deg) scaleX(0.96);
            box-shadow: -28px 12px 36px rgba(25, 18, 12, 0.32);
            opacity: 1;
          }
          78% {
            transform: perspective(1800px) rotateY(-148deg) skewY(-2deg) scaleX(0.98);
            box-shadow: -14px 6px 20px rgba(25, 18, 12, 0.18);
            opacity: 0.92;
          }
          100% {
            transform: perspective(1800px) rotateY(-179deg) skewY(0deg);
            box-shadow: -2px 0 6px rgba(0,0,0,0.05);
            opacity: 0;
          }
        }

        @keyframes realisticCurlBackward {
          0% {
            transform: perspective(1800px) rotateY(-176deg) skewY(-2deg);
            box-shadow: -4px 0 12px rgba(0,0,0,0.12);
            opacity: 0.55;
          }
          48% {
            transform: perspective(1800px) rotateY(-82deg) skewY(4.5deg) scaleX(0.96);
            box-shadow: -28px 12px 36px rgba(25, 18, 12, 0.30);
            opacity: 1;
          }
          100% {
            transform: perspective(1800px) rotateY(0deg) skewY(0deg);
            box-shadow: 0 0 0 rgba(0,0,0,0);
            opacity: 1;
          }
        }

        @keyframes handSlotArc {
          0% {
            transform: translate3d(90px, 110px, 60px) rotate(14deg) scale(1.12);
            opacity: 0;
          }
          16% {
            opacity: 1;
          }
          55% {
            transform: translate3d(4px, -6px, 25px) rotate(-3deg) scale(1.02);
            opacity: 1;
          }
          80% {
            transform: translate3d(0px, 0px, 2px) rotate(0deg) scale(0.98);
            opacity: 1;
          }
          100% {
            transform: translate3d(65px, 85px, 30px) rotate(8deg) scale(1.02);
            opacity: 0;
          }
        }

        @keyframes handWithdrawAfterTuck {
          0%, 62% {
            transform: translate(0px, 0px) rotate(0deg);
            opacity: 1;
          }
          82% {
            transform: translate(8px, 12px) rotate(4deg);
            opacity: 1;
          }
          100% {
            transform: translate(55px, 75px) rotate(12deg);
            opacity: 0;
          }
        }

        @keyframes lockShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px) rotate(-6deg); }
          50% { transform: translateX(4px) rotate(6deg); }
          75% { transform: translateX(-2px) rotate(-3deg); }
        }

        .animate-lock-shake {
          animation: lockShake 0.38s ease;
        }
      `}</style>

      {/* Top Mobile Book Bar — Symmetrical Balanced Action Pills */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 16px',
          borderBottom: '1px solid rgba(220, 210, 195, 0.45)',
          marginBottom: 8
        }}
      >
        {/* Close CTA Pill */}
        <button
          type="button"
          onClick={() => triggerFlipToPage(0, 'prev')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 15px',
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            border: isCoverView ? '1.5px solid #DF5739' : '1px solid #D5CBB8',
            backgroundColor: isCoverView ? 'rgba(223,87,57,0.08)' : '#FFFFFF',
            color: isCoverView ? '#DF5739' : '#3A2E28',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          title="Close photobook to cover"
        >
          <BookOpen size={13} color={isCoverView ? '#DF5739' : '#6A584C'} />
          <span>Close</span>
        </button>

        {/* Today CTA Pill */}
        <button
          type="button"
          onClick={() => triggerFlipToPage(todayDayNum, todayDayNum > activePage ? 'next' : 'prev')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 15px',
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            border: !isCoverView && activePage === todayDayNum ? '1.5px solid #DF5739' : '1px solid #D5CBB8',
            backgroundColor: !isCoverView && activePage === todayDayNum ? '#DF5739' : '#FFFFFF',
            color: !isCoverView && activePage === todayDayNum ? '#FFFFFF' : '#3A2E28',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          title={`Flip to today (${monthName.slice(0, 3)} ${todayDayNum})`}
        >
          <Calendar size={13} color={!isCoverView && activePage === todayDayNum ? '#FFFFFF' : '#6A584C'} />
          <span>Today ({monthName.slice(0, 3)} {todayDayNum})</span>
        </button>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            padding: '6px 14px',
            borderRadius: 20,
            backgroundColor: '#2B2420',
            color: '#FAF6F0',
            fontSize: 11,
            fontWeight: 600,
            boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>✓ Book Link Ready to Share!</span>
        </div>
      )}

      {/* ==================================================================
          3D BOOK VIEWPORT (ON REALISTIC WOODEN TABLE WITH DEPTH SHADOWS)
          ================================================================== */}
      <div
        ref={bookViewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          width: '100%',
          maxWidth: 368,
          height: 498,
          margin: '0 auto',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: '1900px',
          perspectiveOrigin: '50% 48%',
          padding: isCoverView ? '6px 14px 34px 14px' : '4px 14px 4px 28px',
          touchAction: 'pan-y',
          zIndex: 2
        }}
      >
        {/* Dynamic Tabletop Desk Contact Shadow Beneath Book */}
        <div
          style={{
            position: 'absolute',
            bottom: isCoverView ? 16 : 8,
            left: isCoverView ? '16%' : '8%',
            right: isCoverView ? '16%' : '6%',
            height: isCoverView ? 34 : 26,
            borderRadius: '50%',
            background: isCoverView
              ? 'radial-gradient(ellipse at center, rgba(28, 16, 8, 0.58) 0%, rgba(38, 22, 12, 0.30) 45%, transparent 75%)'
              : 'radial-gradient(ellipse at center, rgba(28, 16, 8, 0.48) 0%, rgba(38, 22, 12, 0.22) 50%, transparent 78%)',
            filter: 'blur(9px)',
            transform: `translateY(${isCoverView ? 22 : 16}px) scaleX(${1 + Math.abs(activeTilt.y) * 0.012})`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

          {/* HORIZONTAL ACTION PILL BAR (REVEALED ON TAP & HOLD ON COVER) */}
        {isCoverView && (
          <div
            className="cover-context-menu"
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: `translateX(-50%) translateY(${coverMenuVisible ? '0px' : '16px'}) scale(${coverMenuVisible ? 1 : 0.95})`,
              opacity: coverMenuVisible ? 1 : 0,
              pointerEvents: coverMenuVisible ? 'auto' : 'none',
              transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: 6,
              borderRadius: 24,
              backgroundColor: 'rgba(35, 31, 29, 0.94)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 14px 30px rgba(20,14,10,0.35)',
              border: '1px solid rgba(255,255,255,0.15)'
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerFlipToPage(activePage === 0 ? totalDays + 1 : 0);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#FAF6F0',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <RotateCw style={{ width: 13, height: 13 }} />
              <span>{activePage === 0 ? 'Back Cover' : 'Front Cover'}</span>
            </button>

            <div style={{ width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.15)' }} />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShareToast(true);
                setCoverMenuVisible(false);
                setTimeout(() => setShareToast(false), 2200);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#FAF6F0',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Share2 style={{ width: 13, height: 13 }} />
              <span>Share</span>
            </button>

            <div style={{ width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.15)' }} />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLinenIndex((prev) => (prev + 1) % LINEN_THEMES.length);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#FAF6F0',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.6)',
                  backgroundColor: currentLinen.main
                }}
              />
              <span>{currentLinen.name}</span>
            </button>
          </div>
        )}

        {/* 3D BOOK CONTAINER WITH GYRO TILT & 0.68x COVER SCALE */}
        <div
          style={{
            width: '100%',
            height: '100%',
            maxHeight: 565,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: userDragTilt ? 'transform 0.06s ease-out' : 'transform 0.58s cubic-bezier(0.22, 1, 0.36, 1)',
            transform: `translateX(${activeTranslateX}px) rotateX(${activeTilt.x.toFixed(2)}deg) rotateY(${activeTilt.y.toFixed(2)}deg) scale(${activeScale})`
          }}
        >
          {/* VISIBLE LEFT PAGE PEEK (WHEN OPEN ON DAY PAGES) */}
          {!isCoverView && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                triggerFlipToPage(activePage - 1, 'prev');
              }}
              title="Flip to earlier day"
              style={{
                position: 'absolute',
                left: -28,
                top: 2,
                bottom: 2,
                width: 29,
                borderTopLeftRadius: 10,
                borderBottomLeftRadius: 10,
                zIndex: 25,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(to right, #E2DACB 0%, #F4EFE4 28%, #FAF7F0 78%, #DFD6C7 100%)',
                boxShadow: '-4px 6px 14px rgba(32, 24, 18, 0.16), inset 3px 0 0 #EDE6D8, inset 6px 0 0 #DBD2C1, inset -5px 0 8px rgba(35, 26, 18, 0.14)'
              }}
            >
              <ChevronLeft style={{ width: 14, height: 14, color: '#7D7165' }} />
            </div>
          )}

          {/* Spine Crease Shadow */}
          {!isCoverView && (
            <div
              style={{
                position: 'absolute',
                left: -2,
                top: 0,
                bottom: 0,
                width: 12,
                zIndex: 35,
                pointerEvents: 'none',
                background: 'linear-gradient(90deg, rgba(35,25,18,0.22) 0%, rgba(35,25,18,0.07) 45%, rgba(255,255,255,0.4) 75%, transparent 100%)'
              }}
            />
          )}

          {/* Left Hardcover Spine Hinge */}
          <div
            style={{
              position: 'absolute',
              left: -12,
              top: -4,
              bottom: -4,
              width: 18,
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
              zIndex: 5,
              background: `linear-gradient(90deg, ${currentLinen.spine} 0%, ${currentLinen.main} 55%, ${currentLinen.spine} 100%)`,
              boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.22), -4px 6px 14px rgba(0,0,0,0.18)',
              transform: 'translateZ(-2px)'
            }}
          />

          {/* Right Stacked Paper Pages Edge */}
          <div
            style={{
              position: 'absolute',
              top: 4,
              bottom: 4,
              right: -8,
              width: 10,
              borderTopRightRadius: 6,
              borderBottomRightRadius: 6,
              background: 'repeating-linear-gradient(90deg, #FCFBF8 0px, #FCFBF8 1.5px, #E2DACB 1.5px, #E2DACB 3px)',
              boxShadow: '5px 8px 18px rgba(32, 24, 18, 0.18)',
              transform: 'translateZ(-4px)'
            }}
          />

          {/* Bottom Stacked Paper Pages Edge */}
          <div
            style={{
              position: 'absolute',
              left: 4,
              right: -6,
              bottom: -7,
              height: 8,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
              background: 'repeating-linear-gradient(0deg, #F7F4EC 0px, #F7F4EC 1.5px, #DFD7C7 1.5px, #DFD7C7 3px)',
              boxShadow: '0 8px 20px rgba(32, 24, 18, 0.16)',
              transform: 'translateZ(-4px)'
            }}
          />

          {/* 3D Curled Flipping Page Leaf */}
          {flipAnim && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderTopRightRadius: 16,
                borderBottomRightRadius: 16,
                borderTopLeftRadius: 3,
                borderBottomLeftRadius: 3,
                pointerEvents: 'none',
                zIndex: 120,
                overflow: 'hidden',
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                backgroundColor: flipAnim.isCover ? currentLinen.main : '#FCFBF8',
                animation: `${flipAnim.dir === 'next' ? 'realisticCurlForward' : 'realisticCurlBackward'} ${flipAnim.speed} cubic-bezier(0.26, 0.92, 0.38, 1) forwards`
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(112deg, transparent 0%, rgba(255,255,255,0.55) 38%, rgba(225,216,202,0.85) 54%, rgba(40,30,20,0.22) 68%, transparent 85%)'
                }}
              />
            </div>
          )}

          {/* ==============================================================
              VIEW A: 3D CLOSED HARDCOVER (Scale 0.68 + Gyro Tilt)
              ============================================================== */}
          {isCoverView ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderTopRightRadius: 16,
                borderBottomRightRadius: 16,
                borderTopLeftRadius: 3,
                borderBottomLeftRadius: 3,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                zIndex: 30,
                overflow: 'hidden',
                backgroundColor: currentLinen.main,
                backgroundImage:
                  'repeating-linear-gradient(0deg, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 3px), linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(0,0,0,0.12) 100%)',
                boxShadow:
                  'inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -2px 6px rgba(0,0,0,0.22), 0 6px 12px -2px rgba(25, 16, 10, 0.35), 0 24px 44px -6px rgba(28, 18, 10, 0.42), 0 42px 68px -12px rgba(35, 22, 12, 0.32), -4px 0 8px rgba(25, 16, 10, 0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(43,36,32,0.5)' }}>
                  {activePage === 0 ? 'VOLUME 2026 • ARCHIVAL LINEN' : 'HEIRLOOM EDITION'}
                </span>
              </div>

              {activePage === 0 ? (
                /* FRONT COVER EMBOSSED INSET CARD */
                <div
                  style={{
                    margin: 'auto',
                    width: '90%',
                    backgroundColor: '#FAF8F5',
                    borderRadius: 8,
                    padding: 20,
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.16), 0 2px 0 rgba(255,255,255,0.75)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 14
                  }}
                >
                  {/* Cover Photo Window with Camera Icon CTA */}
                  <div
                    style={{
                      position: 'relative',
                      width: 155,
                      height: 155,
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: '4px solid #FFFFFF',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.16)',
                      backgroundColor: '#E8E2D7'
                    }}
                  >
                    <img
                      src={coverPhoto}
                      alt="Book Cover"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCoverPhotoClick();
                      }}
                      className="cover-camera-btn"
                      title="Directly pick photo from your device"
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                      }}
                    >
                      <Camera style={{ width: 16, height: 16 }} />
                    </button>
                  </div>

                  {/* Editable Cover Title */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCoverField('title');
                    }}
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    {editingCoverField === 'title' ? (
                      <input
                        type="text"
                        maxLength={32}
                        autoFocus
                        value={coverTitle}
                        onChange={(e) => setCoverTitle(e.target.value.slice(0, 32))}
                        onBlur={() => setEditingCoverField(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingCoverField(null)}
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 22,
                          fontWeight: 700,
                          color: '#2B2420',
                          backgroundColor: '#F2ECE1',
                          borderRadius: 4,
                          padding: '2px 8px',
                          border: '1px solid #DF5739',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <h2
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 22,
                          fontWeight: 700,
                          color: '#2B2420',
                          lineHeight: 1.2,
                          margin: 0
                        }}
                      >
                        {coverTitle}
                      </h2>
                    )}
                  </div>

                  {/* Editable Cover Subtitle */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCoverField('subtitle');
                    }}
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    {editingCoverField === 'subtitle' ? (
                      <input
                        type="text"
                        maxLength={48}
                        autoFocus
                        value={coverSubtitle}
                        onChange={(e) => setCoverSubtitle(e.target.value.slice(0, 48))}
                        onBlur={() => setEditingCoverField(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingCoverField(null)}
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          fontFamily: "'Caveat', cursive",
                          fontSize: 18,
                          color: '#6E6359',
                          backgroundColor: '#F2ECE1',
                          borderRadius: 4,
                          padding: '2px 8px',
                          border: '1px solid #DF5739',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <p
                        style={{
                          fontFamily: "'Caveat', cursive",
                          fontSize: 18,
                          color: '#6E6359',
                          lineHeight: 1.1,
                          margin: 0
                        }}
                      >
                        {coverSubtitle}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* BACK COVER EMBOSSED STAMP (COMPLETELY DISTINCT FROM FRONT) */
                <div
                  style={{
                    margin: 'auto',
                    width: '86%',
                    textAlign: 'center',
                    padding: '36px 20px',
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#DF5739',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)'
                    }}
                  >
                    <BookOpen style={{ width: 22, height: 22 }} />
                  </div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#2B2420', margin: 0 }}>
                    {monthName} Family Archive
                  </h3>
                  <p style={{ fontSize: 12, color: '#3E3A4B', lineHeight: 1.5, margin: 0 }}>
                    Printed on archival 220gsm cotton paper so your family can sit together and relive these days for decades.
                  </p>
                </div>
              )}

              <div style={{ textAlign: 'center', paddingBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(43,36,32,0.4)' }}>
                  {totalDays} DAYS • ARCHIVAL LINEN
                </span>
              </div>
            </div>
          ) : (
            /* ==============================================================
                VIEW B: OPEN SINGLE DAY PAGE (DAYS 1 TO 31)
                ============================================================== */
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderTopRightRadius: 16,
                borderBottomRightRadius: 16,
                borderTopLeftRadius: 3,
                borderBottomLeftRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '10px 12px 6px 16px',
                zIndex: 20,
                overflow: 'hidden',
                backgroundColor: '#FCFBF8',
                backgroundImage:
                  'radial-gradient(rgba(0,0,0,0.018) 1px, transparent 0), linear-gradient(to right, rgba(45,35,25,0.12) 0%, rgba(45,35,25,0.03) 6%, transparent 15%, transparent 95%, rgba(45,35,25,0.02) 100%)',
                backgroundSize: '14px 14px, 100% 100%',
                boxShadow:
                  'inset 1px 0 0 rgba(255,255,255,0.8), -6px 14px 28px rgba(32, 20, 12, 0.20), 8px 22px 38px rgba(28, 18, 10, 0.28), 0 32px 50px rgba(35, 22, 12, 0.16)'
              }}
            >
              {/* Day Header */}
              <div style={{ borderBottom: '1px solid #EAE3D5', paddingBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#8C7A6B' }}>
                  <span>
                    {dowName} • {monthName.slice(0, 3).toUpperCase()} {activePage}, {currentYear}
                  </span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12 }}>
                    {activePage} / {totalDays}
                  </span>
                </div>

                {isFutureDay ? (
                  <div style={{ marginTop: 6 }}>
                    <div
                      className={pulseHeaderLock ? 'animate-lock-shake' : ''}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 10px',
                        borderRadius: 20,
                        backgroundColor: '#F2ECE1',
                        border: '1px solid #E2D8C5',
                        color: '#5C5046'
                      }}
                    >
                      <Lock style={{ width: 12, height: 12 }} />
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 13 }}>
                        Opens on {monthName.slice(0, 3)} {activePage}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      const initialText = currentDayLog?.title || (currentEntries[0]?.text ? currentEntries[0].text.slice(0, 40) : '');
                      setHeadlineEditor({ text: initialText });
                    }}
                    title="Click to personalize this day's memory headline"
                    style={{
                      marginTop: 2,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontWeight: 700,
                        fontSize: 17,
                        color: '#2B2420',
                        lineHeight: 1.2,
                        borderBottom: '1px dashed #C8BDB0',
                        paddingBottom: 1
                      }}
                    >
                      {currentDayLog?.title || (currentEntries[0]?.text ? currentEntries[0].text.slice(0, 36) : `${monthName} ${activePage} memories`)}
                    </span>
                    <Pencil style={{ width: 11, height: 11, color: '#A89B8C' }} />
                  </div>
                )}
              </div>

              {/* 2x2 Recessed Photo Pockets Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  columnGap: 10,
                  rowGap: 6,
                  margin: '2px 0',
                  padding: '2px 0'
                }}
              >
                {[0, 1, 2, 3].map((slotIdx) => {
                  const entry = currentEntries[slotIdx];
                  const photo = entry?.photos?.[0];
                  const caption = entry?.text || 'Add a 2-line memory note...';
                  const isBeingPlaced = handPlacement?.slotIdx === slotIdx;

                  if (isFutureDay) {
                    return (
                      <div key={slotIdx} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div
                          onClick={() => handleLockedSlotTap(slotIdx)}
                          className={shakingLockSlot === slotIdx ? 'animate-lock-shake' : ''}
                          style={{
                            aspectRatio: '4 / 3.4',
                            borderRadius: 4,
                            backgroundColor: '#EFECE5',
                            padding: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            boxShadow: 'inset 0 2px 5px rgba(35, 28, 22, 0.16), inset 0 0 0 1px rgba(45, 35, 25, 0.07), 0 1px 0 rgba(255, 255, 255, 0.95)'
                          }}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5DFD3', color: '#9B8F82', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock style={{ width: 14, height: 14 }} />
                          </div>
                        </div>
                        <div style={{ marginTop: 3, minHeight: 28 }} />
                      </div>
                    );
                  }

                  return (
                    <div key={slotIdx} style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      <div
                        onClick={() => handleSlotClick(slotIdx)}
                        style={{
                          aspectRatio: '4 / 3.4',
                          borderRadius: 4,
                          backgroundColor: '#EFECE5',
                          padding: 5,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          position: 'relative',
                          boxShadow: 'inset 0 2px 5px rgba(35, 28, 22, 0.18), inset 0 0 0 1px rgba(45, 35, 25, 0.08), 0 1px 0 rgba(255, 255, 255, 0.95)'
                        }}
                      >
                        {/* Die-cut inner cardstock lip */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            border: '4px solid #FCFBF8',
                            borderRadius: 3,
                            pointerEvents: 'none',
                            zIndex: 15,
                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.16), inset 0 0 0 1px rgba(0, 0, 0, 0.05)'
                          }}
                        />

                        {photo ? (
                          <img
                            src={photo}
                            alt="Memory"
                            style={{
                              position: 'relative',
                              zIndex: 10,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 2,
                              filter: 'contrast(1.03) sepia(0.05)'
                            }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: '#FFFFFF',
                                color: '#DF5739',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Plus style={{ width: 16, height: 16, strokeWidth: 2.5 }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* NATURAL 3D HAND TUCKING PRINT (EXACT ARGON IMPLEMENTATION) */}
                      {isBeingPlaced && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            zIndex: 50,
                            height: 'calc(100% - 31px)',
                            animation: 'handSlotArc 1.05s cubic-bezier(0.22, 1, 0.36, 1) forwards'
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: '#FFFFFF',
                              padding: 5,
                              borderRadius: 3,
                              boxShadow: '0 18px 32px rgba(25,18,12,0.34)',
                              border: '1px solid #E5DEC9'
                            }}
                          >
                            <img
                              src={handPlacement.photoUrl}
                              alt="Placing print"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2 }}
                            />
                          </div>

                          {/* Hand with Oatmeal Sweater Cuff */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: -64,
                              right: -48,
                              width: 128,
                              height: 128,
                              pointerEvents: 'none',
                              animation: 'handWithdrawAfterTuck 1.05s ease-out forwards',
                              filter: 'drop-shadow(-6px 10px 14px rgba(28, 20, 14, 0.32))'
                            }}
                          >
                            <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                              <defs>
                                <linearGradient id="naturalSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#F7D5BE" />
                                  <stop offset="55%" stopColor="#E9B89A" />
                                  <stop offset="100%" stopColor="#D69C7A" />
                                </linearGradient>
                                <linearGradient id="sleeveClothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#EFE9DF" />
                                  <stop offset="100%" stopColor="#D5CBB8" />
                                </linearGradient>
                              </defs>
                              <path d="M42 46 C55 32, 82 38, 98 56 L124 88 L88 112 L52 76 C38 64, 34 54, 42 46 Z" fill="#D69C7A" />
                              <path d="M24 28 C14 18, 28 4, 44 14 C60 24, 84 48, 102 66 L138 106 L104 138 L66 96 C48 76, 36 58, 22 42 C16 35, 19 31, 24 28 Z" fill="url(#naturalSkinGrad)" stroke="#C58B6B" strokeWidth="1.5" />
                              <ellipse cx="31" cy="21" rx="7.5" ry="5" transform="rotate(-32 31 21)" fill="#FCEAE0" stroke="#D8A489" strokeWidth="1" />
                              <path d="M52 44 Q58 39 63 43" fill="none" stroke="#C28666" strokeWidth="1.4" strokeLinecap="round" />
                              <path d="M72 65 Q79 59 85 64" fill="none" stroke="#C28666" strokeWidth="1.3" strokeLinecap="round" />
                              <path d="M94 122 L134 86 L176 132 L136 168 Z" fill="url(#sleeveClothGrad)" stroke="#C2B6A1" strokeWidth="2" strokeLinejoin="round" />
                              <path d="M102 114 L126 92" stroke="#DF5739" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* 2-Line Handwritten Caption */}
                      <div
                        onClick={() => setCaptionEditor({ slotIdx, text: caption.startsWith('Add a') ? '' : caption })}
                        style={{
                          marginTop: 3,
                          minHeight: 28,
                          maxHeight: 30,
                          padding: '2px 4px',
                          borderRadius: 4,
                          fontFamily: "'Caveat', cursive",
                          fontSize: 13.5,
                          lineHeight: '13.5px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          color: caption.startsWith('Add a') ? '#9A8E80' : '#3A312B'
                        }}
                      >
                        {caption}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Page Footer Navigation */}
              <div
                style={{
                  borderTop: '1px solid #EAE3D5',
                  paddingTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  color: '#8C7A6B',
                  paddingRight: 32
                }}
              >
                <button
                  type="button"
                  onClick={() => triggerFlipToPage(activePage - 1, 'prev')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, color: '#8C7A6B', fontWeight: 600 }}
                >
                  <ChevronLeft style={{ width: 12, height: 12 }} />
                  <span>{activePage === 1 ? 'Cover' : `${monthName.slice(0, 3)} ${activePage - 1}`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerFlipToPage(activePage + 1, 'next')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, color: '#8C7A6B', fontWeight: 600 }}
                >
                  <span>{activePage === totalDays ? 'Back' : `${monthName.slice(0, 3)} ${activePage + 1}`}</span>
                  <ChevronRight style={{ width: 12, height: 12 }} />
                </button>
              </div>

              {/* Placed Stickers Layer (zIndex 900) */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 900 }}>
                {stickersOnThisPage.map((stk) => {
                  const cat = STICKER_CATALOG.find((c) => c.id === stk.id);
                  if (!cat) return null;
                  return (
                    <div
                      key={stk.uid}
                      className="placed-sticker"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setDraggingSticker({
                          uid: stk.uid,
                          startX: e.clientX,
                          startY: e.clientY,
                          origX: stk.x,
                          origY: stk.y
                        });
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSticker(stk.uid);
                      }}
                      style={{
                        position: 'absolute',
                        left: `${stk.x}px`,
                        top: `${stk.y}px`,
                        transform: `rotate(${stk.rot}deg)`,
                        zIndex: 910,
                        pointerEvents: 'auto',
                        cursor: 'grab',
                        filter: 'drop-shadow(0 4px 8px rgba(28,20,14,0.28))'
                      }}
                      title="Drag to move • Double-click to remove"
                    >
                      {cat.render()}
                    </div>
                  );
                })}
              </div>

              {/* Interactive Bottom-Right Diagonal Paper Corner Curl */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!cornerTeased) {
                    setCornerTeased(true);
                    playPaperRustleSound(1.25);
                  } else {
                    setCornerTeased(false);
                    triggerFlipToPage(activePage + 1, 'next');
                  }
                }}
                onPointerEnter={() => setCornerTeased(true)}
                onPointerLeave={() => setCornerTeased(false)}
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: 56,
                  height: 56,
                  cursor: 'pointer',
                  zIndex: 950
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: cornerTeased ? 52 : 26,
                    height: cornerTeased ? 52 : 26,
                    background: 'linear-gradient(315deg, #E3DDD1 0%, #EFEAE0 55%, transparent 56%)',
                    boxShadow: 'inset -3px -3px 7px rgba(0, 0, 0, 0.14)',
                    transition: 'all 0.28s ease-out'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    borderTopLeftRadius: 6,
                    width: cornerTeased ? 52 : 26,
                    height: cornerTeased ? 52 : 26,
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F6F2E9 42%, #DED6C6 68%, #C7B9A5 88%, #EFEBE2 100%)',
                    boxShadow: cornerTeased
                      ? '-8px -8px 18px rgba(30, 22, 15, 0.30), -2px -2px 5px rgba(30, 22, 15, 0.18), inset 3px 3px 6px rgba(255, 255, 255, 0.95)'
                      : '-4px -4px 10px rgba(30, 22, 15, 0.22), inset 2px 2px 4px rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.28s ease-out'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================
          BOTTOM STICKER DOCK (CLUSTER PILL -> HORIZONTAL CAROUSEL)
          ================================================================== */}
      <div
        style={{
          width: '100%',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 56
        }}
      >
        {!stickerTrayOpen ? (
          <button
            type="button"
            onClick={() => setStickerTrayOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 14px',
              borderRadius: 24,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2D9C8',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', margin: '0 -4px' }}>
              <div style={{ transform: 'rotate(-12deg)', margin: '0 -4px' }}>{STICKER_CATALOG[0].render(28)}</div>
              <div style={{ transform: 'rotate(4deg)', margin: '0 -4px', zIndex: 2 }}>{STICKER_CATALOG[1].render(30)}</div>
              <div style={{ transform: 'rotate(12deg)', margin: '0 -4px', zIndex: 3 }}>{STICKER_CATALOG[2].render(28)}</div>
              <div style={{ transform: 'rotate(-6deg)', margin: '0 -4px', zIndex: 2 }}>{STICKER_CATALOG[4].render(28)}</div>
            </div>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 380 }}>
            <button
              type="button"
              onClick={() => setStickerTrayOpen(false)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#E5DEC9',
                border: 'none',
                color: '#3A312B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto', padding: '2px 4px', flex: 1 }} className="no-scrollbar">
              {STICKER_CATALOG.map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  onClick={() => handleAddSticker(stk.id)}
                  style={{
                    flexShrink: 0,
                    padding: 4,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    border: '1px solid #E2D9C8',
                    cursor: 'pointer'
                  }}
                >
                  {stk.render()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DAY HEADLINE / THEME MEMORY EDITOR MODAL */}
      {headlineEditor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            style={{
              backgroundColor: '#FAF7F0',
              border: '1px solid #DFD6C5',
              borderRadius: 16,
              width: '100%',
              maxWidth: 340,
              padding: 18,
              boxShadow: '0 18px 40px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#5C5147', textTransform: 'uppercase' }}>
                Day Memory Headline
              </span>
              <button
                type="button"
                onClick={() => setHeadlineEditor(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C7E72' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 12, color: '#7D7165' }}>
              Name this day's memory theme (e.g., "Grandma's Birthday", "Walk by the river"):
            </p>

            <input
              type="text"
              autoFocus
              maxLength={45}
              value={headlineEditor.text}
              onChange={(e) => setHeadlineEditor({ text: e.target.value })}
              placeholder={`${monthName} ${activePage} memories`}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #D5CBB8',
                backgroundColor: '#FFFFFF',
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18,
                fontWeight: 700,
                color: '#2B2420',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setHeadlineEditor(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid #D5CBB8',
                  backgroundColor: '#FFFFFF',
                  color: '#5C5147',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveHeadline(headlineEditor.text)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#DF5739',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save Headline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-LINE CAPTION EDITOR MODAL */}
      {captionEditor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            style={{
              backgroundColor: '#FCFBF8',
              border: '1px solid #DFD6C5',
              borderRadius: 16,
              width: '100%',
              maxWidth: 320,
              padding: 16,
              boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#5C5147', textTransform: 'uppercase' }}>
                2-Line Photo Note
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontWeight: 600,
                  backgroundColor: captionEditor.text.length >= 60 && captionEditor.text.length <= 80 ? '#DCFCE7' : '#F3E9E2',
                  color: captionEditor.text.length >= 60 && captionEditor.text.length <= 80 ? '#166534' : '#B85334'
                }}
              >
                {captionEditor.text.length} / 80 chars
              </span>
            </div>

            <textarea
              rows={2}
              maxLength={80}
              autoFocus
              value={captionEditor.text}
              onChange={(e) => setCaptionEditor({ ...captionEditor, text: e.target.value.slice(0, 80) })}
              placeholder="Write a nostalgic 2-line memory note (60–80 chars)..."
              style={{
                width: '100%',
                borderRadius: 10,
                backgroundColor: '#F5F1E8',
                border: '1px solid #DED5C4',
                padding: 10,
                fontFamily: "'Caveat', cursive",
                fontSize: 18,
                color: '#2B2420',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setCaptionEditor(null)}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#6E6359', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmed = captionEditor.text.trim();
                  const targetDay = activePage;
                  const y = currentYear;
                  const m = String(currentMonth + 1).padStart(2, '0');
                  const d = String(targetDay).padStart(2, '0');
                  const dateStr = `${y}-${m}-${d}`;

                  const existing = getDayLog(dateStr);
                  const curEntries: Entry[] = existing ? [...existing.entries] : [];
                  while (curEntries.length <= captionEditor.slotIdx) {
                    curEntries.push({ id: uid(), text: '', photos: [] });
                  }
                  curEntries[captionEditor.slotIdx] = {
                    ...curEntries[captionEditor.slotIdx],
                    id: curEntries[captionEditor.slotIdx]?.id || uid(),
                    text: trimmed || 'Add a 2-line memory note...',
                  };
                  upsertDayEntries(dateStr, curEntries);
                  setCaptionEditor(null);
                }}
                style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, backgroundColor: '#DF5739', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
