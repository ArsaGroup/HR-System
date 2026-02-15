import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { paymentsAPI } from '../services/api';

const Wallet = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getWallet();
      setWallet(response.data);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Container className="my-5"><div className="text-center">Loading...</div></Container>;
  }

  return (
    <Container className="my-5">
      <h2 className="mb-4">My Wallet</h2>

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Body>
              <div className="text-center py-4">
                <h3>Current Balance</h3>
                <h1 className="text-primary">
                  {wallet?.currency || 'USD'} {wallet?.balance ? parseFloat(wallet.balance).toFixed(2) : '0.00'}
                </h1>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    className="me-2"
                    onClick={() => navigate('/payments/deposit')}
                  >
                    Deposit
                  </Button>
                  <Button
                    variant="outline-primary"
                    onClick={() => navigate('/payments/withdraw')}
                  >
                    Withdraw
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5>Recent Transactions</h5>
            </Card.Header>
            <Card.Body>
              <Button
                variant="link"
                onClick={() => navigate('/payments/transactions')}
              >
                View All Transactions
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5>Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <Button
                variant="outline-primary"
                className="w-100 mb-2"
                onClick={() => navigate('/payments/settings')}
              >
                Payment Settings
              </Button>
              <Button
                variant="outline-primary"
                className="w-100 mb-2"
                onClick={() => navigate('/payments/transactions')}
              >
                Transaction History
              </Button>
              <Button
                variant="outline-primary"
                className="w-100"
                onClick={() => navigate('/payments/invoices')}
              >
                Invoices
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Wallet;

