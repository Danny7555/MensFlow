import { Schema, model, Document } from 'mongoose';

export interface DashboardDocument extends Document {
  userId: Schema.Types.ObjectId;
  lastPeriodStart: string;
  typicalCycleDays: number;
  phaseLabel: string;
  hormoneTrend: string;
  bodySignals: string;
  guidanceLines: string[];
  cycleNotes: string;
  cycleVariationDays: number;
  isAtypical: boolean;
  scientificInsight?: string;
  dailyTip?: {
    title: string;
    desc: string;
  };
  guidanceGeneratedDate?: string;
  wellnessTips?: Array<{
    id: string;
    category: string;
    title: string;
    summary: string;
    phaseTag: string;
  }>;
}

const DashboardSchema = new Schema<DashboardDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  lastPeriodStart: { type: String, default: '' },
  typicalCycleDays: { type: Number, default: 28, min: 15, max: 60 },
  phaseLabel: { type: String, default: 'Luteal', maxlength: 80 },
  hormoneTrend: { type: String, default: 'Progesterone rising', maxlength: 160 },
  bodySignals: { type: String, default: 'Fatigue, appetite changes', maxlength: 500 },
  guidanceLines: { type: [String], default: [] },
  cycleNotes: { type: String, default: '', maxlength: 2000 },
  cycleVariationDays: { type: Number, default: 36, min: 0, max: 120 },
  isAtypical: { type: Boolean, default: true },
  scientificInsight: { type: String, default: '' },
  dailyTip: {
    type: {
      title: { type: String, default: '' },
      desc: { type: String, default: '' }
    },
    default: { title: '', desc: '' }
  },
  guidanceGeneratedDate: { type: String, default: '' },
  wellnessTips: {
    type: [{
      id: { type: String, required: true },
      category: { type: String, required: true },
      title: { type: String, required: true },
      summary: { type: String, required: true },
      phaseTag: { type: String, required: true }
    }],
    default: []
  }
});

export const Dashboard = model<DashboardDocument>('Dashboard', DashboardSchema);
