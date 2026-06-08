import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="page-pad">
      <h1>InviteFlow</h1>

      <p className="hero-text">
        Create beautiful interactive invitations and share them with a unique URL. Pick a theme, write your message, and send a link — recipients can RSVP and trigger a success action.
      </p>

      <div className="row">
        <Link to="/create">
          <button>Create Invitation</button>
        </Link>

        <Link to="/login">
          <button>Login</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;