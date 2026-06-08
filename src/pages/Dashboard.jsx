import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToUserInvitations } from "../services/dashboardService";
import { createInvitation } from "../services/invitationService";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteInvitation } from "../services/deleteInvitation";
import { themes } from "../themes/themes";
import AnalyticsCharts from "../components/AnalyticsCharts";
// import { logout } from "../services/authService";

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
  };

  const handleDuplicate = async (invite) => {
    try {
      const copyData = { ...invite };

      // remove fields that shouldn't be copied
      delete copyData.id;
      delete copyData.slug;
      delete copyData.createdAt;

      const newSlug = await createInvitation(copyData, user || null);

      const url = `${window.location.origin}/invite/${newSlug}`;

      await navigator.clipboard.writeText(url);

      toast.success("Invitation duplicated — link copied to clipboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to duplicate invitation");
    }
  };

  return (
    <div className="app-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Dashboard</h1>
          <p className="status-online">● Online</p>
          <p className="muted">{user.email}</p>
        </div>
      </div>

      <hr />

      {/* Analytics charts */}
      <AnalyticsCharts invitations={invitations} />

      {/* Analytics summary */}
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

      {invitations.map((invite) => (
        <div key={invite.id} className="card" style={{ marginBottom: 20 }}>
          <h2>{invite.eventType}</h2>

          <img
            src={invite.coverImageUrl || themes[invite.theme]?.coverImage}
            alt=""
            className="card-image"
          />

          <p>Recipient: {invite.recipientName}</p>

          <p>Views: {invite.views || 0} • Responses: {invite.responseCount || 0}</p>

          <p>Declined: {invite.declinedCount || 0}</p>

          <div className="actions-row">
            <button className="btn" onClick={() => window.open(`/invite/${invite.slug}`, "_blank")}>Preview</button>

            <button className="btn btn-outline" onClick={() => copyLink(invite.slug)}>Copy Link</button>

            <button className="btn btn-outline" onClick={() => navigate(`/edit/${invite.slug}`)}>Edit</button>

            <button className="btn btn-outline" onClick={() => handleDuplicate(invite)}>Duplicate</button>

            <button className="btn btn-danger" onClick={() => {
              if (window.confirm("Delete this invitation? This action cannot be undone.")) {
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

// export const getUserInvitations = async (uid) => {
//   console.log("UID:", uid);

//   const q = query(collection(db, "invitations"), where("ownerId", "==", uid));

//   const snapshot = await getDocs(q);

//   console.log("Found:", snapshot.docs.length);

//   return snapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   }));
// };
