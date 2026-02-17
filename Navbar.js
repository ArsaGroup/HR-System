import React, { useState, useEffect } from "react";
import {
  Navbar,
  Nav,
  Container,
  Button,
  Dropdown,
  Badge,
} from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function NavigationBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isHomePage = location.pathname === "/";
  const navbarStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1030,
    padding: scrolled ? "0.75rem 0" : "1rem 0",
    background: scrolled
      ? "rgba(255, 255, 255, 0.95)"
      : isHomePage
        ? "transparent"
        : "rgba(255, 255, 255, 0.95)",
    backdropFilter: scrolled || !isHomePage ? "blur(20px)" : "none",
    WebkitBackdropFilter: scrolled || !isHomePage ? "blur(20px)" : "none",
    boxShadow: scrolled ? "0 4px 30px rgba(0, 0, 0, 0.1)" : "none",
    transition: "all 0.3s ease",
  };

  const linkStyle = (active) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    borderRadius: "50px",
    fontSize: "0.9375rem",
    fontWeight: 500,
    textDecoration: "none",
    color: active
      ? "#6366f1"
      : scrolled || !isHomePage
        ? "#1e293b"
        : "rgba(255,255,255,0.9)",
    background: active ? "rgba(99, 102, 241, 0.1)" : "transparent",
    transition: "all 0.2s ease",
  });

  const getUserTypeBadge = () => {
    if (user?.user_type === "service_provider") {
      return (
        <Badge
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            fontSize: "0.65rem",
            padding: "4px 8px",
            borderRadius: "50px",
            fontWeight: 600,
          }}
        >
          Provider
        </Badge>
      );
    } else if (user?.user_type === "service_requester") {
      return (
        <Badge
          style={{
            background: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
            fontSize: "0.65rem",
            padding: "4px 8px",
            borderRadius: "50px",
            fontWeight: 600,
          }}
        >
          Client
        </Badge>
      );
    } else if (user?.user_type === "admin") {
      return (
        <Badge
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            fontSize: "0.65rem",
            padding: "4px 8px",
            borderRadius: "50px",
            fontWeight: 600,
          }}
        >
          Admin
        </Badge>
      );
    }
    return null;
  };

  const getUserInitials = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <Navbar expand="lg" style={navbarStyle}>
      <Container>
        {/* Brand */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
            }}
          >
            ⚡
          </div>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              background:
                scrolled || !isHomePage
                  ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                  : "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Skillix
          </span>
        </Link>

        {/* Mobile Toggle */}
        <Navbar.Toggle
          aria-controls="navbar-nav"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            border: "none",
            padding: "8px",
            borderRadius: "8px",
            background:
              scrolled || !isHomePage ? "#f1f5f9" : "rgba(255,255,255,0.2)",
          }}
        />

        <Navbar.Collapse id="navbar-nav">
          <Nav className="mx-auto" style={{ gap: "4px" }}>
            {/* Common Links */}
            <Link
              to="/"
              style={linkStyle(isActive("/") && location.pathname === "/")}
            >
              <span>🏠</span>
              <span>Home</span>
            </Link>

            <Link to="/find-jobs" style={linkStyle(isActive("/find-jobs"))}>
              <span>💼</span>
              <span>Find Jobs</span>
            </Link>

            <Link
              to="/browse-providers"
              style={linkStyle(isActive("/browse-providers"))}
            >
              <span>👥</span>
              <span>Find Talent</span>
            </Link>

            <Link to="/teams" style={linkStyle(isActive("/teams"))}>
              <span>🤝</span>
              <span>Teams</span>
            </Link>

            {isAuthenticated && (
              <Link to="/dashboard" style={linkStyle(isActive("/dashboard"))}>
                <span>📊</span>
                <span>Dashboard</span>
              </Link>
            )}

            {isAuthenticated && (
              <Link to="/messages" style={linkStyle(isActive("/messages"))}>
                <span>💬</span>
                <span>Messages</span>
              </Link>
            )}
          </Nav>

          {/* Right Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  style={{
                    padding: "10px 20px",
                    borderRadius: "50px",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    color: scrolled || !isHomePage ? "#1e293b" : "white",
                    transition: "all 0.2s ease",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{
                    padding: "10px 24px",
                    borderRadius: "50px",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    color: "white",
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
                    transition: "all 0.3s ease",
                  }}
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {/* Quick Actions */}
                {user?.user_type === "service_requester" && (
                  <Link
                    to="/projects/create"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 20px",
                      borderRadius: "50px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      color: "white",
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <span>✨</span>
                    Post Project
                  </Link>
                )}

                {/* User Dropdown */}
                <Dropdown align="end">
                  <Dropdown.Toggle
                    as="div"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "6px 12px 6px 6px",
                      borderRadius: "50px",
                      cursor: "pointer",
                      background:
                        scrolled || !isHomePage
                          ? "#f8fafc"
                          : "rgba(255,255,255,0.15)",
                      border: `1px solid ${scrolled || !isHomePage ? "#e2e8f0" : "rgba(255,255,255,0.2)"}`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                      }}
                    >
                      {getUserInitials()}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          color: scrolled || !isHomePage ? "#1e293b" : "white",
                          lineHeight: 1.2,
                        }}
                      >
                        {user?.username}
                      </span>
                      {getUserTypeBadge()}
                    </div>
                    <span
                      style={{
                        marginLeft: "4px",
                        fontSize: "0.75rem",
                        color:
                          scrolled || !isHomePage
                            ? "#64748b"
                            : "rgba(255,255,255,0.7)",
                      }}
                    >
                      ▼
                    </span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu
                    style={{
                      marginTop: "10px",
                      padding: "8px",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                      minWidth: "240px",
                    }}
                  >
                    {/* Profile Section */}
                    <div
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #e2e8f0",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#1e293b" }}>
                        {user?.first_name} {user?.last_name}
                      </div>
                      <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                        {user?.email}
                      </div>
                    </div>

                    <Dropdown.Item
                      as={Link}
                      to="/profile"
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span>👤</span> My Profile
                    </Dropdown.Item>

                    <Dropdown.Item
                      as={Link}
                      to="/dashboard"
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span>📊</span> Dashboard
                    </Dropdown.Item>

                    {user?.user_type === "service_provider" && (
                      <>
                        <Dropdown.Item
                          as={Link}
                          to="/portfolio"
                          style={{
                            padding: "10px 16px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span>💼</span> Portfolio
                        </Dropdown.Item>
                        <Dropdown.Item
                          as={Link}
                          to="/skills"
                          style={{
                            padding: "10px 16px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span>🎯</span> Skills
                        </Dropdown.Item>
                        <Dropdown.Item
                          as={Link}
                          to="/proposals"
                          style={{
                            padding: "10px 16px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span>📝</span> My Proposals
                        </Dropdown.Item>
                        <Dropdown.Item
                          as={Link}
                          to="/earnings"
                          style={{
                            padding: "10px 16px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span>💰</span> Earnings
                        </Dropdown.Item>
                      </>
                    )}

                    {user?.user_type === "service_requester" && (
                      <>
                        <Dropdown.Item
                          as={Link}
                          to="/projects/my"
                          style={{
                            padding: "10px 16px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span>📋</span> My Projects
                        </Dropdown.Item>
                        <Dropdown.Item
                          as={Link}
                          to="/projects/templates"
                          style={{
                            padding: "10px 16px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span>📑</span> Templates
                        </Dropdown.Item>
                      </>
                    )}

                    <Dropdown.Item
                      as={Link}
                      to="/messages"
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span>💬</span> Messages
                    </Dropdown.Item>

                    <Dropdown.Item
                      as={Link}
                      to="/payments/wallet"
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span>👛</span> Wallet
                    </Dropdown.Item>

                    <Dropdown.Item
                      as={Link}
                      to="/skill-assessment"
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span>📝</span> Skill Assessment
                    </Dropdown.Item>

                    {user?.user_type === "admin" && (
                      <Dropdown.Item
                        as={Link}
                        to="/admin"
                        style={{
                          padding: "10px 16px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "rgba(245, 158, 11, 0.1)",
                          color: "#d97706",
                        }}
                      >
                        <span>⚙️</span> Admin Dashboard
                      </Dropdown.Item>
                    )}

                    <Dropdown.Divider style={{ margin: "8px 0" }} />

                    <Dropdown.Item
                      onClick={handleLogout}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "#ef4444",
                      }}
                    >
                      <span>🚪</span> Sign Out
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;
