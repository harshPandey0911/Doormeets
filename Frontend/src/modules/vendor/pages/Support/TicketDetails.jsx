import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSend, FiClock, FiCheckCircle } from 'react-icons/fi';
import { supportService } from '../../services/supportService';
import Header from '../../components/layout/Header';
import { vendorTheme } from '../../../../theme';
import toast from 'react-hot-toast';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket]);

  const fetchTicketDetails = async () => {
    try {
      const res = await supportService.getTicketDetails(id);
      if (res.success) {
        setTicket(res.ticket);
      }
    } catch (error) {
      toast.error('Failed to load ticket details');
      navigate('/vendor/support');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      setSending(true);
      const res = await supportService.replyToTicket(id, { message: replyMessage });
      if (res.success) {
        setTicket(res.ticket);
        setReplyMessage('');
      }
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ticket) return null;

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title={`Ticket #${ticket.ticketNumber}`} showBack={true} />

      {/* Ticket Info Card */}
      <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 z-10 sticky top-[60px]">
        <div className="flex justify-between items-start mb-1">
          <h2 className="font-bold text-gray-800 text-sm">{ticket.subject}</h2>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isClosed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          Category: {ticket.category}
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {ticket.messages.map((msg, index) => {
          const isVendor = msg.sender === 'vendor';
          return (
            <div key={index} className={`flex ${isVendor ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${isVendor
                  ? 'bg-blue-50 border border-blue-100 rounded-tr-none'
                  : 'bg-white border border-gray-100 rounded-tl-none'
                }`}>
                {!isVendor && (
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Civil connect Support</p>
                )}
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.message}</p>
                <div className={`text-[9px] font-medium mt-1 ${isVendor ? 'text-blue-400 text-right' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isClosed ? (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-3 pb-safe">
          <form onSubmit={handleReply} className="flex gap-2 items-end">
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white resize-none max-h-32"
              rows="1"
              style={{ minHeight: '44px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <button
              type="submit"
              disabled={sending || !replyMessage.trim()}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 shadow-md disabled:opacity-50 transition-transform active:scale-95"
              style={{ background: vendorTheme.primary }}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiSend className="ml-0.5" />
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-100 border-t border-gray-200 p-4 pb-safe text-center">
          <div className="flex items-center justify-center text-gray-500 text-sm font-medium">
            <FiCheckCircle className="mr-2" />
            This ticket has been marked as {ticket.status}.
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetails;
