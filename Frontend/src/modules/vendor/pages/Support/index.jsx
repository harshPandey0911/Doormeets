import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiPlus, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { supportService } from '../../services/supportService';
import Header from '../../components/layout/Header';
import { vendorTheme } from '../../../../theme';
import toast from 'react-hot-toast';

const SupportList = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ subject: '', category: 'general', message: '' });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await supportService.getTickets();
      if (res.success) {
        setTickets(res.data);
      }
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await supportService.createTicket(formData);
      if (res.success) {
        toast.success('Ticket created successfully!');
        setShowCreateModal(false);
        setFormData({ subject: '', category: 'general', message: '' });
        fetchTickets();
      }
    } catch (error) {
      toast.error('Failed to create ticket');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_on_user': return 'bg-orange-100 text-orange-800';
      case 'resolved':
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <FiMessageSquare className="w-3 h-3 mr-1" />;
      case 'in_progress': return <FiClock className="w-3 h-3 mr-1" />;
      case 'waiting_on_user': return <FiAlertCircle className="w-3 h-3 mr-1" />;
      case 'resolved':
      case 'closed': return <FiCheckCircle className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Helpdesk & Support" showBack={true} />

      <div className="p-3.5 max-w-lg mx-auto">
        {/* Header Action */}
        <div className="flex justify-between items-center mb-4 px-0.5">
          <h2 className="text-sm md:text-base font-bold text-gray-900">Your Tickets</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
            style={{ background: vendorTheme.primary }}
          >
            <FiPlus className="w-3.5 h-3.5" /> New Ticket
          </button>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-md p-6 text-center shadow-2xs border border-gray-100">
            <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <FiMessageSquare className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">No Support Tickets Yet</h3>
            <p className="text-gray-500 text-xs mb-4 font-medium">If you need help with anything, feel free to raise a ticket.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-md text-primary font-bold text-xs border-2 border-primary hover:bg-primary/5 transition-colors"
            >
              Raise a Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tickets.map(ticket => (
              <div
                key={ticket._id}
                onClick={() => navigate(`/vendor/support/${ticket._id}`)}
                className="bg-white rounded-md p-3 shadow-2xs border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-[10px] font-bold text-gray-400">#{ticket.ticketNumber}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-xs md:text-sm mb-0.5">{ticket.subject}</h3>
                <p className="text-[11px] text-gray-500 line-clamp-2 mb-2 font-medium">
                  {ticket.messages[0]?.message}
                </p>
                <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold border-t border-gray-50 pt-1.5">
                  <span className="uppercase tracking-wider">{ticket.category}</span>
                  <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-md w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-xs md:text-sm">Create Support Ticket</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-3.5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-md p-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                  required
                >
                  <option value="general">General Inquiry</option>
                  <option value="payout">Payout Issue</option>
                  <option value="booking">Booking Issue</option>
                  <option value="account">Account/Profile</option>
                  <option value="technical">Technical Bug</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of the issue"
                  className="w-full border border-gray-200 rounded-md p-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please explain the issue in detail..."
                  rows="3"
                  className="w-full border border-gray-200 rounded-md p-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  required
                ></textarea>
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2 rounded-md text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
                  style={{ background: vendorTheme.primary }}
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SupportList;
