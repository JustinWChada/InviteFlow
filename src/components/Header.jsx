import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  useOutsideMenu(menuRef, btnRef, showMenu, () => setShowMenu(false));

  return (
    <header className="site-header">
      <div className="app-container header-inner" style={{ position: 'relative' }}>
        <div>
          <Link to="/" className="brand-link">
            InviteFlow
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            ref={btnRef}
            className="nav-toggle"
            aria-expanded={showMenu}
            aria-label="Menu"
            onClick={() => setShowMenu((s) => !s)}
          >
            <span className="hamburger">☰</span>
          </button>

          <nav className="site-nav nav-inline">
            <Link to="/create">Create</Link>
            <Link to="/dashboard">Dashboard</Link>
            {!user && <Link to="/login">Login</Link>}

            {user && (
              <>
                <span className="muted" style={{ fontSize: 13 }}>{user.email}</span>
                <button onClick={logout} className="btn btn-danger" style={{ marginLeft: 8 }}>Logout</button>
              </>
            )}
          </nav>
        </div>

        <div ref={menuRef} className={`nav-dropdown ${showMenu ? "open" : ""}`} role="menu">
            <Link to="/create" onClick={() => setShowMenu(false)}>Create</Link>
            <Link to="/dashboard" onClick={() => setShowMenu(false)}>Dashboard</Link>
            {!user && <Link to="/login" onClick={() => setShowMenu(false)}>Login</Link>}
            {user && (
              <div style={{ paddingTop: 8 }}>
                <div className="muted" style={{ fontSize: 13 }}>{user.email}</div>
                <button onClick={() => { setShowMenu(false); logout(); }} className="btn btn-danger" style={{ marginTop: 8, width: '100%' }}>Logout</button>
              </div>
            )}
          </div>
      </div>
    </header>
  );
}

// Close the menu when clicking outside or pressing Escape
function useOutsideMenu(menuRef, btnRef, open, onClose) {
  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      const menu = menuRef.current;
      const btn = btnRef.current;
      if (!menu) return;
      if (menu.contains(e.target) || (btn && btn.contains(e.target))) return;
      onClose();
    };

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', onDocClick);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('pointerdown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, menuRef, btnRef, onClose]);
}
