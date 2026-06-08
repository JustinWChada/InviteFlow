import { useEffect, useState, useRef } from "react";

import {
  collection,
  query,
  where,
  getDocs,
  increment,
  updateDoc,
  doc,
} from "firebase/firestore";

import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { themes } from "../themes/themes";
import toast from "react-hot-toast";
import { submitResponse } from "../services/responseService";
import { executeSuccessAction } from "../services/successActionService";
import ConfirmModal from "../components/ConfirmModal";

function InvitationView() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [invitation, setInvitation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");

  const noBtnRef = useRef(null);
  const buttonAreaRef = useRef(null);

  const [noPos, setNoPos] = useState({ left: null, top: null });
  const hoverTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const pointerMoveListenerRef = useRef(null);

  const moveNoButton = (options = { fixed: true }) => {
    // Move the NO button to a random position across the viewport (full screen dodge)
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    const padding = 24;
    const btnW = 120;
    const btnH = 48;

    const maxLeft = Math.max(0, vw - btnW - padding);
    const maxTop = Math.max(0, vh - btnH - padding);

    const left = Math.floor(Math.random() * (maxLeft || 1)) + padding / 2;
    const top = Math.floor(Math.random() * (maxTop || 1)) + padding / 2;

    setNoPos({ left, top, fixed: !!options.fixed });
  };

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const hideNoButton = () => {
    // hide button for 5s then restore to initial inline position
    setNoPos({ left: -9999, top: -9999, fixed: true, hidden: true });

    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setNoPos({ left: null, top: null });
    }, 5000);
  };

  useEffect(() => {
    // pointermove listener ensures the button keeps dodging if pointer gets close
    const onPointerMove = (e) => {
      try {
        const btn = noBtnRef.current;
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        // if pointer within 120px, move the button
        if (dist < 120) {
          moveNoButton({ fixed: true });
        }
      } catch (err) {
        // ignore
      }
    };

    pointerMoveListenerRef.current = onPointerMove;
    window.addEventListener("pointermove", onPointerMove);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      clearHoverTimer();
      clearHideTimer();
    };
  }, []);
  const handleResponse = async (responseType) => {
    const key = `responded-${slug}`;

    if (localStorage.getItem(key)) {
      toast.error("Already responded");

      return;
    }
    console.log("BUTTON CLICKED");

    try {
      console.log("Invitation:", invitation);
      console.log("Response Type:", responseType);

      await submitResponse(invitation, responseType);

      if (responseType === "accepted") {
        // reveal details for the respondent
        setShowDetails(true);

        setTimeout(() => {
          executeSuccessAction(invitation.successAction);
        }, 1000);
      }

      localStorage.setItem(key, true);
      console.log("Response saved");

      toast.success("Response submitted");
    } catch (error) {
      console.error("SUBMIT RESPONSE ERROR:", error);

      toast.error(error.message || "Failed to submit response");
    }
  };

  useEffect(() => {
    loadInvitation();
  }, []);

  const loadInvitation = async () => {
    try {
      const q = query(collection(db, "invitations"), where("slug", "==", slug));

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("Invitation not found");

        setLoading(false);

        return;
      }

      const document = snapshot.docs[0];

      const invitationData = {
        id: document.id,

        ...document.data(),
      };

      // If this invitation is interactive, redirect to the interactive flow page
      if (invitationData.invitationType === 'interactive' || invitationData.flow) {
        navigate(`/interactive/${slug}`);
        return;
      }

      setInvitation(invitationData);

      // if already responded (accepted), show details immediately
      const key = `responded-${slug}`;
      if (localStorage.getItem(key)) {
        setShowDetails(true);
      }

      await updateDoc(doc(db, "invitations", document.id), {
        views: increment(1),
      });
    } catch (error) {
      console.error(error);

      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="app-container">Loading invitation...</div>;
  }

  if (error) {
    return <div className="app-container">{error}</div>;
  }

  const currentTheme = themes[invitation.theme];

  return (
    <div className="invite-wrapper" style={{ background: currentTheme.secondary }}>
      <div className="app-container">
        <div className="card" style={{ maxWidth: 900, margin: "0 auto", overflow: "hidden" }}>
          <img src={invitation.coverImageUrl || currentTheme.coverImage} alt="" className="card-image" />

          <div style={{ padding: 20 }}>
            <h1>
              {currentTheme.icon} {invitation.eventType}
            </h1>

            <h2>Dear {invitation.recipientName}</h2>

            <p>{invitation.message}</p>

            {!showDetails && (
              <>
                <hr />
                <p className="muted">Please respond to view details (date, time, location, food preference).</p>
              </>
            )}

            {showDetails && (
              <>
                <hr />

                <p>📅 {invitation.date}</p>

                <p>⏰ {invitation.time}</p>

                <p>📍 {invitation.location}</p>

                <p>🍽️ {invitation.food || 'No preference provided'}</p>

                <hr />
              </>
            )}

            {invitation.questions && invitation.questions.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3>Questions</h3>

                {invitation.questions.map((q, idx) => (
                  <div key={idx} style={{ marginBottom: 8 }}>
                    <label className="muted" style={{ display: "block", fontWeight: 600 }}>{q.question}</label>
                    {q.options && q.options.length > 0 ? (
                      <select id={`q-${idx}`} className="input-full">
                        <option value="">Select...</option>
                        {q.options.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input id={`q-${idx}`} type="text" placeholder="Answer" className="input-full" />
                    )}
                  </div>
                ))}

                <button className="btn" onClick={async () => {
                  const answers = invitation.questions.map((q, i) => {
                    const el = document.getElementById(`q-${i}`);
                    return { question: q.question, answer: el?.value || null };
                  });

                  try {
                    await submitResponse(invitation, "answered", answers);
                    toast.success("Answers submitted");
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to submit answers");
                  }
                }}>Submit Answers</button>
              </div>
            )}

            <div ref={buttonAreaRef} style={{ position: "relative", minHeight: 120 }}>
              <button className="btn" onClick={() => setShowConfirm(true)} style={{ marginRight: 20 }}>YES ❤️</button>

              <button
                ref={noBtnRef}
                className="btn btn-outline"
                onPointerEnter={() => {
                  clearHoverTimer();
                  hoverTimerRef.current = setTimeout(() => {
                    hideNoButton();
                  }, 1000);

                  moveNoButton({ fixed: true });
                }}
                onPointerLeave={() => {
                  clearHoverTimer();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  moveNoButton({ fixed: true });
                }}
                onFocus={() => moveNoButton({ fixed: true })}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  moveNoButton({ fixed: true });
                }}
                style={{
                  position: noPos.left !== null ? "fixed" : "relative",
                  left: noPos.left !== null ? noPos.left : undefined,
                  top: noPos.top !== null ? noPos.top : undefined,
                  zIndex: noPos.left !== null ? 1100 : undefined,
                  transition: "left 0.18s cubic-bezier(.2,.9,.3,1), top 0.18s cubic-bezier(.2,.9,.3,1)",
                  opacity: noPos.hidden ? 0 : 1,
                }}
              >
                NO 💔
              </button>
            </div>

            <ConfirmModal
              open={showConfirm}
              title="Reveal details?"
              message="By revealing the event details, you confirm you want to RSVP. The host will be notified."
              confirmText="Show details & RSVP"
              cancelText="Cancel"
              onConfirm={async () => {
                setShowConfirm(false);
                await handleResponse('accepted');
              }}
              onCancel={() => setShowConfirm(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvitationView;
