import { Request, Response, NextFunction } from 'express';
import { EducationArticle } from '../models/EducationArticle';

export async function getArticles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const articles = await EducationArticle.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    next(err);
  }
}

export async function createArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, description, category, readTime, iconName, image, url } = req.body;
    if (!title || !description || !category || !readTime || !iconName || !url) {
      throw Object.assign(new Error('Missing required fields: title, description, category, readTime, iconName, url are all required.'), { status: 400 });
    }

    const article = new EducationArticle({
      title,
      description,
      category,
      readTime,
      iconName,
      image: image || null,
      url,
    });

    await article.save();
    res.status(201).json(article);
  } catch (err) {
    next(err);
  }
}

export async function updateArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { title, description, category, readTime, iconName, image, url } = req.body;

    const article = await EducationArticle.findById(id);
    if (!article) {
      throw Object.assign(new Error('Article not found'), { status: 404 });
    }

    if (title !== undefined) article.title = title;
    if (description !== undefined) article.description = description;
    if (category !== undefined) article.category = category;
    if (readTime !== undefined) article.readTime = readTime;
    if (iconName !== undefined) article.iconName = iconName;
    if (image !== undefined) article.image = image || undefined;
    if (url !== undefined) article.url = url;

    await article.save();
    res.json(article);
  } catch (err) {
    next(err);
  }
}

export async function deleteArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const article = await EducationArticle.findById(id);
    if (!article) {
      throw Object.assign(new Error('Article not found'), { status: 404 });
    }

    await article.deleteOne();
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (err) {
    next(err);
  }
}
