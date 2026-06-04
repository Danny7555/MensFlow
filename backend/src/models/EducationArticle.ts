import { Schema, model, Document } from 'mongoose';

export interface EducationArticleDocument extends Document {
  title: string;
  description: string;
  category: 'Hormones' | 'Phases' | 'Care';
  readTime: string;
  iconName: string;
  image?: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

const EducationArticleSchema = new Schema<EducationArticleDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Hormones', 'Phases', 'Care'], required: true },
    readTime: { type: String, required: true, trim: true },
    iconName: { type: String, required: true, trim: true },
    image: { type: String, default: null },
    url: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const EducationArticle = model<EducationArticleDocument>('EducationArticle', EducationArticleSchema);
