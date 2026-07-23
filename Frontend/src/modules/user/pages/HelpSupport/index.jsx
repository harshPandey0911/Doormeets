import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiSearch, FiMessageCircle, FiMail, FiPhone,
  FiChevronRight, FiHelpCircle, FiBook, FiAlertCircle,
  FiCheckCircle, FiClock, FiSend
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import { configService } from '../../../../services/configService';

const HelpSupport = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [supportInfo, setSupportInfo] = useState({
    email: 'support@doormeets.com',
    phone: '',
    whatsapp: ''
  });

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const fetchMyTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await api.get('/user/support/tickets');
      if (res.data?.success) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const result = await configService.getSettings();
        const settings = result?.settings;
        if (settings) {
          const { supportEmail, supportPhone, supportWhatsapp } = settings;
          setSupportInfo({
            email: supportEmail || 'support@doormeets.com',
            phone: supportPhone || '',
            whatsapp: supportWhatsapp || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch support settings:', error);
      }
    };
    fetchSettings();
    fetchMyTickets();
  }, []);

  // FAQ Categories
  const categories = [
    {
      id: 'booking',
      title: 'Booking & Services',
      icon: FiBook,
      color: '#3B82F6',
      questions: [
        {
          q: 'How do I book a service?',
          a: 'Navigate to the home page, select your desired service category, choose a service provider, select time slot, and confirm booking.'
        },
        {
          q: 'Can I cancel or reschedule my booking?',
          a: 'Yes, you can cancel or reschedule your booking from the My Bookings page up to 2 hours before the scheduled time.'
        },
        {
          q: 'What payment methods are accepted?',
          a: 'We accept all major payment methods including UPI, Credit/Debit cards, Net Banking, and Wallets.'
        },
      ]
    },
    {
      id: 'payment',
      title: 'Payments & Wallet',
      icon: FiClock,
      color: '#10B981',
      questions: [
        {
          q: 'How do I add money to my wallet?',
          a: 'Go to Wallet page, click on "Add Money", enter amount, and complete the payment using your preferred method.'
        },
        {
          q: 'Is my payment information secure?',
          a: 'Yes, we use industry-standard encryption and never store your complete card details on our servers.'
        },
        {
          q: 'How long does refund take?',
          a: 'Refunds are processed within 5-7 business days and will be credited to your original payment method or wallet.'
        },
      ]
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: FiAlertCircle,
      color: '#F59E0B',
      questions: [
        {
          q: 'How do I update my profile?',
          a: 'Go to Account page, tap on the edit icon next to your name, update your details, and save changes.'
        },
        {
          q: 'How do I change my phone number?',
          a: 'Phone number can be changed from Settings > Update Phone Number. OTP verification will be required.'
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes, you can request account deletion from Settings > Account Management > Delete Account.'
        },
      ]
    },
  ];

  // Quick actions
  const quickActions = [
    {
      id: 'chat',
      title: 'WhatsApp Chat',
      subtitle: supportInfo.whatsapp || 'Chat with our support team',
      icon: FiMessageCircle,
      color: '#25D366',
      action: () => {
        if (supportInfo.whatsapp) {
          const cleanNumber = supportInfo.whatsapp.replace(/\D/g, '');
          window.open(`https://wa.me/${cleanNumber}`, '_blank');
        } else {
          toast('WhatsApp support is currently unavailable');
        }
      }
    },
    {
      id: 'email',
      title: 'Email Us',
      subtitle: supportInfo.email,
      icon: FiMail,
      color: '#10B981',
      action: () => {
        window.location.href = `mailto:${supportInfo.email}`;
      }
    },
    {
      id: 'call',
      title: 'Call Us',
      subtitle: supportInfo.phone || 'Not Available',
      icon: FiPhone,
      color: '#F59E0B',
      action: () => {
        if (supportInfo.phone) {
          window.location.href = `tel:${supportInfo.phone}`;
        } else {
          toast('Phone support is currently unavailable');
        }
      }
    },
  ];

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setIsSubmitLoading(true);
      const res = await api.post('/user/support/tickets', {
        subject: formData.subject,
        message: formData.message,
        category: 'general',
        priority: 'medium'
      });

      if (res.data?.success) {
        toast.success('Your support request has been submitted successfully!');
        setShowContactForm(false);
        setFormData({ name: '', email: '', subject: '', message: '' });
        fetchMyTickets();
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to submit support request');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      const res = await api.post(`/user/support/tickets/${selectedTicket._id}/reply`, {
        message: replyText
      });
      if (res.data?.success) {
        setSelectedTicket(res.data.ticket);
        setReplyText('');
        fetchMyTickets();
      }
    } catch (err) {
      console.error('Error replying to ticket:', err);
      toast.error('Failed to send reply');
    }
  };

  const filteredQuestions = categories.flatMap(cat =>
    cat.questions.filter(q =>
      searchQuery === '' ||
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(q => ({ ...q, category: cat.title, color: cat.color }))
  );

  return (
    <div className="min-h-screen bg-light-bg pb-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-transparent backdrop-blur-xl border-b border-border-color">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-orange-50/10 rounded-full transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-dark-text" />
            </button>
            <h1 className="text-xl font-bold text-dark-text tracking-tight">Help & Support</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-md border border-border-color bg-card-bg text-dark-text focus:border-orange-500 focus:ring-2 focus:ring-orange-950/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <main className="px-4 pt-4">
        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-dark-text tracking-tight mb-3">Contact Us</h2>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map(action => {
              let href = null;
              if (action.id === 'chat' && supportInfo.whatsapp) {
                href = `https://wa.me/${supportInfo.whatsapp.replace(/\D/g, '')}`;
              } else if (action.id === 'email' && supportInfo.email) {
                href = `mailto:${supportInfo.email}`;
              } else if (action.id === 'call' && supportInfo.phone) {
                href = `tel:${supportInfo.phone.replace(/\D/g, '')}`;
              }

              const Component = href ? 'a' : 'button';

              return (
                <Component
                  key={action.id}
                  href={href}
                  target={href && !href.startsWith('mailto:') && !href.startsWith('tel:') ? '_blank' : undefined}
                  rel={href && !href.startsWith('mailto:') && !href.startsWith('tel:') ? 'noopener noreferrer' : undefined}
                  onClick={!href ? action.action : undefined}
                  className="bg-card-bg rounded-md p-4 shadow-sm hover:shadow-md transition-all active:scale-98 border border-border-color flex items-center gap-4 w-full cursor-pointer"
                >
                  <div
                    className="w-12 h-12 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <action.icon className="w-6 h-6" style={{ color: action.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-dark-text">{action.title}</h3>
                    <p className="text-sm text-secondary-text">{action.subtitle}</p>
                  </div>
                  <FiChevronRight className="w-5 h-5 text-secondary-text" />
                </Component>
              );
            })}
          </div>
        </div>

        {/* Submit a Request Button */}
        <button
          onClick={() => setShowContactForm(true)}
          className="w-full bg-gradient-to-r from-[#B33A35] to-[#9E2E2A] text-white rounded-md p-3.5 font-bold shadow-md hover:shadow-lg transition-all active:scale-98 mb-6 flex items-center justify-center gap-2 cursor-pointer"
        >
          <FiSend className="w-5 h-5" />
          Submit a Request
        </button>

        {/* My Support Tickets */}
        {searchQuery === '' && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-dark-text tracking-tight mb-3">My Support Requests</h2>
            
            {loadingTickets ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#B33A35]"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-card-bg border border-border-color rounded-md p-4 text-center text-sm text-secondary-text">
                You haven't submitted any support requests yet.
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map(ticket => (
                  <div 
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="bg-card-bg rounded-md p-4 shadow-sm hover:shadow-md transition-all border border-border-color cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-400">#{ticket.ticketNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          ticket.status === 'resolved' || ticket.status === 'closed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-dark-text text-sm">{ticket.subject}</h3>
                      <p className="text-xs text-secondary-text mt-1">Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <FiChevronRight className="w-5 h-5 text-secondary-text" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FAQ Categories */}
        {searchQuery === '' && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-dark-text tracking-tight mb-3">Browse by Category</h2>
            <div className="space-y-3">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
                  className="w-full bg-card-bg rounded-md p-4 shadow-sm hover:shadow-md transition-all border border-border-color cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}15` }}
                      >
                        <category.icon className="w-5 h-5" style={{ color: category.color }} />
                      </div>
                      <h3 className="font-semibold text-dark-text">{category.title}</h3>
                    </div>
                    <FiChevronRight
                      className={`w-5 h-5 text-secondary-text transition-transform ${selectedCategory === category.id ? 'rotate-90' : ''}`}
                    />
                  </div>

                  {/* Expanded Questions */}
                  {selectedCategory === category.id && (
                    <div className="mt-4 space-y-3 border-t border-border-color pt-4">
                      {category.questions.map((item, idx) => (
                        <div key={idx} className="text-left">
                          <div className="flex items-start gap-2 mb-2">
                            <FiHelpCircle className="w-4 h-4 text-[#B33A35] mt-0.5 shrink-0" />
                            <p className="font-medium text-dark-text text-sm">{item.q}</p>
                          </div>
                          <p className="text-sm text-secondary-text ml-6">{item.a}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery !== '' && (
          <div>
            <h2 className="text-lg font-bold text-dark-text tracking-tight mb-3">
              Search Results ({filteredQuestions.length})
            </h2>
            {filteredQuestions.length === 0 ? (
              <div className="bg-card-bg border border-border-color rounded-md p-8 text-center">
                <FiAlertCircle className="w-12 h-12 text-secondary-text mx-auto mb-3" />
                <p className="text-secondary-text">No results found for "{searchQuery}"</p>
                <p className="text-sm text-secondary-text opacity-70 mt-2">Try different keywords or contact support</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map((item, idx) => (
                  <div key={idx} className="bg-card-bg rounded-md p-4 shadow-sm border border-border-color">
                    <div className="flex items-start gap-2 mb-2">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${item.color}15`,
                          color: item.color
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 mb-2">
                      <FiHelpCircle className="w-4 h-4 text-[#B33A35] mt-0.5 shrink-0" />
                      <p className="font-medium text-dark-text text-sm">{item.q}</p>
                    </div>
                    <p className="text-sm text-secondary-text ml-6">{item.a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card-bg border border-border-color rounded-md w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="sticky top-0 bg-card-bg border-b border-border-color px-6 py-4 rounded-t-md">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark-text">Submit a Request</h2>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="p-2 hover:bg-gray-800/10 rounded-full transition-colors cursor-pointer text-dark-text"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-md border border-border-color bg-card-bg text-dark-text focus:border-[#B33A35] focus:ring-2 focus:ring-[#B33A35]/15 outline-none"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-md border border-border-color bg-card-bg text-dark-text focus:border-[#B33A35] focus:ring-2 focus:ring-[#B33A35]/15 outline-none"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-md border border-border-color bg-card-bg text-dark-text focus:border-[#B33A35] focus:ring-2 focus:ring-[#B33A35]/15 outline-none"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Message</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 rounded-md border border-border-color bg-card-bg text-dark-text focus:border-[#B33A35] focus:ring-2 focus:ring-[#B33A35]/15 outline-none resize-none"
                  placeholder="Describe your issue in detail..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full bg-gradient-to-r from-[#B33A35] to-[#9E2E2A] text-white rounded-md p-3.5 font-bold shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><FiSend className="w-5 h-5" />Submit Request</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Chat Modal/Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card-bg border border-border-color rounded-md w-full max-w-lg h-[80vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="bg-card-bg border-b border-border-color px-6 py-4 rounded-t-md flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400">#{selectedTicket.ticketNumber}</span>
                <h2 className="text-lg font-bold text-dark-text truncate max-w-[280px]">{selectedTicket.subject}</h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-gray-800/10 rounded-full transition-colors cursor-pointer text-dark-text"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {selectedTicket.messages.map((msg, idx) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={idx} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      isAdmin 
                        ? 'bg-white text-dark-text border border-border-color rounded-tl-none' 
                        : 'bg-[#B33A35] text-white rounded-tr-none'
                    }`}>
                      <p className="font-semibold text-[9px] mb-0.5 opacity-70">
                        {isAdmin ? 'Doormeets Support' : 'You'}
                      </p>
                      <p className="break-words">{msg.message}</p>
                      <span className="text-[8px] block text-right mt-1 opacity-60">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            {selectedTicket.status !== 'closed' ? (
              <form onSubmit={handleReplySubmit} className="p-4 border-t border-border-color bg-card-bg flex gap-2 rounded-b-md">
                <input
                  type="text"
                  required
                  placeholder="Type your message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2 border border-border-color rounded-lg outline-none text-sm bg-light-bg text-dark-text focus:border-[#B33A35]"
                />
                <button
                  type="submit"
                  className="bg-[#B33A35] text-white p-2.5 rounded-lg hover:bg-[#9E2E2A] transition-colors flex items-center justify-center cursor-pointer"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <div className="p-4 text-center text-sm text-secondary-text bg-gray-100 rounded-b-md font-medium">
                This ticket has been resolved and closed.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpSupport;
