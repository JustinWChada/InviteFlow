import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateInvitation } from '../services/invitationService';
import { useParams } from 'react-router-dom';
import { getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';
import { submitResponse } from '../services/responseService';
import { executeSuccessAction } from '../services/successActionService';

// ─── EVENT TYPE CONFIG ────────────────────────────────────────────────────────
// All theme-specific text, colors, emojis, and content live here.
// Add a new event type by adding a key — nothing else needs changing.
const EVENT_CONFIG = {
  'Date Night': {
    // Visual
    bg: 'linear-gradient(160deg, #fce4ec 0%, #f8bbd0 50%, #fce4ec 100%)',
    cardBorder: '#e84393',
    cardShadow: 'rgba(232,67,147,0.2)',
    primary: '#e84393',
    primaryDark: '#c2185b',
    accentBg: 'rgba(232,67,147,0.06)',
    accentBorder: 'rgba(232,67,147,0.2)',
    rippleColor: '#e84393',
    particleEmojis: ['❤️','💕','💖','💗','💓','💝','🩷'],
    confettiColors: ['#e84393','#ff6bb5','#ff99cc','#ffcc00','#ff66aa'],
    // Text
    askQuestion: 'Will you go on a date with me? 🥺',
    yesLabel: 'Yes ❤️',
    noLabel: 'No 💔',
    yesReactionTitle: 'You actually said yes? 🥲',
    yesReactionSub: 'I was so ready for you to say no 😅',
    yesReactionNext: 'Next 💝',
    dateTitle: '📅 Save the date',
    dateSub: "Here's when our date is planned!",
    timeTitle: '⏰ What time?',
    timeSub: 'Be ready on time!',
    timeConfirm: (h, m, ampm) => `🕐 Be ready at ${h}:${m} ${ampm}`,
    foodTitle: "what are we feelin' 😏",
    foodSub: 'Pick what sounds good to you',
    foodNext: (f) => `${f}? Let's go! 🎉`,
    vibeTitle: "what's your vibe? 🕊️",
    vibeSub: 'Pick our ideal activity',
    vibeNext: (v) => `${v} it is! 💫`,
    vibeOptions: [
      { label: 'Golf', emoji: '⛳' }, { label: 'Walk', emoji: '🚶' },
      { label: 'Movies', emoji: '🎬' }, { label: 'Dancing', emoji: '💃' },
      { label: 'Theme Park', emoji: '🎢' }, { label: 'Beach', emoji: '🏝️' },
    ],
    finalTitle: (recipient) => `I got you${recipient ? ' ' + recipient : ''}. 💜`,
    acceptLabel: "I'm so in! 🎉",
    acceptedTitle: "It's a date! 💖",
    acceptedSub: (creator) => creator ? `${creator} can't wait!` : "Can't wait to see you!",
    acceptedEmojis: '💃🕺💃',
    loadingEmoji: '💌',
    loadingText: 'Opening your invitation…',
  },

  'Proposal': {
    bg: 'linear-gradient(160deg, #fff8dc 0%, #ffeaa7 40%, #fff8dc 100%)',
    cardBorder: '#d4af37',
    cardShadow: 'rgba(212,175,55,0.2)',
    primary: '#d4af37',
    primaryDark: '#b8860b',
    accentBg: 'rgba(212,175,55,0.06)',
    accentBorder: 'rgba(212,175,55,0.25)',
    rippleColor: '#d4af37',
    particleEmojis: ['💍','✨','💫','⭐','🌟','💎','🥂'],
    confettiColors: ['#d4af37','#ffd700','#fff8dc','#ffcc00','#f5e6a3'],
    askQuestion: 'Will you marry me? 💍',
    yesLabel: 'Yes, I will! 💍',
    noLabel: 'No 💔',
    yesReactionTitle: 'YOU SAID YES!! 😭✨',
    yesReactionSub: 'I have been planning this moment forever…',
    yesReactionNext: 'See the details 💍',
    dateTitle: '📅 Mark the date',
    dateSub: 'Our special day is coming…',
    timeTitle: '⏰ The moment',
    timeSub: "I'll be waiting for you",
    timeConfirm: (h, m, ampm) => `✨ The moment: ${h}:${m} ${ampm}`,
    foodTitle: '🥂 What shall we celebrate with?',
    foodSub: 'Pick what you fancy',
    foodNext: (f) => `${f} — perfect! ✨`,
    vibeTitle: '🌹 How would you like to celebrate?',
    vibeSub: 'Pick your dream celebration',
    vibeNext: (v) => `${v} — magical! 💍`,
    vibeOptions: [
      { label: 'Fine Dining', emoji: '🍽️' }, { label: 'Weekend Away', emoji: '🏨' },
      { label: 'Private Party', emoji: '🎊' }, { label: 'Family Gather', emoji: '👨‍👩‍👧' },
      { label: 'Beach', emoji: '🏖️' }, { label: 'Surprise Me', emoji: '🎁' },
    ],
    finalTitle: (recipient) => `This is our moment${recipient ? ', ' + recipient : ''}. 💍`,
    acceptLabel: 'I do! 💍✨',
    acceptedTitle: 'She said YES! 💍',
    acceptedSub: (creator) => creator ? `${creator} is the happiest person alive!` : "A new chapter begins!",
    acceptedEmojis: '💍💎✨',
    loadingEmoji: '💍',
    loadingText: 'Something special is opening…',
  },

  'Birthday': {
    bg: 'linear-gradient(160deg, #f4f2ff 0%, #e8e4ff 50%, #f4f2ff 100%)',
    cardBorder: '#6c63ff',
    cardShadow: 'rgba(108,99,255,0.2)',
    primary: '#6c63ff',
    primaryDark: '#4834d4',
    accentBg: 'rgba(108,99,255,0.06)',
    accentBorder: 'rgba(108,99,255,0.2)',
    rippleColor: '#6c63ff',
    particleEmojis: ['🎂','🎈','🎉','🎊','✨','🥳','🎁'],
    confettiColors: ['#6c63ff','#a29bfe','#fd79a8','#fdcb6e','#00b894'],
    askQuestion: "You're invited to a birthday bash! 🎂",
    yesLabel: "I'm coming! 🎉",
    noLabel: "Can't make it",
    yesReactionTitle: "Woohoo, you're coming! 🥳",
    yesReactionSub: "This party just got better!",
    yesReactionNext: 'See the details 🎊',
    dateTitle: '📅 Party Date',
    dateSub: "Save this date — it's gonna be epic!",
    timeTitle: '⏰ Party O\'Clock',
    timeSub: "Don't be late — the fun starts sharp!",
    timeConfirm: (h, m, ampm) => `🎈 Party starts at ${h}:${m} ${ampm}`,
    foodTitle: '🍕 What food are you hoping for?',
    foodSub: "Tell us what you're craving",
    foodNext: (f) => `${f} — great choice! 🎉`,
    vibeTitle: '🎊 What activities do you want?',
    vibeSub: 'Pick what sounds most fun',
    vibeNext: (v) => `${v} — let's do it! 🥳`,
    vibeOptions: [
      { label: 'Games', emoji: '🎮' }, { label: 'Music', emoji: '🎵' },
      { label: 'Dancing', emoji: '💃' }, { label: 'Movies', emoji: '🎬' },
      { label: 'Karaoke', emoji: '🎤' }, { label: 'Surprise', emoji: '🎁' },
    ],
    finalTitle: (recipient) => `It's gonna be legendary${recipient ? ', ' + recipient : ''}! 🎂`,
    acceptLabel: "Count me in! 🥳",
    acceptedTitle: "You're on the list! 🎉",
    acceptedSub: (creator) => creator ? `${creator} can't wait to see you!` : "See you at the party!",
    acceptedEmojis: '🎂🎈🎉',
    loadingEmoji: '🎂',
    loadingText: 'Loading your invitation…',
  },

  'Wedding': {
    bg: 'linear-gradient(160deg, #fdfdfd 0%, #f8f4f0 50%, #fdfdfd 100%)',
    cardBorder: '#2d3436',
    cardShadow: 'rgba(45,52,54,0.12)',
    primary: '#2d3436',
    primaryDark: '#1a1a2e',
    accentBg: 'rgba(45,52,54,0.04)',
    accentBorder: 'rgba(45,52,54,0.15)',
    rippleColor: '#b2bec3',
    particleEmojis: ['🌸','🤍','💐','🕊️','🌷','✨','🥂'],
    confettiColors: ['#2d3436','#b2bec3','#dfe6e9','#d4af37','#f8f4f0'],
    askQuestion: 'We joyfully invite you to our wedding 👰🤵',
    yesLabel: "We'll be there! 🎊",
    noLabel: "Can't attend",
    yesReactionTitle: "We're so glad you can make it! 🕊️",
    yesReactionSub: "Your presence means everything to us.",
    yesReactionNext: 'View the details 💐',
    dateTitle: '📅 Wedding Date',
    dateSub: 'Please save this date',
    timeTitle: '⏰ Ceremony Time',
    timeSub: 'Please arrive 15 minutes early',
    timeConfirm: (h, m, ampm) => `🕊️ Ceremony begins at ${h}:${m} ${ampm}`,
    foodTitle: '🍽️ Dietary preferences?',
    foodSub: 'Let us know so we can plan accordingly',
    foodNext: (f) => `Noted — thank you! 🌸`,
    vibeTitle: '💐 Which part are you most looking forward to?',
    vibeSub: 'We just want to know!',
    vibeNext: (v) => `Wonderful — see you there! 🕊️`,
    vibeOptions: [
      { label: 'Ceremony', emoji: '💒' }, { label: 'Reception', emoji: '🥂' },
      { label: 'Dancing', emoji: '💃' }, { label: 'Dinner', emoji: '🍽️' },
      { label: 'Speeches', emoji: '🎤' }, { label: 'All of it!', emoji: '🎊' },
    ],
    finalTitle: (recipient) => `We can't wait to see you${recipient ? ', ' + recipient : ''}. 🕊️`,
    acceptLabel: 'RSVP — We\'ll be there! 🎊',
    acceptedTitle: 'RSVP Confirmed! 💐',
    acceptedSub: (creator) => creator ? `${creator} are overjoyed you can join!` : "We're so happy you can join!",
    acceptedEmojis: '💒🕊️💐',
    loadingEmoji: '💒',
    loadingText: 'Opening your invitation…',
  },

  'Graduation': {
    bg: 'linear-gradient(160deg, #ffe6e6 0%, #ffd3d3 50%, #ffe6e6 100%)',
    cardBorder: '#ff6b6b',
    cardShadow: 'rgba(255,107,107,0.2)',
    primary: '#ff6b6b',
    primaryDark: '#d63031',
    accentBg: 'rgba(255,107,107,0.06)',
    accentBorder: 'rgba(255,107,107,0.2)',
    rippleColor: '#ff6b6b',
    particleEmojis: ['🎓','🎊','⭐','✨','🏆','📜','🥂'],
    confettiColors: ['#ff6b6b','#fdcb6e','#6c63ff','#00b894','#fd79a8'],
    askQuestion: "Come celebrate my graduation! 🎓",
    yesLabel: "I'll be there! 🎓",
    noLabel: "Can't make it",
    yesReactionTitle: "Yes! You're celebrating with me! 🥹",
    yesReactionSub: "Your support means so much!",
    yesReactionNext: 'See the details 🎓',
    dateTitle: '📅 Graduation Day',
    dateSub: 'The big day is finally here!',
    timeTitle: '⏰ Ceremony Time',
    timeSub: "Please be on time — it's a big moment!",
    timeConfirm: (h, m, ampm) => `🎓 Starts at ${h}:${m} ${ampm}`,
    foodTitle: '🍽️ What do you fancy for the celebration?',
    foodSub: "We're planning food — help us decide!",
    foodNext: (f) => `${f} — noted! 🎓`,
    vibeTitle: '🏆 What are you looking forward to most?',
    vibeSub: 'Just curious!',
    vibeNext: (v) => `${v} — can't wait! 🎊`,
    vibeOptions: [
      { label: 'Ceremony', emoji: '🎓' }, { label: 'Dinner', emoji: '🍽️' },
      { label: 'Photos', emoji: '📸' }, { label: 'Dancing', emoji: '💃' },
      { label: 'Speeches', emoji: '🎤' }, { label: 'All of it!', emoji: '🎉' },
    ],
    finalTitle: (recipient) => `I made it${recipient ? ', ' + recipient : ''}! 🎓`,
    acceptLabel: "Let's celebrate! 🎉",
    acceptedTitle: "RSVP Confirmed! 🎓",
    acceptedSub: (creator) => creator ? `${creator} is so grateful you're coming!` : "See you there!",
    acceptedEmojis: '🎓🏆🎉',
    loadingEmoji: '🎓',
    loadingText: 'Opening your invitation…',
  },

  'Party': {
    bg: 'linear-gradient(160deg, #fff3e0 0%, #ffe0b2 50%, #fff3e0 100%)',
    cardBorder: '#ff9800',
    cardShadow: 'rgba(255,152,0,0.2)',
    primary: '#ff9800',
    primaryDark: '#e65100',
    accentBg: 'rgba(255,152,0,0.06)',
    accentBorder: 'rgba(255,152,0,0.2)',
    rippleColor: '#ff9800',
    particleEmojis: ['🎉','🎊','✨','🥳','🎈','🔥','💥'],
    confettiColors: ['#ff9800','#ffcc02','#ff5722','#4caf50','#2196f3'],
    askQuestion: "You're invited to the party! 🎉",
    yesLabel: "Let's party! 🥳",
    noLabel: "Can't make it",
    yesReactionTitle: "YES! The gang's all here! 🔥",
    yesReactionSub: "This party needed you!",
    yesReactionNext: 'See the deets 🎊',
    dateTitle: '📅 Party Night',
    dateSub: "Mark it — this is the one!",
    timeTitle: '⏰ Doors Open',
    timeSub: "Come through whenever — party goes all night!",
    timeConfirm: (h, m, ampm) => `🎈 Doors open at ${h}:${m} ${ampm}`,
    foodTitle: '🍕 What food are you hoping for?',
    foodSub: "Tell us your cravings",
    foodNext: (f) => `${f} — we'll sort it! 🎉`,
    vibeTitle: '🔥 What kind of vibe are you bringing?',
    vibeSub: 'Choose your mode',
    vibeNext: (v) => `${v} energy — let's go! 🥳`,
    vibeOptions: [
      { label: 'Hype', emoji: '🔥' }, { label: 'Chill', emoji: '😎' },
      { label: 'Dance', emoji: '💃' }, { label: 'Games', emoji: '🎮' },
      { label: 'Karaoke', emoji: '🎤' }, { label: 'Everything', emoji: '💥' },
    ],
    finalTitle: (recipient) => `It's going to be wild${recipient ? ', ' + recipient : ''}! 🎉`,
    acceptLabel: "I'm IN! 🥳",
    acceptedTitle: "You're confirmed! 🎉",
    acceptedSub: (creator) => creator ? `${creator} says it's lit!` : "See you there — it's gonna be 🔥",
    acceptedEmojis: '🎉🥳🔥',
    loadingEmoji: '🎉',
    loadingText: 'Loading the good times…',
  },

  'Church Event': {
    bg: 'linear-gradient(160deg, #f0f4ff 0%, #e8eeff 50%, #f0f4ff 100%)',
    cardBorder: '#3f51b5',
    cardShadow: 'rgba(63,81,181,0.15)',
    primary: '#3f51b5',
    primaryDark: '#283593',
    accentBg: 'rgba(63,81,181,0.05)',
    accentBorder: 'rgba(63,81,181,0.2)',
    rippleColor: '#3f51b5',
    particleEmojis: ['✝️','🙏','✨','🕊️','⭐','🌟','💙'],
    confettiColors: ['#3f51b5','#7986cb','#c5cae9','#ffcc02','#ffffff'],
    askQuestion: 'You are warmly invited to join us 🙏',
    yesLabel: "I'll attend 🙏",
    noLabel: "Can't make it",
    yesReactionTitle: "Praise God, you're coming! 🙏",
    yesReactionSub: "We look forward to worshipping together.",
    yesReactionNext: 'View details ✝️',
    dateTitle: '📅 Event Date',
    dateSub: 'Please save this date for fellowship',
    timeTitle: '⏰ Service Time',
    timeSub: 'Please arrive a few minutes early',
    timeConfirm: (h, m, ampm) => `🙏 Service at ${h}:${m} ${ampm}`,
    foodTitle: '🍽️ Will you be joining for fellowship meal?',
    foodSub: 'Help us plan accordingly',
    foodNext: (f) => `Thank you — noted! 🙏`,
    vibeTitle: '✝️ Which part are you looking forward to?',
    vibeSub: 'We love to know!',
    vibeNext: (v) => `${v} — God bless you! 🕊️`,
    vibeOptions: [
      { label: 'Worship', emoji: '🎵' }, { label: 'Sermon', emoji: '📖' },
      { label: 'Fellowship', emoji: '🤝' }, { label: 'Prayer', emoji: '🙏' },
      { label: 'Choir', emoji: '🎶' }, { label: 'All of it!', emoji: '✝️' },
    ],
    finalTitle: (recipient) => `We are blessed to have you${recipient ? ', ' + recipient : ''}. 🕊️`,
    acceptLabel: 'RSVP — I\'ll be there 🙏',
    acceptedTitle: 'See you there! 🙏',
    acceptedSub: (creator) => creator ? `${creator} looks forward to seeing you!` : "God bless you — see you there!",
    acceptedEmojis: '✝️🙏🕊️',
    loadingEmoji: '🕊️',
    loadingText: 'Opening your invitation…',
  },
};

// Fallback to Date Night if eventType not found
const getConfig = (eventType) => EVENT_CONFIG[eventType] || EVENT_CONFIG['Date Night'];

// ─── Floating particles (theme-aware) ────────────────────────────────────────
function FloatingParticles({ config }) {
  const items = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    emoji: config.particleEmojis[i % config.particleEmojis.length],
    left: `${(i * 6.1 + Math.sin(i) * 3 + 2)}%`,
    delay: `${(i * 0.38) % 5}s`,
    duration: `${4 + (i % 3)}s`,
    size: `${14 + (i % 3) * 5}px`,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {items.map(h => (
        <span key={h.id} style={{
          position: 'absolute', left: h.left, bottom: '-40px',
          fontSize: h.size, opacity: 0.65,
          animation: `particleRise ${h.duration} ${h.delay} ease-in infinite`,
        }}>{h.emoji}</span>
      ))}
      <style>{`
        @keyframes particleRise {
          0%   { transform: translateY(0) rotate(-10deg); opacity: 0.65; }
          50%  { transform: translateY(-45vh) rotate(10deg); opacity: 0.85; }
          100% { transform: translateY(-100vh) rotate(-5deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Themed card wrapper ──────────────────────────────────────────────────────
function ThemedCard({ children, config, style }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 28,
      border: `3px solid ${config.cardBorder}`,
      boxShadow: `0 8px 40px ${config.cardShadow}`,
      padding: '28px 24px',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      maxWidth: 400,
      boxSizing: 'border-box',
      ...style,
    }}>
      {/* ripple texture */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05, pointerEvents: 'none' }}
        viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
        {[40,80,120,160,200,240,280].map((r, i) => (
          <ellipse key={i} cx="200" cy="300" rx={r} ry={r * 0.6}
            fill="none" stroke={config.rippleColor} strokeWidth="1.5" />
        ))}
      </svg>
      {children}
    </div>
  );
}

// ─── Confetti burst (theme-aware) ─────────────────────────────────────────────
function ConfettiBurst({ config }) {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: config.confettiColors[i % config.confettiColors.length],
    left: `${8 + (i * 3.1) % 84}%`,
    delay: `${(i * 0.06) % 0.8}s`,
    rotate: `${i * 37}deg`,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: '-10px', left: p.left,
          width: 10, height: 16, background: p.color, borderRadius: 2,
          animation: `confettiFall 1.5s ${p.delay} ease-in forwards`,
          transform: `rotate(${p.rotate})`,
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Themed button styles ─────────────────────────────────────────────────────
const makeStyles = (config) => ({
  question: {
    fontFamily: "'Nunito', system-ui, sans-serif",
    fontSize: 22, fontWeight: 900, color: '#333',
    margin: '0 0 4px', lineHeight: 1.3,
  },
  primaryBtn: {
    background: `linear-gradient(135deg, ${config.primary}, ${config.primaryDark})`,
    color: 'white', border: 'none', borderRadius: 50,
    padding: '14px 36px', fontSize: 17, fontWeight: 800,
    cursor: 'pointer', boxShadow: `0 4px 20px ${config.cardShadow}`,
    letterSpacing: 0.3, transition: 'transform 0.1s, box-shadow 0.1s',
    fontFamily: "'Nunito', system-ui, sans-serif",
  },
  noBtn: {
    background: 'rgba(200,200,200,0.2)', color: '#888',
    border: '2px solid #ddd', borderRadius: 50,
    padding: '12px 28px', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', userSelect: 'none',
    fontFamily: "'Nunito', system-ui, sans-serif",
  },
  calNavBtn: {
    background: 'none', border: 'none', fontSize: 22,
    color: config.primary, cursor: 'pointer',
    padding: '0 12px', fontWeight: 900,
  },
  detailRow: {
    margin: '6px 0', fontSize: 15, color: '#444',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  subText: { color: config.primaryDark, fontSize: 14, marginBottom: 12 },
  highlight: { color: config.primary, fontWeight: 700, fontSize: 14, marginBottom: 12 },
});

// ─── STEP 0: The Ask ──────────────────────────────────────────────────────────
function AskStep({ invitation, config, S, onYes }) {
  const noBtnRef = useRef(null);
  const [noPos, setNoPos] = useState({ x: null, y: null });
  const [noScale, setNoScale] = useState(1);
  const dodgeCount = useRef(0);

  const dodge = () => {
    dodgeCount.current += 1;
    const x = 32 + Math.random() * (window.innerWidth - 172);
    const y = 32 + Math.random() * (window.innerHeight - 92);
    setNoPos({ x, y });
    setNoScale(Math.max(0.4, 1 - dodgeCount.current * 0.08));
  };

  useEffect(() => {
    const onMove = (e) => {
      const btn = noBtnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const dist = Math.sqrt((e.clientX - r.left - r.width/2)**2 + (e.clientY - r.top - r.height/2)**2);
      if (dist < 130) dodge();
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      {invitation.coverImageUrl && (
        <img src={invitation.coverImageUrl} alt=""
          style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 16, display: 'block', margin: '0 auto 16px' }} />
      )}
      &nbsp;
      {!invitation.coverImageUrl && (
        <div style={{ fontSize: 72, marginBottom: 12 }}>{config.particleEmojis[0]}</div>
      )}
      &nbsp;
      <h2 style={S.question}>{config.askQuestion}</h2>
      {invitation.recipientName && (
        <p style={{ color: config.primary, fontWeight: 700, marginBottom: 8, fontSize: 15 }}>
          Hey {invitation.recipientName} 💌
        </p>
      )}
      {invitation.creatorName && (
        <p style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>from {invitation.creatorName}</p>
      )}
      <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={S.primaryBtn} onClick={onYes}>{config.yesLabel}</button>
        <button
          ref={noBtnRef}
          style={{
            ...S.noBtn,
            position: noPos.x !== null ? 'fixed' : 'relative',
            left: noPos.x !== null ? noPos.x : undefined,
            top: noPos.y !== null ? noPos.y : undefined,
            transform: `scale(${noScale})`,
            zIndex: noPos.x !== null ? 9999 : undefined,
            transition: 'left 0.15s cubic-bezier(.2,.9,.3,1), top 0.15s cubic-bezier(.2,.9,.3,1), transform 0.2s',
            opacity: noScale < 0.45 ? 0 : 1,
          }}
          onPointerEnter={dodge}
          onPointerDown={(e) => { e.preventDefault(); dodge(); }}
          onClick={(e) => { e.preventDefault(); dodge(); }}
        >{config.noLabel}</button>
      </div>
    </div>
  );
}

// ─── STEP 1: Yes reaction ─────────────────────────────────────────────────────
function YesReactionStep({ config, S, onNext }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, marginBottom: 8 }}>{config.particleEmojis[0]}</div>
      &nbsp;
      <h2 style={S.question}>{config.yesReactionTitle}</h2>
      &nbsp;
      <p style={{ ...S.subText, marginTop: 8 }}>{config.yesReactionSub}</p>
      <button style={{ ...S.primaryBtn, marginTop: 24 }} onClick={onNext}>{config.yesReactionNext}</button>
    </div>
  );
}

// ─── STEP 2: Calendar ─────────────────────────────────────────────────────────
function DateRevealStep({ invitation, config, S, onNext }) {
  const d = invitation.date ? new Date(invitation.date + 'T12:00:00') : null;
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const [viewMonth, setViewMonth] = useState(d ? d.getMonth() : new Date().getMonth());
  const [viewYear, setViewYear] = useState(d ? d.getFullYear() : new Date().getFullYear());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const isTarget = (day) => d && day === d.getDate() && viewMonth === d.getMonth() && viewYear === d.getFullYear();

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={S.question}>{config.dateTitle}</h2>
      <p style={S.subText}>{config.dateSub}</p>
      <div style={{ background: config.accentBg, borderRadius: 16, padding: '12px 8px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <button style={S.calNavBtn} onClick={() => viewMonth === 0 ? (setViewMonth(11), setViewYear(y=>y-1)) : setViewMonth(m=>m-1)}>‹</button>
          <span style={{ fontWeight: 800, color: config.primaryDark, fontSize: 15 }}>{monthNames[viewMonth]} {viewYear}</span>
          <button style={S.calNavBtn} onClick={() => viewMonth === 11 ? (setViewMonth(0), setViewYear(y=>y+1)) : setViewMonth(m=>m+1)}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
          {dayNames.map(d => <div key={d} style={{ fontSize: 10, color: config.primary, fontWeight: 700, textAlign: 'center', padding: '2px 0' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {cells.map((day, i) => (
            <div key={i} style={{
              aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: isTarget(day) ? 900 : 400, borderRadius: '50%',
              background: isTarget(day) ? config.primary : 'transparent',
              color: isTarget(day) ? 'white' : day ? '#333' : 'transparent',
              border: `2px solid ${isTarget(day) ? config.primary : 'transparent'}`,
            }}>{day || ''}</div>
          ))}
        </div>
      </div>
      {d && <p style={S.highlight}>🗓️ {monthNames[d.getMonth()]} {d.getDate()}, {d.getFullYear()}</p>}
      <button style={S.primaryBtn} onClick={onNext}>Got it! ✓</button>
    </div>
  );
}

// ─── STEP 3: Time drum ────────────────────────────────────────────────────────
function TimeRevealStep({ invitation, config, S, onNext }) {
  const parse = (t) => {
    if (!t) return { h: 6, m: 0, ampm: 'PM' };
    const [hh, mm] = t.split(':').map(Number);
    return { h: hh > 12 ? hh-12 : hh === 0 ? 12 : hh, m: mm, ampm: hh >= 12 ? 'PM' : 'AM' };
  };
  const { h, m, ampm } = parse(invitation.time);
  const hours = [h-2,h-1,h,h+1,h+2].map(v => ((v-1+12)%12)+1);
  const mins = [m-2,m-1,m,m+1,m+2].map(v => ((v%60)+60)%60);

  const drumCell = (val, center, isAmpm=false) => ({
    padding: isAmpm ? '10px 20px' : '10px 0',
    fontSize: val===center ? 26 : Math.abs(val-center)===1 ? 18 : 13,
    fontWeight: val===center ? 900 : 400,
    color: val===center ? config.primaryDark : '#bbb',
    textAlign: 'center', minWidth: isAmpm ? 'auto' : 48,
  });

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={S.question}>{config.timeTitle}</h2>
      <p style={S.subText}>{config.timeSub}</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:config.accentBg, borderRadius:20, padding:'12px 16px', marginBottom:20 }}>
        <div style={{ display:'flex', flexDirection:'column' }}>
          {hours.map((v,i) => <div key={i} style={drumCell(v,h)}>{String(v).padStart(2,'0')}</div>)}
        </div>
        <div style={{ fontSize:28, fontWeight:900, color:config.primary }}>:</div>
        <div style={{ display:'flex', flexDirection:'column' }}>
          {mins.map((v,i) => <div key={i} style={drumCell(v,m)}>{String(v).padStart(2,'0')}</div>)}
        </div>
        <div style={{ display:'flex', flexDirection:'column', marginLeft:8 }}>
          {['AM','PM'].map(val => <div key={val} style={drumCell(val,ampm,true)}>{val}</div>)}
        </div>
      </div>
      {invitation.time && <p style={S.highlight}>{config.timeConfirm(h, String(m).padStart(2,'0'), ampm)}</p>}
      <button style={S.primaryBtn} onClick={onNext}>Next ✓</button>
    </div>
  );
}

// ─── STEP 4: Food grid ────────────────────────────────────────────────────────
function FoodPickStep({ invitation, config, S, answers, setAnswer, onNext }) {
  const emojiMap = {
    'Burger':'🍔','Sushi':'🍣','Pasta':'🍝','Tacos':'🌮','Pizza':'🍕',
    'Steak':'🥩','Salad':'🥗','Ramen':'🍜','Cake':'🎂','Snacks':'🍿',
    'Braai':'🍖','Seafood':'🦞','Vegan':'🥦','Chicken':'🍗','Rice':'🍚',
    'Yes':'✅', 'No':'❌',
  };
  const foods = (invitation.foods || []).filter(Boolean);
  const items = foods.length > 0
    ? foods.map(f => ({ label: f, emoji: emojiMap[f] || '🍽️' }))
    : [{ label:'Burger',emoji:'🍔' },{ label:'Sushi',emoji:'🍣' },{ label:'Pasta',emoji:'🍝' },{ label:'Tacos',emoji:'🌮' },{ label:'Pizza',emoji:'🍕' }];

  const selected = answers.food;
  return (
    <div style={{ textAlign:'center' }}>
      <h2 style={{ ...S.question, color:config.primary }}>{config.foodTitle}</h2>
      <p style={S.subText}>{config.foodSub}</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {items.map(({ label, emoji }) => (
          <button key={label} onClick={() => setAnswer('food', label)} style={{
            background: selected===label ? config.primary : 'white',
            border: `2px solid ${selected===label ? config.primary : config.accentBorder}`,
            borderRadius:16, padding:'16px 8px', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap:6,
            transition:'all 0.15s',
            boxShadow: selected===label ? `0 4px 16px ${config.cardShadow}` : '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <span style={{ fontSize:32 }}>{emoji}</span>
            <span style={{ fontSize:12, fontWeight:700, color:selected===label?'white':config.primaryDark }}>{label}</span>
          </button>
        ))}
      </div>
      <button
        style={{ ...S.primaryBtn, opacity:selected?1:0.45 }}
        onClick={() => selected ? onNext() : toast.error('Pick one first!')}
      >{selected ? config.foodNext(selected) : 'Pick one first'}</button>
    </div>
  );
}

// ─── STEP 5: Vibe grid ────────────────────────────────────────────────────────
function VibePickStep({ config, S, answers, setAnswer, onNext }) {
  const selected = answers.vibe;
  return (
    <div style={{ textAlign:'center' }}>
      <h2 style={{ ...S.question, color:config.primary }}>{config.vibeTitle}</h2>
      <p style={S.subText}>{config.vibeSub}</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {config.vibeOptions.map(({ label, emoji }) => (
          <button key={label} onClick={() => setAnswer('vibe', label)} style={{
            background: selected===label ? config.primary : 'white',
            border: `2px solid ${selected===label ? config.primary : config.accentBorder}`,
            borderRadius:16, padding:'16px 8px', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap:6,
            transition:'all 0.15s',
            boxShadow: selected===label ? `0 4px 16px ${config.cardShadow}` : '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <span style={{ fontSize:32 }}>{emoji}</span>
            <span style={{ fontSize:12, fontWeight:700, color:selected===label?'white':config.primaryDark }}>{label}</span>
          </button>
        ))}
      </div>
      <button
        style={{ ...S.primaryBtn, opacity:selected?1:0.45 }}
        onClick={() => selected ? onNext() : toast.error('Pick one first!')}
      >{selected ? config.vibeNext(selected) : 'Pick one first'}</button>
    </div>
  );
}

// ─── STEP 6: Final reveal ─────────────────────────────────────────────────────
function FinalRevealStep({ invitation, config, S, answers, onAccept }) {
  const fmtDate = (d) => {
    if (!d) return null;
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
  };
  const fmtTime = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h-12 : h===0 ? 12 : h;
    return `${hr}:${String(m).padStart(2,'0')} ${ampm}`;
  };

  return (
    <div style={{ textAlign:'center' }}>
      {invitation.coverImageUrl
        ? <img src={invitation.coverImageUrl} alt="" style={{ width:160, height:160, objectFit:'cover', borderRadius:16, margin:'0 auto 16px', display:'block' }} />
        : <div style={{ fontSize:72, marginBottom:12 }}>{config.particleEmojis[0]}</div>
      }
      &nbsp;
      <h2 style={{ ...S.question, fontSize:20 }}>{config.finalTitle(invitation.recipientName)}</h2>
      {invitation.message && (
        <p style={{ color:'#555', fontSize:14, margin:'8px 0 14px', fontStyle:'italic' }}>"{invitation.message}"</p>
      )}
      <div style={{ background:config.accentBg, borderRadius:16, padding:16, margin:'0 0 20px', textAlign:'left', border:`1.5px solid ${config.accentBorder}` }}>
        {invitation.date   && <p style={S.detailRow}>🗓️ <strong>{fmtDate(invitation.date)}</strong></p>}
        {invitation.time   && <p style={S.detailRow}>⏰ <strong>{fmtTime(invitation.time)}</strong></p>}
        {invitation.location && <p style={S.detailRow}>📍 <strong>{invitation.location}</strong></p>}
        {answers.food      && <p style={S.detailRow}>🍽️ <strong>{answers.food}</strong></p>}
        {answers.vibe      && <p style={S.detailRow}>✨ <strong>{answers.vibe}</strong></p>}
      </div>
      <button style={S.primaryBtn} onClick={onAccept}>{config.acceptLabel}</button>
    </div>
  );
}

// ─── STEP 7: Accepted ─────────────────────────────────────────────────────────
function AcceptedScreen({ invitation, config, S }) {
  useEffect(() => {
    if (invitation?.successAction) {
      setTimeout(() => { try { executeSuccessAction(invitation.successAction); } catch {} }, 1500);
    }
  }, []);
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:80, marginBottom:8 }}>{config.acceptedEmojis.split('')[0] || '🎉'}</div>
      &nbsp;
      <h2 style={{ ...S.question, fontSize:26 }}>{config.acceptedTitle}</h2>
      <p style={{ ...S.subText, fontSize:16, marginTop:8 }}>{config.acceptedSub(invitation.creatorName)}</p>
      <div style={{ fontSize:36, marginTop:16, letterSpacing:4 }}>{config.acceptedEmojis}</div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function InteractiveInvite() {
  const { slug } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'invitations'), where('slug', '==', slug));
        const snap = await getDocs(q);
        if (snap.empty) { toast.error('Invitation not found'); setLoading(false); return; }
        const d = snap.docs[0];
        setInvitation({ id: d.id, ...d.data() });
      } catch { toast.error('Failed to load invitation'); }
      finally { setLoading(false); }
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!invitation?.id) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try { await updateInvitation(invitation.id, { draftResponse: answers }); } catch {}
    }, 1200);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [answers, invitation]);

  const setAnswer = (key, value) => setAnswers(a => ({ ...a, [key]: value }));
  const next = () => setStep(s => s + 1);

  const handleAccept = async () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2200);
    setStep(7);
    try {
      await submitResponse(invitation, 'accepted', answers);
      localStorage.setItem(`responded-${slug}`, 'true');
      await updateInvitation(invitation.id, { lastResponse: answers, lastUpdatedAt: new Date().toISOString() });
    } catch (err) { console.error(err); }
  };

  // Derive config AFTER invitation loads
  const config = invitation ? getConfig(invitation.eventType) : getConfig('Date Night');
  const S = makeStyles(config);

  if (loading) {
    const lc = getConfig('Date Night'); // generic while loading
    return (
      <div style={{ minHeight:'100vh', background:'#f8f4f0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:48 }}>💌</div>
          <p style={{ color:'#888', fontWeight:700, marginTop:12 }}>Opening your invitation…</p>
        </div>
      </div>
    );
  }

  if (!invitation) return (
    <div style={{ minHeight:'100vh', background:'#f8f4f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'#888', fontWeight:700 }}>Invitation not found</p>
    </div>
  );

  const TOTAL_STEPS = 8; // 0-7

  const stepComponents = [
    <AskStep         invitation={invitation} config={config} S={S} onYes={next} />,
    <YesReactionStep config={config} S={S} onNext={next} />,
    <DateRevealStep  invitation={invitation} config={config} S={S} onNext={next} />,
    <TimeRevealStep  invitation={invitation} config={config} S={S} onNext={next} />,
    <FoodPickStep    invitation={invitation} config={config} S={S} answers={answers} setAnswer={setAnswer} onNext={next} />,
    <VibePickStep    config={config} S={S} answers={answers} setAnswer={setAnswer} onNext={next} />,
    <FinalRevealStep invitation={invitation} config={config} S={S} answers={answers} onAccept={handleAccept} />,
    <AcceptedScreen  invitation={invitation} config={config} S={S} />,
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: config.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Nunito', system-ui, sans-serif",
      position: 'relative',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');`}</style>
      <FloatingParticles config={config} />
      {showConfetti && <ConfettiBurst config={config} />}

      {/* Progress dots */}
      {step < 7 && (
        <div style={{ display:'flex', gap:6, marginBottom:20, zIndex:1 }}>
          {Array.from({ length: 7 }, (_,i) => (
            <div key={i} style={{
              width: i===step ? 20 : 8, height:8, borderRadius:4,
              background: i===step ? config.primary : i<step ? config.cardBorder+'99' : config.accentBg,
              transition:'all 0.3s',
            }} />
          ))}
        </div>
      )}

      <ThemedCard config={config} style={{ zIndex:1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity:0, scale:0.96, y:12 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.96, y:-12 }}
            transition={{ duration:0.28, ease:'easeOut' }}
          >
            {stepComponents[step]}
          </motion.div>
        </AnimatePresence>
      </ThemedCard>

      {step > 0 && step < 7 && (
        <button onClick={() => setStep(s => s-1)} style={{
          marginTop:16, background:'none', border:'none',
          color: config.primary + '99', fontSize:14,
          cursor:'pointer', zIndex:1, fontFamily:'inherit',
        }}>← Back</button>
      )}
    </div>
  );
}