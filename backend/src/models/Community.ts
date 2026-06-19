import { Schema, model, Document, Types } from 'mongoose';

export interface CommunityPostDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  body: string;
  category: string;
  tags: string[];
  isAnonymous: boolean;
  location?: string;
  aiReplied: boolean;
  pinned: boolean;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityCommentDocument extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  body: string;
  isAnonymous: boolean;
  createdAt: Date;
}

const CommunityPostSchema = new Schema<CommunityPostDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 200 },
  body: { type: String, required: true, maxlength: 10000 },
  category: { type: String, required: true, enum: ['general', 'cycles', 'symptoms', 'relationships', 'wellness', 'ask'] },
  tags: [{ type: String, maxlength: 30 }],
  isAnonymous: { type: Boolean, default: true },
  location: { type: String, default: null },
  aiReplied: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
  commentCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CommunityPostSchema.index({ createdAt: -1 });
CommunityPostSchema.index({ category: 1, createdAt: -1 });
CommunityPostSchema.index({ pinned: -1, createdAt: -1 });

const CommunityCommentSchema = new Schema<CommunityCommentDocument>({
  postId: { type: Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, maxlength: 5000 },
  isAnonymous: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

CommunityCommentSchema.index({ postId: 1, createdAt: 1 });

export const CommunityPost = model<CommunityPostDocument>('CommunityPost', CommunityPostSchema);
export const CommunityComment = model<CommunityCommentDocument>('CommunityComment', CommunityCommentSchema);
