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
          questions: inv.questions || [],
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
        food: formData.food || '',
        message: formData.message,
        coverImageUrl,
        questions: formData.questions || [],
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

  // Simple questions editor
  const addQuestion = () => {
    setFormData((prev) => ({ ...prev, questions: [...(prev.questions || []), { question: "", options: [] }] }));
  };

  const updateQuestion = (index, field, value) => {
    const q = [...formData.questions];
    q[index] = { ...q[index], [field]: value };
    setFormData((prev) => ({ ...prev, questions: q }));
  };

  const removeQuestion = (index) => {
    const q = [...formData.questions];
    q.splice(index, 1);
    setFormData((prev) => ({ ...prev, questions: q }));
  };

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

        <label htmlFor="edit-theme">Theme</label>
        <select id="edit-theme" value={formData.theme} onChange={(e) => updateField("theme", e.target.value)}>
          {Object.values(themes).map((theme) => (
            <option key={theme.id} value={theme.id}>{theme.name}</option>
          ))}
        </select>

        <br />
        <br />

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

        <label htmlFor="edit-food">Preferred Food</label>
        <input id="edit-food" type="text" placeholder="Type of food the recipient prefers" value={formData.food || ''} onChange={(e) => updateField('food', e.target.value)} />

        <hr />

        <h2>Success Action</h2>

        <label htmlFor="edit-success-type">Type</label>
        <select id="edit-success-type" value={formData.successAction?.type || 'whatsapp'} onChange={(e) => updateField('successAction', { type: e.target.value, config: {} })}>
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram">Instagram</option>
          <option value="secret_message">Secret Message</option>
          <option value="secret_location">Secret Location</option>
        </select>

        {formData.successAction?.type === 'whatsapp' && (
          <>
            <label htmlFor="edit-wa-country">Country</label>
            <select id="edit-wa-country" value={formData.successAction?.config?.countryCode || '+263'} onChange={(e) => updateField('successAction', { ...formData.successAction, config: { ...formData.successAction.config, countryCode: e.target.value } })}>
              {countryCodes.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>

            <label htmlFor="edit-wa-phone">Phone</label>
            <input id="edit-wa-phone" type="text" placeholder="Phone Number" value={formData.successAction?.config?.phone || ''} onChange={(e) => updateField('successAction', { ...formData.successAction, config: { ...formData.successAction.config, phone: e.target.value } })} onBlur={() => {
              const cc = formData.successAction?.config?.countryCode || '+263';
              const raw = formData.successAction?.config?.phone || '';
              const norm = normalizePhone(cc, raw);
              updateField('successAction', { ...formData.successAction, config: { ...formData.successAction.config, phone: norm } });
            }} />

            <br />
            <br />

            <textarea rows={3} placeholder="WhatsApp Message" value={formData.successAction?.config?.message || ''} onChange={(e) => updateField('successAction', { ...formData.successAction, config: { ...formData.successAction.config, message: e.target.value } })} />
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-outline" onClick={() => updateField('successAction', { ...formData.successAction, config: { ...formData.successAction.config, message: "Thanks for RSVPing — we'll send you details shortly via WhatsApp." } })}>Use default</button>
            </div>
          </>
        )}

        <hr />

        <h2>Interactive Questions</h2>

        {(formData.questions || []).map((q, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <input type="text" placeholder="Question" value={q.question} onChange={(e) => updateQuestion(i, "question", e.target.value)} />
            <br />
            <input type="text" placeholder="Options (comma separated)" value={(q.options || []).join(",")} onChange={(e) => updateQuestion(i, "options", e.target.value.split(",").map(s => s.trim()))} />
            <br />
            <button className="btn btn-outline" onClick={() => removeQuestion(i)}>Remove</button>
          </div>
        ))}

        <button className="btn btn-outline" onClick={addQuestion}>Add Question</button>

        <hr />

        <button className="btn" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
      </div>
    </div>
  );
}

export default EditInvitation;
