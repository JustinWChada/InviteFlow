import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { themes, eventTypes } from "../themes/themes";
import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js'
import { createInvitation } from "../services/invitationService";
import { uploadCoverImage } from "../services/storageService";
import ImageUploader from "../components/ImageUploader";
import { useAuth } from "../contexts/AuthContext";

function CreateInvitation() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  const [shareUrl, setShareUrl] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    recipientName: "",
    creatorName: "",
    eventType: "Date Night",
    date: "",
    time: "",
    location: "",

    message: "",
    foods: [""],

    coverImageSource: "default",

    // invitations are always interactive (progressive reveal)
    invitationType: "interactive",
    flow: null,

    successAction: {
      type: "whatsapp",

      config: {
        phone: "",
        message: "",
      },
    },
  });

  const getMinDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const minDate = getMinDate();

  const defaultMessages = {
    "Date Night": "Hey! I'd love for you to join me for a cozy date night — dinner and a movie. Let me know if you can make it!",
    Proposal: "I have something special planned and would love for you to be there — will you join me?",
    Birthday: "You're invited to my birthday celebration! Food, music and good vibes — hope to see you there.",
    Wedding: "We'd be honored to have you celebrate our wedding with us — please save the date and join the festivities!",
    Graduation: "Come celebrate my graduation — your presence would mean a lot!",
    Party: "Join us for a fun get-together — bring your energy and a smile!",
    "Church Event": "Please join our church event for fellowship and community — all are welcome.",
  };

  const countryCodes = [
    { code: "+263", name: "Zimbabwe (+263)" },
    { code: "+27", name: "South Africa (+27)" },
    { code: "+1", name: "USA (+1)" },
    { code: "+44", name: "UK (+44)" },  
  ];

  const defaultSuccessMessages = {
    whatsapp: "Thanks for RSVPing — we'll send you details shortly via WhatsApp.",
    instagram: "Thanks! We'll DM you on Instagram with more info.",
    secret_message: "Here's a little secret just for you: you're invited! Reply when you can.",
    secret_location: "Thanks — we'll share the exact location shortly.",
  };

  const [messageTouched, setMessageTouched] = useState(false);

  const currentTheme = themes[getThemeForEventType(formData.eventType)];

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  const updateSuccessAction = (type) => {
    setFormData((prev) => ({
      ...prev,
      successAction: {
        type,
        config: {},
      },
    }));
  };

  const updateSuccessConfig = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      successAction: {
        ...prev.successAction,
        config: {
          ...prev.successAction.config,
          [field]: value,
        },
      },
    }));
  };

  const normalizePhone = (countryCode, raw) => {
    if (!raw) return "";
    try {
      // try to parse with libphonenumber-js
      const cc = (countryCode || "+263").replace("+", "");
      // If raw already has +, parse directly
      if (String(raw).trim().startsWith("+")) {
        const pn = parsePhoneNumberFromString(String(raw));
        return pn ? pn.formatInternational() : String(raw).replace(/[\s\-()]/g, "");
      }

      // Otherwise try with country calling code
      const asYouType = new AsYouType();
      asYouType.input(raw);
      const possible = parsePhoneNumberFromString(asYouType.getNumberValue ? asYouType.getNumberValue() : asYouType.getNumber());
      if (possible) return possible.formatInternational();

      // fallback: strip spaces and leading zeros and prefix country code
      let s = String(raw).replace(/[\s\-()]/g, "");
      s = s.replace(/^0+/, "");
      if (countryCode && countryCode.startsWith("+")) return `${countryCode}${s}`;
      return s;
    } catch (err) {
      let s = String(raw).replace(/[\s\-()]/g, "");
      s = s.replace(/^0+/, "");
      if (countryCode && countryCode.startsWith("+")) return `${countryCode}${s}`;
      return s;
    }
  };

  // When the success action type changes, prefill the config.message if empty
  useEffect(() => {
    const type = formData.successAction?.type;

    if (!type) return;

    const currentMsg = formData.successAction?.config?.message;

    if (!currentMsg) {
      const dm = defaultSuccessMessages[type] || "";

      setFormData((prev) => ({
        ...prev,
        successAction: {
          ...prev.successAction,
          config: {
            ...prev.successAction.config,
            message: dm,
          },
        },
      }));
    }
  }, [formData.successAction?.type]);

  // Interactive questions removed — invitations are progressive reveals of core details.

  // Prefill invitation message when event type changes, unless user edited it
  useEffect(() => {
    if (messageTouched) return;

    const dm = defaultMessages[formData.eventType] || "";

    setFormData((prev) => ({ ...prev, message: dm }));
  }, [formData.eventType, messageTouched]);

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

  const handleCreateInvitation = async () => {
    // image state is managed at component scope: `selectedImage`, `imagePreview`
    try {
      if (selectedImage && !user) {
        toast.error("You must be signed in to upload a cover image");
        return;
      }
      if (!formData.recipientName) {
        toast.error("Recipient name is required");
        return;
      }

      if (!formData.message) {
        toast.error("Invitation message is required");
        return;
      }

      // Date cannot be before today
      if (formData.date) {
        if (formData.date < minDate) {
          toast.error("Date cannot be before today");
          return;
        }
      }

      let coverImageUrl = "";

      if (selectedImage) {
        // uploadCoverImage now returns a promise that resolves to the download URL.
        // We don't have a built-in onProgress hook here (storageService logs progress),
        // but we can show a simple spinner / indicator by setting uploadProgress to 1 (indeterminate)
        setUploadProgress(1);

        coverImageUrl = await uploadCoverImage(selectedImage);

        setUploadProgress(100);
      }

      const payload = {
        ...formData,
        coverImageUrl,
      };

      // Always use interactive progressive reveal flow
      payload.invitationType = 'interactive';
      payload.flow = formData.flow || [
        { type: 'date' },
        { type: 'time' },
        { type: 'location' },
        { type: 'foods' },
        { type: 'message' },
        { type: 'finalReveal' },
      ];

      // map foods array into storage-friendly field
      payload.foods = formData.foods || [];

      setLoading(true);

      // const slug = await createInvitation(formData);
      const slug = await createInvitation(payload, user || null);

      const url = `${window.location.origin}/invite/${slug}`;

      setShareUrl(url);

      toast.success("Invitation created successfully!");
    } catch (error) {
      console.error(error);

      toast.error("Failed to create invitation");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);

      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="app-container">
      <h1>Create Invitation</h1>

      <div className="two-column">
        {/* LEFT SIDE */}

        <div className="card">
          <h2>Invitation Details</h2>
          
          <label htmlFor="coverImage" className="muted" style={{ display: 'block', marginTop: 8 }}>Cover image (optional)</label>

          <ImageUploader
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            disabled={!user}
            showLabel={false}
          />

          {uploadProgress > 0 && uploadProgress < 100 && (
            <p>Uploading image...</p>
          )}

          <label htmlFor="creatorName">Your Name</label>
          <input
            id="creatorName"
            type="text"
            placeholder="Your Name"
            value={formData.creatorName}
            onChange={(e) => updateField("creatorName", e.target.value)}
          />

          <br />
          <br />

          <label htmlFor="recipientName">Recipient Name</label>
          <input
            id="recipientName"
            type="text"
            placeholder="Recipient Name"
            value={formData.recipientName}
            onChange={(e) => updateField("recipientName", e.target.value)}
          />

          <br />
          <br />

          <label htmlFor="eventType">Event Type</label>
          <select
            id="eventType"
            value={formData.eventType}
            onChange={(e) => updateField("eventType", e.target.value)}
          >
            {eventTypes.map((event) => (
              <option key={event}>{event}</option>
            ))}
          </select>

          <br />
          <br />

          {/* Theme is derived from the selected event type; invitation is always interactive */}

          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={formData.date}
            min={minDate}
            onChange={(e) => updateField("date", e.target.value)}
          />

          <br />
          <br />

          <label htmlFor="time">Time</label>
          <input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => updateField("time", e.target.value)}
          />

          <br />
          <br />

          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            placeholder="Location"
            value={formData.location}
            onChange={(e) => updateField("location", e.target.value)}
          />

          <br />
          <br />

          <label>Preferred Food (one per field)</label>
          {(formData.foods || []).map((f, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                placeholder={`Food item ${idx + 1}`}
                value={f}
                onChange={(e) => {
                  const next = [...(formData.foods || [])];
                  next[idx] = e.target.value;
                  updateField('foods', next);
                }}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-outline" onClick={() => {
                const next = [...(formData.foods || [])];
                next.splice(idx, 1);
                updateField('foods', next.length ? next : ['']);
              }}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn btn-outline" onClick={() => updateField('foods', [...(formData.foods || []), ''])}>Add food</button>

          <br />
          <br />

          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            rows={5}
            placeholder="Message"
            value={formData.message}
            onChange={(e) => {
              setMessageTouched(true);
              updateField("message", e.target.value);
            }}
          />
          <div style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-outline" onClick={() => updateField('message', defaultMessages[formData.eventType] || '')}>Use default</button>
          </div>

          <hr />

          <h2>Success Action</h2>

          <select
            value={formData.successAction.type}
            onChange={(e) => updateSuccessAction(e.target.value)}
          >
            <option value="whatsapp">WhatsApp</option>

            <option value="instagram">Instagram</option>

            <option value="secret_message">Secret Message</option>

            <option value="secret_location">Secret Location</option>
          </select>

          <br />
          <br />

          {formData.successAction.type === "whatsapp" && (
            <>
              <label htmlFor="wa-country">Country</label>
              <select
                id="wa-country"
                value={formData.successAction?.config?.countryCode || "+263"}
                onChange={(e) => updateSuccessConfig("countryCode", e.target.value)}
              >
                {countryCodes.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>

              <label htmlFor="wa-phone">Phone Number</label>
              <input
                id="wa-phone"
                type="text"
                placeholder="Phone Number"
                onChange={(e) => updateSuccessConfig("phone", e.target.value)}
                onBlur={() => {
                  const cc = formData.successAction?.config?.countryCode || "+263";
                  const raw = formData.successAction?.config?.phone || "";
                  const norm = normalizePhone(cc, raw);
                  updateSuccessConfig("phone", norm);
                }}
                value={formData.successAction?.config?.phone || ""}
              />

              <br />
              <br />

              <textarea
                rows={4}
                placeholder="WhatsApp Message"
                value={formData.successAction?.config?.message || ""}
                onChange={(e) => updateSuccessConfig("message", e.target.value)}
              />
              <div style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => updateSuccessConfig('message', defaultSuccessMessages.whatsapp)}>Use default</button>
              </div>
            </>
          )}

          {formData.successAction.type === "instagram" && (
            <>
              <input
                type="text"
                placeholder="Instagram Username"
                value={formData.successAction?.config?.username || ""}
                onChange={(e) => updateSuccessConfig("username", e.target.value)}
              />

              <br />
              <br />

              <textarea
                rows={3}
                placeholder="Instagram DM message"
                value={formData.successAction?.config?.message || ""}
                onChange={(e) => updateSuccessConfig("message", e.target.value)}
              />
            </>
          )}

          {formData.successAction.type === "secret_message" && (
            <textarea
              rows={4}
              placeholder="Secret Message"
              value={formData.successAction?.config?.message || ""}
              onChange={(e) => updateSuccessConfig("message", e.target.value)}
            />
          )}

          {formData.successAction.type === "secret_location" && (
            <>
              <input
                type="text"
                placeholder="Location Name"
                value={formData.successAction?.config?.name || ""}
                onChange={(e) => updateSuccessConfig("name", e.target.value)}
              />

              <br />
              <br />

              <input
                type="text"
                placeholder="Google Maps URL"
                value={formData.successAction?.config?.mapLink || ""}
                onChange={(e) => updateSuccessConfig("mapLink", e.target.value)}
              />
              <br />
              <br />
              <textarea
                rows={3}
                placeholder="Message to send after RSVP"
                value={formData.successAction?.config?.message || ""}
                onChange={(e) => updateSuccessConfig("message", e.target.value)}
              />
            </>
          )}

          <br />
          <br />

          {/* Interactive questions removed — invitation will progressively reveal core details */}


          <button onClick={handleCreateInvitation} disabled={loading} className="btn">{loading ? "Creating..." : "Create Invitation"}</button>

          {shareUrl && (
            <div
              style={{
                marginTop: "20px",
              }}
            >
              <h3>Invitation Link</h3>

              <input
                value={shareUrl}
                readOnly
                style={{
                  width: "100%",
                }}
              />

              <br />
              <br />

              <button onClick={copyLink}>Copy Link</button>

              <button
                onClick={() =>
                  navigate(shareUrl.replace(window.location.origin, ""))
                }
              >
                Preview
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}

        <div>
          <h2>Live Preview</h2>

          <div className="card preview-card" style={{ border: `3px solid ${currentTheme.primary}`, background: currentTheme.secondary }}>
            <img src={imagePreview || currentTheme.coverImage} alt="" className="preview-image" />

            <div style={{ padding: 20 }}>
              <h2>{currentTheme.icon} {formData.eventType}</h2>

              <h3>For {formData.recipientName || 'Someone Special'}</h3>

              <p>{formData.message}</p>

              <hr />

              <p>📅 {formData.date || 'Date'}</p>

              <p>⏰ {formData.time || 'Time'}</p>

              <p>📍 {formData.location || 'Location'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateInvitation;
