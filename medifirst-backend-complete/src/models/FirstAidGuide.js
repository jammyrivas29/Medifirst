const mongoose = require('mongoose');

const firstAidGuideSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['cpr','choking','burns','bleeding','fractures','seizures','heatstroke','poisoning','allergic-reaction','general'], lowercase: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  steps: [{
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: String,
    warning: String
  }],
  warnings: [String],
  whenToCallEmergency: [String],
  imageUrl: String,
  videoUrl: String,
  isOfflineAvailable: { type: Boolean, default: true },
  tags: [String],
  viewCount: { type: Number, default: 0 }
}, { timestamps: true });

firstAidGuideSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('FirstAidGuide', firstAidGuideSchema);
