import React, { useState, useEffect } from 'react';
import './App.css';
import { FaPlus, FaUsers, FaCalculator, FaLinkedin, FaGithub, FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [people, setPeople] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSplits, setShowSplits] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: '',
    splitBetween: []
  });

  const addPerson = () => {
    if (newPersonName.trim()) {
      const newPerson = {
        id: uuidv4(),
        name: newPersonName.trim()
      };
      setPeople([...people, newPerson]);
      setNewPersonName('');
      setShowAddPerson(false);
    }
  };

  const removePerson = (personId) => {
    setPeople(people.filter(p => p.id !== personId));
    setExpenses(expenses.filter(expense => 
      expense.paidBy !== personId && 
      !expense.splitBetween.includes(personId)
    ));
  };

  const addExpense = () => {
    if (newExpense.description && newExpense.amount && newExpense.paidBy && newExpense.splitBetween.length > 0) {
      const expense = {
        id: uuidv4(),
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        paidBy: newExpense.paidBy,
        splitBetween: newExpense.splitBetween,
        timestamp: new Date()
      };
      setExpenses([...expenses, expense]);
      setNewExpense({
        description: '',
        amount: '',
        paidBy: '',
        splitBetween: []
      });
      setShowAddExpense(false);
    }
  };

  const removeExpense = (expenseId) => {
    setExpenses(expenses.filter(e => e.id !== expenseId));
  };

  const togglePersonInSplit = (personId) => {
    const updatedSplit = newExpense.splitBetween.includes(personId)
      ? newExpense.splitBetween.filter(id => id !== personId)
      : [...newExpense.splitBetween, personId];
    
    setNewExpense({...newExpense, splitBetween: updatedSplit});
  };

  const selectAllPeople = () => {
    setNewExpense({
      ...newExpense, 
      splitBetween: people.map(p => p.id)
    });
  };

  const calculateSplits = () => {
    const balances = {};
    people.forEach(person => {
      balances[person.id] = 0;
    });

    expenses.forEach(expense => {
      const splitAmount = expense.amount / expense.splitBetween.length;
      
      // Add to payer's balance
      balances[expense.paidBy] += expense.amount;
      
      // Subtract from each person's share
      expense.splitBetween.forEach(personId => {
        balances[personId] -= splitAmount;
      });
    });

    return balances;
  };

  const getSettlements = () => {
    const balances = calculateSplits();
    const settlements = [];
    
    const creditors = [];
    const debtors = [];
    
    Object.entries(balances).forEach(([personId, balance]) => {
      if (balance > 0.01) {
        creditors.push({ personId, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ personId, amount: Math.abs(balance) });
      }
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.amount, debtor.amount);

      if (amount > 0.01) {
        const creditorName = people.find(p => p.id === creditor.personId)?.name;
        const debtorName = people.find(p => p.id === debtor.personId)?.name;
        
        settlements.push({
          from: debtorName,
          to: creditorName,
          amount: amount
        });
      }

      creditor.amount -= amount;
      debtor.amount -= amount;

      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }

    return settlements;
  };

  const getPersonName = (personId) => {
    return people.find(p => p.id === personId)?.name || 'Unknown';
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1><FaCalculator /> Split Payment App</h1>
          <p>Split expenses easily with your friends</p>
          {expenses.length > 0 && (
            <div className="total-expenses">
              Total Expenses: ₹{getTotalExpenses().toFixed(2)}
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        <div className="app-grid">
          {/* People Section */}
          <section className="section people-section">
            <div className="section-header">
              <h2><FaUsers /> People ({people.length})</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddPerson(true)}
              >
                <FaPlus /> Add Person
              </button>
            </div>
            
            {people.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p>No people added yet</p>
                <small>Add people to start splitting expenses!</small>
              </div>
            ) : (
              <div className="people-list">
                {people.map(person => (
                  <div key={person.id} className="person-card">
                    <div className="person-info">
                      <div className="person-avatar">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="person-name">{person.name}</span>
                    </div>
                    <button
                      className="btn-remove"
                      onClick={() => removePerson(person.id)}
                      title="Remove person"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Expenses Section */}
          <section className="section expenses-section">
            <div className="section-header">
              <h2>💰 Expenses ({expenses.length})</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddExpense(true)}
                disabled={people.length < 2}
              >
                <FaPlus /> Add Expense
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💸</div>
                <p>No expenses added yet</p>
                <small>{people.length < 2 ? 'Add at least 2 people first!' : 'Start adding expenses!'}</small>
              </div>
            ) : (
              <div className="expenses-chat">
                {expenses.map(expense => (
                  <div key={expense.id} className="expense-message">
                    <div className="expense-content">
                      <div className="expense-header">
                        <strong>{getPersonName(expense.paidBy)}</strong> paid <span className="amount">₹{expense.amount.toFixed(2)}</span>
                      </div>
                      <div className="expense-description">{expense.description}</div>
                      <div className="expense-split">
                        Split between: {expense.splitBetween.map(id => getPersonName(id)).join(', ')}
                      </div>
                      <div className="expense-time">
                        {expense.timestamp.toLocaleString()}
                      </div>
                    </div>
                    <button
                      className="btn-remove expense-remove"
                      onClick={() => removeExpense(expense.id)}
                      title="Remove expense"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Settlements Section */}
          {expenses.length > 0 && (
            <section className="section settlements-section">
              <div className="section-header">
                <h2>🧮 Settlements</h2>
                <button 
                  className={`btn ${showSplits ? 'btn-secondary' : 'btn-success'}`}
                  onClick={() => setShowSplits(!showSplits)}
                >
                  {showSplits ? 'Hide' : 'Show'} Splits
                </button>
              </div>

              {showSplits && (
                <div className="settlements">
                  {getSettlements().length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🎉</div>
                      <p>All settled up!</p>
                      <small>Everyone has paid their fair share</small>
                    </div>
                  ) : (
                    <>
                      <div className="settlements-header">
                        <h4>Who owes whom:</h4>
                      </div>
                      {getSettlements().map((settlement, index) => (
                        <div key={index} className="settlement-card">
                          <div className="settlement-info">
                            <span className="settlement-from">{settlement.from}</span>
                            <span className="settlement-arrow">→</span>
                            <span className="settlement-to">{settlement.to}</span>
                          </div>
                          <span className="settlement-amount">₹{settlement.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Add Person Modal - FIXED VERSION */}
      {showAddPerson && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddPerson(false)}>
          <div className="modal">
            <h3>Add New Person</h3>
            <input
              type="text"
              placeholder="Enter person's name"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onInput={(e) => setNewPersonName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPerson()}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddPerson(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={addPerson} disabled={!newPersonName.trim()}>
                Add Person
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal - COMPLETE FIXED VERSION */}
      {showAddExpense && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddExpense(false)}>
          <div className="modal large-modal">
            <h3>Add New Expense</h3>
            
            <div className="form-group">
              <label>What did you pay for?</label>
              <input
                type="text"
                placeholder="e.g., Dinner at restaurant"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                onInput={(e) => setNewExpense({...newExpense, description: e.target.value})}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
            
            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                onInput={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                min="0"
                step="0.01"
                inputMode="decimal"
              />
            </div>
            
            <div className="form-group">
              <label>Who paid?</label>
              <select 
                value={newExpense.paidBy}
                onChange={(e) => setNewExpense({...newExpense, paidBy: e.target.value})}
                onInput={(e) => setNewExpense({...newExpense, paidBy: e.target.value})}
              >
                <option value="">Select person</option>
                {people.map(person => (
                  <option key={person.id} value={person.id}>{person.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div className="split-header">
                <label>Split between:</label>
                <button 
                  type="button"
                  className="btn btn-small btn-outline"
                  onClick={selectAllPeople}
                >
                  Select All
                </button>
              </div>
              <div className="people-checkboxes">
                {people.map(person => (
                  <label key={person.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newExpense.splitBetween.includes(person.id)}
                      onChange={() => togglePersonInSplit(person.id)}
                    />
                    <span className="checkbox-custom"></span>
                    {person.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddExpense(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={addExpense}
                disabled={!newExpense.description || !newExpense.amount || !newExpense.paidBy || newExpense.splitBetween.length === 0}
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-info">
            <p>Created with ❤️ by <strong>Shaik Abu bakar siddik</strong></p>
            <p className="footer-subtitle">Making expense splitting simple and fair</p>
          </div>
          <div className="social-links">
            <a href="https://www.linkedin.com/in/shaik-abu-bakar-siddik-34a509292" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaLinkedin />
              <span>LinkedIn</span>
            </a>
            <a href="https://github.com/austinabu8" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaGithub />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
