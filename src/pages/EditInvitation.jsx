import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { themes, eventTypes } from "../themes/themes";
import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';
import { getInvitationBySlug, updateInvitation } from "../services/invitationService";
import { uploadCoverImage } from "../services/storageService";
import ImageUploader from "../components/ImageUploader";
import { useAuth } from "../contexts/AuthContext";

function EditInvitation() {
  const { slug } = useParams();

  const navigate = useNavigate();

  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [formData, setFormData] = useState(null);
  const [showEditSuccessMessage, setShowEditSuccessMessage] = useState(false);

  const countryCodes = [
    { code: "+263", name: "Zimbabwe (+263)" },
    { code: "+27", name: "South Africa (+27)" },
    { code: "+1", name: "USA (+1)" },
    { code: "+44", name: "UK (+44)" },
  ];

  const normalizePhone = (countryCode, raw) => {
    if (!raw) return "";
    try {
      const cc = (countryCode || "+263").replace("+", "");

      if (String(raw).trim().startsWith("+")) {
        const pn = parsePhoneNumberFromString(String(raw));
        return pn ? pn.formatInternational() : String(raw).replace(/[\s\-()]/g, "");
      }

      const asYouType = new AsYouType();
      asYouType.input(raw);
      const possible = parsePhoneNumberFromString(asYouType.getNumberValue ? asYouType.getNumberValue() : asYouType.getNumber());
      if (possible) return possible.formatInternational();

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

  const getMinDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const minDate = getMinDate();

  useEffect(() => {
    const load = async () => {
      try {
        const inv = await getInvitationBySlug(slug);

        if (!inv) {
          toast.error("Invitation not found");
          navigate("/");
          return;
        }

        setFormData({
          recipientName: inv.recipientName || "",
          creatorName: inv.creatorName || "",
          eventType: inv.eventType || "Date Night",
          theme: inv.theme || "romantic",
          date: inv.date || "",
          time: inv.time || "",
          location: inv.location || "",
          message: inv.message || "",
          coverImageUrl: inv.coverImageUrl || "",
          foods: inv.foods || (inv.food ? [inv.food] : ['']),
          successAction: inv.successAction || { type: "whatsapp", config: {} },
          id: inv.id,
          slug: inv.slug,
        });

        setImagePreview(inv.coverImageUrl || "");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load invitation");
      }
    };

    load();
  }, [slug, navigate]);

  if (!formData) return <div style={{ padding: 40 }}>Loading...</div>;

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSuccessActionEdit = (type) => {
    if (type === 'secret_message' || type === 'secret_location') {
      const kind = type === 'secret_message' ? 'message' : 'location';
      setFormData((prev) => ({
        ...prev,
        successAction: {
          type: 'whatsapp',
          config: {
            countryCode: prev.successAction?.config?.countryCode || '+263',
            phone: prev.successAction?.config?.phone || '',
            secret: true,
            secretKind: kind,
          },
        },
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, successAction: { type, config: {} } }));
    setShowEditSuccessMessage(false);
  };

  const updateSuccessConfigEdit = (field, value) => {
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

  const handleSave = async () => {
    try {
      setLoading(true);

      let coverImageUrl = formData.coverImageUrl || "";

      if (selectedImage) {
        if (!user) {
          toast.error("You must be signed in to upload a cover image");
          return;
        }

        coverImageUrl = await uploadCoverImage(selectedImage);
      }

      // Validate date
      if (formData.date && formData.date < minDate) {
        toast.error("Date cannot be before today");
        setLoading(false);
        return;
      }

      const payload = {
        recipientName: formData.recipientName,
        creatorName: formData.creatorName,
        eventType: formData.eventType,
        theme: formData.theme,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        foods: formData.foods || [],
        message: formData.message,
        coverImageUrl,
        // questions removed; progressive reveal uses core fields
        successAction: formData.successAction || {},
      };

      await updateInvitation(formData.id, payload);

      toast.success("Invitation updated");

      navigate(`/invite/${formData.slug}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update invitation");
    } finally {
      setLoading(false);
    }
  };

  // Interactive questions removed

  return (
    <div className="app-container">
      <h1>Edit Invitation</h1>

      <div className="card">
        <ImageUploader selectedImage={selectedImage} setSelectedImage={setSelectedImage} imagePreview={imagePreview} setImagePreview={setImagePreview} disabled={!user} showLabel={false} />

        <label htmlFor="edit-cover" className="muted" style={{ marginTop: 8, display: 'block' }}>Cover image (optional)</label>

        <label htmlFor="edit-creator">Your Name</label>
        <input id="edit-creator" type="text" placeholder="Your Name" value={formData.creatorName} onChange={(e) => updateField("creatorName", e.target.value)} />

        <br />
        <br />

        <label htmlFor="edit-recipient">Recipient Name</label>
        <input id="edit-recipient" type="text" placeholder="Recipient Name" value={formData.recipientName} onChange={(e) => updateField("recipientName", e.target.value)} />

        <br />
        <br />

        <label htmlFor="edit-event">Event Type</label>
        <select id="edit-event" value={formData.eventType} onChange={(e) => updateField("eventType", e.target.value)}>
          {eventTypes.map((event) => (
            <option key={event}>{event}</option>
          ))}
        </select>

        <br />
        <br />

        {/* Theme is derived from event type; editing theme directly removed to simplify form */}

        <label htmlFor="edit-date">Date</label>
        <input id="edit-date" type="date" min={minDate} value={formData.date} onChange={(e) => updateField("date", e.target.value)} />

        <br />
        <br />

        <label htmlFor="edit-time">Time</label>
        <input id="edit-time" type="time" value={formData.time} onChange={(e) => updateField("time", e.target.value)} />

        <br />
        <br />

        <label htmlFor="edit-location">Location</label>
        <input id="edit-location" type="text" placeholder="Location" value={formData.location} onChange={(e) => updateField("location", e.target.value)} />

        <br />
        <br />

        <label htmlFor="edit-message">Message</label>
        <textarea id="edit-message" rows={5} placeholder="Message" value={formData.message} onChange={(e) => updateField("message", e.target.value)} />

        <br />
        <br />

        <label>Preferred Food (one per field)</label>
        {(formData.foods || []).map((f, idx) => (
          <div key={idx} className="input-row" style={{ marginBottom: 8 }}>
            <input type="text" placeholder={`Food item ${idx + 1}`} value={f} onChange={(e) => {
              const next = [...(formData.foods || [])];
              next[idx] = e.target.value;
              updateField('foods', next);
            }} />
            <button className="btn btn-outline" onClick={() => {
              const next = [...(formData.foods || [])];
              next.splice(idx, 1);
              updateField('foods', next.length ? next : ['']);
            }}>Remove</button>
          </div>
        ))}
        <button className="btn btn-outline" onClick={() => updateField('foods', [...(formData.foods || []), ''])}>Add food</button>

        <hr />

        <h2>Success Action</h2>

        <label htmlFor="edit-success-type">Type</label>
        <select id="edit-success-type" value={formData.successAction?.config?.secret ? (formData.successAction?.config?.secretKind === 'location' ? 'secret_location' : 'secret_message') : (formData.successAction?.type || 'whatsapp')} onChange={(e) => updateSuccessActionEdit(e.target.value)}>
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram">Instagram</option>
          <option value="secret_message">Secret Message</option>
          <option value="secret_location">Secret Location</option>
        </select>

        {formData.successAction?.type === 'whatsapp' && (
          <>
            {(() => {
              const cfg = formData.successAction?.config || {};
              const isSecret = !!cfg.secret;

              return (
                <>
                  <label htmlFor="edit-wa-country">Country</label>
                  <select id="edit-wa-country" value={cfg.countryCode || '+263'} onChange={(e) => updateSuccessConfigEdit('countryCode', e.target.value)}>
                    {countryCodes.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>

                  <label htmlFor="edit-wa-phone">Phone</label>
                  <input id="edit-wa-phone" type="text" placeholder="Phone Number" value={cfg.phone || ''} onChange={(e) => updateSuccessConfigEdit('phone', e.target.value)} onBlur={() => {
                    const cc = cfg.countryCode || '+263';
                    const raw = cfg.phone || '';
                    const norm = normalizePhone(cc, raw);
                    updateSuccessConfigEdit('phone', norm);
                  }} />

                  <br />
                  <br />

                  {isSecret && cfg.secretKind === 'message' && (
                    <>
                      <label>Secret Message (sent to host)</label>
                      <textarea rows={3} placeholder="Secret message" value={cfg.secretMessage || cfg.message || ''} onChange={(e) => updateSuccessConfigEdit('secretMessage', e.target.value)} />
                      <div style={{ marginTop: 8 }}>
                        <button type="button" className="btn btn-outline" onClick={() => updateSuccessConfigEdit('secretMessage', 'Here is a secret just for you!')}>Use default</button>
                      </div>
                    </>
                  )}

                  {isSecret && cfg.secretKind === 'location' && (
                    <>
                      <label>Secret Location</label>
                      <input type="text" placeholder="Location Name" value={cfg.name || ''} onChange={(e) => updateSuccessConfigEdit('name', e.target.value)} />
                      <br />
                      <br />
                      <input type="text" placeholder="Google Maps URL" value={cfg.mapLink || ''} onChange={(e) => updateSuccessConfigEdit('mapLink', e.target.value)} />
                    </>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <label style={{ marginRight: 12 }}>
                      <input type="checkbox" checked={showEditSuccessMessage} onChange={(e) => setShowEditSuccessMessage(e.target.checked)} /> Edit message
                    </label>
                  </div>

                  {showEditSuccessMessage && (
                    <>
                      <textarea rows={3} placeholder="WhatsApp Message" value={cfg.message || ''} onChange={(e) => updateSuccessConfigEdit('message', e.target.value)} />
                      <div style={{ marginTop: 8 }}>
                        <button type="button" className="btn btn-outline" onClick={() => updateSuccessConfigEdit('message', "Thanks for RSVPing — we'll send you details shortly via WhatsApp.")}>Use default</button>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </>
        )}

        <hr />

        {/* Interactive questions removed - invitation reveals core details progressively */}

        <button className="btn" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
      </div>
    </div>
  );
}

export default EditInvitation;
