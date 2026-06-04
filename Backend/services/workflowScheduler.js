const ServiceWorkflow = require('../models/ServiceWorkflow');
const ServiceWorkflowStep = require('../models/ServiceWorkflowStep');
const BookingVisit = require('../models/BookingVisit');

const scheduleVisitsForBooking = async (booking) => {
  try {
    const serviceId = booking.serviceId;
    const scheduledDate = new Date(booking.scheduledDate);

    // Fetch workflow config
    const workflow = await ServiceWorkflow.findOne({ serviceId }).lean();

    // Default to Single Visit if no config exists
    const workflowType = workflow ? workflow.workflowType : 'single_visit';
    const totalVisits = workflow ? workflow.totalVisits : 1;

    const visitsToCreate = [];

    if (workflowType === 'single_visit' || totalVisits <= 1) {
      visitsToCreate.push({
        bookingId: booking._id,
        visitNumber: 1,
        title: booking.serviceName + ' - Main Visit',
        scheduledDate: scheduledDate,
        status: 'pending'
      });
    } else if (workflowType === 'multi_visit') {
      const steps = await ServiceWorkflowStep.find({ workflowId: workflow._id }).sort({ sequence: 1 }).lean();
      
      let lastDate = new Date(scheduledDate);
      
      for (let i = 0; i < totalVisits; i++) {
        const step = steps[i];
        const title = step ? step.title : `${booking.serviceName} - Visit ${i + 1}`;
        const daysOffset = step ? step.daysAfterPreviousVisit : 0;
        
        // Calculate scheduled date for this step
        const visitDate = new Date(lastDate);
        visitDate.setDate(visitDate.getDate() + daysOffset);
        
        visitsToCreate.push({
          bookingId: booking._id,
          visitNumber: i + 1,
          title: title,
          scheduledDate: visitDate,
          status: 'pending'
        });
        
        // Update lastDate for subsequent offsets
        lastDate = visitDate;
      }
    } else if (workflowType === 'recurring' || workflowType === 'subscription') {
      const freq = workflow.frequency || 'monthly';
      let lastDate = new Date(scheduledDate);
      
      for (let i = 0; i < totalVisits; i++) {
        const visitDate = new Date(lastDate);
        if (i > 0) {
          if (freq === 'daily') visitDate.setDate(visitDate.getDate() + 1);
          else if (freq === 'weekly') visitDate.setDate(visitDate.getDate() + 7);
          else if (freq === 'bi-weekly') visitDate.setDate(visitDate.getDate() + 14);
          else if (freq === 'monthly') visitDate.setMonth(visitDate.getMonth() + 1);
          else if (freq === 'quarterly') visitDate.setMonth(visitDate.getMonth() + 3);
        }

        visitsToCreate.push({
          bookingId: booking._id,
          visitNumber: i + 1,
          title: `${booking.serviceName} - Scheduled Service #${i + 1}`,
          scheduledDate: visitDate,
          status: 'pending'
        });

        lastDate = visitDate;
      }
    }

    // Insert visits to DB
    const createdVisits = await BookingVisit.insertMany(visitsToCreate);
    const visitIds = createdVisits.map(v => v._id);

    // Update booking with visit references
    booking.visits = visitIds;
    await booking.save();
    
    console.log(`[WorkflowScheduler] Scheduled ${createdVisits.length} visits for booking ${booking.bookingNumber}`);
    return createdVisits;
  } catch (error) {
    console.error('[WorkflowScheduler] Error scheduling visits:', error);
    throw error;
  }
};

module.exports = {
  scheduleVisitsForBooking
};
