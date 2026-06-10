import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToUserInvitations } from "../services/dashboardService";
import { createInvitation } from "../services/invitationService";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteInvitation } from "../services/deleteInvitation";
import { themes } from "../themes/themes";
import AnalyticsCharts from "../components/AnalyticsCharts";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserInvitations(user.uid, (data) => {
      setInvitations(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id) => {
    try {
      await deleteInvitation(id);
      setInvitations((prev) => prev.filter((i) => i.id !== id));
      toast.success("Invitation deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete invitation");
    }
  };

  const copyLink = async (slug) => {
    const url = `${window.location.origin}/invite/${slug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleDuplicate = async (invite) => {
    try {
      const copyData = { ...invite };
      delete copyData.id;
      delete copyData.slug;
      delete copyData.createdAt;
      const newSlug = await createInvitation(copyData, user || null);
      const url = `${window.location.origin}/invite/${newSlug}`;
      await navigator.clipboard.writeText(url);
      toast.success("Duplicated — link copied to clipboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to duplicate invitation");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      toast.error("Failed to log out");
    }
  };

  const getThemeIcon = (invite) => {
    if (invite.theme && themes[invite.theme]) return themes[invite.theme].icon;
    const map = {
      'Date Night': '❤️', 'Proposal': '💍', 'Birthday': '🎂',
      'Wedding': '💒', 'Graduation': '🎓', 'Party': '🎉', 'Church Event': '⛪',
    };
    return map[invite.eventType] || '💌';
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Dashboard</h1>
          <p className="status-online">● Online</p>
          <p className="muted">{user.email}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => navigate("/create")}>
            + Create
          </button>
          <button className="btn btn-outline" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <hr />

      {/* Analytics */}
      <AnalyticsCharts invitations={invitations} />

      <div className="stat-row">
        <div className="stat-card">
          <strong>{invitations.length}</strong>
          <div className="muted stat-label">Invitations</div>
        </div>
        <div className="stat-card">
          <strong>{invitations.reduce((s, i) => s + (i.views || 0), 0)}</strong>
          <div className="muted stat-label">Total Views</div>
        </div>
        <div className="stat-card">
          <strong>{invitations.reduce((s, i) => s + (i.responseCount || 0), 0)}</strong>
          <div className="muted stat-label">Total Responses</div>
        </div>
      </div>

      <hr />

      {/* Empty state */}
      {invitations.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "#aaa" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💌</div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>No invitations yet</p>
          <p style={{ fontSize: 14, marginBottom: 20 }}>Create your first one to get started</p>
          <button className="btn" onClick={() => navigate("/create")}>+ Create Invitation</button>
        </div>
      )}

      {/* Invitation cards */}
      {invitations.map((invite) => (
        <div key={invite.id} className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>{getThemeIcon(invite)}</span>
            <h2 style={{ margin: 0 }}>{invite.eventType}</h2>
          </div>

          <img
            src={invite.coverImageUrl || themes[invite.theme]?.coverImage}
            alt=""
            className="card-image"
          />

          <p>Recipient: <strong>{invite.recipientName || '—'}</strong></p>
          <p>Views: {invite.views || 0} &nbsp;•&nbsp; Responses: {invite.responseCount || 0} &nbsp;•&nbsp; Declined: {invite.declinedCount || 0}</p>

          <div className="actions-row">
            <button className="btn" onClick={() => window.open(`/invite/${invite.slug}`, "_blank")}>Preview</button>
            <button className="btn btn-outline" onClick={() => copyLink(invite.slug)}>Copy Link</button>
            <button className="btn btn-outline" onClick={() => navigate(`/edit/${invite.slug}`)}>Edit</button>
            <button className="btn btn-outline" onClick={() => handleDuplicate(invite)}>Duplicate</button>
            <button className="btn btn-danger" onClick={() => {
              if (window.confirm("Delete this invitation? This cannot be undone.")) {
                handleDelete(invite.id);
              }
            }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;