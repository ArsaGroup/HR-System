import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Form, Row, Col } from 'react-bootstrap';
import { paymentsAPI } from '../services/api';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    transaction_type: '',
    status: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.transaction_type) params.transaction_type = filters.transaction_type;
      if (filters.status) params.status = filters.status;

      const response = await paymentsAPI.getTransactions(params);
      setTransactions(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      processing: 'info',
      completed: 'success',
      failed: 'danger',
      cancelled: 'secondary',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getTypeLabel = (type) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Container className="my-5">
      <h2 className="mb-4">Transaction History</h2>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Transaction Type</Form.Label>
                <Form.Select
                  value={filters.transaction_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, transaction_type: e.target.value }))}
                >
                  <option value="">All Types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="payment">Payment</option>
                  <option value="refund">Refund</option>
                  <option value="escrow_hold">Escrow Hold</option>
                  <option value="escrow_release">Escrow Release</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5>Transactions</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center">Loading transactions...</div>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Project</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.created_at).toLocaleString()}</td>
                    <td>{getTypeLabel(transaction.transaction_type)}</td>
                    <td>
                      <strong className={transaction.transaction_type.includes('withdrawal') || transaction.transaction_type.includes('payment') ? 'text-danger' : 'text-success'}>
                        {transaction.transaction_type.includes('withdrawal') || transaction.transaction_type.includes('payment') ? '-' : '+'}
                        {transaction.currency} {Math.abs(transaction.amount)}
                      </strong>
                    </td>
                    <td>{getStatusBadge(transaction.status)}</td>
                    <td>{transaction.description || '-'}</td>
                    <td>
                      {transaction.project ? (
                        <a href={`/projects/${transaction.project.id}`}>
                          {transaction.project.title}
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {transactions.length === 0 && !loading && (
            <div className="text-center text-muted py-4">
              No transactions found.
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TransactionHistory;

