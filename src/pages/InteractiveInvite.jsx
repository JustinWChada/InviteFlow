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
    { type: 'date' },
    { type: 'time' },
    { type: 'location' },
    { type: 'foods' },
    { type: 'message' },
    { type: 'finalReveal' },
  ];

  const getThemeForEventType = (eventType) => {
    switch (eventType) {
      case 'Date Night':
        return 'romantic';
      case 'Proposal':
        return 'proposal';
      case 'Birthday':
        return 'birthday';
      case 'Wedding':
        return 'wedding';
      default:
        return 'romantic';
    }
  };

  const currentTheme = themes[getThemeForEventType(invitation.eventType || invitation.theme)];

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
      case 'date':
        return (
          <div>
            <h2>Date</h2>
            <p style={{ marginTop: 12 }}>{invitation.date || 'Date not set'}</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={next}>Reveal Time</button>
            </div>
          </div>
        );

      case 'time':
        return (
          <div>
            <h2>Time</h2>
            <p style={{ marginTop: 12 }}>{invitation.time || 'Time not set'}</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={next}>Reveal Location</button>
            </div>
          </div>
        );

      case 'location':
        return (
          <div>
            <h2>Location</h2>
            <p style={{ marginTop: 12 }}>{invitation.location || 'Location not set'}</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={next}>Reveal Food</button>
            </div>
          </div>
        );

      case 'foods':
        return (
          <div>
            <h2>Food</h2>
            <div style={{ marginTop: 12 }}>
              {(invitation.foods || invitation.food || []).length ? (
                <ul>
                  {(invitation.foods || (invitation.food ? [invitation.food] : [])).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              ) : (
                <p>No food preferences listed</p>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={next}>Reveal Message</button>
            </div>
          </div>
        );

      case 'message':
        return (
          <div>
            <h2>Message</h2>
            <p style={{ marginTop: 12 }}>{invitation.message || ''}</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={next}>Reveal & RSVP</button>
            </div>
          </div>
        );

      case 'finalReveal':
        return (
          <div>
            <h2>Full details</h2>
            <div style={{ marginTop: 12 }}>
              <p>📅 {invitation.date || 'Date'}</p>
              <p>⏰ {invitation.time || 'Time'}</p>
              <p>📍 {invitation.location || 'Location'}</p>
              <p>🍽️ {(invitation.foods || (invitation.food ? [invitation.food] : [])).join(', ') || 'Food'}</p>
              <p style={{ marginTop: 8 }}>{invitation.message || ''}</p>
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
