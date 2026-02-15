import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import Home from "./pages/Home";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Verification from "./components/auth/Verification";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Skills from "./pages/Skills";
import Portfolio from "./pages/Portfolio";
import SkillAssessment from "./pages/SkillAssessment";
import FindJobs from "./pages/FindJobs";
import HowItWorks from "./pages/HowItWorks";
import Explore from "./pages/Explore";
import Earnings from "./pages/Earnings";
import Teams from "./pages/Teams";

// Sprint 1.2: Project Submission & Management
import CreateProject from "./pages/CreateProject";
import ProjectTemplates from "./pages/ProjectTemplates";
import MyProjects from "./pages/MyProjects";
import ProjectPreview from "./pages/ProjectPreview";

// Sprint 1.3: Job Marketplace & Discovery
import JobMarketplace from "./pages/JobMarketplace";
import ProjectSearch from "./pages/ProjectSearch";
import ProjectDetails from "./pages/ProjectDetails";

// Sprint 1.4: Proposal & Bidding System
import SubmitProposal from "./pages/SubmitProposal";
import MyProposals from "./pages/MyProposals";
import CompareProposals from "./pages/CompareProposals";

// Sprint 1.5: Project Execution & Management
import ProjectManagement from "./pages/ProjectManagement";
import Messages from "./pages/Messages";

// Sprint 1.6: Payment & Financial System
import PaymentSettings from "./pages/PaymentSettings";
import TransactionHistory from "./pages/TransactionHistory";
import Wallet from "./pages/Wallet";
import Invoices from "./pages/Invoices";

// Provider Browse & Profiles
import BrowseProviders from "./pages/BrowseProviders";
import ProviderProfile from "./pages/ProviderProfile";

// Admin
import AdminDashboard from "./pages/AdminDashboard";

// Disputes, Reviews, and AI Features
import DisputeCenter from "./pages/DisputeCenter";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<Verification />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/find-jobs" element={<FindJobs />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/teams" element={<Teams />} />

              {/* Sprint 1.2: Project Submission & Management */}
              <Route path="/projects/create" element={<CreateProject />} />
              <Route
                path="/projects/templates"
                element={<ProjectTemplates />}
              />
              <Route path="/projects/my" element={<MyProjects />} />
              <Route
                path="/projects/:id/preview"
                element={<ProjectPreview />}
              />

              {/* Sprint 1.3: Job Marketplace & Discovery */}
              <Route path="/projects" element={<JobMarketplace />} />
              <Route path="/projects/search" element={<ProjectSearch />} />
              <Route
                path="/projects/search/results"
                element={<JobMarketplace />}
              />
              <Route path="/projects/:id" element={<ProjectDetails />} />

              {/* Sprint 1.4: Proposal & Bidding System */}
              <Route path="/proposals/create" element={<SubmitProposal />} />
              <Route path="/proposals" element={<MyProposals />} />
              <Route path="/proposals/:id" element={<MyProposals />} />
              <Route
                path="/proposals/compare/:id"
                element={<CompareProposals />}
              />

              {/* Sprint 1.5: Project Execution & Management */}
              <Route
                path="/projects/:id/manage"
                element={<ProjectManagement />}
              />
              <Route path="/messages" element={<Messages />} />
              <Route path="/earnings" element={<Earnings />} />

              {/* Sprint 1.6: Payment & Financial System */}
              <Route path="/payments/settings" element={<PaymentSettings />} />
              <Route
                path="/payments/transactions"
                element={<TransactionHistory />}
              />
              <Route path="/payments/wallet" element={<Wallet />} />
              <Route path="/payments/invoices" element={<Invoices />} />

              {/* Skill Assessment */}
              <Route path="/skill-assessment" element={<SkillAssessment />} />

              {/* Provider Browse & Profiles - Public Routes */}
              <Route path="/browse-providers" element={<BrowseProviders />} />
              <Route path="/providers" element={<BrowseProviders />} />
              <Route path="/provider/:id" element={<ProviderProfile />} />
              <Route path="/providers/:id" element={<ProviderProfile />} />
              <Route
                path="/providers/:id/profile"
                element={<ProviderProfile />}
              />

              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Disputes & Resolution */}
              <Route path="/disputes" element={<DisputeCenter />} />
              <Route path="/disputes/:id" element={<DisputeCenter />} />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
