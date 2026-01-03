import React from "react";
import {
  Card,
  Badge,
  ProgressBar,
  Row,
  Col,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

const ProviderScoreDisplay = ({
  score,
  showBreakdown = true,
  showHistory = false,
  compact = false,
  className = "",
}) => {
  // Default score structure if not provided
  const defaultScore = {
    total_score: 0,
    review_score: 0,
    assessment_score: 0,
    project_score: 0,
    reliability_score: 0,
    level: "Newcomer",
    rank: null,
    total_reviews: 0,
    projects_completed: 0,
  };

  const providerScore = score || defaultScore;

  // Get score level info
  const getScoreLevel = (totalScore) => {
    const numScore = parseFloat(totalScore) || 0;

    if (numScore >= 90) {
      return {
        label: "Elite",
        variant: "success",
        icon: "🏆",
        description: "Top-tier provider with exceptional performance",
        color: "#198754",
      };
    } else if (numScore >= 75) {
      return {
        label: "Expert",
        variant: "primary",
        icon: "⭐",
        description: "Highly skilled provider with proven track record",
        color: "#0d6efd",
      };
    } else if (numScore >= 50) {
      return {
        label: "Professional",
        variant: "info",
        icon: "👍",
        description: "Reliable provider with good performance",
        color: "#0dcaf0",
      };
    } else if (numScore >= 25) {
      return {
        label: "Rising",
        variant: "warning",
        icon: "📈",
        description: "Building reputation and experience",
        color: "#ffc107",
      };
    } else {
      return {
        label: "Newcomer",
        variant: "secondary",
        icon: "🌱",
        description: "New to the platform",
        color: "#6c757d",
      };
    }
  };

  const scoreInfo = getScoreLevel(providerScore.total_score);

  // Score breakdown categories
  const scoreCategories = [
    {
      key: "review_score",
      label: "Reviews",
      icon: "⭐",
      weight: "40%",
      description: "Based on client reviews and ratings",
    },
    {
      key: "assessment_score",
      label: "Skills",
      icon: "📚",
      weight: "25%",
      description: "Based on skill assessments and certifications",
    },
    {
      key: "project_score",
      label: "Projects",
      icon: "📋",
      weight: "20%",
      description: "Based on completed projects",
    },
    {
      key: "reliability_score",
      label: "Reliability",
      icon: "✅",
      weight: "15%",
      description: "Based on on-time delivery and responsiveness",
    },
  ];

  // Render compact version
  if (compact) {
    return (
      <div className={`d-inline-flex align-items-center gap-2 ${className}`}>
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              {scoreInfo.label} Provider - {scoreInfo.description}
            </Tooltip>
          }
        >
          <div className="d-flex align-items-center">
            <span className="me-1">{scoreInfo.icon}</span>
            <Badge
              bg={scoreInfo.variant}
              style={{ fontSize: "0.9rem", padding: "0.4em 0.6em" }}
            >
              {Math.round(providerScore.total_score)}
            </Badge>
          </div>
        </OverlayTrigger>
        <small className="text-muted">
          {scoreInfo.label}
        </small>
      </div>
    );
  }

  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <Card.Body>
        {/* Main Score Display */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{
              width: "100px",
              height: "100px",
              background: `linear-gradient(135deg, ${scoreInfo.color}22, ${scoreInfo.color}44)`,
              border: `3px solid ${scoreInfo.color}`,
            }}
          >
            <div>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: scoreInfo.color }}>
                {Math.round(providerScore.total_score)}
              </div>
            </div>
          </div>

          <div className="mb-2">
            <span style={{ fontSize: "1.5rem" }}>{scoreInfo.icon}</span>
            <Badge
              bg={scoreInfo.variant}
              className="ms-2"
              style={{ fontSize: "1rem", padding: "0.5em 1em" }}
            >
              {scoreInfo.label}
            </Badge>
          </div>

          <p className="text-muted mb-0 small">{scoreInfo.description}</p>

          {providerScore.rank && (
            <div className="mt-2">
              <Badge bg="dark" className="me-2">
                Rank #{providerScore.rank}
              </Badge>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <Row className="text-center mb-4 g-3">
          <Col xs={6}>
            <div className="p-2 bg-light rounded">
              <div className="h5 mb-0 text-primary">
                {providerScore.total_reviews || 0}
              </div>
              <small className="text-muted">Reviews</small>
            </div>
          </Col>
          <Col xs={6}>
            <div className="p-2 bg-light rounded">
              <div className="h5 mb-0 text-success">
                {providerScore.projects_completed || 0}
              </div>
              <small className="text-muted">Projects</small>
            </div>
          </Col>
        </Row>

        {/* Score Breakdown */}
        {showBreakdown && (
          <div>
            <h6 className="mb-3 d-flex align-items-center">
              <span className="me-2">📊</span>
              Score Breakdown
            </h6>

            {scoreCategories.map((category) => {
              const categoryScore = parseFloat(providerScore[category.key]) || 0;
              const normalizedScore = Math.min(100, categoryScore);

              return (
                <div key={category.key} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>{category.description}</Tooltip>}
                    >
                      <span style={{ cursor: "help" }}>
                        <span className="me-1">{category.icon}</span>
                        {category.label}
                      </span>
                    </OverlayTrigger>
                    <span className="d-flex align-items-center">
                      <small className="text-muted me-2">({category.weight})</small>
                      <strong>{Math.round(categoryScore)}</strong>
                    </span>
                  </div>
                  <ProgressBar
                    now={normalizedScore}
                    variant={
                      normalizedScore >= 80
                        ? "success"
                        : normalizedScore >= 60
                        ? "primary"
                        : normalizedScore >= 40
                        ? "info"
                        : normalizedScore >= 20
                        ? "warning"
                        : "secondary"
                    }
                    style={{ height: "8px" }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Score History Preview */}
        {showHistory && providerScore.recent_changes && (
          <div className="mt-4 pt-3 border-top">
            <h6 className="mb-3">
              <span className="me-2">📈</span>
              Recent Activity
            </h6>
            <div className="small">
              {providerScore.recent_changes.slice(0, 3).map((change, idx) => (
                <div
                  key={idx}
                  className="d-flex justify-content-between align-items-center py-2 border-bottom"
                >
                  <span>{change.reason}</span>
                  <Badge bg={change.points >= 0 ? "success" : "danger"}>
                    {change.points >= 0 ? "+" : ""}{change.points}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

// Mini version for inline display
export const ProviderScoreBadge = ({ score, showLabel = true }) => {
  const totalScore = parseFloat(score?.total_score || score || 0);

  const getVariant = () => {
    if (totalScore >= 90) return "success";
    if (totalScore >= 75) return "primary";
    if (totalScore >= 50) return "info";
    if (totalScore >= 25) return "warning";
    return "secondary";
  };

  const getIcon = () => {
    if (totalScore >= 90) return "🏆";
    if (totalScore >= 75) return "⭐";
    if (totalScore >= 50) return "👍";
    if (totalScore >= 25) return "📈";
    return "🌱";
  };

  const getLabel = () => {
    if (totalScore >= 90) return "Elite";
    if (totalScore >= 75) return "Expert";
    if (totalScore >= 50) return "Pro";
    if (totalScore >= 25) return "Rising";
    return "New";
  };

  return (
    <Badge bg={getVariant()} className="d-inline-flex align-items-center gap-1">
      <span>{getIcon()}</span>
      <span>{Math.round(totalScore)}</span>
      {showLabel && <span className="ms-1">• {getLabel()}</span>}
    </Badge>
  );
};

// Stars display component
export const ScoreStars = ({ rating, maxStars = 5, size = "md" }) => {
  const numRating = parseFloat(rating) || 0;
  const fullStars = Math.floor(numRating);
  const hasHalfStar = numRating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  const starSize = size === "sm" ? "0.8rem" : size === "lg" ? "1.4rem" : "1rem";

  return (
    <span style={{ fontSize: starSize }}>
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} style={{ color: "#ffc107" }}>★</span>
      ))}
      {hasHalfStar && <span style={{ color: "#ffc107" }}>½</span>}
      {[...Array(Math.max(0, emptyStars))].map((_, i) => (
        <span key={`empty-${i}`} style={{ color: "#e0e0e0" }}>★</span>
      ))}
    </span>
  );
};

export default ProviderScoreDisplay;
