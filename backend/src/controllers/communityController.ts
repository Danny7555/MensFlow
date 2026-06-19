import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces';
import { CommunityPost, CommunityComment } from '../models/Community';
import { User } from '../models/User';
import { Settings } from '../models/Settings';
import { objectRecord, requiredString, optionalString } from '../utils/validation';
import { Types } from 'mongoose';

const AI_USER_ID = new Types.ObjectId('000000000000000000000001');

export async function listPosts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (category && category !== 'all') filter.category = category;

    const [posts, total] = await Promise.all([
      CommunityPost.find(filter)
        .sort({ pinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CommunityPost.countDocuments(filter),
    ]);

    const userIds = [...new Set(posts.map(p => String(p.userId)))];
    const users = await User.find({ _id: { $in: userIds } }).select('name avatar role').lean();
    const userMap = new Map(users.map(u => [String(u._id), u]));

    const result = posts.map(p => {
      const u = userMap.get(String(p.userId));
      return {
        _id: p._id,
        userId: String(p.userId),
        title: p.title,
        body: p.body,
        category: p.category,
        tags: p.tags,
        isAnonymous: p.isAnonymous,
        location: p.location || undefined,
        aiReplied: p.aiReplied,
        pinned: p.pinned,
        commentCount: p.commentCount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        author: p.isAnonymous
          ? { name: 'Anonymous', role: 'lady' }
          : { name: u?.name || 'Unknown', avatar: u?.avatar, role: u?.role || 'lady' },
      };
    });

    res.json({ posts: result, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function searchUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q || q.length < 1) {
      res.json({ users: [] });
      return;
    }

    const users = await User.find({
      name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
      _id: { $ne: req.user!.id },
    })
      .select('name role')
      .limit(8)
      .lean();

    res.json({
      users: users.map(u => ({
        id: String(u._id),
        name: u.name || 'Unknown',
        role: u.role || 'lady',
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = requiredString(req.params.postId, 'postId');
    const post = await CommunityPost.findById(postId).lean();
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const u = await User.findById(post.userId).select('name avatar role').lean();

    const comments = await CommunityComment.find({ postId }).sort({ createdAt: 1 }).lean();
    const commentUserIds = [...new Set(comments.map(c => String(c.userId)))];
    const commentUsers = await User.find({ _id: { $in: commentUserIds } }).select('name avatar role').lean();
    const commentUserMap = new Map(commentUsers.map(u => [String(u._id), u]));

    res.json({
      post: {
        ...post,
        author: post.isAnonymous
          ? { name: 'Anonymous', role: 'lady' }
          : { name: u?.name || 'Unknown', avatar: u?.avatar, role: u?.role || 'lady' },
      },
      comments: comments.map(c => {
        const cu = commentUserMap.get(String(c.userId));
        const isAIComment = String(c.userId) === String(AI_USER_ID);
        return {
          _id: c._id,
          postId: c.postId,
          body: c.body,
          isAnonymous: c.isAnonymous,
          isAI: isAIComment,
          createdAt: c.createdAt,
          author: isAIComment
            ? { name: 'MensFlow AI', role: 'assistant' }
            : c.isAnonymous
              ? { name: 'Anonymous', role: 'lady' }
              : { name: cu?.name || 'Unknown', avatar: cu?.avatar, role: cu?.role || 'lady' },
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const title = requiredString(body.title, 'title', { min: 3, max: 200 });
    const postBody = requiredString(body.body, 'body', { min: 10, max: 10000 });
    const category = requiredString(body.category, 'category');
    const isAnonymous = body.isAnonymous !== false;
    const tags: string[] = Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === 'string').slice(0, 5) : [];
    const location = typeof body.location === 'string' && body.location.trim().length > 0 ? body.location.trim().slice(0, 100) : undefined;

    const validCategories = ['general', 'cycles', 'symptoms', 'relationships', 'wellness', 'ask'];
    if (!validCategories.includes(category)) {
      res.status(400).json({ error: `Category must be one of: ${validCategories.join(', ')}` });
      return;
    }

    const post = await CommunityPost.create({
      userId: req.user!.id,
      title,
      body: postBody,
      category,
      tags,
      isAnonymous,
      ...(location ? { location } : {}),
    });

    const u = await User.findById(req.user!.id).select('name role').lean();

    // If post mentions @mensflow, fire off an AI reply (non-blocking)
    const mentionsAI = (title + ' ' + postBody).toLowerCase().includes('@mensflow');
    if (mentionsAI) {
      generateAICommunityReply(post._id.toString(), title, postBody).catch((err: unknown) =>
        console.error('[Community AI] Failed to generate reply:', err)
      );
    }

    res.status(201).json({
      ...post.toObject(),
      author: isAnonymous
        ? { name: 'Anonymous', role: 'lady' }
        : { name: u?.name || 'Unknown', role: u?.role || 'lady' },
    });
  } catch (err) {
    next(err);
  }
}

async function generateAICommunityReply(postId: string, title: string, body: string, commentContext?: string): Promise<void> {
  import('../utils/groqClient').then(async ({ callGroq }) => {
    const prompt = commentContext
      ? `You are MensFlow AI, a helpful menstrual health assistant. A community member has asked you a question in the comments of a post.

Post title: "${title}"
Post body: "${body}"
Comment: "${commentContext}"

Write a warm, informative reply (max 150 words) that addresses their question. Be supportive and evidence-informed. Do not ask follow-up questions.`
      : `You are MensFlow AI, a helpful menstrual health assistant responding to a community post.

Post title: "${title}"
Post body: "${body}"

Write a warm, informative reply (max 150 words) that addresses the post. Be supportive and evidence-informed. Do not ask follow-up questions — just provide the helpful response.`;

    const result = await callGroq({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 300,
    });

    if (!result.success || !result.content) return;

    await CommunityComment.create({
      postId: new Types.ObjectId(postId),
      userId: AI_USER_ID,
      body: result.content,
      isAnonymous: false,
    });

    await CommunityPost.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
      $set: { aiReplied: true },
    });
  });
}

export async function addComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = requiredString(req.params.postId, 'postId');
    const body = objectRecord(req.body);
    const commentBody = requiredString(body.body, 'body', { min: 1, max: 5000 });
    const isAnonymous = body.isAnonymous !== false;

    const post = await CommunityPost.findById(postId).lean();
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const comment = await CommunityComment.create({
      postId,
      userId: req.user!.id,
      body: commentBody,
      isAnonymous,
    });

    await CommunityPost.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    // If comment mentions @mensflow, fire off an AI reply (non-blocking)
    if (commentBody.toLowerCase().includes('@mensflow')) {
      generateAICommunityReply(post._id.toString(), post.title, post.body, commentBody).catch((err: unknown) =>
        console.error('[Community AI] Failed to generate reply from comment:', err)
      );
    }

    // Detect @username mentions and notify (non-blocking)
    const mentionMatch = commentBody.match(/@(\w+)/g);
    if (mentionMatch) {
      for (const mention of mentionMatch) {
        const name = mention.slice(1); // remove @
        if (name.toLowerCase() === 'mensflow') continue; // already handled above
        const mentionedUser = await User.findOne({ name: new RegExp(`^${name}$`, 'i') }).lean();
        if (mentionedUser && String(mentionedUser._id) !== req.user!.id) {
          const commenter = await User.findById(req.user!.id).select('name').lean();
          if (commenter) {
            notifyMention(mentionedUser, commenter, post, commentBody).catch((err: unknown) =>
              console.error('[Community] Failed to send mention notification:', err)
            );
          }
        }
      }
    }

    const u = await User.findById(req.user!.id).select('name role').lean();

    res.status(201).json({
      ...comment.toObject(),
      author: isAnonymous
        ? { name: 'Anonymous', role: 'lady' }
        : { name: u?.name || 'Unknown', role: u?.role || 'lady' },
    });
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = requiredString(req.params.postId, 'postId');
    const post = await CommunityPost.findById(postId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    if (String(post.userId) !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    await CommunityComment.deleteMany({ postId });
    await CommunityPost.findByIdAndDelete(postId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function notifyMention(mentionedUser: Record<string, unknown>, commenter: Record<string, unknown>, post: Record<string, unknown>, commentBody: string): Promise<void> {
  const settings = await Settings.findOne({ userId: mentionedUser._id }).lean();
  if (!settings?.notificationsEmail) return;

  const commenterName = (commenter as any).name || 'Someone';
  const postTitle = (post as any).title || 'a post';
  const preview = commentBody.length > 100 ? commentBody.slice(0, 100) + '...' : commentBody;

  try {
    const { sendReminderEmail } = await import('../services/emailService');
    await sendReminderEmail({
      toEmail: (mentionedUser as any).email || '',
      toName: (mentionedUser as any).name || 'there',
      reminderTitle: `@${commenterName} mentioned you`,
      reminderMessage: `${commenterName} mentioned you in a comment on "${postTitle}":\n\n${preview}`,
    });
  } catch {
    // Email sending failed — silently ignore
  }
}
