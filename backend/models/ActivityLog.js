import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['inventory', 'sale', 'debt', 'payment', 'user', 'system'],
    required: true
  }
}, {
  timestamps: true
});

// Static method to log activity
activityLogSchema.statics.log = async function(userId, action, details, category) {
  return await this.create({
    user: userId,
    action,
    details,
    category
  });
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
