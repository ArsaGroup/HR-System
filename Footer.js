import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: "Find Jobs", to: "/find-jobs" },
      { label: "Browse Providers", to: "/browse-providers" },
      { label: "Find Teams", to: "/teams" },
      { label: "Skill Assessment", to: "/skill-assessment" },
    ],
    company: [
      { label: "About Us", to: "/about" },
      { label: "How It Works", to: "/how-it-works" },
      { label: "Careers", to: "/careers" },
      { label: "Contact", to: "/contact" },
    ],
    resources: [
      { label: "Help Center", to: "/help" },
      { label: "Blog", to: "/blog" },
      { label: "Community", to: "/community" },
      { label: "API Docs", to: "/docs" },
    ],
    legal: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Cookie Policy", to: "/cookies" },
    ],
  };

  const socialLinks = [
    { icon: "🐦", label: "Twitter", url: "https://twitter.com" },
    { icon: "💼", label: "LinkedIn", url: "https://linkedin.com" },
    { icon: "📸", label: "Instagram", url: "https://instagram.com" },
    { icon: "🐙", label: "GitHub", url: "https://github.com" },
  ];

  return (
    <footer
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#f8fafc",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Background Elements */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "radial-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-50%",
          right: "-20%",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          left: "-10%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Main Footer Content */}
      <Container style={{ position: "relative", zIndex: 1 }}>
        {/* Top Section with CTA */}
        <div
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "60px",
            paddingBottom: "40px",
          }}
        >
          <Row className="align-items-center">
            <Col lg={7}>
              <h3
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 800,
                  marginBottom: "0.75rem",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Ready to Start Your Journey?
              </h3>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "1.0625rem",
                  marginBottom: 0,
                }}
              >
                Join thousands of students and professionals building their
                careers on Skillix.
              </p>
            </Col>
            <Col lg={5} className="text-lg-end mt-4 mt-lg-0">
              <Link
                to="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 32px",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "50px",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  transition: "all 0.3s ease",
                  boxShadow: "0 8px 30px rgba(99, 102, 241, 0.4)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 40px rgba(99, 102, 241, 0.5)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 30px rgba(99, 102, 241, 0.4)";
                }}
              >
                Get Started Free
                <span style={{ fontSize: "1.1rem" }}>→</span>
              </Link>
            </Col>
          </Row>
        </div>

        {/* Links Section */}
        <div style={{ padding: "50px 0" }}>
          <Row>
            {/* Brand Column */}
            <Col lg={4} md={6} className="mb-5 mb-lg-0">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    boxShadow: "0 8px 20px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  ⚡
                </div>
                <span
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Skillix
                </span>
              </div>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.9375rem",
                  lineHeight: 1.7,
                  marginBottom: "24px",
                  maxWidth: "280px",
                }}
              >
                Empowering talent to connect, collaborate, and create amazing
                things together. Your skills, your future.
              </p>

              {/* Social Links */}
              <div style={{ display: "flex", gap: "12px" }}>
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)";
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.transform = "translateY(-3px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)";
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.1)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </Col>

            {/* Platform Links */}
            <Col lg={2} md={6} sm={6} className="mb-4 mb-lg-0">
              <h6
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "20px",
                }}
              >
                Platform
              </h6>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {footerLinks.platform.map((link, index) => (
                  <li key={index} style={{ marginBottom: "12px" }}>
                    <Link
                      to={link.to}
                      style={{
                        color: "#94a3b8",
                        textDecoration: "none",
                        fontSize: "0.9375rem",
                        transition: "all 0.2s ease",
                        display: "inline-block",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = "#f8fafc";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = "#94a3b8";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Col>

            {/* Company Links */}
            <Col lg={2} md={6} sm={6} className="mb-4 mb-lg-0">
              <h6
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "20px",
                }}
              >
                Company
              </h6>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {footerLinks.company.map((link, index) => (
                  <li key={index} style={{ marginBottom: "12px" }}>
                    <Link
                      to={link.to}
                      style={{
                        color: "#94a3b8",
                        textDecoration: "none",
                        fontSize: "0.9375rem",
                        transition: "all 0.2s ease",
                        display: "inline-block",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = "#f8fafc";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = "#94a3b8";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Col>

            {/* Resources Links */}
            <Col lg={2} md={6} sm={6} className="mb-4 mb-lg-0">
              <h6
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "20px",
                }}
              >
                Resources
              </h6>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {footerLinks.resources.map((link, index) => (
                  <li key={index} style={{ marginBottom: "12px" }}>
                    <Link
                      to={link.to}
                      style={{
                        color: "#94a3b8",
                        textDecoration: "none",
                        fontSize: "0.9375rem",
                        transition: "all 0.2s ease",
                        display: "inline-block",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = "#f8fafc";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = "#94a3b8";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Col>

            {/* Legal Links */}
            <Col lg={2} md={6} sm={6}>
              <h6
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "20px",
                }}
              >
                Legal
              </h6>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {footerLinks.legal.map((link, index) => (
                  <li key={index} style={{ marginBottom: "12px" }}>
                    <Link
                      to={link.to}
                      style={{
                        color: "#94a3b8",
                        textDecoration: "none",
                        fontSize: "0.9375rem",
                        transition: "all 0.2s ease",
                        display: "inline-block",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = "#f8fafc";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = "#94a3b8";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Col>
          </Row>
        </div>

        {/* Bottom Section */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            padding: "24px 0",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "0.875rem",
            }}
          >
            © {currentYear} Skillix. All rights reserved.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#64748b",
                fontSize: "0.875rem",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981",
                }}
              />
              All systems operational
            </span>

            <span style={{ color: "#64748b", fontSize: "0.875rem" }}>
              Made with{" "}
              <span style={{ color: "#ec4899", fontSize: "1rem" }}>♥</span> for
              learners everywhere
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
