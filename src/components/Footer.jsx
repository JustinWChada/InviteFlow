import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <div className="footer-brand">InviteFlow</div>
          <div className="footer-built">Built By: <strong>Norxify Digital.</strong></div>
          <div className="footer-copyright">© {new Date().getFullYear()} InviteFlow</div>
        </div>

        <div className="footer-right">
          <div className="footer-title">Support & Suggestions</div>
          <div className="footer-support">
            <a className="footer-link" href="mailto:norxify@gmail.com">norxify@gmail.com</a>
            <a className="footer-link" href="https://wa.me/917347353880" target="_blank" rel="noreferrer">+91 73473 53880</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
