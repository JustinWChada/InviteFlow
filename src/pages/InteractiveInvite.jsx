import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateInvitation } from '../services/invitationService';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';
import { submitResponse } from '../services/responseService';
import ConfirmModal from '../components/ConfirmModal';
import { themes } from '../themes/themes';

export default function InteractiveInvite() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'invitations'), where('slug', '==', slug));
        const snap = await getDocs(q);
        if (snap.empty) {
          toast.error('Invitation not found');
          setLoading(false);
          return;
        }
        const doc = snap.docs[0];
        setInvitation({ id: doc.id, ...doc.data() });
      } catch (err) {
        console.error(err);
        toast.error('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  if (loading) return <div className="app-container">Loading...</div>;
  if (!invitation) return <div className="app-container">Invitation not found</div>;

  const flow = invitation.flow || [
    { type: 'question' },
    { type: 'datePicker' },
    { type: 'timePicker' },
    { type: 'moodSelector' },
    { type: 'activitySelector' },
    { type: 'finalReveal' },
  ];

  const currentTheme = themes[invitation.theme];

  const next = () => setStep((s) => Math.min(flow.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const setAnswer = (key, value) => setAnswers((a) => ({ ...a, [key]: value }));

  const onConfirmAccept = async () => {
    try {
      await submitResponse(invitation, 'accepted', answers);
      localStorage.setItem(`responded-${slug}`, true);
      toast.success('Thanks — RSVP confirmed');
      // show final reveal (advance to finalReveal if not already)
      const finalIndex = flow.findIndex((f) => f.type === 'finalReveal');
      if (finalIndex >= 0) setStep(finalIndex);
      // persist the chosen answers into the invitation document for host visibility
      try {
        await updateInvitation(invitation.id, { lastResponse: answers, lastUpdatedAt: new Date().toISOString() });
      } catch (err) {
        console.warn('Failed to persist lastResponse on invitation', err);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit response');
    }
  };

  // autosave draft answers as the user progresses (debounced)
  useEffect(() => {
    if (!invitation || !invitation.id) return;

    // clear previous timer
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateInvitation(invitation.id, { draftResponse: answers });
      } catch (err) {
        // non-fatal
        console.warn('Failed to autosave draftResponse', err);
      }
    }, 1000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [answers, invitation]);

  const renderStep = () => {
    const node = flow[step];
    if (!node) return null;

    switch (node.type) {
      case 'question':
        return (
          <div>
            <h2>Will you go on a date with me?</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={() => setShowConfirm(true)}>Yes</button>
              <button className="btn btn-outline" onClick={() => {
                submitResponse(invitation, 'declined');
                toast('Maybe next time');
              }}>No</button>
            </div>
          </div>
        );

      case 'datePicker':
        return (
          <div>
            <h2>When are you free?</h2>
            <label>Date</label>
            <input type="date" value={answers.date || ''} onChange={(e) => setAnswer('date', e.target.value)} />
            <label>Time</label>
            <input type="time" value={answers.time || ''} onChange={(e) => setAnswer('time', e.target.value)} />
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={next}>Select Date</button>
            </div>
          </div>
        );

      case 'timePicker':
        return (
          <div>
            <h2>Pick a time</h2>
            <input type="time" value={answers.time || ''} onChange={(e) => setAnswer('time', e.target.value)} />
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={next}>Next</button>
            </div>
          </div>
        );

      case 'moodSelector':
        return (
          <div>
            <h2>What are we feelin'?</h2>
            <div className="row" style={{ marginTop: 12 }}>
              {['Food', 'Burgers', 'Movies', 'Activities'].map((m) => (
                <button
                  key={m}
                  className={answers.mood === m ? 'btn selected' : 'btn btn-outline'}
                  aria-pressed={answers.mood === m}
                  onClick={() => setAnswer('mood', m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={next}>Sounds Good</button>
            </div>
          </div>
        );

      case 'activitySelector':
        return (
          <div>
            <h2>What's your vibe?</h2>
            <div className="row" style={{ marginTop: 12 }}>
              {['Coffee', 'Walking', 'Food', 'Shopping', 'Entertainment'].map((a) => (
                <button
                  key={a}
                  className={answers.activity === a ? 'btn selected' : 'btn btn-outline'}
                  aria-pressed={answers.activity === a}
                  onClick={() => setAnswer('activity', a)}
                >
                  {a}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={next}>Sounds Like A Plan</button>
            </div>
          </div>
        );

      case 'finalReveal':
        return (
          <div>
            <h2>I got you ❤️</h2>
            <p>Be ready for...</p>
            <div style={{ marginTop: 12 }}>
              <p>📅 {answers.date || invitation.date || 'Date'}</p>
              <p>⏰ {answers.time || invitation.time || 'Time'}</p>
              <p>🎯 {answers.activity || invitation.activity || 'Activity'}</p>
              <p>💭 {answers.mood || invitation.mood || 'Mood'}</p>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setShowConfirm(true)}>Accept</button>
              <button className="btn btn-outline" onClick={() => { submitResponse(invitation, 'declined'); toast('Maybe next time'); }}>Decline</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="invite-wrapper" style={{ background: currentTheme.secondary }}>
      <div className="app-container">
        <div className="card interactive-card" style={{ maxWidth: 720, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
          {/* decorative hearts */}
          <div className="interactive-hearts" aria-hidden>
            <span className="heart">❤️</span>
            <span className="heart">💖</span>
            <span className="heart">💕</span>
          </div>

          <div style={{ padding: 20 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.32 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
              {step > 0 ? <button className="btn btn-outline" onClick={prev}>Back</button> : <div />}
              {step < flow.length - 1 && <div style={{ marginLeft: 'auto' }}><button className="btn btn-outline" onClick={() => setStep(flow.length - 1)}>Skip to Reveal</button></div>}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Reveal details & RSVP"
        message="Confirm revealing the full details and RSVP to this invitation."
        confirmText="Reveal & RSVP"
        cancelText="Cancel"
        onConfirm={async () => { setShowConfirm(false); await onConfirmAccept(); }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
